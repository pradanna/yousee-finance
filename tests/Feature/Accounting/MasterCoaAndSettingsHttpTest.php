<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Identity\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterCoaAndSettingsHttpTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
        $this->seed(ChartOfAccountSeeder::class);

        $this->user = User::factory()->create();
    }

    public function test_master_coa_index_page_renders(): void
    {
        $response = $this->actingAs($this->user)->get(route('accounting.coa.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Accounting/MasterCoa/Index')
            ->has('accounts')
            ->has('leafAccounts')
            ->has('accountTypes')
            ->has('normalBalances')
        );
    }

    public function test_can_create_new_sub_account(): void
    {
        $parent = ChartOfAccount::where('code', '1110')->first();

        $response = $this->actingAs($this->user)->post(route('accounting.coa.store'), [
            'parent_id'      => $parent->id,
            'code'           => '1115',
            'name'           => 'Bank BNI Operasional',
            'type'           => 'asset',
            'normal_balance' => 'debit',
            'description'    => 'Rekening BNI Operasional Cabang',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('chart_of_accounts', [
            'code' => '1115',
            'name' => 'Bank BNI Operasional',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_accounting_settings_index_page_renders(): void
    {
        $response = $this->actingAs($this->user)->get(route('accounting.settings.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Accounting/Settings/Index')
            ->has('settings')
            ->has('leafAccounts')
        );
    }

    public function test_can_update_accounting_settings_mappings(): void
    {
        $bankMandiri = ChartOfAccount::where('code', '1113')->first();

        $response = $this->actingAs($this->user)->put(route('accounting.settings.update'), [
            'settings' => [
                [
                    'key' => 'default_bank',
                    'chart_of_account_id' => $bankMandiri->id,
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertEquals($bankMandiri->id, AccountingSetting::getAccountId('default_bank'));
    }
}
