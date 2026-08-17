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
        $clients = [
            [
                'name' => 'PT Gojek Tokopedia Tbk',
                'npwp' => '01.555.666.7-001.000',
                'email' => 'billing@gotocompany.com',
                'phone' => '081288990011',
                'address' => 'Pasaraya Blok M Gedung B Lt. 6-7, Jl. Iskandarsyah II No. 2, Kebayoran Baru, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Shopee International Indonesia',
                'npwp' => '02.444.888.9-002.000',
                'email' => 'finance@shopee.co.id',
                'phone' => '081399887766',
                'address' => 'Pacific Century Place Tower Lt. 26, SCBD Lot 10, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Traveloka Indonesia',
                'npwp' => '03.777.999.1-003.000',
                'email' => 'ap@traveloka.com',
                'phone' => '082133445566',
                'address' => 'Wisma Barito Pacific Tower B Lt. 2-5, Jl. Letjen S. Parman Kav. 62-63, Jakarta Barat',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Indofood CBP Sukses Makmur Tbk',
                'npwp' => '01.321.654.9-014.000',
                'email' => 'procurement@icbp.indofood.co.id',
                'phone' => '081122334455',
                'address' => 'Sudirman Plaza, Indofood Tower Lt. 23, Jl. Jend. Sudirman Kav. 76-78, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Telekomunikasi Selular (Telkomsel)',
                'npwp' => '01.654.987.2-021.000',
                'email' => 'marketing.ads@telkomsel.co.id',
                'phone' => '081299001122',
                'address' => 'Telkom Landmark Tower Lt. 18, Jl. Jend. Gatot Subroto Kav. 52, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Bank Central Asia Tbk',
                'npwp' => '01.111.222.3-031.000',
                'email' => 'corporate.comm@bca.co.id',
                'phone' => '081577889900',
                'address' => 'Menara BCA, Grand Indonesia, Jl. M.H. Thamrin No. 1, Jakarta Pusat',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Unilever Indonesia Tbk',
                'npwp' => '01.234.567.8-041.000',
                'email' => 'media.buying@unilever.com',
                'phone' => '081688997711',
                'address' => 'Grha Unilever, Green Office Park Kav. 3, BSD City, Tangerang',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Astra International Tbk',
                'npwp' => '01.888.777.6-051.000',
                'email' => 'advertising@astra.co.id',
                'phone' => '081822334499',
                'address' => 'Menara Astra Lt. 55, Jl. Jend. Sudirman Kav. 5-6, Jakarta Pusat',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Paragon Technology and Innovation (Wardah)',
                'npwp' => '02.999.888.7-061.000',
                'email' => 'marketing.ooh@pti-cosmetics.com',
                'phone' => '081900112233',
                'address' => 'Jl. Swadarma Raya Kp. Baru No. 1, Ulujami, Pesanggrahan, Jakarta Selatan',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Djarum',
                'npwp' => '01.444.333.2-071.000',
                'email' => 'promo.outdoor@djarum.com',
                'phone' => '081199882233',
                'address' => 'Jl. Aipda K.S. Tubun 2C No. 57, Slipi, Palmerah, Jakarta Barat',
                'is_archived' => false,
            ],
            [
                'name' => 'CV Sumber Makmur Bersama (Non-PKP)',
                'npwp' => null,
                'email' => 'sumbermakmur@gmail.com',
                'phone' => '085712345678',
                'address' => 'Jl. Pahlawan No. 45, Semarang, Jawa Tengah',
                'is_archived' => false,
            ],
            [
                'name' => 'UD Berkah Abadi Jaya (Non-PKP)',
                'npwp' => null,
                'email' => 'berkahabadi@yahoo.com',
                'phone' => '087889901122',
                'address' => 'Jl. Pemuda No. 88, Surabaya, Jawa Timur',
                'is_archived' => false,
            ],
            [
                'name' => 'Klinik Sehat Utama (Non-PKP)',
                'npwp' => null,
                'email' => 'admin@kliniksehat.com',
                'phone' => '081377889900',
                'address' => 'Jl. Gejayan No. 12, Sleman, DI Yogyakarta',
                'is_archived' => false,
            ],
            [
                'name' => 'PT Cipta Kreasi Dinamika (Arsip)',
                'npwp' => '03.123.456.7-081.000',
                'email' => 'contact@ciptakreasi.co.id',
                'phone' => '081255667788',
                'address' => 'Ruko Golden Boulevard Blok W No. 12, BSD City, Tangerang',
                'is_archived' => true,
            ],
            [
                'name' => 'Toko Elektronik Sinar Terang (Arsip)',
                'npwp' => null,
                'email' => 'sinarterang@gmail.com',
                'phone' => '085611223344',
                'address' => 'Jl. Malioboro No. 25, Yogyakarta',
                'is_archived' => true,
            ],
        ];

        foreach ($clients as $clientData) {
            Client::firstOrCreate(
                ['name' => $clientData['name']],
                $clientData
            );
        }
    }
}
