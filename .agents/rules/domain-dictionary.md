# Domain Dictionary (Ubiquitous Language)

In this financial application (YouSee Finance), you MUST understand and strictly use these specific business terms and adhere to the Domain Invariants. Do NOT invent your own synonyms.

## 1. Known Domains (Lite DDD)
The backend is structured into these specific domains within `app/Domains/`:
- `Identity`: Auth, Users, Roles (e.g., `PIMPINAN`).
- `Vendor`: Vendor.
- `Client`: Client.
- `Sales`: Sales.
- `Project`: Project.
- `Procurement`: PurchaseOrder, PurchaseOrderItem, Attachment.
- `Billing`: Invoice, InvoiceItem, Kwitansi.
- `Accounting`: ChartOfAccount, AccountingSetting, JournalEntry, JournalEntryItem, PPhAdjustment, ClosingPeriod, AuditLog.
- `Shared`: Enums (`FiscalMode`), Traits.

## 2. Core Business Terms & Invariants
- **Fiscal Mode**: The active tax context (`ppn` or `non-ppn`). 
  - *Invariant*: Must be set upon creation. **CANNOT be changed** after being saved.
- **Chart of Accounts (COA)**: Hierarchical master structure of financial accounts (Header, Sub-header, Transactional Leaf Node).
  - *Invariant*: **Strict Leaf Node Rule** — ONLY leaf nodes (accounts with 0 children) can be assigned to journal entries. Header/Parent accounts are strictly used for aggregation in financial reports.
  - *Invariant*: Single Master COA is shared across all Fiscal Modes; tax-specific accounts (e.g. PPN Masukan/Keluaran) are activated dynamically based on transaction `FiscalMode`.
  - *Invariant*: Type and Normal Balance are **immutable** after an account is created to preserve historical ledger integrity.
- **Accounting Setting**: Global configuration mapping default COA accounts to transaction types (e.g. Default Receivable, Payable, VAT In, VAT Out, PPh).
  - *Invariant*: Accounting settings provide default automation for 90% of routine transactions; manual COA overrides in forms require elevated user permissions.
- **Analytical Project Tagging**: `project_id` attached directly to `JournalEntryItem` lines.
  - *Invariant*: Projects MUST NOT create custom COA accounts (e.g., no 4111 Pendapatan Project A). Filtering per-project financial reports is done purely via `project_id` tagging.
- **PO (Purchase Order)**: A multi-item purchasing document. 
  - *Invariant*: Must have at least 1 item.
- **Invoice**: A billing document sent to the Client. 
  - *Invariant*: Status flow MUST be `draft` → `issued` → `paid`. Cannot skip directly to `paid`. `paid` is terminal.
- **Kwitansi**: Official receipt of full payment. 
  - *Invariant*: Generated automatically via `generateKwitansi()` in `Invoice::updated()` hook. Only 1 per Invoice. Strictly immutable.
- **Journal Entry**: An automated Debit/Credit entry. 
  - *Invariant*: Debits and Credits MUST balance perfectly. Never delete them directly; use reversing entries.
  - *Invariant*: Historical journal entries in closed periods MUST NOT change when global COA mappings are updated.
- **Closing Period**: The locking of a financial period based on `(month, year, fiscal_mode)`. 
  - *Invariant*: Every `saving()` event on POs and Invoices MUST check `ClosingPeriod::isClosed()`. If closed, throw a `DomainException`.
- **Unlock**: An override action exclusively for the `UserRole::PIMPINAN` to reopen a Closed Period. 
  - *Invariant*: Must always be recorded in the `AuditLog`.

## 3. Standard Accounting Glossary
- **Debit (Dr)**: Increases asset/expense, decreases liability/equity.
- **Credit (Cr)**: Increases liability/equity/revenue, decreases asset/expense.
