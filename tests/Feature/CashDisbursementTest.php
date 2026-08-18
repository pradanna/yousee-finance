<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Accounting\Actions\CreateCashTransaction;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use App\Domains\Accounting\Models\CashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashDisbursementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ChartOfAccount $cashAccount;
    private ChartOfAccount $expenseAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        // 1. Buat Header & Leaf COA Kas & Bank (Asset)
        $hAsset = ChartOfAccount::create([
            'code' => '1000',
            'name' => 'Aset',
            'type' => AccountType::ASSET,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active' => true,
        ]);

        $this->cashAccount = ChartOfAccount::create([
            'parent_id' => $hAsset->id,
            'code' => '1111',
            'name' => 'Kas Operasional',
            'type' => AccountType::ASSET,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active' => true,
        ]);

        // 2. Buat Header & Leaf COA Beban (Expense)
        $hExpense = ChartOfAccount::create([
            'code' => '5000',
            'name' => 'Beban Operasional',
            'type' => AccountType::EXPENSE,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active' => true,
        ]);

        $this->expenseAccount = ChartOfAccount::create([
            'parent_id' => $hExpense->id,
            'code' => '5210',
            'name' => 'Beban Listrik & Utilitas',
            'type' => AccountType::EXPENSE,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active' => true,
        ]);
    }

    public function test_can_create_cash_disbursement_and_auto_post_balanced_journal(): void
    {
        $action = new CreateCashTransaction();

        $tx = $action->execute([
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'payment_account_id' => $this->cashAccount->id,
            'expense_account_id' => $this->expenseAccount->id,
            'amount'             => 750000,
            'transaction_date'   => '2026-08-18',
            'recipient'          => 'PLN Solo',
            'description'        => 'Pembayaran token listrik kantor',
            'created_by'         => $this->user->id,
        ]);

        $this->assertInstanceOf(CashTransaction::class, $tx);
        $this->assertDatabaseHas('cash_transactions', [
            'id'                 => $tx->id,
            'amount'             => '750000.00',
            'recipient'          => 'PLN Solo',
            'payment_account_id' => $this->cashAccount->id,
            'expense_account_id' => $this->expenseAccount->id,
        ]);

        // Verifikasi Jurnal Terbentuk & Balanced
        $journal = JournalEntry::where('source_type', CashTransaction::class)
            ->where('source_id', $tx->id)
            ->first();

        $this->assertNotNull($journal);
        $this->assertCount(2, $journal->items);

        $debitItem = $journal->items->firstWhere('account_id', $this->expenseAccount->id);
        $creditItem = $journal->items->firstWhere('account_id', $this->cashAccount->id);

        $this->assertEquals(750000, (float) $debitItem->debit);
        $this->assertEquals(0, (float) $debitItem->credit);

        $this->assertEquals(0, (float) $creditItem->debit);
        $this->assertEquals(750000, (float) $creditItem->credit);
    }

    public function test_http_endpoint_store_cash_disbursement(): void
    {
        $response = $this->actingAs($this->user)
            ->post('/cash-out', [
                'fiscal_mode'        => FiscalMode::NON_PPN->value,
                'payment_account_id' => $this->cashAccount->id,
                'expense_account_id' => $this->expenseAccount->id,
                'amount'             => 250000,
                'transaction_date'   => '2026-08-18',
                'recipient'          => 'Toko ATK',
                'description'        => 'Beli kertas HVS',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('cash_transactions', [
            'amount'      => '250000.00',
            'description' => 'Beli kertas HVS',
        ]);
    }
}
