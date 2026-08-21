<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Accounting\Actions\PostJournalEntry;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JournalReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_journal_report_page_renders_with_database_journals(): void
    {
        $cashAccount = ChartOfAccount::create([
            'code' => '1110',
            'name' => 'Kas Tunai',
            'type' => \App\Domains\Accounting\Enums\AccountType::ASSET,
            'normal_balance' => \App\Domains\Accounting\Enums\NormalBalance::DEBIT,
            'is_active' => true,
        ]);

        $revenueAccount = ChartOfAccount::create([
            'code' => '4110',
            'name' => 'Pendapatan Sewa',
            'type' => \App\Domains\Accounting\Enums\AccountType::REVENUE,
            'normal_balance' => \App\Domains\Accounting\Enums\NormalBalance::CREDIT,
            'is_active' => true,
        ]);

        $postAction = new PostJournalEntry();
        $journal = $postAction->execute(
            headerData: [
                'fiscal_mode' => FiscalMode::PPN->value,
                'transaction_date' => '2026-06-15',
                'description' => 'Test Penerimaan Sewa Billboard',
            ],
            items: [
                [
                    'account_id' => $cashAccount->id,
                    'debit' => 10000000,
                    'credit' => 0,
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => 10000000,
                ],
            ]
        );

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => JournalEntry::class,
            'auditable_id' => $journal->id,
            'event' => 'created',
        ]);

        $response = $this->get(route('journal'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('JournalReport')
            ->has('initialJournals', 1)
            ->has('initialCoaList')
            ->has('auditLogs')
        );
    }
}
