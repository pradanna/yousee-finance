# Checklist Pengembangan Modul Pembelian (Purchase Orders / PO)

Dokumen ini berisi rencana kerja, arsitektur, dan daftar checklist pengujian untuk modul **Pembelian (Purchase Orders)** di YouSee Finance.

---

## 1. Halaman Index Pembelian / PO (`/purchases`)

### A. Metrik Finansial & Header Ringkasan
- [x] **Kartu Metrik Finansial**:
    - [x] Total Tagihan PO Vendor (DPP + PPN).
    - [x] Total Pembayaran Terealisasi (Paid).
    - [x] Total Sisa Hutang Vendor (Unpaid).
    - [x] Jumlah PO Menunggu Pembayaran / Jatuh Tempo.
- [x] **Filter & Pencarian Lanjutan**:
    - [x] Filter berdasarkan Status PO / Tab navigasi (`Semua PO Proyek`, `PO Resmi Terbit`, `Jadwal TOP Vendor`, `Antrean Pending PO`).
    - [x] Filter berdasarkan Vendor (Dropdown master vendor).
    - [x] Filter berdasarkan Periode / Bulan Penerbitan & Masa Tayang (`MonthPicker` Bulan & Tahun).
    - [x] Pencarian instan (Nomor PO, Kode Proyek, Nama Proyek, Nama Vendor).

---

### B. Tabel Utama Daftar Purchase Orders
- [x] **Kolom Data PO**:
    - [x] Nomor PO & Tanggal Terbit.
    - [x] Relasi Proyek (Kode & Nama Proyek).
    - [x] Vendor Tujuan.
    - [x] Daftar Titik Lokasi yang masuk dalam PO.
    - [x] Nilai DPP, PPN Masukan 11%, dan Total PO.
    - [x] Status Pembayaran & Progress Termin (% Lunas).
    - [x] Badge Mode Fiskal (`PPN` / `Non-PPN`).
- [x] **Aksi Cepat (Row Actions)**:
    - [x] Preview / Cetak Dokumen PO PDF resmi (`/po-pdf`).
    - [x] Bayar Termin / Pelunasan PO (Modal pembayaran langsung).
    - [x] Batalkan PO (dengan reverse jurnal otomatis jika belum ada pembayaran).

---

## 2. Modal & Aksi Pembayaran Vendor
- [x] Modal pembayaran vendor yang tersinkronisasi per nomor PO dan per termin.
- [x] Pilihan rekening Kas / Bank sumber dana.
- [x] Validasi anti-kelebihan bayar per termin & per PO.
- [x] Riwayat pembayaran vendor per PO lengkap dengan tanggal dan nomor referensi.

---

## 3. Integrasi Akuntansi & Jurnal Otomatis
- [x] **Penerbitan PO**:
    - [x] `(Dr) Beban Sewa Media / Beban Pokok Proyek` + `(Dr) PPN Masukan (jika PPN)` vs `(Cr) Hutang Usaha Vendor`.
- [x] **Pembayaran Vendor**:
    - [x] `(Dr) Hutang Usaha Vendor` vs `(Cr) Kas / Bank`.
- [x] **Pembatalan PO**:
    - [x] Reversal jurnal pengakuan hutang vendor secara otomatis.

---

## 4. Kriteria Kelulusan Akhir Modul (_Definition of Done_)
- [x] **Kebijakan Data Riil & Error Handling (Zero Mock Policy)**:
    - [x] Seluruh data berasal dari database PostgreSQL / Eloquent melalui Controller Laravel & Inertia props.
    - [x] Jika terjadi error atau data kosong, tampilkan *Empty State* atau *Error Banner*, DILARANG keras menampilkan fallback mock data.
- [x] Lulus uji build frontend `npm run build` 100% tanpa error.
- [x] Bebas dari tipe `any` pada TypeScript (Strict Type Policy).
- [x] Terintegrasi penuh dengan data riil dari backend Laravel (`PurchaseOrderController@index`).
- [x] Tidak ada inkonsistensi saldo hutang vendor antara Menu Proyek, Menu Pembelian, dan Laporan Hutang Piutang.

