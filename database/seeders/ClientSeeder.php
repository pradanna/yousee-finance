<?php

namespace Database\Seeders;

use App\Domains\Client\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Client::factory()->count(15)->create();

        Client::factory()->count(3)->create(['is_archived' => true]);
    }
}
