<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Accounting\Actions\CreateCashTransaction;
use App\Domains\Accounting\Models\ChartOfAccount;
use App\Domains\Identity\Models\User;
use App\Domains\Project\Models\Project;
use App\Domains\Sales\Models\Sales;
use App\Domains\Shared\Enums\FiscalMode;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OperationalExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();
        if (! $user) {
            return;
        }

        $kasKecil = ChartOfAccount::where('code', '1111')->first();
        $bankBca = ChartOfAccount::where('code', '1112')->first();
        $bankMandiri = ChartOfAccount::where('code', '1113')->first();

        // Expense Accounts
        $accGaji = ChartOfAccount::where('code', '5210')->first();      // Beban Gaji & Bonus / Komisi
        $accSewaKantor = ChartOfAccount::where('code', '5220')->first(); // Beban Sewa Kantor
        $accUtilitas = ChartOfAccount::where('code', '5230')->first();   // Beban Listrik, Air, Internet
        $accOpexUmum = ChartOfAccount::where('code', '5240')->first();   // Beban Operasional Lapangan & Bensin
        $accAtk = ChartOfAccount::where('code', '5250')->first();        // Beban ATK Kantor
        $accAdminBank = ChartOfAccount::where('code', '5910')->first();  // Beban Admin Bank
        $accListrikTitik = ChartOfAccount::where('code', '5140')->first(); // Listrik Titik Reklame (PLN)

        if (! $bankBca || ! $kasKecil || ! $accGaji) {
            return;
        }

        $createCashTx = new CreateCashTransaction();
        $salesList = Sales::all();
        $projects = Project::all();

        $now = now();

        // 3 Bulan ke belakang hingga bulan berjalan (offset 0, 1, 2)
        for ($monthOffset = 2; $monthOffset >= 0; $monthOffset--) {
            $baseDate = (clone $now)->subMonths($monthOffset);

            // 1. Pembayaran Gaji Karyawan Rutin (Setiap tanggal 25)
            $gajiDate = (clone $baseDate)->startOfMonth()->addDays(24)->format('Y-m-d');
            $createCashTx->execute([
                'fiscal_mode'        => FiscalMode::PPN,
                'payment_account_id' => $bankBca->id,
                'expense_account_id' => $accGaji->id,
                'amount'             => 28_500_000,
                'transaction_date'   => $gajiDate,
                'recipient'          => 'Seluruh Karyawan & Staff',
                'description'        => 'Gaji Rutin Karyawan & Staff Periode ' . Carbon::parse($gajiDate)->translatedFormat('F Y'),
                'created_by'         => $user->id,
            ]);

            // 2. Pembayaran Bonus & Komisi Sales (Setiap tanggal 28)
            if ($salesList->isNotEmpty()) {
                foreach ($salesList->take(3) as $sIdx => $sales) {
                    $komisiAmt = ($sIdx + 1) * 2_500_000;
                    $komisiDate = (clone $baseDate)->startOfMonth()->addDays(27)->format('Y-m-d');

                    $createCashTx->execute([
                        'fiscal_mode'        => FiscalMode::PPN,
                        'payment_account_id' => $bankBca->id,
                        'expense_account_id' => $accGaji->id,
                        'amount'             => $komisiAmt,
                        'transaction_date'   => $komisiDate,
                        'recipient'          => $sales->name,
                        'description'        => "Pembayaran Komisi & Insentif Closing Sales - {$sales->name}",
                        'created_by'         => $user->id,
                    ]);
                }
            }

            // 3. Beban Listrik, Air & Internet Kantor (Tanggal 10)
            if ($accUtilitas) {
                $utilitasDate = (clone $baseDate)->startOfMonth()->addDays(9)->format('Y-m-d');
                $createCashTx->execute([
                    'fiscal_mode'        => FiscalMode::NON_PPN,
                    'payment_account_id' => $bankBca->id,
                    'expense_account_id' => $accUtilitas->id,
                    'amount'             => 3_450_000,
                    'transaction_date'   => $utilitasDate,
                    'recipient'          => 'PLN & Indihome Telkom',
                    'description'        => 'Tagihan Listrik Kantor Pusat & Internet Dedicated',
                    'created_by'         => $user->id,
                ]);
            }

            // 4. Token Listrik Titik Reklame (Tanggal 12)
            if ($accListrikTitik) {
                $prj = $projects->isNotEmpty() ? $projects[$monthOffset % $projects->count()] : null;
                $listrikTitikDate = (clone $baseDate)->startOfMonth()->addDays(11)->format('Y-m-d');

                $createCashTx->execute([
                    'fiscal_mode'        => FiscalMode::PPN,
                    'payment_account_id' => $kasKecil->id,
                    'expense_account_id' => $accListrikTitik->id,
                    'project_id'         => $prj?->id,
                    'amount'             => 1_800_000,
                    'transaction_date'   => $listrikTitikDate,
                    'recipient'          => 'PLN Prepaid Reklame',
                    'description'        => 'Pembelian Token Listrik Sorot Billboard Simpang Lima',
                    'created_by'         => $user->id,
                ]);
            }

            // 5. ATK, Fotocopy & Kebutuhan Kantor (Tanggal 15 via Kas Kecil)
            if ($accAtk) {
                $atkDate = (clone $baseDate)->startOfMonth()->addDays(14)->format('Y-m-d');
                $createCashTx->execute([
                    'fiscal_mode'        => FiscalMode::NON_PPN,
                    'payment_account_id' => $kasKecil->id,
                    'expense_account_id' => $accAtk->id,
                    'amount'             => 850_000,
                    'transaction_date'   => $atkDate,
                    'recipient'          => 'Toko ATK Jaya Abadi',
                    'description'        => 'Kertas HVS, Tinta Printer, Map Folder & Perlengkapan Arsip',
                    'created_by'         => $user->id,
                ]);
            }

            // 6. Operasional Lapangan, Bensin & Tol Survey (Tanggal 18 via Kas Kecil)
            if ($accOpexUmum) {
                $opexDate = (clone $baseDate)->startOfMonth()->addDays(17)->format('Y-m-d');
                $createCashTx->execute([
                    'fiscal_mode'        => FiscalMode::NON_PPN,
                    'payment_account_id' => $kasKecil->id,
                    'expense_account_id' => $accOpexUmum->id,
                    'amount'             => 1_250_000,
                    'transaction_date'   => $opexDate,
                    'recipient'          => 'Tim Lapangan Survey',
                    'description'        => 'Bensin Kendaraan Operasional & E-Toll Survey Titik Lokasi Solo-Jogja',
                    'created_by'         => $user->id,
                ]);
            }

            // 7. Biaya Administrasi Bank & Maintenance Bulanan (Tanggal akhir bulan)
            if ($accAdminBank) {
                $adminDate = (clone $baseDate)->endOfMonth()->format('Y-m-d');
                $createCashTx->execute([
                    'fiscal_mode'        => FiscalMode::PPN,
                    'payment_account_id' => $bankBca->id,
                    'expense_account_id' => $accAdminBank->id,
                    'amount'             => 75_000,
                    'transaction_date'   => $adminDate,
                    'recipient'          => 'Bank BCA',
                    'description'        => 'Biaya Admin Rekening Giro & Fasilitas Internet Banking',
                    'created_by'         => $user->id,
                ]);
            }
        }
    }
}
