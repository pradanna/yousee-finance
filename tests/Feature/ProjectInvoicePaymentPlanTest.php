<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Client\Models\Client;
use App\Domains\Identity\Models\User;
use App\Domains\Project\Actions\CreateProject;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectInvoicePaymentPlanTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\ChartOfAccountSeeder::class);

        $this->user = User::factory()->create();
        $this->actingAs($this->user);

        $this->client = Client::factory()->create(['name' => 'PT Klien Bali Digital']);

        $createProject = new CreateProject();
        $this->project = $createProject->execute([
            'name' => 'Billboard Sudirman 12 Bulan',
            'client_id' => $this->client->id,
            'fiscal_mode' => FiscalMode::NON_PPN->value,
            'start_date' => '2026-10-01',
            'end_date' => '2027-09-30',
            'contract_value' => 120000000,
            'target_qty' => 1,
        ]);
    }

    public function test_can_store_custom_tempo_payment_plan_up_to_12_months(): void
    {
        $months = 6;
        $percents = [16.0, 16.0, 16.0, 16.0, 16.0, 20.0];
        $dueDates = [
            '2026-11-01',
            '2026-12-01',
            '2027-01-01',
            '2027-02-01',
            '2027-03-01',
            '2027-04-01',
        ];

        $response = $this->post(route('projects.payment-plan.store', $this->project), [
            'scheme' => PaymentScheme::INSTALLMENT->value,
            'percents' => $percents,
            'due_dates' => $dueDates,
            'notes' => 'Tempo 6 Kali (6 Bulan)',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $invoice = $this->project->invoices()->first();
        $this->assertNotNull($invoice);

        $plan = $invoice->paymentPlan;
        $this->assertNotNull($plan);
        $this->assertEquals(PaymentScheme::INSTALLMENT, $plan->scheme);
        $this->assertCount(6, $plan->terms);

        $firstTerm = $plan->terms->first();
        $this->assertEquals('Cicilan 1 dari 6', $firstTerm->label);
        $this->assertEquals(PaymentTermStatus::UNPAID, $firstTerm->status);
        $this->assertEquals('2026-11-01', $firstTerm->due_date->format('Y-m-d'));
    }

    public function test_fails_when_percents_do_not_sum_to_100(): void
    {
        $response = $this->post(route('projects.payment-plan.store', $this->project), [
            'scheme' => PaymentScheme::INSTALLMENT->value,
            'percents' => [30.0, 30.0],
            'due_dates' => ['2026-11-01', '2026-12-01'],
        ]);

        $response->assertSessionHasErrors(['percents']);
    }
}
