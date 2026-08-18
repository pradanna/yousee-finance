# Checklist Pengembangan Modul Penjualan & Invoice Client

Dokumen ini berisi rencana kerja, spesifikasi arsitektur, dan daftar checklist pengembangan serta pengujian untuk modul **Penjualan & Invoice Client (`/sales-transactions`)** di YouSee Finance.

---

## 1. Halaman Index Penjualan / Invoice Client (`/sales-transactions`)

### A. Metrik Finansial & Header Ringkasan
- [ ] **Kartu Metrik Finansial**:
    - [ ] Total Invoice Diterbitkan (Issued).
    - [ ] Total Menunggu Penerbitan (Pending Issue).
    - [ ] Total Piutang Belum Lunas (Unpaid / Outstanding AR).
    - [ ] Total Pembayaran Masuk (Received Cash).
- [x] **Filter & Pencarian Lanjutan (Sinkron dengan PO & Project)**:
    - [x] Filter Tab Navigasi (`Semua Invoice`, `Invoice Resmi Terbit`, `Antrean Penerbitan`, `Jadwal Penerimaan Kas`).
    - [x] Filter berdasarkan Sales PIC (Dropdown master sales).
    - [x] Filter berdasarkan Client (Dropdown master client).
    - [x] **Filter MonthPicker Periode (Bulan & Tahun)**:
        - [x] Pilihan Basis Periode: `Masa Tayang Aktif` (default), `Bulan Mulai Proyek`, dan `Bulan Terbit Invoice`.
        - [x] Selektor Cepat Tahun & Bulan (komponen `MonthPicker`).
        - [x] Tombol Reset Filter Periode.
    - [x] Pencarian Instan (Nomor Invoice, Kode Proyek, Nama Proyek, Nama Client, Nama Sales).

---

### B. Daftar & Tabel Utama Invoice Client
- [ ] **Tab "Semua Invoice"**:
    - [ ] Kolom data: Nomor Invoice, Tanggal Terbit, Proyek, Client, Sales PIC, Nilai Kontrak (DPP), PPN Keluaran 11%, Grand Total Tagihan, Sisa Piutang, Status Pembayaran.
    - [ ] Badge Status Pembayaran (`DRAFT`, `ISSUED`, `PARTIAL`, `PAID / LUNAS`).
    - [ ] Badge Mode Fiskal (`PPN` / `Non-PPN`).
- [ ] **Tab "Invoice Resmi Terbit"**:
    - [ ] Menampilkan proyek yang telah memiliki invoice resmi (`status !== 'draft'`).
    - [ ] Aksi Cepat Cetak Invoice PDF, Catat Terima Pembayaran, dan Cetak Kwitansi Pelunasan.
- [ ] **Tab "Antrean Penerbitan"**:
    - [ ] Menampilkan proyek aktif yang belum memiliki invoice resmi.
    - [ ] Tombol cepat `+ Terbitkan Invoice Client`.
- [ ] **Tab "Jadwal Penerimaan Kas" (TOP / AR Schedule)**:
    - [ ] Jadwal jatuh tempo pembayaran termin client.
    - [ ] Indikator status jatuh tempo (`Telah Lewat`, `Jatuh Tempo Hari Ini`, `Segera Jatuh Tempo`, `Belum Jatuh Tempo`).
    - [ ] Tombol `+ Terima Pembayaran` per termin dengan validasi urutan termin.

---

### C. Aksi & Modal Transaksi
- [ ] **Modal Penerbitan Invoice Client (`IssueInvoiceModal`)**:
    - [ ] Pemilihan skema pembayaran (`Lunas Sekaligus`, `DP + Pelunasan`, `Termin Bertahap`, `Tempo`).
    - [ ] Pengaturan tanggal jatuh tempo & persentase termin.
    - [ ] Rekening tujuan transfer kas/bank.
- [ ] **Modal Catat Penerimaan Pembayaran (`RecordInvoicePaymentModal`)**:
    - [ ] Pilihan termin yang dibayar (urutan terkecil).
    - [ ] Pilihan opsi nominal: *Pelunasan Termin* atau *Cicil Sebagian*.
    - [ ] Input nominal dengan pemisah ribuan (*thousands separator* `id-ID`).
    - [ ] Pemilihan akun Kas/Bank penerima.
    - [ ] Floating Toast notification saat berhasil / gagal.
- [ ] **Cetak Dokumen Resmi**:
    - [ ] Unduh Dokumen Invoice PDF (`/invoice-pdf`).
    - [ ] Unduh Dokumen Kwitansi Resmi Pelunasan (`/receipt-pdf` / Kwitansi).

---

## 2. Integrasi Backend & Jurnal Otomatis (Accounting Flow)
- [ ] **Penerbitan Invoice Client**:
    - [ ] `(Dr) Piutang Usaha Client` vs `(Cr) Pendapatan Sewa Reklame` + `(Cr) PPN Keluaran (jika PPN)`.
- [ ] **Penerimaan Pembayaran Client**:
    - [ ] `(Dr) Kas / Bank` vs `(Cr) Piutang Usaha Client`.
- [ ] **Validasi Urutan Pembayaran**:
    - [ ] Mencegah pencatatan termin selanjutnya sebelum termin sebelumnya lunas.

---

## 3. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [ ] **Zero Mock Policy**: Seluruh data bersumber dari database PostgreSQL via Laravel Controller.
- [ ] **Strict Typing Policy**: Bebas dari tipe `any` pada TypeScript.
- [ ] **Prettier & Linter Clean**: Lulus uji `npm run build` tanpa error dan warning.
- [ ] **Sinkronisasi Antar Menu**: Nilai piutang client sinkron antara Menu Proyek, Menu Penjualan, dan Laporan Hutang Piutang.
