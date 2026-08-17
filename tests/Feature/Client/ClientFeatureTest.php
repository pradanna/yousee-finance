<?php

declare(strict_types=1);

namespace Tests\Feature\Client;

use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientFeatureTest extends TestCase
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

    public function test_unauthenticated_user_cannot_access_clients(): void
    {
        $response = $this->get(route('clients'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_clients_list_and_metrics(): void
    {
        Client::create([
            'name' => 'PT Gojek Tokopedia Tbk',
            'npwp' => '01.555.666.7-001.000',
            'email' => 'billing@goto.com',
            'phone' => '081288990011',
            'address' => 'Jakarta',
            'is_archived' => false,
        ]);

        Client::create([
            'name' => 'CV Sumber Makmur',
            'npwp' => null,
            'email' => 'sm@gmail.com',
            'phone' => '085712345678',
            'address' => 'Semarang',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->get(route('clients'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Clients')
            ->has('clients.data', 2)
            ->has('metrics')
            ->where('metrics.totalClients', 2)
            ->where('metrics.activeClients', 2)
            ->where('metrics.pkpCount', 1)
            ->where('metrics.nonPkpCount', 1)
        );
    }

    public function test_pagination_limits_to_10_per_page_and_allows_page_navigation(): void
    {
        // Create 15 active clients
        Client::factory()->count(15)->create(['is_archived' => false]);

        // Page 1 should have exactly 10 items
        $responsePage1 = $this->actingAs($this->user)->get(route('clients', ['page' => 1]));
        $responsePage1->assertStatus(200);
        $responsePage1->assertInertia(fn ($page) => $page
            ->component('Clients')
            ->has('clients.data', 10)
            ->where('clients.current_page', 1)
            ->where('clients.last_page', 2)
            ->where('clients.total', 15)
            ->where('clients.per_page', 10)
        );

        // Page 2 should have remaining 5 items
        $responsePage2 = $this->actingAs($this->user)->get(route('clients', ['page' => 2]));
        $responsePage2->assertStatus(200);
        $responsePage2->assertInertia(fn ($page) => $page
            ->component('Clients')
            ->has('clients.data', 5)
            ->where('clients.current_page', 2)
            ->where('clients.total', 15)
        );
    }

    public function test_can_filter_clients_by_status_and_pkp(): void
    {
        Client::create([
            'name' => 'Client PKP Aktif',
            'npwp' => '01.234.567.8-901.000',
            'is_archived' => false,
        ]);

        Client::create([
            'name' => 'Client Non PKP Arsip',
            'npwp' => null,
            'is_archived' => true,
        ]);

        // Filter active
        $responseActive = $this->actingAs($this->user)->get(route('clients', ['status' => 'active']));
        $responseActive->assertStatus(200);
        $responseActive->assertInertia(fn ($page) => $page
            ->has('clients.data', 1)
            ->where('clients.data.0.name', 'Client PKP Aktif')
        );

        // Filter archived
        $responseArchived = $this->actingAs($this->user)->get(route('clients', ['status' => 'archived']));
        $responseArchived->assertStatus(200);
        $responseArchived->assertInertia(fn ($page) => $page
            ->has('clients.data', 1)
            ->where('clients.data.0.name', 'Client Non PKP Arsip')
        );

        // Filter PKP
        $responsePkp = $this->actingAs($this->user)->get(route('clients', ['status' => 'all', 'pkp' => 'pkp']));
        $responsePkp->assertStatus(200);
        $responsePkp->assertInertia(fn ($page) => $page
            ->has('clients.data', 1)
            ->where('clients.data.0.name', 'Client PKP Aktif')
        );
    }

    public function test_default_sorting_is_updated_at_desc_and_allows_custom_sorting(): void
    {
        $clientA = Client::create([
            'name' => 'AAA Client',
            'npwp' => '01.111.111.1-111.000',
            'is_archived' => false,
        ]);
        $clientA->created_at = now()->subDays(5);
        $clientA->updated_at = now()->subDays(5);
        $clientA->saveQuietly();

        $clientB = Client::create([
            'name' => 'ZZZ Client',
            'npwp' => '02.222.222.2-222.000',
            'is_archived' => false,
        ]);
        $clientB->created_at = now()->subDays(1);
        $clientB->updated_at = now()->subDays(1);
        $clientB->saveQuietly();

        // Default should be updated_at desc (ZZZ Client first)
        $responseDefault = $this->actingAs($this->user)->get(route('clients'));
        $responseDefault->assertStatus(200);
        $responseDefault->assertInertia(fn ($page) => $page
            ->where('filters.sort_by', 'updated_at')
            ->where('filters.sort_direction', 'desc')
            ->where('clients.data.0.name', 'ZZZ Client')
            ->where('clients.data.1.name', 'AAA Client')
        );

        // Name ASC should have AAA Client first
        $responseNameAsc = $this->actingAs($this->user)->get(route('clients', [
            'sort_by' => 'name',
            'sort_direction' => 'asc',
        ]));
        $responseNameAsc->assertStatus(200);
        $responseNameAsc->assertInertia(fn ($page) => $page
            ->where('filters.sort_by', 'name')
            ->where('filters.sort_direction', 'asc')
            ->where('clients.data.0.name', 'AAA Client')
            ->where('clients.data.1.name', 'ZZZ Client')
        );
    }

    public function test_can_create_new_client(): void
    {
        $payload = [
            'name' => 'PT Paragon Innovation',
            'npwp' => '02.999.888.7-061.000',
            'email' => 'finance@paragon.com',
            'phone' => '081900112233',
            'address' => 'Jakarta Selatan',
        ];

        $response = $this->actingAs($this->user)->post(route('clients.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Client berhasil ditambahkan.');

        $this->assertDatabaseHas('clients', [
            'name' => 'PT Paragon Innovation',
            'email' => 'finance@paragon.com',
            'phone' => '081900112233',
        ]);
    }

    public function test_can_update_client(): void
    {
        $client = Client::create([
            'name' => 'PT Old Client',
            'npwp' => '01.234.567.8-901.000',
            'email' => 'old@client.com',
            'phone' => '081234567890',
            'is_archived' => false,
        ]);

        $updatePayload = [
            'name' => 'PT Updated Client',
            'npwp' => '01.234.567.8-901.000',
            'email' => 'updated@client.com',
            'phone' => '081299998888',
            'address' => 'Jl. Baru No. 1',
        ];

        $response = $this->actingAs($this->user)->put(route('clients.update', $client->id), $updatePayload);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Data client berhasil diperbarui.');

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'PT Updated Client',
            'email' => 'updated@client.com',
            'phone' => '081299998888',
        ]);
    }

    public function test_can_archive_and_unarchive_client(): void
    {
        $client = Client::create([
            'name' => 'PT Test Archive',
            'is_archived' => false,
        ]);

        // Archive
        $responseArchive = $this->actingAs($this->user)->post(route('clients.archive', $client->id));
        $responseArchive->assertRedirect();
        $responseArchive->assertSessionHas('success', 'Client berhasil diarsipkan.');
        $this->assertTrue($client->fresh()->is_archived);

        // Unarchive
        $responseUnarchive = $this->actingAs($this->user)->post(route('clients.unarchive', $client->id));
        $responseUnarchive->assertRedirect();
        $responseUnarchive->assertSessionHas('success', 'Client berhasil diaktifkan kembali.');
        $this->assertFalse($client->fresh()->is_archived);
    }

    public function test_can_delete_client(): void
    {
        $client = Client::create([
            'name' => 'PT Client To Delete',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->delete(route('clients.destroy', $client->id));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Client berhasil dihapus.');

        $this->assertSoftDeleted('clients', [
            'id' => $client->id,
        ]);
    }

    public function test_can_fetch_client_transactions(): void
    {
        $client = Client::create([
            'name' => 'PT Shopee Indonesia',
            'npwp' => '02.444.888.9-002.000',
            'is_archived' => false,
        ]);

        $sales = Sales::factory()->create();

        Project::create([
            'code' => 'PRJ-2026-001',
            'name' => 'Videotron Megatron SCBD',
            'client_id' => $client->id,
            'sales_id' => $sales->id,
            'fiscal_mode' => 'ppn',
            'start_date' => now()->subMonth(),
            'end_date' => now()->addMonth(),
            'contract_value' => 140000000,
            'target_qty' => 1,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)->getJson(route('clients.transactions', $client->id));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'client' => ['id', 'name'],
            'transactions' => [
                '*' => ['id', 'date', 'project_name', 'amount', 'fiscal_mode', 'status'],
            ],
        ]);
        $response->assertJsonFragment([
            'project_name' => 'Videotron Megatron SCBD',
            'amount' => 140000000,
        ]);
    }
}
