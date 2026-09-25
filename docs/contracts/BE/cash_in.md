# Cash In (Penerimaan Kas Non-Invoice) Integration Contract (Provider: Backend)

Dokumen ini mendeskripsikan kontrak integrasi untuk fitur **Penerimaan Kas (*Cash In*)**, yaitu pencatatan penerimaan uang kas/bank selain dari penagihan Invoice Client (misalnya: setoran modal pemilik, pinjaman/talangan owner, saldo awal migrasi, dan pendapatan non-operasional lainnya).

Skema database terperinci dapat dilihat di [cash_in_transactions.dbml](file:///c:/PROJECT/WEBSITE/yousee-finance/docs/databases/tables/cash_in_transactions.dbml).

---

## 1. List Transaksi Penerimaan Kas

- **Endpoint:** `GET /cash-in`
- **Render Page:** `CashIn`
- **Tujuan:** Menampilkan daftar mutasi penerimaan kas terpaginasi, statistik ringkasan, dan pilihan akun kas/bank.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | string | No | Filter bulan (`1`-`12` atau `all`, default: bulan berjalan) |
| `year` | string | No | Filter tahun (default: tahun berjalan) |
| `search` | string | No | Filter teks nomor transaksi, keterangan, atau penyetor |
| `deposit_account_id` | string | No | Filter akun kas/bank penerima |
| `source_account_id` | string | No | Filter akun sumber dana / lawan kredit |

### Page Props Passed to Inertia

```typescript
interface CashInPageProps {
    transactions: {
        data: Array<{
            id: string;
            transaction_number: string;
            fiscal_mode: 'ppn' | 'non-ppn';
            deposit_account_id: string;
            source_account_id: string;
            amount: number | string;
            transaction_date: string;
            payer: string | null;
            description: string;
            attachment_path?: string | null;
            attachment_name?: string | null;
            attachment_url?: string | null;
            status: 'active' | 'voided';
            voided_at?: string | null;
            void_reason?: string | null;
            created_at: string;
            deposit_account?: {
                id: string;
                code: string;
                name: string;
                friendly_name?: string;
                current_balance?: number;
            };
            source_account?: {
                id: string;
                code: string;
                name: string;
            };
            creator?: {
                id: string;
                name: string;
            };
            voided_by?: {
                id: string;
                name: string;
            } | null;
            journal_entry?: {
                id: string;
                number: string;
                fiscal_mode: 'ppn' | 'non-ppn';
                transaction_date: string;
                description: string;
                items?: Array<{
                    id: string;
                    account_id: string;
                    debit: number | string;
                    credit: number | string;
                    memo?: string | null;
                    account?: {
                        id: string;
                        code: string;
                        name: string;
                    };
                }>;
            } | null;
        }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    depositAccounts: Array<{
        id: string;
        code: string;
        name: string;
        friendly_name: string;
        current_balance: number;
    }>;
    sourceAccounts: Array<{
        id: string;
        code: string;
        name: string;
        type: string;
    }>;
    metrics: {
        total_inflow: number;
        capital_deposit_total: number;
        other_inflow_total: number;
        total_cash_balance: number;
    };
    isPeriodLocked?: boolean;
    auditLogs?: Array<{
        id: string;
        event: string;
        description: string;
        user_name: string;
        created_at: string;
    }>;
}
```

---

## 2. Catat Transaksi Penerimaan Kas Baru

- **Endpoint:** `POST /cash-in`
- **Tujuan:** Menyimpan data penerimaan kas dan otomatis memposting jurnal debet kas & kredit sumber dana.
- **Content-Type:** `multipart/form-data`

### Request Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deposit_account_id` | string (UUID) | Yes | ID akun kas/bank penerima dana (Leaf Node) |
| `source_account_id` | string (UUID) | Yes | ID akun sumber dana (Leaf Node: Modal/Hutang/Pendapatan/Equity) |
| `amount` | number / string | Yes | Nominal uang masuk (> 0) |
| `transaction_date` | string (YYYY-MM-DD) | Yes | Tanggal penerimaan uang |
| `payer` | string | No | Nama penyetor/sumber dana (misal: "Owner - Bapak Jojo") |
| `description` | string | Yes | Keterangan/memo transaksi |
| `project_id` | string (UUID) | No | Tagging proyek analitis (opsional) |
| `attachment` | file (image/pdf) | No | Bukti transfer / slip setoran (maks. 5MB) |

---

## 3. Pembatalan Transaksi Kas Masuk (Void)

- **Endpoint:** `POST /cash-in/{cashInTransaction}/void`
- **Tujuan:** Membatalkan transaksi kas masuk dengan menerbitkan Jurnal Pembalik (*Reversing Journal Entry*).

### Request Payload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `void_reason` | string | Yes | Alasan pembatalan transaksi kas masuk |
