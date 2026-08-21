<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Identity\Models\User;
use App\Domains\Client\Models\Client;
use App\Domains\Procurement\Actions\CancelPurchaseOrder;
use App\Domains\Procurement\Actions\IssueVendorPurchaseOrder;
use App\Domains\Procurement\Actions\SettleVendorPaymentTerm;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Actions\CreateProject;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderAuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;
    protected Vendor $vendor;
    protected ProjectLocation $location;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $client = Client::factory()->create();

        $createProject = new CreateProject();
        $this->project = $createProject->execute([
            'name' => 'Proyek Billboard Mega',
            'client_id' => $client->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
            'contract_value' => 100000000,
            'target_qty' => 1,
        ]);

        $this->vendor = Vendor::factory()->create(['name' => 'PT Vendor Megah']);

        $this->location = ProjectLocation::create([
            'project_id'  => $this->project->id,
            'vendor_id'   => $this->vendor->id,
            'code'        => 'LOC-001',
            'area'        => 'Jakarta Selatan',
            'description' => 'Jl Sudirman KM 5',
            'type'        => 'Billboard',
            'size'        => '4x8',
            'vendor_cost' => 40000000,
            'qty'         => 1,
        ]);
    }

    public function test_issuing_po_records_audit_log_for_po_and_project(): void
    {
        $issueAction = new IssueVendorPurchaseOrder();
        $po = $issueAction->execute(
            $this->project,
            $this->vendor,
            [$this->location->id],
            '2026-09-02',
            [
                'term_scheme' => 'termin',
                'term_percents' => [50, 50],
                'term_due_dates' => ['2026-09-10', '2026-10-10'],
            ]
        );

        // Audit Log pada Purchase Order
        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => PurchaseOrder::class,
            'auditable_id'   => $po->id,
            'event'          => 'created',
            'user_id'        => $this->user->id,
        ]);

        // Audit Log pada Project
        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $this->project->id,
            'event'          => 'po_issued',
            'user_id'        => $this->user->id,
        ]);
    }

    public function test_settling_po_payment_records_audit_log(): void
    {
        $issueAction = new IssueVendorPurchaseOrder();
        $po = $issueAction->execute(
            $this->project,
            $this->vendor,
            [$this->location->id],
            '2026-09-02',
            [
                'term_scheme' => 'full',
                'term_percents' => [100],
                'term_due_dates' => ['2026-09-15'],
            ]
        );

        $term = $po->paymentPlan->terms->first();

        $settleAction = new SettleVendorPaymentTerm();
        $settleAction->execute($term, [
            'amount' => (float) $term->amount,
            'paid_at' => '2026-09-10',
            'payment_method' => 'Transfer Bank BCA',
            'payment_ref' => 'TRF-12345',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => PurchaseOrder::class,
            'auditable_id'   => $po->id,
            'event'          => 'payment_settled',
            'user_id'        => $this->user->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $this->project->id,
            'event'          => 'vendor_payment_settled',
            'user_id'        => $this->user->id,
        ]);
    }

    public function test_cancelling_po_records_audit_log(): void
    {
        $issueAction = new IssueVendorPurchaseOrder();
        $po = $issueAction->execute(
            $this->project,
            $this->vendor,
            [$this->location->id],
            '2026-09-02',
            [
                'term_scheme' => 'full',
                'term_percents' => [100],
                'term_due_dates' => ['2026-09-15'],
            ]
        );

        $cancelAction = new CancelPurchaseOrder();
        $cancelAction->execute($po);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => PurchaseOrder::class,
            'auditable_id'   => $po->id,
            'event'          => 'po_cancelled',
            'user_id'        => $this->user->id,
        ]);
    }
}
