<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Actions\IssueVendorPurchaseOrder;
use App\Domains\Procurement\Actions\SettleVendorPaymentTerm;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentSettlementManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\ChartOfAccountSeeder::class);
    }

    private function createDummyPO(FiscalMode $fiscalMode = FiscalMode::NON_PPN)
    {
        $client = Client::create(['name' => 'PT Test Client']);
        $sales = Sales::create(['name' => 'Test Sales', 'email' => 'sales@test.com']);
        $vendor = Vendor::create(['name' => 'PT Test Vendor']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-TEST-' . uniqid(),
            'name' => 'Project Test Settlement',
            'fiscal_mode' => $fiscalMode,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 50000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'code' => 'LOC-' . uniqid(),
            'type' => 'Billboard',
            'area' => 'Jakarta',
            'description' => 'Test Billboard',
            'size' => '4x8m',
            'vendor_cost' => 10000000,
            'qty' => 1,
        ]);

        return (new IssueVendorPurchaseOrder())->execute(
            $project,
            $vendor,
            [$location->id],
            '2026-09-01',
            [
                'term_scheme' => 'full',
                'term_percents' => [100],
                'term_due_dates' => ['2026-09-15'],
            ],
        );
    }

    public function test_update_payment_settlement_updates_amount_and_synchronizes_journal(): void
    {
        $user = User::factory()->create();
        $po = $this->createDummyPO();
        $term = $po->paymentPlan->terms->first();

        // 1. Catat pembayaran awal 5.000.000
        $settlement = (new SettleVendorPaymentTerm())->execute($term, [
            'amount' => 5000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank BCA',
            'payment_ref' => 'REF-001',
            'notes' => 'Pembayaran parsial 1',
        ]);

        $journal = $settlement->journalEntry;
        $this->assertNotNull($journal);
        $this->assertEquals(5000000, (float) $journal->items()->sum('debit'));
        $this->assertEquals(5000000, (float) $journal->items()->sum('credit'));

        // 2. Lakukan update via HTTP PUT
        $response = $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 7000000,
            'paid_at' => '2026-09-12',
            'payment_method' => 'Transfer Bank Mandiri',
            'payment_ref' => 'REF-001-EDIT',
            'notes' => 'Pembayaran dikoreksi ke 7jt',
            'reason' => 'Koreksi admin salah ketik',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 3. Pastikan data settlement diperbarui
        $settlement->refresh();
        $this->assertEquals(7000000, (float) $settlement->amount);
        $this->assertEquals('2026-09-12', $settlement->paid_at->format('Y-m-d'));
        $this->assertEquals('Transfer Bank Mandiri', $settlement->payment_method);
        $this->assertEquals('REF-001-EDIT', $settlement->payment_ref);

        // 4. Pastikan jurnal tersinkronisasi dan tetap balance
        $journal->refresh();
        $this->assertEquals('2026-09-12', $journal->transaction_date->format('Y-m-d'));
        $this->assertEquals(7000000, (float) $journal->items()->sum('debit'));
        $this->assertEquals(7000000, (float) $journal->items()->sum('credit'));
        $this->assertNull($journal->validateBalance()); // Balance check throws if not balanced
    }

    public function test_update_payment_settlement_recalculates_term_and_document_status(): void
    {
        $user = User::factory()->create();
        $po = $this->createDummyPO();
        $term = $po->paymentPlan->terms->first();

        // Pembayaran penuh 10.000.000 -> status PAID
        $settlement = (new SettleVendorPaymentTerm())->execute($term, [
            'amount' => 10000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        $term->refresh();
        $po->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
        $this->assertEquals(PurchaseOrderStatus::PAID, $po->status);

        // Update kurangi nominal menjadi 8.000.000 -> status harus kembali jadi UNPAID & ISSUED
        $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 8000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
            'reason' => 'Koreksi salah bayar penuh',
        ]);

        $term->refresh();
        $po->refresh();
        $this->assertEquals(PaymentTermStatus::UNPAID, $term->status);
        $this->assertEquals(PurchaseOrderStatus::ISSUED, $po->status);

        // Update naikkan lagi jadi 10.000.000 -> status harus kembali jadi PAID
        $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 10000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        $term->refresh();
        $po->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
        $this->assertEquals(PurchaseOrderStatus::PAID, $po->status);
    }

    public function test_delete_payment_settlement_removes_journal_and_recalculates_status(): void
    {
        $user = User::factory()->create();
        $po = $this->createDummyPO();
        $term = $po->paymentPlan->terms->first();

        $settlement = (new SettleVendorPaymentTerm())->execute($term, [
            'amount' => 10000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        $journalId = $settlement->journalEntry->id;

        $term->refresh();
        $po->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
        $this->assertEquals(PurchaseOrderStatus::PAID, $po->status);

        // Hapus settlement via HTTP DELETE
        $response = $this->actingAs($user)->delete(route('payment-settlements.destroy', $settlement), [
            'reason' => 'Salah input pembayaran dobel',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Settlement dan jurnal terhapus
        $this->assertDatabaseMissing('payment_settlements', ['id' => $settlement->id]);
        $this->assertDatabaseMissing('journal_entries', ['id' => $journalId]);

        // Status kembali menjadi UNPAID dan ISSUED
        $term->refresh();
        $po->refresh();
        $this->assertEquals(PaymentTermStatus::UNPAID, $term->status);
        $this->assertEquals(PurchaseOrderStatus::ISSUED, $po->status);
        $this->assertEquals(0, $term->paidAmount());
    }

    public function test_update_settlement_fails_when_exceeding_term_limit(): void
    {
        $user = User::factory()->create();
        $po = $this->createDummyPO();
        $term = $po->paymentPlan->terms->first();

        $settlement = (new SettleVendorPaymentTerm())->execute($term, [
            'amount' => 5000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        // Termin total 10.000.000, kita ubah settlement jadi 15.000.000 -> harus error
        $response = $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 15000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        $response->assertSessionHasErrors('amount');
        $settlement->refresh();
        $this->assertEquals(5000000, (float) $settlement->amount);
    }

    public function test_update_settlement_blocked_when_period_is_closed(): void
    {
        $user = User::factory()->create();
        $po = $this->createDummyPO(FiscalMode::NON_PPN);
        $term = $po->paymentPlan->terms->first();

        $settlement = (new SettleVendorPaymentTerm())->execute($term, [
            'amount' => 5000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank',
        ]);

        // Tutup / kunci periode September 2026
        ClosingPeriod::create([
            'month' => 9,
            'year' => 2026,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'is_closed' => true,
            'closed_at' => now(),
            'closed_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 6000000,
            'paid_at' => '2026-09-12',
            'payment_method' => 'Transfer Bank',
        ]);

        $response->assertSessionHasErrors('amount');
        $settlement->refresh();
        $this->assertEquals(5000000, (float) $settlement->amount);
    }

    private function createDummyInvoice(FiscalMode $fiscalMode = FiscalMode::NON_PPN)
    {
        $client = Client::create(['name' => 'PT Client Invoice Test']);
        $sales = Sales::create(['name' => 'Sales Invoice PIC', 'email' => 'salespic@test.com']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-INV-' . uniqid(),
            'name' => 'Project Test Invoice Settlement',
            'fiscal_mode' => $fiscalMode,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 50000000,
        ]);

        $invoice = (new \App\Domains\Billing\Actions\CreateClientInvoice())->execute($project);
        (new \App\Domains\Billing\Actions\GeneratePaymentTerms())->execute(
            $invoice,
            \App\Domains\Billing\Enums\PaymentScheme::FULL,
            [100],
            ['2026-09-15'],
            'Pelunasan 100%',
        );
        (new \App\Domains\Billing\Actions\IssueClientInvoice())->execute($project);

        return $invoice->fresh(['paymentPlan.terms']);
    }

    public function test_update_client_invoice_payment_settlement_updates_amount_and_synchronizes_journal(): void
    {
        $user = User::factory()->create();
        $invoice = $this->createDummyInvoice();
        $term = $invoice->paymentPlan->terms->first();

        // 1. Settle 25.000.000
        $settlement = (new \App\Domains\Billing\Actions\SettleClientPaymentTerm())->execute($term, [
            'amount' => 25000000,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank BCA',
            'payment_ref' => 'INV-TRF-001',
            'notes' => 'Pembayaran termin 1 klien',
        ]);

        $journal = $settlement->journalEntry;
        $this->assertNotNull($journal);
        $this->assertEquals(25000000, (float) $journal->items()->sum('debit'));
        $this->assertEquals(25000000, (float) $journal->items()->sum('credit'));

        // 2. Update via HTTP PUT menjadi 35.000.000
        $response = $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 35000000,
            'paid_at' => '2026-09-12',
            'payment_method' => 'Transfer Bank Mandiri',
            'payment_ref' => 'INV-TRF-001-KOREKSI',
            'notes' => 'Koreksi nilai transfer',
            'reason' => 'Salah catat mutasi masuk',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Pastikan settlement dan jurnal terupdate seimbang
        $settlement->refresh();
        $this->assertEquals(35000000, (float) $settlement->amount);
        $journal->refresh();
        $this->assertEquals(35000000, (float) $journal->items()->sum('debit'));
        $this->assertEquals(35000000, (float) $journal->items()->sum('credit'));

        // 3. Lunasi penuh 50.000.000 -> status Invoice & Term jadi PAID
        $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 50000000,
            'paid_at' => '2026-09-12',
            'payment_method' => 'Transfer Bank Mandiri',
        ]);

        $term->refresh();
        $invoice->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
        $this->assertEquals(\App\Domains\Billing\Enums\InvoiceStatus::PAID, $invoice->status);

        // 4. Turunkan kembali nominal jadi 40.000.000 -> status Invoice kembali ISSUED
        $this->actingAs($user)->put(route('payment-settlements.update', $settlement), [
            'amount' => 40000000,
            'paid_at' => '2026-09-12',
            'payment_method' => 'Transfer Bank Mandiri',
        ]);

        $term->refresh();
        $invoice->refresh();
        $this->assertEquals(PaymentTermStatus::UNPAID, $term->status);
        $this->assertEquals(\App\Domains\Billing\Enums\InvoiceStatus::ISSUED, $invoice->status);
    }
}

