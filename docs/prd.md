# Product Requirement Document (PRD) — YouSee Finance

**Versi**: 1.0
**Tanggal**: 2026-07-30
**Status**: Draft

---

## 1. Executive Summary & Visi Produk

**YouSee Finance** adalah aplikasi manajemen keuangan dan akuntansi terpusat berbasis web yang dirancang untuk mengelola transaksi bisnis (Procurement, Billing, dan Accounting) dengan fitur inti berupa **Dual Fiscal Mode Silo (PPN & Non-PPN)** dalam satu akun login.

Aplikasi ini memisahkan transaksi wajib-PPN dan non-PPN secara terisolasi namun dikelola dalam satu platform terpadu, menjamin kepatuhan pajak, efisiensi pencatatan jurnal otomatis (double-entry), serta transparansi laporan laba-rugi dan arus kas.

---

## 2. Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| **Backend** | Laravel 12, PHP 8.2+ |
| **Frontend** | React 18, TypeScript, Inertia.js v2 |
| **Styling** | Tailwind CSS v4 |
| **Build Tool** | Vite 7 |
| **Database** | SQLite (dev) / MySQL atau PostgreSQL (production) |
| **Auth** | Laravel Breeze (session-based) |
| **Testing** | PHPUnit 11 |
| **Routing** | Ziggy (route helper di frontend) |

---

## 3. Target Pengguna & Peran

| Role | Tanggung Jawab |
| :--- | :--- |
| **Admin** | Mengelola Master Data (Vendor, Client, Sales, Project), membuat & menerbitkan PO, Invoice, mengunggah lampiran, menginput PPh Adjustment, dan melakukan Closing Period. |
| **Pimpinan** | Akses penuh termasuk: Reset Password user lain, **Unlock Period** (membuka kembali periode yang sudah closed), dan memantau semua Laporan Keuangan. |

> Sistem menggunakan 1 login terpusat. Tidak ada multi-tenancy. Role ditentukan oleh kolom `role` pada tabel `users`.

---

## 4. Fitur Inti & Modul

### 4.1 Identity & Access Control

- **Single Login**: Satu akun mengakses seluruh sistem. Tidak ada switch akun.
- **Fiscal Mode Toggle**: Pengguna dapat berpindah konteks antara **Mode PPN** dan **Mode Non-PPN** melalui toggle di Sidebar.
- **Role Guard**: Tindakan sensitif (Unlock Period, Reset Password) dikunci hanya untuk role `pimpinan`.
- **Inactive User Block**: User dengan `active = false` tidak dapat login.

---

### 4.2 Master Data (Shared — Tidak Terpengaruh Fiscal Mode)

#### Vendor
- Field: Nama Lengkap (wajib), NPWP (opsional, harus format valid jika diisi).
- Proteksi: Tidak bisa hard-delete jika sudah pernah digunakan di PO. Hanya bisa diarsipkan (`is_archived = true`).

#### Client
- Field: Nama Lengkap (wajib), NPWP (opsional).
- Proteksi: Tidak bisa hard-delete jika sudah terhubung ke Invoice.

#### Sales
- Field: Nama, Email (unik).
- Performa dihitung dari Invoice terkait, dihitung **per Fiscal Mode** (tidak diagregasi lintas mode).

#### Project
- Field: Nama, Status (`active` / `finished`).
- Laba-rugi proyek = PO (cost) + Invoice (revenue) yang ter-link, difilter per Fiscal Mode.

---

### 4.3 Procurement — Purchase Order (PO)

**Siloed by Fiscal Mode.**

| Field | Keterangan |
| :--- | :--- |
| `vendor_id` | Wajib. |
| `project_id` | Opsional. |
| `fiscal_mode` | Wajib. Fixed setelah disimpan. |
| `transaction_date` | Bebas backdate/postdate. Diblok jika periode sudah Closed. |
| `has_ppn` | Boolean manual. Independen dari Fiscal Mode — tergantung status PKP Vendor. |
| `items[]` | Minimal 1 item (`name`, `quantity`, `price`). |
| `attachments[]` | Opsional. 0 atau lebih file gambar sebagai bukti fisik. |

**Total PO** = Σ(qty × price per item).

**Journaling Otomatis**: Saat PO berhasil disimpan, Journal Entry dibuat otomatis:
- Debet: `Beban / Persediaan` + (opsional) `PPN Masukan` jika `has_ppn = true`
- Kredit: `Hutang Dagang / Kas`

---

### 4.4 Billing — Invoice & Kwitansi

**Siloed by Fiscal Mode.**

#### Invoice

| Field | Keterangan |
| :--- | :--- |
| `client_id` | Wajib. |
| `sales_id` | Opsional. |
| `project_id` | Opsional. |
| `fiscal_mode` | Wajib. Fixed setelah disimpan. |
| `transaction_date` | Diblok jika periode sudah Closed. |
| `due_date` | Default: `transaction_date + 7 hari`. Dapat dioverride. |
| `status` | `draft` → `issued` → `paid` (status `paid` bersifat terminal). |
| `ppn` | Mode PPN: 11% otomatis (tidak bisa dinolkan). Mode Non-PPN: 0, field disabled. |

**Journaling Otomatis**:
- Saat status → `issued`: Debet `Piutang Dagang`, Kredit `Pendapatan Usaha` (+`PPN Keluaran` jika ada).
- Saat status → `paid`: Debet `Kas / Bank`, Kredit `Piutang Dagang`.

#### Kwitansi
- Terbit **otomatis dan immutable** hanya saat Invoice berubah ke `paid`.
- 1 Invoice → maksimal 1 Kwitansi aktif.
- Nomor Kwitansi: format `KW-{UNIQUE_ID}`.

---

### 4.5 Accounting & Tax

#### Journal Entry (Double-Entry)
- Total Debet **harus selalu sama dengan** Total Kredit (*hard invariant*).
- **Tidak pernah dihapus** secara langsung — koreksi menggunakan *reversing entry*.
- `fiscal_mode` mengikuti sumber (PO/Invoice). Tidak bisa diinput manual berbeda.

#### PPh Adjustment
- Diinput manual oleh Admin, terkait ke PO atau Invoice spesifik.
- Berlaku di kedua Mode untuk Procurement. Untuk Billing: hanya relevan di Mode PPN.

#### Closing Period
- 1 closing = kombinasi unik `(month, year, fiscal_mode)`.
- Sequence closing **independen per Mode**: Closing bulan N di Mode PPN membutuhkan bulan N-1 (Mode PPN) sudah closed. Tidak bergantung pada status Mode Non-PPN.
- Setelah closing: semua transaksi di periode tersebut → **Read-Only**.
- **Unlock**: Hanya `Pimpinan`. Wajib memasukkan alasan. Tercatat di `AuditLog` (`UNLOCK_PERIOD`).

#### Laporan Keuangan (Read-Model)
Semua laporan **wajib** difilter berdasarkan `fiscal_mode` yang sedang aktif.

| Laporan | Deskripsi |
| :--- | :--- |
| **Jurnal Umum** | Daftar semua Journal Entry dalam rentang tanggal tertentu. |
| **Cashflow** | Arus kas masuk (Invoice Paid) dan keluar (PO). |
| **Laba Rugi** | Revenue (Invoice) dikurangi Cost (PO) per periode. |
| **PPN Report** | Rekapitulasi PPN Masukan vs PPN Keluaran. |
| **Hutang & Piutang** | Saldo outstanding PO (hutang) dan Invoice belum paid (piutang). |
| **Invoice / PO List** | Daftar dokumen transaksi dengan filter status dan periode. |

---

## 5. Alur Data & Domain Events

```
PO Disimpan
  └──▶ [POCreated] ──▶ JournalEntry dibuat otomatis (Beban + Hutang)

Invoice Draft → Issued
  └──▶ [InvoiceIssued] ──▶ JournalEntry dibuat otomatis (Piutang + Pendapatan)

Invoice Issued → Paid
  └──▶ [InvoicePaid] ──▶ KwitansiIssued + JournalEntry Pelunasan (Kas + Piutang)

ClosingPeriod.is_closed = true
  └──▶ [PeriodClosed] ──▶ Semua transaksi (month, year, fiscal_mode) → Read-Only

ClosingPeriod.unlock()
  └──▶ [PeriodUnlocked] ──▶ AuditLog ditulis (user, waktu, alasan)
```

---

## 6. Skema Database (Summary)

| Tabel | Deskripsi |
| :--- | :--- |
| `users` | User login dengan kolom `role` dan `active` |
| `vendors` | Data vendor dengan soft-delete |
| `clients` | Data client dengan soft-delete |
| `sales` | Data tenaga penjual |
| `projects` | Data proyek dengan status `active`/`finished` |
| `purchase_orders` | PO header dengan `fiscal_mode`, `has_ppn` |
| `purchase_order_items` | Line items PO |
| `attachments` | File lampiran PO |
| `invoices` | Invoice header dengan `fiscal_mode`, `status` |
| `invoice_items` | Line items Invoice |
| `kwitansis` | Bukti lunas, 1-to-1 dengan Invoice yang Paid |
| `journal_entries` | Header Journal Entry dengan polymorphic `source` |
| `journal_entry_items` | Baris Debet/Kredit |
| `pph_adjustments` | Penyesuaian PPh manual |
| `closing_periods` | Status closing per `(month, year, fiscal_mode)` — unique constraint |
| `audit_logs` | Log tindakan sensitif (Unlock Period) |

---

## 7. Halaman & Routing

| Route | Halaman | Deskripsi |
| :--- | :--- | :--- |
| `/` | `Welcome` | Landing page |
| `/dashboard` | `Dashboard` | Dashboard utama (auth required) |
| `/demo/overview` | `Demo/Overview` | Ringkasan metrik keuangan |
| `/demo/vendors` | `Demo/Vendors` | Master data Vendor |
| `/demo/clients` | `Demo/Clients` | Master data Client |
| `/demo/sales` | `Demo/Sales` | Master data Sales |
| `/demo/projects` | `Demo/Projects` | Master data Proyek |
| `/demo/purchases` | `Demo/Purchases` | Daftar Purchase Order |
| `/demo/sales-transactions` | `Demo/SalesTransactions` | Daftar Invoice / Penjualan |
| `/demo/invoice-po` | `Demo/InvoicePoList` | Daftar Invoice & PO |
| `/demo/debt-receivable` | `Demo/DebtReceivable` | Hutang & Piutang |
| `/demo/journal` | `Demo/JournalReport` | Laporan Jurnal |
| `/demo/ppn` | `Demo/PpnReport` | Laporan PPN |
| `/demo/cashflow` | `Demo/CashflowReport` | Laporan Cashflow |

---

## 8. Non-Functional Requirements

1. **Security**: Periode Closed → transaksi Read-Only secara hard di level model (bukan hanya UI). Unlock membutuhkan role `pimpinan`.
2. **Data Integrity**: Journal Entry harus selalu balanced (Debet = Kredit). Kwitansi immutable.
3. **Audit Trail**: Setiap Unlock Period tercatat di `audit_logs` dengan detail siapa, kapan, dan alasannya.
4. **Performance**: Hindari N+1 query. Eager load relasi yang dibutuhkan.
5. **Developer Testing Constraint**: Pengujian visual/browser dilakukan **manual oleh pengguna (USER)**. Agen AI tidak menggunakan `browser_subagent` di repositori ini.

---

## 9. Future Enhancements (Roadmap)

- Export Laporan Keuangan ke format Excel & PDF langsung dari UI.
- Integrasi e-Faktur / QR Code PPN.
- Setting global due date default (saat ini hardcoded +7 hari).
- Fitur cetak PDF Invoice dengan opsi TTD digital.
- Multi-currency support untuk transaksi valas.
- Notifikasi invoice jatuh tempo (email / in-app notification).
