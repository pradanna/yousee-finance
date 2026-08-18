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
     * Catat realisasi pembayaran termin Invoice client.
     */
    public function settle(
        \App\Http\Requests\Billing\StoreClientPaymentSettlementRequest $request,
        Project $project,
        \App\Domains\Billing\Models\PaymentTerm $paymentTerm,
        \App\Domains\Billing\Actions\SettleClientPaymentTerm $action,
    ): RedirectResponse {
        $action->execute($paymentTerm, $request->validated());

        return redirect()->back()->with('success', 'Pembayaran termin invoice berhasil dicatat.');
    }
}
