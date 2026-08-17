<?php

namespace Database\Factories;

use App\Domains\Billing\Enums\PaymentTermStatus;
use App\Domains\Billing\Models\PaymentPlan;
use App\Domains\Billing\Models\PaymentTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Billing\Models\PaymentTerm>
 */
class PaymentTermFactory extends Factory
{
    protected $model = PaymentTerm::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'payment_plan_id' => PaymentPlan::factory(),
            'sort_order' => 1,
            'label' => 'Lunas Sekaligus',
            'amount' => fake()->randomFloat(2, 5_000_000, 150_000_000),
            'percent' => 100,
            'due_date' => now()->addDays(7),
            'status' => PaymentTermStatus::UNPAID,
        ];
    }
}
