<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
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

        // 3. Query Audit Logs terkait PPN, Invoice, dan PO
        $auditLogs = AuditLog::with('user:id,name')
            ->where(function ($q) {
                $q->where('auditable_type', 'like', '%Invoice%')
                  ->orWhere('auditable_type', 'like', '%PurchaseOrder%')
                  ->orWhere('auditable_type', 'like', '%Ppn%')
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
            'initialPpnKeluaran' => $ppnKeluaran,
            'initialPpnMasukan'  => $ppnMasukan,
            'auditLogs'          => $auditLogs,
        ]);
    }
}
