# Project Feature — Backend Schema & Flow Contract

**Type**: Consumer-Driven Contract (Frontend First)
**Domain**: `Project` (new), touching `Procurement`, `Billing`, `Accounting`, `Vendor`, `Client`, `Sales`
**FE Source of Truth**:
- `resources/js/Pages/Projects.tsx` (index: grid / kanban / table + create modal)
- `resources/js/Pages/Projects/Show.tsx` (detail shell + 4 tabs)
- `resources/js/Pages/Projects/Tabs/{InfoTab,LocationsTab,VendorPOTab,InvoiceTab}.tsx`
- `resources/js/Pages/Projects/ProjectPayment.tsx` (client payment plan + settlement)
- `resources/js/Pages/Projects/projectTypes.ts` (shape contract)

---

## 0. Pre-Work: Blocking Defects & Decisions

These MUST be resolved before/while implementing this feature.

### 0.0 The finance schema was dropped — models are orphaned
`create_finance_domain_tables`, `add_payment_accounts_to_billing_and_po_tables` and `create_cash_expenses_table` have been deleted. Only `users`, `vendors`, `clients`, `sales` and the Spatie permission tables survive.

Every model under `app/Domains/{Procurement,Billing,Accounting,Master}/Models/` now points at tables that do not exist, and each carries the defects listed below. They are rewritten as part of this feature, not patched.

The authoritative schema is **[`docs/databases/`](../../databases/)** — one DBML file per table, `./build.sh` renders `schema.dbml`. This contract describes behaviour and the HTTP surface; it does not restate column lists.

### 0.1 Broken namespaces (to fix while rewriting)
`Vendor`, `Client`, `Sales` models live in their own domains, but consumers still import the old `Master` namespace:

| File | Bad import | Correct |
|---|---|---|
| `app/Domains/Procurement/Models/PurchaseOrder.php:8` | `App\Domains\Master\Models\Vendor` | `App\Domains\Vendor\Models\Vendor` |
| `app/Domains/Billing/Models/Invoice.php:7` | `App\Domains\Master\Models\Client` | `App\Domains\Client\Models\Client` |
| `app/Domains/Billing/Models/Invoice.php:9` | `App\Domains\Master\Models\Sales` | `App\Domains\Sales\Models\Sales` |

`$po->vendor` and `$invoice->client` throw `Class not found`.

### 0.2 Project domain relocation
`app/Domains/Master/Models/Project.php` → `app/Domains/Project/Models/Project.php`
(`domain-dictionary.md` §1 lists `Project` as a first-class domain; `Master` is not a listed domain.)
Update imports in `PurchaseOrder.php:7` and `Invoice.php:8`. The `Master` domain folder goes away.

### 0.3 Fiscal Mode has no backend representation
`AppLayout.tsx:13` reads fiscal mode from `localStorage` only. The backend cannot scope queries or stamp `fiscal_mode` on new records.

**Required**: move active fiscal mode to the server session.
- `POST /fiscal-mode` `{ "mode": "ppn|non-ppn" }` → stores in session, redirect back.
- `HandleInertiaRequests::share()` exposes `fiscal_mode` as a global prop.
- FE `useFiscalMode()` reads `usePage().props.fiscal_mode` instead of `localStorage`.

Rationale: a client-controlled tax context on a financial ledger is not trustworthy — the project's `fiscal_mode` is immutable after creation (`domain-dictionary.md` §2) and drives all journal posting.

### 0.4 Chart of Accounts is now in scope
The old schema stored a free-text `account_name` on `journal_entry_items`, with account names hardcoded inside `Invoice` and `PurchaseOrder`. That made a trial balance impossible to compute reliably and let two code paths spell the same account differently.

Since the finance migrations are being written from scratch (§0.0), COA lands **with** this feature rather than after it:

- `chart_of_accounts` — hierarchical, `parent_id` self-reference. Strict leaf-node rule: `is_leaf` is derived (`children_count === 0`), and only leaf accounts are postable. `type` and `normal_balance` are immutable after creation.
- `accounting_settings` — `key` → `account_id` mapping (`default_receivable`, `default_payable`, `default_vat_input`, `default_vat_output`, `default_sales_revenue`, `default_project_expense`, …), seeded, global across both fiscal modes.
- `journal_entry_items.account_id` is a real FK; `journal_entry_items.project_id` carries the analytical project tag.
- Cash/bank references on settlements, POs and cash expenses are `account_id` FKs, not code strings.

Journal posting resolves the setting **at post time** and stores the resulting `account_id`. Remapping a setting later therefore cannot move a journal that was already posted, which is what keeps closed periods stable.

See [`docs/databases/tables/chart_of_accounts.dbml`](../../databases/tables/chart_of_accounts.dbml) and [`accounting_settings.dbml`](../../databases/tables/accounting_settings.dbml).

### 0.5 Invoice payment journal will double-post
`Invoice::boot()` (`updated` hook) posts a paid-journal for the **full total** on `issued → paid`, and reads `request()->input(...)` inside the model (HTTP inside a Model — violates `architecture.md` §3).

With termin/DP/installment plans, each settlement posts its own `Dr Kas / Cr Piutang` journal. Marking the invoice `paid` at the final settlement would then post the total a second time.

**Required refactor**: remove journal posting + `request()` usage from the `Invoice::updated` hook. `SettleClientPaymentTerm` becomes the only poster of receipt journals; the `paid` transition only generates the Kwitansi.

---

## 1. Database Schema

The schema is **not restated here**. It lives in [`docs/databases/`](../../databases/), one DBML file per table, with the invariants written into each table's `Note:` block.

```bash
cd docs/databases && ./build.sh   # -> schema.dbml, paste into dbdiagram.io
```

Tables introduced or reshaped for this feature:

| Table | File | Why |
|---|---|---|
| `projects` | [projects.dbml](../../databases/tables/projects.dbml) | Was a `name` + `status` stub. Now carries client, sales PIC, campaign period, fiscal mode, and contract value |
| `project_locations` | [project_locations.dbml](../../databases/tables/project_locations.dbml) | New — FE `BillboardLocation` |
| `payment_plans` | [payment_plans.dbml](../../databases/tables/payment_plans.dbml) | New, polymorphic — client plan on an Invoice, vendor TOP on a PO |
| `payment_terms` | [payment_terms.dbml](../../databases/tables/payment_terms.dbml) | New — FE `PaymentTerm` |
| `payment_settlements` | [payment_settlements.dbml](../../databases/tables/payment_settlements.dbml) | New — one row per actual transfer; replaces FE `VendorPaymentRecord` |
| `chart_of_accounts` | [chart_of_accounts.dbml](../../databases/tables/chart_of_accounts.dbml) | New — see §0.4 |
| `accounting_settings` | [accounting_settings.dbml](../../databases/tables/accounting_settings.dbml) | New — see §0.4 |
| `purchase_orders` | [purchase_orders.dbml](../../databases/tables/purchase_orders.dbml) | Gains `po_number`, `issued_at`, and a real `subtotal`/`ppn`/`total` triple |
| `invoices` | [invoices.dbml](../../databases/tables/invoices.dbml) | Gains `invoice_number` |

Three shapes the FE assumes that the schema deliberately refuses:

- **`po_issued` / `po_number` on a location** — derived from `project_locations.purchase_order_id`, appended by the Resource. Stored copies drift from the PO they describe.
- **`paidAmount` / `isOverdue` on a term** — `paid_amount` is `SUM(payment_settlements.amount)`; `is_overdue` is `status != paid AND due_date < today`. A stored overdue flag needs a nightly cron just to stay honest.
- **`period` as a string** — the FE parses `"01 Jun - 31 Agu 2026"` with a regex. The backend stores `start_date` / `end_date` and sends both the dates and a pre-formatted label.

---

## 2. Enums (`declare(strict_types=1)`, string-backed)

| Enum | Location | Cases |
|---|---|---|
| `ProjectStatus` | `app/Domains/Project/Enums/` | `Draft`, `Active`, `Completed`, `Cancelled` |
| `LocationType` | `app/Domains/Project/Enums/` | `Billboard`, `Videotron`, `Baliho`, `Neonbox` |
| `LocationOrientation` | `app/Domains/Project/Enums/` | `V`, `H` |
| `LocationLighting` | `app/Domains/Project/Enums/` | `Berlampu`, `TidakBerlampu` |
| `PaymentScheme` | `app/Domains/Billing/Enums/` | `Full`, `Dp`, `Termin`, `Installment` |
| `PaymentTermStatus` | `app/Domains/Billing/Enums/` | `Unpaid`, `Partial`, `Paid` |
| `AccountType` | `app/Domains/Accounting/Enums/` | `Asset`, `Liability`, `Equity`, `Revenue`, `Expense` — immutable on an account |
| `NormalBalance` | `app/Domains/Accounting/Enums/` | `Debit`, `Credit` — immutable on an account |
| `AccountingSettingKey` | `app/Domains/Accounting/Enums/` | `DefaultReceivable`, `DefaultPayable`, `DefaultVatInput`, `DefaultVatOutput`, `DefaultIncomeTax`, `DefaultSalesRevenue`, `DefaultProjectExpense`, `OpeningBalanceEquity` |

---

## 3. Business Rules & Calculations

### 3.1 Contract value normalization (Create Project)
FE sends the raw number plus a `tax_mode` switch (`Projects.tsx:244-260`). **The server recomputes** — never trust the FE's computed DPP.

```
mode = non-ppn          → dpp = input,               ppn = 0
mode = ppn, tax = 'dpp' → dpp = input,               ppn = round(dpp * 0.11, 2)
mode = ppn, tax = 'inc' → dpp = round(input / 1.11, 2), ppn = input - dpp
```
`projects.contract_value` always stores `dpp`.

### 3.2 Project financials (mirrors `calcFinancials`, `projectTypes.ts:186`)
```
dpp             = project.contract_value
ppn_keluaran    = is_ppn ? dpp * 0.11 : 0
total_invoice   = dpp + ppn_keluaran
total_dpp_vendor= Σ (location.vendor_cost × location.qty)
ppn_masukan     = is_ppn ? total_dpp_vendor * 0.11 : 0
total_po        = total_dpp_vendor + ppn_masukan
net_profit      = dpp − total_dpp_vendor
ppn_net         = ppn_keluaran − ppn_masukan
margin          = dpp > 0 ? (net_profit / dpp) × 100 : 0
```
Computed by a dedicated read Action (`CalculateProjectFinancials`), never in the Controller — `architecture.md` §6. Use `bcmath`/`BigDecimal` semantics, not float arithmetic.

### 3.3 Masa tayang progress (`Projects.tsx:130`)
FE currently parses a `period` **string** with a regex. Backend must send real dates; the Resource exposes `start_date`, `end_date`, AND a pre-formatted `period` label so FE can drop `parsePeriod()` entirely.

### 3.4 Invariants
- `fiscal_mode` immutable after create (guard in `saving()`, throw `DomainException`).
- A location cannot be edited or deleted once its PO is issued (`purchase_order_id !== null`).
- PO must have ≥ 1 item (already enforced in `PurchaseOrder::boot()`).
- Payment terms percent sum must equal exactly `100`; the last term absorbs the rounding remainder (mirrors `ProjectPayment.tsx:82`).
- Σ settlement amounts for a term must never exceed `term.amount`.
- `Invoice` status flow `draft → issued → paid`, `paid` terminal (already enforced).
- Every write path runs the `ClosingPeriod::isClosed()` guard (already in PO/Invoice `saving()`).
- Project auto-transitions `Draft → Active` when its invoice is issued; `→ Completed` when all terms are paid AND `end_date` has passed.

---

## 4. Actions (`app/Domains/Project/Actions/`)

One public `execute()` each. Every money-touching action is wrapped in `DB::transaction()` and emits `Log::info` (`best-practices.md` §2).

| Action | Responsibility |
|---|---|
| `CreateProject` | Normalize contract value (§3.1), generate `code`, stamp session `fiscal_mode`, status `Draft` |
| `UpdateProject` | Mutable fields only; rejects `fiscal_mode` changes |
| `GenerateProjectCode` | `PRJ-{YYYY}-{PPN\|NON}{NN}`, race-safe via unique index + retry |
| `CalculateProjectFinancials` | Read action, §3.2; consumed by index metrics, Info tab, and cards |
| `AddProjectLocation` | Auto `LOC-NNN` code, normalizes `vendor_cost` (same dpp/inc switch as §3.1) |
| `DeleteProjectLocation` | Guarded by the PO-issued invariant |

`app/Domains/Procurement/Actions/`

| Action | Responsibility |
|---|---|
| `IssueVendorPurchaseOrder` | Takes a project + a **vendor + set of locations** (FE issues per-location AND bulk-per-vendor: `VendorPOTab.tsx:182` / `:226`). Creates PO + items from locations, generates `po_number`, backfills `project_locations.purchase_order_id`, creates the vendor `PaymentPlan`, posts the Flow-B journal |
| `GeneratePoNumber` | `{NNN}/PTSSI-PO/{MM}/{YY}` |
| `UpdateVendorPurchaseOrder` | Edit before settlement only (`VendorPOTab.tsx:278`) |
| `RecordVendorPayment` | Settles a vendor payment term (see `SettlePaymentTerm`) |

`app/Domains/Billing/Actions/`

| Action | Responsibility |
|---|---|
| `IssueClientInvoice` | Creates Invoice + items from project locations, `draft → issued`, generates `invoice_number`, builds the `PaymentPlan`, posts the Flow-A journal |
| `GeneratePaymentTerms` | Port of `ProjectPayment.tsx:24 generateTerms()` — the 4 schemes, percent normalization, due-date defaults |
| `SettlePaymentTerm` | **Shared by client + vendor.** Creates a `payment_settlement`, recomputes term status (`unpaid`/`partial`/`paid`), posts the settlement journal, and — when the plan is fully settled — flips the parent document to `paid` (which generates the Kwitansi for invoices) |
| `GenerateInvoiceNumber` | `INV-PTSSI/{MM}/{YYYY}/{NNN}` |

---

## 5. HTTP Layer

### 5.1 Routes (`routes/web.php`, replacing the closures at lines 61, 101, 105)
```php
Route::middleware(['auth'])->group(function () {
    Route::post('fiscal-mode', [FiscalModeController::class, 'update'])->name('fiscal-mode.update');

    Route::get   ('projects',                [ProjectController::class, 'index'])  ->name('projects.index');
    Route::post  ('projects',                [ProjectController::class, 'store'])  ->name('projects.store');
    Route::get   ('projects/{project}',      [ProjectController::class, 'show'])   ->name('projects.show');
    Route::put   ('projects/{project}',      [ProjectController::class, 'update']) ->name('projects.update');
    Route::delete('projects/{project}',      [ProjectController::class, 'destroy'])->name('projects.destroy');

    Route::post  ('projects/{project}/locations',            [ProjectLocationController::class, 'store'])  ->name('projects.locations.store');
    Route::delete('projects/{project}/locations/{location}', [ProjectLocationController::class, 'destroy'])->name('projects.locations.destroy');

    Route::post  ('projects/{project}/purchase-orders',      [ProjectPurchaseOrderController::class, 'store'])->name('projects.purchase-orders.store');
    Route::post  ('projects/{project}/invoice',              [ProjectInvoiceController::class, 'store'])      ->name('projects.invoice.store');

    Route::get   ('projects/{project}/payment',              [ProjectPaymentController::class, 'index'])  ->name('projects.payment.index');
    Route::post  ('payment-terms/{term}/settle',             [ProjectPaymentController::class, 'settle'])->name('payment-terms.settle');
});
```
> `projects.index` renames the existing `projects` route. FE already calls `route('projects.show', id)` (`Projects.tsx:696`) — that name is preserved.
> Ziggy must be regenerated after this change.

### 5.2 Form Requests (`app/Http/Requests/Project/`)
Validation + authorization only, zero business logic (`architecture.md` §4).

**`StoreProjectRequest`**
```php
'name'           => ['required', 'string', 'max:255'],
'client_id'      => ['required', 'integer', 'exists:clients,id'],
'sales_id'       => ['nullable', 'integer', 'exists:sales,id'],
'start_date'     => ['required', 'date'],
'end_date'       => ['required', 'date', 'after_or_equal:start_date'],
'target_qty'     => ['required', 'integer', 'min:1', 'max:20'],
'contract_value' => ['required', 'numeric', 'min:1'],
'tax_mode'       => ['required', Rule::in(['dpp', 'inc'])],
```
Also: `StoreProjectLocationRequest`, `StoreVendorPurchaseOrderRequest`, `StoreClientInvoiceRequest`, `SettlePaymentTermRequest`.

### 5.3 Resources (`app/Http/Resources/Project/`)
`ProjectResource`, `ProjectLocationResource`, `PaymentPlanResource`, `PaymentTermResource`, `PaymentSettlementResource`.

No custom `{code, status, data}` envelope. Pagination via `ProjectResource::collection($paginator)` (`architecture.md` §5).

**N+1 guard**: index eager-loads `client:id,name`, `sales:id,name`, `locations:id,project_id,vendor_cost,qty,purchase_order_id`, `invoice.paymentPlan.terms`.

---

## 6. Inertia Props Contract

### 6.1 `GET /projects` → `Pages/Projects`
```json
{
  "fiscal_mode": "ppn",
  "filters": { "search": "", "status": "all" },
  "metrics": {
    "total_active_projects": 4,
    "total_contract_value": "1250000000.00",
    "total_estimated_profit": "310500000.00"
  },
  "status_counts": {
    "all": 12, "active": 4, "draft": 3, "pending_po": 5, "no_invoice": 6
  },
  "projects": {
    "data": [
      {
        "id": 1,
        "code": "PRJ-2026-PPN01",
        "name": "Kampanye Iklan Film Toystory 5 - Jawa Tengah",
        "client": { "id": 1, "name": "PT. Walt Disney Pictures Indonesia" },
        "sales": { "id": 3, "name": "Budi Santoso" },
        "fiscal_mode": "ppn",
        "start_date": "2026-04-01",
        "end_date": "2026-06-30",
        "period": "01 Apr - 30 Jun 2026",
        "period_progress": {
          "percent": 100,
          "label": "Masa Tayang Selesai",
          "state": "finished"
        },
        "contract_value": "280000000.00",
        "status": "Completed",
        "target_qty": 3,
        "location_count": 3,
        "po_issued_count": 3,
        "invoice_issued": true,
        "invoice_number": "INV-PTSSI/04/2026/001",
        "financials": {
          "dpp": "280000000.00",
          "ppn_keluaran": "30800000.00",
          "total_invoice": "310800000.00",
          "total_dpp_vendor": "39500000.00",
          "ppn_masukan": "4345000.00",
          "total_po": "43845000.00",
          "net_profit": "240500000.00",
          "ppn_net": "26455000.00",
          "margin": 85.89
        }
      }
    ],
    "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
    "meta": { "current_page": 1, "per_page": 6, "total": 12, "last_page": 2, "from": 1, "to": 6, "path": "...", "links": [] }
  },
  "flash": { "success": null, "error": null },
  "errors": {}
}
```

> **FE change required**: search, status filter, sorting, and pagination move server-side. FE currently filters/sorts/paginates the full in-memory array (`Projects.tsx:336-409`) — that does not survive real pagination. `Projects.tsx` should send `router.get(route('projects.index'), { search, status, page }, { preserveState: true, replace: true })`.
> `period_progress.state` is one of `upcoming` / `running` / `finished`, replacing the FE's `calcPeriodProgress()` string parsing.

### 6.2 `GET /projects/{project}` → `Pages/Projects/Show`
```json
{
  "fiscal_mode": "ppn",
  "project": {
    "…": "all fields from 6.1, plus:",
    "locations": [
      {
        "id": 1,
        "code": "LOC-001",
        "area": "Semarang",
        "description": "Billboard Jl. Pandanaran KM 3 (Megah)",
        "type": "Billboard",
        "size": "4x8m",
        "orientation": "V",
        "lighting": "Berlampu",
        "qty": 1,
        "vendor": { "id": 1, "name": "PT. Megah Billboard Jaya" },
        "vendor_cost": "8500000.00",
        "subtotal": "8500000.00",
        "po_issued": true,
        "po_number": "001/PTSSI-PO/04/26",
        "purchase_order_id": 17,
        "top_notes": "Lunas setelah visual terpasang"
      }
    ],
    "invoice": {
      "id": 9,
      "invoice_number": "INV-PTSSI/04/2026/001",
      "status": "paid",
      "subtotal": "280000000.00",
      "ppn": "30800000.00",
      "total": "310800000.00",
      "transaction_date": "2026-04-01",
      "due_date": "2026-04-30",
      "payment_plan": {
        "id": 4,
        "scheme": "full",
        "total_amount": "310800000.00",
        "notes": "Pembayaran penuh via transfer bank BCA",
        "summary": {
          "total_paid": "310800000.00",
          "total_remaining": "0.00",
          "progress_percent": 100,
          "paid_count": 1,
          "total_count": 1,
          "next_due": null
        },
        "terms": [
          {
            "id": 11,
            "label": "Lunas Sekaligus",
            "amount": "310800000.00",
            "percent": "100.00",
            "due_date": "2026-04-30",
            "status": "paid",
            "is_overdue": false,
            "paid_amount": "310800000.00",
            "settlements": [
              {
                "id": 3,
                "amount": "310800000.00",
                "paid_at": "2026-04-28",
                "payment_method": "Transfer Bank BCA",
                "payment_account": { "id": 4, "code": "1112", "name": "Bank BCA Operasional Utama" },
                "payment_ref": "TRF/28042026/0091",
                "notes": "Transfer BCA konfirmasi 28 Apr 2026"
              }
            ]
          }
        ]
      }
    },
    "purchase_orders": [
      {
        "id": 17,
        "po_number": "001/PTSSI-PO/04/26",
        "vendor": { "id": 1, "name": "PT. Megah Billboard Jaya" },
        "status": "paid",
        "total": "8500000.00",
        "issued_at": "2026-04-02",
        "location_ids": [1],
        "payment_plan": { "…": "same shape as invoice.payment_plan" }
      }
    ]
  },
  "vendors": [{ "id": 1, "name": "PT. Megah Billboard Jaya" }],
  "flash": { "success": null, "error": null },
  "errors": {}
}
```

> `summary` is the server-side port of `calcPaymentSummary()` (`projectTypes.ts:34`) so FE does not recompute money.
> `vendors` replaces `mockVendors`; `clients` / `sales` (for the create modal) replace `mockClients` / `mockSalesPICs` on the index page.

### 6.3 Endpoint payloads

**`POST /projects`**
```json
{
  "name": "string (required, max:255)",
  "client_id": "integer (required, exists:clients,id)",
  "sales_id": "integer|null (exists:sales,id)",
  "start_date": "YYYY-MM-DD (required)",
  "end_date": "YYYY-MM-DD (required, after_or_equal:start_date)",
  "target_qty": "integer (required, 1..20)",
  "contract_value": "numeric (required, min:1)",
  "tax_mode": "dpp|inc (required)"
}
```
Response: redirect back with `success` flash. `fiscal_mode` is taken from the session, **not** from the payload.

**`POST /projects/{project}/locations`**
```json
{
  "area": "string (required)",
  "description": "string (required)",
  "type": "Billboard|Videotron|Baliho|Neonbox (required)",
  "orientation": "V|H (nullable)",
  "size": "string (required)",
  "qty": "integer (required, min:1)",
  "vendor_id": "integer|null (exists:vendors,id)",
  "vendor_cost": "numeric (required, min:0)",
  "tax_mode": "dpp|inc (required)"
}
```

**`POST /projects/{project}/purchase-orders`**
```json
{
  "vendor_id": "integer (required, exists:vendors,id)",
  "location_ids": "array (required, min:1) — must belong to project AND have no PO yet",
  "lighting": "Berlampu|Tidak Berlampu (nullable)",
  "top_notes": "string (nullable)",
  "transaction_date": "YYYY-MM-DD (required)",
  "payment_plan": {
    "scheme": "full|dp|termin|installment (required)",
    "percents": "array<numeric> (required, sum === 100)",
    "due_dates": "array<YYYY-MM-DD> (required, same length as percents)"
  }
}
```

**`POST /projects/{project}/invoice`**
```json
{
  "transaction_date": "YYYY-MM-DD (required)",
  "due_date": "YYYY-MM-DD (nullable, defaults +7d)",
  "payment_plan": {
    "scheme": "full|dp|termin|installment (required)",
    "percents": "array<numeric> (required, sum === 100)",
    "due_dates": "array<YYYY-MM-DD> (required)"
  }
}
```

**`POST /payment-terms/{term}/settle`**
```json
{
  "amount": "numeric (required, min:1, max: term.amount − term.paid_amount)",
  "paid_at": "YYYY-MM-DD (required)",
  "payment_method": "string (required)",
  "payment_account_id": "integer (required, exists:chart_of_accounts,id, must be a LEAF account)",
  "payment_ref": "string (nullable)",
  "notes": "string (nullable)"
}
```

---

## 7. Automated Journal Flows

Per `accounting-journal-flow.md`. `is_ppn = project.fiscal_mode === 'ppn'`.

Account columns below name the `accounting_settings` key that resolves them; the COA code in parentheses is what the seeder maps that key to. Posting resolves the key **once, at post time**, and writes the resulting `account_id` onto the journal line — so remapping a setting later never moves a journal that has already been posted.

### 7.1 Issue Client Invoice (Flow A.1) — `IssueClientInvoice`
| | Account | Amount |
|---|---|---|
| Dr | `default_receivable` (`1121` Piutang Dagang Client) | `total_invoice` |
| Cr | `invoice.revenue_account_id`, defaults to `default_sales_revenue` (`4100`) | `dpp` |
| Cr | `default_vat_output` (`2121` PPN Keluaran) | `ppn_keluaran` *(only when `is_ppn`)* |

### 7.2 Client Payment Settlement (Flow A.2) — `SettlePaymentTerm`, per settlement
| | Account | Amount |
|---|---|---|
| Dr | Cash/Bank — `settlement.payment_account_id` | `settlement.amount` |
| Cr | `default_receivable` (`1121` Piutang Dagang Client) | `settlement.amount` |

On the final settlement: invoice → `paid` → `generateKwitansi()` fires. No additional journal (see §0.5).

### 7.3 Issue Vendor PO (Flow B.1) — `IssueVendorPurchaseOrder`
| | Account | Amount |
|---|---|---|
| Dr | `po.expense_account_id`, defaults to `default_project_expense` (`5100`) | `total_dpp_vendor` of the PO's locations |
| Dr | `default_vat_input` (`1141` PPN Masukan) | `ppn_masukan` *(only when `is_ppn`)* |
| Cr | `default_payable` (`2110` Hutang Dagang Vendor) | `total_po` |

### 7.4 Vendor Payment Settlement (Flow B.2) — `SettlePaymentTerm`
| | Account | Amount |
|---|---|---|
| Dr | `default_payable` (`2110` Hutang Dagang Vendor) | `settlement.amount` |
| Cr | Cash/Bank — `settlement.payment_account_id` | `settlement.amount` |

Every journal is created inside the settling `DB::transaction()`, and its id is written back to `payment_settlements.journal_entry_id`.

Every line carries `project_id` so per-project profit and loss is a filter on `journal_entry_items`, never a per-project COA account. Every resolved account must be a leaf. Debits must equal credits — assert before commit.

---

## 8. Implementation Order

1. Fix §0.1 namespaces, relocate Project to its own domain (§0.2).
2. Session fiscal mode + shared Inertia prop (§0.3).
3. `chart_of_accounts` + `accounting_settings` tables, models, and seeder (§0.4). Everything downstream resolves accounts through them.
4. Migrations §1, Enums §2, Models + invariants §3.4.
5. `CreateProject` / `UpdateProject` / `CalculateProjectFinancials` + index & show controllers + Resources → **FE index page can drop `projectData.ts`**.
6. Location Actions + controller → LocationsTab live.
7. `IssueVendorPurchaseOrder` + Flow B journals → VendorPOTab live.
8. `IssueClientInvoice` + `GeneratePaymentTerms` + Flow A journals → InvoiceTab live.
9. `SettlePaymentTerm` + settlement journals → ProjectPayment live.
10. PHPUnit feature tests per Action (journal balance, closing-period block, fiscal-mode immutability, percent-sum invariant, over-settlement guard).

---

## 9. Open Questions for the Product Owner

1. **PO numbering scope** — is `{NNN}` a global running sequence per month, or per vendor? Current mock data (`001`, `002`, `003` across three different vendors in one project) suggests a global monthly sequence.
2. **Invoice per project** — one invoice per project (assumed here), or can a project be billed with several invoices?
3. **`Cancelled` status** — is there a UI entry point? `StatusBadge` renders it but no view triggers the transition.
4. **Sales PIC** — FE uses free-text names (`mockSalesPICs`). This contract binds `sales_id` to the existing `sales` table; confirm those names exist as Sales records.

---

## 10. Implementation Status — see `docs/contracts/BE/projects.md`

`Project` CRUD and `ProjectLocation` create/delete have been implemented (Provider-Driven — BE built first, not driven by this doc's exact shapes). The actual shipped contract — real payload field names, real response shapes, and every point where it diverges from what's written above (UUID ids, `is_ppn_inclusive` instead of `tax_mode`, no session fiscal mode yet, `projects.show` still a mock closure, etc.) — is documented separately in **[`docs/contracts/BE/projects.md`](../BE/projects.md)**.

Wiring FE against what's actually live today (not this aspirational doc) starts there.
