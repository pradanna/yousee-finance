<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\GetCashflowReportData;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class CashflowReportController extends Controller
{
    /**
     * Menampilkan halaman Laporan Arus Kas (Statement of Cash Flows) dengan data riil dari database.
     */
    public function index(Request $request, GetCashflowReportData $action): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode', 'all');

        $filters = [
            'month'        => $request->query('month', (string) now()->month),
            'year'         => $request->query('year', (string) now()->year),
            'start_date'   => $request->query('start_date'),
            'end_date'     => $request->query('end_date'),
            'account_id'   => $request->query('account_id'),
            'project_id'   => $request->query('project_id'),
            'fiscal_mode'  => $fiscalMode,
        ];

        $reportData = $action->execute($filters);

        // Ambil daftar periode yang terkunci (Closing Period)
        $lockedPeriods = ClosingPeriod::where('is_closed', true)
            ->get(['month', 'year', 'fiscal_mode', 'closed_at'])
            ->map(fn ($p) => [
                'month'       => $p->month,
                'year'        => $p->year,
                'fiscalMode'  => $p->fiscal_mode->value,
                'closedAt'    => $p->closed_at ? $p->closed_at->toIso8601String() : null,
            ]);

        // Ambil daftar project untuk filter
        $projects = Project::select('id', 'code', 'name')
            ->orderBy('code')
            ->get();

        // Ambil audit logs terkait transaksi kas & jurnal
        $auditLogs = AuditLog::with('user:id,name')
            ->whereIn('auditable_type', [
                \App\Domains\Accounting\Models\CashTransaction::class,
                \App\Domains\Accounting\Models\JournalEntry::class,
                ClosingPeriod::class,
            ])
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'event'       => $log->event,
                'description' => $log->description,
                'userName'    => $log->user?->name ?? 'Sistem',
                'createdAt'   => $log->created_at->format('d M Y H:i'),
            ]);

        return Inertia::render('CashflowReport', [
            'initialCashflowData' => $reportData,
            'lockedPeriods'       => $lockedPeriods,
            'projects'            => $projects,
            'auditLogs'           => $auditLogs,
            'currentFiscalMode'   => $fiscalMode,
        ]);
    }

    /**
     * Menghasilkan dokumen PDF resmi Laporan Arus Kas PSAK 2 dan Rekapitulasi Kas & Bank.
     */
    public function exportPdf(Request $request, GetCashflowReportData $action): HttpResponse
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->input('fiscal_mode', 'all');

        $filters = [
            'month'        => $request->input('month', (string) now()->month),
            'year'         => $request->input('year', (string) now()->year),
            'start_date'   => $request->input('start_date'),
            'end_date'     => $request->input('end_date'),
            'account_id'   => $request->input('account_id'),
            'project_id'   => $request->input('project_id'),
            'fiscal_mode'  => $fiscalMode,
        ];

        $data = $action->execute($filters);

        $pdf = Pdf::loadView('pdf.cashflow-report-pdf', [
            'data'         => $data,
            'companyName'  => 'PT. YouSee Indonesia',
            'printedAt'    => now()->translatedFormat('d F Y H:i'),
            'printedBy'    => $request->user()?->name ?? 'Finance Officer',
        ]);

        $pdf->setPaper('a4', 'portrait');

        $filename = sprintf('Laporan_Arus_Kas_%s_%s.pdf', $data['selectedMonth'], $data['selectedYear']);

        return $pdf->stream($filename);
    }
}
