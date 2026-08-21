# Checklist Modul Laporan Jurnal Umum & Buku Besar (Accounting Journal)

Dokumen ini berisi spesifikasi arsitektur, flow akuntansi, dan daftar checklist pengujian untuk modul **Laporan Jurnal Umum (`/journal`)** di YouSee Finance.

---

## 1. Halaman Index Laporan Jurnal Umum (`/journal`)

### A. Metrik & Header Finansial
- [x] **Kartu Ringkasan Status Jurnal**:
    - [x] Total Entri Jurnal Terposting.
    - [x] Total Akumulasi Debet & Kredit.
    - [x] Status Keseimbangan Jurnal (Indikator Seimbang / Balanced `0.00`).
    - [x] Total Entri Jurnal Pembalik (Reversing Entries).
- [x] **Header & Navigasi Aksi**:
    - [x] Tombol icon history audit trail (`AuditLogModal`).
    - [x] Tombol Export Jurnal (Excel `.csv` & Dokumen PDF Resmi).
    - [x] Tombol `+ Jurnal Penyesuaian` manual.
    - [x] Badge Mode Fiskal dinamis (`PPN` / `Non-PPN`).

---

### B. Filter & Pencarian Lanjutan
- [x] **Filter Komprehensif**:
    - [x] Filter Kategori Jurnal (`Semua Kategori`, `Jurnal Penjualan`, `Penerimaan Kas`, `Jurnal Pembelian`, `Pengeluaran Kas`, `Penyesuaian`).
    - [x] Filter Akun Keuangan (Dropdown seluruh akun COA).
    - [x] Filter Periode Cepat (Bulan & Tahun).
    - [x] Filter Rentang Tanggal Spesifik (*Date Range Picker* Mulai & Selesai).
    - [x] Pencarian Instan (Nomor Jurnal, Nomor Dokumen Referensi, Keterangan Transaksi).

---

### C. Tabel Jurnal Umum & Rincian Baris (Double-Entry Ledger)
- [x] **Kolom Data Utama**:
    - [x] ID Jurnal & Tanggal Transaksi.
    - [x] Dokumen Referensi / Acuan (Nomor Invoice / PO / Kas / Reversal).
    - [x] Kategori & Keterangan / Deskripsi Transaksi.
    - [x] Rincian Baris Multi-Akun (Kode Akun, Nama Akun, Debet, Kredit, Memo).
    - [x] Pengguna / Sistem yang memposting (*Posted By*).
- [x] **Aksi Baris Transaksi**:
    - [x] Cetak / Unduh Bukti Voucher Jurnal Umum PDF (`Voucher_Jurnal_...pdf`).
    - [x] Buat Jurnal Pembalik (*Reversing Entry*) dengan konfirmasi dan posting otomatis.

---

### D. Manajemen Master Bagan Akun (Chart of Accounts / COA)
- [x] **Tab Master COA**:
    - [x] Tabel daftar akun keuangan lengkap 5 klasifikasi (`Aset`, `Kewajiban`, `Ekuitas`, `Pendapatan`, `Beban/HPP`).
    - [x] Normal Balance (`Debet` / `Kredit`).
    - [x] Filter kategori akun & pencarian kode/nama akun.
    - [x] Aksi aktivasi / penonaktifan akun keuangan.
    - [x] Modal Tambah Akun COA Baru.

---

## 2. Integrasi Backend & Hard Invariants (Double-Entry Core)
- [x] **Controller Riil & Zero Mock**:
    - [x] `JournalReportController@index` terhubung ke model `JournalEntry`, `JournalEntryItem`, dan `ChartOfAccount`.
    - [x] Auto-resolving sumber kategori jurnal dari polymorphic relation (`Invoice`, `PurchaseOrder`, `CashTransaction`).
- [x] **Audit Trail Otomatis**:
    - [x] Pencatatan otomatis ke `audit_logs` saat jurnal baru diposting (`PostJournalEntry`).
    - [x] Pencatatan otomatis untuk event reversal (pembalikan) dan perubahan akun COA.
- [x] **Hard Invariants Enforcement**:
    - [x] Keseimbangan total Debet == Kredit (*Balanced Invariant*).
    - [x] Larangan posting ke akun Header (hanya boleh akun *Leaf Node*).
    - [x] Pengecekan Periode Tutup Buku (*Closing Period Protection*).

---

## 3. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [x] **Strict Typing**: Bebas dari tipe `any` pada TypeScript.
- [x] **Automated Tests**: Unit & Feature Test `JournalReportTest.php` **PASS 100%**.
- [x] **Production Compilation**: `npm run build` sukses tanpa error dan warning.
