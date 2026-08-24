<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\SettlePpnTax;
use App\Domains\Accounting\Models\TaxSettlement;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\StoreTaxSettlementRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PpnReportController extends Controller
{
    /**
     * Display the PPN & e-Faktur tax report page with real database transactions.
     */
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        // 1. Query PPN Keluaran from Invoices (Mode PPN)
        $invoiceQuery = Invoice::with(['client:id,name,npwp', 'project:id,code,name'])
            ->where('fiscal_mode', FiscalMode::PPN->value)
            ->where('ppn', '>', 0);

        $ppnKeluaran = $invoiceQuery
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $inv, int $idx) {
                // Generate format standar NSFP dari data invoice jika belum ada field khusus
                $yearSuffix = $inv->transaction_date ? $inv->transaction_date->format('y') : date('y');
                $seqNumber = str_pad((string) ($idx + 1), 8, '0', STR_PAD_LEFT);
                $syntheticNsfp = "010.000-{$yearSuffix}.{$seqNumber}";

                return [
                    'id'            => $inv->id,
                    'docNo'         => $inv->invoice_number ?: 'INV-' . substr($inv->id, 0, 8),
                    'nsfp'          => $syntheticNsfp,
                    'client'        => $inv->client?->name ?: 'Client Umum',
                    'npwp'          => $inv->client?->npwp ?: '00.000.000.0-000.000',
                    'projectName'   => $inv->project?->name ?: '-',
                    'projectCode'   => $inv->project?->code ?: '-',
                    'date'          => $inv->transaction_date ? $inv->transaction_date->format('Y-m-d') : '',
                    'dpp'           => (float) $inv->subtotal,
                    'ppn'           => (float) $inv->ppn,
                    'total'         => (float) $inv->total,
                    'efakturStatus' => $inv->status->value === 'paid' || $inv->status->value === 'issued' ? 'approved' : 'ready',
                ];
            });

        // 2. Query PPN Masukan from Purchase Orders (Mode PPN)
        $poQuery = PurchaseOrder::with(['vendor:id,name,npwp', 'project:id,code,name'])
            ->where('fiscal_mode', FiscalMode::PPN->value)
            ->where('ppn', '>', 0);

        $ppnMasukan = $poQuery
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (PurchaseOrder $po, int $idx) {
                $yearSuffix = $po->transaction_date ? $po->transaction_date->format('y') : date('y');
                $seqNumber = str_pad((string) ($idx + 1), 8, '0', STR_PAD_LEFT);
                $syntheticNsfp = "010.000-{$yearSuffix}.88" . substr($seqNumber, 2);

                return [
                    'id'               => $po->id,
                    'docNo'            => $po->po_number ?: 'PO-' . substr($po->id, 0, 8),
                    'nsfp'             => $syntheticNsfp,
                    'vendor'           => $po->vendor?->name ?: 'Vendor Rekanan',
                    'npwp'             => $po->vendor?->npwp ?: '00.000.000.0-000.000',
                    'projectName'      => $po->project?->name ?: '-',
                    'projectCode'      => $po->project?->code ?: '-',
                    'date'             => $po->transaction_date ? $po->transaction_date->format('Y-m-d') : '',
                    'dpp'              => (float) $po->subtotal,
                    'ppn'              => (float) $po->ppn,
                    'total'            => (float) $po->total,
                    'creditableStatus' => 'creditable',
                    'efakturStatus'    => $po->status->value === 'completed' || $po->status->value === 'approved' ? 'approved' : 'ready',
                ];
            });

        // 3. Query Tax Settlements (NTPN Kas Negara)
        $taxSettlements = TaxSettlement::where('fiscal_mode', FiscalMode::PPN->value)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get()
            ->map(fn (TaxSettlement $s) => [
                'id'               => $s->id,
                'month'            => $s->month,
                'year'             => $s->year,
                'taxPeriod'        => sprintf('Masa %02d-%d', $s->month, $s->year),
                'ppnKeluaranTotal' => (float) $s->ppn_keluaran_total,
                'ppnMasukanTotal'  => (float) $s->ppn_masukan_total,
                'netAmount'        => (float) $s->net_amount,
                'status'           => $s->status,
                'ntpn'             => $s->ntpn,
                'paidDate'         => $s->paid_date ? $s->paid_date->format('Y-m-d') : '',
                'bankName'         => $s->bank_name,
                'notes'            => $s->notes,
            ]);

        // 4. Query Closing Periods (Periode yang telah dikunci/ditutup oleh Pimpinan/Owner)
        $lockedPeriods = \App\Domains\Accounting\Models\ClosingPeriod::where('fiscal_mode', FiscalMode::PPN->value)
            ->where('is_closed', true)
            ->get(['month', 'year'])
            ->map(fn (\App\Domains\Accounting\Models\ClosingPeriod $cp) => [
                'month' => (int) $cp->month,
                'year'  => (int) $cp->year,
            ]);

        // 5. Query Audit Logs terkait PPN, Invoice, PO, dan NTPN
        $auditLogs = AuditLog::with('user:id,name')
            ->where(function ($q) {
                $q->where('auditable_type', 'like', '%Invoice%')
                  ->orWhere('auditable_type', 'like', '%PurchaseOrder%')
                  ->orWhere('auditable_type', 'like', '%Ppn%')
                  ->orWhere('auditable_type', 'like', '%TaxSettlement%')
                  ->orWhere('description', 'like', '%PPN%')
                  ->orWhere('description', 'like', '%Faktur%')
                  ->orWhere('description', 'like', '%NTPN%');
            })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'created_at'  => $log->created_at ? $log->created_at->toISOString() : '',
                'event'       => $log->event,
                'description' => $log->description,
                'user'        => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name] : null,
                'ip_address'  => $log->properties['ip'] ?? null,
            ]);

        return Inertia::render('PpnReport', [
            'initialPpnKeluaran'    => $ppnKeluaran,
            'initialPpnMasukan'     => $ppnMasukan,
            'initialTaxSettlements' => $taxSettlements,
            'lockedPeriods'         => $lockedPeriods,
            'auditLogs'             => $auditLogs,
        ]);
    }

    /**
     * Simpan / Perbarui data Penyetoran Kas Negara (NTPN) untuk masa pajak tertentu.
     */
    public function settle(StoreTaxSettlementRequest $request, SettlePpnTax $action): RedirectResponse
    {
        try {
            $settlement = $action->execute($request->validated());

            return redirect()->back()->with(
                'success',
                "Penyetoran Kas Negara Masa {$settlement->month}-{$settlement->year} (NTPN: {$settlement->ntpn}) melalui {$settlement->bank_name} berhasil dicatat & LUNAS."
            );
        } catch (\DomainException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
