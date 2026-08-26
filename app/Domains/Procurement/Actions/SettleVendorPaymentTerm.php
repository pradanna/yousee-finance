<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Actions;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Billing\Models\PaymentTerm;
use App\Domains\Procurement\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class SettleVendorPaymentTerm
{
    /**
     * Catat realisasi pembayaran untuk satu termin PO vendor.
     *
     * Setelah settlement disimpan, status termin akan diperbarui:
     * - PAID  → jika total settlement >= nominal termin
     * - UNPAID → jika masih kurang
     *
     * @param array{
     *     amount: float|int,
     *     paid_at: string,
     *     payment_method: string,
     *     account_id?: string|null,
     *     payment_ref?: string|null,
     *     notes?: string|null,
     * } $data
     */
    public function execute(PaymentTerm $term, array $data): PaymentSettlement
    {
        return DB::transaction(function () use ($term, $data): PaymentSettlement {
            $settlement = PaymentSettlement::create([
                'payment_term_id' => $term->id,
                'amount'          => $data['amount'],
                'paid_at'         => $data['paid_at'],
                'payment_method'  => $data['payment_method'],
                'payment_ref'     => $data['payment_ref'] ?? null,
                'notes'           => $data['notes'] ?? null,
            ]);

            // Hitung total yang sudah dibayar (termasuk settlement baru).
            // Diberikan toleransi Rp 1 untuk mengantisipasi selisih koma/desimal pembulatan sistem
            $totalPaid = (float) $term->settlements()->sum('amount');
            $termAmount = (float) $term->amount;

            $newStatus = $totalPaid >= ($termAmount - 1.0)
                ? PaymentTermStatus::PAID
                : PaymentTermStatus::UNPAID;

            $term->update(['status' => $newStatus]);

            // Otomatis bentuk Jurnal Akuntansi Pelunasan Hutang Vendor
            // (Dr) Hutang Dagang Vendor (`default_payable`) = (Cr) Kas / Bank (`account_id`)
            $plan = $term->paymentPlan;
            $po = $plan?->payable;

            if ($po instanceof PurchaseOrder) {
                $payableAccountId = AccountingSetting::getAccountId('default_payable');
                
                // Jika account_id tidak dikirim, fallback ke default_bank atau default_cash
                $cashBankAccountId = $data['account_id'] ?? (
                    strtolower($data['payment_method']) === 'cash' || strtolower($data['payment_method']) === 'tunai'
                        ? AccountingSetting::getAccountId('default_cash')
                        : AccountingSetting::getAccountId('default_bank')
                );

                if ($payableAccountId && $cashBankAccountId) {
                    $amount = (float) $data['amount'];
                    $vendorName = $po->vendor?->name ?? 'Vendor';

                    (new PostJournalEntry())->execute(
                        headerData: [
                            'fiscal_mode'      => $po->fiscal_mode,
                            'transaction_date' => $data['paid_at'],
                            'description'      => "Pelunasan Hutang PO {$po->po_number} - {$term->label} ({$vendorName})",
                            'project_id'       => $po->project_id,
                        ],
                        items: [
                            [
                                'account_id' => $payableAccountId,
                                'debit'      => $amount,
                                'credit'     => 0,
                                'project_id' => $po->project_id,
                                'memo'       => "Pelunasan Hutang Vendor {$po->po_number} - {$term->label}",
                            ],
                            [
                                'account_id' => $cashBankAccountId,
                                'debit'      => 0,
                                'credit'     => $amount,
                                'project_id' => $po->project_id,
                                'memo'       => "Pengeluaran Kas/Bank untuk PO {$po->po_number}",
                            ],
                        ],
                        source: $settlement,
                    );
                }

                // Catat ke Audit Log Purchase Order
                $vendorName = $po->vendor?->name ?? 'Vendor';
                \App\Domains\Shared\Models\AuditLog::create([
                    'auditable_type' => PurchaseOrder::class,
                    'auditable_id'   => $po->id,
                    'event'          => 'payment_settled',
                    'user_id'        => auth()->id(),
                    'description'    => "Pembayaran {$term->label} sebesar Rp " . number_format((float) $data['amount'], 0, ',', '.') . " ke Vendor \"{$vendorName}\" melalui {$data['payment_method']}",
                    'properties'     => [
                        'po_number'       => $po->po_number,
                        'vendor_name'     => $vendorName,
                        'term_label'      => $term->label,
                        'amount'          => (float) $data['amount'],
                        'paid_at'         => $data['paid_at'],
                        'payment_method'  => $data['payment_method'],
                        'payment_ref'     => $data['payment_ref'] ?? null,
                    ],
                ]);

                // Catat juga ke Audit Log Proyek
                if ($po->project_id) {
                    \App\Domains\Shared\Models\AuditLog::create([
                        'auditable_type' => \App\Domains\Project\Models\Project::class,
                        'auditable_id'   => $po->project_id,
                        'event'          => 'vendor_payment_settled',
                        'user_id'        => auth()->id(),
                        'description'    => "Pembayaran PO [{$po->po_number}] ({$vendorName}) - {$term->label} sebesar Rp " . number_format((float) $data['amount'], 0, ',', '.'),
                        'properties'     => [
                            'po_number'  => $po->po_number,
                            'amount'     => (float) $data['amount'],
                            'paid_at'    => $data['paid_at'],
                        ],
                    ]);
                }
            }

            return $settlement;
        });
    }
}
