<?php

declare(strict_types=1);

namespace Tests\Feature\Accounting;

use App\Domains\Accounting\Models\ClosingPeriod;
use App\Domains\Identity\Enums\UserRole;
use App\Domains\Identity\Models\User;
use App\Domains\Shared\Enums\FiscalMode;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClosingPeriodLockTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleAndPermissionSeeder::class);
        $this->seed(ChartOfAccountSeeder::class);

        $this->owner = User::factory()->create([
            'password' => bcrypt('secret123'),
        ]);
        $this->owner->assignRole(UserRole::PIMPINAN->value);

        $this->admin = User::factory()->create([
            'password' => bcrypt('secret123'),
        ]);
        $this->admin->assignRole(UserRole::ADMIN->value);
    }

    public function test_closing_period_index_page_renders_successfully(): void
    {
        $this->actingAs($this->owner);

        $response = $this->get(route('accounting.closing-periods.index', ['year' => 2026]));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Accounting/ClosingPeriod/Index')
            ->has('months', 12)
            ->where('isOwner', true)
        );
    }

    public function test_admin_cannot_access_closing_period_page(): void
    {
        $this->actingAs($this->admin);

        $response = $this->get(route('accounting.closing-periods.index', ['year' => 2026]));
        $response->assertForbidden();
    }

    public function test_admin_cannot_lock_or_unlock_closing_period(): void
    {
        $this->actingAs($this->admin);

        // Coba lock sebagai admin -> gagal / error domain
        $response = $this->post(route('accounting.closing-periods.lock'), [
            'month' => 1,
            'year' => 2026,
            'fiscal_mode' => 'ppn',
        ]);

        $response->assertSessionHasErrors('lock_error');
        $this->assertFalse(ClosingPeriod::isClosed(1, 2026, FiscalMode::PPN));
    }

    public function test_owner_can_lock_and_unlock_closing_period_with_password(): void
    {
        $this->actingAs($this->owner);

        // 1. Owner Lock Periode Bulan 1
        $response = $this->post(route('accounting.closing-periods.lock'), [
            'month' => 1,
            'year' => 2026,
            'fiscal_mode' => 'ppn',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertTrue(ClosingPeriod::isClosed(1, 2026, FiscalMode::PPN));

        // 2. Owner Unlock dengan password salah -> Gagal
        $response = $this->post(route('accounting.closing-periods.unlock'), [
            'month' => 1,
            'year' => 2026,
            'fiscal_mode' => 'ppn',
            'reason' => 'Perbaikan faktur pajak',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('unlock_error');
        $this->assertTrue(ClosingPeriod::isClosed(1, 2026, FiscalMode::PPN));

        // 3. Owner Unlock dengan password benar -> Sukses
        $response = $this->post(route('accounting.closing-periods.unlock'), [
            'month' => 1,
            'year' => 2026,
            'fiscal_mode' => 'ppn',
            'reason' => 'Perbaikan faktur pajak masukan',
            'password' => 'secret123',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertFalse(ClosingPeriod::isClosed(1, 2026, FiscalMode::PPN));

        // Pastikan audit log tercatat
        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => ClosingPeriod::class,
            'event' => 'unlock_period',
            'user_id' => $this->owner->id,
        ]);
    }
}
