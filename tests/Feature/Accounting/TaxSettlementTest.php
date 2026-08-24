<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\TaxSettlement;
use App\Domains\Identity\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxSettlementTest extends TestCase
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

    public function test_can_record_tax_settlement_ntpn_and_post_balanced_journal(): void
    {
        $payload = [
            'month'              => 8,
            'year'               => 2026,
            'fiscal_mode'        => 'ppn',
            'ntpn'               => 'ABC123XYZ4567890',
            'paid_date'          => '2026-08-24',
            'bank_name'          => 'Bank Mandiri Solo Baru',
            'ppn_keluaran_total' => 15000000.0,
            'ppn_masukan_total'  => 5000000.0,
            'net_amount'         => 10000000.0,
        ];

        $response = $this->actingAs($this->user)->post(route('ppn.settle'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $settlement = TaxSettlement::where('ntpn', 'ABC123XYZ4567890')->first();
        $this->assertNotNull($settlement);
        $this->assertEquals(8, $settlement->month);
        $this->assertEquals(2026, $settlement->year);
        $this->assertEquals(10000000.0, $settlement->net_amount);

        // Verify Journal Entry was automatically created and is balanced
        $journal = JournalEntry::where('source_type', TaxSettlement::class)
            ->where('source_id', $settlement->id)
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());
        $this->assertCount(2, $journal->items);

        // Verify Debit: PPN Keluaran (2121) = 10,000,000
        $debitItem = $journal->items->where('debit', '>', 0)->first();
        $this->assertNotNull($debitItem);
        $this->assertEquals(10000000.0, (float) $debitItem->debit);
        $this->assertEquals('2121', $debitItem->account->code);

        // Verify Credit: Bank Mandiri (1113) = 10,000,000
        $creditItem = $journal->items->where('credit', '>', 0)->first();
        $this->assertNotNull($creditItem);
        $this->assertEquals(10000000.0, (float) $creditItem->credit);
        $this->assertEquals('1113', $creditItem->account->code);

        // Verify Audit Log
        $this->assertDatabaseHas('audit_logs', [
            'event'          => 'TAX_SETTLEMENT_PAID',
            'auditable_type' => TaxSettlement::class,
            'auditable_id'   => $settlement->id,
        ]);
    }

    public function test_settling_same_period_updates_existing_record_and_updates_journal(): void
    {
        $payload1 = [
            'month'              => 8,
            'year'               => 2026,
            'fiscal_mode'        => 'ppn',
            'ntpn'               => 'OLD1234567890123',
            'paid_date'          => '2026-08-20',
            'bank_name'          => 'Bank BCA Operasional',
            'ppn_keluaran_total' => 15000000.0,
            'ppn_masukan_total'  => 5000000.0,
            'net_amount'         => 10000000.0,
        ];

        $this->actingAs($this->user)->post(route('ppn.settle'), $payload1);

        $this->assertDatabaseCount('tax_settlements', 1);
        $this->assertDatabaseCount('journal_entries', 1);

        $payload2 = [
            'month'              => 8,
            'year'               => 2026,
            'fiscal_mode'        => 'ppn',
            'ntpn'               => 'NEW9999999999999',
            'paid_date'          => '2026-08-24',
            'bank_name'          => 'Bank Mandiri Solo Baru',
            'ppn_keluaran_total' => 18000000.0,
            'ppn_masukan_total'  => 6000000.0,
            'net_amount'         => 12000000.0,
        ];

        $response = $this->actingAs($this->user)->post(route('ppn.settle'), $payload2);

        $response->assertRedirect();
        $this->assertDatabaseCount('tax_settlements', 1);
        $this->assertDatabaseCount('journal_entries', 1);

        $this->assertDatabaseHas('tax_settlements', [
            'month' => 8,
            'year'  => 2026,
            'ntpn'  => 'NEW9999999999999',
        ]);

        $settlement = TaxSettlement::first();
        $journal = JournalEntry::where('source_type', TaxSettlement::class)
            ->where('source_id', $settlement->id)
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());
        $debitItem = $journal->items->where('debit', '>', 0)->first();
        $this->assertEquals(12000000.0, (float) $debitItem->debit);
    }

    public function test_tax_settlement_validation_fails_on_missing_required_fields(): void
    {
        $response = $this->actingAs($this->user)->post(route('ppn.settle'), [
            'month' => 15, // Invalid month
        ]);

        $response->assertSessionHasErrors(['month', 'year', 'ntpn', 'paid_date', 'bank_name']);
    }

    public function test_cannot_settle_tax_in_locked_closing_period(): void
    {
        \App\Domains\Accounting\Models\ClosingPeriod::create([
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => 'ppn',
            'is_closed'   => true,
            'closed_at'   => now(),
            'closed_by'   => $this->user->id,
        ]);

        $payload = [
            'month'              => 8,
            'year'               => 2026,
            'fiscal_mode'        => 'ppn',
            'ntpn'               => 'LOCKED1234567890',
            'paid_date'          => '2026-08-24',
            'bank_name'          => 'Bank Mandiri Solo Baru',
            'ppn_keluaran_total' => 15000000.0,
            'ppn_masukan_total'  => 5000000.0,
            'net_amount'         => 10000000.0,
        ];

        $response = $this->actingAs($this->user)->post(route('ppn.settle'), $payload);

        $response->assertRedirect();
        $response->assertSessionHasErrors('error');
        $this->assertDatabaseMissing('tax_settlements', [
            'ntpn' => 'LOCKED1234567890',
        ]);
    }

    public function test_ppn_report_index_loads_tax_settlements_and_locked_periods(): void
    {
        TaxSettlement::create([
            'month'              => 8,
            'year'               => 2026,
            'fiscal_mode'        => 'ppn',
            'ntpn'               => 'TEST123456789012',
            'paid_date'          => '2026-08-24',
            'bank_name'          => 'Bank Mandiri Solo Baru',
            'ppn_keluaran_total' => 10000000,
            'ppn_masukan_total'  => 2000000,
            'net_amount'         => 8000000,
            'status'             => 'paid',
            'created_by'         => $this->user->id,
        ]);

        \App\Domains\Accounting\Models\ClosingPeriod::create([
            'month'       => 8,
            'year'        => 2026,
            'fiscal_mode' => 'ppn',
            'is_closed'   => true,
            'closed_at'   => now(),
            'closed_by'   => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->get(route('ppn'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('PpnReport')
            ->has('initialTaxSettlements', 1)
            ->where('initialTaxSettlements.0.ntpn', 'TEST123456789012')
            ->has('lockedPeriods', 1)
            ->where('lockedPeriods.0.month', 8)
            ->where('lockedPeriods.0.year', 2026)
        );
    }
}
