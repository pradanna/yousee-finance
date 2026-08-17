<?php

namespace Database\Factories;

use App\Domains\Billing\Enums\PaymentScheme;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\PaymentPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Billing\Models\PaymentPlan>
 */
class PaymentPlanFactory extends Factory
{
    protected $model = PaymentPlan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payable_type' => Invoice::class,
            'payable_id' => Invoice::factory(),
            'scheme' => PaymentScheme::FULL,
            'total_amount' => fake()->randomFloat(2, 5_000_000, 150_000_000),
        ];
    }
}
