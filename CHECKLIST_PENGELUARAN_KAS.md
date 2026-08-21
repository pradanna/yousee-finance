# Checklist Pengeluaran Kas (Murni Internal & Operasional Kantor)
**Yousee Finance — Standar Operasional Pengeluaran Kas & Checklist Pengembangan Fitur**

> **BATASAN UTAMA DOMAIN**:
> Menu **Pengeluaran Kas (`/cash-out`)** ini **HANYA untuk biaya operasional internal & umum kantor**.
> - ❌ **TIDAK ADA transaksi terkait Billboard / Videotron**: Segala biaya sewa titik, pajak reklame, listrik titik, perbaikan titik, konstruksi, dan cetak materi adalah **tanggung jawab Vendor** (masuk via alur *PO Vendor / Purchases*).
> - ❌ **TIDAK ADA pembayaran Vendor**: Pembayaran vendor wajib melalui alur *Pelunasan Hutang PO Vendor*.
> - ❌ **TIDAK ADA pembayaran Komisi Sales**: Pembayaran komisi berbasis kontrak deal proyek.

---

## 📋 Bagian 1: Jenis Pengeluaran Kas Internal (Master Scope)

Pengeluaran yang dicatat di menu ini murni berupa **biaya umum kantor & penunjang kerja internal**:

1. **Utilitas Kantor (General Affairs)**
   - Listrik Kantor Pusat / Cabang (PLN)
   - Air Kantor (PDAM / Air Bersih)
   - Internet & WiFi Kantor (Indihome / Biznet / dsb.)
   - Iuran Sampah & Keamanan Lingkungan Kantor (RT/RW/Kawasan)

2. **Kebutuhan Harian & Rumah Tangga Kantor**
   - Air Galon, Kopi, Teh, Gula, Snack Dapur Kantor
   - Alat Kebersihan, Sabun Cuci, Tisu, Pengharum Ruangan
   - ATK (Kertas HVS, Pulpen, Map, Tinta/Toner Printer)
   - Konsumsi Rapat Internal / Jamuan Tamu Kantor

3. **Operasional Lapangan & Kendaraan Internal (Non-Proyek Billboard)**
   - Bensin armada kantor / kendaraan operasional internal
   - Karcis Tol & Parkir kurir / staf kantor
   - Service rutin & cuci mobil/motor operasional kantor
   - Pulsa / Paket Data staf operasional / admin

4. **Administrasi & Perizinan Kantor**
   - Materai fisik / e-Materai kantor
   - Biaya kirim dokumen kantor (JNE / GoSend / GrabExpress)
   - Legalitas / iuran asosiasi / perpanjangan domain & hosting website internal
   - Biaya admin bank / materai rekening koran

---

## 📋 Bagian 2: Checklist Standar Operasional Harian (SOP Kasir)

### 1. Pra-Pengeluaran & Validasi (Sebelum Uang Dikeluarkan)
- [ ] **Validasi Bukan Beban Vendor / Billboard**: Memastikan tidak ada sangkut paut dengan materi tayang atau sewa titik vendor.
- [ ] **Kesesuaian Mode Fiskal (Entitas)**:
  - [ ] `PPN`: Pengeluaran ber-faktur pajak resmi / kantor pusat PT.
  - [ ] `Non-PPN`: Kas kecil harian tunai (pasar, warung, bensin, parkir).
- [ ] **Limit Kas Kecil vs Transfer Bank**:
  - [ ] Transaksi rutin < Rp 1.000.000,- via Kas Tunai / Kasir Petty Cash.
  - [ ] Transaksi > Rp 1.000.000,- via transfer bank operasional dengan persetujuan PIC/Pimpinan.
- [ ] **Kelayakan Bukti Fisik**: Struk kasir, karcis tol, nota toko, atau bukti transfer tersedia jelas.

### 2. Input ke Sistem (`/cash-out`)
- [ ] **Tanggal Transaksi**: Sesuai tanggal riil transaksi di struk/nota.
- [ ] **Sumber Kas (Kredit)**: Dipilih akun yang sesuai (`1110` Kas Kecil, `1111` Bank BCA, dll.).
- [ ] **Kategori & Akun Beban (Debet)**: Dipilih kategori beban kantor yang tepat.
- [ ] **Tagging Proyek**: Dikosongkan (*-- Tanpa Proyek (Biaya Umum Kantor) --*).
- [ ] **Penerima Dana**: Dicatat nama toko, SPBU, atau staf penerima kas.
- [ ] **Keterangan / Memo**: Rincian tujuan pengeluaran kantor secara spesifik.

### 3. Kontrol, Rekonsiliasi, & Arsip
- [ ] **Verifikasi Jurnal Otomatis**: Memastikan terbentuk seimbang `(Dr) Beban ...` dan `(Cr) Kas/Bank ...`.
- [ ] **Opname Kas Harian (Cash Count)**: Uang fisik di brankas cocok dengan saldo sistem.
- [ ] **Pengarsipan Dokumen**: Nota fisik distempel nomor transaksi sistem dan dibundel rapi.

---

## 🛠️ Bagian 3: Checklist Pengembangan Fitur (Fitur yang Belum Ada di Menu)

Daftar perbaikan dan penambahan fitur yang perlu diimplementasikan ke halaman [CashOut.tsx](file:///c:/PROJECT/WEBSITE/yousee-finance/resources/js/Pages/CashOut.tsx) & backend terkait:

### 1. Pembersihan Domain & Teks Interface
- [x] **Bersihkan Referensi Billboard di UI**: Hapus teks helper / placeholder yang masih menyebutkan *"pemeliharaan titik / videotron"*.
- [x] **Hapus Tagging Proyek**: Tagging proyek telah dihapus dari menu Pengeluaran Kas karena menu ini murni untuk operasional internal kantor.
- [ ] **Preset Kategori Operasional Kantor**: Sediakan master kategori bawaan yang relevan untuk operasional kantor (Listrik Kantor, Air/Internet, ATK, BBM Operasional, Konsumsi Kantor, Ekspedisi Dokumen, Kebersihan).

### 2. Form Input & Validasi Transaksi
- [x] **Upload Bukti Struk / Nota (Khusus Foto / Gambar)**:
  - [x] Tambahkan input file khusus foto/gambar (JPG, PNG, WEBP) pada modal *Catat Pengeluaran* (Opsional).
  - [x] Dukungan **Kompresi Gambar Otomatis** di server (resize cerdas maks 1600px & konversi ke WebP/JPEG terkompresi hemat penyimpanan).
  - [x] Kolom tautan bukti nota di tabel daftar transaksi pengeluaran kas.
- [x] **Tampilan Sisa Saldo Kas Real-Time (Kas Alert)**:
  - [x] Baris mini-card saldo berjalan untuk setiap akun kas & bank (Kas Tunai, Bank BCA, Bank Mandiri, Bank BRI) yang dihitung real-time dari buku besar jurnal.
  - [x] Indikator visual pintar (dot berdenyut kuning jika kas tunai $< \text{Rp } 500.000$, dot merah jika minus).
  - [x] Info sisa saldo di setiap opsi dropdown & label form input.
  - [x] Peringatan interaktif (*soft warning*) jika kasir menginput nominal pengeluaran yang melebihi saldo kas yang tersedia.

### 3. Kontrol & Manajemen Transaksi
- [x] **Aksi Edit Transaksi Kas**:
  - [x] Modal edit data pengeluaran kas (tanggal, akun kas, kategori beban, nominal, penerima, memo, dan ganti file foto).
  - [x] Sinkronisasi pembaruan otomatis ke jurnal akuntansi terkait (`JournalEntry`).
- [x] **Aksi Hapus Transaksi Kas**:
  - [x] Modal konfirmasi hapus transaksi pengeluaran.
  - [x] Pembersihan cascading otomatis pada jurnal akuntansi dan file foto attachment fisik.
- [x] **Proteksi Kunci Buku Bulanan (Closing Period Lock)**:
  - [x] Deteksi status gembok periode (`ClosingPeriod::isClosed`).
  - [x] Jika periode terkunci: Tombol input disabled, tombol edit & hapus disabled, dan muncul banner peringatan *Read-Only*.
  - [x] Proteksi ganda di server (Backend Action melempar `DomainException` jika ada percobaan manipulasi data di periode terkunci).
- [x] **Modal Detail Transaksi & Quick View Jurnal**:
  - [x] Tambahkan aksi *"Detail & Jurnal"* pada dropdown titik tiga di setiap baris tabel.
  - [x] Modal menampilkan rincian transaksi lengkap (tanggal, sumber kas, penerima, user pembuat, memo, foto nota).
  - [x] Quick view pembukuan jurnal akuntansi: nomor jurnal umum beserta tabel breakdown Debit dan Kredit per akun COA.
  - [x] Tetap dapat diakses meskipun periode akuntansi telah dikunci oleh Owner (*view-only mode*).

### 4. Pelaporan & Pertanggungjawaban Kas
- [x] **Cetak Form Rekap Kas Kecil / Petty Cash Voucher (PDF DomPDF)**:
  - [x] Template PDF resmi A4 Portrait dengan kop PT. YOUTAP SINERGI INDONESIA, rincian transaksi, total nominal, dan 3 kolom tanda tangan pertanggungjawaban (Dibuat Kasir, Diperiksa Akunting, Disetujui Owner).
  - [x] Tombol *"Cetak PDF"* di header halaman yang otomatis mencetak sesuai filter aktif (bulan, tahun, akun kas, dan mode fiskal).
- [x] **Export Laporan Kas Operasional (Excel)**:
  - [x] Tombol *"Export Excel"* yang men-stream download berkas Spreadsheet CSV dengan encoding UTF-8 BOM kompatibel sempurna di Microsoft Excel.
  - [x] Otomatis memfilter data sesuai bulan, tahun, sumber kas, kategori, dan mode fiskal aktif, lengkap dengan baris Total.
- [x] **Widget Ringkasan Top Pengeluaran**:
  - [x] Menampilkan kartu ringkasan visual persentase dan nominal pengeluaran terbesar per kategori beban (dengan bar persentase multi-warna dinamis).
  - [x] Responsif terhadap perubahan filter bulan, tahun, dan akun kas.

### 5. Keamanan & Integritas Data
- [x] **Fitur Void / Pembatalan Transaksi**:
  - [x] Opsi *"Batalkan (Void)"* pada dropdown titik tiga untuk pembatalan transaksi salah input.
  - [x] Otomatis membukukan jurnal pembalik (*reversing entry*) untuk memulihkan saldo kas tanpa menghapus rekam jejak.
  - [x] Mencatat setiap pembatalan transaksi ke tabel sentral `audit_logs`.
  - [x] Widget **Live Audit Trail Log** yang diletakkan berdampingan dengan Widget Top Kategori Pengeluaran di bagian bawah halaman.
  - [x] Badge visual `VOID` dan strikethrough pada tabel serta detail banner di modal transaksi.
