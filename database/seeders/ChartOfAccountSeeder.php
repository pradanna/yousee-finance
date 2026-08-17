<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Accounting\Enums\AccountType;
use App\Domains\Accounting\Enums\NormalBalance;
use App\Domains\Accounting\Models\AccountingSetting;
use App\Domains\Accounting\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────────────────────────────
        // 1. ASSETS (1000)
        // ─────────────────────────────────────────────────────────────────────
        $hAsset = $this->createAccount(null, '1000', 'Aset (Aktiva)', AccountType::ASSET, NormalBalance::DEBIT, 'Header Utama Aset');
        $hCurrentAsset = $this->createAccount($hAsset->id, '1100', 'Aset Lancar', AccountType::ASSET, NormalBalance::DEBIT, 'Sub-header Aset Lancar');

        // Kas & Bank (1110)
        $hCashBank = $this->createAccount($hCurrentAsset->id, '1110', 'Kas & Bank', AccountType::ASSET, NormalBalance::DEBIT, 'Header Kas & Bank');
        $kasBesar = $this->createAccount($hCashBank->id, '1111', 'Kas Operasional / Kas Kecil', AccountType::ASSET, NormalBalance::DEBIT);
        $bankBca = $this->createAccount($hCashBank->id, '1112', 'Bank BCA Operasional', AccountType::ASSET, NormalBalance::DEBIT);
        $bankMandiri = $this->createAccount($hCashBank->id, '1113', 'Bank Mandiri', AccountType::ASSET, NormalBalance::DEBIT);
        $bankBri = $this->createAccount($hCashBank->id, '1114', 'Bank BRI', AccountType::ASSET, NormalBalance::DEBIT);

        // Piutang (1120)
        $hReceivable = $this->createAccount($hCurrentAsset->id, '1120', 'Piutang', AccountType::ASSET, NormalBalance::DEBIT, 'Header Piutang');
        $piutangClient = $this->createAccount($hReceivable->id, '1121', 'Piutang Dagang Client', AccountType::ASSET, NormalBalance::DEBIT);
        $piutangLain = $this->createAccount($hReceivable->id, '1129', 'Piutang Lain-lain', AccountType::ASSET, NormalBalance::DEBIT);

        // Pajak Dibayar di Muka & PPN Masukan (1140)
        $hPrepaidTax = $this->createAccount($hCurrentAsset->id, '1140', 'Pajak Dibayar di Muka', AccountType::ASSET, NormalBalance::DEBIT, 'Header Pajak di Muka');
        $ppnMasukan = $this->createAccount($hPrepaidTax->id, '1141', 'PPN Masukan (Input VAT 11%)', AccountType::ASSET, NormalBalance::DEBIT);
        $pph23DibayarMuka = $this->createAccount($hPrepaidTax->id, '1142', 'PPh Pasal 23 Dibayar di Muka', AccountType::ASSET, NormalBalance::DEBIT);

        // Biaya Dibayar di Muka (1150)
        $hPrepaidExpense = $this->createAccount($hCurrentAsset->id, '1150', 'Beban Dibayar di Muka', AccountType::ASSET, NormalBalance::DEBIT, 'Header Uang Muka Biaya');
        $sewaDibayarMuka = $this->createAccount($hPrepaidExpense->id, '1151', 'Sewa Lahan & Titik Dibayar di Muka', AccountType::ASSET, NormalBalance::DEBIT);
        $asuransiDibayarMuka = $this->createAccount($hPrepaidExpense->id, '1152', 'Asuransi Dibayar di Muka', AccountType::ASSET, NormalBalance::DEBIT);

        // Aset Tetap (1200)
        $hFixedAsset = $this->createAccount($hAsset->id, '1200', 'Aset Tetap', AccountType::ASSET, NormalBalance::DEBIT, 'Header Aset Tetap');
        $peralatanProyek = $this->createAccount($hFixedAsset->id, '1210', 'Peralatan & Konstruksi Billboard', AccountType::ASSET, NormalBalance::DEBIT);
        $kendaraan = $this->createAccount($hFixedAsset->id, '1220', 'Kendaraan Operasional', AccountType::ASSET, NormalBalance::DEBIT);
        $peralatanKantor = $this->createAccount($hFixedAsset->id, '1230', 'Peralatan Kantor & Komputer', AccountType::ASSET, NormalBalance::DEBIT);
        $akumPenyusutan = $this->createAccount($hFixedAsset->id, '1290', 'Akumulasi Penyusutan Aset Tetap', AccountType::ASSET, NormalBalance::CREDIT, 'Kontra Aset');

        // ─────────────────────────────────────────────────────────────────────
        // 2. LIABILITIES (2000)
        // ─────────────────────────────────────────────────────────────────────
        $hLiability = $this->createAccount(null, '2000', 'Kewajiban & Hutang', AccountType::LIABILITY, NormalBalance::CREDIT, 'Header Utama Kewajiban');
        $hCurrentLiability = $this->createAccount($hLiability->id, '2100', 'Hutang Lancar (Jangka Pendek)', AccountType::LIABILITY, NormalBalance::CREDIT, 'Sub-header Hutang Lancar');

        // Hutang Dagang (2110)
        $hutangVendor = $this->createAccount($hCurrentLiability->id, '2110', 'Hutang Dagang Vendor', AccountType::LIABILITY, NormalBalance::CREDIT);
        $hutangLain = $this->createAccount($hCurrentLiability->id, '2119', 'Hutang Non-Vendor Lainnya', AccountType::LIABILITY, NormalBalance::CREDIT);

        // Hutang Pajak (2120)
        $hTaxLiability = $this->createAccount($hCurrentLiability->id, '2120', 'Hutang Pajak', AccountType::LIABILITY, NormalBalance::CREDIT, 'Header Hutang Pajak');
        $ppnKeluaran = $this->createAccount($hTaxLiability->id, '2121', 'PPN Keluaran (Output VAT 11%)', AccountType::LIABILITY, NormalBalance::CREDIT);
        $hutangPph = $this->createAccount($hTaxLiability->id, '2122', 'Hutang PPh Pemotongan (PPh 21/23/Final)', AccountType::LIABILITY, NormalBalance::CREDIT);

        // Hutang Biaya / Akrual (2150)
        $hutangBeban = $this->createAccount($hCurrentLiability->id, '2150', 'Hutang Biaya & Akrual', AccountType::LIABILITY, NormalBalance::CREDIT);

        // ─────────────────────────────────────────────────────────────────────
        // 3. EQUITY (3000)
        // ─────────────────────────────────────────────────────────────────────
        $hEquity = $this->createAccount(null, '3000', 'Ekuitas (Modal)', AccountType::EQUITY, NormalBalance::CREDIT, 'Header Utama Ekuitas');
        $modalDisetor = $this->createAccount($hEquity->id, '3100', 'Modal Disetor Pemilik', AccountType::EQUITY, NormalBalance::CREDIT);
        $labaDitahan = $this->createAccount($hEquity->id, '3200', 'Laba Ditahan (Retained Earnings)', AccountType::EQUITY, NormalBalance::CREDIT);
        $labaTahunBerjalan = $this->createAccount($hEquity->id, '3300', 'Laba (Rugi) Periode Berjalan', AccountType::EQUITY, NormalBalance::CREDIT);
        $openingBalanceEquity = $this->createAccount($hEquity->id, '3900', 'Opening Balance Equity', AccountType::EQUITY, NormalBalance::CREDIT, 'Saldo Penyeimbang Migrasi Awal');

        // ─────────────────────────────────────────────────────────────────────
        // 4. REVENUE (4000)
        // ─────────────────────────────────────────────────────────────────────
        $hRevenue = $this->createAccount(null, '4000', 'Pendapatan Usaha', AccountType::REVENUE, NormalBalance::CREDIT, 'Header Utama Pendapatan');
        $pendapatanSewaMedia = $this->createAccount($hRevenue->id, '4100', 'Pendapatan Sewa Media Reklame & Iklan', AccountType::REVENUE, NormalBalance::CREDIT);
        $pendapatanProduksi = $this->createAccount($hRevenue->id, '4200', 'Pendapatan Cetak Visual & Pasang Banner', AccountType::REVENUE, NormalBalance::CREDIT);
        $pendapatanLain = $this->createAccount($hRevenue->id, '4900', 'Pendapatan Non-Operasional / Lain-lain', AccountType::REVENUE, NormalBalance::CREDIT);

        // ─────────────────────────────────────────────────────────────────────
        // 5. EXPENSES (5000)
        // ─────────────────────────────────────────────────────────────────────
        $hExpense = $this->createAccount(null, '5000', 'Beban & Biaya', AccountType::EXPENSE, NormalBalance::DEBIT, 'Header Utama Beban');

        // HPP / Biaya Pokok Proyek (5100)
        $hCogs = $this->createAccount($hExpense->id, '5100', 'Harga Pokok Penjualan (HPP)', AccountType::EXPENSE, NormalBalance::DEBIT, 'Header HPP');
        $bebanHppVendor = $this->createAccount($hCogs->id, '5110', 'Beban Sewa Titik Vendor (PO)', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanProduksiKonstruksi = $this->createAccount($hCogs->id, '5120', 'Beban Produksi, Visual & Konstruksi', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanPajakReklame = $this->createAccount($hCogs->id, '5130', 'Beban Pajak Reklame / Retribusi Titik', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanListrikTitik = $this->createAccount($hCogs->id, '5140', 'Beban Listrik Titik Reklame (PLN)', AccountType::EXPENSE, NormalBalance::DEBIT);

        // Beban Operasional & Administrasi (5200)
        $hOpex = $this->createAccount($hExpense->id, '5200', 'Beban Operasional & Kantor', AccountType::EXPENSE, NormalBalance::DEBIT, 'Header Beban Operasional');
        $bebanGaji = $this->createAccount($hOpex->id, '5210', 'Beban Gaji & Tunjangan Karyawan', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanSewaKantor = $this->createAccount($hOpex->id, '5220', 'Beban Sewa Kantor & Operasional', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanUtilitas = $this->createAccount($hOpex->id, '5230', 'Beban Listrik, Air & Internet Kantor', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanOperasionalUmum = $this->createAccount($hOpex->id, '5240', 'Beban Operasional Lapangan & Perjalanan', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanPerlengkapan = $this->createAccount($hOpex->id, '5250', 'Beban Perlengkapan & ATK Kantor', AccountType::EXPENSE, NormalBalance::DEBIT);

        // Beban Penyusutan & Lain-lain (5300 & 5900)
        $bebanPenyusutan = $this->createAccount($hExpense->id, '5300', 'Beban Penyusutan Aset Tetap', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanAdminBank = $this->createAccount($hExpense->id, '5910', 'Beban Administrasi Bank & Transfer', AccountType::EXPENSE, NormalBalance::DEBIT);
        $bebanLainLain = $this->createAccount($hExpense->id, '5990', 'Beban Non-Operasional Lainnya', AccountType::EXPENSE, NormalBalance::DEBIT);

        // ─────────────────────────────────────────────────────────────────────
        // 6. GLOBAL ACCOUNTING SETTINGS (MAPPINGS)
        // ─────────────────────────────────────────────────────────────────────
        $settings = [
            'default_cash'            => [$kasBesar->id, 'Default Akun Kas Tunai'],
            'default_bank'            => [$bankBca->id, 'Default Akun Bank BCA'],
            'default_receivable'      => [$piutangClient->id, 'Default Piutang Dagang Client (Invoice)'],
            'default_payable'         => [$hutangVendor->id, 'Default Hutang Dagang Vendor (PO)'],
            'default_vat_input'       => [$ppnMasukan->id, 'Default PPN Masukan (Purchase VAT 11%)'],
            'default_vat_output'      => [$ppnKeluaran->id, 'Default PPN Keluaran (Sales VAT 11%)'],
            'default_income_tax'      => [$hutangPph->id, 'Default Hutang PPh Pemotongan'],
            'default_sales_revenue'   => [$pendapatanSewaMedia->id, 'Default Pendapatan Sewa Media Iklan'],
            'default_project_expense' => [$bebanHppVendor->id, 'Default Beban HPP Sewa Billboard Vendor'],
            'opening_balance_equity'  => [$openingBalanceEquity->id, 'Default Opening Balance Equity'],
        ];

        foreach ($settings as $key => [$accountId, $desc]) {
            AccountingSetting::updateOrCreate(
                ['key' => $key],
                ['account_id' => $accountId, 'description' => $desc],
            );
        }
    }

    private function createAccount(
        ?string $parentId,
        string $code,
        string $name,
        AccountType $type,
        NormalBalance $normalBalance,
        ?string $desc = null,
    ): ChartOfAccount {
        return ChartOfAccount::updateOrCreate(
            ['code' => $code],
            [
                'parent_id' => $parentId,
                'name' => $name,
                'type' => $type,
                'normal_balance' => $normalBalance,
                'is_active' => true,
                'description' => $desc,
            ],
        );
    }
}
