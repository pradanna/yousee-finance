# Rules & Coding Standards — YouSee Finance

Dokumen ini adalah panduan standar pengembangan untuk proyek **YouSee Finance**.
Stack: **Laravel 12 + Inertia.js + React (TypeScript) + Tailwind CSS v4**.

---

## 1. Ubiquitous Language

| Istilah | Makna |
| :--- | :--- |
| **Fiscal Mode** | Konteks aktif: `ppn` atau `non-ppn`. Menentukan silo transaksi mana yang dibaca/ditulis. Atribut wajib di setiap Aggregate transaksi. |
| **PO (Purchase Order)** | Dokumen pembelian multi-item. Minimal 1 item. Bisa backdate/postdate kecuali di periode Closed. |
| **Invoice** | Dokumen tagihan ke Client. Due date otomatis +7 hari. Output PDF. |
| **Kwitansi** | Bukti lunas, terbit otomatis & immutable setelah Invoice berstatus `paid`. |
| **Journal Entry** | Entry Debet/Kredit otomatis. Terbentuk saat PO disimpan dan saat Invoice berubah ke `issued` / `paid`. |
| **PPh Adjustment** | Komponen pajak manual. Untuk PO: independen dari Mode. Untuk Invoice: hanya relevan di Mode PPN. |
| **Closing Period** | Penguncian periode per kombinasi `(month, year, fiscal_mode)`. |
| **Unlock** | Override oleh Pimpinan untuk membuka kembali periode Closed. Wajib tercatat di Audit Log. |

---

## 2. Arsitektur & Struktur Direktori

### Backend (Laravel — Domain-Driven Design)

```
app/
├── Domains/
│   ├── Identity/
│   │   └── Enums/          # UserRole enum
│   ├── Master/
│   │   └── Models/         # Vendor, Client, Sales, Project
│   ├── Procurement/
│   │   └── Models/         # PurchaseOrder, PurchaseOrderItem, Attachment
│   ├── Billing/
│   │   └── Models/         # Invoice, InvoiceItem, Kwitansi
│   ├── Accounting/
│   │   └── Models/         # JournalEntry, JournalEntryItem, PPhAdjustment, ClosingPeriod, AuditLog
│   └── Shared/
│       ├── Enums/           # FiscalMode enum
│       └── Traits/          # HasFiscalMode trait
├── Http/
│   ├── Controllers/         # Thin controllers, delegasikan ke Model/Service
│   ├── Middleware/
│   └── Requests/            # Form Request untuk validasi
└── Models/                  # User (model standar Laravel)
```

### Frontend (Inertia.js + React + TypeScript)

```
resources/js/
├── Components/              # Reusable UI components
├── Layouts/
│   ├── AuthenticatedLayout.tsx
│   ├── DemoLayout.tsx
│   └── GuestLayout.tsx
├── Pages/
│   ├── Auth/                # Login, Register, dsb.
│   ├── Demo/                # Halaman Demo (data statis)
│   └── Dashboard.tsx
└── types/                   # TypeScript type declarations
```

---

## 3. Standar Backend (PHP / Laravel)

### 3.1 Namespace & Penamaan
- **Model**: `App\Domains\{Domain}\Models\{ModelName}` — Singular PascalCase.
- **Controller**: Thin. Hanya menerima request, memanggil model/service, dan me-return respons Inertia.
- **Form Request**: Gunakan untuk semua validasi input HTTP. Letakkan di `App\Http\Requests\`.
- **Enum**: Gunakan PHP 8.1+ Backed Enum untuk nilai tetap (e.g., `FiscalMode`, `UserRole`).
- **Trait**: Logika yang dipakai bersama antar-model disimpan di `App\Domains\Shared\Traits\`.

### 3.2 Domain Invariants (Wajib Ditegakkan)
- **fiscal_mode**: Wajib diset saat create. **Tidak boleh diubah** setelah tersimpan.
- **Closing Period**: Setiap `saving()` pada PO dan Invoice **wajib** memeriksa `ClosingPeriod::isClosed()`. Jika closed, throw `DomainException`.
- **PO Items**: `saved()` hook PO wajib validasi minimal 1 item (kecuali `runningInConsole()`).
- **Invoice Status Flow**: `draft` → `issued` → `paid`. Tidak boleh skip langsung ke `paid` dari `draft`. Status `paid` bersifat terminal.
- **Kwitansi**: Dibuat otomatis via `generateKwitansi()` di `Invoice::updated()` hook. Hanya 1 Kwitansi per Invoice. Immutable setelah terbit.
- **Journal Entry**: Debet total **harus** sama dengan Kredit total. Tidak dihapus langsung — gunakan reversing entry.
- **Unlock**: Hanya `UserRole::PIMPINAN` yang boleh memanggil `ClosingPeriod::unlock()`. Wajib menulis ke `AuditLog`.

### 3.3 Database & Migration
- Nama tabel: `snake_case` plural (e.g., `purchase_orders`, `journal_entries`).
- Kolom `fiscal_mode`: Tipe `string`, nilai `'ppn'` atau `'non-ppn'`.
- Kolom uang: Tipe `decimal(15, 2)`. **Jangan** gunakan `float` di kolom database.
- Semua Aggregate utama (Vendor, Client) menggunakan `softDeletes()`.
- Selalu tambahkan `unique(['month', 'year', 'fiscal_mode'])` di tabel `closing_periods`.

### 3.4 Kode PHP Umum
- PHP versi minimum: **8.2**.
- Gunakan `readonly` properties dan constructor promotion di mana relevan.
- Gunakan `saveQuietly()` untuk update internal yang tidak perlu mentrigger observer/event.
- Gunakan **Laravel Pint** untuk formatting otomatis (`./vendor/bin/pint`).
- **Hindari** query N+1 — selalu eager load relasi dengan `->with([...])`.

---

## 4. Standar Frontend (React + TypeScript)

### 4.1 Komponen
- Setiap komponen harus ditulis dalam TypeScript (`.tsx`).
- Definisikan `interface Props` secara eksplisit di atas setiap komponen.
- **Jangan** gunakan `any`. Gunakan tipe yang tepat atau `unknown` jika tidak pasti.
- Komponen reusable disimpan di `resources/js/Components/`.
- Halaman Inertia disimpan di `resources/js/Pages/`.

### 4.2 Naming Conventions
- Komponen & halaman: `PascalCase` (e.g., `MetricCard.tsx`, `JournalReport.tsx`).
- Fungsi & variabel: `camelCase`.
- Konstanta global: `UPPER_SNAKE_CASE`.
- Props interface: `{ComponentName}Props` (e.g., `interface MetricCardProps`).

### 4.3 Styling (Tailwind CSS v4)
- **Jangan** gunakan inline style (`style={{}}`). Semua styling menggunakan Tailwind utility classes.
- Gunakan kelas desain yang konsisten sesuai design system yang ada:
  - Warna aksen utama: `blue-600`
  - Status aktif/link aktif: `bg-blue-600 text-white shadow-blue-600/15`
  - Status badge `paid`/`finished`: `emerald` family
  - Status badge `draft`: `slate` family
  - Header/sticky element: `sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/55`
- Nilai mata uang menggunakan font monospace bold (`font-mono font-bold`).

### 4.4 Inertia.js
- Navigasi antar halaman menggunakan `router` dari `@inertiajs/react` (bukan `<a href>`).
- Route name diakses menggunakan fungsi `route()` dari **Ziggy** yang sudah ter-include.
- Data dari backend di-pass via `usePage().props` — definisikan tipe-nya secara eksplisit.
- Gunakan `useForm()` dari `@inertiajs/react` untuk semua form submission.

### 4.5 Fiscal Mode — Aturan UI Kritis
- **Indikator Fiscal Mode WAJIB terlihat jelas** di Sidebar setiap saat.
- Saat Mode adalah `non-ppn`, field/kolom terkait PPN harus `disabled` dan secara visual ditandai (misal: `opacity-50 cursor-not-allowed`).
- **Jangan** sembunyikan field PPN — nonaktifkan saja agar Admin tetap sadar konteks aktif.

---

## 5. Standar Routing (Laravel)

- Route API untuk data transaksi: dikelompokkan dengan prefix domain (e.g., `/invoices`, `/purchase-orders`).
- Route Demo (data statis): prefix `/demo`, tidak memerlukan middleware `auth`.
- Route yang memerlukan autentikasi: gunakan middleware `auth` (dan `verified` jika berlaku).
- Penamaan route: `{domain}.{action}` (e.g., `invoices.index`, `invoices.store`).

---

## 6. Pengujian (Testing)

- **Backend**: PHPUnit 11. Test disimpan di `tests/Feature/` dan `tests/Unit/`.
- Setiap invariant domain **wajib** memiliki test yang membuktikan ia benar-benar diblok (e.g., transaksi di periode closed, invoice skip ke paid, dsb.).
- Jalankan test dengan: `composer test` atau `php artisan test`.
- **STRICT**: Agen AI **tidak diperkenankan** membuka/menguji menggunakan browser (`browser_subagent`). Seluruh verifikasi visual dilakukan secara **manual oleh pengguna (USER)**.

---

## 7. Perintah Development Umum

```bash
# Jalankan semua service (server, queue, logs, vite) sekaligus
composer dev

# Jalankan test suite
composer test

# Format PHP dengan Laravel Pint
./vendor/bin/pint

# Build frontend untuk production
npm run build

# Lint & fix TypeScript/React
npm run lint
```

---

## 8. Aturan Lain-Lain

- **Hapus data**: Vendor dan Client menggunakan soft-delete (`is_archived = true`). Hard-delete **dilarang** jika sudah ada relasi transaksi.
- **Komit**: Gunakan pesan komit yang deskriptif. Sertakan konteks domain (e.g., `feat(billing): auto-generate kwitansi on invoice paid`).
- **Tidak ada TODO yang dibiarkan**: Setiap `// TODO` harus diselesaikan atau didokumentasikan sebagai issue.
- **Environment**: Jangan commit nilai secret ke repository. Gunakan `.env` dan pastikan `.env.example` selalu up-to-date.

---

## 9. Design System & UI Rules

Design system ini diekstrak dari komponen dan halaman yang sudah ada. **Wajib konsisten** dengan panduan ini di setiap halaman baru.

### 9.1 Color Palette (Wajib Diikuti)

| Token | Kelas Tailwind | Digunakan Untuk |
| :--- | :--- | :--- |
| **Primary** | `blue-600` | Tombol utama (CTA), nav aktif, toggle aktif, icon aksen |
| **Primary Shadow** | `shadow-blue-500/20` atau `shadow-blue-600/15` | Glow effect pada elemen `blue-600` |
| **Background App** | `bg-slate-50` | Background halaman utama (content area) |
| **Sidebar Background** | `bg-slate-950` | Sidebar navigasi kiri |
| **Sidebar Border** | `border-slate-900` | Divider di dalam sidebar |
| **Card Background** | `bg-white` | Background card, tabel, panel |
| **Card Border** | `border-slate-100/80` | Border card |
| **Table Header BG** | `bg-slate-50/40` | Baris header tabel |
| **Text Primary** | `text-slate-800` / `text-slate-900` | Teks utama, judul, nominal |
| **Text Secondary** | `text-slate-500` / `text-slate-400` | Teks label, sub-teks, placeholder |
| **Text Mono** | `font-mono font-bold text-slate-900` | Nominal uang, kode/ID |
| **Divider** | `divide-slate-100` | Pemisah baris di tabel |
| **Success/Paid** | `emerald` family | Status `paid`, `finished`, `received`, `active` |
| **Neutral/Draft** | `slate` family | Status `draft`, `archived`, non-PKP |
| **Info/Issued** | `blue` family | Status `issued`, `active`, PKP |
| **Danger** | `rose` family | Aksi destruktif, nilai negatif |

### 9.2 Typography

| Elemen | Kelas |
| :--- | :--- |
| Judul halaman (`<h1>`) | `text-lg font-bold text-slate-800 tracking-tight` |
| Sub-judul section | `text-sm font-bold text-slate-800 tracking-tight` |
| Label section header tabel | `text-[11px] font-bold text-slate-400 uppercase tracking-wider` |
| Label mikro (badge, caption) | `text-[10px] font-bold uppercase tracking-widest` |
| Label navigasi sidebar | `text-xs font-bold` |
| Konten tabel umum | `text-sm text-slate-700` |
| Nominal uang | `font-mono font-bold text-slate-900` |
| Sub-teks kecil | `text-[10px] text-slate-400 font-semibold uppercase tracking-wide` |

### 9.3 Komponen Standar & Kelas Wajib

#### Card / Panel
```
bg-white rounded-2xl border border-slate-100/80 shadow-xs
hover:shadow-md hover:border-slate-200/50 transition-all
```

#### Tombol Primer (CTA)
```
bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl
text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5
```

#### Tombol Sekunder / Ghost
```
text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg
text-xs font-semibold transition-colors
```

#### Header Halaman (Sticky)
```
sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/55
```

#### Tabel — Container
```
bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden
```

#### Tabel — Header Row
```
border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40
```
> Padding header: `px-6 py-4`

#### Tabel — Body Row
```
hover:bg-slate-50/50 transition-colors
divide-y divide-slate-100
```
> Padding cell: `px-6 py-4`

#### Status Badge (Pill)
```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
text-xs font-bold border leading-none
```
> Selalu gunakan komponen `<StatusBadge>` yang sudah ada.

#### SlideOver / Drawer
- Muncul dari kanan layar.
- Overlay: `bg-slate-950/40 backdrop-blur-xs`.
- Container: `max-w-md bg-white shadow-2xl border-l border-slate-100`.

#### Input / Form Field
- Gunakan komponen `<TextInput>`, `<InputLabel>`, `<InputError>` yang sudah ada.
- Input yang tidak aktif (disabled) diberi kelas `opacity-50 cursor-not-allowed`.

### 9.4 Layout Struktur Halaman

```
min-h-screen bg-slate-50 flex
  ├── <Sidebar>        → w-72, fixed left, bg-slate-950
  └── flex-1 pl-72
        ├── <Header>   → sticky top-0, h-16
        └── <main>     → p-6 md:p-8, max-w-7xl mx-auto
```
- Semua halaman yang memerlukan navigasi **wajib** menggunakan `DemoLayout` (atau `AuthenticatedLayout` di production).
- Content area max-width: `max-w-7xl`.

### 9.5 Fiscal Mode — Aturan Visual Wajib

- Indikator mode (`ppn` / `non-ppn`) **wajib** tampil di:
  1. Toggle di Sidebar.
  2. Badge di samping judul `<h1>` di Header.
- Warna badge Mode PPN: `bg-blue-50 text-blue-700 border border-blue-100`.
- Warna badge Mode Non-PPN: `bg-slate-100 text-slate-700 border border-slate-200`.
- Field yang tidak relevan di mode aktif: `disabled` + `opacity-50 cursor-not-allowed`.

---

## 10. Aturan Komponen & Reusability

### 10.1 Prinsip Komponen

- **Jika sebuah UI pattern digunakan lebih dari 1 kali, atau berpotensi digunakan ulang di halaman lain → WAJIB dijadikan komponen** dan disimpan di `resources/js/Components/`.
- Komponen baru yang dibuat **wajib didaftarkan** di [`docs/components.md`](./docs/components.md) dengan format yang sudah ditentukan.
- Komponen harus memiliki **interface Props yang eksplisit** dan terdokumentasi.

### 10.2 Panduan Membuat Komponen Baru

1. Buat file di `resources/js/Components/{NamaKomponen}.tsx`.
2. Definisikan `interface {NamaKomponen}Props` di bagian atas file.
3. Gunakan named export `default` (`export default function NamaKomponen`).
4. Tambahkan entry ke `docs/components.md`.

### 10.3 Komponen yang Sudah Ada (Gunakan Ulang, Jangan Buat Duplikat)

| Komponen | File | Kapan Digunakan |
| :--- | :--- | :--- |
| `Sidebar` | `Components/Sidebar.tsx` | Navigasi kiri di setiap halaman |
| `Header` | `Components/Header.tsx` | Header sticky dengan breadcrumb & fiscal mode badge |
| `MetricCard` | `Components/MetricCard.tsx` | Ringkasan KPI / metrik keuangan |
| `StatusBadge` | `Components/StatusBadge.tsx` | Status dokumen: draft/issued/paid/active/finished |
| `SlideOver` | `Components/SlideOver.tsx` | Drawer form dari kanan layar |
| `Modal` | `Components/Modal.tsx` | Dialog konfirmasi atau form modal |
| `TextInput` | `Components/TextInput.tsx` | Field input teks |
| `InputLabel` | `Components/InputLabel.tsx` | Label untuk field form |
| `InputError` | `Components/InputError.tsx` | Pesan error validasi di bawah field |
| `Dropdown` | `Components/Dropdown.tsx` | Menu dropdown |

---

## 11. Aturan Tabel & Pagination

### 11.1 Setiap Tabel WAJIB Memiliki Pagination

- **Tidak ada tabel tanpa pagination**, sekecil apapun datanya.
- Pagination menggunakan komponen `<Pagination>` (buat jika belum ada, dan daftarkan di `docs/components.md`).
- Default: **15 baris per halaman**.
- Tampilkan informasi: "Menampilkan X–Y dari Z data".

### 11.2 Struktur Pagination Standar

```tsx
{/* Pagination */}
<div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
    {/* Info */}
    <span className="text-xs text-slate-500 font-semibold">
        Menampilkan {start}–{end} dari {total} data
    </span>
    {/* Tombol */}
    <div className="flex items-center gap-1">
        <button disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← Sebelumnya
        </button>
        {/* Nomor halaman */}
        <button className="w-7 h-7 rounded-lg text-xs font-bold bg-blue-600 text-white">1</button>
        <button
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500
                       hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Berikutnya →
        </button>
    </div>
</div>
```

### 11.3 Aturan Tambahan Tabel

- Selalu gunakan container `overflow-x-auto` agar tabel tidak overflow di layar kecil.
- Kolom nominal uang: align **kanan** (`text-right`), font `font-mono font-bold`.
- Kolom status badge: `whitespace-nowrap`.
- Kolom panjang (alamat, deskripsi): gunakan `truncate` + `title={value}` untuk tooltip.
- Baris kosong (no data): tampilkan empty state yang informatif, bukan tabel kosong.

### 11.4 Empty State Standar

```tsx
<tr>
    <td colSpan={N} className="px-6 py-16 text-center">
        <div className="text-slate-300 text-4xl mb-3">📄</div>
        <div className="text-sm font-bold text-slate-500">Belum ada data</div>
        <div className="text-xs text-slate-400 mt-1">Data akan muncul di sini setelah ditambahkan.</div>
    </td>
</tr>
```
