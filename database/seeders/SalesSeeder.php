<?php

namespace Database\Seeders;

use App\Domains\Sales\Models\Sales;
use Illuminate\Database\Seeder;

class SalesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Sales::factory()->count(10)->create();
    }
}
