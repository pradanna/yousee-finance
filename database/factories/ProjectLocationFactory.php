<?php

namespace Database\Factories;

use App\Domains\Project\Enums\LocationOrientation;
use App\Domains\Project\Enums\LocationType;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLocation;
use App\Domains\Vendor\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Project\Models\ProjectLocation>
 */
class ProjectLocationFactory extends Factory
{
    protected $model = ProjectLocation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'vendor_id' => Vendor::factory(),
            'code' => 'LOC-' . str_pad((string) fake()->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'area' => fake()->city(),
            'description' => 'Billboard ' . fake()->streetName(),
            'type' => fake()->randomElement(LocationType::cases()),
            'size' => fake()->randomElement(['4x6m', '4x8m', '6x12m']),
            'orientation' => fake()->randomElement(LocationOrientation::cases()),
            'qty' => 1,
            'vendor_cost' => fake()->randomFloat(2, 3_000_000, 30_000_000),
        ];
    }
}
