# Catatan Jurnal Penyesuaian (Adjustment Journal Entries)

Dokumen ini berisi panduan lengkap, skenario bisnis, serta instruksi pencatatan **Jurnal Penyesuaian (Adjustment Journal Entry)** pada aplikasi YouSee Finance.

---

## 📌 Apa itu Jurnal Penyesuaian?

Jurnal Penyesuaian adalah entri pembukuan akuntansi yang dibuat di akhir periode (atau di bulan berjalan) untuk menyesuaikan saldo akun-akun di Buku Besar (_General Ledger_) agar mencerminkan kondisi keuangan aktual sesuai dengan standar **Accrual Basis** (PSAK).

---

## 📋 5 Skenario Utama Jurnal Penyesuaian

### 1. 🛠️ Mengoreksi Kesalahan Pencatatan Masa Lalu

- **Skenario**: Bulan lalu kasir salah memilih akun saat mencatat pembayaran (misal mencatat pembayaran via Bank BCA `1112` padahal uangnya masuk ke Bank Mandiri `1111`), dan periode bulan lalu sudah ditutup (_Closing Period_).
- **Prinsip**: Transaksi periode yang sudah ditutup tidak boleh diedit/dihapus langsung demi keamanan jejak audit (_audit trail_).
- **Tindakan Penyesuaian**: Dibuat jurnal penyesuaian di bulan berjalan untuk memindahkan saldo:
    - **(Debet)** `1111 - Bank Mandiri` _(Menambah saldo kas/bank yang benar)_
    - **(Kredit)** `1112 - Bank BCA` _(Mengurangi salah catat di bank lama)_

---

### 2. 📉 Pencatatan Penyusutan Aset Tetap (Depreciation)

- **Skenario**: Perusahaan memiliki aset berupa Komputer, Kendaraan Operasional, atau Struktur Billboard yang nilainya menyusut setiap bulan secara akuntansi.
- **Tindakan Penyesuaian**: Setiap akhir bulan dibuat jurnal penyesuaian:
    - **(Debet)** `5300 - Beban Penyusutan Aset` _(Pengakuan beban penyusutan)_
    - **(Kredit)** `1290 - Akumulasi Penyusutan Aset` _(Kontra-aset mengurangi nilai buku)_

---

### 3. 🏢 Beban / Biaya Dibayar di Muka (Prepaid Expenses)

- **Skenario**: Perusahaan membayar sewa kantor / lahan billboard untuk 1 tahun sekaligus di depan senilai Rp 12.000.000. Pembayaran awal masuk ke akun aset _Sewa Dibayar di Muka_.
- **Tindakan Penyesuaian**: Setiap bulan berjalan, diakui proporsi beban bulanan sebesar Rp 1.000.000 (Rp 12.000.000 / 12 bulan) menggunakan jurnal penyesuaian:
    - **(Debet)** `5220 - Beban Sewa Kantor / Lahan` _(Pengakuan beban sewa bulanan)_
    - **(Kredit)** `1150 - Sewa Dibayar di Muka` _(Mengurangi hak sewa dibayar di muka)_

---

### 4. ⏳ Beban yang Masih Harus Dibayar (Accrued Expenses)

- **Skenario**: Tagihan listrik, internet, atau gaji karyawan untuk bulan ini baru akan ditagihkan/dibayar pada awal bulan depan. Namun, bebannya wajib diakui di bulan ini agar Laporan Laba Rugi bulan ini akurat (_matching principle_).
- **Tindakan Penyesuaian**: Pada tanggal 31 di akhir bulan:
    - **(Debet)** `5210 - Beban Listrik & Utilitas` _(Pengakuan beban bulan berjalan)_
    - **(Kredit)** `2150 - Hutang Beban / Utilitas` _(Pencatatan kewajiban hutang beban)_

---

### 5. 🔍 Rekonsiliasi Selisih Kas atau Bank

- **Skenario**: Saat dilakukan perhitungan fisik uang tunai di brankas (_cash opname_) atau rekonsiliasi bank, ditemukan ada selisih kecil (seperti potongan biaya admin bank bulanan atau selisih pembulatan).
- **Tindakan Penyesuaian**:
    - **(Debet)** `5910 - Beban Admin Bank / Selisih Kas` _(Pengakuan beban admin/selisih)_
    - **(Kredit)** `1111 - Bank BCA / Kas` _(Penyesuaian pengurangan saldo bank/kas)_

---

## ⚙️ Petunjuk Penggunaan Fitur di Aplikasi YouSee Finance

1. Buka menu **Laporan Jurnal** pada Sidebar (Kategori AKUNTANSI).
2. Klik tombol **`JURNAL PENYESUAIAN`** di kanan atas.
3. Masukkan **Nomor Dokumen Acuan**, **Tanggal Transaksi**, dan **Keterangan Penyesuaian**.
4. Masukkan akun yang didebet dan dikredit hingga total Debet & Kredit **seimbang (Balanced)**.
5. Klik **Simpan Jurnal Penyesuaian**.
