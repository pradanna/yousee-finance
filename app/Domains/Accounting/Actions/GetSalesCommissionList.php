<?php

declare(strict_types=1);

namespace App\Domains\Accounting\Actions;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;

class GetSalesCommissionList
{
    /**
     * Mengambil daftar komisi penjualan sales per proyek, status pelunasan invoice klien,
     * dan status pencairan pengeluaran kas.
     *
     * @param array{
     *     month?: string|null,
     *     year?: string|null,
     *     search?: string|null,
     *     sales_id?: string|null,
     *     status?: string|null, // 'all', 'ready', 'paid', 'pending'
     *     fiscal_mode?: string|null,
     * } $filters
     * @return array<string, mixed>
     */
    public function execute(array $filters): array
    {
        $fiscalMode = $filters['fiscal_mode'] ?? 'all';
        $month = $filters['month'] ?? 'all';
        $year = $filters['year'] ?? 'all';
        $search = $filters['search'] ?? null;
        $status = $filters['status'] ?? 'all';

        $query = Project::with([
            'sales:id,name,email,phone,commission_rate',
            'client:id,name,npwp,phone',
            'invoices' => function ($q) {
                $q->select('id', 'project_id', 'invoice_number', 'total', 'status', 'fiscal_mode', 'transaction_date');
            },
        ])->whereNotNull('sales_id');

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $query->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        if ($year !== 'all' && is_numeric($year)) {
            $query->whereYear('start_date', (int) $year);
        }

        if ($month !== 'all' && is_numeric($month)) {
            $query->whereMonth('start_date', (int) $month);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('sales', fn ($sq) => $sq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('client', fn ($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $projects = $query->orderByDesc('created_at')->get();

        // Ambil data pengeluaran kas yang terkait project_id untuk pencocokan status pembayaran komisi
        $projectIds = $projects->pluck('id')->toArray();
        $commissionTransactions = CashTransaction::whereIn('project_id', $projectIds)
            ->where('status', 'active')
            ->get()
            ->groupBy('project_id');

        $items = [];
        $totalCommissionEarned = 0.0;
        $totalCommissionReady = 0.0;
        $totalCommissionPaid = 0.0;
        $totalCommissionPending = 0.0;

        foreach ($projects as $project) {
            $sales = $project->sales;
            if (! $sales) {
                continue;
            }

            $commissionRate = (float) $sales->commission_rate;
            $contractValue = (float) $project->contract_value;
            // Bulatkan ke rupiah bulat (tanpa koma/desimal)
            $commissionAmount = (float) round($contractValue * ($commissionRate / 100));

            // Cek status pelunasan invoice klien
            $invoices = $project->invoices;
            $hasInvoices = $invoices->isNotEmpty();
            $allInvoicesPaid = $hasInvoices && $invoices->every(fn ($inv) => $inv->status === InvoiceStatus::PAID);
            $totalInvoiced = (float) round($invoices->sum('total'));

            // Cek apakah komisi sudah pernah dibayarkan melalui Kas Keluar
            $cashOutList = $commissionTransactions->get($project->id, collect());
            $isPaid = $cashOutList->isNotEmpty();
            $latestCashOut = $cashOutList->sortByDesc('transaction_date')->first();

            $commissionStatus = 'pending'; // Menunggu pelunasan klien
            if ($isPaid) {
                $commissionStatus = 'paid'; // Sudah dicairkan ke sales
                $totalCommissionPaid += $commissionAmount;
            } elseif ($allInvoicesPaid) {
                $commissionStatus = 'ready'; // Siap dicairkan (klien lunas)
                $totalCommissionReady += $commissionAmount;
            } else {
                $totalCommissionPending += $commissionAmount;
            }

            $totalCommissionEarned += $commissionAmount;

            // Filter status
            if ($status !== 'all' && $commissionStatus !== $status) {
                continue;
            }

            $items[] = [
                'projectId'          => $project->id,
                'projectCode'        => $project->code,
                'projectName'        => $project->name,
                'clientName'         => $project->client?->name ?? 'Klien Umum',
                'fiscalMode'         => $project->fiscal_mode->value,
                'startDate'          => $project->start_date ? $project->start_date->format('Y-m-d') : '',
                'contractValue'      => $contractValue,
                'salesId'            => $sales->id,
                'salesName'          => $sales->name,
                'salesPhone'         => $sales->phone,
                'salesEmail'         => $sales->email,
                'commissionRate'     => $commissionRate,
                'commissionAmount'   => $commissionAmount,
                'isClientPaid'       => $allInvoicesPaid,
                'totalInvoiced'      => $totalInvoiced,
                'commissionStatus'   => $commissionStatus, // 'pending' | 'ready' | 'paid'
                'paidTransactionNo'  => $latestCashOut?->transaction_number,
                'paidDate'           => $latestCashOut?->transaction_date ? $latestCashOut->transaction_date->format('Y-m-d') : null,
                'paidAmount'         => $latestCashOut ? (float) $latestCashOut->amount : 0.0,
            ];
        }

        return [
            'items'   => $items,
            'summary' => [
                'totalCommissionEarned'  => $totalCommissionEarned,
                'totalCommissionReady'   => $totalCommissionReady,
                'totalCommissionPaid'    => $totalCommissionPaid,
                'totalCommissionPending' => $totalCommissionPending,
                'readyCount'             => collect($items)->where('commissionStatus', 'ready')->count(),
                'paidCount'              => collect($items)->where('commissionStatus', 'paid')->count(),
                'pendingCount'           => collect($items)->where('commissionStatus', 'pending')->count(),
            ],
        ];
    }
}
