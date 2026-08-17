<?php

namespace Tests\Feature\Auth;

use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('overview', absolute: false));
    }

    public function test_staff_user_is_redirected_to_projects_dashboard(): void
    {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'staff']);
        $user = User::factory()->create();
        $user->assignRole('staff');

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('projects', absolute: false));
    }

    public function test_unauthenticated_user_cannot_access_dashboard_and_is_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect(route('login', absolute: false));

        $responseOverview = $this->get('/overview');
        $responseOverview->assertRedirect(route('login', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('login', absolute: false));
    }
}
