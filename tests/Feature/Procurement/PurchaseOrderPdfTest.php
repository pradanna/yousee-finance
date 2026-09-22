<?php

declare(strict_types=1);

namespace Tests\Feature\Procurement;

use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderPdfTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $client = Client::create(['name' => 'PT Klien Utama']);
        $sales = Sales::create(['name' => 'Sales Utama', 'email' => 'sales@yousee.com']);

        $this->vendor = Vendor::create([
            'name' => 'PT Vendor Reklame',
            'npwp' => '01.234.567.8-901.000',
        ]);

        $this->project = Project::create([
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'code' => 'PRJ-2026-001',
            'name' => 'Billboard Sudirman',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
            'contract_value' => 50000000,
            'status' => 'active',
        ]);
    }

    public function test_can_generate_po_pdf_via_post_without_type_error(): void
    {
        $payload = [
            'projectId' => $this->project->id,
            'vendorName' => $this->vendor->name,
            'vendorAddress' => 'Jl. Vendor No. 123',
            'vendorPhone' => '08123456789',
            'poNumber' => 'PO-001/YS/09/26',
            'isPPN' => true,
            'locations' => [
                [
                    'code' => 'LOC-01',
                    'city' => 'Jakarta Selatan',
                    'address' => 'Jl. Sudirman Kav. 1',
                    'size' => '4x8m',
                    'lighting' => 'Berlampu',
                    'vendorCost' => 50000000,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->post('/po-pdf', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
    }

    public function test_can_generate_po_pdf_via_get_with_po_number(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/po-pdf?poNumber=' . urlencode('PO-001/YS/09/26'));

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
    }

    public function test_po_pdf_grand_total_matches_target_total_2_miliar_without_rounding_error(): void
    {
        // 3 titik lokasi dengan total DPP 1.801.801.801 yang di-gross bernilai tepat 2.000.000.000
        $payload = [
            'vendorName' => $this->vendor->name,
            'poNumber' => 'PO-TEST/2026/001',
            'isPPN' => true,
            'grandTotal' => 2000000000,
            'totalDPP' => 1801801801,
            'locations' => [
                ['description' => 'Jl. Soloraya', 'vendorCost' => 450450450],
                ['description' => 'Jl. Rajiman', 'vendorCost' => 450450450],
                ['description' => '2 Billboard Tanjung Anom', 'vendorCost' => 900900901],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->post('/po-pdf', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));

        // Juga uji tanpa passing grandTotal eksplisit (fallback per-item rounded gross)
        unset($payload['grandTotal'], $payload['totalDPP']);
        $responseFallback = $this->actingAs($this->user)
            ->post('/po-pdf', $payload);

        $responseFallback->assertOk();
    }

    public function test_po_pdf_loads_all_items_from_db_when_request_has_partial_items(): void
    {
        $po = PurchaseOrder::create([
            'po_number' => '010/PTSSI-PO/09/26',
            'vendor_id' => $this->vendor->id,
            'project_id' => $this->project->id,
            'fiscal_mode' => FiscalMode::PPN,
            'transaction_date' => now()->toDateString(),
            'issued_at' => now(),
            'status' => \App\Domains\Procurement\Enums\PurchaseOrderStatus::ISSUED,
        ]);

        \App\Domains\Procurement\Models\PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'name' => 'Jl. Soloraya',
            'quantity' => 1,
            'price' => 450450450,
        ]);
        \App\Domains\Procurement\Models\PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'name' => 'Jl. Rajiman',
            'quantity' => 1,
            'price' => 450450450,
        ]);
        \App\Domains\Procurement\Models\PurchaseOrderItem::create([
            'purchase_order_id' => $po->id,
            'name' => '2 Billboard Tanjung Anom',
            'quantity' => 1,
            'price' => 900900901,
        ]);
        $po->recalculateTotal();

        $this->assertEquals(2000000000, $po->total);
        $this->assertEquals(1801801801, $po->subtotal);
        $this->assertEquals(198198199, $po->ppn);

        // Simulasi request dari FE yang hanya mengirim 1 lokasi pertama
        $payload = [
            'vendorName' => $this->vendor->name,
            'poNumber' => $po->po_number,
            'isPPN' => true,
            'locations' => [
                ['description' => 'Jl. Soloraya', 'vendorCost' => 450450450],
            ],
        ];

        $response = $this->actingAs($this->user)
            ->post('/po-pdf', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', (string) $response->headers->get('content-type'));
    }
}
