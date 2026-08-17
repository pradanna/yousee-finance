<?php

declare(strict_types=1);

namespace Tests\Feature\Dashboard;

use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OverviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/overview');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_overview_with_dashboard_props(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->get('/overview');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Overview')
            ->has('filters')
            ->has('metrics.ppn')
            ->has('metrics.nonPpn')
            ->has('chartData.ppn')
            ->has('chartData.nonPpn')
            ->has('upcomingReceivables')
            ->has('upcomingDebts')
            ->has('recentTransactions')
        );
    }

    public function test_overview_filters_by_month_and_year(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user)->get('/overview?month=6&year=2026');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Overview')
            ->where('filters.month', '06')
            ->where('filters.year', '2026')
        );
    }
}
