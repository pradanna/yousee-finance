<?php

namespace Tests\Feature\Auth;

use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendLogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_logout_authenticated_user()
    {
        $user = User::factory()->create();
        
        $this->actingAs($user);

        $response = $this->postJson('/logout');

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Logout successful']);

        $this->assertGuest();
    }

    public function test_unauthenticated_user_cannot_access_logout()
    {
        $response = $this->postJson('/logout');

        $response->assertStatus(401);
    }
}
