<?php

declare(strict_types=1);

namespace Tests\Feature\Sales;

use App\Domains\Accounting\Actions\GetSalesCommissionList;
use App\Domains\Client\Models\Client;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManualSalesCommissionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_can_create_sales_without_commission_rate_and_without_email(): void
    {
        $response = $this->actingAs($this->user)->post('/sales', [
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sales', [
            'name' => 'Budi Santoso',
            'email' => null,
            'commission_rate' => null,
        ]);
    }

    public function test_project_can_store_and_update_manual_sales_commission(): void
    {
        $client = Client::factory()->create();
        $sales = Sales::factory()->create([
            'commission_rate' => null,
        ]);

        $project = Project::create([
            'code' => 'PRJ-2026-999',
            'name' => 'Billboard Sudirman',
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'contract_value' => 100000000,
            'sales_commission' => 2500000,
            'target_qty' => 1,
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'sales_commission' => 2500000,
        ]);

        // Test update komisi manual
        $response = $this->actingAs($this->user)->put("/projects/{$project->id}", [
            'sales_commission' => 3750000,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'sales_commission' => 3750000,
        ]);

        // Verifikasi GetSalesCommissionList mencatat nominal komisi manual
        $action = new GetSalesCommissionList();
        $result = $action->execute([
            'fiscal_mode' => 'ppn',
            'month' => 9,
            'year' => 2026,
        ]);

        $this->assertCount(1, $result['items']);
        $this->assertEquals(3750000, $result['items'][0]['commissionAmount']);
    }
}
