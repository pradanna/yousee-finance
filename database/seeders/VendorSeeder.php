<?php

declare(strict_types=1);

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
        $namedVendors = [
            [
                'name' => 'PT. Megah Billboard Jaya',
                'npwp' => '01.234.567.8-901.000',
                'phone' => '081234567890',
                'email' => 'sales@megahbillboard.com',
                'address' => 'Jl. Raya Darmo No. 45, Surabaya',
                'is_archived' => false,
            ],
            [
                'name' => 'PT. Promosi Outdoor Kreasindo',
                'npwp' => '12.345.678.9-012.000',
                'phone' => '081398765432',
                'email' => 'contact@outdoorkreasindo.co.id',
                'address' => 'Jl. Gatot Subroto Kav. 18, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'CV. Media Ad Perkasa',
                'npwp' => null,
                'phone' => '085712348899',
                'email' => 'admin@mediaadperkasa.com',
                'address' => 'Jl. Basuki Rahmat No. 12, Malang',
                'is_archived' => false,
            ],
            [
                'name' => 'CV. Citra Bali Billboard',
                'npwp' => '89.123.456.7-891.000',
                'phone' => '087865432100',
                'email' => 'citrabali@gmail.com',
                'address' => 'Jl. Bypass Ngurah Rai No. 88, Denpasar',
                'is_archived' => true,
            ],
            [
                'name' => 'PT. Sinar Reklame Nusantara',
                'npwp' => '03.456.789.0-123.000',
                'phone' => '081122334455',
                'email' => 'info@sinarreklame.id',
                'address' => 'Jl. Pemuda No. 77, Semarang',
                'is_archived' => false,
            ],
            [
                'name' => 'CV. Kreasi Neon Mandiri',
                'npwp' => null,
                'phone' => '082155667788',
                'email' => 'kreasineon@yahoo.co.id',
                'address' => 'Jl. Veteran No. 34, Solo',
                'is_archived' => false,
            ],
            [
                'name' => 'PT. Multi Visual Indonesia',
                'npwp' => '05.678.901.2-345.000',
                'phone' => '081901234567',
                'email' => 'multivisual.adv@gmail.com',
                'address' => 'Jl. Malioboro No. 101, Yogyakarta',
                'is_archived' => false,
            ],
            [
                'name' => 'CV. Digital Print Perkasa',
                'npwp' => null,
                'phone' => '085699887766',
                'email' => 'order@digitalprintperkasa.com',
                'address' => 'Jl. Ahmad Yani No. 50, Bandung',
                'is_archived' => false,
            ],
            [
                'name' => 'PT. Baliho Jaya Abadi',
                'npwp' => '07.890.123.4-567.000',
                'phone' => '081288990011',
                'email' => 'corporate@balihojaya.com',
                'address' => 'Jl. HR Rasuna Said Blok X, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'CV. Billboard Timur Sentosa',
                'npwp' => null,
                'phone' => '087711223344',
                'email' => 'timursentosa.adv@gmail.com',
                'address' => 'Jl. Pengayoman No. 15, Makassar',
                'is_archived' => true,
            ],
        ];

        foreach ($namedVendors as $item) {
            Vendor::firstOrCreate(
                ['name' => $item['name']],
                $item
            );
        }

        // Generate factory vendors if total < 14
        if (Vendor::count() < 14) {
            Vendor::factory()->count(14 - Vendor::count())->create();
        }
    }
}
