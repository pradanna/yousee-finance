<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Actions\CreateClientInvoice;
use App\Domains\Billing\Actions\GeneratePaymentTerms;
use App\Domains\Billing\Actions\IssueClientInvoice;
use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Project\Models\Project;
use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StorePaymentPlanRequest;
use Illuminate\Http\RedirectResponse;

class ProjectInvoiceController extends Controller
{
    /**
     * Simpan (atau ubah) skema pembayaran client untuk proyek ini.
     * Bikin draft Invoice + item kalau belum ada, lalu generate termin.
     */
    public function storePaymentPlan(
        StorePaymentPlanRequest $request,
        Project $project,
        CreateClientInvoice $createInvoice,
        GeneratePaymentTerms $generateTerms,
    ): RedirectResponse {
        $invoice = $createInvoice->execute($project);

        $generateTerms->execute(
            $invoice,
            PaymentScheme::from($request->validated('scheme')),
            $request->validated('percents'),
            $request->validated('due_dates'),
            $request->validated('notes'),
        );

        return redirect()->back()->with('success', 'Skema pembayaran berhasil disimpan.');
    }

    /**
     * Terbitkan Invoice resmi (draft -> issued).
     */
    public function issue(Project $project, IssueClientInvoice $action): RedirectResponse
    {
        $action->execute($project);

        return redirect()->back()->with('success', 'Invoice berhasil diterbitkan.');
    }

    /**
     * Catat penerimaan pembayaran untuk satu termin Invoice Client.
     */
    public function settlePaymentTerm(
        \App\Http\Requests\Procurement\StoreVendorPaymentSettlementRequest $request,
        Project $project,
        \App\Domains\Billing\Models\PaymentTerm $paymentTerm,
        \App\Domains\Billing\Actions\SettleClientPaymentTerm $action,
    ): RedirectResponse {
        $invoice = $project->invoices()->first();
        if (! $invoice) {
            abort(404, 'Invoice untuk proyek ini belum dibuat.');
        }

        $plan = $invoice->paymentPlan;
        if (! $plan || $paymentTerm->payment_plan_id !== $plan->id) {
            abort(403, 'Termin pembayaran tidak sesuai dengan invoice proyek ini.');
        }

        // Validasi toleransi agar tidak melebihi sisa tagihan termin
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

        return redirect()->back()->with('success', 'Pembayaran client berhasil dicatat.');
    }
}
