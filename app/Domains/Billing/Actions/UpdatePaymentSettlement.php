<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Models\AuditLog;
use Carbon\Carbon;
use DomainException;
use Illuminate\Support\Facades\DB;

class UpdatePaymentSettlement
{
    /**
     * Memperbarui transaksi pembayaran settlement dengan sinkronisasi jurnal buku besar.
     *
     * @param array{
     *     amount: float|int,
     *     paid_at: string,
     *     payment_method: string,
     *     account_id?: string|null,
     *     payment_ref?: string|null,
     *     notes?: string|null,
     *     reason?: string|null,
     * } $data
     */
    public function execute(PaymentSettlement $settlement, array $data): PaymentSettlement
    {
        $term = $settlement->paymentTerm;
        if (! $term) {
            throw new DomainException('Termin pembayaran tidak ditemukan.');
        }

        $plan = $term->paymentPlan;
        $payable = $plan?->payable;
        $fiscalMode = $payable?->fiscal_mode;

        // 1. Validasi Closing Period Lock (tanggal lama dan tanggal baru)
        if ($fiscalMode) {
            $oldDate = Carbon::parse($settlement->paid_at);
            $newDate = Carbon::parse($data['paid_at']);

            if (ClosingPeriod::isClosed($oldDate->month, $oldDate->year, $fiscalMode)) {
                throw new DomainException("Pembayaran tidak dapat diubah karena periode {$oldDate->month}-{$oldDate->year} ({$fiscalMode->value}) telah ditutup/dikunci.");
            }

            if (ClosingPeriod::isClosed($newDate->month, $newDate->year, $fiscalMode)) {
                throw new DomainException("Tanggal pembayaran baru berada pada periode {$newDate->month}-{$newDate->year} ({$fiscalMode->value}) yang telah ditutup/dikunci.");
            }
        }

        return DB::transaction(function () use ($settlement, $term, $payable, $data): PaymentSettlement {
            $oldValues = [
                'amount'         => (float) $settlement->amount,
                'paid_at'        => $settlement->paid_at ? $settlement->paid_at->format('Y-m-d') : null,
                'payment_method' => $settlement->payment_method,
                'payment_ref'    => $settlement->payment_ref,
                'notes'          => $settlement->notes,
            ];

            $newAmount = (float) $data['amount'];
            $newPaidAt = $data['paid_at'];

            // 2. Update record PaymentSettlement
            $settlement->update([
                'amount'         => $newAmount,
                'paid_at'        => $newPaidAt,
                'payment_method' => $data['payment_method'],
                'payment_ref'    => $data['payment_ref'] ?? null,
                'notes'          => $data['notes'] ?? null,
            ]);

            // 3. Sinkronisasi Jurnal Akuntansi (Double-entry Ledger)
            $journal = $settlement->journalEntry;
            if ($journal) {
                JournalEntry::$allowSystemMutation = true;
                try {
                    $journal->transaction_date = $newPaidAt;
                    $journal->save();

                    // Ambil item jurnal terkait
                    $items = $journal->items()->get();

                    if ($payable instanceof PurchaseOrder) {
                        // PO Settlement:
                        // Item Debit: Hutang Dagang (default_payable)
                        // Item Credit: Kas / Bank (account_id)
                        foreach ($items as $item) {
                            if ((float) $item->debit > 0) {
                                // Sisi Hutang Dagang
                                $item->debit = $newAmount;
                                $item->save();
                            } elseif ((float) $item->credit > 0) {
                                // Sisi Kas/Bank
                                $item->credit = $newAmount;
                                if (! empty($data['account_id'])) {
                                    $item->account_id = $data['account_id'];
                                }
                                $item->save();
                            }
                        }
                    } elseif ($payable instanceof Invoice) {
                        // Invoice Settlement:
                        // Item Debit: Kas / Bank (account_id)
                        // Item Credit: Piutang Dagang (default_receivable)
                        foreach ($items as $item) {
                            if ((float) $item->debit > 0) {
                                // Sisi Kas/Bank
                                $item->debit = $newAmount;
                                if (! empty($data['account_id'])) {
                                    $item->account_id = $data['account_id'];
                                }
                                $item->save();
                            } elseif ((float) $item->credit > 0) {
                                // Sisi Piutang Dagang
                                $item->credit = $newAmount;
                                $item->save();
                            }
                        }
                    } else {
                        // Fallback perbarui seimbang
                        foreach ($items as $item) {
                            if ((float) $item->debit > 0) {
                                $item->debit = $newAmount;
                            }
                            if ((float) $item->credit > 0) {
                                $item->credit = $newAmount;
                            }
                            $item->save();
                        }
                    }

                    $journal->validateBalance();
                } finally {
                    JournalEntry::$allowSystemMutation = false;
                }
            }

            // 4. Hitung ulang status PaymentTerm
            $totalPaidForTerm = (float) $term->settlements()->sum('amount');
            $termAmount = (float) $term->amount;

            $newTermStatus = $totalPaidForTerm >= ($termAmount - 1.0)
                ? PaymentTermStatus::PAID
                : PaymentTermStatus::UNPAID;

            $term->update(['status' => $newTermStatus]);

            // 5. Hitung ulang status Dokumen Induk (Invoice atau PO)
            if ($payable instanceof Invoice) {
                $plan = $term->paymentPlan;
                $allTermsPaid = $plan ? $plan->terms()->where('status', '!=', PaymentTermStatus::PAID->value)->doesntExist() : false;

                Invoice::$allowSystemMutation = true;
                try {
                    if ($allTermsPaid && $payable->status !== InvoiceStatus::PAID) {
                        $payable->update(['status' => InvoiceStatus::PAID]);
                    } elseif (! $allTermsPaid && $payable->status === InvoiceStatus::PAID) {
                        $payable->update(['status' => InvoiceStatus::ISSUED]);
                    }
                } finally {
                    Invoice::$allowSystemMutation = false;
                }
            } elseif ($payable instanceof PurchaseOrder) {
                $plan = $term->paymentPlan;
                $allTermsPaid = $plan ? $plan->terms()->where('status', '!=', PaymentTermStatus::PAID->value)->doesntExist() : false;

                if ($allTermsPaid && $payable->status !== PurchaseOrderStatus::PAID) {
                    $payable->update(['status' => PurchaseOrderStatus::PAID]);
                } elseif (! $allTermsPaid && $payable->status === PurchaseOrderStatus::PAID) {
                    $payable->update(['status' => PurchaseOrderStatus::ISSUED]);
                }
            }

            // 6. Catat Audit Log
            $desc = "Pembaruan pembayaran {$term->label} dari Rp " . number_format($oldValues['amount'], 0, ',', '.') .
                    " menjadi Rp " . number_format($newAmount, 0, ',', '.');
            if (! empty($data['reason'])) {
                $desc .= ". Alasan: " . $data['reason'];
            }

            AuditLog::create([
                'auditable_type' => PaymentSettlement::class,
                'auditable_id'   => $settlement->id,
                'event'          => 'payment_settlement_updated',
                'user_id'        => auth()->id(),
                'description'    => $desc,
                'properties'     => [
                    'term_id'    => $term->id,
                    'term_label' => $term->label,
                    'old'        => $oldValues,
                    'new'        => [
                        'amount'         => $newAmount,
                        'paid_at'        => $newPaidAt,
                        'payment_method' => $data['payment_method'],
                        'account_id'     => $data['account_id'] ?? null,
                        'payment_ref'    => $data['payment_ref'] ?? null,
                    ],
                ],
            ]);

            if ($payable) {
                AuditLog::create([
                    'auditable_type' => get_class($payable),
                    'auditable_id'   => $payable->id,
                    'event'          => 'payment_settlement_updated',
                    'user_id'        => auth()->id(),
                    'description'    => $desc,
                    'properties'     => [
                        'settlement_id' => $settlement->id,
                        'term_label'    => $term->label,
                        'new_amount'    => $newAmount,
                    ],
                ]);
            }

            return $settlement->fresh(['paymentTerm']);
        });
    }
}
