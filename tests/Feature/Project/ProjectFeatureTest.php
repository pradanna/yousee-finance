<?php

declare(strict_types=1);

namespace Tests\Feature\Project;

use App\Domains\Client\Models\Client;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Enums\LocationLighting;
use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProjectFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Client $client;
    private Sales $sales;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => UserRole::ADMIN->value]);
        Role::firstOrCreate(['name' => UserRole::PIMPINAN->value]);

        $this->admin = User::factory()->create();
        $this->admin->assignRole(UserRole::ADMIN->value);

        $this->client = Client::create([
            'name' => 'Client Test PT',
            'email' => 'client@test.com',
            'phone' => '08123456789',
        ]);

        $this->sales = Sales::create([
            'name' => 'Sales Test',
            'email' => 'sales@test.com',
            'phone' => '08198765432',
            'commission_rate' => 2.5,
        ]);

        $this->vendor = Vendor::create([
            'name' => 'Vendor Billboard Jaya',
            'phone' => '081122334455',
            'email' => 'vendor@test.com',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_projects(): void
    {
        $response = $this->get('/projects');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_projects_list_and_details(): void
    {
        $project = Project::create([
            'code' => 'PRJ-2026-PPN01',
            'name' => 'Kampanye Billboard Semarang',
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'fiscal_mode' => FiscalMode::PPN,
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->addMonths(2),
            'contract_value' => 150_000_000,
            'target_qty' => 2,
            'status' => ProjectStatus::ACTIVE,
        ]);

        $location = ProjectLocation::create([
            'project_id' => $project->id,
            'vendor_id' => $this->vendor->id,
            'code' => 'LOC-001',
            'area' => 'Semarang',
            'description' => 'Jl. Pandanaran',
            'type' => LocationType::BILLBOARD,
            'size' => '4x8m',
            'orientation' => LocationOrientation::VERTICAL,
            'lighting' => LocationLighting::BERLAMPU,
            'qty' => 1,
            'vendor_cost' => 12_000_000,
        ]);

        $response = $this->actingAs($this->admin)->get('/projects');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Projects')
            ->has('projects.data', 1)
            ->has('clients')
            ->has('sales')
            ->has('vendors')
        );

        $showResponse = $this->actingAs($this->admin)->get("/projects/{$project->id}");
        $showResponse->assertOk();
        $showResponse->assertInertia(fn ($page) => $page
            ->component('Projects/Show')
            ->where('project.name', 'Kampanye Billboard Semarang')
            ->has('project.locations', 1)
        );
    }

    public function test_can_create_new_project(): void
    {
        $payload = [
            'name' => 'Proyek Signage Neonbox Baru',
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'fiscal_mode' => 'ppn',
            'start_date' => '2026-09-01',
            'end_date' => '2026-11-30',
            'contract_value' => 75_000_000,
            'target_qty' => 1,
        ];

        $response = $this->actingAs($this->admin)->post('/projects', $payload);
        $response->assertRedirect();

        $this->assertDatabaseHas('projects', [
            'name' => 'Proyek Signage Neonbox Baru',
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'contract_value' => 75000000,
        ]);
    }

    public function test_can_add_location_to_project(): void
    {
        $project = Project::create([
            'code' => 'PRJ-2026-NON01',
            'name' => 'Proyek Non PPN Test',
            'client_id' => $this->client->id,
            'sales_id' => $this->sales->id,
            'fiscal_mode' => FiscalMode::NON_PPN,
            'start_date' => now(),
            'end_date' => now()->addMonth(),
            'contract_value' => 50_000_000,
            'target_qty' => 1,
            'status' => ProjectStatus::ACTIVE,
        ]);

        $payload = [
            'vendor_id' => $this->vendor->id,
            'area' => 'Solo',
            'description' => 'Fasad Toko Utama',
            'type' => 'Neonbox',
            'size' => '2x3m',
            'orientation' => 'H',
            'lighting' => 'Berlampu',
            'qty' => 1,
            'vendor_cost' => 8_500_000,
        ];

        $response = $this->actingAs($this->admin)->post("/projects/{$project->id}/locations", $payload);
        $response->assertRedirect();

        $this->assertDatabaseHas('project_locations', [
            'project_id' => $project->id,
            'vendor_id' => $this->vendor->id,
            'area' => 'Solo',
            'vendor_cost' => 8500000,
        ]);
    }
}
