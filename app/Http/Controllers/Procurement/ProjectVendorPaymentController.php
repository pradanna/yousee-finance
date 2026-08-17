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

        $action->execute($paymentTerm, $request->validated());

        return redirect()->back()->with('success', 'Pembayaran vendor berhasil dicatat.');
    }
}
