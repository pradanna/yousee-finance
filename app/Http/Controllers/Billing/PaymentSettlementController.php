<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Actions\DeletePaymentSettlement;
use App\Domains\Billing\Actions\UpdatePaymentSettlement;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\UpdatePaymentSettlementRequest;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PaymentSettlementController extends Controller
{
    /**
     * Memperbarui data riwayat pembayaran termin (nominal, tanggal, akun kas/bank, catatan).
     */
    public function update(
        UpdatePaymentSettlementRequest $request,
        PaymentSettlement $paymentSettlement,
        UpdatePaymentSettlement $action,
    ): RedirectResponse {
        $term = $paymentSettlement->paymentTerm;
        if (! $term) {
            return redirect()->back()->withErrors(['amount' => 'Termin pembayaran tidak ditemukan.']);
        }

        // Validasi agar nominal baru tidak melebihi sisa plafon termin (dihitung di luar settlement ini)
        $termAmount = round((float) $term->amount, 2);
        $otherSettled = round((float) $term->settlements()->where('id', '!=', $paymentSettlement->id)->sum('amount'), 2);
        $maxAllowed = round(max(0, $termAmount - $otherSettled), 2);
        $newAmount = round((float) $request->validated('amount'), 2);

        if ($newAmount > ($maxAllowed + 1.0)) {
            return redirect()->back()->withErrors([
                'amount' => 'Nominal pembayaran (Rp ' . number_format($newAmount, 0, ',', '.') . ') melebihi batas termin ini (Rp ' . number_format($maxAllowed, 0, ',', '.') . ').',
            ]);
        }

        try {
            $action->execute($paymentSettlement, $request->validated());
        } catch (DomainException $e) {
            return redirect()->back()->withErrors(['amount' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Riwayat pembayaran berhasil diperbarui.');
    }

    /**
     * Menghapus record riwayat pembayaran termin dan membalikkan jurnal.
     */
    public function destroy(
        Request $request,
        PaymentSettlement $paymentSettlement,
        DeletePaymentSettlement $action,
    ): RedirectResponse {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $action->execute($paymentSettlement, $validated['reason'] ?? null);
        } catch (DomainException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Riwayat pembayaran berhasil dihapus.');
    }
}
