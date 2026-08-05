<?php

namespace Tests\Feature\Vendor;

use App\Domains\Identity\Models\User;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
    }

    public function test_vendor_index_page_can_be_rendered()
    {
        Vendor::factory()->count(15)->create();

        $response = $this->actingAs($this->user)->get(route('vendors.index'));

        $response->assertStatus(200);
    }

    public function test_can_create_new_vendor()
    {
        $response = $this->actingAs($this->user)->post(route('vendors.store'), [
            'name' => 'PT Maju Mundur',
            'npwp' => '12.345.678.9-123.000',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        
        $this->assertDatabaseHas('vendors', [
            'name' => 'PT Maju Mundur',
            'npwp' => '12.345.678.9-123.000',
            'is_archived' => 0,
        ]);
    }
    
    public function test_name_is_required_to_create_vendor()
    {
        $response = $this->actingAs($this->user)->post(route('vendors.store'), [
            'name' => '',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_can_update_vendor()
    {
        $vendor = Vendor::factory()->create([
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->user)->put(route('vendors.update', $vendor), [
            'name' => 'New Name',
        ]);

        $response->assertSessionHasNoErrors();
        
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'name' => 'New Name',
        ]);
    }

    public function test_can_archive_vendor()
    {
        $vendor = Vendor::factory()->create(['is_archived' => false]);

        $response = $this->actingAs($this->user)->post(route('vendors.archive', $vendor));

        $response->assertSessionHasNoErrors();
        
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'is_archived' => 1,
        ]);
    }
    
    public function test_can_unarchive_vendor()
    {
        $vendor = Vendor::factory()->create(['is_archived' => true]);

        $response = $this->actingAs($this->user)->post(route('vendors.unarchive', $vendor));

        $response->assertSessionHasNoErrors();
        
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'is_archived' => 0,
        ]);
    }

    public function test_can_delete_vendor()
    {
        $vendor = Vendor::factory()->create();

        $response = $this->actingAs($this->user)->delete(route('vendors.destroy', $vendor));

        $response->assertSessionHasNoErrors();
        
        $this->assertSoftDeleted('vendors', [
            'id' => $vendor->id,
        ]);
    }
}
