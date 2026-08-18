# Checklist Pengembangan Modul Pembelian (Purchase Orders / PO)

Dokumen ini berisi rencana kerja, arsitektur, dan daftar checklist pengujian untuk modul **Pembelian (Purchase Orders)** di YouSee Finance.

---

## 1. Halaman Index Pembelian / PO (`/purchases`)

### A. Metrik Finansial & Header Ringkasan
- [ ] **Kartu Metrik Finansial**:
    - [ ] Total Tagihan PO Vendor (DPP + PPN).
    - [ ] Total Pembayaran Terealisasi (Paid).
    - [ ] Total Sisa Hutang Vendor (Unpaid).
    - [ ] Jumlah PO Menunggu Pembayaran / Jatuh Tempo.
- [ ] **Filter & Pencarian Lanjutan**:
    - [ ] Filter berdasarkan Status PO (`Draft`, `Issued`, `Paid`, `Cancelled`).
    - [ ] Filter berdasarkan Vendor (Dropdown master vendor).
    - [ ] Filter berdasarkan Periode / Bulan Penerbitan.
    - [ ] Pencarian instan (Nomor PO, Kode Proyek, Nama Proyek, Nama Vendor).

---

### B. Tabel Utama Daftar Purchase Orders
- [ ] **Kolom Data PO**:
    - [ ] Nomor PO & Tanggal Terbit.
    - [ ] Relasi Proyek (Kode & Nama Proyek).
    - [ ] Vendor Tujuan.
    - [ ] Daftar Titik Lokasi yang masuk dalam PO.
    - [ ] Nilai DPP, PPN Masukan 11%, dan Total PO.
    - [ ] Status Pembayaran & Progress Termin (% Lunas).
    - [ ] Badge Mode Fiskal (`PPN` / `Non-PPN`).
- [ ] **Aksi Cepat (Row Actions)**:
    - [ ] Preview / Cetak Dokumen PO PDF resmi.
    - [ ] Bayar Termin / Pelunasan PO (Modal pembayaran langsung).
    - [ ] Batalkan PO (dengan reverse jurnal otomatis jika belum ada pembayaran).

---

## 2. Modal & Aksi Pembayaran Vendor
- [ ] Modal pembayaran vendor yang tersinkronisasi per nomor PO dan per termin.
- [ ] Pilihan rekening Kas / Bank sumber dana.
- [ ] Validasi anti-kelebihan bayar per termin & per PO.
- [ ] Riwayat pembayaran vendor per PO lengkap dengan tanggal dan nomor referensi.

---

## 3. Integrasi Akuntansi & Jurnal Otomatis
- [ ] **Penerbitan PO**:
    - [ ] `(Dr) Beban Sewa Media / Beban Pokok Proyek` + `(Dr) PPN Masukan (jika PPN)` vs `(Cr) Hutang Usaha Vendor`.
- [ ] **Pembayaran Vendor**:
    - [ ] `(Dr) Hutang Usaha Vendor` vs `(Cr) Kas / Bank`.
- [ ] **Pembatalan PO**:
    - [ ] Reversal jurnal pengakuan hutang vendor secara otomatis.

---

## 4. Kriteria Kelulusan Akhir Modul (_Definition of Done_)
- [ ] **Kebijakan Data Riil & Error Handling (Zero Mock Policy)**:
    - [ ] Hapus seluruh `purchasesData.ts` / mock data statis. Semua data wajib berasal dari database PostgreSQL / Eloquent melalui Controller Laravel & Inertia props.
    - [ ] Jika terjadi error atau data kosong, tampilkan *Empty State* atau *Error Banner*, DILARANG keras menampilkan fallback mock data.
- [ ] Lulus uji build frontend `npm run build` 100% tanpa error.
- [ ] Bebas dari tipe `any` pada TypeScript (Strict Type Policy).
- [ ] Terintegrasi penuh dengan data riil dari backend Laravel (`PurchaseOrderController@index`).
- [ ] Tidak ada inkonsistensi saldo hutang vendor antara Menu Proyek, Menu Pembelian, dan Laporan Hutang Piutang.
