# Database Schema (DBML)

Single source of documentation truth for the YouSee Finance database, written in
[DBML](https://dbml.dbdiagram.io/docs/). One file per table so a diff touches
only the table that actually changed.

**This is a design document, not a mirror of `database/migrations`.** The finance
migrations were dropped and are being rewritten from this schema. Until they
land, treat this directory as the target and the migrations folder as the
in-progress implementation.

## Layout

```
docs/databases/
├── README.md                    ← you are here
├── build.sh                     ← concatenates + validates
├── tables/
│   ├── _enums.dbml              ← shared enums (underscore = not a single table)
│   ├── _spatie_permission.dbml  ← vendor package, 5 tables
│   └── <table_name>.dbml        ← one file per table
└── schema.dbml                  ← GENERATED — paste into dbdiagram.io
```

## Rendering the diagram

```bash
./build.sh
```

Then paste `schema.dbml` into [dbdiagram.io](https://dbdiagram.io). The
generated file is committed so a diagram can be rendered without running
anything.

`build.sh` fails on duplicate table names and on any `Ref:` pointing at a table
that does not exist — both are hard errors in dbdiagram.io and are far easier to
catch here than by staring at a parser message.

## Domain map

| Domain | Tables |
|---|---|
| Identity | `users`, `password_reset_tokens`, `sessions`, + Spatie permission tables |
| Vendor | `vendors` |
| Client | `clients` |
| Sales | `sales` |
| Project | `projects`, `project_locations` |
| Procurement | `purchase_orders`, `purchase_order_items` |
| Billing | `invoices`, `invoice_items`, `kwitansis`, `payment_plans`, `payment_terms`, `payment_settlements` |
| Accounting | `chart_of_accounts`, `accounting_settings`, `journal_entries`, `journal_entry_items`, `pph_adjustments`, `closing_periods`, `audit_logs`, `cash_expenses` |
| Shared | `attachments` |

## Design decisions worth knowing

**Chart of Accounts is first-class.** `journal_entry_items.account_id` is a real
foreign key. Every account reference elsewhere — cash/bank on a settlement,
expense account on a PO, revenue account on an invoice — is an FK too, never a
loose code string. Free-text account names make a trial balance impossible to
compute reliably, and nothing stops two code paths from spelling the same
account differently.

**Per-project reporting rides on `journal_entry_items.project_id`,** not on
per-project accounts. The COA never grows a "Pendapatan Project A" row.

**Money is always `decimal(15,2)`.** Never `float`, never `double`.

**Derived values are not columns.** Where the UI shows a computed field
(`po_issued`, `paid_amount`, `is_overdue`, `total_invoice`, `margin`), the table
note says so and names what computes it. A stored copy of a derived money figure
is a second source of truth, and it will drift.

**Payment plans are polymorphic.** A client payment plan on an invoice and
vendor terms-of-payment on a PO are the same structure with mirrored journal
direction, so they share `payment_plans` / `payment_terms` /
`payment_settlements`. Two near-identical table sets would drift apart.

**Settlements are rows, not columns.** One `payment_settlements` row per actual
transfer, because a single term can be paid partially and more than once. This
is what gives every journal entry something to point back at during an audit.

**Corrections are reversals.** `journal_entries.is_reversal` and
`reverses_journal_id` exist so "never delete a journal entry" is enforced by the
schema rather than by convention.

## Conventions

- **Filename = table name.** A leading `_` means the file holds enums or a
  vendor package rather than one table.
- **Refs live with the child.** A foreign key is declared at the bottom of the
  file that owns the column, so the relationship sits next to the column. DBML
  permits forward references, so alphabetical concatenation is safe.
- **Enums are documentation only.** Every "enum" column is `varchar` in MySQL
  and cast to a PHP backed enum in the model.
- **Table `Note:` blocks carry the invariants** — closing-period guards, status
  flows, immutability rules, leaf-node rules. A column list alone never explains
  why a column may not be written.

## Polymorphic relations

`journal_entries.source`, `pph_adjustments.source`, `payment_plans.payable`,
`attachments.attachable`, and `audit_logs.auditable` are Eloquent morphs. They
have **no database-level foreign key** and therefore no `Ref:` line — only a
composite index and a note listing the allowed types. Referential integrity for
these is the application's responsibility.

## Excluded tables

Laravel infrastructure tables carry no domain meaning and are omitted: `cache`,
`cache_locks`, `jobs`, `job_batches`, `failed_jobs`.

`sessions` **is** documented — the active fiscal mode belongs in its payload.

## Keeping this honest

Nothing regenerates this from the migrations. When you write a migration, update
the matching `.dbml` file in the same commit and re-run `./build.sh`.
