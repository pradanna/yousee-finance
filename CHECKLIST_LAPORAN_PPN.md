# Checklist Modul Laporan PPN & Rekonsiliasi e-Faktur Pajak (VAT Tax Report)

Dokumen ini berisi spesifikasi arsitektur perpajakan, rekonsiliasi e-Faktur DJP, flow penyetoran kas negara (NTPN), dan daftar checklist pengujian untuk modul **Laporan PPN (`/ppn`)** di YouSee Finance.

---

## 1. Ringkasan Modul & Rute
- **URL Route**: `/ppn`
- **Controller Backend**: [PpnReportController.php](file:///c:/PROJECT/WEBSITE/yousee-finance/app/Http/Controllers/Accounting/PpnReportController.php)
- **PDF Export Controller**: [PpnReportPdfController.php](file:///c:/PROJECT/WEBSITE/yousee-finance/app/Http/Controllers/PpnReportPdfController.php)
- **Page Component Frontend**: [PpnReport.tsx](file:///c:/PROJECT/WEBSITE/yousee-finance/resources/js/Pages/PpnReport.tsx)
- **Domain Terkait (Lite DDD)**: `Accounting`, `Billing`, `Procurement`, `Identity`, `Shared`
- **Kepatuhan Regulasi**: UU HPP (PPN 11%), e-Faktur DJP Versi 4.0 / 3.2, & Formulir SPT Masa PPN 1111.

---

## 2. Fitur Antarmuka Pengguna (Frontend React + TypeScript)

### A. Proteksi Mode Fiskal & Header Finansial
- [x] **Fiscal Mode Protection**:
    - [x] Jika mode fiskal aktif adalah `PPN`: Menampilkan dashboard penuh PPN, e-Faktur, dan rekonsiliasi SPT.
    - [x] Jika mode fiskal aktif adalah `Non-PPN`: Menampilkan layar proteksi edukatif (*Zero Tax Liability / Non-PKP information state*) bahwa entitas bebas dari kewajiban pemungutan PPN.
- [x] **Executive Tax KPI Cards**:
    - [x] **Total PPN Keluaran (Sales / Faktur Pajak Keluaran)**: Menampilkan total nominal PPN 11% yang dipungut dari invoice penjualan client beserta total DPP.
    - [x] **Total PPN Masukan (Purchases / Faktur Pajak Masukan)**: Menampilkan total PPN 11% yang dapat dikreditkan (*creditable*) dari PO vendor rekanan.
    - [x] **Status PPN Net Masa Pajak**:
        - Status **Kurang Bayar (PPN Terutang)** jika PPN Keluaran > PPN Masukan (Wajib disetor ke Kas Negara).
        - Status **Lebih Bayar (PPN Kompensasi)** jika PPN Masukan > PPN Keluaran (Dapat dikompensasikan ke masa pajak berikutnya).
    - [x] **Status Penyetoran Kas Negara (NTPN Card)**: Badge status (*Lunas Disetor* / *Belum Disetor*), nomor NTPN, dan tanggal setor.

---

### B. Header & Aksi Ekspor Resmi (Multi-Format)
- [x] **Aksi Cepat Toolbar**:
    - [x] **Tombol Jejak Audit (`AuditLogModal`)**: Riwayat aktivitas terintegrasi pemungutan PPN, input NSFP, dan pencatatan setor NTPN.
    - [x] **Ekspor Rekapitulasi Excel (`.csv` / `.xlsx`)**: Format rekapitulasi komprehensif (Ringkasan Masa Pajak, Rincian Faktur Keluaran, dan Rincian Faktur Masukan).
    - [x] **Cetak / Ekspor PDF Resmi**: Layout SPT Masa PPN formal dengan logo perusahaan, identitas PKP, ringkasan perhitungan pajak, dan tanda tangan penanggung jawab.
    - [x] **Ekspor CSV Schema Impor e-Faktur DJP**: Format baku `FK` (Faktur Keluaran) yang siap diimpor (*import schema*) langsung ke aplikasi e-Faktur Desktop / Web DJP Online.
    - [x] **Modal Catat Penyetoran Pajak (NTPN)**: Input Nomor Transaksi Penerimaan Negara, tanggal penyetoran, dan pilihan bank persepsi.

---

### C. Tab Navigasi e-Faktur & Tabel Data

#### Tab 1: PPN Keluaran (Penjualan / Client PKP)
- [x] **Kolom Data Utama**:
    - [x] Nomor Dokumen Invoice & Tanggal Transaksi.
    - [x] Nomor Seri Faktur Pajak (NSFP) format baku (`010.XXX-XX.XXXXXXXX`).
    - [x] Identitas Client: Nama Client & NPWP Valid 15/16 digit.
    - [x] Rincian Nilai: Dasar Pengenaan Pajak (DPP), Nilai PPN 11%, dan Total Tagihan.
    - [x] Status e-Faktur: `✓ Approval Sukses`, `Siap Upload DJP`, `Draft Faktur`.
- [x] **Aksi Baris Data**:
    - [x] Edit / Update Nomor Seri Faktur Pajak (NSFP) via modal interaktif.

#### Tab 2: PPN Masukan (Pembelian / Vendor Rekanan PKP)
- [x] **Kolom Data Utama**:
    - [x] Nomor Dokumen Purchase Order (PO) & Tanggal Transaksi.
    - [x] Nomor Seri Faktur Pajak (NSFP) dari vendor rekanan.
    - [x] Identitas Vendor: Nama Perusahaan Vendor & NPWP.
    - [x] Rincian Nilai: DPP, PPN 11%, dan Total PO.
    - [x] Status Pengkreditan Pajak (*Dapat Dikreditkan / Creditable* vs *Tidak Dapat Dikreditkan / Non-Creditable*).
    - [x] Status e-Faktur DJP.
- [x] **Aksi Baris Data**:
    - [x] Edit / Input NSFP Faktur Masukan dari vendor.
    - [x] Lihat Rincian Faktur Masukan.

#### Tab 3: Rekap SPT Masa PPN 1111 & Penyetoran Kas Negara
- [x] **Struktur Rekonsiliasi Induk SPT**:
    - [x] Bagian I: Penyerahan BKP / JKP (DPP & PPN Keluaran).
    - [x] Bagian II: Penghitungan PPN Kurang/Lebih Bayar (PPN Keluaran − PPN Masukan).
    - [x] Bagian III: Pelunasan PPN Kurang Bayar (Bukti NTPN, Tanggal Setor, Bank Persepsi Penyetor).

---

### D. Panel Filter & Pencarian
- [x] **Filter Cerdas**:
    - [x] Pencarian instan (NSFP, No Invoice, No PO, Nama Client/Vendor, atau NPWP).
    - [x] Filter Status Approval e-Faktur (`Semua Status`, `Approval Sukses`, `Siap Upload DJP`, `Draft Faktur`, `Dapat Dikreditkan`).
    - [x] Filter Masa Pajak terpadu menggunakan **MonthPicker** (Default bulan & tahun berjalan, mendukung opsi `Semua Masa Pajak`).
    - [x] Pagination dinamis per tab data.

---

## 3. Integrasi Backend, Validasi & Aturan Bisnis Perpajakan

### A. Otomatisasi Perhitungan Pajak (11% VAT Business Rules)
- [x] **Formula DPP & PPN Otomatis**:
    $$\text{PPN} = \text{round}(\text{DPP} \times 11\%)$$
    $$\text{Total Invoice / PO} = \text{DPP} + \text{PPN}$$
- [x] **Sinkronisasi Otomatis Dokumen Penjualan & Pembelian Melalui Database Riil**:
    - [x] `PpnReportController@index` melakukan *eager-loading* dari tabel `invoices` (dengan relasi `client:name,npwp`) berstatus PPN.
    - [x] `PpnReportController@index` melakukan *eager-loading* dari tabel `purchase_orders` (dengan relasi `vendor:name,npwp`) berstatus PPN.
    - [x] Pengambilan riwayat audit log otomatis dari tabel `audit_logs`.

---

### B. Validasi Kepatuhan Format e-Faktur & NSFP
- [x] **Format Baku NSFP**: Validasi regex format NSFP 16-19 karakter (misal `010.000-26.88219001`).
- [x] **Format Baku NPWP**: Validasi sanitasi angka NPWP 15 digit / NIK 16 digit pada ekspor CSV e-Faktur.
- [x] **Penyetoran NTPN**: Validasi bukti setor kas negara (NTPN 16 digit alfa-numerik dari bank/DJP).

---

## 4. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [x] **Zero Mock Policy**: 100% data riil terintegrasi dengan database PostgreSQL melalui `PpnReportController`.
- [x] **Strict Typing (Zero `any`)**: Semua antarmuka TypeScript dan komponen React menggunakan tipe data terdefinisi.
- [x] **Clean UI & Responsive**: Konsisten dengan design system YouSee Finance, menggunakan Tailwind CSS, MonthPicker, dan Audit Trail.
- [x] **Automated Testing Coverage**: Lulus pengujian unit & feature test backend (PHPUnit).
- [x] **Production Compilation**: Build aset frontend (`npm run build`) sukses tanpa error dan warning.
