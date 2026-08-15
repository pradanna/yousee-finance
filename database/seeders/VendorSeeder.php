<?php

namespace Database\Seeders;

use App\Domains\Vendor\Models\Vendor;
use Illuminate\Database\Seeder;

class VendorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Vendor::factory()->count(15)->create();

        Vendor::factory()->count(3)->create(['is_archived' => true]);
    }
}
