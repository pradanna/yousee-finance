<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentSettlement;
use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Actions\IssueVendorPurchaseOrder;
use App\Domains\Procurement\Actions\SettleVendorPaymentTerm;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorPaymentSettlementTest extends TestCase
{
    use RefreshDatabase;

    public function test_issue_vendor_po_generates_payment_plan_and_terms(): void
    {
        $client = Client::create(['name' => 'PT Client Satu']);
        $sales = Sales::create(['name' => 'Sales PIC', 'email' => 'sales1@yousee.com']);
        $vendor = Vendor::create(['name' => 'PT Vendor Cemerlang']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-TEST-001',
            'name' => 'Project Billboard A',
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'contract_value' => 50000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'code' => 'LOC-001',
            'type' => 'Billboard',
            'area' => 'Jakarta',
            'description' => 'Billboard Bundaran HI',
            'size' => '4x8m',
            'vendor_cost' => 20000000,
            'qty' => 1,
        ]);

        $action = new IssueVendorPurchaseOrder();
        $po = $action->execute(
            $project,
            $vendor,
            [$location->id],
            '2026-08-17',
            [
                'term_scheme' => 'dp',
                'term_percents' => [50, 50],
                'term_due_dates' => ['2026-08-17', '2026-09-17'],
                'top_notes' => 'DP 50% & Pelunasan 50%',
            ],
        );

        $this->assertInstanceOf(PurchaseOrder::class, $po);
        $this->assertNotNull($po->paymentPlan);
        $this->assertEquals(PaymentScheme::DP, $po->paymentPlan->scheme);
        $this->assertEquals(20000000, (float) $po->paymentPlan->total_amount);
        $this->assertCount(2, $po->paymentPlan->terms);

        $term1 = $po->paymentPlan->terms->first();
        $this->assertEquals(10000000, (float) $term1->amount);
        $this->assertEquals(PaymentTermStatus::UNPAID, $term1->status);
    }

    public function test_settle_vendor_payment_term_partial_and_full(): void
    {
        $client = Client::create(['name' => 'PT Client Dua']);
        $sales = Sales::create(['name' => 'Sales PIC 2', 'email' => 'sales2@yousee.com']);
        $vendor = Vendor::create(['name' => 'PT Vendor Cemerlang']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-TEST-002',
            'name' => 'Project Billboard B',
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'contract_value' => 50000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'code' => 'LOC-002',
            'type' => 'Videotron',
            'area' => 'Surabaya',
            'description' => 'Videotron Tunjungan',
            'size' => '6x12m',
            'vendor_cost' => 10000000,
            'qty' => 1,
        ]);

        $po = (new IssueVendorPurchaseOrder())->execute(
            $project,
            $vendor,
            [$location->id],
            '2026-08-17',
            [
                'term_scheme' => 'full',
                'term_percents' => [100],
                'term_due_dates' => ['2026-08-17'],
            ],
        );

        $term = $po->paymentPlan->terms->first();
        $settleAction = new SettleVendorPaymentTerm();

        // 1. Partial Settlement
        $settlement1 = $settleAction->execute($term, [
            'amount' => 4000000,
            'paid_at' => '2026-08-17',
            'payment_method' => 'Transfer Bank BCA',
            'payment_ref' => 'TRX-001',
        ]);

        $this->assertInstanceOf(PaymentSettlement::class, $settlement1);
        $term->refresh();
        $this->assertEquals(PaymentTermStatus::UNPAID, $term->status);
        $this->assertEquals(4000000, $term->paidAmount());

        // 2. Full Settlement (melunasi sisa 6.000.000)
        $settlement2 = $settleAction->execute($term, [
            'amount' => 6000000,
            'paid_at' => '2026-08-18',
            'payment_method' => 'Transfer Bank Mandiri',
            'payment_ref' => 'TRX-002',
        ]);

        $this->assertInstanceOf(PaymentSettlement::class, $settlement2);
        $term->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
        $this->assertEquals(10000000, $term->paidAmount());
    }

    public function test_vendor_payment_settle_http_endpoint(): void
    {
        $user = User::factory()->create();
        $client = Client::create(['name' => 'PT Client Tiga']);
        $sales = Sales::create(['name' => 'Sales PIC 3', 'email' => 'sales3@yousee.com']);
        $vendor = Vendor::create(['name' => 'PT Vendor Prima']);
        $project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-TEST-003',
            'name' => 'Project Billboard C',
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-31',
            'contract_value' => 30000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'code' => 'LOC-003',
            'type' => 'Baliho',
            'area' => 'Bandung',
            'description' => 'Baliho Pasteur',
            'size' => '5x10m',
            'vendor_cost' => 15000000,
            'qty' => 1,
        ]);

        $po = (new IssueVendorPurchaseOrder())->execute(
            $project,
            $vendor,
            [$location->id],
            '2026-08-17',
            [
                'term_scheme' => 'full',
                'term_percents' => [100],
                'term_due_dates' => ['2026-08-17'],
            ],
        );

        $term = $po->paymentPlan->terms->first();

        $response = $this->actingAs($user)->post(
            route('projects.po.payment-terms.settle', [
                'project' => $project->id,
                'purchaseOrder' => $po->id,
                'paymentTerm' => $term->id,
            ]),
            [
                'amount' => 15000000,
                'paid_at' => '2026-08-17',
                'payment_method' => 'Transfer Bank BCA',
                'payment_ref' => 'TRX-PASTEUR-001',
                'notes' => 'Pelunasan Baliho Pasteur',
            ],
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('payment_settlements', [
            'payment_term_id' => $term->id,
            'amount' => 15000000,
            'payment_ref' => 'TRX-PASTEUR-001',
        ]);

        $term->refresh();
        $this->assertEquals(PaymentTermStatus::PAID, $term->status);
    }
}
