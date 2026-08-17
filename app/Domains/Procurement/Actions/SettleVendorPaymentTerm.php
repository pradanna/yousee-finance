<?php

declare(strict_types=1);

namespace App\Domains\Procurement\Actions;

use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Billing\Models\PaymentTerm;
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
     * TODO: Tambahkan closing period guard saat domain Accounting tersedia.
     *
     * @param array{
     *     amount: float|int,
     *     paid_at: string,
     *     payment_method: string,
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

            return $settlement;
        });
    }
}
