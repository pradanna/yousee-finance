<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Domains\Identity\Enums\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BackendLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_can_authenticate_user_with_valid_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'status' => UserStatus::ACTIVE,
        ]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['message' => 'Login successful']);

        $this->assertAuthenticatedAs($user);

        $user->refresh();
        $this->assertNotNull($user->last_login_at);
    }

    public function test_it_fails_to_authenticate_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_it_prevents_inactive_users_from_logging_in()
    {
        $user = User::factory()->create([
            'password' => Hash::make('password123'),
            'status' => UserStatus::INACTIVE,
        ]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    }
}
