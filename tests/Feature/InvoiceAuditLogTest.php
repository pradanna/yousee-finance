<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Identity\Models\User;
use App\Domains\Billing\Actions\CreateClientInvoice;
use App\Domains\Billing\Actions\IssueClientInvoice;
use App\Domains\Billing\Actions\SettleClientPaymentTerm;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Actions\CreateProject;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Shared\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceAuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->client = Client::factory()->create(['name' => 'PT Klien Sukses']);

        $createProject = new CreateProject();
        $this->project = $createProject->execute([
            'name' => 'Kampanye Billboard Nasional',
            'client_id' => $this->client->id,
            'fiscal_mode' => FiscalMode::PPN->value,
            'start_date' => '2026-10-01',
            'end_date' => '2026-12-31',
            'contract_value' => 200000000,
            'target_qty' => 2,
        ]);
    }

    public function test_issuing_invoice_records_audit_log_for_invoice_and_project(): void
    {
        $createInvoice = new CreateClientInvoice();
        $invoice = $createInvoice->execute($this->project);

        $generateTerms = new \App\Domains\Billing\Actions\GeneratePaymentTerms();
        $generateTerms->execute(
            $invoice,
            \App\Domains\Billing\Enums\PaymentScheme::TERMIN,
            [50.0, 50.0],
            ['2026-10-10', '2026-11-10']
        );

        $issueAction = new IssueClientInvoice();
        $issuedInvoice = $issueAction->execute($this->project);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Invoice::class,
            'auditable_id'   => $issuedInvoice->id,
            'event'          => 'created',
            'user_id'        => $this->user->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $this->project->id,
            'event'          => 'invoice_issued',
            'user_id'        => $this->user->id,
        ]);
    }

    public function test_settling_client_payment_records_audit_log(): void
    {
        $createInvoice = new CreateClientInvoice();
        $invoice = $createInvoice->execute($this->project);

        $generateTerms = new \App\Domains\Billing\Actions\GeneratePaymentTerms();
        $generateTerms->execute(
            $invoice,
            \App\Domains\Billing\Enums\PaymentScheme::FULL,
            [100.0],
            ['2026-10-15']
        );

        $issueAction = new IssueClientInvoice();
        $issuedInvoice = $issueAction->execute($this->project);

        $term = $issuedInvoice->paymentPlan->terms->first();

        $settleAction = new SettleClientPaymentTerm();
        $settleAction->execute($term, [
            'amount' => (float) $term->amount,
            'paid_at' => '2026-10-12',
            'payment_method' => 'Transfer Bank BCA',
            'payment_ref' => 'REF-INV-999',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Invoice::class,
            'auditable_id'   => $issuedInvoice->id,
            'event'          => 'payment_settled',
            'user_id'        => $this->user->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => Project::class,
            'auditable_id'   => $this->project->id,
            'event'          => 'client_payment_settled',
            'user_id'        => $this->user->id,
        ]);
    }
}
