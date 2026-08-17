<?php

declare(strict_types=1);

namespace App\Domains\Project\Actions;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GetDashboardOverviewData
{
    /**
     * Execute dashboard aggregation for the specified month and year.
     *
     * @return array<string, mixed>
     */
    public function execute(int $month, int $year): array
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = (clone $startDate)->endOfMonth();

        // 1. Metrics per Fiscal Mode
        $ppnInflow = (float) Invoice::where('fiscal_mode', FiscalMode::PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $ppnOutflow = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $ppnKeluaran = (float) Invoice::where('fiscal_mode', FiscalMode::PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('ppn');

        $ppnMasukan = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('ppn');

        $totalPpnTax = $ppnKeluaran + $ppnMasukan;
        $ppnKeluaranPercent = $totalPpnTax > 0 ? round(($ppnKeluaran / $totalPpnTax) * 100, 1) : 0.0;
        $ppnMasukanPercent = $totalPpnTax > 0 ? round(($ppnMasukan / $totalPpnTax) * 100, 1) : 0.0;
        $ppnTaxOrDebt = $ppnKeluaran - $ppnMasukan;

        // Non-PPN Metrics
        $nonPpnInflow = (float) Invoice::where('fiscal_mode', FiscalMode::NON_PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $nonPpnOutflow = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::NON_PPN->value)
            ->whereBetween('transaction_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereIn('status', ['issued', 'paid'])
            ->sum('total');

        $nonPpnTaxOrDebt = $nonPpnInflow - $nonPpnOutflow;

        // 2. 6-Month Cashflow Trend
        $chartDataPpn = [];
        $chartDataNonPpn = [];
        $monthNames = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
            9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
        ];

        // Gather max values to compute relative bar heights (max height ~150)
        $rawTrendPpn = [];
        $rawTrendNonPpn = [];
        $maxPpn = 1.0;
        $maxNonPpn = 1.0;

        for ($i = 5; $i >= 0; $i--) {
            $trendDate = (clone $startDate)->subMonths($i);
            $trendStart = (clone $trendDate)->startOfMonth()->toDateString();
            $trendEnd = (clone $trendDate)->endOfMonth()->toDateString();
            $label = $monthNames[$trendDate->month];

            $inflowPpn = (float) Invoice::where('fiscal_mode', FiscalMode::PPN->value)
                ->whereBetween('transaction_date', [$trendStart, $trendEnd])
                ->whereIn('status', ['issued', 'paid'])
                ->sum('total');
            $outflowPpn = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::PPN->value)
                ->whereBetween('transaction_date', [$trendStart, $trendEnd])
                ->whereIn('status', ['issued', 'paid'])
                ->sum('total');

            $rawTrendPpn[] = [
                'month' => $label,
                'inflow' => $inflowPpn,
                'outflow' => $outflowPpn,
            ];
            $maxPpn = max($maxPpn, $inflowPpn, $outflowPpn);

            $inflowNonPpn = (float) Invoice::where('fiscal_mode', FiscalMode::NON_PPN->value)
                ->whereBetween('transaction_date', [$trendStart, $trendEnd])
                ->whereIn('status', ['issued', 'paid'])
                ->sum('total');
            $outflowNonPpn = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::NON_PPN->value)
                ->whereBetween('transaction_date', [$trendStart, $trendEnd])
                ->whereIn('status', ['issued', 'paid'])
                ->sum('total');

            $rawTrendNonPpn[] = [
                'month' => $label,
                'inflow' => $inflowNonPpn,
                'outflow' => $outflowNonPpn,
            ];
            $maxNonPpn = max($maxNonPpn, $inflowNonPpn, $outflowNonPpn);
        }

        foreach ($rawTrendPpn as $t) {
            $hIn = $maxPpn > 0 ? (int) max(15, round(($t['inflow'] / $maxPpn) * 140)) : 15;
            $hOut = $maxPpn > 0 ? (int) max(15, round(($t['outflow'] / $maxPpn) * 140)) : 15;
            $chartDataPpn[] = [
                'month' => $t['month'],
                'inflow' => [
                    'val' => 'Rp ' . number_format($t['inflow'] / 1_000_000, 0, ',', '.') . 'jt',
                    'h' => $t['inflow'] > 0 ? $hIn : 10,
                ],
                'outflow' => [
                    'val' => 'Rp ' . number_format($t['outflow'] / 1_000_000, 0, ',', '.') . 'jt',
                    'h' => $t['outflow'] > 0 ? $hOut : 10,
                ],
            ];
        }

        foreach ($rawTrendNonPpn as $t) {
            $hIn = $maxNonPpn > 0 ? (int) max(15, round(($t['inflow'] / $maxNonPpn) * 140)) : 15;
            $hOut = $maxNonPpn > 0 ? (int) max(15, round(($t['outflow'] / $maxNonPpn) * 140)) : 15;
            $chartDataNonPpn[] = [
                'month' => $t['month'],
                'inflow' => [
                    'val' => 'Rp ' . number_format($t['inflow'] / 1_000_000, 0, ',', '.') . 'jt',
                    'h' => $t['inflow'] > 0 ? $hIn : 10,
                ],
                'outflow' => [
                    'val' => 'Rp ' . number_format($t['outflow'] / 1_000_000, 0, ',', '.') . 'jt',
                    'h' => $t['outflow'] > 0 ? $hOut : 10,
                ],
            ];
        }

        // 3. Upcoming Receivables (Piutang Jatuh Tempo Terdekat)
        $upcomingReceivables = Invoice::with(['client', 'project'])
            ->whereIn('status', ['draft', 'issued'])
            ->whereNotNull('due_date')
            ->orderBy('due_date', 'asc')
            ->limit(6)
            ->get()
            ->map(fn (Invoice $inv) => [
                'id' => $inv->id,
                'invoiceNumber' => $inv->invoice_number ?? 'INV-' . substr($inv->id, 0, 8),
                'client' => $inv->client->name ?? 'Client',
                'project' => $inv->project->name ?? 'Project Umum',
                'dueDate' => $inv->due_date ? $inv->due_date->format('Y-m-d') : $startDate->format('Y-m-d'),
                'amount' => (float) $inv->total,
                'status' => $inv->status instanceof \BackedEnum ? $inv->status->value : (string) $inv->status,
                'fiscalMode' => $inv->fiscal_mode instanceof \BackedEnum ? $inv->fiscal_mode->value : (string) $inv->fiscal_mode,
                'notes' => $inv->notes ?? 'Piutang Invoice',
            ])
            ->toArray();

        // 4. Upcoming Debts (Hutang PO Jatuh Tempo Terdekat)
        $upcomingDebts = PurchaseOrder::with(['vendor', 'project'])
            ->whereIn('status', ['draft', 'issued'])
            ->orderBy('transaction_date', 'asc')
            ->limit(6)
            ->get()
            ->map(function (PurchaseOrder $po) {
                $dueDate = $po->transaction_date ? Carbon::parse($po->transaction_date)->addDays(14) : now()->addDays(7);
                return [
                    'id' => $po->id,
                    'poNumber' => $po->po_number ?? 'PO-' . substr($po->id, 0, 8),
                    'vendor' => $po->vendor->name ?? 'Vendor',
                    'project' => $po->project->name ?? 'Project Umum',
                    'dueDate' => $dueDate->format('Y-m-d'),
                    'amount' => (float) $po->total,
                    'status' => $po->status instanceof \BackedEnum ? $po->status->value : (string) $po->status,
                    'fiscalMode' => $po->fiscal_mode instanceof \BackedEnum ? $po->fiscal_mode->value : (string) $po->fiscal_mode,
                    'notes' => $po->notes ?? 'Hutang Pembelian (PO)',
                ];
            })
            ->toArray();

        // 5. Recent Transactions (Gabungan Invoice & PO Terbaru)
        $recentInvoices = Invoice::with(['client', 'project'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Invoice $inv) => [
                'id' => $inv->id,
                'type' => 'invoice',
                'doc' => $inv->invoice_number ?? 'INV-' . substr($inv->id, 0, 8),
                'desc' => ($inv->project->name ?? 'Project') . ' - ' . ($inv->client->name ?? 'Client'),
                'client' => $inv->client->name ?? 'Client',
                'amount' => (float) $inv->total,
                'date' => $inv->transaction_date ? $inv->transaction_date->format('Y-m-d') : $inv->created_at->format('Y-m-d'),
                'status' => $inv->status instanceof \BackedEnum ? $inv->status->value : (string) $inv->status,
                'fiscalMode' => $inv->fiscal_mode instanceof \BackedEnum ? $inv->fiscal_mode->value : (string) $inv->fiscal_mode,
            ]);

        $recentPOs = PurchaseOrder::with(['vendor', 'project'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => $po->id,
                'type' => 'purchase_order',
                'doc' => $po->po_number ?? 'PO-' . substr($po->id, 0, 8),
                'desc' => ($po->project->name ?? 'Project') . ' - ' . ($po->vendor->name ?? 'Vendor'),
                'client' => $po->vendor->name ?? 'Vendor',
                'amount' => (float) $po->total,
                'date' => $po->transaction_date ? $po->transaction_date->format('Y-m-d') : $po->created_at->format('Y-m-d'),
                'status' => $po->status instanceof \BackedEnum ? $po->status->value : (string) $po->status,
                'fiscalMode' => $po->fiscal_mode instanceof \BackedEnum ? $po->fiscal_mode->value : (string) $po->fiscal_mode,
            ]);

        $recentTransactions = $recentInvoices->concat($recentPOs)
            ->sortByDesc('date')
            ->take(8)
            ->values()
            ->toArray();

        return [
            'filters' => [
                'month' => str_pad((string) $month, 2, '0', STR_PAD_LEFT),
                'year' => (string) $year,
            ],
            'metrics' => [
                'ppn' => [
                    'totalSaldo' => $ppnInflow - $ppnOutflow,
                    'totalPemasukan' => $ppnInflow,
                    'totalPengeluaran' => $ppnOutflow,
                    'taxOrDebt' => $ppnTaxOrDebt,
                    'ppnKeluaranNominal' => $ppnKeluaran,
                    'ppnKeluaranPercent' => $ppnKeluaranPercent . '%',
                    'ppnMasukanNominal' => $ppnMasukan,
                    'ppnMasukanPercent' => $ppnMasukanPercent . '%',
                ],
                'nonPpn' => [
                    'totalSaldo' => $nonPpnInflow - $nonPpnOutflow,
                    'totalPemasukan' => $nonPpnInflow,
                    'totalPengeluaran' => $nonPpnOutflow,
                    'taxOrDebt' => $nonPpnTaxOrDebt,
                ],
            ],
            'chartData' => [
                'ppn' => $chartDataPpn,
                'nonPpn' => $chartDataNonPpn,
            ],
            'upcomingReceivables' => $upcomingReceivables,
            'upcomingDebts' => $upcomingDebts,
            'recentTransactions' => $recentTransactions,
        ];
    }
}
