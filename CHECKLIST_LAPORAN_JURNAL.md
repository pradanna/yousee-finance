# Checklist Modul Laporan Jurnal Umum & Buku Besar (Accounting Journal)

Dokumen ini berisi spesifikasi arsitektur komprehensif, domain invariants, flow otomatisasi akuntansi, integrasi analitik proyek, dan pengujian standar enterprise untuk modul **Laporan Jurnal Umum & Buku Besar (`/journal`)** di YouSee Finance.

---

## 1. Ringkasan Arsitektur & Identitas Modul
- **URL Route**: `/journal`
- **Controller Backend**: `app/Domains/Accounting/Controllers/JournalReportController.php`
- **Page Component Frontend**: [JournalReport.tsx](file:///c:/PROJECT/WEBSITE/yousee-finance/resources/js/Pages/JournalReport.tsx)
- **Domain Terkait (Lite DDD)**: `Accounting`, `Billing`, `Procurement`, `Project`, `Identity`
- **Standar Standar Akuntansi**: SAK EMKM / SAK ETAP Berbasis Double-Entry Balancing & Project Tagging.

---

## 2. Antarmuka Pengguna & Fitur Interaktif (Frontend React + TypeScript)

### A. Kartu Ringkasan Finansial (Executive Financial KPI Header)
- [x] **Metrik Utama Real-Time**:
    - [x] Total Entri Jurnal Terposting (Volume transaksi periode terpilih).
    - [x] Total Akumulasi Debet & Total Akumulasi Kredit (Nominal terformat `Rp`).
    - [x] Indikator Keseimbangan Buku Besar (*Real-time Balanced Status* `0.00` atau Selisih Aktif jika *Imbalanced*).
    - [x] Total Entri Jurnal Pembalik (*Reversing Entries Counter*).
- [x] **Aksi Header Cepat**:
    - [x] Tombol Riwayat Jejak Audit (`AuditLogModal`).
    - [x] Tombol Ekspor Data Laporan (Excel `.xlsx` / `.csv` & PDF Buku Jurnal Resmi).
    - [x] Tombol Buat Jurnal Penyesuaian Manual (`+ Jurnal Penyesuaian`).
    - [x] Badge Status Periode Fiskal & Mode Pajak dinamis (`PPN 11%` / `Non-PPN`).

---

### B. Panel Filter, Pencarian Cerdas & Periode
- [x] **Filter Multi-Kriteria**:
    - [x] Pencarian Global Instan (Nomor Jurnal `JRN-...`, Nomor Invoice `INV-...`, Nomor PO `PO-...`, Transaksi Kas, atau Keterangan Memo).
    - [x] Filter Kategori Jurnal Terpadu:
        - `Semua Kategori`
        - `Jurnal Penjualan` (Piutang & Pendapatan)
        - `Penerimaan Kas` (Pelunasan Piutang / Kas Masuk)
        - `Jurnal Pembelian` (Hutang & Beban HPP)
        - `Pengeluaran Kas` (Pelunasan Hutang / Beban Operasional)
        - `Penyesuaian & Penutup` (Adjustment, Depresiasi, Amortisasi)
    - [x] Filter Akun Keuangan (Dropdown seluruh hierarki akun COA aktif).
    - [x] Filter Proyek / Cost-Center (Tagging analitik proyek per baris jurnal).
    - [x] Quick Selector Periode: Dropdown Bulan (Januari - Desember) & Tahun.
    - [x] Rentang Tanggal Kustom (*Custom Date Range Picker* Tanggal Mulai s/d Tanggal Selesai).
    - [x] Tombol Reset Filter (*Clear all filters to default state*).

---

### C. Tabel Jurnal Umum & Tampilan Multi-Baris (Double-Entry Ledger)
- [x] **Struktur Kolom Tabel Standar Akuntansi**:
    - [x] Tanggal Transaksi & Nomor ID Jurnal (`JRN-YYYY-XXXX`).
    - [x] Nomor Dokumen Acuan / Referensi Transaksi (Tautan klik langsung ke Invoice / PO / Kas jika relevan).
    - [x] Kategori & Keterangan / Uraian Transaksi.
    - [x] Rincian Baris Multi-Akun (*Multi-line breakdown*):
        - Kode Akun & Nama Akun (Format identasi debet rata kiri, kredit menjorok ke dalam).
        - Kolom Debet (Rata kanan, terformat mata uang).
        - Kolom Kredit (Rata kanan, terformat mata uang).
        - Tagging Proyek / Cost-Center per baris.
        - Catatan / Memo baris spesifik.
    - [x] Penanggung Jawab / Pembuat (*Posted By* & Timestamp).
    - [x] Badge Penanda Status (Normal, Reversal, atau Reversing Entry).
- [x] **Aksi Interaktif Baris Transaksi (Action Menu)**:
    - [x] **Cetak Bukti Voucher Jurnal PDF**:
        - Template voucher akuntansi formal lengkap dengan kop perusahaan.
        - Tabel rincian debet/kredit.
        - Kolom persetujuan & tanda tangan (*Dibuat Oleh*, *Diperiksa Oleh*, *Disetujui Oleh*).
    - [x] **Fitur Pembalikan Jurnal (*Reversing Entry*)**:
        - Dialog konfirmasi alasan pembalikan jurnal.
        - Auto-generate ID jurnal baru (`REV-...` / `JRN-REV-...`).
        - Otomatis menukar posisi Debet $\leftrightarrow$ Kredit.
        - Memproteksi jurnal sumber agar berstatus dibalik (*Reversed*).
    - [x] **Pemberian Tagging Dokumen Lampiran (*Attachment Preview*)**: Melihat file bukti transfer / nota pendukung jurnal jika ada.

---

### D. Manajemen Master Bagan Akun (Chart of Accounts / COA Management)
- [x] **Hierarki & Master Akun**:
    - [x] Tab khusus Manajemen COA terintegrasi.
    - [x] Pengelompokan 5 Klasifikasi Akun Baku:
        - `1000 - Aset / Aktiva` (Lancar & Tetap)
        - `2000 - Kewajiban / Hutang` (Jangka Pendek & Pajak)
        - `3000 - Ekuitas / Modal` (Modal Disetor, Laba Ditahan, Prive)
        - `4000 - Pendapatan` (Sewa Media Iklan, Cetak/Produksi, Lain-lain)
        - `5000 - Beban / Biaya` (HPP Sewa/Vendor, Beban Operasional, Gaji, Utilitas)
    - [x] Penanda Saldo Normal Akun (*Debet* vs *Kredit*).
    - [x] Identifikasi Tipe Akun: *Header/Parent* (Hanya agregasi laporan) vs *Leaf Node* (Akun transaksi).
    - [x] Toggle Status Aktif / Non-aktif Akun Keuangan (Mencegah akun yang sudah memiliki riwayat transaksi dihapus fisik).
    - [x] Modal Tambah Akun COA Baru (*Add Sub-Account Modal*) dengan validasi kode unik dan saldo normal.

---

### E. Fitur Jurnal Penyesuaian Manual (*Manual Adjustment Entry Modal*)
- [x] **Form Pembuatan Jurnal Dinamis**:
    - [x] Input Tanggal Transaksi, Nomor Dokumen / Bukti, dan Keterangan Lengkap.
    - [x] Baris Akun Dinamis (*Add / Remove Line* minimal 2 baris).
    - [x] Dropdown Pilih Akun hanya untuk akun *Leaf Node*.
    - [x] Input Debet & Kredit dengan format angka otomatis.
    - [x] Tagging Proyek Opsional per baris transaksi.
    - [x] Live Balancing Validator: Total Debet, Total Kredit, dan Selisih secara *real-time*.
    - [x] Pencegahan simpan (*Save Disabled*) apabila Debet $\neq$ Kredit atau total nominal adalah 0.

---

## 3. Logika Bisnis & Invarian Akuntansi (Backend Lite DDD Invariants)

### A. Otomatisasi Posting Jurnal (System-Generated Journal Flows)
- [x] **Penjualan & Penagihan Client (Sales & Billing Flow)**:
    - [x] Penerbitan Invoice:
        - $(Dr)$ Piutang Usaha (`1121`) $[Total]$
        - $(Cr)$ Pendapatan Usaha (`4100` / `4110`) $[DPP]$
        - $(Cr)$ Hutang PPN Keluaran (`2121`) $[PPN\ 11\%]$ *(Jika mode PPN)*
    - [x] Pembayaran / Pelunasan Invoice:
        - $(Dr)$ Kas / Bank Terpilih (`1110` / `1111`) $[Nominal\ Diterima]$
        - $(Cr)$ Piutang Usaha (`1121`) $[Nominal\ Lunas]$
- [x] **Pengadaan & Hutang Vendor (Procurement & AP Flow)**:
    - [x] Penerbitan PO / Pengakuan Hutang:
        - $(Dr)$ Beban HPP Proyek / Biaya Operasional (`5100` / `5110`) $[DPP]$
        - $(Dr)$ PPN Masukan (`1141`) $[PPN\ 11\%]$ *(Jika mode PPN)*
        - $(Cr)$ Hutang Usaha Vendor (`2110`) $[Total]$
    - [x] Pembayaran / Pelunasan PO Vendor:
        - $(Dr)$ Hutang Usaha Vendor (`2110`) $[Nominal\ Dibayar]$
        - $(Cr)$ Kas / Bank Terpilih (`1110` / `1111`) $[Nominal\ Keluar]$
- [x] **Pengeluaran Kas Operasional Langsung (Direct Cash Disbursement)**:
    - [x] $(Dr)$ Beban Terpilih (misal Listrik, Gaji, Sewa Kantor)
    - [x] $(Cr)$ Akun Kas/Bank Terpilih.
- [x] **Pemotongan Pajak Penghasilan (PPh Withholding Tax Flow)**:
    - [x] Pengakuan PPh 23 / PPh 4(2) Final pada tagihan vendor atau pemotongan invoice client.

---

### B. Aturan Integritas Data Akuntansi (*Hard Invariants*)
- [x] **Double-Entry Balance Invariant**:
    $$\sum \text{Debet} = \sum \text{Kredit}$$
    Sistem backend menolak penyimpanan jurnal baru atau jurnal penyesuaian jika terjadi selisih walaupun $\text{Rp } 1$.
- [x] **Strict Leaf-Node Rule**:
    Transaksi jurnal hanya diizinkan memilih akun yang berstatus *Leaf Node* (`is_leaf: true`). Akun Header/Parent ditolak pada level `StoreJournalEntryRequest`.
- [x] **Immutability & No Direct Deletion**:
    Entri jurnal yang sudah terposting tidak boleh di-`DELETE` dari database. Seluruh koreksi wajib melalui mekanisme *Reversing Entry* (Jurnal Pembalik).
- [x] **Closing Period Lock Protection**:
    Setiap posting, penyesuaian, atau reversal jurnal wajib memvalidasi `ClosingPeriod::isClosed(month, year, fiscal_mode)`. Jika periode berstatus *Closed*, sistem melempar `DomainException` (Kecuali dibuka kembali oleh role `PIMPINAN`).
- [x] **Comprehensive Audit Trail**:
    Seluruh aktivitas posting jurnal manual, jurnal sistem, reversal, dan modifikasi COA tercatat di tabel `audit_logs` lengkap dengan `user_id`, `action`, `ip_address`, serta payload *before/after*.

---

## 4. Ekspor Dokumen & Laporan Eksekutif (Reporting & Print Engine)
- [x] **Ekspor Excel / CSV**:
    - Format terstruktur dengan header kolom standar, baris detail multi-akun, kolom debet/kredit terpisah, dan baris total di akhir dokumen.
- [x] **Ekspor Buku Jurnal PDF (General Journal Report)**:
    - Layout landscape resmi dengan logo perusahaan, identitas mode fiskal, periode pelaporan, nomor halaman, dan ringkasan debet/kredit seimbang.
- [x] **Voucher Bukti Jurnal Satuan (Journal Voucher PDF)**:
    - Layout portrait resmi per nomor jurnal untuk arsip fisik keuangan / audit eksternal.

---

## 5. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [x] **Zero Mock Policy**: 100% data riil dari database PostgreSQL melalui `JournalReportController`.
- [x] **Strict Typing (Zero `any`)**: Semua antarmuka TypeScript dan komponen React menggunakan tipe data terdefinisi.
- [x] **Code Formatting & Clean Code**: Prettier formatting standard (4-space indent, single quotes, LF line endings).
- [x] **Automated Testing Coverage**: Lulus Feature & Unit Test PHPUnit untuk integritas balance, mutasi akun, dan closing period protection.
- [x] **Production Compilation**: Lolos `npm run build` bebas dari error dan warning.
