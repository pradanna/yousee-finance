# Checklist Fitur & Alur Menu Proyek (Billboard Projects)

Dokumen ini berisi daftar periksa (_checklist_) komprehensif untuk pengujian, validasi logika bisnis, dan kepatuhan modul **Manajemen Proyek Billboard (YouSee Finance)**.

---

## 1. Daftar & Manajemen Proyek (`/projects`)

- [x] **Mode Fiskal (PPN vs Non-PPN)**:
    - [x] Switcher fiskal global di navbar otomatis memfilter proyek sesuai mode (`ppn` / `non-ppn`).
    - [x] Warna tema konsisten: Blue / Primary (PPN 11%) vs Emerald (Non-PPN).
- [x] **Metrik Eksekutif Header**:
    - [x] Total Proyek Aktif terhitung akurat.
    - [x] Total Nilai Kontrak (DPP) terakumulasi dengan benar.
    - [x] Total Lokasi Tersewa terhitung dengan benar.
- [x] **Tab Filter Navigasi Status (Urutan Alur Operasional)**:
    - [x] **Semua Proyek** (Total count semua status).
    - [x] **Draft** (Proyek baru dibuat, belum ada penerbitan invoice/PO).
    - [x] **Pending PO** (Proyek memiliki titik lokasi yang belum diterbitkan PO).
    - [x] **Invoicing** (Proyek belum menerbitkan Invoice Client).
    - [x] **Aktif** (Proyek sedang berjalan dalam masa tayang).
    - [x] **Selesai** (Masa tayang lewat, seluruh PO vendor lunas, seluruh Invoice client lunas).
- [x] **Tampilan Multi-View**:
    - [x] Mode Grid (Card interaktif dengan visual progress masa tayang, status PO, dan status Invoice).
    - [x] Mode Kanban Board (Pipeline drag-and-drop antar kolom status makro).
    - [x] Mode Tabel (Data detail dengan sorting kolom & aksi cepat).
- [x] **Pencarian & Filter**:
    - [x] Filter Periode Fleksibel (Pilihan Tahun & Bulan dengan opsi basis: `Masa Tayang Aktif`, `Bulan Mulai (Start Date)`, atau `Tanggal Dibuat (Created At)`).
    - [x] Filter berdasarkan Client (Dropdown terpisah).
    - [x] Filter berdasarkan Sales PIC (Dropdown terpisah).
    - [x] Pencarian instan berdasarkan Kode Proyek / Nama Proyek.
- [x] **Pembuatan Proyek Baru (Modal Create)**:
    - [x] Validasi form: Nama Proyek, Client, Sales PIC, Tanggal Mulai & Selesai, Nilai Kontrak (DPP).
    - [x] Form dinamis penambahan titik lokasi awal (Ukuran, Tipe, Vendor, Estimasi Biaya Sewa).

---

## 2. Halaman Detail Proyek (`/projects/{id}`)

### A. Header Eksekutif Detail Proyek

- [x] Kode Proyek, Nama Proyek, Nama Client, dan Sales PIC tampil jelas.
- [x] Badge Status Makro (`Draft` / `Active` / `Completed` / `Cancelled`).
- [x] Badge Mode Fiskal (`Mode PPN 11%` / `Mode Non-PPN`).
- [x] Rentang Tanggal Masa Tayang Kampanye (Format tanggal Indonesia standar).

---

### B. Tab 1: Info Proyek (`InfoTab`)

- [x] **Kalkulasi Finansial Berjenjang (Ledger Style)**:
    - [x] **1. Pendapatan Kontrak Client (DPP)**:
        - [x] Nilai DPP Kontrak sesuai data master.
        - [x] Rincian PPN Keluaran 11% (hanya pada Mode PPN).
        - [x] Total Tagihan Invoice Client (DPP + PPN).
    - [x] **2. Beban Pokok & Biaya Langsung**:
        - [x] Total Biaya Sewa Vendor (DPP PO seluruh titik).
        - [x] Rincian PPN Masukan 11% & Total Tagihan PO Vendor (+ppn).
        - [x] Pemotongan Komisi Sales otomatis dari `% commission_rate` masing-masing Sales PIC dikalikan DPP Kontrak.
    - [x] **3. Estimasi Laba Bersih Proyek**:
        - [x] Formula: $\text{DPP Kontrak} - \text{DPP Vendor} - \text{Komisi Sales}$.
        - [x] Badge persentase margin laba bersih ($\% \text{ Margin}$).
        - [x] Progress visual margin keuntungan (Kategori Sehat $\ge 30\%$).
    - [x] **4. Rekonsiliasi PPN Kas Negara (Mode PPN)**:
        - [x] Komparasi PPN Keluaran (Client) vs PPN Masukan (Vendor).
        - [x] Estimasi Setor PPN Net (Kurang Bayar / Lebih Bayar ke Kas Negara).
- [x] **Detail Administrasi & Sales**:
    - [x] Kode Proyek, Status, Target Qty, Periode, Total Titik Lokasi.
- [x] **Progress Terbit PO Vendor**:
    - [x] Progress bar rasio titik yang sudah diterbitkan PO vs total titik.

---

### C. Tab 2: Titik Lokasi Media (`LocationsTab`)

- [x] Daftar kartu / tabel titik lokasi terdaftar.
- [x] Tambah titik lokasi baru dengan form terintegrasi (Vendor, Ukuran, Orientasi, Biaya Sewa).
- [x] Indikator status PO tiap titik: `Sudah Terbit PO (Nomor PO)` atau `Belum Terbit PO`.
- [x] Hapus / Edit data titik lokasi (dengan proteksi jika PO sudah diterbitkan).

---

### D. Tab 3: Vendor & Penerbitan PO (`VendorPOTab`)

- [x] **Daftar PO & Dokumen**:
    - [x] Penerbitan PO Vendor per vendor / gabungan titik lokasi yang sama.
    - [x] Pilihan skema pembayaran vendor: `Lunas Sekaligus`, `DP + Pelunasan`, `Termin / Milestone`, `Cicilan`.
    - [x] Preview cetak / unduh Printable PO Document dengan kop YouSee Finance resmi.
- [x] **Pencatatan Pembayaran Vendor (Pelunasan Termin PO)**:
    - [x] Modal pembayaran vendor dengan warna tombol dinamis (Emerald untuk PPN, Biru untuk Non-PPN).
    - [x] Pilihan rekening Kas/Bank sumber dana.
    - [x] Update status termin menjadi `paid` dan generate entri Jurnal Akuntansi otomatis.
- [x] **Ringkasan Total Biaya & Hutang**:
    - [x] Target PO & Sisa Hutang mencakup PPN 11% (pada proyek PPN) dengan rincian DPP & PPN.
    - [x] Tipografi & ukuran font ringkasan keuangan diperbesar agar lebih jelas dan informatif pada 4 Metric Cards di bagian atas dan header tiap vendor.

---

### E. Tab 4: Tagihan & Invoice Client (`InvoiceTab`)

- [x] **Penerbitan Invoice Client**:
    - [x] Penentuan skema termin pembayaran client (DP, Termin, Pelunasan).
    - [x] Kalkulasi otomatis PPN Keluaran 11% pada invoice mode PPN.
    - [x] Preview & Cetak Invoice resmi YouSee (Invoice Utama & Invoice Termin).
- [x] **Pencatatan Pelunasan Client**:
    - [x] Pencatatan penerimaan pembayaran termin invoice ke rekening Kas/Bank.
    - [x] Penjurnalan otomatis Kas/Bank (Debit) vs Piutang Usaha (Kredit).
    - [x] Cetak Kwitansi PDF resmi otomatis untuk pembayaran yang lunas.

---

## 3. Integrasi Akuntansi & Jurnal Otomatis

- [x] **Penerbitan Invoice Client**:
    - [x] Piutang Usaha (Debit) vs Pendapatan Iklan/Sewa (Kredit) + Hutang PPN Keluaran (Kredit).
- [x] **Penerimaan Pembayaran Client**:
    - [x] Kas/Bank (Debit) vs Piutang Usaha (Kredit).
- [x] **Penerbitan PO Vendor**:
    - [x] Beban Pokok Sewa Lokasi / HPP (Debit) + PPN Masukan (Debit) vs Hutang Vendor (Kredit).
- [x] **Pembayaran ke Vendor**:
    - [x] Hutang Vendor (Debit) vs Kas/Bank (Kredit).
- [x] **Pencatatan Komisi Sales**:
    - [x] Beban Komisi Sales (Debit) vs Hutang Komisi / Kas (Kredit).

---

## 4. Kriteria Kelulusan Akhir Proyek (_Definition of Done_)

- [x] Semua fungsi lulus uji TypeScript tanpa error (`npm run build` sukses 100%).
- [x] Tidak ada tipe `any` pada frontend TypeScript.
- [x] Pengujian automated backend berjalan sukses.
- [x] Tidak ada kalkulasi angka yang meleset antara halaman Index, Show, dan Laporan Keuangan.
