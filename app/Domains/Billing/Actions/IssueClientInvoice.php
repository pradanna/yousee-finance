<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IssueClientInvoice
{
    /**
     * Terbitkan Invoice draft milik Project (status draft -> issued),
     * generate invoice_number, dan naikkan status Project draft -> active
     * (domain-dictionary.md §2 — project auto-transition saat invoice terbit).
     */
    public function execute(Project $project): Invoice
    {
        return DB::transaction(function () use ($project) {
            $invoice = Invoice::where('project_id', $project->id)->first();

            if (! $invoice) {
                throw new \DomainException('Invoice belum disiapkan. Atur skema pembayaran terlebih dahulu.');
            }
            if ($invoice->status !== InvoiceStatus::DRAFT) {
                throw new \DomainException('Invoice sudah diterbitkan.');
            }
            if (is_null($invoice->paymentPlan)) {
                throw new \DomainException('Skema pembayaran belum diatur.');
            }

            $invoice->update([
                'invoice_number' => $this->generateInvoiceNumber($project->fiscal_mode),
                'status' => InvoiceStatus::ISSUED,
            ]);

            if ($project->status === ProjectStatus::DRAFT) {
                $project->update(['status' => ProjectStatus::ACTIVE]);
            }

            // Otomatis bentuk Jurnal Akuntansi Penerbitan Invoice Client (accounting-journal-flow.md §3 Flow A)
            // (Dr) Piutang Dagang Client (`default_receivable`) = Total Tagihan
            // (Cr) Pendapatan Sewa Reklame (`default_sales_revenue`) = Nilai DPP / Subtotal
            // (Cr) PPN Keluaran (`default_vat_output`) = Nilai PPN (Jika Mode PPN)
            $receivableAccId = \App\Domains\Accounting\Models\AccountingSetting::getAccountId('default_receivable');
            $salesRevAccId = \App\Domains\Accounting\Models\AccountingSetting::getAccountId('default_sales_revenue');
            $vatOutputAccId = \App\Domains\Accounting\Models\AccountingSetting::getAccountId('default_vat_output');

            if ($receivableAccId && $salesRevAccId) {
                $subtotal = (float) $invoice->subtotal;
                $ppn = (float) $invoice->ppn;
                $total = (float) $invoice->total;

                $journalItems = [];

                // (Dr) Piutang Dagang Client
                $journalItems[] = [
                    'account_id' => $receivableAccId,
                    'debit'      => $total,
                    'credit'     => 0,
                    'project_id' => $project->id,
                    'memo'       => "Piutang Invoice {$invoice->invoice_number} - {$project->client?->name}",
                ];

                // (Cr) Pendapatan Sewa Reklame
                $journalItems[] = [
                    'account_id' => $salesRevAccId,
                    'debit'      => 0,
                    'credit'     => $subtotal,
                    'project_id' => $project->id,
                    'memo'       => "Pendapatan Proyek {$project->name} ({$invoice->invoice_number})",
                ];

                // (Cr) PPN Keluaran (hanya jika mode PPN)
                if ($ppn > 0 && $vatOutputAccId) {
                    $journalItems[] = [
                        'account_id' => $vatOutputAccId,
                        'debit'      => 0,
                        'credit'     => $ppn,
                        'project_id' => $project->id,
                        'memo'       => "PPN Keluaran Invoice {$invoice->invoice_number}",
                    ];
                }

                (new \App\Domains\Accounting\Actions\PostJournalEntry())->execute(
                    headerData: [
                        'fiscal_mode'      => $project->fiscal_mode,
                        'transaction_date' => $invoice->transaction_date?->format('Y-m-d') ?? now()->format('Y-m-d'),
                        'description'      => "Penerbitan Invoice {$invoice->invoice_number} ke {$project->client?->name} ({$project->name})",
                        'project_id'       => $project->id,
                    ],
                    items: $journalItems,
                    source: $invoice,
                );
            }

            // Catat ke Audit Log Invoice
            $clientName = $project->client?->name ?? 'Client';
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => Invoice::class,
                'auditable_id'   => $invoice->id,
                'event'          => 'created',
                'user_id'        => auth()->id(),
                'description'    => "Menerbitkan Invoice Tagihan [{$invoice->invoice_number}] kepada \"{$clientName}\" sebesar Rp " . number_format((float) $invoice->total, 0, ',', '.') . " untuk proyek [{$project->code}]",
                'properties'     => [
                    'invoice_number' => $invoice->invoice_number,
                    'client_name'    => $clientName,
                    'project_code'   => $project->code,
                    'subtotal'       => (float) $invoice->subtotal,
                    'ppn'            => (float) $invoice->ppn,
                    'total'          => (float) $invoice->total,
                ],
            ]);

            // Catat ke Audit Log Proyek
            \App\Domains\Shared\Models\AuditLog::create([
                'auditable_type' => Project::class,
                'auditable_id'   => $project->id,
                'event'          => 'invoice_issued',
                'user_id'        => auth()->id(),
                'description'    => "Penerbitan Invoice Client [{$invoice->invoice_number}] senilai Rp " . number_format((float) $invoice->total, 0, ',', '.'),
                'properties'     => [
                    'invoice_number' => $invoice->invoice_number,
                    'client_name'    => $clientName,
                    'total'          => (float) $invoice->total,
                ],
            ]);

            Log::info('Client invoice issued', [
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'project_id' => $project->id,
            ]);

            return $invoice->fresh();
        });
    }

    private function generateInvoiceNumber(FiscalMode|string $fiscalMode): string
    {
        $mode = $fiscalMode instanceof FiscalMode ? $fiscalMode : FiscalMode::from($fiscalMode);
        $tag = $mode === FiscalMode::PPN ? 'INV' : 'INV-NP';
        $now = now();

        $sequence = Invoice::whereNotNull('invoice_number')
            ->whereBetween('updated_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->lockForUpdate()
            ->count() + 1;

        $seq = str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);

        return "{$tag}-{$now->format('m')}/{$now->format('y')}/{$seq}";
    }
}
