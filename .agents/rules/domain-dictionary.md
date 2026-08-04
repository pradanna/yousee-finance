# Domain Dictionary (Ubiquitous Language)

In this financial application (YouSee Finance), you MUST understand and strictly use these specific business terms and adhere to the Domain Invariants. Do NOT invent your own synonyms.

## 1. Known Domains (Lite DDD)
The backend is structured into these specific domains within `app/Domains/`:
- `Identity`: Auth, Users, Roles (e.g., `PIMPINAN`).
- `Master`: Vendor, Client, Sales, Project.
- `Procurement`: PurchaseOrder, PurchaseOrderItem, Attachment.
- `Billing`: Invoice, InvoiceItem, Kwitansi.
- `Accounting`: JournalEntry, JournalEntryItem, PPhAdjustment, ClosingPeriod, AuditLog.
- `Shared`: Enums (`FiscalMode`), Traits.

## 2. Core Business Terms & Invariants
- **Fiscal Mode**: The active tax context (`ppn` or `non-ppn`). 
  - *Invariant*: Must be set upon creation. **CANNOT be changed** after being saved.
- **PO (Purchase Order)**: A multi-item purchasing document. 
  - *Invariant*: Must have at least 1 item.
- **Invoice**: A billing document sent to the Client. 
  - *Invariant*: Status flow MUST be `draft` → `issued` → `paid`. Cannot skip directly to `paid`. `paid` is terminal.
- **Kwitansi**: Official receipt of full payment. 
  - *Invariant*: Generated automatically via `generateKwitansi()` in `Invoice::updated()` hook. Only 1 per Invoice. Strictly immutable.
- **Journal Entry**: An automated Debit/Credit entry. 
  - *Invariant*: Debits and Credits MUST balance perfectly. Never delete them directly; use reversing entries.
- **Closing Period**: The locking of a financial period based on `(month, year, fiscal_mode)`. 
  - *Invariant*: Every `saving()` event on POs and Invoices MUST check `ClosingPeriod::isClosed()`. If closed, throw a `DomainException`.
- **Unlock**: An override action exclusively for the `UserRole::PIMPINAN` to reopen a Closed Period. 
  - *Invariant*: Must always be recorded in the `AuditLog`.

## 3. Standard Accounting Glossary
- **Debit (Dr)**: Increases asset/expense, decreases liability/equity.
- **Credit (Cr)**: Increases liability/equity/revenue, decreases asset/expense.
