<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalReportController extends Controller
{
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        // 1. Query Journal Entries with relations
        $journalQuery = JournalEntry::with([
            'items.account',
            'project:id,code,name',
            'postedBy:id,name',
        ]);

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $journalQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $journals = $journalQuery->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($j) {
                // Tentukan kategori jurnal berdasarkan sumber atau pola akun
                $category = 'adjustment';
                $sourceType = $j->source_type ?? '';
                if (str_contains($sourceType, 'Invoice')) {
                    $category = 'sales';
                } elseif (str_contains($sourceType, 'PurchaseOrder')) {
                    $category = 'purchase';
                } elseif (str_contains($sourceType, 'CashTransaction')) {
                    $hasRevenue = $j->items->contains(fn ($i) => $i->account?->type?->value === 'revenue');
                    $category = $hasRevenue ? 'cash_in' : 'cash_out';
                }

                return [
                    'id'          => $j->number ?: 'JRN-' . substr($j->id, 0, 8),
                    'uuid'        => $j->id,
                    'date'        => $j->transaction_date ? $j->transaction_date->format('Y-m-d') : '',
                    'docNo'       => $j->number ?: '-',
                    'refNo'       => $j->project?->code ?: '',
                    'category'    => $category,
                    'description' => $j->description ?: '-',
                    'postedBy'    => $j->poster?->name ?? 'Sistem Otomatis',
                    'isReversed'  => (bool) $j->is_reversal,
                    'fiscal_mode' => $j->fiscal_mode->value,
                    'lines'       => $j->items->map(function ($item) {
                        return [
                            'accountCode' => $item->account?->code ?? '-',
                            'accountName' => $item->account?->name ?? 'Unknown Account',
                            'debit'       => (float) $item->debit,
                            'credit'      => (float) $item->credit,
                            'memo'        => $item->memo,
                        ];
                    })->values()->toArray(),
                ];
            });

        // 2. Query Master Chart of Accounts (COA)
        $coaList = ChartOfAccount::orderBy('code')
            ->get()
            ->map(fn ($coa) => [
                'id'            => $coa->id,
                'code'          => $coa->code,
                'name'          => $coa->name,
                'category'      => $coa->type->value,
                'normalBalance' => $coa->normal_balance->value,
                'isActive'      => (bool) $coa->is_active,
                'description'   => $coa->description,
            ]);

        // 3. Query Audit Logs untuk Accounting / Journal
        $auditLogs = AuditLog::with('user:id,name')
            ->whereIn('auditable_type', [
                JournalEntry::class,
                ChartOfAccount::class,
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

        return Inertia::render('JournalReport', [
            'initialJournals' => $journals,
            'initialCoaList'  => $coaList,
            'auditLogs'       => $auditLogs,
        ]);
    }
}
