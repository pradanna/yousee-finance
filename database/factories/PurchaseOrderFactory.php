<?php

namespace Database\Factories;

use App\Domains\Procurement\Enums\PurchaseOrderStatus;
use App\Domains\Procurement\Models\PurchaseOrder;
use App\Domains\Project\Models\Project;
use App\Domains\Shared\Enums\FiscalMode;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Procurement\Models\PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

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
            'po_number' => str_pad((string) fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT)
                . '/PTSSI-PO/' . $now->format('m') . '/' . $now->format('y'),
            'vendor_id' => Vendor::factory(),
            'project_id' => Project::factory(),
            'fiscal_mode' => $fiscalMode,
            'transaction_date' => $now,
            'subtotal' => 0,
            'ppn' => 0,
            'total' => 0,
            'status' => PurchaseOrderStatus::DRAFT,
        ];
    }
}
