<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Actions\CreateCashTransaction;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ExpenseCategory;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Http\Controllers\Controller;
use App\Http\Requests\CashTransaction\StoreCashTransactionRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashOutController extends Controller
{
    public function index(Request $request): Response
    {
        $fiscalMode = $request->header('X-Fiscal-Mode') ?? $request->query('fiscal_mode');

        $month = $request->query('month', (string) now()->month);
        $year = $request->query('year', (string) now()->year);

        // Ambil transaksi pengeluaran kas
        $query = CashTransaction::with([
            'paymentAccount:id,code,name',
            'expenseAccount:id,code,name',
            'project:id,code,name',
            'creator:id,name',
        ]);

        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $query->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        if ($month !== 'all') {
            $query->whereMonth('transaction_date', (int) $month);
        }
        if ($year !== 'all') {
            $query->whereYear('transaction_date', (int) $year);
        }

        $transactions = $query->orderByDesc('transaction_date')
            ->orderByDesc('transaction_number')
            ->paginate(15)
            ->withQueryString();

        // Akun Kas & Bank (Leaf Nodes) - Format nama ramah operasional
        $paymentAccounts = ChartOfAccount::where('type', AccountType::ASSET)
            ->where('code', 'like', '111%')
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->map(function ($acc) {
                $friendlyName = match (true) {
                    str_contains(strtolower($acc->name), 'kecil') || str_contains(strtolower($acc->name), 'tunai') => 'Cash / Kas Tunai',
                    str_contains(strtolower($acc->name), 'bca') => 'Bank BCA',
                    str_contains(strtolower($acc->name), 'mandiri') => 'Bank Mandiri',
                    str_contains(strtolower($acc->name), 'bri') => 'Bank BRI',
                    default => $acc->name,
                };
                return [
                    'id'            => $acc->id,
                    'code'          => $acc->code,
                    'name'          => $acc->name,
                    'friendly_name' => $friendlyName,
                ];
            });

        // Master Kategori Pengeluaran (Tabel expense_categories terhubung ke COA)
        $expenseCategories = ExpenseCategory::with('account:id,code,name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'account_id', 'description'])
            ->map(function ($cat) {
                return [
                    'id'          => $cat->id,
                    'name'        => $cat->name,
                    'account_id'  => $cat->account_id,
                    'account_code'=> $cat->account?->code,
                    'account_name'=> $cat->account?->name,
                ];
            });

        // Akun Beban & Biaya (Leaf Nodes) untuk opsi create kategori baru
        $leafExpenseAccounts = ChartOfAccount::where('type', AccountType::EXPENSE)
            ->whereDoesntHave('children')
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        // List project aktif untuk analytical tagging
        $projectsQuery = Project::query()->orderByDesc('created_at');
        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $projectsQuery->where('fiscal_mode', $fiscalModeEnum);
            }
        }
        $projects = $projectsQuery->get(['id', 'code', 'name']);

        // Ringkasan Statistik
        $statsBase = CashTransaction::query();
        if (! empty($fiscalMode) && $fiscalMode !== 'all') {
            $fiscalModeEnum = FiscalMode::tryFrom($fiscalMode);
            if ($fiscalModeEnum) {
                $statsBase->where('fiscal_mode', $fiscalModeEnum);
            }
        }

        $currentMonthTotal = (float) (clone $statsBase)
            ->whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->sum('amount');

        $lastMonthTotal = (float) (clone $statsBase)
            ->whereMonth('transaction_date', now()->subMonth()->month)
            ->whereYear('transaction_date', now()->subMonth()->year)
            ->sum('amount');

        $totalFiltered = (float) (clone $query)->sum('amount');

        return Inertia::render('CashOut', [
            'transactions' => $transactions,
            'paymentAccounts' => $paymentAccounts,
            'expenseCategories' => $expenseCategories,
            'leafExpenseAccounts' => $leafExpenseAccounts,
            'projects' => $projects,
            'stats' => [
                'currentMonthTotal' => $currentMonthTotal,
                'lastMonthTotal'    => $lastMonthTotal,
                'totalFiltered'     => $totalFiltered,
            ],
            'filters' => [
                'month' => $month,
                'year'  => $year,
            ],
        ]);
    }

    public function store(StoreCashTransactionRequest $request, CreateCashTransaction $action): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;
        $validated['expense_account_id'] = $request->getExpenseAccountId();

        $action->execute($validated);

        return redirect()->back()->with('success', 'Pengeluaran kas berhasil dicatat dan jurnal akuntansi telah dibukukan.');
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100', 'unique:expense_categories,name'],
            'account_id' => ['required', 'string', 'exists:chart_of_accounts,id'],
            'description'=> ['nullable', 'string', 'max:500'],
        ]);

        $account = ChartOfAccount::findOrFail($validated['account_id']);
        if (! $account->isLeaf() || $account->type !== AccountType::EXPENSE) {
            return redirect()->back()->withErrors([
                'account_id' => 'Akun akuntansi yang dipilih harus akun beban/biaya tingkat transaksi (leaf).',
            ]);
        }

        ExpenseCategory::create([
            'name'        => $validated['name'],
            'account_id'  => $validated['account_id'],
            'description' => $validated['description'] ?? null,
            'is_active'   => true,
        ]);

        return redirect()->back()->with('success', "Kategori '{$validated['name']}' berhasil ditambahkan.");
    }
}
