# Accounting Journal Workflows & Automated Ledger Rules

This document defines the business domain invariants, automated journal posting rules, and COA mapping workflows for YouSee Finance.

## 1. Master COA Structure & Hierarchy Rules
- **Header Accounts (`is_leaf: false`)**:
  - Accounts with one or more children (`children.length > 0`).
  - Cannot be selected in journal entries or transaction forms.
  - Used exclusively for aggregating totals in financial reports (Balance Sheet, Profit & Loss).
  - Can have sub-accounts added ("Tambah Akun Anak").

- **Transactional Leaf Accounts (`is_leaf: true`)**:
  - Accounts with no child accounts (`children.length === 0`).
  - **ONLY** leaf accounts can be assigned to journal entries, invoices, purchase orders, or cash transactions.
  - Cannot have sub-accounts added.

- **Immutability Invariants**:
  - Account `type` (asset, liability, equity, revenue, expense) and `normal_balance` (debit, credit) are **IMMUTABLE** after creation to preserve ledger history.

---

## 2. Global Accounting Settings Mappings
The application maintains global default COA mappings (`AccountingSetting`) for routine transaction automation:
- **Default Accounts Receivable (`1121` - Piutang Dagang Client)**: Debited upon Invoice issuance.
- **Default Accounts Payable (`2110` - Hutang Dagang Vendor)**: Credited upon Purchase Order (PO) creation.
- **Default VAT Input (`1141` - PPN Masukan)**: Debited for purchase VAT in PPN fiscal mode.
- **Default VAT Output (`2121` - PPN Keluaran)**: Credited for sales VAT in PPN fiscal mode.
- **Default Income Tax Withholding (`2122` - Hutang PPh Pemotongan)**: Credited for tax withholding transactions.

---

## 3. Automated Journal Posting Workflows

### Flow A: Client Sales Invoice & Payment Collection
1. **Invoice Issuance (Unpaid)**:
   - **(Dr) Default Accounts Receivable (`1121`)**: Full Invoice Total (Inc. PPN if PPN Mode) [Increased]
   - **(Cr) Sales Revenue (`4100`)**: Net Revenue Amount [Increased]
   - **(Cr) Default VAT Output (`2121`)**: 11% PPN Tax (Only if PPN Mode active) [Increased]

2. **Invoice Payment Collection (Pelunasan Piutang)**:
   - **(Dr) Selected Cash/Bank Account (e.g., `1111` Bank BCA)**: Payment Received Amount [Increased]
   - **(Cr) Default Accounts Receivable (`1121`)**: Payment Settled Amount [Decreased]

---

### Flow B: Procurement Purchase Order & Vendor Settlement
1. **Purchase Order Creation (Unpaid)**:
   - **(Dr) Expense / Inventory Account (e.g., `5100` Beban Project)**: Net Purchase Amount [Increased]
   - **(Dr) Default VAT Input (`1141`)**: 11% PPN Tax (Only if PPN Mode active) [Increased]
   - **(Cr) Default Accounts Payable (`2110`)**: Full PO Total [Increased]

2. **Vendor PO Payment (Pelunasan Hutang Vendor)**:
   - **(Dr) Default Accounts Payable (`2110`)**: Payment Amount [Decreased]
   - **(Cr) Selected Cash/Bank Account (e.g., `1111` Bank BCA)**: Payment Amount [Decreased]

---

### Flow C: Cash Disbursement (Pengeluaran Kas Direct)
1. **Direct Operational Expense Payment**:
   - **(Dr) Specific Expense COA (e.g., `5210` Beban Operasional)**: Expense Amount [Increased]
   - **(Cr) Selected Cash/Bank Account (e.g., `1110` Kas Tunai / `1111` Bank BCA)**: Amount Paid [Decreased]

---

### Flow D: Initial Capital Deposit & Opening Balances (Setoran Modal Awal)
1. **Owner / Investor Capital Deposit (Setoran Modal Pemilik)**:
   - **(Dr) Selected Cash/Bank Account (e.g., `1111` Bank BCA)**: Capital Amount [Increased]
   - **(Cr) Owner Equity Account (`3100` Modal Disetor / Ekuitas)**: Capital Amount [Increased]

2. **System Migration Opening Balance Setup**:
   - Recorded via Opening Balance Journal Entry where total initial Asset balances (Debits) equal initial Liabilities + Equity balances (Credits).
   - If unbalanced during setup, offset difference against **Opening Balance Equity (`3900`)**.

### Flow E: Adjustment Journal Entries (Jurnal Penyesuaian)
1. **Past Period Posting Error Correction**:
   - **(Dr) Correct Cash/Bank Account (e.g., `1111` Bank Mandiri)** [Increased]
   - **(Cr) Incorrect Cash/Bank Account (e.g., `1112` Bank BCA)** [Decreased]
2. **Fixed Asset Depreciation**:
   - **(Dr) Depreciation Expense Account (e.g., `5300` Beban Penyusutan)** [Increased]
   - **(Cr) Accumulated Depreciation Account (e.g., `1290` Akumulasi Penyusutan)** [Increased]
3. **Prepaid Expense Amortization**:
   - **(Dr) Expense Account (e.g., `5220` Beban Sewa Lahan/Kantor)** [Increased]
   - **(Cr) Prepaid Expense Asset Account (e.g., `1150` Sewa Dibayar di Muka)** [Decreased]
4. **Accrued Expenses Recognition**:
   - **(Dr) Expense Account (e.g., `5210` Beban Listrik & Utilitas)** [Increased]
   - **(Cr) Accrued Expenses Liability Account (e.g., `2150` Hutang Beban / Utilitas)** [Increased]
5. **Cash / Bank Variance Reconciliation**:
   - **(Dr) Bank Charges / Cash Variance Expense (e.g., `5910` Beban Admin Bank / Selisih Kas)** [Increased]
   - **(Cr) Cash/Bank Account (e.g., `1111` Bank BCA)** [Decreased]

---

## 4. Closing Period Protection Rules
- Journal entries associated with a closed period (`month`, `year`, `fiscal_mode`) are strictly locked and immutable.
- Global Accounting Settings changes only affect newly created transactions; past historical journals in closed periods remain completely untouched.
