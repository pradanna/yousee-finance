# Design System & UI Rules

This design system must be strictly followed to ensure consistency across the YouSee Finance app.

## 1. Color Palette & Typography
- **Typography**: `Plus Jakarta Sans` as default font family (`font-sans`).
- **Primary Color**: `primary` (`#2563eb` / `blue-600`). Hover: `primary-700` (`#1d4ed8`), Active: `primary-800` (`#1e40af`).
- **Backgrounds**: App (`bg-slate-100`), Sidebar (`bg-white border-r border-slate-200/80`), Auth (`bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950`), Cards (`bg-white`).
- **Text**: Primary (`text-slate-900`), Secondary (`text-slate-500`), Mono/Money (`font-mono font-bold text-slate-900`).
- **Status Badges**:
  - `emerald`: `paid`, `finished`, `received`.
  - `slate`: `draft`, `archived`, non-PKP.
  - `blue`: `issued`, `active`, PKP.
  - `rose`: Destructive actions, negative values.

## 2. Standard Components & Classes
- **Card/Panel**: `bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all`
- **Primary Button**: `bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2`
- **Neon Shadow Utility**:
  - `shadow-neon-primary`: `0 4px 14px -2px rgba(37, 99, 235, 0.25)`
  - `shadow-neon-primary-lg`: `0 6px 20px -2px rgba(37, 99, 235, 0.35)`
- **Table Container**: `bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden`
- **Table Header**: `border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4`
- **Table Body Row**: `hover:bg-slate-50/50 transition-colors divide-y divide-slate-100` (Cell padding `px-6 py-4`)
- **Status Badge**: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none`

## 3. Auth Layout (Flying Card Pattern)
- **Background**: Full-screen dark rich blue gradient with billboard image overlay (`bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950`) and glowing ambient lights.
- **Flying Card**: Centered elevated white container (`max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-950/60`).
- **Logo**: Centered logo image (`/images/yousee.png`) at top of the card.
- **Copyright**: `© [Year] Yousee Indonesia. All rights reserved.`

## 4. Tables & Pagination
- **Mandatory Pagination**: EVERY table must have pagination (default 15 rows). Never render a table without it.
- **Empty State**: Never show an empty table. Show a centered empty state: `📄 Belum ada data`.
- **Formatting**: Monetary columns MUST be right-aligned (`text-right`) using `font-mono font-bold`.

## 5. Fiscal Mode UI
- The active Fiscal Mode (`ppn` / `non-ppn`) MUST be clearly visible in the Sidebar toggle and Header badge.
- When `non-ppn` is active, PPN-related fields in forms MUST NOT be hidden. They must be disabled (`disabled` + `opacity-50 cursor-not-allowed`) so the user maintains context.

## 6. Component Modularization & Reusability
- **Mandatory Component Extraction**: Whenever adding or modifying UI elements, always extract reusable UI patterns into dedicated React components inside `resources/js/Components/`.
- **Consistency & Maintainability**: Avoid duplicating inline JSX structures for UI elements (e.g., buttons, input fields, badges, cards, modals, table elements). Building modular components guarantees visual consistency and clean code across the entire application.

## 7. Full-Width Page Layout
- **Full-Width Spanning**: Internal pages and dashboard views MUST NOT be restricted to centered max-width containers (such as `max-w-7xl` or `mx-auto`).
- **Container Sizing**: Always use `w-full` for page layout containers so that tables, charts, grids, and metric cards expand to use the full width of the viewport.

## 8. Component Subdirectory Organization
- **Categorized Subfolders**: All components in `resources/js/Components/` MUST be organized into dedicated domain subfolders:
  - `Table/`: Data table utilities and pagination (e.g. `Pagination`, `EmptyState`)
  - `Card/`: Metric cards, charts, and dashboard widgets (e.g. `MetricCard`, `CashflowChartCard`, `PpnStatusCard`, `RecentTransactionsCard`, etc.)
  - `Form/`: Form controls and pickers (e.g. `TextInput`, `InputLabel`, `InputError`, `Checkbox`, `MonthPicker`, `SelectInput`)
  - `Button/`: Button variants (e.g. `PrimaryButton`, `SecondaryButton`, `DangerButton`)
  - `UI/`: Overlays, badges, and feedback components (e.g. `StatusBadge`, `Modal`, `SlideOver`, `Dropdown`, `ApplicationLogo`, `PaymentModal`)
  - `Layout/`: Top-level layout headers and sidebars (e.g. `Header`, `Sidebar`)
  - `Navigation/`: Navigation link helpers (`NavLink`, `ResponsiveNavLink`)

## 9. Forms & Payment Modals
- **Form Labels**: Use `text-xs font-bold text-slate-700 tracking-tight` to prevent text wrapping.
- **Select Dropdowns**: Always use the reusable `SelectInput` component (`bg-slate-50 border-slate-200 rounded-xl focus:ring-primary/20`).
- **Modal Container**: Transaction & payment modals MUST use `maxWidth="xl"` (`max-w-xl`) to provide comfortable spacing for 2-column form grids.
- **Fiscal Mode Awareness**: Payment forms MUST dynamically adapt to PPN / Non-PPN fiscal modes, displaying automatic DPP + PPN 11% breakdowns and e-Faktur inputs when PPN mode is active.

## 10. Responsive Design Standards
- **Mobile-First Breakpoint Grids**: All page layouts and card grids MUST use responsive Tailwind grid/flex utilities:
  - Metric Card Grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
  - Filter & Action Bars: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`
  - Form Grids: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Horizontal Table Scrolling**: EVERY data table container MUST be wrapped inside `<div className="overflow-x-auto">` to ensure tables scroll smoothly on smaller viewports without overflowing page layouts.
- **Mobile Navigation & Header**: Main layouts MUST maintain a fixed collapsible sidebar drawer and sticky blurred header (`sticky top-0 z-30 bg-white/80 backdrop-blur-md`) with mobile hamburger toggles.
- **Touch-Friendly Buttons & Inputs**: Buttons, inputs, and select components MUST have adequate touch targets (minimum `py-2.5 px-3.5` or `h-10`) with `rounded-xl` borders for effortless mobile interaction.

## 11. Table Action Dropdowns (3-Dots Menu)
- **3-Dots Action Menu**: EVERY data table row action MUST use the reusable `ActionDropdown` component ([ActionDropdown.tsx](file:///c:/PROJECT/WEBSITE/yousee-finance/resources/js/Components/UI/ActionDropdown.tsx)) with a 3-dots icon trigger (`w-8 h-8 rounded-xl bg-slate-50 border-slate-200`).
- **Unclipped React Portal Rendering**: To guarantee dropdown menus are NEVER clipped or covered by table overflow containers (`overflow-x-auto`, `overflow-hidden`), `ActionDropdown` MUST use React Portal (`createPortal`) to render directly into `document.body` with `z-[9999]` and dynamic viewport coordinate calculation.

## 12. Filter Panel Bar Standards
- **Stacked Filter Labels**: Labels for search inputs, select dropdowns, and date pickers inside filter panel bars MUST be positioned **ABOVE** their controls (`space-y-1`), never inline beside them.
- **Filter Label Typography**: Always format filter bar labels using compact sub-text styling `text-[10px] font-bold text-slate-400 uppercase tracking-wider block`.
- **Bottom Vertical Alignment**: Main filter panel containers MUST use `sm:items-end` alignment so search inputs and select dropdowns align seamlessly along their bottom edge.

## 13. Custom Interactive Select Controls
- **Custom Popover Listbox**: All dropdown select components MUST use the custom interactive popover component ([SelectInput.tsx](file:///c:/PROJECT/WEBSITE/yousee-finance/resources/js/Components/Form/SelectInput.tsx)) instead of default browser native `<select>` dropdowns.
- **Unclipped React Portal Rendering**: Options dropdown menus MUST use React Portal (`createPortal`) to render directly into `document.body` (`z-[9999] bg-white rounded-2xl border border-slate-100 shadow-2xl p-1.5`) so filter select dropdowns are NEVER clipped by table cards or parent containers.
- **Option Item Styling**: Options MUST feature rounded corners (`rounded-xl px-3 py-2 text-xs font-bold`). Selected options MUST be highlighted with soft blue background (`bg-blue-50 text-blue-700 font-bold`) and a blue checkmark (`✓`) icon.

## 14. Sidebar Header & Logo Placement
- **Clean White Header Container**: The top header container of the Sidebar holding the brand logo (`/images/yousee.png`) MUST use a clean white background (`bg-white`) with height `h-16 border-b border-r border-slate-200/80 sticky top-0 z-20` to guarantee high logo contrast and seamless vertical alignment with the top Header Navbar.

## 15. Iconography & Icon Standards
- **Strict Flat / 2D Vector Icons**: Whenever icons are added to buttons, navigation elements, badges, filter chips, or cards, ONLY clean **Flat / 2D monochrome vector icons** (SVG line or fill icons, e.g. Heroicons style) MUST be used.
- **NO Emojis or 3D Icons**: Do NOT use emojis (e.g., ⚡, 📝, ⚠️, 💰, 📈) or 3D skeuomorphic icons in UI components, filter pills, or status labels to maintain a sleek, professional financial dashboard aesthetic.

