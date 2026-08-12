# Catatan Jurnal Penyesuaian (Adjustment Journal Entries)

Dokumen ini berisi panduan lengkap, skenario bisnis, serta instruksi pencatatan **Jurnal Penyesuaian (Adjustment Journal Entry)** pada aplikasi YouSee Finance.

---

## 📌 Apa itu Jurnal Penyesuaian?
Jurnal Penyesuaian adalah entri pembukuan akuntansi yang dibuat di akhir periode (atau di bulan berjalan) untuk menyesuaikan saldo akun-akun di Buku Besar (*General Ledger*) agar mencerminkan kondisi keuangan aktual sesuai dengan standar **Accrual Basis** (PSAK).

---

## 📋 5 Skenario Utama Jurnal Penyesuaian

### 1. 🛠️ Mengoreksi Kesalahan Pencatatan Masa Lalu
* **Skenario**: Bulan lalu kasir salah memilih akun saat mencatat pembayaran (misal mencatat pembayaran via Bank BCA `1112` padahal uangnya masuk ke Bank Mandiri `1111`), dan periode bulan lalu sudah ditutup (*Closing Period*).
* **Prinsip**: Transaksi periode yang sudah ditutup tidak boleh diedit/dihapus langsung demi keamanan jejak audit (*audit trail*).
* **Tindakan Penyesuaian**: Dibuat jurnal penyesuaian di bulan berjalan untuk memindahkan saldo:
  * **(Debet)** `1111 - Bank Mandiri` *(Menambah saldo kas/bank yang benar)*
  * **(Kredit)** `1112 - Bank BCA` *(Mengurangi salah catat di bank lama)*

---

### 2. 📉 Pencatatan Penyusutan Aset Tetap (Depreciation)
* **Skenario**: Perusahaan memiliki aset berupa Komputer, Kendaraan Operasional, atau Struktur Billboard yang nilainya menyusut setiap bulan secara akuntansi.
* **Tindakan Penyesuaian**: Setiap akhir bulan dibuat jurnal penyesuaian:
  * **(Debet)** `5300 - Beban Penyusutan Aset` *(Pengakuan beban penyusutan)*
  * **(Kredit)** `1290 - Akumulasi Penyusutan Aset` *(Kontra-aset mengurangi nilai buku)*

---

### 3. 🏢 Beban / Biaya Dibayar di Muka (Prepaid Expenses)
* **Skenario**: Perusahaan membayar sewa kantor / lahan billboard untuk 1 tahun sekaligus di depan senilai Rp 12.000.000. Pembayaran awal masuk ke akun aset *Sewa Dibayar di Muka*.
* **Tindakan Penyesuaian**: Setiap bulan berjalan, diakui proporsi beban bulanan sebesar Rp 1.000.000 (Rp 12.000.000 / 12 bulan) menggunakan jurnal penyesuaian:
  * **(Debet)** `5220 - Beban Sewa Kantor / Lahan` *(Pengakuan beban sewa bulanan)*
  * **(Kredit)** `1150 - Sewa Dibayar di Muka` *(Mengurangi hak sewa dibayar di muka)*

---

### 4. ⏳ Beban yang Masih Harus Dibayar (Accrued Expenses)
* **Skenario**: Tagihan listrik, internet, atau gaji karyawan untuk bulan ini baru akan ditagihkan/dibayar pada awal bulan depan. Namun, bebannya wajib diakui di bulan ini agar Laporan Laba Rugi bulan ini akurat (*matching principle*).
* **Tindakan Penyesuaian**: Pada tanggal 31 di akhir bulan:
  * **(Debet)** `5210 - Beban Listrik & Utilitas` *(Pengakuan beban bulan berjalan)*
  * **(Kredit)** `2150 - Hutang Beban / Utilitas` *(Pencatatan kewajiban hutang beban)*

---

### 5. 🔍 Rekonsiliasi Selisih Kas atau Bank
* **Skenario**: Saat dilakukan perhitungan fisik uang tunai di brankas (*cash opname*) atau rekonsiliasi bank, ditemukan ada selisih kecil (seperti potongan biaya admin bank bulanan atau selisih pembulatan).
* **Tindakan Penyesuaian**:
  * **(Debet)** `5910 - Beban Admin Bank / Selisih Kas` *(Pengakuan beban admin/selisih)*
  * **(Kredit)** `1111 - Bank BCA / Kas` *(Penyesuaian pengurangan saldo bank/kas)*

---

## ⚙️ Petunjuk Penggunaan Fitur di Aplikasi YouSee Finance
1. Buka menu **Laporan Jurnal** pada Sidebar (Kategori AKUNTANSI).
2. Klik tombol **`+ JURNAL PENYESUAIAN`** di kanan atas.
3. Masukkan **Nomor Dokumen Acuan**, **Tanggal Transaksi**, dan **Keterangan Penyesuaian**.
4. Masukkan akun yang didebet dan dikredit hingga total Debet & Kredit **seimbang (Balanced)**.
5. Klik **Simpan Jurnal Penyesuaian**.
