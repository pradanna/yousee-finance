<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Actions;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Billing\Actions\GeneratePaymentTerms;
use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Procurement\Models\PurchaseOrderItem;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssueVendorPurchaseOrder
{
    /**
     * Terbitkan 1 PO yang meng-cover satu atau beberapa titik lokasi dari
     * vendor yang sama (single-location dan bulk-per-vendor di FE keduanya
     * lewat method ini — bulk cuma ngirim lebih dari 1 location_id).
     *
     * @param list<string> $locationIds
     * @param array<string, mixed> $extraData
     */
    public function execute(Project $project, Vendor $vendor, array $locationIds, string $transactionDate, array $extraData = []): PurchaseOrder
    {
        return DB::transaction(function () use ($project, $vendor, $locationIds, $transactionDate, $extraData) {
            $locations = ProjectLocation::whereIn('id', $locationIds)
                ->lockForUpdate()
                ->get();

            if ($locations->count() !== count($locationIds)) {
                throw new \DomainException('Salah satu titik lokasi tidak ditemukan.');
            }

            foreach ($locations as $location) {
                if ($location->project_id !== $project->id) {
                    throw new \DomainException('Titik lokasi tidak termasuk dalam proyek ini.');
                }
                if ($location->vendor_id !== $vendor->id) {
                    throw new \DomainException('Titik lokasi tidak sesuai dengan vendor yang dipilih.');
                }
                if (! is_null($location->purchase_order_id)) {
                    throw new \DomainException('Titik lokasi sudah memiliki PO.');
                }
            }

            $po = PurchaseOrder::create([
                'po_number' => $this->generatePoNumber($project->fiscal_mode),
                'vendor_id' => $vendor->id,
                'project_id' => $project->id,
                'fiscal_mode' => $project->fiscal_mode,
                'transaction_date' => $transactionDate,
                'issued_at' => now(),
                'status' => PurchaseOrderStatus::ISSUED,
            ]);

            foreach ($locations as $location) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'project_location_id' => $location->id,
                    'name' => $location->description,
                    'quantity' => $location->qty,
                    'price' => $location->vendor_cost,
                ]);

                $updateData = ['purchase_order_id' => $po->id];
                if (! empty($extraData['lighting'])) {
                    $updateData['lighting'] = $extraData['lighting'];
                }
                if (array_key_exists('top_notes', $extraData)) {
                    $updateData['top_notes'] = $extraData['top_notes'];
                }

                $location->update($updateData);
            }

            $po->recalculateTotal();

            // Generate payment plan & terms jika data termin dikirim dari FE.
            // TODO: tambahkan closing period guard saat domain Accounting tersedia.
            if (! empty($extraData['term_percents']) && is_array($extraData['term_percents'])) {
                $scheme = PaymentScheme::from($extraData['term_scheme'] ?? 'full');
                $percents = array_map('floatval', $extraData['term_percents']);
                $dueDates = array_map('strval', $extraData['term_due_dates'] ?? [date('Y-m-d')]);

                // Pastikan jumlah due_dates sesuai percents, fallback ke hari ini.
                while (count($dueDates) < count($percents)) {
                    $dueDates[] = date('Y-m-d');
                }

                (new GeneratePaymentTerms())->execute(
                    $po->fresh(),
                    $scheme,
                    $percents,
                    $dueDates,
                    $extraData['top_notes'] ?? null,
                );
            }

            // 4. Otomatis bentuk Jurnal Akuntansi (domain-dictionary.md / accounting-journal-flow.md §3 Flow B)
            $expenseAccountId = AccountingSetting::getAccountId('default_project_expense');
            $payableAccountId = AccountingSetting::getAccountId('default_payable');
            $vatInputAccountId = AccountingSetting::getAccountId('default_vat_input');

            if ($expenseAccountId && $payableAccountId) {
                $subtotal = (float) $po->subtotal;
                $ppn = (float) $po->ppn;
                $total = (float) $po->total;

                $journalItems = [];

                // (Dr) Beban Project / HPP Billboard
                $journalItems[] = [
                    'account_id' => $expenseAccountId,
                    'debit'      => $subtotal,
                    'credit'     => 0,
                    'project_id' => $project->id,
                    'memo'       => "HPP Billboard PO {$po->po_number} - {$vendor->name}",
                ];

                // (Dr) PPN Masukan (Hanya jika mode PPN dan ada nominal PPN)
                if ($ppn > 0 && $vatInputAccountId) {
                    $journalItems[] = [
                        'account_id' => $vatInputAccountId,
                        'debit'      => $ppn,
                        'credit'     => 0,
                        'project_id' => $project->id,
                        'memo'       => "PPN Masukan PO {$po->po_number}",
                    ];
                }

                // (Cr) Hutang Dagang Vendor
                $journalItems[] = [
                    'account_id' => $payableAccountId,
                    'debit'      => 0,
                    'credit'     => $total,
                    'project_id' => $project->id,
                    'memo'       => "Hutang Vendor PO {$po->po_number} - {$vendor->name}",
                ];

                (new PostJournalEntry())->execute(
                    headerData: [
                        'fiscal_mode'      => $project->fiscal_mode,
                        'transaction_date' => $transactionDate,
                        'description'      => "Penerbitan PO {$po->po_number} untuk Vendor {$vendor->name} ({$project->name})",
                        'project_id'       => $project->id,
                    ],
                    items: $journalItems,
                    source: $po,
                );
            }

            // Catat ke Audit Log PO
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => PurchaseOrder::class,
                'auditable_id'   => $po->id,
                'event'          => 'created',
                'user_id'        => auth()->id(),
                'description'    => "Menerbitkan Purchase Order [{$po->po_number}] kepada Vendor \"{$vendor->name}\" sebesar Rp " . number_format((float) $po->total, 0, ',', '.') . " untuk proyek [{$project->code}]",
                'properties'     => [
                    'po_number'    => $po->po_number,
                    'vendor_name'  => $vendor->name,
                    'project_code' => $project->code,
                    'total'        => (float) $po->total,
                    'subtotal'     => (float) $po->subtotal,
                    'ppn'          => (float) $po->ppn,
                    'location_count' => count($locationIds),
                ],
            ]);

            // Catat juga ke Audit Log Proyek
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => Project::class,
                'auditable_id'   => $project->id,
                'event'          => 'po_issued',
                'user_id'        => auth()->id(),
                'description'    => "Penerbitan PO Vendor [{$po->po_number}] ({$vendor->name}) senilai Rp " . number_format((float) $po->total, 0, ',', '.') . " untuk " . count($locationIds) . " titik lokasi",
                'properties'     => [
                    'po_number'    => $po->po_number,
                    'vendor_name'  => $vendor->name,
                    'total'        => (float) $po->total,
                ],
            ]);

            Log::info('Vendor PO issued', [
                'purchase_order_id' => $po->id,
                'project_id' => $project->id,
                'vendor_id' => $vendor->id,
                'location_ids' => $locationIds,
            ]);

            return $po->fresh(['items', 'vendor']);
        });
    }

    private function generatePoNumber(FiscalMode|string $fiscalMode): string
    {
        $mode = $fiscalMode instanceof FiscalMode ? $fiscalMode : FiscalMode::from($fiscalMode);
        $tag = $mode === FiscalMode::PPN ? 'PTSSI-PO' : 'YS-PO';
        $now = now();

        $sequence = PurchaseOrder::whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->lockForUpdate()
            ->count() + 1;

        $seq = str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);

        return "{$seq}/{$tag}/{$now->format('m')}/{$now->format('y')}";
    }
}
