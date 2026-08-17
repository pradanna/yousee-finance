<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\StoreChartOfAccountRequest;
use App\Http\Requests\Accounting\UpdateChartOfAccountRequest;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MasterCoaController extends Controller
{
    /**
     * Display Master COA tree and list.
     */
    public function index(): Response
    {
        // Load hierarchical tree
        $allAccounts = ChartOfAccount::orderBy('code')->get();

        // Build nested tree structure
        $tree = $this->buildTree($allAccounts);

        // Leaf accounts list (only accounts with 0 children)
        $leafAccounts = $allAccounts->filter(fn (ChartOfAccount $acc) => $acc->isLeaf())->values()->map(fn (ChartOfAccount $acc) => [
            'id'             => $acc->id,
            'parent_id'      => $acc->parent_id,
            'code'           => $acc->code,
            'name'           => $acc->name,
            'display_name'   => "{$acc->code} - {$acc->name}",
            'type'           => $acc->type->value,
            'type_label'     => $acc->type->label(),
            'normal_balance' => $acc->normal_balance->value,
            'normal_balance_label' => $acc->normal_balance->label(),
            'fiscal_mode_context' => 'all',
            'fiscal_mode_context_label' => 'Semua Mode',
            'level'          => 2,
            'is_active'      => $acc->is_active,
            'is_leaf'        => true,
        ]);

        $accountTypes = array_map(fn (AccountType $t) => [
            'value' => $t->value,
            'label' => match ($t) {
                AccountType::ASSET     => '1 - Aset',
                AccountType::LIABILITY => '2 - Kewajiban',
                AccountType::EQUITY    => '3 - Ekuitas',
                AccountType::REVENUE   => '4 - Pendapatan',
                AccountType::EXPENSE   => '5 - Beban',
            },
        ], AccountType::cases());

        $normalBalances = array_map(fn (NormalBalance $b) => [
            'value' => $b->value,
            'label' => $b->label(),
        ], NormalBalance::cases());

        return Inertia::render('Accounting/MasterCoa/Index', [
            'accounts'       => $tree,
            'leafAccounts'   => $leafAccounts,
            'accountTypes'   => $accountTypes,
            'normalBalances' => $normalBalances,
        ]);
    }

    /**
     * Store a newly created Chart of Account.
     */
    public function store(StoreChartOfAccountRequest $request): RedirectResponse
    {
        ChartOfAccount::create([
            'parent_id'      => $request->validated('parent_id'),
            'code'           => $request->validated('code'),
            'name'           => $request->validated('name'),
            'type'           => $request->validated('type'),
            'normal_balance' => $request->validated('normal_balance'),
            'description'    => $request->validated('description'),
            'is_active'      => true,
        ]);

        return redirect()->back()->with('success', 'Akun COA baru berhasil ditambahkan.');
    }

    /**
     * Update the specified Chart of Account.
     */
    public function update(UpdateChartOfAccountRequest $request, ChartOfAccount $chartOfAccount): RedirectResponse
    {
        $chartOfAccount->update([
            'code'        => $request->validated('code'),
            'name'        => $request->validated('name'),
            'description' => $request->validated('description'),
        ]);

        return redirect()->back()->with('success', 'Akun COA berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status or deactivate an account.
     */
    public function destroy(ChartOfAccount $chartOfAccount): RedirectResponse
    {
        if ($chartOfAccount->children()->exists()) {
            throw new DomainException('Tidak dapat menonaktifkan akun header yang memiliki akun anak.');
        }

        $chartOfAccount->update(['is_active' => ! $chartOfAccount->is_active]);

        $status = $chartOfAccount->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Akun COA berhasil {$status}.");
    }

    /**
     * Recursively build hierarchical tree.
     */
    private function buildTree($accounts, ?string $parentId = null, int $level = 0): array
    {
        $branch = [];

        foreach ($accounts as $account) {
            if ($account->parent_id === $parentId) {
                $children = $this->buildTree($accounts, $account->id, $level + 1);
                $isLeaf = empty($children);

                $branch[] = [
                    'id'                        => $account->id,
                    'parent_id'                 => $account->parent_id,
                    'code'                      => $account->code,
                    'name'                      => $account->name,
                    'display_name'              => "{$account->code} - {$account->name}",
                    'type'                      => $account->type->value,
                    'type_label'                => $account->type->label(),
                    'normal_balance'            => $account->normal_balance->value,
                    'normal_balance_label'      => $account->normal_balance->label(),
                    'fiscal_mode_context'       => 'all',
                    'fiscal_mode_context_label' => 'Semua Mode',
                    'level'                     => $level,
                    'is_active'                 => $account->is_active,
                    'is_leaf'                   => $isLeaf,
                    'children'                  => $children,
                ];
            }
        }

        return $branch;
    }
}
