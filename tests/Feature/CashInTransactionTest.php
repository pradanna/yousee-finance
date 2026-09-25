<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Accounting\Actions\CreateCashInTransaction;
use App\Domains\Accounting\Actions\VoidCashInTransaction;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use App\Domains\Accounting\Models\CashInTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashInTransactionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ChartOfAccount $bankAccount;
    private ChartOfAccount $equityAccount;
    private ChartOfAccount $liabilityAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        // 1. Akun Header & Leaf Kas/Bank (Aset)
        $hAsset = ChartOfAccount::create([
            'code'           => '1000',
            'name'           => 'Aset',
            'type'           => AccountType::ASSET,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active'      => true,
        ]);

        $this->bankAccount = ChartOfAccount::create([
            'parent_id'      => $hAsset->id,
            'code'           => '1112',
            'name'           => 'Bank BCA Operasional',
            'type'           => AccountType::ASSET,
            'normal_balance' => NormalBalance::DEBIT,
            'is_active'      => true,
        ]);

        // 2. Akun Header & Leaf Ekuitas (Modal Disetor)
        $hEquity = ChartOfAccount::create([
            'code'           => '3000',
            'name'           => 'Ekuitas',
            'type'           => AccountType::EQUITY,
            'normal_balance' => NormalBalance::CREDIT,
            'is_active'      => true,
        ]);

        $this->equityAccount = ChartOfAccount::create([
            'parent_id'      => $hEquity->id,
            'code'           => '3100',
            'name'           => 'Modal Disetor Pemilik',
            'type'           => AccountType::EQUITY,
            'normal_balance' => NormalBalance::CREDIT,
            'is_active'      => true,
        ]);

        // 3. Akun Header & Leaf Hutang Non-Vendor (Pinjaman Owner)
        $hLiability = ChartOfAccount::create([
            'code'           => '2000',
            'name'           => 'Kewajiban',
            'type'           => AccountType::LIABILITY,
            'normal_balance' => NormalBalance::CREDIT,
            'is_active'      => true,
        ]);

        $this->liabilityAccount = ChartOfAccount::create([
            'parent_id'      => $hLiability->id,
            'code'           => '2119',
            'name'           => 'Hutang Non-Vendor Lainnya',
            'type'           => AccountType::LIABILITY,
            'normal_balance' => NormalBalance::CREDIT,
            'is_active'      => true,
        ]);
    }

    public function test_can_record_cash_in_from_owner_capital_deposit(): void
    {
        $action = new CreateCashInTransaction();

        $tx = $action->execute([
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'deposit_account_id' => $this->bankAccount->id,
            'source_account_id'  => $this->equityAccount->id,
            'amount'             => 50_000_000,
            'transaction_date'   => '2026-09-23',
            'payer'              => 'Owner - Bapak Jojo',
            'description'        => 'Setoran modal awal usaha',
            'created_by'         => $this->user->id,
        ]);

        $this->assertInstanceOf(CashInTransaction::class, $tx);
        $this->assertStringStartsWith('IN-202609-', $tx->transaction_number);
        $this->assertEquals(50_000_000, (float) $tx->amount);
        $this->assertEquals('active', $tx->status);

        // Verifikasi Jurnal Akuntansi otomatis
        $journal = JournalEntry::where('source_type', CashInTransaction::class)
            ->where('source_id', $tx->id)
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());

        // Verifikasi Debet Bank BCA Rp 50.000.000
        $debitItem = $journal->items()->where('account_id', $this->bankAccount->id)->first();
        $this->assertNotNull($debitItem);
        $this->assertEquals(50_000_000, (float) $debitItem->debit);
        $this->assertEquals(0, (float) $debitItem->credit);

        // Verifikasi Kredit Modal Disetor Rp 50.000.000
        $creditItem = $journal->items()->where('account_id', $this->equityAccount->id)->first();
        $this->assertNotNull($creditItem);
        $this->assertEquals(0, (float) $creditItem->debit);
        $this->assertEquals(50_000_000, (float) $creditItem->credit);
    }

    public function test_cash_in_increases_bank_balance_in_real_time(): void
    {
        $action = new CreateCashInTransaction();

        $action->execute([
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'deposit_account_id' => $this->bankAccount->id,
            'source_account_id'  => $this->equityAccount->id,
            'amount'             => 100_000_000,
            'transaction_date'   => '2026-09-23',
            'payer'              => 'Owner',
            'description'        => 'Suntikan modal kerja',
            'created_by'         => $this->user->id,
        ]);

        // Hitung Saldo Berjalan (Debet - Kredit)
        $totalDebit = (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('debit');
        $totalCredit = (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('credit');
        $balance = $totalDebit - $totalCredit;

        $this->assertEquals(100_000_000, $balance);
    }

    public function test_cannot_record_cash_in_in_closed_period(): void
    {
        ClosingPeriod::create([
            'month'       => 9,
            'year'        => 2026,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'is_closed'   => true,
            'closed_at'   => now(),
            'closed_by'   => $this->user->id,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Periode akuntansi 9-2026 (non-ppn) telah ditutup.');

        $action = new CreateCashInTransaction();
        $action->execute([
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'deposit_account_id' => $this->bankAccount->id,
            'source_account_id'  => $this->equityAccount->id,
            'amount'             => 10_000_000,
            'transaction_date'   => '2026-09-15',
            'description'        => 'Setoran modal',
            'created_by'         => $this->user->id,
        ]);
    }

    public function test_can_void_cash_in_transaction_and_restore_balance(): void
    {
        $createAction = new CreateCashInTransaction();

        $tx = $createAction->execute([
            'fiscal_mode'        => FiscalMode::NON_PPN,
            'deposit_account_id' => $this->bankAccount->id,
            'source_account_id'  => $this->liabilityAccount->id,
            'amount'             => 25_000_000,
            'transaction_date'   => '2026-09-20',
            'payer'              => 'Owner',
            'description'        => 'Pinjaman sementara owner',
            'created_by'         => $this->user->id,
        ]);

        // Saldo awal = 25M
        $balanceBefore = (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('debit')
            - (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('credit');
        $this->assertEquals(25_000_000, $balanceBefore);

        // Lakukan pembatalan (Void)
        $voidAction = new VoidCashInTransaction();
        $voidAction->execute($tx, 'Salah input nominal rekening', $this->user->id);

        $tx->refresh();
        $this->assertEquals('voided', $tx->status);
        $this->assertEquals('Salah input nominal rekening', $tx->void_reason);

        // Verifikasi saldo kas kembali 0 (karena ada kredit 25M dari jurnal pembalik)
        $balanceAfter = (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('debit')
            - (float) JournalEntryItem::where('account_id', $this->bankAccount->id)->sum('credit');
        $this->assertEquals(0, $balanceAfter);
    }

    public function test_http_store_and_index_cash_in(): void
    {
        $response = $this->actingAs($this->user)->post(route('cash-in.store'), [
            'fiscal_mode'        => 'non-ppn',
            'deposit_account_id' => $this->bankAccount->id,
            'source_account_id'  => $this->equityAccount->id,
            'amount'             => 75_000_000,
            'transaction_date'   => '2026-09-23',
            'payer'              => 'Investor Utama',
            'description'        => 'Penyertaan modal tahap 1',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('cash_in_transactions', [
            'amount'      => 75_000_000,
            'payer'       => 'Investor Utama',
            'description' => 'Penyertaan modal tahap 1',
        ]);

        // Cek halaman index
        $indexResponse = $this->actingAs($this->user)->get(route('cash-in'));
        $indexResponse->assertStatus(200);
        $indexResponse->assertInertia(fn ($page) => $page->component('CashIn')
            ->has('transactions.data', 1)
            ->has('depositAccounts')
            ->has('sourceAccounts')
            ->has('metrics')
        );
    }
}
