# Design System & UI Rules (Tailwind v4)

This design system must be strictly followed to ensure consistency across the YouSee Finance app.

## 1. Color Palette & Typography
- **Primary**: `blue-600` (Buttons, active navs). Glow: `shadow-blue-500/20`.
- **Backgrounds**: App (`bg-slate-50`), Sidebar (`bg-slate-950`), Cards (`bg-white`).
- **Text**: Primary (`text-slate-800`), Secondary (`text-slate-500`), Mono/Money (`font-mono font-bold text-slate-900`).
- **Status Badges**:
  - `emerald`: `paid`, `finished`, `received`.
  - `slate`: `draft`, `archived`, non-PKP.
  - `blue`: `issued`, `active`, PKP.
  - `rose`: Destructive actions, negative values.

## 2. Standard Components & Classes
- **Card/Panel**: `bg-white rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md hover:border-slate-200/50 transition-all`
- **Primary Button**: `bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5`
- **Table Container**: `bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden`
- **Table Header**: `border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4`
- **Table Body Row**: `hover:bg-slate-50/50 transition-colors divide-y divide-slate-100` (Cell padding `px-6 py-4`)
- **Status Badge**: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none`

## 3. Tables & Pagination
- **Mandatory Pagination**: EVERY table must have pagination (default 15 rows). Never render a table without it.
- **Empty State**: Never show an empty table. Show a centered empty state: `📄 Belum ada data`.
- **Formatting**: Monetary columns MUST be right-aligned (`text-right`) using `font-mono font-bold`.

## 4. Fiscal Mode UI
- The active Fiscal Mode (`ppn` / `non-ppn`) MUST be clearly visible in the Sidebar toggle and Header badge.
- When `non-ppn` is active, PPN-related fields in forms MUST NOT be hidden. They must be disabled (`disabled` + `opacity-50 cursor-not-allowed`) so the user maintains context.
