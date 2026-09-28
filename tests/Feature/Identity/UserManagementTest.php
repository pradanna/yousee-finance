<?php

declare(strict_types=1);

namespace Tests\Feature\Identity;

use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Enums\UserStatus;
use App\Domains\Identity\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_pimpinan_can_view_users_list(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $response = $this->actingAs($pimpinan)->get(route('users.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Users'));
    }

    public function test_user_without_permission_cannot_view_users_list(): void
    {
        $unauthorized = User::factory()->create(['status' => UserStatus::ACTIVE]);

        $response = $this->actingAs($unauthorized)->get(route('users.index'));

        $response->assertForbidden();
    }

    public function test_pimpinan_can_create_a_new_user(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $response = $this->actingAs($pimpinan)->post(route('users.store'), [
            'name' => 'Budi Santoso',
            'email' => 'budi@yousee.test',
            'password' => 'secret12345',
            'password_confirmation' => 'secret12345',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'email' => 'budi@yousee.test',
            'name' => 'Budi Santoso',
        ]);

        $newUser = User::where('email', 'budi@yousee.test')->first();
        $this->assertNotNull($newUser);
        $this->assertTrue($newUser->hasRole('admin'));
        $this->assertTrue(Hash::check('secret12345', $newUser->password));
    }

    public function test_pimpinan_can_update_an_existing_user(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $targetUser = User::factory()->create([
            'name' => 'Old Name',
            'email' => 'old@yousee.test',
            'status' => UserStatus::ACTIVE,
        ]);
        $targetUser->assignRole(UserRole::ADMIN->value);

        $response = $this->actingAs($pimpinan)->put(route('users.update', $targetUser), [
            'name' => 'New Name',
            'email' => 'new@yousee.test',
            'role' => 'pimpinan',
            'status' => 'inactive',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'New Name',
            'email' => 'new@yousee.test',
            'status' => 'inactive',
        ]);

        $targetUser->refresh();
        $this->assertTrue($targetUser->hasRole('pimpinan'));
    }

    public function test_user_cannot_delete_themselves(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $response = $this->actingAs($pimpinan)->delete(route('users.destroy', $pimpinan));

        $response->assertSessionHasErrors(['user']);
        $this->assertDatabaseHas('users', ['id' => $pimpinan->id]);
    }

    public function test_pimpinan_can_delete_another_user(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $admin = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $admin->assignRole(UserRole::ADMIN->value);

        $response = $this->actingAs($pimpinan)->delete(route('users.destroy', $admin));

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $admin->id]);
    }

    public function test_pimpinan_can_toggle_user_status(): void
    {
        $pimpinan = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $pimpinan->assignRole(UserRole::PIMPINAN->value);

        $admin = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $admin->assignRole(UserRole::ADMIN->value);

        $response = $this->actingAs($pimpinan)->post(route('users.toggle-status', $admin), [
            'status' => 'inactive',
        ]);

        $response->assertRedirect();
        $admin->refresh();
        $this->assertEquals(UserStatus::INACTIVE, $admin->status);
    }
}
