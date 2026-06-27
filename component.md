# Frontend Components — Finance Application

Dokumentasi spesifikasi reusable components yang digunakan untuk frontend aplikasi FintechLedger. Semua komponen ditulis menggunakan **React + TypeScript** dan menggunakan class utility **Tailwind CSS**.

---

## 1. Sidebar (`Sidebar.tsx`)
Komponen navigasi kiri yang bersifat fixed di layar desktop.

### Props
```typescript
interface SidebarProps {
    activePage: 'overview' | 'vendors' | 'transaction' | 'invoice-po' | 'journal' | 'ppn' | 'cashflow';
    fiscalMode: 'ppn' | 'non-ppn';
    onFiscalModeToggle: (mode: 'ppn' | 'non-ppn') => void;
}
```

### Invariants & Behavior
- Toggle **Mode PPN / Non-PPN** di sidebar merupakan pengubah filter data global untuk semua visualisasi transaksi di halaman aktif.
- Menampilkan logo branding **FintechLedger** di atas, menu navigasi vertikal di tengah, dan profile card pengguna aktif di bawah.
- Tautan menu yang aktif ditandai dengan background biru (`bg-blue-600`) dan shadow berpendar (`shadow-blue-600/15`).

---

## 2. Header (`Header.tsx`)
Header horizontal di bagian atas content area yang memiliki backdrop blur transparan.

### Props
```typescript
interface HeaderProps {
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
    onMenuToggle?: () => void; // Untuk menu hamburger mobile
}
```

### Invariants & Behavior
- Menggunakan class `sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/55` untuk efek transparan premium.
- Menampilkan tanggal sistem aktif dengan format yang rapi dan inisial avatar user di ujung kanan.

---

## 3. MetricCard (`MetricCard.tsx`)
Widget ringkasan metrik keuangan untuk menampilkan total nominal, pertumbuhan, dan tren.

### Props
```typescript
interface MetricCardProps {
    title: string;
    value: string | number; // Format mata uang (e.g., IDR 10,000,000)
    change?: {
        percentage: number;
        type: 'up' | 'down' | 'neutral';
    };
    icon?: React.ReactNode;
    loading?: boolean;
}
```

### Invariants & Behavior
- Format teks jumlah dana menggunakan font monospace bold agar mudah terbaca.
- Kenaikan atau penurunan nilai diwakili oleh badge kecil berwarna:
  - `up`: Emerald Green (`bg-emerald-50 text-emerald-700 border-emerald-100`)
  - `down`: Rose Red (`bg-rose-50 text-rose-700 border-rose-100`)
  - `neutral`: Slate Gray (`bg-slate-50 text-slate-700 border-slate-100`)

---

## 4. StatusBadge (`StatusBadge.tsx`)
Label status berbentuk pill dengan dot indikator bulat untuk penunjuk kondisi dokumen transaksi.

### Props
```typescript
interface StatusBadgeProps {
    status: 'draft' | 'issued' | 'paid' | 'received' | 'active' | 'finished';
}
```

### Invariants & Behavior
- Penyesuaian tema warna per status:
  - `draft`: `bg-slate-100 text-slate-700 border-slate-200`
  - `issued` / `active`: `bg-blue-50 text-blue-700 border-blue-100` (Dot: `bg-blue-500`)
  - `paid` / `received` / `finished`: `bg-emerald-50 text-emerald-700 border-emerald-100` (Dot: `bg-emerald-500`)

---

## 5. SlideOver (`SlideOver.tsx`)
Drawer slide-out modal yang muncul dari sisi kanan layar, digunakan untuk form entri data cepat (seperti form tambah vendor baru).

### Props
```typescript
interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
```

### Invariants & Behavior
- Muncul dengan animasi transisi yang halus dari kanan layar.
- Background overlay transparan hitam dengan filter blur (`backdrop-blur-sm`).
- Menutup ketika tombol close diklik atau area luar drawer ditekan.
