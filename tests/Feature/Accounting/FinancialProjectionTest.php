<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\JournalEntry;
use App\Domains\Accounting\Models\JournalEntryItem;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\PaymentPlan;
use App\Domains\Billing\Models\PaymentTerm;
use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FinancialProjectionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private ChartOfAccount $bcaAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ChartOfAccountSeeder::class);

        $this->user = User::factory()->create([
            'email' => 'admin.finance@yousee.co.id',
        ]);

        $this->bcaAccount = ChartOfAccount::where('code', '1112')->firstOrFail();
    }

    public function test_financial_projection_page_requires_authentication(): void
    {
        $response = $this->get('/projection');
        $response->assertRedirect('/login');
    }

    public function test_financial_projection_page_renders_successfully(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/projection');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FinancialProjection')
            ->has('projection')
            ->has('projection.summary')
            ->has('projection.timeline')
            ->has('projection.inflow_items')
            ->has('projection.outflow_items')
        );
    }

    public function test_financial_projection_calculates_inflows_and_outflows_accurately(): void
    {
        // 1. Saldo Awal Kas: 100.000.000 via Jurnal Masuk
        $journal = JournalEntry::create([
            'number'           => 'JRN-TEST-INIT-001',
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'description'      => 'Modal / Saldo Kas Awal',
            'posted_by'        => $this->user->id,
        ]);

        JournalEntryItem::create([
            'journal_entry_id' => $journal->id,
            'account_id'       => $this->bcaAccount->id,
            'debit'            => 100000000.0,
            'credit'           => 0,
            'memo'             => 'Saldo Awal BCA',
        ]);

        // 2. Buat Invoice Klien aktif dengan termin due 5 hari kedepan: 50.000.000
        $client = Client::create(['name' => 'PT Klien Maju Jaya']);
        $sales = Sales::create(['name' => 'Sales Representative']);

        $invoice = Invoice::create([
            'invoice_number'   => 'INV-2026-TEST01',
            'client_id'        => $client->id,
            'sales_id'         => $sales->id,
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'status'           => InvoiceStatus::ISSUED,
            'subtotal'         => 45045045.0,
            'ppn'              => 4954955.0,
            'total'            => 50000000.0,
        ]);

        $invoicePlan = PaymentPlan::create([
            'payable_type' => Invoice::class,
            'payable_id'   => $invoice->id,
            'scheme'       => PaymentScheme::FULL,
            'total_amount' => 50000000.0,
        ]);

        PaymentTerm::create([
            'payment_plan_id' => $invoicePlan->id,
            'sort_order'      => 1,
            'label'           => 'Pelunasan 100%',
            'amount'          => 50000000.0,
            'percent'         => 100.0,
            'due_date'        => now()->addDays(5)->toDateString(),
            'status'          => PaymentTermStatus::UNPAID,
        ]);

        // 3. Buat Purchase Order aktif dengan termin due 7 hari kedepan: 20.000.000
        $vendor = Vendor::create(['name' => 'CV Vendor Konstruksi']);

        $po = PurchaseOrder::create([
            'po_number'        => 'PO-2026-TEST01',
            'vendor_id'        => $vendor->id,
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'status'           => PurchaseOrderStatus::ISSUED,
            'subtotal'         => 18018018.0,
            'ppn'              => 1981982.0,
            'total'            => 20000000.0,
        ]);

        $poPlan = PaymentPlan::create([
            'payable_type' => PurchaseOrder::class,
            'payable_id'   => $po->id,
            'scheme'       => PaymentScheme::FULL,
            'total_amount' => 20000000.0,
        ]);

        PaymentTerm::create([
            'payment_plan_id' => $poPlan->id,
            'sort_order'      => 1,
            'label'           => 'Termin Vendor 100%',
            'amount'          => 20000000.0,
            'percent'         => 100.0,
            'due_date'        => now()->addDays(7)->toDateString(),
            'status'          => PaymentTermStatus::UNPAID,
        ]);

        // 4. Request /projection?days=14
        $response = $this->actingAs($this->user)
            ->get('/projection?days=14');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FinancialProjection')
            ->where('projection.summary.current_cash_balance', fn ($v) => (float) $v === 100000000.0)
            ->where('projection.summary.projected_inflow_total', fn ($v) => (float) $v === 50000000.0)
            ->where('projection.summary.projected_outflow_po_total', fn ($v) => (float) $v === 20000000.0)
            ->has('projection.inflow_items', 1)
            ->has('projection.outflow_items')
            ->has('projection.timeline', 15) // today + 14 days = 15 points
        );
    }

    public function test_financial_projection_filters_by_days(): void
    {
        $vendor = Vendor::create(['name' => 'CV Vendor Jauh']);

        $po = PurchaseOrder::create([
            'po_number'        => 'PO-2026-FAR',
            'vendor_id'        => $vendor->id,
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'status'           => PurchaseOrderStatus::ISSUED,
            'subtotal'         => 9009009.0,
            'ppn'              => 990991.0,
            'total'            => 10000000.0,
        ]);

        $poPlan = PaymentPlan::create([
            'payable_type' => PurchaseOrder::class,
            'payable_id'   => $po->id,
            'scheme'       => PaymentScheme::FULL,
            'total_amount' => 10000000.0,
        ]);

        // Due in 10 days
        PaymentTerm::create([
            'payment_plan_id' => $poPlan->id,
            'sort_order'      => 1,
            'label'           => 'Termin 10 Hari',
            'amount'          => 10000000.0,
            'percent'         => 100.0,
            'due_date'        => now()->addDays(10)->toDateString(),
            'status'          => PaymentTermStatus::UNPAID,
        ]);

        // With days=7, should NOT be included
        $response7 = $this->actingAs($this->user)
            ->get('/projection?days=7');

        $response7->assertOk();
        $response7->assertInertia(fn (Assert $page) => $page
            ->where('projection.summary.projected_outflow_po_total', fn ($v) => (float) $v === 0.0)
            ->has('projection.timeline', 8) // today + 7 days = 8
        );

        // With days=14, SHOULD be included
        $response14 = $this->actingAs($this->user)
            ->get('/projection?days=14');

        $response14->assertOk();
        $response14->assertInertia(fn (Assert $page) => $page
            ->where('projection.summary.projected_outflow_po_total', fn ($v) => (float) $v === 10000000.0)
            ->has('projection.timeline', 15) // today + 14 days = 15
        );
    }

    public function test_financial_projection_estimates_ppn_settlement_when_crossing_month_end(): void
    {
        // Buat Invoice dengan PPN Keluaran di bulan ini
        $client = Client::create(['name' => 'PT Klien PPN']);
        $sales = Sales::create(['name' => 'Sales PPN']);

        Invoice::create([
            'invoice_number'   => 'INV-PPN-001',
            'client_id'        => $client->id,
            'sales_id'         => $sales->id,
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'status'           => InvoiceStatus::ISSUED,
            'subtotal'         => 100000000.0,
            'ppn'              => 11000000.0,
            'total'            => 111000000.0,
        ]);

        // Buat PO dengan PPN Masukan di bulan ini
        $vendor = Vendor::create(['name' => 'CV Vendor PPN']);

        PurchaseOrder::create([
            'po_number'        => 'PO-PPN-001',
            'vendor_id'        => $vendor->id,
            'fiscal_mode'      => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'status'           => PurchaseOrderStatus::ISSUED,
            'subtotal'         => 40000000.0,
            'ppn'              => 4400000.0,
            'total'            => 44400000.0,
        ]);

        // Net PPN Kurang Bayar = 11.000.000 - 4.400.000 = 6.600.000
        // Query dengan days=31 (pasti menyeberangi akhir bulan)
        $response = $this->actingAs($this->user)
            ->get('/projection?days=31&fiscal_mode=ppn');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('projection.summary.crosses_month_end', true)
            ->where('projection.summary.ppn_keluaran_total', fn ($v) => (float) $v === 11000000.0)
            ->where('projection.summary.ppn_masukan_total', fn ($v) => (float) $v === 4400000.0)
            ->where('projection.summary.ppn_net_payable', fn ($v) => (float) $v === 6600000.0)
            ->where('projection.summary.projected_outflow_ppn_total', fn ($v) => (float) $v === 6600000.0)
            ->where('projection.outflow_items', fn ($items) => collect($items)->contains('type', 'ppn'))
        );
    }
}

