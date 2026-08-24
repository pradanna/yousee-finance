<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Actions\GetCashflowReportData;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashflowReportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ChartOfAccount $bcaAccount;
    private ChartOfAccount $mandiriAccount;
    private ChartOfAccount $receivableAccount;
    private ChartOfAccount $payableAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);

        $this->user = User::factory()->create([
            'email' => 'finance.officer@yousee.co.id',
        ]);

        $this->bcaAccount = ChartOfAccount::where('code', '1112')->firstOrFail();
        $this->mandiriAccount = ChartOfAccount::where('code', '1113')->firstOrFail();
        $this->receivableAccount = ChartOfAccount::where('code', '1121')->firstOrFail();
        $this->payableAccount = ChartOfAccount::where('code', '2110')->firstOrFail();
    }

    public function test_cashflow_report_page_renders_with_real_database_records(): void
    {
        // 1. Catat Transaksi Penerimaan Piutang (Inflow BCA)
        $inflowJournal = JournalEntry::create([
            'number'           => 'JRN-TEST-IN-001',
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => '2026-08-15',
            'description'      => 'Pelunasan Invoice Client Tokopedia',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $inflowJournal->id,
            'account_id'       => $this->bcaAccount->id,
            'debit'            => 15000000.0,
            'credit'           => 0,
            'memo'             => 'Penerimaan BCA',
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $inflowJournal->id,
            'account_id'       => $this->receivableAccount->id,
            'debit'            => 0,
            'credit'           => 15000000.0,
            'memo'             => 'Pelunasan Piutang',
        ]);

        // 2. Catat Transaksi Pembayaran Vendor (Outflow Mandiri)
        $outflowJournal = JournalEntry::create([
            'number'           => 'JRN-TEST-OUT-001',
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => '2026-08-18',
            'description'      => 'Pembayaran PO Vendor Billboard',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $outflowJournal->id,
            'account_id'       => $this->payableAccount->id,
            'debit'            => 5000000.0,
            'credit'           => 0,
            'memo'             => 'Pelunasan Hutang PO',
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $outflowJournal->id,
            'account_id'       => $this->mandiriAccount->id,
            'debit'            => 0,
            'credit'           => 5000000.0,
            'memo'             => 'Pembayaran dari Mandiri',
        ]);

        $response = $this->actingAs($this->user)->get(route('cashflow', [
            'month' => 8,
            'year'  => 2026,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('CashflowReport')
            ->has('initialCashflowData')
            ->where('initialCashflowData.totalInflow', 15000000)
            ->where('initialCashflowData.totalOutflow', 5000000)
            ->where('initialCashflowData.endingBalance', 10000000)
            ->has('initialCashflowData.entries', 2)
        );
    }

    public function test_cashflow_action_calculates_beginning_and_ending_balances(): void
    {
        // Mutasi Bulan Juli 2026 (Bulan Sebelum Periode Agustus)
        $julyJournal = JournalEntry::create([
            'number'           => 'JRN-JULY-001',
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => '2026-07-20',
            'description'      => 'Penerimaan Juli',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $julyJournal->id,
            'account_id'       => $this->bcaAccount->id,
            'debit'            => 25000000.0,
            'credit'           => 0,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $julyJournal->id,
            'account_id'       => $this->receivableAccount->id,
            'debit'            => 0,
            'credit'           => 25000000.0,
        ]);

        // Mutasi Bulan Agustus 2026
        $augJournal = JournalEntry::create([
            'number'           => 'JRN-AUG-001',
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => '2026-08-10',
            'description'      => 'Pengeluaran Agustus',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $augJournal->id,
            'account_id'       => $this->payableAccount->id,
            'debit'            => 10000000.0,
            'credit'           => 0,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $augJournal->id,
            'account_id'       => $this->bcaAccount->id,
            'debit'            => 0,
            'credit'           => 10000000.0,
        ]);

        $action = new GetCashflowReportData();
        $result = $action->execute([
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => 'ppn',
        ]);

        $this->assertEquals(25000000.0, $result['beginningBalance']);
        $this->assertEquals(0.0, $result['totalInflow']);
        $this->assertEquals(10000000.0, $result['totalOutflow']);
        $this->assertEquals(15000000.0, $result['endingBalance']);
    }

    public function test_cashflow_handles_inter_bank_internal_transfers_without_distorting_psak(): void
    {
        // Transfer dana Mandiri (1113) -> BCA (1112) sebesar Rp 10.000.000
        $transferJournal = JournalEntry::create([
            'number'           => 'JRN-TRANSFER-001',
            'fiscal_mode'      => FiscalMode::NON_PPN,
            'transaction_date' => '2026-08-12',
            'description'      => 'Pemindahan Dana Mandiri ke BCA Operasional',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $transferJournal->id,
            'account_id'       => $this->bcaAccount->id,
            'debit'            => 10000000.0,
            'credit'           => 0,
            'memo'             => 'Terima Transfer Mandiri',
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $transferJournal->id,
            'account_id'       => $this->mandiriAccount->id,
            'debit'            => 0,
            'credit'           => 10000000.0,
            'memo'             => 'Kirim Transfer ke BCA',
        ]);

        $action = new GetCashflowReportData();
        $result = $action->execute([
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => 'non-ppn',
        ]);

        // Total Inflow & Outflow konsolidasi PSAK harus 0 karena ini transfer internal
        $this->assertEquals(0.0, $result['totalInflow']);
        $this->assertEquals(0.0, $result['totalOutflow']);
        $this->assertEquals(0.0, $result['psak']['netCashMovement']);

        // Kedua baris mutasi harus berstatus isInternalTransfer = true
        $this->assertCount(2, $result['entries']);
        $this->assertTrue($result['entries'][0]['isInternalTransfer']);
        $this->assertTrue($result['entries'][1]['isInternalTransfer']);
    }

    public function test_cashflow_pdf_export_streams_pdf_document(): void
    {
        $response = $this->actingAs($this->user)->post(route('cashflow.pdf'), [
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => 'ppn',
        ]);

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    public function test_cashflow_report_loads_locked_periods(): void
    {
        ClosingPeriod::create([
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => FiscalMode::PPN,
            'is_closed'   => true,
            'closed_at'   => now(),
            'closed_by'   => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('cashflow', [
            'month' => 8,
            'year'  => 2026,
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('CashflowReport')
            ->has('lockedPeriods', 1)
            ->where('lockedPeriods.0.month', 8)
            ->where('lockedPeriods.0.year', 2026)
        );
    }
}
