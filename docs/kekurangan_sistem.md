# Catatan Kekurangan & Rencana Pengembangan Sistem (Backlog)

Dokumen ini mencatat hal-hal yang belum tersedia atau masih menjadi kekurangan di aplikasi **YouSee Finance** untuk direncanakan pada tahap pengembangan berikutnya.

---

## 📌 Daftar Kekurangan Sistem

### 1. Fitur Pindah Dana / Transfer Antar Rekening (Inter-Account Transfer)
- **Kondisi Saat Ini**: 
  - ✅ **Selesai Diimplementasikan**:
    - Tombol & Modal **"⇄ Pindah Dana / Transfer"** telah aktif di halaman Kas Keluar (`/cash-out`).
    - Mendukung mutasi internal antar rekening kas/bank (Tarik Tunai ke Kas Kecil, Transfer Bank BCA ke Mandiri, dll).
    - Otomatis membentuk Jurnal Mutasi Berpasangan `(Dr) Rekening Tujuan = (Cr) Rekening Sumber` dengan nomor bukti transaksi `TRF-YYYYMM-XXXX`.
    - Otomatis terintegrasi tanpa membiaskan arus kas operasional PSAK 2 dan mencatat jejak audit `AuditLog`.

---

### 2. Modul Bonus & Komisi Sales (Sales Commission)
- **Kondisi Saat Ini**: 
  - ✅ **Selesai Diimplementasikan**:
    - Tab Pembayaran Komisi & Bonus Sales telah aktif di menu Kas Keluar (`/cash-out`).
    - Otomatis menghitung hak komisi sales per proyek (`Nilai Kontrak × % Komisi Sales`) dengan pembulatan rupiah bulat.
    - Menampilkan status kesiapan cair (*Siap Dicairkan* jika invoice klien sudah lunas, *Menunggu Klien* jika belum lunas).
    - Tombol pencairan cepat (*One-Click Pay*) langsung membukukan pengeluaran kas (`OUT-xxxx`), jurnal akuntansi otomatis, dan mengaitkan nomor bukti pembayaran ke proyek/sales.

---

### 3. Kontrol Kunci Sistem di Owner / Pimpinan (System Lock / Closing Period Lock)
- **Kondisi Saat Ini**: 
  - ✅ **Selesai Diimplementasikan**:
    - Menu **"Tutup Buku & Kunci"** (`/accounting/closing-periods`) telah aktif di bawah grup Akuntansi.
    - Menampilkan matriks status 12 Bulan kalender per tahun dan mode fiskal (PPN / Non-PPN).
    - **Otoritas Eksklusif Owner / Pimpinan**:
      - Tombol **"Tutup Buku (Lock)"** untuk mengunci transaksi bulan berjalan menjadi *read-only*.
      - Tombol **"Buka Gembok (Unlock)"** yang diamankan dengan verifikasi kata sandi (*password*) pimpinan dan kewajiban input alasan pembukaan.
    - Seluruh aktivitas tercatat lengkap pada **Jejak Audit Tutup Buku (*Closing Audit Trail*)**.
    - User role **Admin** hanya memiliki hak lihat (*read-only*) dan dilarang mengubah status kunci periode.

---

*Terakhir diperbarui: 26 Agustus 2026*
