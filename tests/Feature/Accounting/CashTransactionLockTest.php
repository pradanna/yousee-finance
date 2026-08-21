<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\ExpenseCategory;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashTransactionLockTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected ChartOfAccount $cashAccount;
    protected ChartOfAccount $expenseAccount;
    protected ExpenseCategory $expenseCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);

        $this->user = User::factory()->create();

        $this->cashAccount = ChartOfAccount::where('code', '1111')->firstOrFail(); // Kas Operasional
        $this->expenseAccount = ChartOfAccount::where('code', '5210')->firstOrFail(); // Beban Gaji & Tunjangan Karyawan

        $this->expenseCategory = ExpenseCategory::create([
            'name' => 'Gaji Karyawan',
            'account_id' => $this->expenseAccount->id,
            'is_active' => true,
        ]);
    }

    public function test_can_create_update_delete_cash_transaction_when_period_is_open(): void
    {
        $this->actingAs($this->user);

        // 1. Create
        $response = $this->post(route('cash-out.store'), [
            'fiscal_mode' => 'non-ppn',
            'transaction_date' => '2026-05-15',
            'payment_account_id' => $this->cashAccount->id,
            'expense_category_id' => $this->expenseCategory->id,
            'amount' => 500000,
            'recipient' => 'Budi',
            'description' => 'Gaji harian',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('cash_transactions', [
            'amount' => 500000,
            'recipient' => 'Budi',
        ]);

        $cashTransaction = CashTransaction::where('recipient', 'Budi')->firstOrFail();
        $this->assertNotNull($cashTransaction->journalEntry);

        // 2. Update
        $response = $this->post(route('cash-out.update', $cashTransaction->id), [
            'fiscal_mode' => 'non-ppn',
            'transaction_date' => '2026-05-15',
            'payment_account_id' => $this->cashAccount->id,
            'expense_category_id' => $this->expenseCategory->id,
            'amount' => 600000,
            'recipient' => 'Budi Santoso',
            'description' => 'Gaji harian revisi',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $this->assertDatabaseHas('cash_transactions', [
            'id' => $cashTransaction->id,
            'amount' => 600000,
            'recipient' => 'Budi Santoso',
        ]);

        // 3. Delete
        $response = $this->delete(route('cash-out.destroy', $cashTransaction->id));
        $response->assertRedirect();
        $this->assertDatabaseMissing('cash_transactions', [
            'id' => $cashTransaction->id,
        ]);
    }

    public function test_cannot_create_update_or_delete_cash_transaction_when_period_is_locked(): void
    {
        $this->actingAs($this->user);

        // Kunci periode Mei 2026 Non-PPN
        ClosingPeriod::create([
            'month' => 5,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'is_closed' => true,
            'closed_at' => now(),
            'closed_by' => $this->user->id,
        ]);

        // 1. Coba Create di periode terkunci -> Error
        $this->expectException(\DomainException::class);
        $action = app(\App\Domains\Accounting\Actions\CreateCashTransaction::class);
        $action->execute([
            'fiscal_mode' => FiscalMode::NON_PPN,
            'transaction_date' => '2026-05-15',
            'payment_account_id' => $this->cashAccount->id,
            'expense_account_id' => $this->expenseAccount->id,
            'amount' => 500000,
            'recipient' => 'Budi',
            'description' => 'Gaji harian',
            'created_by' => $this->user->id,
        ]);
    }
}
