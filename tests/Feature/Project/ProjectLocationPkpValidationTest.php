<?php

declare(strict_types=1);

namespace Tests\Feature\Project;

use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Project\Actions\CreateProjectLocation;
use App\Domains\Project\Actions\ImportProjectLocations;
use App\Domains\Project\Actions\UpdateProjectLocation;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProjectLocationPkpValidationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Client $client;
    private Sales $sales;
    private Vendor $pkpVendor;
    private Vendor $nonPkpVendor;
    private Project $ppnProject;
    private Project $nonPpnProject;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->client = Client::create(['name' => 'PT Klien Utama']);
        $this->sales = Sales::create(['name' => 'Sales Utama', 'email' => 'sales@yousee.com']);

        $this->pkpVendor = Vendor::create([
            'code' => 'VND-PKP',
            'name' => 'PT Vendor PKP Jaya',
            'npwp' => '01.234.567.8-901.000',
            'is_archived' => false,
        ]);

        $this->nonPkpVendor = Vendor::create([
            'code' => 'VND-NONPKP',
            'name' => 'CV Mandiri Non-PKP',
            'npwp' => null,
            'is_archived' => false,
        ]);

        $this->ppnProject = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-PPN-001',
            'name' => 'Proyek Kampanye Mode PPN',
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 100000000,
        ]);

        $this->nonPpnProject = Project::create([
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'code' => 'PRJ-NONPPN-001',
            'name' => 'Proyek Kampanye Mode Non-PPN',
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 100000000,
        ]);
    }

    public function test_cannot_add_location_with_non_pkp_vendor_in_ppn_mode_via_http(): void
    {
        $payload = [
            'vendor_id' => $this->nonPkpVendor->id,
            'area' => 'Semarang',
            'description' => 'Billboard Simpang Lima',
            'type' => 'Billboard',
            'size' => '4x8m',
            'orientation' => 'V',
            'lighting' => 'Berlampu',
            'qty' => 1,
            'vendor_cost' => 15000000,
            'is_ppn_inclusive' => false,
        ];

        $response = $this->actingAs($this->user)->post(
            route('projects.locations.store', $this->ppnProject->id),
            $payload
        );

        $response->assertSessionHasErrors(['vendor_id']);
        $this->assertEquals(0, ProjectLocation::where('project_id', $this->ppnProject->id)->count());
    }

    public function test_can_add_location_with_pkp_vendor_in_ppn_mode_via_http(): void
    {
        $payload = [
            'vendor_id' => $this->pkpVendor->id,
            'area' => 'Semarang',
            'description' => 'Billboard Simpang Lima',
            'type' => 'Billboard',
            'size' => '4x8m',
            'orientation' => 'V',
            'lighting' => 'Berlampu',
            'qty' => 1,
            'vendor_cost' => 15000000,
            'is_ppn_inclusive' => false,
        ];

        $response = $this->actingAs($this->user)->post(
            route('projects.locations.store', $this->ppnProject->id),
            $payload
        );

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $this->assertEquals(1, ProjectLocation::where('project_id', $this->ppnProject->id)->count());
    }

    public function test_can_add_location_with_non_pkp_vendor_in_non_ppn_mode_via_http(): void
    {
        $payload = [
            'vendor_id' => $this->nonPkpVendor->id,
            'area' => 'Semarang',
            'description' => 'Billboard Simpang Lima Non PPN',
            'type' => 'Billboard',
            'size' => '4x8m',
            'orientation' => 'V',
            'lighting' => 'Berlampu',
            'qty' => 1,
            'vendor_cost' => 15000000,
            'is_ppn_inclusive' => false,
        ];

        $response = $this->actingAs($this->user)->post(
            route('projects.locations.store', $this->nonPpnProject->id),
            $payload
        );

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $this->assertEquals(1, ProjectLocation::where('project_id', $this->nonPpnProject->id)->count());
    }

    public function test_cannot_update_location_to_non_pkp_vendor_in_ppn_mode_via_http(): void
    {
        $location = ProjectLocation::create([
            'project_id' => $this->ppnProject->id,
            'vendor_id' => $this->pkpVendor->id,
            'code' => 'LOC-001',
            'type' => 'Billboard',
            'area' => 'Semarang',
            'description' => 'Billboard Simpang Lima',
            'size' => '4x8m',
            'vendor_cost' => 15000000,
        ]);

        $response = $this->actingAs($this->user)->put(
            route('projects.locations.update', [$this->ppnProject->id, $location->id]),
            [
                'vendor_id' => $this->nonPkpVendor->id,
                'area' => 'Semarang',
                'description' => 'Billboard Simpang Lima Diubah',
                'type' => 'Billboard',
                'size' => '4x8m',
                'vendor_cost' => 15000000,
            ]
        );

        $response->assertSessionHasErrors(['vendor_id']);
        $this->assertEquals($this->pkpVendor->id, $location->fresh()->vendor_id);
    }

    public function test_preview_import_rejects_non_pkp_vendor_in_ppn_mode(): void
    {
        $csvContent = "\xEF\xBB\xBFKode Vendor,Area,Keterangan Lokasi,Jenis,Ukuran,Orientasi,Penerangan,Qty,Biaya Vendor DPP (Rp),Catatan TOP\n";
        $csvContent .= "VND-PKP,Semarang,Billboard PKP Valid,Billboard,4x8m,V,Berlampu,1,15000000,Termin 50:50\n";
        $csvContent .= "VND-NONPKP,Solo,Videotron Non-PKP Ditolak,Videotron,5x10m,H,Berlampu,1,20000000,Pelunasan 30 hari\n";

        $file = UploadedFile::fake()->createWithContent('titik_lokasi.csv', $csvContent);

        $response = $this->actingAs($this->user)->post(
            route('projects.locations.preview', $this->ppnProject->id),
            ['file' => $file]
        );

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals(1, $data['valid_rows']);
        $this->assertCount(1, $data['items']);
        $this->assertEquals('VND-PKP', $data['items'][0]['vendor_code']);

        $this->assertCount(1, $data['errors']);
        $this->assertStringContainsString('berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN', $data['errors'][0]);
    }

    public function test_import_request_rejects_non_pkp_vendor_in_ppn_mode(): void
    {
        $payload = [
            'items' => [
                [
                    'vendor_id' => $this->pkpVendor->id,
                    'area' => 'Semarang',
                    'description' => 'Titik 1',
                    'type' => 'Billboard',
                    'size' => '4x8m',
                    'vendor_cost' => 15000000,
                ],
                [
                    'vendor_id' => $this->nonPkpVendor->id,
                    'area' => 'Solo',
                    'description' => 'Titik 2 Non PKP',
                    'type' => 'Videotron',
                    'size' => '5x10m',
                    'vendor_cost' => 20000000,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->post(
            route('projects.locations.import', $this->ppnProject->id),
            $payload
        );

        $response->assertSessionHasErrors(['items']);
        $this->assertEquals(0, ProjectLocation::where('project_id', $this->ppnProject->id)->count());
    }

    public function test_actions_throw_domain_exception_for_non_pkp_vendor_in_ppn_mode(): void
    {
        // 1. Create action
        $createAction = app(CreateProjectLocation::class);
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN");

        $createAction->execute($this->ppnProject, [
            'vendor_id' => $this->nonPkpVendor->id,
            'area' => 'Semarang',
            'description' => 'Lokasi Invariant Test',
            'type' => 'Billboard',
            'size' => '4x8m',
            'vendor_cost' => 15000000,
        ]);
    }

    public function test_update_action_throws_domain_exception_for_non_pkp_vendor_in_ppn_mode(): void
    {
        $location = ProjectLocation::create([
            'project_id' => $this->ppnProject->id,
            'vendor_id' => $this->pkpVendor->id,
            'code' => 'LOC-001',
            'type' => 'Billboard',
            'area' => 'Semarang',
            'description' => 'Billboard Simpang Lima',
            'size' => '4x8m',
            'vendor_cost' => 15000000,
        ]);

        $updateAction = app(UpdateProjectLocation::class);
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN");

        $updateAction->execute($location, [
            'vendor_id' => $this->nonPkpVendor->id,
        ]);
    }

    public function test_import_action_throws_domain_exception_for_non_pkp_vendor_in_ppn_mode(): void
    {
        $importAction = app(ImportProjectLocations::class);
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage("berstatus Non-PKP dan dilarang digunakan pada proyek Mode PPN");

        $importAction->execute($this->ppnProject, [
            [
                'vendor_id' => $this->nonPkpVendor->id,
                'area' => 'Solo',
                'description' => 'Titik Invariant Test',
                'type' => 'Videotron',
                'size' => '5x10m',
                'vendor_cost' => 20000000,
            ],
        ]);
    }
}
