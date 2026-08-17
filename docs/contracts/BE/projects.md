# Project & Project Location Contract

**Type**: Provider-Driven Contract (Backend First)
**Domain**: `Project`
**Status**: `Project` CRUD, `ProjectLocation` create/update/delete, and vendor PO issuance (`IssueVendorPurchaseOrder`) are implemented and live. Invoicing, payment settlement, and COA-driven journals (scoped in `docs/contracts/FE/projects.md`) are **not built yet** — do not consume this doc as the final shape of that bigger plan, and do not treat that doc's exact field names as what's actually live (several diverged during implementation, noted below).

Schema lives in [`docs/databases/tables/projects.dbml`](../../databases/tables/projects.dbml), [`project_locations.dbml`](../../databases/tables/project_locations.dbml), and [`purchase_orders.dbml`](../../databases/tables/purchase_orders.dbml) / [`purchase_order_items.dbml`](../../databases/tables/purchase_order_items.dbml). This doc covers HTTP surface + payload shapes only, not column lists.

**Wiring is not done.** This is the contract to build FE wiring against — `Show.tsx`, `LocationsTab.tsx`, and the rest of the `Projects/` tab components are still 100% mock-driven (`initialProjectsPPN/NonPPN`, `mockVendors`). Nothing described here is consumed by the frontend yet.

---

## 1. IDs are UUID strings, not integers

Every `id`, `client_id`, `sales_id`, `vendor_id`, `project_id`, `purchase_order_id` is a **UUID string** (`"9c1f2e3a-..."`), never an integer. `docs/contracts/FE/projects.md` predates the UUID decision (`backend/best-practices.md` §5) — its numeric `id: 1` examples are stale for this reason only.

## 2. Fiscal mode is NOT session-based (yet)

`fiscal_mode` is sent explicitly in the `POST /projects` payload and stamped onto the row at create time. It is **not** read from a server session — `FE/projects.md` §0.3 describes a future session-based design that hasn't landed. Until it does, FE is responsible for sending the currently-active fiscal mode with every create request.

Once set, `fiscal_mode` is immutable — `PUT /projects/{project}` silently ignores it if sent, and the Model throws a `DomainException` on any attempted change.

---

## 3. `GET /projects` → `Pages/Projects`

Route: `projects` (name kept for `route('projects')`).

```json
{
  "projects": {
    "data": [
      {
        "id": "3e5f...",
        "code": "PRJ-2026-PPN01",
        "name": "Kampanye Iklan Film Toystory 5",
        "client_id": "a1b2...",
        "client": { "id": "a1b2...", "name": "PT. Walt Disney Pictures Indonesia" },
        "sales_id": "c3d4...",
        "sales": { "id": "c3d4...", "name": "Budi Santoso" },
        "fiscal_mode": "ppn",
        "start_date": "2026-04-01",
        "end_date": "2026-06-30",
        "contract_value": 280000000.0,
        "target_qty": 3,
        "status": "draft",
        "notes": null,
        "created_at": "2026-08-15T10:00:00+00:00",
        "updated_at": "2026-08-15T10:00:00+00:00"
      }
    ],
    "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
    "meta": { "current_page": 1, "per_page": 10, "total": 1, "last_page": 1, "from": 1, "to": 1, "path": "..." }
  },
  "clients": [{ "id": "a1b2...", "name": "PT. Walt Disney Pictures Indonesia" }],
  "sales": [{ "id": "c3d4...", "name": "Budi Santoso" }]
}
```

**Known gaps vs the FE mock (`Projects.tsx`, `projectTypes.ts`) — not yet in the Resource:**
- No `metrics` / `status_counts` block. FE's `totalActiveProjects`, `totalContractValue`, `totalEstimatedProfit` are computed client-side from mock data today; nothing server-side backs them yet.
- No `financials` block (`net_profit`, `margin`, `total_po`, …) — `CalculateProjectFinancials` action doesn't exist yet.
- No `location_count` / `po_issued_count` / `invoice_issued` / `invoice_number` fields — these need `Project::locations()`/`purchaseOrders()`/`invoices()` aggregates wired into the Resource, not done yet.
- `status` is lowercase (`draft`, `active`, `completed`, `cancelled` — the raw `ProjectStatus` enum value), **not** the capitalized `Draft`/`Active` the FE mock and `StatusBadge` currently expect. FE must map this.
- **Search / status filter / pagination are not query-param driven.** `index()` always returns `paginate(10)` ordered by `created_at desc`, full stop — no `search`, `status`, or `page` handling server-side yet. FE's current client-side filter/sort/paginate over the full mock array has no server equivalent to switch to today.
- `period` (formatted label) and `period_progress` are not sent — FE's `formatPeriod()`/`calcPeriodProgress()` still need `start_date`/`end_date` on the client.

## 4. `POST /projects` (create)

Route: `projects.store`

```json
{
  "name": "string (required, max:255)",
  "client_id": "uuid (required, exists:clients,id)",
  "sales_id": "uuid|null (exists:sales,id)",
  "fiscal_mode": "ppn|non-ppn (required)",
  "start_date": "YYYY-MM-DD (required)",
  "end_date": "YYYY-MM-DD (required, after_or_equal:start_date)",
  "contract_value": "numeric (required, min:0)",
  "is_ppn_inclusive": "boolean (optional, default false)",
  "target_qty": "integer (optional, min:1, default 1)",
  "notes": "string|null (optional)"
}
```

- `code` is server-generated (`PRJ-{YYYY}-{PPN|NON}{NN}`), never sent by FE.
- `status` always starts `draft`, never sent by FE.
- `contract_value` normalization — server recomputes, client-sent DPP is trusted only when `is_ppn_inclusive` is false:
  ```
  fiscal_mode = non-ppn                        -> stored = input
  fiscal_mode = ppn, is_ppn_inclusive = false   -> stored = input            (input already DPP)
  fiscal_mode = ppn, is_ppn_inclusive = true    -> stored = round(input / 1.11, 2)
  ```
  `projects.contract_value` always holds the pure DPP.

Response: redirect back, `success` flash. Validation errors: standard Inertia 422 → `errors` object, keyed by the field names above.

## 5. `PUT /projects/{project}` (update)

Route: `projects.update`

Same fields as create, all `sometimes`, **plus** `status` (`draft|active|completed|cancelled`) — **minus** `fiscal_mode`, which is rejected silently if present (immutable). Same `contract_value` DPP normalization as create, using the project's own `fiscal_mode`.

## 6. `DELETE /projects/{project}` (destroy)

Route: `projects.destroy`. Soft delete (`projects.deleted_at`). No payload.

---

## 7. `POST /projects/{project}/locations` (create)

Route: `projects.locations.store`

```json
{
  "vendor_id": "uuid (required, exists:vendors,id)",
  "area": "string (required, max:255)",
  "description": "string (required, max:255)",
  "type": "Billboard|Videotron|Baliho|Neonbox (required)",
  "size": "string (required, max:50)",
  "orientation": "V|H (nullable)",
  "lighting": "Berlampu|Tidak Berlampu (nullable)",
  "qty": "integer (nullable, min:1, default 1)",
  "vendor_cost": "numeric (required, min:0)",
  "is_ppn_inclusive": "boolean (optional, default false)",
  "top_notes": "string|null (optional, max:255)"
}
```

- `code` is server-generated (`LOC-001`, `LOC-002`, ... sequential **within the project**), never sent by FE.
- `vendor_cost` normalizes to pure DPP exactly like `contract_value` above, using the **parent project's** `fiscal_mode`:
  ```
  project.fiscal_mode = non-ppn                       -> stored = input
  project.fiscal_mode = ppn, is_ppn_inclusive = false  -> stored = input
  project.fiscal_mode = ppn, is_ppn_inclusive = true   -> stored = round(input / 1.11, 2)
  ```

Response: redirect back, `success` flash.

## 8. `PUT /projects/{project}/locations/{location}` (update)

Route: `projects.locations.update`

```json
{
  "vendor_id": "uuid (sometimes, exists:vendors,id)",
  "area": "string (sometimes)",
  "description": "string (sometimes)",
  "type": "Billboard|Videotron|Baliho|Neonbox (sometimes)",
  "size": "string (sometimes)",
  "orientation": "V|H (nullable)",
  "lighting": "Berlampu|Tidak Berlampu (nullable)",
  "qty": "integer (sometimes, min:1)",
  "vendor_cost": "numeric (sometimes, min:0)",
  "is_ppn_inclusive": "boolean (optional)",
  "top_notes": "string|null (optional)"
}
```

**Lock invariant, refined**: once a location has a `purchase_order_id`, `ProjectLocation::boot()` rejects changes to every field **except `lighting` and `top_notes`** — those two stay editable after PO issuance (this is the "Edit Parameter PO" flow in `VendorPOTab.tsx`). Everything else (`vendor_id`, `area`, `description`, `type`, `size`, `orientation`, `qty`, `vendor_cost`) throws a `DomainException` (500) if touched post-issuance. `location` must belong to `project` in the URL or it's a `404`.

## 9. `DELETE /projects/{project}/locations/{location}` (destroy)

Route: `projects.locations.destroy`. Hard delete (no soft-delete column on `project_locations`). Same PO-issued lock as §8 — throws if `purchase_order_id` is set. `location` must belong to `project` in the URL or it's a `404`.

---

## 10. `POST /projects/{project}/purchase-orders` (issue vendor PO)

Route: `projects.purchase-orders.store`. Powers both "Terbitkan PO" (1 location) and "Terbitkan PO Vendor" (bulk, N locations under the same vendor) buttons in `VendorPOTab.tsx` — bulk is just `location_ids` with more than one entry, same endpoint.

```json
{
  "vendor_id": "uuid (required, exists:vendors,id)",
  "location_ids": "uuid[] (required, min:1, each must exist in project_locations)",
  "transaction_date": "YYYY-MM-DD (required)"
}
```

Server-side checks (all throw `DomainException` → 500, not a validation 422 — these are business invariants, not input format):
- every `location_ids[]` must belong to the `project` in the URL
- every `location_ids[]` must belong to `vendor_id`
- none of them may already have a `purchase_order_id`

What happens on success, inside one `DB::transaction()`:
- `po_number` generated server-side: `{seq}/PTSSI-PO/{MM}/{YY}` when `project.fiscal_mode = ppn`, `{seq}/YS-PO/{MM}/{YY}` when `non-ppn`. `{seq}` is a **global** sequence (not per-vendor), 3-digit zero-padded, counted from `purchase_orders` created in the current calendar month, `lockForUpdate()` for race-safety.
- one `PurchaseOrder` row created, `status = issued`, `issued_at = now()`, `fiscal_mode` copied from the project.
- one `PurchaseOrderItem` per location (`name` = location's `description`, `quantity` = location's `qty`, `price` = location's `vendor_cost`) — creating these triggers `PurchaseOrder::recalculateTotal()` automatically (`subtotal`/`ppn`/`total` are never set manually).
- each location's `purchase_order_id` is backfilled to the new PO — this is what flips `po_issued: true` / `po_number` on `ProjectLocationResource` (§13) from here on.

Response: redirect back, `success` flash.

**Not included in this endpoint** (still needs the domains below, not built): journal posting (Flow B.1 needs `chart_of_accounts` first), vendor Terms-of-Payment (needs a PO-side controller wired to `GeneratePaymentTerms` — the Action itself exists now, §11, but nothing calls it with a `PurchaseOrder` payable yet), vendor payment settlement (needs `payment_settlements` + COA).

---

## 11. `POST /projects/{project}/payment-plan` (set/change client payment scheme)

Route: `projects.payment-plan.store`. Powers "Atur Skema Pembayaran" and "Ubah Skema" in `InvoiceTab.tsx`. Same endpoint for both — it's idempotent on the Invoice side and always regenerates the term list from scratch.

```json
{
  "scheme": "full|dp|termin|installment (required)",
  "percents": "numeric[] (required, min 1 item, each 0..100, MUST sum to exactly 100)",
  "due_dates": "YYYY-MM-DD[] (required, same length as percents)",
  "notes": "string|null (optional)"
}
```

`percents`/`due_dates` length mismatch or a sum ≠ 100 both come back as a normal 422 (`errors.percents` / `errors.due_dates`) — this is checked in the FormRequest itself (not just the Action), so FE gets proper field errors instead of a 500.

What happens on success, inside one `DB::transaction()`:
- if the project has no `Invoice` row yet, one is created (`status = draft`, `transaction_date = now()`) — **one Invoice per project**, matching `FE/projects.md`'s open question #2 answered as "assumed 1:1" for now.
- if that Invoice has no items yet, exactly **one** `InvoiceItem` is created: `name = project.name`, `quantity = 1`, `price = project.contract_value`. This is a deliberate simplification vs. the PO side — client billing is a single line for the whole contract, not one item per billboard point. `Invoice.subtotal`/`total` end up equal to `project.contract_value` (+ PPN), which is what `calcFinancials()` already assumes.
- any existing `PaymentPlan` for this Invoice is found (`updateOrCreate` keyed on `payable_type`+`payable_id`) and its `terms` are **deleted and regenerated** from the new `percents`/`due_dates` — "Ubah Skema" is a full replace, not a merge.
- each `PaymentTerm.amount` is `round(total * percent / 100, 2)`, except the **last** term, which takes `total - sum(previous amounts)` so the terms always add up to the invoice total exactly (no missing/extra cent from rounding).
- term `label` is auto-generated per scheme, matching the FE's own label patterns (`ProjectPayment.tsx`/the invoice modal): `full` → "Lunas Sekaligus"; `dp` → "Termin 1 – Uang Muka (DP)" / "Termin 2 – Pelunasan"; `termin` → "Termin 1 – Uang Muka" / "Termin N – Progres" / "Termin (last) – Pelunasan"; `installment` → "Cicilan N dari (count)".

Response: redirect back, `success` flash.

**Reusable, not just for Invoice**: `GeneratePaymentTerms` (`app/Domains/Billing/Actions/`) takes any `$payable` model with a `total` attribute — it's meant to back vendor PO Terms-of-Payment too later (`payment_plans.payable_type = PurchaseOrder`), same Action, no duplication. No controller calls it with a PO yet (§10).

## 12. `POST /projects/{project}/invoice/issue` (issue the client invoice)

Route: `projects.invoice.issue`. Powers "Terbitkan Invoice Resmi" in `InvoiceTab.tsx`. No payload.

Guards (all `DomainException` → 500, business invariants not input format):
- an `Invoice` must already exist for the project (created by §11) — else "Invoice belum disiapkan."
- it must still be `status = draft` — else "Invoice sudah diterbitkan." (no re-issuing)
- it must already have a `PaymentPlan` attached — else "Skema pembayaran belum diatur." (can't issue before §11 runs at least once)

What happens on success:
- `invoice_number` generated server-side: `INV-{MM}/{YY}/{seq}` when `fiscal_mode = ppn`, `INV-NP-{MM}/{YY}/{seq}` when `non-ppn` — matches the format the FE mock already invents client-side in `Show.tsx`/`InvoiceTab.tsx`, just moved server-side and race-safe (`lockForUpdate()`, global monthly sequence, same pattern as PO numbering §10).
- `Invoice.status` → `issued`.
- **`Project.status` auto-transitions `draft` → `active`** if it was still `draft` — this is the `domain-dictionary.md` §2 invariant ("Project auto-transitions Draft → Active when its invoice is issued"), enforced here since this is the one write path that issues an invoice.

Response: redirect back, `success` flash.

**Not included**: journal posting (Flow A.1 needs `chart_of_accounts`), Kwitansi generation (needs the `kwitansis` table, not migrated, and only fires once every term is *settled* — which needs `payment_settlements`, also not built).

---

## 13. Resource shape reference

`ProjectLocationResource` (used wherever locations are eager-loaded and returned — currently nowhere in a GET response yet, since `projects.show` is still a closure rendering mock data):

```json
{
  "id": "loc-uuid",
  "project_id": "project-uuid",
  "vendor_id": "vendor-uuid",
  "vendor": { "id": "vendor-uuid", "name": "PT. Megah Billboard Jaya" },
  "code": "LOC-001",
  "area": "Semarang",
  "description": "Billboard Jl. Pandanaran KM 3",
  "type": "Billboard",
  "size": "4x8m",
  "orientation": "V",
  "lighting": null,
  "qty": 1,
  "vendor_cost": 8500000.0,
  "top_notes": null,
  "po_issued": false,
  "po_number": null,
  "created_at": "2026-08-17T09:00:00+00:00"
}
```

`po_issued` / `po_number` are **derived** at read time (`purchase_order_id !== null` / `purchaseOrder->po_number`), never stored columns — don't expect them in create/update payloads.

The FE `BillboardLocation` type (`projectTypes.ts`) uses flat `vendorId`/`vendorName` fields; this Resource sends a nested `vendor: { id, name }` object instead. Pick one side to adapt — recommended: adapt the FE type, since the nested shape is what the rest of the app's Resources already do (`client`, `sales` on `ProjectResource` follow the same pattern).

`PurchaseOrderResource` (new — returned by §10, not yet returned by any GET endpoint since `projects.show` doesn't exist):

```json
{
  "id": "po-uuid",
  "po_number": "001/PTSSI-PO/08/26",
  "vendor_id": "vendor-uuid",
  "vendor": { "id": "vendor-uuid", "name": "PT. Megah Billboard Jaya" },
  "project_id": "project-uuid",
  "fiscal_mode": "ppn",
  "transaction_date": "2026-08-17",
  "issued_at": "2026-08-17",
  "subtotal": 8000000.0,
  "ppn": 880000.0,
  "total": 8880000.0,
  "status": "issued",
  "notes": null,
  "items": [
    { "id": "item-uuid", "project_location_id": "loc-uuid", "name": "Titik 1", "quantity": 1, "price": 5000000.0 }
  ],
  "created_at": "2026-08-17T10:00:00+00:00"
}
```

`Invoice` (no Resource class built yet — no GET endpoint returns it, `Invoice::class` itself is the shape below):

```json
{
  "id": "invoice-uuid",
  "invoice_number": null,
  "client_id": "client-uuid",
  "sales_id": "sales-uuid",
  "project_id": "project-uuid",
  "fiscal_mode": "ppn",
  "transaction_date": "2026-08-17",
  "due_date": "2026-08-24",
  "subtotal": 100000000.0,
  "ppn": 11000000.0,
  "total": 111000000.0,
  "status": "draft",
  "notes": null
}
```
`invoice_number` is `null` while `status = draft`, assigned by §12 on issuance. `subtotal` always equals `project.contract_value` — see §11 for why there's exactly one `InvoiceItem`, not one per billboard point.

`PaymentPlan` + `PaymentTerm` (also no Resource class yet):

```json
{
  "id": "plan-uuid",
  "payable_type": "App\\Domains\\Billing\\Models\\Invoice",
  "payable_id": "invoice-uuid",
  "scheme": "termin",
  "total_amount": 111000000.0,
  "notes": null,
  "terms": [
    { "id": "term-uuid-1", "sort_order": 1, "label": "Termin 1 – Uang Muka", "amount": 33300000.0, "percent": 30.0, "due_date": "2026-08-24", "status": "unpaid" },
    { "id": "term-uuid-2", "sort_order": 2, "label": "Termin 2 – Progres", "amount": 44400000.0, "percent": 40.0, "due_date": "2026-09-16", "status": "unpaid" },
    { "id": "term-uuid-3", "sort_order": 3, "label": "Termin 3 – Pelunasan", "amount": 33300000.0, "percent": 30.0, "due_date": "2026-10-16", "status": "unpaid" }
  ]
}
```
No `paid_amount`, `is_overdue`, or settlement history on a term — those are derived from `payment_settlements` (§14), which doesn't exist yet. `PaymentTerm::isOverdue()` exists as a Model method (`status !== paid && due_date->isPast()`) for whenever a Resource wraps this, but nothing calls it yet.

---

## 14. Not wired yet — known follow-ups for whoever picks up FE wiring

- `GET /projects/{project}` (`projects.show`) is still a bare closure rendering `Pages/Projects/Show` with only `projectId` (cast to `int`, which won't round-trip a UUID) — no Controller, no real props. Everything in `LocationsTab.tsx`, `VendorPOTab.tsx`, `InvoiceTab.tsx`, `InfoTab.tsx` is still mock-driven from `initialProjectsPPN/NonPPN`. This also means none of §11–§13's shapes are reachable via a GET yet — only the write endpoints exist.
- `Show.tsx`'s `onAddLocation` / `onDeleteLocation` callbacks (passed into `LocationsTab`) only call local `setLocations(...)` — no `router.post`/`router.delete`/`router.put` to the endpoints in §7–10 exist yet. Same story for `VendorPOTab.tsx`'s `onIssuePO` (still local state), the "Edit Parameter PO" flow (needs §8), and `InvoiceTab.tsx`'s "Atur Skema"/"Terbitkan Invoice" buttons (need §11/§12).
- `LocationsTab.tsx`'s vendor `<select>` is populated from `mockVendors` (`projectTypes.ts`), not a real `vendors` prop — no controller currently sends one.
- Journal posting (Flow A.1/B.1) needs `chart_of_accounts` + `accounting_settings` + `journal_entries` — none migrated. Neither §10 (PO issuance) nor §12 (invoice issuance) post a journal right now.
- Payment settlement — client (`InvoiceTab.tsx`'s "Terima Pembayaran") and vendor (`VendorPOTab.tsx`'s "Bayar Vendor") both need `payment_settlements`, which needs `payment_account_id` → a leaf `chart_of_accounts` row. Not built. This is also why `PaymentTerm.status` can only ever be set by §11 as `unpaid` right now — nothing transitions it to `partial`/`paid`.
- Vendor Terms-of-Payment (`vendorTermScheme`/`vendorTermPercents`/`vendorTermDates` in `VendorPOTab.tsx`) — `GeneratePaymentTerms` (§11) already supports a `PurchaseOrder` payable structurally, but no PO-side controller calls it yet.
- Kwitansi — needs the `kwitansis` table (not migrated) and only makes sense once payment settlement (above) exists, since it fires when every term is fully settled.
- `/po-pdf` and `/client-invoice-pdf` (PDF downloads) already exist and work independently of all this — both are driven entirely by data posted from the browser form, not a DB read, so neither is blocked by anything above.

## 15. Wiring guide — `Show.tsx` + `LocationsTab.tsx`

This is the concrete, in-order path to get these two files off mock data. Steps 1–2 are FE. Step 0 is a **BE blocker** — nothing past it can be tested end-to-end until it exists.

### Step 0 (BE, not built yet) — `ProjectController::show()`

Route currently in `routes/web.php`:
```php
Route::get('/projects/{projectId}', function ($projectId) {
    return Inertia::render('Projects/Show', ['projectId' => (int) $projectId]);
})->name('projects.show');
```
Needs to become a real controller action returning:
```php
public function show(Project $project): Response
{
    $project->load(['client', 'sales', 'locations.vendor', 'locations.purchaseOrder']);
    $vendors = Vendor::active()->orderBy('name')->get(['id', 'name']);

    return Inertia::render('Projects/Show', [
        'project' => (new ProjectResource($project))->additional([
            'locations' => ProjectLocationResource::collection($project->locations),
        ]),
        // or fold `locations` into ProjectResource::toArray() via whenLoaded('locations') —
        // either works, pick whichever matches how ProjectResource already handles `client`/`sales`.
        'vendors' => VendorOptionResource::collection($vendors)->resolve(),
    ]);
}
```
Until this exists, FE cannot get real data into this page — everything below assumes it's live and returns `project` (with a nested `locations: ProjectLocationResource[]`) and `vendors: {id, name}[]`.

### Step 1 — `Show.tsx`

**1a. Drop the mock resolution, read Inertia props instead.**

Replace:
```tsx
export default function Show({ projectId }: { projectId?: number }) {
    const urlId = projectId ?? parseInt(window.location.pathname.split('/').filter(Boolean)[1] ?? '1');
    const allProjects = [...initialProjectsPPN, ...initialProjectsNonPPN];
    const initialProject = allProjects.find((p) => p.id === urlId) ?? allProjects[0];

    const [fiscalMode] = useState<FiscalMode>(initialProject.id >= 100 ? 'non-ppn' : 'ppn');
    const [displayedProject, setDisplayedProject] = useState<Project>(initialProject);
    const [locations, setLocations] = useState<BillboardLocation[]>(initialProject.locations || []);
```
with:
```tsx
interface ShowPageProps {
    project: Project;          // real prop from ProjectController::show()
    vendors: VendorOption[];   // new — replaces mockVendors
    fiscal_mode: FiscalMode;   // still comes from AppLayout's useFiscalMode() until §0.3 (FE/projects.md) lands
}

export default function Show({ project, vendors }: ShowPageProps) {
    const fiscalMode = useFiscalMode(); // same hook Projects.tsx already uses
    const isPPN = fiscalMode === 'ppn';

    // No more local `displayedProject` / `locations` state mirroring props.
    // After router.post/delete below, Inertia re-fetches this page's props automatically —
    // reading straight from `project` keeps the tab always in sync, no manual sync bugs.
    const prj = project;
    const locations = project.locations;
```
Drop the `initialProjectsPPN/NonPPN` import and the `onUpdateProject`/`setDisplayedProject` plumbing wherever it exists purely to mirror `locations` — keep it only where it's used for the payment-plan/invoice mock state (out of scope here, still needed until §7 in `FE/projects.md` lands).

**1b. Pass `vendors` down and swap the location callbacks for real requests.**

Replace:
```tsx
{activeTab === 'locations' && (
    <LocationsTab
        locations={locations}
        isPPN={isPPN}
        onAddLocation={(newLoc) => {
            const updated = [...locations, newLoc];
            setLocations(updated);
            onUpdateProject({ ...prj, locations: updated });
        }}
        onDeleteLocation={(locId) => {
            const updated = locations.filter((l) => l.id !== locId);
            setLocations(updated);
            onUpdateProject({ ...prj, locations: updated });
        }}
    />
)}
```
with:
```tsx
{activeTab === 'locations' && (
    <LocationsTab
        locations={locations}
        vendors={vendors}
        isPPN={isPPN}
        onAddLocation={(payload, { onSuccess, onError }) => {
            router.post(route('projects.locations.store', prj.id), payload, {
                preserveScroll: true,
                onSuccess,
                onError,
            });
        }}
        onDeleteLocation={(locationId) => {
            router.delete(route('projects.locations.destroy', [prj.id, locationId]), {
                preserveScroll: true,
            });
        }}
    />
)}
```
No optimistic client-side array splicing — `router.post`/`router.delete` trigger a full Inertia prop refresh on success, `project.locations` updates on its own. `onSuccess`/`onError` are threaded through so `LocationsTab` can close its modal / show validation errors (step 2c).

### Step 2 — `LocationsTab.tsx`

**2a. Vendor dropdown: `mockVendors` → real `vendors` prop.**
```tsx
// before
import { BillboardLocation, fmt, mockVendors } from '../projectTypes';
// ...
{mockVendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}

// after
export default function LocationsTab({ locations, vendors, isPPN, onAddLocation, onDeleteLocation }: {
    locations: BillboardLocation[];
    vendors: VendorOption[];   // { id: string; name: string }
    isPPN: boolean;
    onAddLocation: (payload: CreateProjectLocationPayload, opts: { onSuccess: () => void; onError: (errors: Record<string,string>) => void }) => void;
    onDeleteLocation: (locationId: string) => void;
}) {
// ...
{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
```
`selectedVendorId` state stays a string — it already was.

**2b. Stop building a fake `BillboardLocation` client-side. Send the raw payload; the server generates `code`/`id` and normalizes `vendor_cost` to DPP (§7) — don't pre-convert it client-side, that duplicates logic that already lives in `CreateProjectLocation::resolveDpp()` and the two WILL drift eventually.**

Replace `handleSubmit`'s tail:
```tsx
// before
const vendor = mockVendors.find((v) => v.id === parseInt(selectedVendorId))!;
const newLoc: BillboardLocation = {
    id: Date.now(),
    code: `LOC-${String(Date.now()).slice(-4)}`,
    area: form.area.trim(),
    description: form.description.trim(),
    type: form.type,
    orientation: form.orientation,
    size: form.size.trim(),
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorCost: computedVendorCost.dpp,  // pre-converted client-side
    poIssued: false,
    poNumber: '',
};
onAddLocation(newLoc);
setIsModalOpen(false);
```
with:
```tsx
// after
onAddLocation(
    {
        vendor_id: selectedVendorId,
        area: form.area.trim(),
        description: form.description.trim(),
        type: form.type,
        size: form.size.trim(),
        orientation: form.orientation,
        vendor_cost: parsedVendorRaw,              // raw input, NOT computedVendorCost.dpp
        is_ppn_inclusive: isPPN && form.taxMode === 'inc',
    },
    {
        onSuccess: () => {
            setIsModalOpen(false);
            setForm({ area: '', description: '', type: 'Billboard', orientation: 'V', size: '', vendorCost: '', taxMode: 'dpp' });
            setSelectedVendorId('');
            setErrors({});
        },
        onError: (serverErrors) => {
            // keys come back snake_case (vendor_id, vendor_cost, ...) — map to the
            // camelCase keys this component's `errors` state already uses, same
            // pattern as Projects.tsx's SERVER_ERROR_FIELD_MAP.
            const FIELD_MAP: Record<string, string> = {
                vendor_id: 'vendorId', area: 'area', description: 'description',
                type: 'type', size: 'size', orientation: 'orientation',
                vendor_cost: 'vendorCost', top_notes: 'topNotes',
            };
            const mapped: Record<string, string> = {};
            Object.entries(serverErrors).forEach(([key, msg]) => {
                mapped[FIELD_MAP[key] ?? key] = msg as string;
            });
            setErrors(mapped);
        },
    },
);
```
The client-side `errs` validation block above this (the manual `if (!selectedVendorId) errs.vendorId = ...` checks) can stay as a fast pre-check — it just doesn't need to `return` before ever reaching the server anymore for cases the server also validates; keep it as UX polish, not the source of truth.

**2c. Vendor grouping + display: flat `vendorId`/`vendorName` → nested `vendor`.**

The Resource sends `vendor: { id, name }`, not flat `vendorId`/`vendorName` (§13). Two ways to handle it — pick one, don't mix:
- **Recommended, smaller diff**: keep `BillboardLocation` flat and map at the boundary, in `Show.tsx`, right where `locations` is read from `project.locations` — flatten `vendor.id → vendorId`, `vendor.name → vendorName` before it ever reaches `LocationsTab`. Nothing inside `LocationsTab.tsx` changes.
- **More correct long-term**: update `BillboardLocation` in `projectTypes.ts` to carry `vendor: { id: string; name: string }` instead of `vendorId`/`vendorName`, and update every `loc.vendorId`/`loc.vendorName` read across `LocationsTab.tsx` (`groupedLocations`, the vendor-group header) and `VendorPOTab.tsx` to `loc.vendor.id`/`loc.vendor.name`. Larger diff, but matches the shape every other Resource in this app already uses (`client`, `sales` on `ProjectResource`) — no translation layer to keep in sync as the type grows.

**2d. `po_issued` / `po_number` (used for the delete-button guard and the "PO Terbit" badge) now come straight off the Resource — no change needed there, the field names already match (`loc.poIssued`, `loc.poNumber` just need to read `loc.po_issued`/`loc.po_number` if you keep snake_case from the Resource as-is, or alias them in the same boundary-mapping step as 2c).

---

## 16. Wiring guide — `VendorPOTab.tsx`

Covers §8 (location update) and §10 (PO issuance). Depends on §15's Step 0 (`project.locations` needs to be real props) — do that first.

### 16a. Issue PO — single AND bulk collapse into one call

Today, `handleConfirmPO` (1 location) and `handleConfirmVendorBulkPO` (N locations) both build a fake `poNumber` client-side and call `onIssuePO` — the bulk path even **loops**, calling `onIssuePO` once per location:
```tsx
// before — bulk path loops the single-issue callback
confirmingVendorGroup.unissuedItems.forEach((loc) => {
    onIssuePO(loc.id, collectivePoNumber, poLighting, poTopNotes, vendorTermScheme, vendorTermPercents, vendorTermDates);
});
```
§10 already accepts an array of `location_ids` in **one** request — the loop goes away entirely, single and bulk both become the same call with a different-length array:
```tsx
// Show.tsx — replace the onIssuePO prop
onIssuePO={(vendorId, locationIds, transactionDate) => {
    router.post(route('projects.purchase-orders.store', prj.id), {
        vendor_id: vendorId,
        location_ids: locationIds,
        transaction_date: transactionDate,
    }, {
        preserveScroll: true,
        onSuccess: () => {
            // po_number now lives on the refreshed project.locations — find it
            // off any of the just-issued locations rather than trying to
            // invent/track it client-side.
            const issuedLoc = project.locations.find((l) => locationIds.includes(l.id));
            if (issuedLoc?.po_number) {
                handleDownloadPO(issuedLoc.vendor?.name ?? 'Vendor', issuedLoc.po_number,
                    project.locations.filter((l) => locationIds.includes(l.id)));
            }
        },
    });
}}
```
```tsx
// VendorPOTab.tsx — both confirm handlers collapse to this
const handleConfirmPO = () => {
    if (!confirmingLoc) return;
    onIssuePO(confirmingLoc.vendorId, [confirmingLoc.id], new Date().toISOString().split('T')[0]);
    setConfirmingLoc(null);
};

const handleConfirmVendorBulkPO = () => {
    if (!confirmingVendorGroup || confirmingVendorGroup.unissuedItems.length === 0) return;
    onIssuePO(
        confirmingVendorGroup.vendorId,
        confirmingVendorGroup.unissuedItems.map((l) => l.id),
        new Date().toISOString().split('T')[0],
    );
    setConfirmingVendorGroup(null);
};
```
`poLighting`/`poTopNotes`/`vendorTermScheme`/`vendorTermPercents`/`vendorTermDates` are **not sent** — §10 doesn't accept them (PO issuance has no lighting/top_notes/TOP fields; those live on the location, set separately via §16b, and vendor TOP isn't backed by anything yet, §14). Keep the modal inputs for `poLighting`/`poTopNotes` if you want to immediately follow up issuance with a §16b call using the values the user just picked, but don't thread them through `onIssuePO` itself.

### 16b. Edit Parameter PO → `PUT` §8

```tsx
// Show.tsx — new prop, or extend the locations tab's prop set
onUpdateLocationPoParams={(locationId, lighting, topNotes) => {
    router.put(route('projects.locations.update', [prj.id, locationId]), {
        lighting,
        top_notes: topNotes,
    }, { preserveScroll: true });
}}
```
```tsx
// VendorPOTab.tsx
const handleSaveEditPO = () => {
    if (!editingLoc) return;
    onUpdateLocationPoParams(editingLoc.id, poLighting, poTopNotes);
    setEditingLoc(null);
};
```
This is the one write path that's still valid **after** a location has a PO — §8's lock exception exists specifically for this. Anything else attempted through this same call (vendor, area, cost, …) would 500 with a `DomainException`, so don't widen the payload beyond `lighting`/`top_notes`.

### 16c. `/po-pdf` — no change needed

`handleDownloadPO` posts to `/po-pdf` with data read straight from the `locations`/`vendorName` args you already pass it — that controller doesn't touch the database, so it keeps working once `locations` is real instead of mock. Just make sure the `po_number` you pass in is the server-generated one from §10's response (16a), not a client-invented one.

### 16d. Still stubbed — don't wire these yet

- **Vendor TOP** (`vendorTermScheme`/`vendorTermPercents`/`vendorTermDates`, the collapsible "Rincian TOP" stepper) — `GeneratePaymentTerms` (§11) works structurally for a `PurchaseOrder` payable, but no PO-side controller/route calls it yet. Leave this UI reading/writing local state only until that controller exists.
- **Vendor payment settlement** (`selectedVendorForPay`, `VendorPaymentRecord`, "Bayar Vendor" modal) — needs `payment_settlements` + a `payment_account_id` (leaf `chart_of_accounts` row), neither built. Wiring this now would silently no-op or need a fake endpoint — don't.

---

## 17. Wiring guide — `InvoiceTab.tsx`

Covers §11 (payment plan) and §12 (issue invoice). Depends on §15's Step 0 — and Step 0 needs **one addition** for this tab specifically: eager-load the invoice too.

### 17a. Step 0 addendum — `ProjectController::show()` needs `invoice.paymentPlan.terms`

§15's Step 0 sketch only loads `client`, `sales`, `locations.vendor`, `locations.purchaseOrder`. Add the invoice chain:
```php
$project->load([
    'client', 'sales', 'locations.vendor', 'locations.purchaseOrder',
    'invoice.paymentPlan.terms', // <-- add this
]);
```
Without it, `project.invoice` is `undefined` and nothing in this section has data to read.

### 17b. Data shape: flat mock fields → nested `project.invoice`

The FE `Project` type (`projectTypes.ts`) has `invoiceIssued: boolean`, `invoiceNumber: string`, `clientPaymentPlan?: ClientPaymentPlan` sitting flat on the project. The real data is a separate nested object (§13's `Invoice` shape, with `payment_plan` nested inside once `paymentPlan.terms` is loaded per 17a):
```ts
project.invoice?.status !== 'draft'       // was: project.invoiceIssued
project.invoice?.invoice_number           // was: project.invoiceNumber
project.invoice?.payment_plan             // was: project.clientPaymentPlan
```
Same choice as §15's 2c: map these at the boundary in `Show.tsx` right after reading Inertia props (smaller diff, nothing inside `InvoiceTab.tsx` changes), or update `projectTypes.ts`'s `Project` type to carry `invoice?: Invoice` and touch every read site in `InvoiceTab.tsx`. Pick one, don't mix — and if you map at the boundary, `ClientPaymentPlan`/`PaymentTerm` need the same treatment: backend sends `total_amount`/`due_date` (snake_case, §13), FE reads `totalAmount`/`dueDate` (camelCase) — and backend does **not** send `paidAmount`/`paidAt`/`paymentMethod`/`paymentRef` on a term at all (§14 — those need `payment_settlements`, not built). Map what exists, leave those four `undefined` rather than inventing placeholder values.

### 17c. "Atur Skema Pembayaran" / "Ubah Skema" → `POST` §11

The save handler lives in `Show.tsx`'s invoice modal (the "Simpan Skema Pembayaran" button), not in `InvoiceTab.tsx` itself. Today it builds a fake `ClientPaymentPlan` object client-side and calls `onUpdateProject`:
```tsx
// before
const newPlan: ClientPaymentPlan = { scheme: modalScheme, totalAmount: fin.totalInvoice, terms: generatedTerms, createdAt: now.toISOString() };
const updated = { ...prj, invoiceIssued: true, invoiceNumber: invNo, clientPaymentPlan: newPlan };
setDisplayedProject(updated);
onUpdateProject(updated);
setShowInvoiceModal(false);
```
Replace with a direct post — the server computes labels/amounts/rounding itself (§11), so none of `generatedTerms`, `invNo`, or `newPlan` need building client-side anymore:
```tsx
// after
router.post(route('projects.payment-plan.store', prj.id), {
    scheme: modalScheme,
    percents: modalTerminPercents,
    due_dates: modalTerminPercents.map((_, idx) => modalDueDates[idx] ?? /* same default-date calc already used in the render loop */),
    notes: undefined,
}, {
    preserveScroll: true,
    onSuccess: () => setShowInvoiceModal(false),
    onError: (serverErrors) => setModalPercentError(serverErrors.percents ?? serverErrors.due_dates ?? null),
});
```
The `sumPct !== 100` client-side pre-check (`modalPercentError`) can stay as instant UX feedback, but §11 validates the same rule server-side regardless (`errors.percents`) — don't rely on the client check alone.

### 17d. "Terbitkan Invoice Resmi" → `POST` §12

Today (`InvoiceTab.tsx`, Case 2 button), invents an invoice number and flips a local flag:
```tsx
// before
const invNo = isPPN ? `INV-${monthStr}/${yearStr}/${seqStr}` : `INV-NP-${monthStr}/${yearStr}/${seqStr}`;
const updatedPrj = { ...project, invoiceIssued: true, invoiceNumber: invNo };
setDisplayedProject(updatedPrj);
onUpdateProject(updatedPrj);
```
Replace with:
```tsx
// after — new prop, e.g. onIssueInvoice, passed down from Show.tsx
onIssueInvoice={() => {
    router.post(route('projects.invoice.issue', project.id), {}, { preserveScroll: true });
}}
```
§12 already rejects this if there's no payment plan yet or the invoice is already issued (`DomainException`) — the FE's existing conditional rendering (only showing this button in Case 2) already keeps users from hitting that in normal use, but don't assume the guard is redundant — a stale page (two tabs open) can still race it.

### 17e. "Cetak PDF" — currently a dead stub, needs a real prop threaded down

`InvoiceTab.tsx` defines its own `triggerInvoicePdf`, and it does nothing real:
```tsx
const triggerInvoicePdf = (...args: any[]) => alert("PDF Download");
```
`Show.tsx` already has a **working** `triggerInvoicePdf` that posts to `/client-invoice-pdf` (same pattern as `/po-pdf`, no DB dependency) — it's just never passed down as a prop. Thread it through instead of the local stub:
```tsx
// Show.tsx — add to <InvoiceTab ... />
onPrintInvoice={triggerInvoicePdf}
```
```tsx
// InvoiceTab.tsx — accept it instead of defining a fake one
export default function InvoiceTab({ project, isPPN, onOpenInvoiceModal, onOpenPaymentModal, onPrintInvoice }: {
    // ...
    onPrintInvoice: (term?: PaymentTerm) => void;
}) {
    // delete: const triggerInvoicePdf = (...args: any[]) => alert("PDF Download");
    // use onPrintInvoice(term) at the "Cetak PDF" button instead
```

### 17f. Still stubbed — don't wire these yet

- **"Terima Pembayaran"** (`onOpenPaymentModal`, the payment-receipt modal in `Show.tsx`) — needs `payment_settlements` + a leaf `chart_of_accounts` row for `payment_account_id`, neither built (§14). Leave the modal's "Simpan Pembayaran" handler on local state only, same as §16d's vendor equivalent — don't invent an endpoint for it.
- **Due-date reminder banner** (`dueAlerts`) — already hardcoded to an empty array in the current code (`const dueAlerts: any[] = [];`), not a regression to fix here. Would read `payment_term.is_overdue` once §14's blockers clear; nothing to wire today.
