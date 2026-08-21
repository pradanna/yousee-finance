<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Client\Models\Client;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DebtReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        // 1. Ambil Invoices (Piutang Klien / Accounts Receivable)
        $invoiceQuery = Invoice::with([
            'client:id,name,phone,email',
            'project:id,code,name,sales_id',
            'project.sales:id,name',
            'sales:id,name',
            'paymentPlan.terms.settlements',
        ])
            ->where('status', '!=', InvoiceStatus::DRAFT); // Piutang diakui saat status Issued / Paid

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $invoiceQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $invoices = $invoiceQuery->orderByDesc('transaction_date')->get();

        // 2. Ambil Purchase Orders (Hutang Vendor / Accounts Payable)
        $poQuery = PurchaseOrder::with([
            'vendor:id,name,phone,email',
            'project:id,code,name',
            'paymentPlan.terms.settlements',
        ])
            ->where('status', '!=', PurchaseOrderStatus::DRAFT); // Hutang diakui saat PO Issued / Paid

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $poQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $purchaseOrders = $poQuery->orderByDesc('transaction_date')->get();

        // Transform Piutang (Receivables)
        $receivables = $invoices->map(function (Invoice $inv) {
            $plan = $inv->paymentPlan;
            $terms = $plan ? $plan->terms : collect();

            $totalAmount = (float) $inv->total;
            $paidAmount = 0.0;

            $milestones = [];
            foreach ($terms as $idx => $t) {
                $tPaid = (float) $t->settlements->sum('amount');
                $paidAmount += $tPaid;

                $milestones[] = [
                    'id'                => $t->id,
                    'sort_order'        => $t->sort_order,
                    'label'             => $t->label ?: "Termin " . ($idx + 1),
                    'amount'            => (float) $t->amount,
                    'paid_amount'       => $tPaid,
                    'remaining_amount'  => max(0, (float) $t->amount - $tPaid),
                    'due_date'          => $t->due_date ? $t->due_date->format('Y-m-d') : null,
                    'status'            => $t->status->value,
                    'notes'             => $t->notes,
                ];
            }

            // Jika tidak ada terms di payment plan, gunakan invoice total langsung
            if ($terms->isEmpty()) {
                $paidAmount = $inv->status === InvoiceStatus::PAID ? $totalAmount : 0.0;
                $milestones[] = [
                    'id'                => $inv->id,
                    'sort_order'        => 1,
                    'label'             => 'Pelunasan 100%',
                    'amount'            => $totalAmount,
                    'paid_amount'       => $paidAmount,
                    'remaining_amount'  => max(0, $totalAmount - $paidAmount),
                    'due_date'          => $inv->due_date ? $inv->due_date->format('Y-m-d') : null,
                    'status'            => $inv->status === InvoiceStatus::PAID ? 'paid' : 'unpaid',
                    'notes'             => $inv->notes,
                ];
            }

            $remainingAmount = max(0, $totalAmount - $paidAmount);
            $computedStatus = match (true) {
                $paidAmount >= $totalAmount - 0.01 && $totalAmount > 0 => 'paid',
                $paidAmount > 0 => 'partial',
                default => 'unpaid',
            };

            // Cari termin berikutnya yang belum lunas (nearest unpaid milestone)
            $nearestMilestone = collect($milestones)->first(fn ($m) => $m['status'] !== 'paid' && $m['remaining_amount'] > 0);

            $isOverdue = false;
            $overdueDays = 0;
            if ($nearestMilestone && ! empty($nearestMilestone['due_date'])) {
                $dueDate = Carbon::parse($nearestMilestone['due_date'])->startOfDay();
                if ($dueDate->isPast() && $computedStatus !== 'paid') {
                    $isOverdue = true;
                    $overdueDays = (int) $dueDate->diffInDays(now()->startOfDay());
                }
            }

            return [
                'id'                => $inv->id,
                'invoice_number'    => $inv->invoice_number,
                'client_id'         => $inv->client_id,
                'client_name'       => $inv->client?->name ?: '-',
                'project_id'        => $inv->project_id,
                'project_code'      => $inv->project?->code ?: '-',
                'project_name'      => $inv->project?->name ?: '-',
                'sales_name'        => $inv->sales?->name ?: $inv->project?->sales?->name ?: '-',
                'transaction_date'  => $inv->transaction_date ? $inv->transaction_date->format('Y-m-d') : null,
                'due_date'          => $inv->due_date ? $inv->due_date->format('Y-m-d') : null,
                'total_amount'      => $totalAmount,
                'paid_amount'       => $paidAmount,
                'remaining_amount'  => $remainingAmount,
                'status'            => $computedStatus,
                'scheme'            => $plan?->scheme?->value ?: 'full',
                'milestones'        => $milestones,
                'nearest_milestone' => $nearestMilestone,
                'is_overdue'        => $isOverdue,
                'overdue_days'      => $overdueDays,
                'fiscal_mode'       => $inv->fiscal_mode->value,
            ];
        });

        // Transform Hutang (Payables)
        $payables = $purchaseOrders->map(function (PurchaseOrder $po) {
            $plan = $po->paymentPlan;
            $terms = $plan ? $plan->terms : collect();

            $totalAmount = (float) $po->total;
            $paidAmount = 0.0;

            $milestones = [];
            foreach ($terms as $idx => $t) {
                $tPaid = (float) $t->settlements->sum('amount');
                $paidAmount += $tPaid;

                $milestones[] = [
                    'id'                => $t->id,
                    'sort_order'        => $t->sort_order,
                    'label'             => $t->label ?: "Termin " . ($idx + 1),
                    'amount'            => (float) $t->amount,
                    'paid_amount'       => $tPaid,
                    'remaining_amount'  => max(0, (float) $t->amount - $tPaid),
                    'due_date'          => $t->due_date ? $t->due_date->format('Y-m-d') : null,
                    'status'            => $t->status->value,
                    'notes'             => $t->notes,
                ];
            }

            if ($terms->isEmpty()) {
                $paidAmount = $po->status === PurchaseOrderStatus::PAID ? $totalAmount : 0.0;
                $milestones[] = [
                    'id'                => $po->id,
                    'sort_order'        => 1,
                    'label'             => 'Pelunasan 100%',
                    'amount'            => $totalAmount,
                    'paid_amount'       => $paidAmount,
                    'remaining_amount'  => max(0, $totalAmount - $paidAmount),
                    'due_date'          => $po->issued_at ? $po->issued_at->format('Y-m-d') : null,
                    'status'            => $po->status === PurchaseOrderStatus::PAID ? 'paid' : 'unpaid',
                    'notes'             => $po->notes,
                ];
            }

            $remainingAmount = max(0, $totalAmount - $paidAmount);
            $computedStatus = match (true) {
                $paidAmount >= $totalAmount - 0.01 && $totalAmount > 0 => 'paid',
                $paidAmount > 0 => 'partial',
                default => 'unpaid',
            };

            $nearestMilestone = collect($milestones)->first(fn ($m) => $m['status'] !== 'paid' && $m['remaining_amount'] > 0);

            $isOverdue = false;
            $overdueDays = 0;
            if ($nearestMilestone && ! empty($nearestMilestone['due_date'])) {
                $dueDate = Carbon::parse($nearestMilestone['due_date'])->startOfDay();
                if ($dueDate->isPast() && $computedStatus !== 'paid') {
                    $isOverdue = true;
                    $overdueDays = (int) $dueDate->diffInDays(now()->startOfDay());
                }
            }

            return [
                'id'                => $po->id,
                'po_number'         => $po->po_number,
                'vendor_id'         => $po->vendor_id,
                'vendor_name'       => $po->vendor?->name ?: '-',
                'project_id'        => $po->project_id,
                'project_code'      => $po->project?->code ?: '-',
                'project_name'      => $po->project?->name ?: '-',
                'transaction_date'  => $po->transaction_date ? $po->transaction_date->format('Y-m-d') : null,
                'due_date'          => $po->issued_at ? $po->issued_at->format('Y-m-d') : null,
                'total_amount'      => $totalAmount,
                'paid_amount'       => $paidAmount,
                'remaining_amount'  => $remainingAmount,
                'status'            => $computedStatus,
                'scheme'            => $plan?->scheme?->value ?: 'full',
                'milestones'        => $milestones,
                'nearest_milestone' => $nearestMilestone,
                'is_overdue'        => $isOverdue,
                'overdue_days'      => $overdueDays,
                'fiscal_mode'       => $po->fiscal_mode->value,
            ];
        });

        // Rekening Kas / Bank untuk modal pembayaran
        $paymentAccounts = ChartOfAccount::where('type', 'asset')
            ->where('code', 'like', '111%')
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        // Summary KPI
        $totalReceivableRemaining = (float) $receivables->sum('remaining_amount');
        $totalPayableRemaining = (float) $payables->sum('remaining_amount');
        $netCashflowPosition = $totalReceivableRemaining - $totalPayableRemaining;
        $overdueReceivablesCount = $receivables->where('is_overdue', true)->count();
        $overduePayablesCount = $payables->where('is_overdue', true)->count();

        // Riwayat Audit Log seluruh Piutang & Hutang Usaha (Invoices & Purchase Orders)
        $auditLogs = \App\Domains\Shared\Models\AuditLog::with('user:id,name')
            ->whereIn('auditable_type', [
                \App\Domains\Billing\Models\Invoice::class,
                \App\Domains\Procurement\Models\PurchaseOrder::class,
            ])
            ->latest()
            ->take(100)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'event'       => $log->event,
                'description' => $log->description,
                'properties'  => $log->properties,
                'user_name'   => $log->user?->name ?? 'System',
                'created_at'  => $log->created_at?->toIso8601String(),
            ]);

        return Inertia::render('DebtReceivable', [
            'receivables' => $receivables->values(),
            'payables'    => $payables->values(),
            'paymentAccounts' => $paymentAccounts,
            'summary' => [
                'totalReceivable' => $totalReceivableRemaining,
                'totalPayable'    => $totalPayableRemaining,
                'netBalance'      => $netCashflowPosition,
                'overdueCount'    => $overdueReceivablesCount + $overduePayablesCount,
                'overdueReceivablesCount' => $overdueReceivablesCount,
                'overduePayablesCount'    => $overduePayablesCount,
            ],
            'clients' => Client::orderBy('name')->get(['id', 'name']),
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'auditLogs' => $auditLogs,
        ]);
    }
}
