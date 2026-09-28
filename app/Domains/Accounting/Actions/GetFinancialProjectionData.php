<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Accounting\Models\TaxSettlement;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Shared\Enums\FiscalMode;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class GetFinancialProjectionData
{
    /**
     * Menghitung proyeksi pendapatan, pengeluaran PO, dan kewajiban PPN akhir bulan.
     *
     * @param array{
     *     days?: int|string|null,
     *     fiscal_mode?: string|null,
     * } $filters
     * @return array<string, mixed>
     */
    public function execute(array $filters = []): array
    {
        $days = isset($filters['days']) ? (int) $filters['days'] : 14;
        if ($days <= 0) {
            $days = 14;
        }

        $fiscalMode = $filters['fiscal_mode'] ?? 'all';
        $today = Carbon::today();
        $endDate = $today->copy()->addDays($days);
        $currentMonthEnd = $today->copy()->endOfMonth();

        // 1. Saldo Kas & Bank Saat Ini (Real Current Cash Balance)
        $currentCashBalance = $this->calculateCurrentCashBalance($fiscalMode);

        // 2. Proyeksi Piutang / Tagihan Klien (Expected Inflow)
        $inflowResult = $this->getProjectedInflows($today, $endDate, $fiscalMode);
        $inflowItems = $inflowResult['items'];
        $dailyInflow = $inflowResult['daily'];
        $totalInflow = $inflowResult['total'];

        // 3. Proyeksi Hutang PO Vendor (Expected PO Outflow)
        $outflowPoResult = $this->getProjectedPoOutflows($today, $endDate, $fiscalMode);
        $outflowPoItems = $outflowPoResult['items'];
        $dailyOutflowPo = $outflowPoResult['daily'];
        $totalOutflowPo = $outflowPoResult['total'];

        // 4. Deteksi dan Estimasi Penyetoran PPN Akhir Bulan
        $crossesMonthEnd = $endDate->greaterThanOrEqualTo($currentMonthEnd) && $today->lessThanOrEqualTo($currentMonthEnd);
        $ppnMonth = (int) $today->month;
        $ppnYear = (int) $today->year;

        $ppnKeluaranTotal = 0.0;
        $ppnMasukanTotal = 0.0;
        $ppnNetPayable = 0.0;
        $ppnIsSettled = false;
        $ppnOutflowAmount = 0.0;
        $dailyOutflowPpn = [];

        if ($fiscalMode !== 'non-ppn') {
            // Hitung PPN Keluaran bulan ini
            $ppnKeluaranTotal = (float) Invoice::where('fiscal_mode', FiscalMode::PPN->value)
                ->where('status', '!=', InvoiceStatus::DRAFT)
                ->whereMonth('transaction_date', $ppnMonth)
                ->whereYear('transaction_date', $ppnYear)
                ->sum('ppn');

            // Hitung PPN Masukan bulan ini
            $ppnMasukanTotal = (float) PurchaseOrder::where('fiscal_mode', FiscalMode::PPN->value)
                ->where('status', '!=', PurchaseOrderStatus::DRAFT)
                ->whereMonth('transaction_date', $ppnMonth)
                ->whereYear('transaction_date', $ppnYear)
                ->sum('ppn');

            $ppnNetPayable = max(0.0, $ppnKeluaranTotal - $ppnMasukanTotal);

            // Cek apakah sudah disetor di Kas Negara (TaxSettlement)
            $settlement = TaxSettlement::where('fiscal_mode', FiscalMode::PPN->value)
                ->where('month', $ppnMonth)
                ->where('year', $ppnYear)
                ->first();

            $ppnIsSettled = $settlement && $settlement->status === 'paid';

            if (! $ppnIsSettled && $crossesMonthEnd && $ppnNetPayable > 0) {
                $ppnOutflowAmount = $ppnNetPayable;
                $monthEndDateStr = $currentMonthEnd->toDateString();
                $dailyOutflowPpn[$monthEndDateStr] = $ppnOutflowAmount;
            }
        }

        // Gabungkan Outflow Items (PO + PPN jika ada)
        $outflowItems = $outflowPoItems;
        if ($ppnOutflowAmount > 0) {
            $outflowItems[] = [
                'id'                => 'ppn-settlement-' . $ppnMonth . '-' . $ppnYear,
                'po_id'             => null,
                'po_number'         => sprintf('SETOR-PPN-%02d%d', $ppnMonth, $ppnYear),
                'vendor_id'         => null,
                'vendor_name'       => 'Kas Negara (DJP / Pajak)',
                'project_id'        => null,
                'project_code'      => 'TAX-PPN',
                'project_name'      => 'Penyetoran PPN Masa ' . $today->translatedFormat('F Y'),
                'label'             => 'Estimasi Kurang Bayar PPN Akhir Bulan',
                'due_date'          => $currentMonthEnd->toDateString(),
                'total_term_amount' => $ppnOutflowAmount,
                'paid_amount'       => 0.0,
                'remaining_amount'  => $ppnOutflowAmount,
                'status'            => 'unpaid',
                'is_overdue'        => false,
                'type'              => 'ppn',
            ];
        }

        // Urutkan Outflow Items berdasarkan due_date ascending
        usort($outflowItems, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));

        $totalOutflow = $totalOutflowPo + $ppnOutflowAmount;
        $netCashflow = $totalInflow - $totalOutflow;
        $projectedEndingCashBalance = $currentCashBalance + $netCashflow;

        // 5. Timeline Harian (Day-by-Day Timeline)
        $timeline = [];
        $runningBalance = $currentCashBalance;
        $period = CarbonPeriod::create($today, $endDate);

        $dayNames = [
            0 => 'Minggu',
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
        ];

        foreach ($period as $date) {
            $dateStr = $date->toDateString();
            $dayInflow = (float) ($dailyInflow[$dateStr] ?? 0.0);
            $dayOutflowPo = (float) ($dailyOutflowPo[$dateStr] ?? 0.0);
            $dayOutflowPpn = (float) ($dailyOutflowPpn[$dateStr] ?? 0.0);
            $dayTotalOutflow = $dayOutflowPo + $dayOutflowPpn;
            $dayNet = $dayInflow - $dayTotalOutflow;

            $runningBalance += $dayNet;

            $inflowCount = count(array_filter($inflowItems, fn ($item) => $item['due_date'] === $dateStr));
            $outflowCount = count(array_filter($outflowItems, fn ($item) => $item['due_date'] === $dateStr));

            $timeline[] = [
                'date'            => $dateStr,
                'day_name'        => $dayNames[$date->dayOfWeek] ?? '',
                'is_today'        => $date->isToday(),
                'is_month_end'    => $date->isSameDay($currentMonthEnd),
                'inflow'          => $dayInflow,
                'outflow_po'      => $dayOutflowPo,
                'outflow_ppn'     => $dayOutflowPpn,
                'total_outflow'   => $dayTotalOutflow,
                'net'             => $dayNet,
                'running_balance' => $runningBalance,
                'inflow_count'    => $inflowCount,
                'outflow_count'   => $outflowCount,
            ];
        }

        return [
            'fiscal_mode' => $fiscalMode,
            'filters'     => [
                'days'        => $days,
                'start_date'  => $today->toDateString(),
                'end_date'    => $endDate->toDateString(),
                'fiscal_mode' => $fiscalMode,
            ],
            'summary'     => [
                'current_cash_balance'          => $currentCashBalance,
                'projected_inflow_total'        => $totalInflow,
                'projected_outflow_po_total'    => $totalOutflowPo,
                'projected_outflow_ppn_total'   => $ppnOutflowAmount,
                'projected_outflow_total'       => $totalOutflow,
                'projected_net_cashflow'        => $netCashflow,
                'projected_ending_cash_balance' => $projectedEndingCashBalance,
                'crosses_month_end'             => $crossesMonthEnd,
                'month_end_date'                => $currentMonthEnd->toDateString(),
                'ppn_month'                     => $ppnMonth,
                'ppn_year'                      => $ppnYear,
                'ppn_keluaran_total'            => $ppnKeluaranTotal,
                'ppn_masukan_total'             => $ppnMasukanTotal,
                'ppn_net_payable'               => $ppnNetPayable,
                'ppn_is_settled'                => $ppnIsSettled,
            ],
            'timeline'     => $timeline,
            'inflow_items' => $inflowItems,
            'outflow_items'=> $outflowItems,
        ];
    }

    /**
     * Hitung total saldo kas & bank saat ini dari seluruh akun leaf kas (111%).
     */
    private function calculateCurrentCashBalance(string $fiscalMode): float
    {
        $parentCashAccount = ChartOfAccount::where('code', '1110')->first();
        $cashBankAccountsQuery = ChartOfAccount::where(function ($q) use ($parentCashAccount) {
            $q->where('code', 'like', '111%')
                ->where('code', '!=', '1110');
            if ($parentCashAccount) {
                $q->orWhere('parent_id', $parentCashAccount->id);
            }
        })->where('is_active', true);

        $cashAccounts = $cashBankAccountsQuery->get();
        $totalBalance = 0.0;

        foreach ($cashAccounts as $acc) {
            $itemsQuery = JournalEntryItem::where('account_id', $acc->id)
                ->whereHas('journalEntry', function ($q) use ($fiscalMode) {
                    if (! empty($fiscalMode) && $fiscalMode !== 'all') {
                        $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
                        if ($fiscalModeEnum) {
                            $q->where('fiscal_mode', $fiscalModeEnum);
                        }
                    }
                });

            $sumDebit = (float) $itemsQuery->sum('debit');
            $sumCredit = (float) $itemsQuery->sum('credit');
            $opening = (float) ($acc->opening_balance ?? 0);

            $totalBalance += ($opening + $sumDebit - $sumCredit);
        }

        return $totalBalance;
    }

    /**
     * Ambil seluruh termin tagihan invoice klien yang belum lunas.
     *
     * @return array{items: array<int, array<string, mixed>>, daily: array<string, float>, total: float}
     */
    private function getProjectedInflows(Carbon $today, Carbon $endDate, string $fiscalMode): array
    {
        $invoiceQuery = Invoice::with([
            'client:id,name',
            'project:id,code,name',
            'paymentPlan.terms.settlements',
        ])
            ->where('status', '!=', InvoiceStatus::DRAFT);

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $invoiceQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $invoices = $invoiceQuery->get();
        $items = [];
        $daily = [];
        $total = 0.0;

        foreach ($invoices as $inv) {
            $terms = $inv->paymentPlan?->terms ?? collect();

            foreach ($terms as $term) {
                if ($term->status->value === 'paid') {
                    continue;
                }

                $dueDate = $term->due_date ? Carbon::parse($term->due_date)->startOfDay() : null;
                if (! $dueDate) {
                    continue;
                }

                // Ambil tagihan yang jatuh tempo sebelum atau pada $endDate
                if ($dueDate->greaterThan($endDate)) {
                    continue;
                }

                $paidSum = (float) $term->settlements->sum('amount');
                $remaining = max(0.0, (float) $term->amount - $paidSum);

                if ($remaining <= 0.01) {
                    continue;
                }

                $isOverdue = $dueDate->lessThan($today);
                // Jika sudah lewat jatuh tempo (overdue), petakan proyeksi ke hari ini agar terlihat sebagai piutang aktif
                $projectedDateStr = $isOverdue ? $today->toDateString() : $dueDate->toDateString();

                $items[] = [
                    'id'                => (string) $term->id,
                    'invoice_id'        => (string) $inv->id,
                    'invoice_number'    => (string) ($inv->invoice_number ?: 'INV-' . substr((string) $inv->id, 0, 8)),
                    'client_id'         => (string) ($inv->client_id ?? ''),
                    'client_name'       => (string) ($inv->client?->name ?? 'Client Umum'),
                    'project_id'        => (string) ($inv->project_id ?? ''),
                    'project_code'      => (string) ($inv->project?->code ?? '-'),
                    'project_name'      => (string) ($inv->project?->name ?? '-'),
                    'label'             => (string) ($term->label ?: 'Termin'),
                    'due_date'          => $dueDate->toDateString(),
                    'projected_date'    => $projectedDateStr,
                    'total_term_amount' => (float) $term->amount,
                    'paid_amount'       => $paidSum,
                    'remaining_amount'  => $remaining,
                    'status'            => $term->status->value,
                    'is_overdue'        => $isOverdue,
                ];

                $daily[$projectedDateStr] = ($daily[$projectedDateStr] ?? 0.0) + $remaining;
                $total += $remaining;
            }
        }

        // Urutkan Inflow Items berdasarkan due_date ascending
        usort($items, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));

        return [
            'items' => $items,
            'daily' => $daily,
            'total' => $total,
        ];
    }

    /**
     * Ambil seluruh termin pembayaran PO vendor yang belum lunas.
     *
     * @return array{items: array<int, array<string, mixed>>, daily: array<string, float>, total: float}
     */
    private function getProjectedPoOutflows(Carbon $today, Carbon $endDate, string $fiscalMode): array
    {
        $poQuery = PurchaseOrder::with([
            'vendor:id,name',
            'project:id,code,name',
            'paymentPlan.terms.settlements',
        ])
            ->where('status', '!=', PurchaseOrderStatus::DRAFT);

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $poQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $pos = $poQuery->get();
        $items = [];
        $daily = [];
        $total = 0.0;

        foreach ($pos as $po) {
            $terms = $po->paymentPlan?->terms ?? collect();

            foreach ($terms as $term) {
                if ($term->status->value === 'paid') {
                    continue;
                }

                $dueDate = $term->due_date ? Carbon::parse($term->due_date)->startOfDay() : null;
                if (! $dueDate) {
                    continue;
                }

                // Ambil kewajiban PO yang jatuh tempo sebelum atau pada $endDate
                if ($dueDate->greaterThan($endDate)) {
                    continue;
                }

                $paidSum = (float) $term->settlements->sum('amount');
                $remaining = max(0.0, (float) $term->amount - $paidSum);

                if ($remaining <= 0.01) {
                    continue;
                }

                $isOverdue = $dueDate->lessThan($today);
                // Jika sudah lewat jatuh tempo (overdue), petakan proyeksi ke hari ini
                $projectedDateStr = $isOverdue ? $today->toDateString() : $dueDate->toDateString();

                $items[] = [
                    'id'                => (string) $term->id,
                    'po_id'             => (string) $po->id,
                    'po_number'         => (string) ($po->po_number ?: 'PO-' . substr((string) $po->id, 0, 8)),
                    'vendor_id'         => (string) ($po->vendor_id ?? ''),
                    'vendor_name'       => (string) ($po->vendor?->name ?? 'Vendor Rekanan'),
                    'project_id'        => (string) ($po->project_id ?? ''),
                    'project_code'      => (string) ($po->project?->code ?? '-'),
                    'project_name'      => (string) ($po->project?->name ?? '-'),
                    'label'             => (string) ($term->label ?: 'Termin'),
                    'due_date'          => $dueDate->toDateString(),
                    'projected_date'    => $projectedDateStr,
                    'total_term_amount' => (float) $term->amount,
                    'paid_amount'       => $paidSum,
                    'remaining_amount'  => $remaining,
                    'status'            => $term->status->value,
                    'is_overdue'        => $isOverdue,
                    'type'              => 'po',
                ];

                $daily[$projectedDateStr] = ($daily[$projectedDateStr] ?? 0.0) + $remaining;
                $total += $remaining;
            }
        }

        // Urutkan Outflow Items berdasarkan due_date ascending
        usort($items, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));

        return [
            'items' => $items,
            'daily' => $daily,
            'total' => $total,
        ];
    }
}
