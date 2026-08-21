# Checklist Modul Buku Pembantu Hutang & Piutang Usaha (AP & AR)

Dokumen ini berisi daftar spesifikasi, arsitektur, dan checklist pengujian untuk modul **Hutang & Piutang Usaha (`/debt-receivable`)** di YouSee Finance.

---

## 1. Halaman Index Hutang & Piutang (`/debt-receivable`)

### A. Metrik Finansial & Ringkasan Posisi Kas
- [x] **Kartu KPI Ringkasan Posisi Finansial**:
    - [x] Total Sisa Piutang Klien (Accounts Receivable / AR Outstanding).
    - [x] Total Sisa Hutang Vendor (Accounts Payable / AP Outstanding).
    - [x] Net Cashflow Position (Estimasi Net Surplus/Defisit = Sisa Piutang − Sisa Hutang).
    - [x] Jumlah Transaksi Menunggu / Jatuh Tempo (Overdue Alert counter).
- [x] **Header & Navigasi Aksi**:
    - [x] Tombol pintas navigasi ke Penagihan Invoice (`/sales-transactions`).
    - [x] Tombol pintas navigasi ke Pembayaran PO (`/purchases`).
    - [x] Tombol icon history jejak audit (`AuditLogModal`).
    - [x] Badge Mode Fiskal dinamis (`PPN` / `Non-PPN`).

---

### B. Tab Navigasi & Filter Data
- [x] **Tab Navigasi Utama**:
    - [x] **Tab 1: Hutang Vendor (Accounts Payable / AP)**: Menampilkan seluruh kewajiban pembayaran PO ke vendor rekanan.
    - [x] **Tab 2: Piutang Klien (Accounts Receivable / AR)**: Menampilkan seluruh tagihan invoice yang belum atau sudah lunas ke klien.
- [x] **Filter & Pencarian Lanjutan**:
    - [x] Pencarian instan (Nomor Dokumen, Kode Proyek, Nama Proyek, Nama Klien / Vendor, Sales PIC).
    - [x] Filter Status Pembayaran (`Semua Status`, `Belum Lunas / Sebagian`, `Lunas`).
    - [x] Filter Mitra Bisnis (Dropdown dinamis Klien atau Vendor sesuai tab aktif).
    - [x] Pengurutan Data (`Prioritas Jatuh Tempo / Overdue`, `Nominal Terbesar`, `Transaksi Terbaru`).

---

### C. Tabel Data & Rincian Termin (Milestones)
- [x] **Kolom Data Utama**:
    - [x] Nomor Dokumen (Nomor Invoice / PO) & Tanggal Transaksi.
    - [x] Relasi Proyek (Kode & Nama Proyek).
    - [x] Mitra Terkait (Nama Klien / Vendor & Sales PIC).
    - [x] Total Tagihan, Realisasi Pembayaran, dan Sisa Saldo.
    - [x] Status & Indikator Jatuh Tempo (`Telah Lewat / Overdue`, `Jatuh Tempo Hari Ini`, `Segera Jatuh Tempo`, `Belum Jatuh Tempo`).
- [x] **Expandable Row (Rincian Termin / Payment Plan)**:
    - [x] Progress bar pelunasan per dokumen.
    - [x] Tabel breakdown termin: Urutan, Label Termin, Persentase, Nominal, Tanggal Jatuh Tempo, Realisasi Terbayar, Sisa, dan Status per termin.
- [x] **Aksi Cepat (Action Dropdown)**:
    - [x] Catat Pelunasan / Cicil Termin (membuka modal pembayaran langsung).
    - [x] Buka Detail Proyek (`/projects/{id}`).
    - [x] Cetak Dokumen PDF resmi (Invoice PDF / PO PDF).

---

## 2. Modal & Aksi Pembayaran Langsung
- [x] **Modal Pembayaran Hutang Vendor (`RecordPaymentModal`)**:
    - [x] Terhubung langsung dengan termin PO vendor.
    - [x] Pilihan rekening sumber dana Kas / Bank.
    - [x] Validasi anti kelebihan bayar.
- [x] **Modal Penerimaan Piutang Klien (`RecordInvoicePaymentModal`)**:
    - [x] Terhubung langsung dengan termin Invoice client.
    - [x] Pilihan rekening penampung Kas / Bank.
    - [x] Opsi pelunasan penuh atau cicil sebagian termin.

---

## 3. Sistem Jejak Audit & Log Aktivitas
- [x] **Audit Trail Terintegrasi**:
    - [x] Pencatatan otomatis saat Invoice Client diterbitkan (`created`) & dilunasi (`payment_settled`).
    - [x] Pencatatan otomatis saat PO Vendor diterbitkan (`created`), dicicil/dilunasi (`payment_settled`), atau dibatalkan (`po_cancelled`).
    - [x] Modal Jejak Audit (`AuditLogModal`) dengan filter aktivitas, pencarian, dan rentang tanggal.

---

## 4. Kriteria Kualitas & Standar Kode (_Definition of Done_)
- [x] **Zero Mock Policy**: 100% data riil dari database PostgreSQL melalui `DebtReceivableController`.
- [x] **Strict Typing**: Bebas dari tipe `any` pada TypeScript.
- [x] **Automated Testing & Compilation**: Lulus PHPUnit test dan `npm run build` bebas error.
- [x] **Sinkronisasi Data Real-Time**: Status dan sisa saldo hutang piutang selalu konsisten dengan menu Proyek, Pembelian, dan Penjualan.
