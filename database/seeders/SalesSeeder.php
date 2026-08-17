<?php

declare(strict_types=1);

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
        $salesReps = [
            [
                'name' => 'Rian Hidayat',
                'email' => 'rian.hidayat@youseeads.id',
                'phone' => '081211112222',
                'commission_rate' => 2.50,
                'is_archived' => false,
            ],
            [
                'name' => 'Siti Aminah',
                'email' => 'siti.aminah@youseeads.id',
                'phone' => '081322223333',
                'commission_rate' => 2.00,
                'is_archived' => false,
            ],
            [
                'name' => 'Dimas Prasetyo',
                'email' => 'dimas.prasetyo@youseeads.id',
                'phone' => '081133334444',
                'commission_rate' => 3.00,
                'is_archived' => false,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@youseeads.id',
                'phone' => '085744445555',
                'commission_rate' => 2.00,
                'is_archived' => false,
            ],
            [
                'name' => 'Maya Kartika',
                'email' => 'maya.kartika@youseeads.id',
                'phone' => '087855556666',
                'commission_rate' => 2.50,
                'is_archived' => false,
            ],
            [
                'name' => 'Reza Pratama',
                'email' => 'reza.pratama@youseeads.id',
                'phone' => '081966667777',
                'commission_rate' => 2.00,
                'is_archived' => false,
            ],
        ];

        foreach ($salesReps as $data) {
            Sales::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
        }
    }
}
