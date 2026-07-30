# Component Registry — YouSee Finance

Daftar semua reusable UI components yang tersedia di `resources/js/Components/`.

> **ATURAN**: Setiap komponen baru yang dibuat **WAJIB** didaftarkan di sini.
> Format entry mengikuti template di bawah.

---

## Template Entry Baru

```md
### `NamaKomponen`
**File**: `resources/js/Components/NamaKomponen.tsx`
**Dibuat**: YYYY-MM-DD
**Digunakan di**: Daftar halaman/layout yang menggunakannya

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `propName` | `string` | — | Deskripsi prop |

**Contoh Penggunaan**:
\`\`\`tsx
<NamaKomponen prop="value" />
\`\`\`
```

---

## Layout Components

### `DemoLayout`
**File**: `resources/js/Layouts/DemoLayout.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Semua halaman `Pages/Demo/*`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `children` | `React.ReactNode` | — | Konten halaman |
| `activePage` | `string` (union) | — | ID halaman aktif untuk highlight nav |
| `title` | `string` | — | Judul halaman (diteruskan ke Header) |
| `breadcrumbs` | `Array<{ label, href? }>` | — | Breadcrumb navigasi |

**Catatan**: Menyediakan `useDemoFiscalMode()` hook dan `DemoContext` untuk sharing state fiscal mode antar komponen.

---

## Navigation & Layout Components

### `Sidebar`
**File**: `resources/js/Components/Sidebar.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `DemoLayout`, `AuthenticatedLayout`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `activePage` | `string` (union) | — | ID halaman aktif |
| `fiscalMode` | `'ppn' \| 'non-ppn'` | — | Mode fiskal aktif |
| `onFiscalModeToggle` | `(mode) => void` | — | Callback saat mode diganti |

**Fitur**:
- Fixed sidebar kiri (`w-72`, `bg-slate-950`).
- Toggle Fiscal Mode Silo (PPN / Non-PPN).
- Navigasi dengan section grouping: Overview, Master, Transaksi, Laporan.
- User profile card di bagian bawah.

---

### `Header`
**File**: `resources/js/Components/Header.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `DemoLayout`, `AuthenticatedLayout`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `title` | `string` | — | Judul halaman |
| `breadcrumbs` | `Array<{ label, href? }>` | — | Breadcrumb navigasi |
| `fiscalMode` | `'ppn' \| 'non-ppn' \| undefined` | `undefined` | Badge mode fiskal di samping judul |

**Fitur**:
- Sticky header dengan backdrop blur (`bg-white/80 backdrop-blur-md`).
- Tampil tanggal sistem (format bahasa Indonesia).
- Avatar inisial user di kanan.
- Badge warna fiscal mode di samping `<h1>`.

---

## Data Display Components

### `MetricCard`
**File**: `resources/js/Components/MetricCard.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `Pages/Demo/Overview.tsx`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `title` | `string` | — | Label metrik |
| `value` | `string \| number` | — | Nilai metrik (gunakan format IDR) |
| `badgeText` | `string \| undefined` | — | Teks badge (e.g., "PPN", "+12%") |
| `badgeColorClass` | `string` | `'bg-slate-50 text-slate-500 border-slate-100'` | Kelas warna badge |
| `icon` | `React.ReactNode \| undefined` | — | Icon di sudut kiri atas |
| `iconColorClass` | `string` | `'bg-slate-50 text-slate-400 border-slate-100'` | Kelas warna icon container |
| `valueColorClass` | `string` | `'text-slate-900'` | Kelas warna teks nilai |

**Contoh Penggunaan**:
```tsx
<MetricCard
    title="Total Pendapatan"
    value="IDR 125.000.000"
    badgeText="Mode PPN"
    badgeColorClass="bg-blue-50 text-blue-700 border-blue-100"
    iconColorClass="bg-blue-50 text-blue-600 border-blue-100"
    icon={<SomeIcon className="w-5 h-5" />}
/>
```

---

### `StatusBadge`
**File**: `resources/js/Components/StatusBadge.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `Pages/Demo/SalesTransactions.tsx`, `Pages/Demo/Purchases.tsx`, `Pages/Demo/Projects.tsx`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `status` | `'draft' \| 'issued' \| 'paid' \| 'received' \| 'active' \| 'finished'` | — | Status dokumen |

**Pemetaan Warna**:
| Status | Warna |
| :--- | :--- |
| `paid`, `received`, `finished` | `emerald` (hijau) |
| `issued`, `active` | `blue` (biru) |
| `draft` | `slate` (abu) |

**Contoh Penggunaan**:
```tsx
<StatusBadge status="issued" />
<StatusBadge status="paid" />
```

---

## Overlay & Modal Components

### `SlideOver`
**File**: `resources/js/Components/SlideOver.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `Pages/Demo/Vendors.tsx`, `Pages/Demo/Clients.tsx`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | — | Status buka/tutup drawer |
| `onClose` | `() => void` | — | Callback saat drawer ditutup |
| `title` | `string` | — | Judul di header drawer |
| `children` | `React.ReactNode` | — | Konten form di dalam drawer |

**Perilaku**:
- Muncul dari kanan layar dengan animasi.
- Overlay backdrop blur menutup konten di belakang.
- Menutup saat overlay di-klik atau tombol close ditekan.

**Contoh Penggunaan**:
```tsx
<SlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Vendor Baru">
    <form>...</form>
</SlideOver>
```

---

### `Modal`
**File**: `resources/js/Components/Modal.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: -

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `show` | `boolean` | — | Status buka/tutup modal |
| `onClose` | `() => void` | — | Callback saat modal ditutup |
| `maxWidth` | `string` | `'2xl'` | Ukuran modal |
| `closeable` | `boolean` | `true` | Apakah modal bisa ditutup |
| `children` | `React.ReactNode` | — | Konten modal |

---

## Form Components

### `TextInput`
**File**: `resources/js/Components/TextInput.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form di seluruh halaman

**Props**: Extends semua props standar `<input>` HTML.

**Contoh Penggunaan**:
```tsx
<TextInput
    id="name"
    type="text"
    value={form.name}
    onChange={e => setForm({ ...form, name: e.target.value })}
    className="w-full"
/>
```

---

### `InputLabel`
**File**: `resources/js/Components/InputLabel.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form di seluruh halaman

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `htmlFor` | `string` | — | Target id input |
| `value` | `string` | — | Teks label |
| `className` | `string` | `''` | Kelas tambahan |

---

### `InputError`
**File**: `resources/js/Components/InputError.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form di seluruh halaman

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `message` | `string \| undefined` | — | Pesan error. Tidak render jika kosong. |

---

### `Checkbox`
**File**: `resources/js/Components/Checkbox.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form dengan toggle boolean

**Props**: Extends semua props standar `<input type="checkbox">` HTML.

---

## Navigation Components

### `Dropdown`
**File**: `resources/js/Components/Dropdown.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: -

**Sub-Komponen**:
- `Dropdown` — Wrapper utama
- `Dropdown.Trigger` — Elemen pemicu
- `Dropdown.Content` — Konten menu
- `Dropdown.Link` — Item menu berupa link

---

### `NavLink`
**File**: `resources/js/Components/NavLink.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `AuthenticatedLayout`

**Props**:
| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `href` | `string` | — | URL tujuan |
| `active` | `boolean` | — | Apakah link aktif |
| `children` | `React.ReactNode` | — | Label link |

---

### `ResponsiveNavLink`
**File**: `resources/js/Components/ResponsiveNavLink.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: `AuthenticatedLayout` (mobile menu)

---

## Action Button Components

### `PrimaryButton`
**File**: `resources/js/Components/PrimaryButton.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form actions

**Props**: Extends `<button>` HTML. Render tombol bergaya `blue-600`.

---

### `SecondaryButton`
**File**: `resources/js/Components/SecondaryButton.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Form actions (cancel, reset)

---

### `DangerButton`
**File**: `resources/js/Components/DangerButton.tsx`
**Dibuat**: 2026-06-26
**Digunakan di**: Aksi destruktif (hapus, archive)

---

## Komponen Yang Perlu Dibuat

Komponen berikut **belum ada** dan **perlu dibuat** saat pertama kali dibutuhkan:

| Komponen | Prioritas | Deskripsi |
| :--- | :--- | :--- |
| `Pagination` | 🔴 Tinggi | Komponen pagination standar untuk semua tabel (lihat aturan di `rules.md` §11) |
| `EmptyState` | 🔴 Tinggi | Tampilan kosong standar ketika tabel tidak memiliki data |
| `FilterBar` | 🟡 Sedang | Baris filter (search input + select filter) di atas tabel |
| `ConfirmDialog` | 🟡 Sedang | Dialog konfirmasi sebelum aksi destruktif (hapus, archive) |
| `ToastNotification` | 🟡 Sedang | Notifikasi singkat (sukses/error) setelah operasi |
| `LoadingSpinner` | 🟢 Rendah | Indikator loading untuk operasi async |
| `DateRangePicker` | 🟡 Sedang | Pemilih rentang tanggal untuk filter laporan |
| `CurrencyInput` | 🟡 Sedang | Input field khusus nominal uang (format IDR otomatis) |
