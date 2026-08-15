<?php

namespace Database\Factories;

use App\Domains\Client\Models\Client;
use App\Domains\Project\Enums\ProjectStatus;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Project\Models\Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fiscalMode = fake()->randomElement(FiscalMode::cases());
        $year = now()->year;
        $modeTag = $fiscalMode === FiscalMode::PPN ? 'PPN' : 'NON';
        $startDate = fake()->dateTimeBetween('-3 months', 'now');

        return [
            'code' => 'PRJ-' . $year . '-' . $modeTag . str_pad((string) fake()->unique()->numberBetween(1, 99), 2, '0', STR_PAD_LEFT),
            'name' => fake()->catchPhrase(),
            'client_id' => Client::factory(),
            'sales_id' => Sales::factory(),
            'fiscal_mode' => $fiscalMode,
            'start_date' => $startDate,
            'end_date' => (clone $startDate)->modify('+' . fake()->numberBetween(1, 6) . ' months'),
            'contract_value' => fake()->randomFloat(2, 5_000_000, 150_000_000),
            'target_qty' => fake()->numberBetween(1, 10),
            'status' => ProjectStatus::DRAFT,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
