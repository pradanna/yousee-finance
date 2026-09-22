<?php

declare(strict_types=1);

namespace Tests\Feature\Procurement;

use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Actions\IssueVendorPurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorPoPkpValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Client $client;
    private Sales $sales;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->client = Client::create(['name' => 'PT Klien Utama']);
        $this->sales = Sales::create(['name' => 'Sales Utama', 'email' => 'sales@yousee.com']);
    }

    public function test_cannot_issue_po_to_non_pkp_vendor_in_ppn_mode_via_action(): void
    {
        $nonPkpVendor = Vendor::create([
            'name' => 'Bengkel Las Mandiri (Non-PKP)',
            'npwp' => null,
        ]);

        $projectPpn = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-PPN-001',
            'name' => 'Proyek Reklame PPN',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 50000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $projectPpn->id,
            'vendor_id' => $nonPkpVendor->id,
            'code' => 'LOC-001',
            'type' => 'Billboard',
            'area' => 'Semarang',
            'description' => 'Titik Simpang Lima',
            'size' => '4x8m',
            'vendor_cost' => 10000000,
            'qty' => 1,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("Vendor 'Bengkel Las Mandiri (Non-PKP)' berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN.");

        (new IssueVendorPurchaseOrder())->execute(
            $projectPpn,
            $nonPkpVendor,
            [$location->id],
            '2026-09-22',
        );
    }

    public function test_cannot_issue_po_to_non_pkp_vendor_in_ppn_mode_via_http_request(): void
    {
        $nonPkpVendor = Vendor::create([
            'name' => 'Vendor Bambang Non-PKP',
            'npwp' => '',
        ]);

        $projectPpn = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-PPN-002',
            'name' => 'Proyek Baliho PPN',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 75000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $projectPpn->id,
            'vendor_id' => $nonPkpVendor->id,
            'code' => 'LOC-002',
            'type' => 'Billboard',
            'area' => 'Solo',
            'description' => 'Titik Gladag Solo',
            'size' => '5x10m',
            'vendor_cost' => 15000000,
            'qty' => 1,
        ]);

        $response = $this->actingAs($this->user)->post(
            route('projects.purchase-orders.store', $projectPpn),
            [
                'vendor_id' => $nonPkpVendor->id,
                'location_ids' => [$location->id],
                'transaction_date' => '2026-09-22',
            ],
        );

        $response->assertSessionHasErrors(['vendor_id']);
        $this->assertDatabaseMissing('purchase_orders', [
            'project_id' => $projectPpn->id,
            'vendor_id' => $nonPkpVendor->id,
        ]);
    }

    public function test_can_issue_po_to_pkp_vendor_in_ppn_mode(): void
    {
        $pkpVendor = Vendor::create([
            'name' => 'PT Mitra Sejahtera PKP',
            'npwp' => '01.234.567.8-901.000',
        ]);

        $projectPpn = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-PPN-003',
            'name' => 'Proyek Billboard Mega PPN',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 100000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $projectPpn->id,
            'vendor_id' => $pkpVendor->id,
            'code' => 'LOC-003',
            'type' => 'Billboard',
            'area' => 'Semarang',
            'description' => 'Titik Tugu Muda',
            'size' => '4x8m',
            'vendor_cost' => 20000000,
            'qty' => 1,
        ]);

        $po = (new IssueVendorPurchaseOrder())->execute(
            $projectPpn,
            $pkpVendor,
            [$location->id],
            '2026-09-22',
        );

        $this->assertNotNull($po);
        $this->assertEquals(20000000, $po->subtotal);
        $this->assertEquals(2200000, $po->ppn); // 11% PPN
        $this->assertEquals(22200000, $po->total);
    }

    public function test_can_issue_po_to_non_pkp_vendor_in_non_ppn_mode(): void
    {
        $nonPkpVendor = Vendor::create([
            'name' => 'Pak Joko Bengkel (Non-PKP)',
            'npwp' => null,
        ]);

        $projectNonPpn = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-NON-001',
            'name' => 'Proyek Baliho Non PPN',
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 30000000,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $projectNonPpn->id,
            'vendor_id' => $nonPkpVendor->id,
            'code' => 'LOC-004',
            'type' => 'Billboard',
            'area' => 'Kudus',
            'description' => 'Titik Alun-alun Kudus',
            'size' => '3x6m',
            'vendor_cost' => 8000000,
            'qty' => 1,
        ]);

        $po = (new IssueVendorPurchaseOrder())->execute(
            $projectNonPpn,
            $nonPkpVendor,
            [$location->id],
            '2026-09-22',
        );

        $this->assertNotNull($po);
        $this->assertEquals(8000000, $po->subtotal);
        $this->assertEquals(0, $po->ppn); // 0% PPN di Mode Non-PPN
        $this->assertEquals(8000000, $po->total);
    }
}
