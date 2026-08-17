<?php

namespace Database\Factories;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Billing\Models\InvoiceItem>
 */
class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'invoice_id' => Invoice::factory(),
            'name' => fake()->words(3, true),
            'quantity' => fake()->numberBetween(1, 5),
            'price' => fake()->randomFloat(2, 500_000, 10_000_000),
        ];
    }
}
