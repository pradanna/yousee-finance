<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Seeders\ChartOfAccountSeeder;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountingDomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountSeeder::class);
    }

    public function test_master_coa_and_settings_are_seeded_properly(): void
    {
        $this->assertDatabaseHas('chart_of_accounts', ['code' => '1111', 'name' => 'Kas Operasional / Kas Kecil']);
        $this->assertDatabaseHas('chart_of_accounts', ['code' => '1121', 'name' => 'Piutang Dagang Client']);
        $this->assertDatabaseHas('chart_of_accounts', ['code' => '2110', 'name' => 'Hutang Dagang Vendor']);
        $this->assertDatabaseHas('chart_of_accounts', ['code' => '4100', 'name' => 'Pendapatan Sewa Media Reklame & Iklan']);
        $this->assertDatabaseHas('chart_of_accounts', ['code' => '5110', 'name' => 'Beban Sewa Titik Vendor (PO)']);

        $this->assertNotNull(AccountingSetting::getAccountId('default_receivable'));
        $this->assertNotNull(AccountingSetting::getAccountId('default_payable'));
        $this->assertNotNull(AccountingSetting::getAccountId('default_vat_output'));
    }

    public function test_strict_leaf_node_rule_prevents_posting_to_header(): void
    {
        $headerAsset = ChartOfAccount::where('code', '1000')->first();
        $bankBca = ChartOfAccount::where('code', '1112')->first();

        $this->assertFalse($headerAsset->isLeaf());
        $this->assertTrue($bankBca->isLeaf());

        $action = new PostJournalEntry();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("Cannot post to header account '1000 - Aset (Aktiva)'. Only leaf accounts can be assigned to journal entries.");

        $action->execute(
            [
                'fiscal_mode' => FiscalMode::NON_PPN,
                'transaction_date' => '2026-08-17',
                'description' => 'Test posting to header account',
            ],
            [
                ['account_id' => $headerAsset->id, 'debit' => 1000000],
                ['account_id' => $bankBca->id, 'credit' => 1000000],
            ],
        );
    }

    public function test_unbalanced_journal_entry_is_rejected(): void
    {
        $kas = ChartOfAccount::where('code', '1111')->first();
        $modal = ChartOfAccount::where('code', '3100')->first();

        $action = new PostJournalEntry();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Journal entry is not balanced.');

        $action->execute(
            [
                'fiscal_mode' => FiscalMode::NON_PPN,
                'transaction_date' => '2026-08-17',
                'description' => 'Unbalanced entry',
            ],
            [
                ['account_id' => $kas->id, 'debit' => 5000000],
                ['account_id' => $modal->id, 'credit' => 4000000], // Selisih 1.000.000
            ],
        );
    }

    public function test_successful_balanced_journal_entry_with_project_tagging(): void
    {
        $client = Client::create(['name' => 'Client Media']);
        $sales = Sales::create(['name' => 'Sales PIC', 'email' => 'sales@media.com']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-ACC-001',
            'name' => 'Project Billboard Thamrin',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'contract_value' => 111000000,
        ]);

        $piutang = ChartOfAccount::where('code', '1121')->first();
        $pendapatan = ChartOfAccount::where('code', '4100')->first();
        $ppnKeluaran = ChartOfAccount::where('code', '2121')->first();

        $action = new PostJournalEntry();
        $journal = $action->execute(
            [
                'fiscal_mode' => FiscalMode::PPN,
                'transaction_date' => '2026-08-17',
                'description' => 'Penerbitan Invoice Client Project Thamrin',
                'project_id' => $project->id,
            ],
            [
                ['account_id' => $piutang->id, 'debit' => 111000000, 'project_id' => $project->id, 'memo' => 'Piutang Invoice'],
                ['account_id' => $pendapatan->id, 'credit' => 100000000, 'project_id' => $project->id, 'memo' => 'Pendapatan Sewa'],
                ['account_id' => $ppnKeluaran->id, 'credit' => 11000000, 'project_id' => $project->id, 'memo' => 'PPN Keluaran 11%'],
            ],
        );

        $this->assertInstanceOf(JournalEntry::class, $journal);
        $this->assertEquals('JE-202608-0001', $journal->number);
        $this->assertTrue($journal->isBalanced());
        $this->assertCount(3, $journal->items);
        $this->assertEquals(111000000, (float) $journal->items->first()->debit);
    }

    public function test_posting_to_closed_period_is_blocked(): void
    {
        // Tutup periode Agustus 2026 mode PPN
        ClosingPeriod::create([
            'month' => 8,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::PPN,
            'is_closed' => true,
        ]);

        $kas = ChartOfAccount::where('code', '1111')->first();
        $modal = ChartOfAccount::where('code', '3100')->first();

        $action = new PostJournalEntry();

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Cannot post journal entry into closed accounting period 8-2026 (ppn).');

        $action->execute(
            [
                'fiscal_mode' => FiscalMode::PPN,
                'transaction_date' => '2026-08-17',
                'description' => 'Test posting to closed period',
            ],
            [
                ['account_id' => $kas->id, 'debit' => 1000000],
                ['account_id' => $modal->id, 'credit' => 1000000],
            ],
        );
    }
}
