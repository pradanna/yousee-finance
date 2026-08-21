<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Identity\Models\User;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Actions\CreateProject;
use App\Domains\Project\Actions\DeleteProject;
use App\Domains\Project\Actions\UpdateProject;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectAuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->client = Client::factory()->create();
    }

    public function test_creating_project_records_audit_log(): void
    {
        $action = new CreateProject();
        $project = $action->execute([
            'name' => 'Project Baliho Merdeka',
            'client_id' => $this->client->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'contract_value' => 50000000,
            'is_ppn_inclusive' => false,
            'target_qty' => 2,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $project->id,
            'event'          => 'created',
            'user_id'        => $this->user->id,
        ]);

        $log = $project->auditLogs()->first();
        $this->assertNotNull($log);
        $this->assertEquals('created', $log->event);
        $this->assertStringContainsString('Baliho Merdeka', $log->description);
    }

    public function test_updating_project_records_audit_log_and_detects_contract_change(): void
    {
        $createAction = new CreateProject();
        $project = $createAction->execute([
            'name' => 'Project Baliho Merdeka',
            'client_id' => $this->client->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'contract_value' => 50000000,
            'target_qty' => 1,
        ]);

        $updateAction = new UpdateProject();
        $updateAction->execute($project, [
            'contract_value' => 75000000,
            'status' => ProjectStatus::ACTIVE,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $project->id,
            'event'          => 'status_changed',
        ]);

        $latestLog = $project->auditLogs()->orderByDesc('created_at')->orderByDesc('id')->first();
        $this->assertNotNull($latestLog);
        $this->assertEquals('status_changed', $latestLog->event);
        $this->assertStringContainsString('Nilai kontrak berubah', $latestLog->description);
        $this->assertStringContainsString('Status berubah', $latestLog->description);
    }

    public function test_cancelling_project_records_cancelled_audit_log(): void
    {
        $createAction = new CreateProject();
        $project = $createAction->execute([
            'name' => 'Project Draft Dibatalkan',
            'client_id' => $this->client->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'contract_value' => 10000000,
            'target_qty' => 1,
        ]);

        $deleteAction = new DeleteProject();
        $deleteAction->execute($project);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $project->id,
            'event'          => 'cancelled',
            'user_id'        => $this->user->id,
        ]);
    }
}
