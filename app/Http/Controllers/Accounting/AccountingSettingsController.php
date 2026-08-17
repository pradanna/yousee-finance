<?php

declare(strict_types=1);

namespace App\Http\Controllers\Accounting;

use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Http\Controllers\Controller;
use App\Http\Requests\Accounting\UpdateAccountingSettingsRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AccountingSettingsController extends Controller
{
    /**
     * Display global accounting settings mappings.
     */
    public function index(): Response
    {
        $settings = AccountingSetting::with('account')->get()->map(fn (AccountingSetting $s) => [
            'id'                  => $s->id,
            'key'                 => $s->key,
            'description'         => $s->description,
            'chart_of_account_id' => $s->account_id,
            'chart_of_account'    => $s->account ? [
                'id'           => $s->account->id,
                'code'         => $s->account->code,
                'name'         => $s->account->name,
                'display_name' => "{$s->account->code} - {$s->account->name}",
            ] : null,
        ]);

        $leafAccounts = ChartOfAccount::orderBy('code')->get()
            ->filter(fn (ChartOfAccount $acc) => $acc->isLeaf())
            ->values()
            ->map(fn (ChartOfAccount $acc) => [
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

        return Inertia::render('Accounting/Settings/Index', [
            'settings'     => $settings,
            'leafAccounts' => $leafAccounts,
        ]);
    }

    /**
     * Update global accounting settings mappings.
     */
    public function update(UpdateAccountingSettingsRequest $request): RedirectResponse
    {
        $settingsData = $request->validated('settings');

        foreach ($settingsData as $item) {
            if (! empty($item['chart_of_account_id'])) {
                AccountingSetting::updateOrCreate(
                    ['key' => $item['key']],
                    ['account_id' => $item['chart_of_account_id']],
                );
            }
        }

        return redirect()->back()->with('success', 'Pengaturan akun default akuntansi berhasil diperbarui.');
    }
}
