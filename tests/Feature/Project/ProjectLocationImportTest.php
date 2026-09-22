<?php

declare(strict_types=1);

namespace Tests\Feature\Project;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProjectLocationImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Project $project;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->vendor = Vendor::create([
            'code' => 'VND-0001',
            'name' => 'PT Megah Billboard',
            'pic' => 'Bpk. Hendra',
            'is_archived' => false,
        ]);
        $this->project = Project::factory()->create([
            'code' => 'PRJ-TEST-001',
            'name' => 'Project Kampanye Akbar',
            'fiscal_mode' => 'non-ppn',
        ]);
    }

    public function test_can_download_project_locations_template(): void
    {
        $response = $this->actingAs($this->user)->get(route('projects.locations.template', $this->project->id));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertTrue(str_contains((string) $response->headers->get('Content-Disposition'), 'Template_Titik_Lokasi_Project_'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Kode Vendor', $content);
        $this->assertStringContainsString('Area', $content);
        $this->assertStringContainsString('Keterangan Lokasi', $content);
        $this->assertStringContainsString('VND-0001', $content);
    }

    public function test_can_preview_and_validate_locations_csv_file(): void
    {
        $csvContent = "\xEF\xBB\xBFKode Vendor,Area,Keterangan Lokasi,Jenis,Ukuran,Orientasi,Penerangan,Qty,Biaya Vendor DPP (Rp),Catatan TOP\n";
        $csvContent .= "VND-0001,Semarang,Billboard Simpang Lima,Billboard,4x8m,V,Berlampu,1,15000000,Termin 50:50\n";
        $csvContent .= "VND-UNKNOWN,Solo,Videotron Manahan,Videotron,5x10m,H,Berlampu,1,20000000,Pelunasan 30 hari\n";

        $file = UploadedFile::fake()->createWithContent('titik_lokasi.csv', $csvContent);

        $response = $this->actingAs($this->user)->post(route('projects.locations.preview', $this->project->id), [
            'file' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'items',
            'errors',
            'total_rows',
            'valid_rows',
        ]);

        $data = $response->json();
        $this->assertEquals(1, $data['valid_rows']);
        $this->assertCount(1, $data['items']);
        $this->assertEquals('VND-0001', $data['items'][0]['vendor_code']);
        $this->assertEquals('PT Megah Billboard', $data['items'][0]['vendor_name']);
        $this->assertEquals('Billboard Simpang Lima', $data['items'][0]['description']);

        $this->assertCount(1, $data['errors']);
        $this->assertStringContainsString('VND-UNKNOWN', $data['errors'][0]);
    }

    public function test_can_bulk_import_reviewed_locations(): void
    {
        $payload = [
            'items' => [
                [
                    'vendor_id' => $this->vendor->id,
                    'area' => 'Semarang',
                    'description' => 'Billboard Simpang Lima Sudut Barat',
                    'type' => 'Billboard',
                    'size' => '4x8m',
                    'orientation' => 'V',
                    'lighting' => 'Berlampu',
                    'qty' => 1,
                    'vendor_cost' => 15000000,
                    'is_ppn_inclusive' => false,
                    'top_notes' => 'Termin 50:50',
                ],
                [
                    'vendor_id' => $this->vendor->id,
                    'area' => 'Solo',
                    'description' => 'Videotron Slamet Riyadi',
                    'type' => 'Videotron',
                    'size' => '5x10m',
                    'orientation' => 'H',
                    'lighting' => 'Berlampu',
                    'qty' => 1,
                    'vendor_cost' => 25000000,
                    'is_ppn_inclusive' => false,
                    'top_notes' => null,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->post(route('projects.locations.import', $this->project->id), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('project_locations', [
            'project_id' => $this->project->id,
            'vendor_id' => $this->vendor->id,
            'code' => 'LOC-001',
            'description' => 'Billboard Simpang Lima Sudut Barat',
        ]);

        $this->assertDatabaseHas('project_locations', [
            'project_id' => $this->project->id,
            'vendor_id' => $this->vendor->id,
            'code' => 'LOC-002',
            'description' => 'Videotron Slamet Riyadi',
        ]);

        $this->assertEquals(2, ProjectLocation::where('project_id', $this->project->id)->count());
    }
}
