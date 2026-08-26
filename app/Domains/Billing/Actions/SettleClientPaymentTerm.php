<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Kwitansi;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Billing\Models\PaymentTerm;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SettleClientPaymentTerm
{
    /**
     * Catat penerimaan pembayaran untuk satu termin Invoice Client.
     *
     * Alur bisnis & akuntansi:
     * 1. Simpan PaymentSettlement untuk termin terkait.
     * 2. Perbarui status PaymentTerm (PAID jika lunas, UNPAID jika masih ada sisa).
     * 3. Jika seluruh termin dalam Invoice telah lunas, perbarui status Invoice menjadi PAID dan bentuk Kwitansi otomatis.
     * 4. Bentuk Jurnal Akuntansi Pelunasan Piutang:
     *    (Dr) Kas / Bank (`account_id`)
     *    (Cr) Piutang Dagang Client (`default_receivable`)
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

            // Hitung total realisasi pembayaran termin ini
            $totalPaidForTerm = (float) $term->settlements()->sum('amount');
            $termAmount = (float) $term->amount;

            $newTermStatus = $totalPaidForTerm >= ($termAmount - 1.0)
                ? PaymentTermStatus::PAID
                : PaymentTermStatus::UNPAID;

            $term->update(['status' => $newTermStatus]);

            $plan = $term->paymentPlan;
            $invoice = $plan?->payable;

            if ($invoice instanceof Invoice) {
                // Cek apakah seluruh termin pada invoice sudah lunas
                $allTermsPaid = $plan->terms()->where('status', '!=', PaymentTermStatus::PAID->value)->doesntExist();

                if ($allTermsPaid && $invoice->status !== InvoiceStatus::PAID) {
                    $invoice->update(['status' => InvoiceStatus::PAID]);
                }

                // Otomatis bentuk Jurnal Akuntansi Penerimaan Pembayaran Piutang Client (accounting-journal-flow.md §3 Flow A.2)
                // (Dr) Kas/Bank (`account_id`) = (Cr) Piutang Dagang (`default_receivable`)
                $receivableAccountId = AccountingSetting::getAccountId('default_receivable');
                $cashBankAccountId = $data['account_id'] ?? (
                    strtolower($data['payment_method']) === 'cash' || strtolower($data['payment_method']) === 'tunai'
                        ? AccountingSetting::getAccountId('default_cash')
                        : AccountingSetting::getAccountId('default_bank')
                );

                if ($receivableAccountId && $cashBankAccountId) {
                    $paidAmount = (float) $data['amount'];
                    $termExpectedAmount = (float) $term->amount;
                    $diff = $termExpectedAmount - $paidAmount;

                    $items = [
                        [
                            'account_id' => $cashBankAccountId,
                            'debit'      => $paidAmount,
                            'credit'     => 0,
                            'project_id' => $invoice->project_id,
                            'memo'       => "Penerimaan Kas/Bank untuk {$invNumber} - {$term->label}",
                        ],
                    ];

                    // Jika terdapat selisih pembulatan kecil (<= Rp 100), seimbangkan ke akun Beban/Pendapatan Pembulatan
                    if (abs($diff) > 0.001 && abs($diff) <= 100.0 && $newTermStatus === PaymentTermStatus::PAID) {
                        if ($diff > 0) {
                            // Kurang bayar receh -> Masuk Beban Selisih Pembulatan (5920)
                            $roundingExpenseAccount = ChartOfAccount::where('code', '5920')->first();
                            $roundingAccountId = $roundingExpenseAccount?->id ?? $receivableAccountId;
                            $items[] = [
                                'account_id' => $roundingAccountId,
                                'debit'      => round($diff, 2),
                                'credit'     => 0,
                                'project_id' => $invoice->project_id,
                                'memo'       => "Beban Selisih Pembulatan {$invNumber} - {$term->label}",
                            ];
                            $items[] = [
                                'account_id' => $receivableAccountId,
                                'debit'      => 0,
                                'credit'     => round($termExpectedAmount, 2),
                                'project_id' => $invoice->project_id,
                                'memo'       => "Pelunasan Penuh Piutang Client {$invNumber} - {$term->label}",
                            ];
                        } else {
                            // Lebih bayar receh -> Masuk Pendapatan Selisih Pembulatan (4910)
                            $roundingRevenueAccount = ChartOfAccount::where('code', '4910')->first();
                            $roundingAccountId = $roundingRevenueAccount?->id ?? $receivableAccountId;
                            $items[] = [
                                'account_id' => $receivableAccountId,
                                'debit'      => 0,
                                'credit'     => round($termExpectedAmount, 2),
                                'project_id' => $invoice->project_id,
                                'memo'       => "Pelunasan Piutang Client {$invNumber} - {$term->label}",
                            ];
                            $items[] = [
                                'account_id' => $roundingAccountId,
                                'debit'      => 0,
                                'credit'     => round(abs($diff), 2),
                                'project_id' => $invoice->project_id,
                                'memo'       => "Pendapatan Selisih Pembulatan {$invNumber} - {$term->label}",
                            ];
                        }
                    } else {
                        // Tanpa selisih
                        $items[] = [
                            'account_id' => $receivableAccountId,
                            'debit'      => 0,
                            'credit'     => $paidAmount,
                            'project_id' => $invoice->project_id,
                            'memo'       => "Pelunasan Piutang Client {$invNumber} - {$term->label}",
                        ];
                    }

                    $clientName = $invoice->client?->name ?? 'Client';
                    $invNumber = $invoice->invoice_number ?? 'Invoice';

                    (new PostJournalEntry())->execute(
                        headerData: [
                            'fiscal_mode'      => $invoice->fiscal_mode,
                            'transaction_date' => $data['paid_at'],
                            'description'      => "Penerimaan Pembayaran Piutang - {$clientName} ({$invNumber}) [{$term->label}]",
                            'project_id'       => $invoice->project_id,
                        ],
                        items: $items,
                        source: $settlement,
                    );
                }

                // Catat ke Audit Log Invoice
                $clientName = $invoice->client?->name ?? 'Client';
                $invNumber = $invoice->invoice_number ?? 'Invoice';
                \App\Domains\Shared\Models\AuditLog::create([
                    'auditable_type' => Invoice::class,
                    'auditable_id'   => $invoice->id,
                    'event'          => 'payment_settled',
                    'user_id'        => auth()->id(),
                    'description'    => "Penerimaan pembayaran {$term->label} sebesar Rp " . number_format((float) $data['amount'], 0, ',', '.') . " dari \"{$clientName}\" via {$data['payment_method']}",
                    'properties'     => [
                        'invoice_number' => $invNumber,
                        'client_name'    => $clientName,
                        'term_label'     => $term->label,
                        'amount'         => (float) $data['amount'],
                        'paid_at'        => $data['paid_at'],
                        'payment_method' => $data['payment_method'],
                        'payment_ref'    => $data['payment_ref'] ?? null,
                    ],
                ]);

                // Catat ke Audit Log Proyek
                if ($invoice->project_id) {
                    \App\Domains\Shared\Models\AuditLog::create([
                        'auditable_type' => \App\Domains\Project\Models\Project::class,
                        'auditable_id'   => $invoice->project_id,
                        'event'          => 'client_payment_settled',
                        'user_id'        => auth()->id(),
                        'description'    => "Penerimaan pembayaran [{$invNumber}] ({$clientName}) - {$term->label} sebesar Rp " . number_format((float) $data['amount'], 0, ',', '.'),
                        'properties'     => [
                            'invoice_number' => $invNumber,
                            'amount'         => (float) $data['amount'],
                            'paid_at'        => $data['paid_at'],
                        ],
                    ]);
                }
            }

            return $settlement;
        });
    }
}
