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
            $totalPaid = (float) $term->settlements()->sum('amount');
            $termAmount = (float) $term->amount;

            $newStatus = $totalPaid >= $termAmount
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
            }

            return $settlement;
        });
    }
}
