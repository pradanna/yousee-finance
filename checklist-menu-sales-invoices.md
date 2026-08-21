# Checklist Pengembangan Modul Penjualan & Invoice Client

Dokumen ini berisi rencana kerja, spesifikasi arsitektur, dan daftar checklist pengembangan serta pengujian untuk modul **Penjualan & Invoice Client (`/sales-transactions`)** di YouSee Finance.

---

## 1. Halaman Index Penjualan / Invoice Client (`/sales-transactions`)

### A. Metrik Finansial & Header Ringkasan
- [x] **Kartu Metrik Finansial**:
    - [x] Total Invoice Diterbitkan (Issued).
    - [x] Total Menunggu Penerbitan (Pending Issue).
    - [x] Total Piutang Belum Lunas (Unpaid / Outstanding AR).
    - [x] Total Pembayaran Masuk (Received Cash).
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
- [x] **Tab "Semua Invoice"**:
    - [x] Kolom data: Nomor Invoice, Tanggal Terbit, Proyek, Client, Sales PIC, Nilai Kontrak (DPP), PPN Keluaran 11%, Grand Total Tagihan, Sisa Piutang, Status Pembayaran.
    - [x] Badge Status Pembayaran (`DRAFT`, `ISSUED`, `PARTIAL`, `PAID / LUNAS`).
    - [x] Badge Mode Fiskal (`PPN` / `Non-PPN`).
- [x] **Tab "Invoice Resmi Terbit"**:
    - [x] Menampilkan proyek yang telah memiliki invoice resmi (`status !== 'draft'`).
    - [x] Aksi Cepat Cetak Invoice PDF, Catat Terima Pembayaran, dan Cetak Kwitansi Pelunasan.
- [x] **Tab "Antrean Penerbitan"**:
    - [x] Menampilkan proyek aktif yang belum memiliki invoice resmi.
    - [x] Tombol cepat `+ Terbitkan Invoice Client`.
- [x] **Tab "Jadwal Penerimaan Kas" (TOP / AR Schedule)**:
    - [x] Jadwal jatuh tempo pembayaran termin client.
    - [x] Indikator status jatuh tempo (`Telah Lewat`, `Jatuh Tempo Hari Ini`, `Segera Jatuh Tempo`, `Belum Jatuh Tempo`).
    - [x] Tombol `+ Terima Pembayaran` per termin dengan validasi urutan termin.

---

### C. Aksi & Modal Transaksi
- [x] **Modal Penerbitan Invoice Client (`IssueInvoiceModal`)**:
    - [x] Pemilihan skema pembayaran (`Lunas Sekaligus`, `DP + Pelunasan`, `Termin Bertahap`, `Tempo`).
    - [x] Pengaturan tanggal jatuh tempo & persentase termin.
    - [x] Rekening tujuan transfer kas/bank.
- [x] **Modal Catat Penerimaan Pembayaran (`RecordInvoicePaymentModal`)**:
    - [x] Pilihan termin yang dibayar (urutan terkecil).
    - [x] Pilihan opsi nominal: *Pelunasan Termin* atau *Cicil Sebagian*.
    - [x] Input nominal dengan pemisah ribuan (*thousands separator* `id-ID`).
    - [x] Pemilihan akun Kas/Bank penerima.
    - [x] Floating Toast notification saat berhasil / gagal.
- [x] **Cetak Dokumen Resmi**:
    - [x] Unduh Dokumen Invoice PDF (`/client-invoice-pdf`).
    - [x] Unduh Dokumen Kwitansi Resmi Pelunasan (`/kwitansi-pdf`).

---

## 2. Integrasi Backend & Jurnal Otomatis (Accounting Flow)
- [x] **Penerbitan Invoice Client**:
    - [x] `(Dr) Piutang Usaha Client` vs `(Cr) Pendapatan Sewa Reklame` + `(Cr) PPN Keluaran (jika PPN)`.
- [x] **Penerimaan Pembayaran Client**:
    - [x] `(Dr) Kas / Bank` vs `(Cr) Piutang Usaha Client`.
- [x] **Validasi Urutan Pembayaran**:
    - [x] Mencegah pencatatan termin selanjutnya sebelum termin sebelumnya lunas.
- [x] **Sistem Jejak Audit**:
    - [x] Pencatatan otomatis ke `audit_logs` saat invoice diterbitkan dan pembayaran termin diterima.
    - [x] Modal Jejak Audit (`AuditLogModal`) di header.

---

## 3. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [x] **Zero Mock Policy**: Seluruh data bersumber dari database PostgreSQL via Laravel Controller.
- [x] **Strict Typing Policy**: Bebas dari tipe `any` pada TypeScript.
- [x] **Prettier & Linter Clean**: Lulus uji `npm run build` tanpa error dan warning.
- [x] **Sinkronisasi Antar Menu**: Nilai piutang client sinkron antara Menu Proyek, Menu Penjualan, dan Laporan Hutang Piutang.
