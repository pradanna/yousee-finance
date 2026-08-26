<?php

namespace Database\Seeders;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            UserSeeder::class,
            // VendorSeeder::class, // Dinonaktifkan untuk testing QA dari nol
            // ClientSeeder::class, // Dinonaktifkan untuk testing QA dari nol
            // SalesSeeder::class,  // Dinonaktifkan untuk testing QA dari nol
            ChartOfAccountSeeder::class,
            ExpenseCategorySeeder::class,
            // ProjectTransactionSeeder::class, // Dinonaktifkan agar database bersih untuk QA E2E test
        ]);
    }
}
