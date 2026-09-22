<?php

declare(strict_types=1);

namespace Tests\Feature\Vendor;

use App\Domains\Identity\Models\User;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorFeatureTest extends TestCase
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

    public function test_unauthenticated_user_cannot_access_vendors(): void
    {
        $response = $this->get(route('vendors'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_vendors_list_and_metrics(): void
    {
        Vendor::create([
            'name' => 'PT Megah Reklame',
            'npwp' => '01.234.567.8-901.000',
            'is_archived' => false,
        ]);

        Vendor::create([
            'name' => 'CV Neon Mandiri',
            'npwp' => null,
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->get(route('vendors'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->has('vendors.data', 2)
            ->has('metrics')
            ->where('metrics.totalVendors', 2)
            ->where('metrics.pkpCount', 1)
            ->where('metrics.nonPkpCount', 1)
        );
    }

    public function test_pagination_limits_to_10_per_page_and_allows_page_navigation(): void
    {
        // Create 14 active vendors
        Vendor::factory()->count(14)->create(['is_archived' => false]);

        // Page 1 should have exactly 10 items
        $responsePage1 = $this->actingAs($this->user)->get(route('vendors', ['page' => 1]));
        $responsePage1->assertStatus(200);
        $responsePage1->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->has('vendors.data', 10)
            ->where('vendors.current_page', 1)
            ->where('vendors.last_page', 2)
            ->where('vendors.total', 14)
            ->where('vendors.per_page', 10)
        );

        // Page 2 should have remaining 4 items
        $responsePage2 = $this->actingAs($this->user)->get(route('vendors', ['page' => 2]));
        $responsePage2->assertStatus(200);
        $responsePage2->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->has('vendors.data', 4)
            ->where('vendors.current_page', 2)
            ->where('vendors.total', 14)
        );
    }

    public function test_can_filter_vendors_by_status_and_pkp(): void
    {
        Vendor::create([
            'name' => 'Vendor PKP Aktif',
            'npwp' => '01.234.567.8-901.000',
            'is_archived' => false,
        ]);

        Vendor::create([
            'name' => 'Vendor Non PKP Arsip',
            'npwp' => null,
            'is_archived' => true,
        ]);

        // Filter archived
        $responseArchived = $this->actingAs($this->user)->get(route('vendors', ['status' => 'archived']));
        $responseArchived->assertStatus(200);
        $responseArchived->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->has('vendors.data', 1)
            ->where('vendors.data.0.name', 'Vendor Non PKP Arsip')
        );

        // Filter PKP
        $responsePkp = $this->actingAs($this->user)->get(route('vendors', ['status' => 'all', 'pkp' => 'pkp']));
        $responsePkp->assertStatus(200);
        $responsePkp->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->has('vendors.data', 1)
            ->where('vendors.data.0.name', 'Vendor PKP Aktif')
        );
    }

    public function test_default_sorting_is_updated_at_desc_and_allows_custom_sorting(): void
    {
        $v1 = Vendor::factory()->create(['name' => 'Alpha Vendor', 'created_at' => now()->subDays(3), 'updated_at' => now()->subDays(3)]);
        $v2 = Vendor::factory()->create(['name' => 'Zulu Vendor', 'created_at' => now()->subDays(1), 'updated_at' => now()]);

        // Default sort: updated_at desc (Zulu Vendor first)
        $response = $this->actingAs($this->user)->get(route('vendors'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->where('vendors.data.0.name', 'Zulu Vendor')
            ->where('filters.sort_by', 'updated_at')
            ->where('filters.sort_direction', 'desc')
        );

        // Sort by name asc (Alpha Vendor first)
        $responseSortName = $this->actingAs($this->user)->get(route('vendors', ['sort_by' => 'name', 'sort_direction' => 'asc']));
        $responseSortName->assertStatus(200);
        $responseSortName->assertInertia(fn ($page) => $page
            ->component('Vendors')
            ->where('vendors.data.0.name', 'Alpha Vendor')
        );
    }

    public function test_can_create_new_vendor(): void
    {
        $response = $this->actingAs($this->user)->post(route('vendors.store'), [
            'name' => 'PT Kreasi Baru',
            'npwp' => '99.888.777.6-555.000',
            'pic' => 'Bpk. Joko Susilo',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('vendors', [
            'name' => 'PT Kreasi Baru',
            'npwp' => '99.888.777.6-555.000',
            'pic' => 'Bpk. Joko Susilo',
            'code' => 'VND-0001',
            'is_archived' => false,
        ]);
    }

    public function test_can_create_vendor_with_custom_code(): void
    {
        $response = $this->actingAs($this->user)->post(route('vendors.store'), [
            'code' => 'VND-CUSTOM-01',
            'name' => 'PT Vendor Khusus',
            'pic' => 'Ibu Siti',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('vendors', [
            'code' => 'VND-CUSTOM-01',
            'name' => 'PT Vendor Khusus',
            'pic' => 'Ibu Siti',
        ]);
    }

    public function test_can_update_vendor(): void
    {
        $vendor = Vendor::create([
            'code' => 'VND-0001',
            'name' => 'Vendor Lama',
            'pic' => 'PIC Lama',
            'npwp' => null,
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->put(route('vendors.update', $vendor->id), [
            'code' => 'VND-EDITED-01',
            'name' => 'Vendor Baru Update',
            'pic' => 'PIC Baru Update',
            'npwp' => '11.222.333.4-555.000',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'code' => 'VND-EDITED-01',
            'name' => 'Vendor Baru Update',
            'pic' => 'PIC Baru Update',
            'npwp' => '11.222.333.4-555.000',
        ]);
    }

    public function test_can_archive_and_unarchive_vendor(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor Test Archive',
            'is_archived' => false,
        ]);

        // Archive
        $responseArchive = $this->actingAs($this->user)->post(route('vendors.archive', $vendor->id));
        $responseArchive->assertRedirect();
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'is_archived' => true,
        ]);

        // Unarchive
        $responseUnarchive = $this->actingAs($this->user)->post(route('vendors.unarchive', $vendor->id));
        $responseUnarchive->assertRedirect();
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'is_archived' => false,
        ]);
    }

    public function test_can_delete_vendor(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor Test Delete',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->delete(route('vendors.destroy', $vendor->id));
        $response->assertRedirect();

        $this->assertSoftDeleted('vendors', [
            'id' => $vendor->id,
        ]);
    }

    public function test_can_fetch_vendor_transactions(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor PO Test',
            'is_archived' => false,
        ]);

        $project = Project::factory()->create([
            'name' => 'Project Billboard',
        ]);

        PurchaseOrder::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'po_number' => 'PO-TEST-001',
            'fiscal_mode' => 'ppn',
            'total' => 15000000,
            'status' => 'paid',
            'transaction_date' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson(route('vendors.transactions', $vendor->id));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'vendor' => ['id', 'name', 'npwp'],
            'transactions' => [
                '*' => ['id', 'po_number', 'project_name', 'date', 'amount', 'status', 'fiscal_mode'],
            ],
        ]);
        $response->assertJsonCount(1, 'transactions');
    }

    public function test_can_export_vendors_to_csv(): void
    {
        Vendor::create([
            'code' => 'VND-0001',
            'name' => 'PT Vendor Mega',
            'pic' => 'Bpk. Budianto',
            'npwp' => '01.234.567.8-901.000',
            'phone' => '08123456789',
            'email' => 'sales@vendormega.com',
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->get(route('vendors.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertTrue(str_contains((string) $response->headers->get('Content-Disposition'), 'Daftar_Vendor_'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Kode Vendor', $content);
        $this->assertStringContainsString('Nama Vendor', $content);
        $this->assertStringContainsString('PIC / Kontak Person', $content);
        $this->assertStringContainsString('VND-0001', $content);
        $this->assertStringContainsString('PT Vendor Mega', $content);
        $this->assertStringContainsString('Bpk. Budianto', $content);
    }

    public function test_cannot_create_vendor_with_pkp_true_and_empty_npwp(): void
    {
        $response = $this->actingAs($this->user)->post(route('vendors.store'), [
            'name' => 'PT Vendor PKP Tapi NPWP Kosong',
            'pkp' => true,
            'npwp' => '',
        ]);

        $response->assertSessionHasErrors(['npwp']);
        $this->assertDatabaseMissing('vendors', [
            'name' => 'PT Vendor PKP Tapi NPWP Kosong',
        ]);
    }

    public function test_cannot_update_vendor_with_pkp_true_and_empty_npwp(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor Awal Non-PKP',
            'npwp' => null,
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->put(route('vendors.update', $vendor->id), [
            'name' => 'Vendor Awal Diubah PKP',
            'pkp' => true,
            'npwp' => '',
        ]);

        $response->assertSessionHasErrors(['npwp']);
        $this->assertNull($vendor->fresh()->npwp);
    }

    public function test_can_update_vendor_with_pkp_true_and_valid_npwp(): void
    {
        $vendor = Vendor::create([
            'name' => 'Vendor Awal Non-PKP',
            'npwp' => null,
            'is_archived' => false,
        ]);

        $response = $this->actingAs($this->user)->put(route('vendors.update', $vendor->id), [
            'name' => 'Vendor Jadi PKP Valid',
            'pkp' => true,
            'npwp' => '01.234.567.8-901.000',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $this->assertEquals('01.234.567.8-901.000', $vendor->fresh()->npwp);
        $this->assertTrue($vendor->fresh()->isPkp());
    }

    public function test_actions_throw_domain_exception_when_pkp_true_and_npwp_empty(): void
    {
        $createAction = app(\App\Domains\Vendor\Actions\CreateVendor::class);
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('NPWP wajib diisi jika vendor berstatus PKP.');

        $createAction->execute([
            'name' => 'Vendor PKP Action Test',
            'pkp' => true,
            'npwp' => '',
        ]);
    }
}
