<?php

namespace Database\Factories;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Client\Models\Client;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Billing\Models\Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fiscalMode = fake()->randomElement(FiscalMode::cases());
        $now = now();

        return [
            'client_id' => Client::factory(),
            'sales_id' => Sales::factory(),
            'project_id' => Project::factory(),
            'fiscal_mode' => $fiscalMode,
            'transaction_date' => $now,
            'due_date' => $now->copy()->addDays(7),
            'subtotal' => 0,
            'ppn' => 0,
            'total' => 0,
            'status' => InvoiceStatus::DRAFT,
        ];
    }
}
