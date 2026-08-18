<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Billing\Models\PaymentTerm;
use Illuminate\Support\Facades\DB;

class SettleClientPaymentTerm
{
    /**
     * Catat realisasi penerimaan pembayaran untuk satu termin Invoice client.
     *
     * Setelah settlement disimpan:
     * - Status termin diperbarui (PAID jika total settlement >= nominal termin).
     * - Status Invoice diperbarui menjadi PAID jika seluruh termin sudah lunas.
     * - Jurnal Akuntansi otomatis dibentuk:
     *   (Dr) Kas / Bank yang dipilih (`account_id`)
     *   (Cr) Piutang Dagang Client (`default_receivable`)
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

            // Hitung total yang sudah dibayar untuk termin ini
            $totalPaid = (float) $term->settlements()->sum('amount');
            $termAmount = (float) $term->amount;

            $newStatus = $totalPaid >= $termAmount
                ? PaymentTermStatus::PAID
                : PaymentTermStatus::UNPAID;

            $term->update(['status' => $newStatus]);

            $plan = $term->paymentPlan;
            $invoice = $plan?->payable;

            if ($invoice instanceof Invoice) {
                // Cek apakah seluruh termin pada payment plan sudah lunas
                $allTermsPaid = $plan->terms()->where('status', '!=', PaymentTermStatus::PAID)->doesntExist();
                if ($allTermsPaid && $invoice->status === InvoiceStatus::ISSUED) {
                    $invoice->update(['status' => InvoiceStatus::PAID]);
                }

                // Otomatis bentuk Jurnal Akuntansi Penerimaan Piutang Client (accounting-journal-flow.md §3 Flow A2)
                // (Dr) Kas / Bank (`account_id`)
                // (Cr) Piutang Dagang Client (`default_receivable`)
                $receivableAccountId = AccountingSetting::getAccountId('default_receivable');
                $cashBankAccountId = $data['account_id'] ?? (
                    strtolower($data['payment_method']) === 'cash' || strtolower($data['payment_method']) === 'tunai'
                        ? AccountingSetting::getAccountId('default_cash')
                        : AccountingSetting::getAccountId('default_bank')
                );

                if ($receivableAccountId && $cashBankAccountId) {
                    $amount = (float) $data['amount'];
                    $clientName = $invoice->client?->name ?? 'Client';

                    (new PostJournalEntry())->execute(
                        headerData: [
                            'fiscal_mode'      => $invoice->fiscal_mode,
                            'transaction_date' => $data['paid_at'],
                            'description'      => "Penerimaan Pembayaran Invoice {$invoice->invoice_number} - {$term->label} ({$clientName})",
                            'project_id'       => $invoice->project_id,
                        ],
                        items: [
                            [
                                'account_id' => $cashBankAccountId,
                                'debit'      => $amount,
                                'credit'     => 0,
                                'project_id' => $invoice->project_id,
                                'memo'       => "Penerimaan Kas/Bank Pembayaran Invoice {$invoice->invoice_number} - {$term->label}",
                            ],
                            [
                                'account_id' => $receivableAccountId,
                                'debit'      => 0,
                                'credit'     => $amount,
                                'project_id' => $invoice->project_id,
                                'memo'       => "Pelunasan Piutang Client {$invoice->invoice_number} - {$term->label}",
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
