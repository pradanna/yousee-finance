<?php

declare(strict_types=1);

namespace App\Domains\Billing\Actions;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
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

class DeletePaymentSettlement
{
    /**
     * Menghapus transaksi pembayaran settlement beserta sinkronisasi jurnal buku besar.
     */
    public function execute(PaymentSettlement $settlement, ?string $reason = null): void
    {
        $term = $settlement->paymentTerm;
        if (! $term) {
            throw new DomainException('Termin pembayaran tidak ditemukan.');
        }

        $plan = $term->paymentPlan;
        $payable = $plan?->payable;
        $fiscalMode = $payable?->fiscal_mode;

        // 1. Validasi Closing Period Lock
        if ($fiscalMode) {
            $paidDate = Carbon::parse($settlement->paid_at);
            if (ClosingPeriod::isClosed($paidDate->month, $paidDate->year, $fiscalMode)) {
                throw new DomainException("Pembayaran tidak dapat dihapus karena periode {$paidDate->month}-{$paidDate->year} ({$fiscalMode->value}) telah ditutup/dikunci.");
            }
        }

        DB::transaction(function () use ($settlement, $term, $payable, $reason): void {
            $settlementData = [
                'id'             => $settlement->id,
                'amount'         => (float) $settlement->amount,
                'paid_at'        => $settlement->paid_at ? $settlement->paid_at->format('Y-m-d') : null,
                'payment_method' => $settlement->payment_method,
                'payment_ref'    => $settlement->payment_ref,
            ];

            // 2. Hapus Jurnal Akuntansi Terkait
            $journal = $settlement->journalEntry;
            if ($journal) {
                JournalEntry::$allowSystemMutation = true;
                try {
                    $journal->items()->delete();
                    $journal->delete();
                } finally {
                    JournalEntry::$allowSystemMutation = false;
                }
            }

            // 3. Hapus Record Settlement
            $settlement->delete();

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
            $desc = "Penghapusan pembayaran {$term->label} sebesar Rp " . number_format($settlementData['amount'], 0, ',', '.');
            if (! empty($reason)) {
                $desc .= ". Alasan: " . $reason;
            }

            if ($payable) {
                AuditLog::create([
                    'auditable_type' => get_class($payable),
                    'auditable_id'   => $payable->id,
                    'event'          => 'payment_settlement_deleted',
                    'user_id'        => auth()->id(),
                    'description'    => $desc,
                    'properties'     => [
                        'deleted_settlement' => $settlementData,
                        'term_label'         => $term->label,
                        'reason'             => $reason,
                    ],
                ]);
            }
        });
    }
}
