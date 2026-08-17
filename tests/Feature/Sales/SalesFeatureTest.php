<?php

declare(strict_types=1);

namespace Tests\Feature\Sales;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'status' => 'active',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_sales_team(): void
    {
        $response = $this->get(route('sales'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_sales_team_list_and_metrics(): void
    {
        Sales::create([
            'name' => 'Rian Hidayat',
            'email' => 'rian@youseeads.id',
            'phone' => '081211112222',
            'commission_rate' => 2.50,
            'is_archived' => false,
        ]);

        Sales::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@youseeads.id',
            'phone' => '081322223333',
            'commission_rate' => 2.00,
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->get(route('sales'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Sales')
            ->has('sales.data', 2)
            ->has('metrics')
            ->where('metrics.totalSales', 2)
            ->where('metrics.activeSales', 2)
            ->where('metrics.avgCommission', 2.3)
        );
    }

    public function test_pagination_limits_to_10_per_page_and_allows_page_navigation(): void
    {
        // Create 15 active sales reps
        Sales::factory()->count(15)->create(['is_archived' => false]);

        // Page 1 should have exactly 10 items
        $responsePage1 = $this->actingAs($this->user)->get(route('sales', ['page' => 1]));
        $responsePage1->assertStatus(200);
        $responsePage1->assertInertia(fn ($page) => $page
            ->component('Sales')
            ->has('sales.data', 10)
            ->where('sales.current_page', 1)
            ->where('sales.last_page', 2)
            ->where('sales.total', 15)
            ->where('sales.per_page', 10)
        );

        // Page 2 should have remaining 5 items
        $responsePage2 = $this->actingAs($this->user)->get(route('sales', ['page' => 2]));
        $responsePage2->assertStatus(200);
        $responsePage2->assertInertia(fn ($page) => $page
            ->component('Sales')
            ->has('sales.data', 5)
            ->where('sales.current_page', 2)
            ->where('sales.total', 15)
        );
    }

    public function test_can_filter_sales_by_status(): void
    {
        Sales::create([
            'name' => 'Sales Aktif',
            'email' => 'aktif@youseeads.id',
            'is_archived' => false,
        ]);

        Sales::create([
            'name' => 'Sales Arsip',
            'email' => 'arsip@youseeads.id',
            'is_archived' => true,
        ]);

        // Filter active
        $responseActive = $this->actingAs($this->user)->get(route('sales', ['status' => 'active']));
        $responseActive->assertStatus(200);
        $responseActive->assertInertia(fn ($page) => $page
            ->has('sales.data', 1)
            ->where('sales.data.0.name', 'Sales Aktif')
        );

        // Filter archived
        $responseArchived = $this->actingAs($this->user)->get(route('sales', ['status' => 'archived']));
        $responseArchived->assertStatus(200);
        $responseArchived->assertInertia(fn ($page) => $page
            ->has('sales.data', 1)
            ->where('sales.data.0.name', 'Sales Arsip')
        );
    }

    public function test_default_sorting_is_updated_at_desc_and_allows_custom_sorting(): void
    {
        $salesA = Sales::create([
            'name' => 'AAA Sales',
            'email' => 'aaa@youseeads.id',
            'commission_rate' => 1.5,
            'is_archived' => false,
        ]);
        $salesA->created_at = now()->subDays(5);
        $salesA->updated_at = now()->subDays(5);
        $salesA->saveQuietly();

        $salesB = Sales::create([
            'name' => 'ZZZ Sales',
            'email' => 'zzz@youseeads.id',
            'commission_rate' => 3.5,
            'is_archived' => false,
        ]);
        $salesB->created_at = now()->subDays(1);
        $salesB->updated_at = now()->subDays(1);
        $salesB->saveQuietly();

        // Default should be updated_at desc (ZZZ Sales first)
        $responseDefault = $this->actingAs($this->user)->get(route('sales'));
        $responseDefault->assertStatus(200);
        $responseDefault->assertInertia(fn ($page) => $page
            ->where('filters.sort_by', 'updated_at')
            ->where('filters.sort_direction', 'desc')
            ->where('sales.data.0.name', 'ZZZ Sales')
            ->where('sales.data.1.name', 'AAA Sales')
        );

        // Name ASC should have AAA Sales first
        $responseNameAsc = $this->actingAs($this->user)->get(route('sales', [
            'sort_by' => 'name',
            'sort_direction' => 'asc',
        ]));
        $responseNameAsc->assertStatus(200);
        $responseNameAsc->assertInertia(fn ($page) => $page
            ->where('filters.sort_by', 'name')
            ->where('filters.sort_direction', 'asc')
            ->where('sales.data.0.name', 'AAA Sales')
            ->where('sales.data.1.name', 'ZZZ Sales')
        );
    }

    public function test_can_create_new_sales_rep(): void
    {
        $payload = [
            'name' => 'Dimas Prasetyo',
            'email' => 'dimas@youseeads.id',
            'phone' => '081133334444',
            'commission_rate' => 3.00,
        ];

        $response = $this->actingAs($this->user)->post(route('sales.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Personil sales berhasil ditambahkan.');

        $this->assertDatabaseHas('sales', [
            'name' => 'Dimas Prasetyo',
            'email' => 'dimas@youseeads.id',
            'phone' => '081133334444',
            'commission_rate' => 3.00,
        ]);
    }

    public function test_can_update_sales_rep(): void
    {
        $sale = Sales::create([
            'name' => 'Budi Lama',
            'email' => 'budi.lama@youseeads.id',
            'phone' => '081234567890',
            'commission_rate' => 2.00,
            'is_archived' => false,
        ]);

        $updatePayload = [
            'name' => 'Budi Santoso Baru',
            'email' => 'budi.santoso@youseeads.id',
            'phone' => '085744445555',
            'commission_rate' => 2.50,
        ];

        $response = $this->actingAs($this->user)->put(route('sales.update', $sale->id), $updatePayload);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Data personil sales berhasil diperbarui.');

        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'name' => 'Budi Santoso Baru',
            'email' => 'budi.santoso@youseeads.id',
            'phone' => '085744445555',
            'commission_rate' => 2.50,
        ]);
    }

    public function test_can_archive_and_unarchive_sales_rep(): void
    {
        $sale = Sales::create([
            'name' => 'Maya Kartika',
            'email' => 'maya@youseeads.id',
            'is_archived' => false,
        ]);

        // Archive
        $responseArchive = $this->actingAs($this->user)->post(route('sales.archive', $sale->id));
        $responseArchive->assertRedirect();
        $responseArchive->assertSessionHas('success', 'Personil sales berhasil diarsipkan.');
        $this->assertTrue($sale->fresh()->is_archived);

        // Unarchive
        $responseUnarchive = $this->actingAs($this->user)->post(route('sales.unarchive', $sale->id));
        $responseUnarchive->assertRedirect();
        $responseUnarchive->assertSessionHas('success', 'Personil sales berhasil diaktifkan kembali.');
        $this->assertFalse($sale->fresh()->is_archived);
    }

    public function test_can_delete_sales_rep_when_no_projects_attached(): void
    {
        $sale = Sales::create([
            'name' => 'Reza To Delete',
            'email' => 'reza@youseeads.id',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->delete(route('sales.destroy', $sale->id));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Personil sales berhasil dihapus.');

        $this->assertSoftDeleted('sales', [
            'id' => $sale->id,
        ]);
    }
}
