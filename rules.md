# Domain Rules — Finance Application

Sistem terpusat 1 login dengan toggle **Mode PPN / Non-PPN** sebagai silo data transaksi.

---

## 1. Ubiquitous Language

| Istilah | Makna |
| :--- | :--- |
| **Mode (Fiscal Mode)** | Konteks aktif: **PPN** atau **Non-PPN**. Menentukan silo transaksi mana yang dibaca/ditulis. Bukan tenant, melainkan atribut wajib di setiap Aggregate transaksi. |
| **PO (Purchase Order)** | Dokumen pembelian, multi-item, bisa backdate/postdate, bisa punya lampiran gambar. |
| **Invoice** | Dokumen tagihan ke Client, due date otomatis (+7 hari default), output PDF. |
| **Kwitansi** | Bukti lunas, terbit otomatis & immutable setelah Invoice berstatus Paid. |
| **Jurnal (Journal Entry)** | Entry Debet/Kredit otomatis, terbentuk langsung saat PO/Invoice disimpan (tanpa status draft). |
| **PPh/PPN Adjustment** | Komponen pajak tambahan. Untuk PO: independen dari Mode (tergantung status PKP Vendor). Untuk Invoice: terikat ketat ke Mode. |
| **Closing** | Penguncian periode akuntansi, per kombinasi (bulan, tahun, Mode). |
| **Unlock** | Override oleh Pimpinan untuk membuka kembali periode yang sudah closing, tercatat di audit log. |

---

## 2. Bounded Context & Context Map

- **Identity & Access** ──*(shared kernel: User/Role)*──▶ Semua Context
- **Master Data** ──*(referensi by ID, read-only)*──▶ Procurement, Billing, Accounting
- **Procurement (PO)** ──*(trigger event)*──▶ Accounting & Tax
- **Billing (Invoice/Kwitansi)** ──*(trigger event)*──▶ Accounting & Tax

### Context Matrix

| Context | Tanggung Jawab | Terpengaruh Mode? |
| :--- | :--- | :--- |
| **Identity & Access** | User, Role (Admin/Pimpinan), Login, Reset Password | Tidak |
| **Master Data** | Vendor, Client, Sales, Project | Tidak (shared) |
| **Procurement (PO)** | Purchase Order, multi-item, lampiran | Ya (silo) |
| **Billing** | Invoice, Kwitansi | Ya (silo) |
| **Accounting & Tax** | Jurnal, PPh/PPN, Laporan, Closing/Unlock | Ya (silo, paling ketat) |

---

## 3. Aggregates & Invariants

### 3.1 Identity & Access

#### **User & Role**
- Role tertutup: **Admin** | **Pimpinan**.
- User nonaktif tidak bisa login.
- Hanya **Pimpinan** yang boleh Reset Password user lain & melakukan **Unlock** periode.
- **Admin** tidak bisa self-elevate menjadi **Pimpinan**.

---

### 3.2 Master Data (Shared, tanpa atribut Mode)

#### **Vendor**
- Nama Lengkap wajib diisi.
- NPWP (jika diisi) harus valid formatnya.
- Tidak bisa di-*hard-delete* jika sudah pernah digunakan di PO (hanya boleh di-archive).

#### **Client**
- Sama polanya dengan Vendor, berlaku terhadap Invoice.

#### **Sales**
- Performa dihitung dari total Invoice terkait, dihitung per **Mode** (tidak diagregasi lintas mode).

#### **Project**
- Status: Aktif / Selesai.
- Laba-rugi dihitung dari PO (cost) + Invoice (revenue) yang ter-link, difilter per **Mode** (user harus memilih mode terlebih dahulu sebelum melihat laporan project).

---

### 3.3 Procurement (Siloed by Mode)

#### **Purchase Order (PO)**
- Minimal 1 `POItem` (tidak boleh PO kosong).
- `fiscal_mode` wajib ditentukan saat create, dan **tidak bisa diubah** setelah tersimpan.
- Tanggal transaksi bebas backdate/postdate, kecuali jatuh di periode yang sudah **Closing** (diblok sampai di-**Unlock** oleh Pimpinan).
- `has_ppn` (boolean manual, independen dari `fiscal_mode`) — tergantung status PKP Vendor, bukan Mode perusahaan saat ini.
- Total PO = $\sum (\text{qty} \times \text{harga per item})$.
- Saat disimpan ──▶ langsung trigger **Journal Entry** (tidak ada status Draft).
  - **Debet:** Beban/Persediaan (+ PPN Masukan jika `has_ppn`)
  - **Kredit:** Hutang/Kas

#### **Attachment**
- Terkait ke PO (child), berisi 0 atau lebih gambar (opsional).

---

### 3.4 Billing (Siloed by Mode)

#### **Invoice**
- Client wajib ditentukan; Sales & Project opsional.
- `fiscal_mode` wajib ditentukan dan bersifat **fixed** setelah create.
- Due date = tanggal invoice + 7 hari (default, dapat dioverride per invoice atau melalui global setting).
- PPN terikat ketat ke `fiscal_mode`:
  - **Mode PPN:** PPN wajib dihitung otomatis (11%), tidak bisa di-nolkan.
  - **Mode Non-PPN:** Field PPN dinonaktifkan total (disabled).
- Status flow: `Draft` ──▶ `Issued` ──▶ `Paid`.
- TTD digital / tanpa TTD murni merupakan opsi cetak PDF dan tidak mempengaruhi status dokumen.
- Saat status berubah menjadi `Issued` ──▶ langsung trigger **Journal Entry**:
  - **Debet:** Piutang
  - **Kredit:** Pendapatan (+ PPN Keluaran jika applicable)

#### **Kwitansi**
- Terbit otomatis **hanya** saat status Invoice berubah menjadi `Paid`.
- Bersifat **Immutable** (tidak dapat diubah) setelah terbit.
- 1 Invoice ──▶ maksimal 1 Kwitansi aktif.

---

### 3.5 Accounting & Tax (Siloed by Mode)

#### **Journal Entry**
- Total Debet **harus selalu sama dengan** Total Kredit (*hard invariant*).
- Tidak pernah dihapus secara langsung — koreksi harus menggunakan jurnal pembalik (*reversing entry*).
- `fiscal_mode` mengikuti sumber (PO/Invoice), tidak bisa diinput manual berbeda.

#### **PPh Adjustment**
- Terkait ke Invoice/PO tertentu, diinput manual oleh Admin.
- Bisa berlaku di kedua Mode untuk Procurement; untuk Billing hanya relevan di **Mode PPN**.

#### **Closing Period**
- 1 closing = kombinasi `(bulan, tahun, fiscal_mode)`.
- Sequence closing berjalan independen per Mode — closing bulan N di Mode PPN membutuhkan bulan N-1 (Mode PPN) sudah closed; tidak bergantung pada status closing Mode Non-PPN.
- Setelah closing ──▶ semua transaksi pada periode tersebut bersifat **Read-Only**.
- **Unlock** hanya dapat dilakukan oleh **Pimpinan**, dan wajib tercatat di audit log (siapa, kapan).

#### **Report (Read-Model)**
- Jurnal, Cashflow, Laba Rugi — semua query terfilter **wajib** menyertakan parameter `fiscal_mode`.

---

## 4. Domain Events

| Event | Trigger | Efek |
| :--- | :--- | :--- |
| **POCreated** | PO disimpan | `JournalPosted` (Debet Beban/Persediaan & PPN Masukan, Kredit Hutang/Kas) |
| **InvoiceIssued** | Invoice diterbitkan (status → Issued) | `JournalPosted` (Debet Piutang, Kredit Pendapatan & PPN Keluaran jika PPN) |
| **InvoicePaid** | Status Invoice berubah menjadi Paid | `KwitansiIssued` + `JournalPosted` (Pelunasan Piutang) |
| **PeriodClosed** | Pimpinan/Admin menutup periode | Mengunci semua transaksi di (bulan, tahun, mode) tersebut |
| **PeriodUnlocked** | Pimpinan mengoverride closing | Audit log tercatat, transaksi di periode tersebut dapat diedit sementara |

---

## 5. Constraint Pengujian (Developer Constraints)

- **STRICT:** Agen AI tidak diperkenankan membuka/menguji menggunakan browser (`browser_subagent`) di dalam repositori ini. Seluruh verifikasi fungsional dan visual dilakukan secara manual oleh pengguna (USER).
