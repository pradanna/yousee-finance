# Master Checklist: Implementasi Laporan Arus Kas (Cashflow Report)

Dokumen ini berisi roadmap dan checklist komprehensif untuk pembangunan fitur **Laporan Arus Kas (*Cashflow Report*)** terstandar **PSAK 2** yang terhubung langsung ke database transaksi dan buku besar (*General Ledger*) YouSee Finance.

---

## 🎯 Target & Ruang Lingkup Fitur

1. **Integrasi Transaksi Riil**:
   - **Arus Kas Masuk (*Inflow*)**: Pelunasan Piutang Invoice Client, Pendapatan Non-Project, dan Setoran Modal Pemilik.
   - **Arus Kas Keluar (*Outflow*)**: Pelunasan Hutang PO Vendor, Pengeluaran Beban Kas Langsung (*Direct Expense*), Penyetoran Pajak Kas Negara (NTPN), dan Pembelian Aset Billboard.
2. **Kesesuaian Standar Akuntansi (PSAK 2)**:
   - **Metode Langsung (*Direct Method*)**: Arus kas operasi dari penerimaan bruto pelanggan dikurangi pengeluaran bruto vendor/beban/pajak.
   - **Metode Tidak Langsung (*Indirect Method*) & Rekonsiliasi**: Rekonsiliasi Laba Bersih (*Net Profit*) dengan penyesuaian pos non-kas (penyusutan aset) dan perubahan modal kerja (piutang, hutang, pajak).
3. **Penanganan Kas Internal (*Inter-Account Transfers*)**:
   - Pemindahan dana antar rekening (misal: Mandiri $\rightarrow$ BCA atau Bank $\rightarrow$ Kas Kecil) tercatat rapi di mutasi bank tanpa mendistorsi arus kas bersih PSAK.
4. **Rekapitulasi Saldo Kas & Bank Dinamis**:
   - Perhitungan saldo awal dinamis (*Beginning Balance*) dari riwayat buku besar sebelum periode berjalan, mutasi masuk, mutasi keluar, dan saldo akhir per rekening (*Bank Mandiri, BCA, BRI, Kas Tunai*).
5. **Filter Fleksibel (Periode, Akun Bank, Mode Fiskal & Proyek)**:
   - Filter per Bulan/Tahun, Rentang Tanggal Kustom, Akun Kas/Bank, Kategori PSAK, Mode Fiskal (PPN vs Non-PPN), dan Filter Titik Billboard/Proyek.
6. **Proteksi Kunci Periode (*Closing Period Lock*)**:
   - Deteksi otomatis periode yang telah dikunci oleh Pimpinan/Owner (*Read-Only Mode*).
7. **Ekspor & Cetak Laporan Resmi**:
   - Cetak PDF resmi ber-kop surat dengan kolom tanda tangan otorisasi dan ekspor data CSV/Excel.

---

## 📋 Checklist Pekerjaan Lengkap

### Phase 1: Backend Architecture & Data Engine (Lite DDD)

- [x] **1.1. Action Class Data Retrieval (`GetCashflowReportData.php`)**
  - [x] Path: `app/Domains/Accounting/Actions/GetCashflowReportData.php`
  - [x] **Kalkulasi Saldo Awal Dinamis**: Query saldo awal kas & bank dari pembukuan COA + mutasi kumulatif sebelum awal periode terpilih.
  - [x] **Query Arus Kas Masuk (Inflow)**:
    - [x] Pelunasan Invoice Client (`PaymentSettlement` / Jurnal Piutang `1121` $\rightarrow$ Kas/Bank).
    - [x] Penerimaan kas lainnya / pendapatan bunga / setoran modal (`3100`).
  - [x] **Query Arus Kas Keluar (Outflow)**:
    - [x] Pelunasan PO Vendor (`PaymentSettlement` / Jurnal Hutang `2110` $\rightarrow$ Kas/Bank).
    - [x] Pengeluaran kas langsung / operasional kantor (`CashTransaction` Beban `5xxx` $\rightarrow$ Kas/Bank).
    - [x] Penyetoran pajak kas negara NTPN (`TaxSettlement` PPN `2121` $\rightarrow$ Kas/Bank).
    - [x] Belanja modal / konstruksi aset billboard (`1200`).
  - [x] **Penanganan Transfer Antar Rekening (*Internal Transfers*)**:
    - [x] Deteksi mutasi antar kas/bank (Debit Kas A, Kredit Kas B) dan tandai sebagai `is_internal_transfer = true` agar tidak mendistorsi total Inflow/Outflow bersih PSAK.
  - [x] **Komputasi PSAK 2 (Direct & Indirect Method)**:
    - [x] 1. Aktivitas Operasi (*Operating Activities*)
    - [x] 2. Aktivitas Investasi (*Investing Activities*)
    - [x] 3. Aktivitas Pendanaan (*Financing Activities*)
    - [x] Rekonsiliasi Laba Bersih ke Kas Bersih Operasi (*Indirect reconciliation*).
  - [x] **Komputasi Saldo Berjalan (*Running Balance*)**: Kalkulasi saldo kumulatif per baris transaksi secara kronologis.
  - [x] **Rekapitulasi Saldo per Rekening Kas & Bank**: Saldo awal, total masuk, total keluar, dan saldo akhir untuk `1111` (Kas Kecil), `1112` (BCA), `1113` (Mandiri), `1114` (BRI).
  - [x] **Filter Multi-dimensi**: Dukungan filter Periode Bulan/Tahun, Rentang Tanggal, Akun Bank, Fiscal Mode (PPN / Non-PPN), dan Proyek.

- [x] **1.2. Controller & Endpoints (`CashflowReportController.php`)**
  - [x] Path: `app/Http/Controllers/Accounting/CashflowReportController.php`
  - [x] Method `index(Request $request)`: Mengambil data dari action dan merender halaman Inertia `CashflowReport`.
  - [x] Method `exportPdf(Request $request)`: Menghasilkan dokumen PDF resmi Laporan Arus Kas PSAK 2 & Rekap Kas Bank.
  - [x] Query status `ClosingPeriod` untuk mengirimkan prop `lockedPeriods` ke frontend.

- [x] **1.3. Web Routing (`routes/web.php`)**
  - [x] Daftarkan `Route::get('/cashflow', [CashflowReportController::class, 'index'])->name('cashflow')`.
  - [x] Daftarkan `Route::match(['get', 'post'], '/cashflow-pdf', [CashflowReportController::class, 'exportPdf'])->name('cashflow.pdf')`.

---

### Phase 2: Modular Frontend Architecture (React + TypeScript)

- [x] **2.1. Type Definitions (`cashflowTypes.ts`)**
  - [x] Path: `resources/js/Pages/CashflowReport/cashflowTypes.ts`
  - [x] Definisi tipe: `CashflowEntry`, `BankAccountBalance`, `PsakCashflowSummary`, `CashflowReportProps`.
  - [x] Strict Typing Policy: Zero `any`.

- [x] **2.2. Executive Summary Metrics Cards (`CashflowMetricsCards.tsx`)**
  - [x] Path: `resources/js/Pages/CashflowReport/Components/CashflowMetricsCards.tsx`
  - [x] Card 1: Saldo Awal Kas & Bank (*Beginning Cash Balance*).
  - [x] Card 2: Total Kas Masuk (*Total Cash Inflow*).
  - [x] Card 3: Total Kas Keluar (*Total Cash Outflow*).
  - [x] Card 4: Saldo Akhir Kas & Net Cash Movement (*Ending Balance*).

- [x] **2.3. Tab 1: Buku Kas & Mutasi Harian (`CashflowRegistryTab.tsx`)**
  - [x] Path: `resources/js/Pages/CashflowReport/Tabs/CashflowRegistryTab.tsx`
  - [x] Toolbar filter: Pencarian teks, filter akun bank, filter kategori PSAK, filter jenis kas (Masuk/Keluar), filter proyek.
  - [x] Tabel interaktif dengan badge kategori, nominal terformat berwarna (*emerald untuk masuk, rose untuk keluar, slate untuk transfer*), dan kolom Saldo Berjalan (*Running Balance*).
  - [x] Modal Detail Mutasi Kas (menampilkan nomor referensi, partner, proyek, akun lawan, dan deskripsi).
  - [x] Pagination & Empty state handling.

- [x] **2.4. Tab 2: Format Resmi PSAK 2 (`CashflowPsakTab.tsx`)**
  - [x] Path: `resources/js/Pages/CashflowReport/Tabs/CashflowPsakTab.tsx`
  - [x] Toggle tampilan: **Metode Langsung (*Direct*)** vs **Metode Tidak Langsung (*Indirect*)**.
  - [x] Hierarki laporan formal:
    - **1. Arus Kas dari Aktivitas Operasi (*Operating Activities*)**
    - **2. Arus Kas dari Aktivitas Investasi (*Investing Activities*)**
    - **3. Arus Kas dari Aktivitas Pendanaan (*Financing Activities*)**
    - **Kenaikan / (Penurunan) Bersih Kas dan Setara Kas**
    - **Saldo Kas dan Setara Kas Awal Periode**
    - **Saldo Kas dan Setara Kas Akhir Periode**

- [x] **2.5. Tab 3: Rekap Rekening Kas & Bank (`CashflowBankAccountsTab.tsx`)**
  - [x] Path: `resources/js/Pages/CashflowReport/Tabs/CashflowBankAccountsTab.tsx`
  - [x] Kartu ringkasan saldo per akun kas & bank (Kas Kecil, BCA Utama, Mandiri Solo Baru, BRI Operasional).
  - [x] Tampilan nomor rekening resmi, mutasi masuk, mutasi keluar, saldo saat ini, dan progress bar likuiditas.

- [x] **2.6. Refactor Main Page Shell (`CashflowReport.tsx`)**
  - [x] Path: `resources/js/Pages/CashflowReport.tsx`
  - [x] Header terintegrasi dengan MonthPicker, pemilih Fiscal Mode, indikator periode terkunci (*Closing Period Lock*).
  - [x] Tombol Export CSV/Excel dan tombol Cetak PDF resmi.
  - [x] Banner peringatan ketika periode dalam status terkunci.

---

### Phase 3: PDF Document Generation

- [x] **3.1. Template Blade PDF (`cashflow-report-pdf.blade.php`)**
  - [x] Path: `resources/views/pdf/cashflow-report-pdf.blade.php`
  - [x] Kop surat resmi YouSee Indonesia lengkap dengan alamat dan kontak.
  - [x] Format laporan arus kas formal PSAK 2 (Aktivitas Operasi, Investasi, Pendanaan).
  - [x] Tabel ringkasan posisi kas & saldo per rekening bank.
  - [x] Kolom tanda tangan otorisasi (*Disiapkan oleh Finance, Diperiksa oleh Accounting, Disetujui oleh Pimpinan*).

---

### Phase 4: Automated Testing & Verifikasi

- [x] **4.1. Automated Feature Test (`CashflowReportTest.php`)**
  - [x] Path: `tests/Feature/Accounting/CashflowReportTest.php`
  - [x] Test 1: Halaman `/cashflow` dapat diakses dan merender props dari database riil.
  - [x] Test 2: Perhitungan saldo awal dinamis dan saldo berjalan (*running balance*) akurat.
  - [x] Test 3: Pelunasan invoice client masuk ke Arus Kas Operasi (Inflow).
  - [x] Test 4: Pelunasan PO vendor dan beban operasional masuk ke Arus Kas Outflow.
  - [x] Test 5: Transfer antar bank (*Internal transfer*) tidak merusak total kas bersih.
  - [x] Test 6: Status periode terkunci (*Closing Period*) terkirim di props.
  - [x] Test 7: Endpoint export PDF menghasilkan stream PDF yang valid.

- [x] **4.2. Code Quality & Build Verification**
  - [x] `php artisan test --filter=Accounting` (21/21 test PASS, 162 assertions).
  - [x] `npx prettier --write "resources/js/Pages/CashflowReport.tsx" "resources/js/Pages/CashflowReport/**/*.tsx"` (0 error).
  - [x] `npx eslint resources/js/Pages/CashflowReport.tsx resources/js/Pages/CashflowReport/` (0 error).
  - [x] `npx tsc --noEmit` (0 Type Error).
  - [x] `npm run build` (Vite production build sukses dalam 5.86s).
