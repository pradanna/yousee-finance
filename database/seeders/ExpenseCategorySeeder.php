<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Accounting\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Gaji, Lembur & Honorarium Karyawan', 'code' => '5210'],
            ['name' => 'Sewa Kantor & Fasilitas', 'code' => '5220'],
            ['name' => 'Listrik, Air, Telepon & Internet Kantor', 'code' => '5230'],
            ['name' => 'Bensin, Tol, Parkir & Operasional Lapangan', 'code' => '5240'],
            ['name' => 'ATK, Perlengkapan & Fotocopy', 'code' => '5250'],
            ['name' => 'Token / Listrik Titik Reklame (PLN)', 'code' => '5140'],
            ['name' => 'Perbaikan / Maintenance Titik & Konstruksi', 'code' => '5120'],
            ['name' => 'Biaya Vendor Titik (Non-PO)', 'code' => '5110'],
            ['name' => 'Pajak Reklame & Retribusi Daerah', 'code' => '5130'],
            ['name' => 'Biaya Admin Bank & Transfer', 'code' => '5910'],
        ];

        foreach ($categories as $cat) {
            $account = ChartOfAccount::where('code', $cat['code'])->first();
            if ($account) {
                ExpenseCategory::updateOrCreate(
                    ['name' => $cat['name']],
                    [
                        'account_id'  => $account->id,
                        'is_active'   => true,
                        'description' => "Kategori default untuk {$cat['name']}",
                    ],
                );
            }
        }
    }
}
