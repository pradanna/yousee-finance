# Financial Projection Contract (CDC)

**Feature**: Proyeksi Keuangan & Arus Kas Jangka Pendek (7 & 14 Hari)
**Route**: `GET /projection` -> `Accounting/FinancialProjection`
**Role Access**: `admin`, `pimpinan`

---

## 1. Query Parameters
- `days`: `7` | `14` | `30` (default: `7` atau `14`)
- `fiscal_mode`: `all` | `ppn` | `non-ppn` (default: from header `X-Fiscal-Mode` or query)

---

## 2. Inertia Props Structure

```json
{
  "fiscal_mode": "ppn",
  "filters": {
    "days": 14,
    "start_date": "2026-09-28",
    "end_date": "2026-10-12",
    "fiscal_mode": "ppn"
  },
  "summary": {
    "current_cash_balance": 150000000.0,
    "projected_inflow_total": 85000000.0,
    "projected_outflow_po_total": 45000000.0,
    "projected_outflow_ppn_total": 12500000.0,
    "projected_outflow_total": 57500000.0,
    "projected_net_cashflow": 27500000.0,
    "projected_ending_cash_balance": 177500000.0,
    "crosses_month_end": true,
    "month_end_date": "2026-09-30",
    "ppn_month": 9,
    "ppn_year": 2026,
    "ppn_keluaran_total": 25000000.0,
    "ppn_masukan_total": 12500000.0,
    "ppn_net_payable": 12500000.0,
    "ppn_is_settled": false
  },
  "timeline": [
    {
      "date": "2026-09-28",
      "day_name": "Senin",
      "inflow": 0.0,
      "outflow_po": 0.0,
      "outflow_ppn": 0.0,
      "total_outflow": 0.0,
      "net": 0.0,
      "running_balance": 150000000.0,
      "inflow_count": 0,
      "outflow_count": 0
    }
  ],
  "inflow_items": [
    {
      "id": "term-1",
      "invoice_id": "inv-1",
      "invoice_number": "INV-202609-001",
      "client_id": "client-1",
      "client_name": "PT. ABC Advertising",
      "project_id": "prj-1",
      "project_code": "PRJ-2026-PPN01",
      "project_name": "Billboard Thamrin",
      "label": "Termin 1 (50%)",
      "due_date": "2026-10-02",
      "total_term_amount": 50000000.0,
      "paid_amount": 0.0,
      "remaining_amount": 50000000.0,
      "status": "unpaid",
      "is_overdue": false
    }
  ],
  "outflow_items": [
    {
      "id": "term-po-1",
      "po_id": "po-1",
      "po_number": "PO-202609-001",
      "vendor_id": "vendor-1",
      "vendor_name": "CV. Surya Billboard",
      "project_id": "prj-1",
      "project_code": "PRJ-2026-PPN01",
      "project_name": "Billboard Thamrin",
      "label": "DP 30%",
      "due_date": "2026-09-30",
      "total_term_amount": 30000000.0,
      "paid_amount": 0.0,
      "remaining_amount": 30000000.0,
      "status": "unpaid",
      "is_overdue": false,
      "type": "po"
    },
    {
      "id": "ppn-settlement-item",
      "po_id": null,
      "po_number": "SETOR-PPN-092026",
      "vendor_id": null,
      "vendor_name": "Kas Negara (DJP / Pajak)",
      "project_id": null,
      "project_code": "TAX-PPN",
      "project_name": "Penyetoran PPN Masa September 2026",
      "label": "Estimasi Kurang Bayar PPN Akhir Bulan",
      "due_date": "2026-09-30",
      "total_term_amount": 12500000.0,
      "paid_amount": 0.0,
      "remaining_amount": 12500000.0,
      "status": "unpaid",
      "is_overdue": false,
      "type": "ppn"
    }
  ]
}
```
