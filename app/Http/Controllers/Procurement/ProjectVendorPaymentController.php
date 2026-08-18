<?php

declare(strict_types=1);

namespace App\Http\Controllers\Procurement;

use App\Domains\Billing\Models\PaymentTerm;
use App\Domains\Procurement\Actions\SettleVendorPaymentTerm;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\StoreVendorPaymentSettlementRequest;
use Illuminate\Http\RedirectResponse;

class ProjectVendorPaymentController extends Controller
{
    /**
     * Catat realisasi pembayaran untuk satu termin PO vendor.
     *
     * Validasi chain: PO harus milik proyek, termin harus milik payment plan PO.
     */
    public function store(
        StoreVendorPaymentSettlementRequest $request,
        Project $project,
        PurchaseOrder $purchaseOrder,
        PaymentTerm $paymentTerm,
        SettleVendorPaymentTerm $action,
    ): RedirectResponse {
        // Pastikan PO milik proyek ini.
        if ($purchaseOrder->project_id !== $project->id) {
            abort(403, 'Purchase Order tidak termasuk dalam proyek ini.');
        }

        // Pastikan termin milik payment plan dari PO ini.
        $plan = $purchaseOrder->paymentPlan;
        if (! $plan || $paymentTerm->payment_plan_id !== $plan->id) {
            abort(403, 'Termin pembayaran tidak sesuai dengan PO ini.');
        }

        // Aturan Urutan Termin: Termin sebelumnya (sort_order lebih kecil) harus sudah lunas (PAID) terlebih dahulu
        $unpaidPriorTerm = $plan->terms()
            ->where('sort_order', '<', $paymentTerm->sort_order)
            ->where('status', '!=', \App\Domains\Billing\Enums\PaymentTermStatus::PAID)
            ->first();

        if ($unpaidPriorTerm) {
            return redirect()->back()->withErrors([
                'amount' => "Pembayaran harus urut mulai dari termin terkecil. Silakan lunasi {$unpaidPriorTerm->label} terlebih dahulu sebelum membayar {$paymentTerm->label}.",
            ]);
        }

        // Validasi agar nominal pembayaran tidak melebihi sisa tagihan termin
        $totalSettled = round((float) $paymentTerm->settlements()->sum('amount'), 2);
        $termAmount = round((float) $paymentTerm->amount, 2);
        $maxAllowed = round(max(0, $termAmount - $totalSettled), 2);
        $payingAmount = round((float) $request->validated('amount'), 2);

        if ($payingAmount > ($maxAllowed + 1.0)) {
            return redirect()->back()->withErrors([
                'amount' => 'Nominal pembayaran (Rp ' . number_format($payingAmount, 0, ',', '.') . ') melebihi sisa tagihan termin ini (Rp ' . number_format($maxAllowed, 0, ',', '.') . ').',
            ]);
        }

        $action->execute($paymentTerm, $request->validated());

        return redirect()->back()->with('success', 'Pembayaran vendor berhasil dicatat.');
    }
}
