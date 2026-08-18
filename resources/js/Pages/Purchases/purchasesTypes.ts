// ─────────────────────────────────────────────────────────────────────────────
// Purchases — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const PPN_RATE = 0.11;

export const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export { formatPeriod, formatIndoPeriod } from '@/Utils/formatters';

export interface VendorPaymentTerm {
    type: 'full' | 'dp' | 'termin';
    notes?: string;

    // For Full Payment
    fullDueDays?: number;
    fullDueDate?: string;

    // For DP + Pelunasan
    dpPercent?: number;
    dpAmount?: number;
    dpDueDays?: number;
    dpDueDate?: string;
    pelunasanDueDays?: number;
    pelunasanDueDate?: string;

    // For Termin
    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
}

export interface VendorPaymentRecord {
    id: string | number;
    poNumber: string;
    termLabel: string; // e.g. "Termin 1 – DP", "Pelunasan", "Full Payment"
    amount: number;
    date: string; // ISO date string
    method: string; // e.g. "Transfer Bank BCA", "Kas Kecil"
    referenceNo: string;
    notes: string;
}

export type POPaymentStatus = 'unpaid' | 'partial' | 'paid';

export const getPOPaymentSummary = (po: VendorPO) => {
    const totalPaid = (po.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, po.totalAmount - totalPaid);
    let status: POPaymentStatus = 'unpaid';

    if (totalPaid >= po.totalAmount && po.totalAmount > 0) {
        status = 'paid';
    } else if (totalPaid > 0) {
        status = 'partial';
    }

    return {
        totalPaid,
        remaining,
        status,
        percentage:
            po.totalAmount > 0
                ? Math.min(100, Math.round((totalPaid / po.totalAmount) * 100))
                : 0,
    };
};

export interface VendorPaymentSettlementDB {
    id: string | number;
    amount: number;
    paid_at: string;
    payment_method: string;
    payment_ref?: string | null;
    notes?: string | null;
}

export interface VendorPaymentTermDB {
    id: string | number;
    sort_order: number;
    label: string;
    amount: number;
    percent: number;
    due_date?: string;
    status: 'unpaid' | 'paid' | 'overdue';
    notes?: string | null;
    settlements?: VendorPaymentSettlementDB[];
}

export interface VendorPaymentPlanDB {
    id: string | number;
    scheme: 'full' | 'dp' | 'termin' | 'installment';
    total_amount: number;
    notes?: string | null;
    terms: VendorPaymentTermDB[];
}

export interface VendorPO {
    id?: string | number;
    projectId?: string | number;
    poNumber: string;
    vendorId: number;
    vendorName: string;
    paymentTerms: VendorPaymentTerm;
    issuedAt: string;
    totalAmount: number;
    // Fields from IssuePOModal — used for PDF generation
    lighting?: string;
    topNotes?: string;
    notes?: string;
    // Payment records for this PO
    payments?: VendorPaymentRecord[];
    // Real database payment plan relation
    payment_plan?: VendorPaymentPlanDB | null;
}

export interface BillboardLocation {
    id: number | string;
    code: string;
    area: string;
    description: string;
    type: 'Billboard' | 'Videotron' | 'Baliho' | 'Neonbox' | string;
    size: string;
    vendorId: number | string | null;
    vendorName: string;
    vendor_id?: number | string | null;
    vendor_name?: string;
    vendor?: { id: number | string; name: string };
    qty?: number;
    vendorCost: number;
    vendor_cost?: number;
    poIssued: boolean;
    po_issued?: boolean;
    poNumber: string;
    po_number?: string;
    purchaseOrderId?: string | number;
    purchase_order_id?: string | number;
}

export interface PurchaseProject {
    id: number | string;
    code: string;
    name: string;
    clientId: number | string;
    client_id?: number | string;
    client?: { id: number | string; name: string };
    clientName: string;
    client_name?: string;
    sales_id?: number | string;
    sales?: { id: number | string; name: string };
    salesPIC: string;
    sales_pic?: string;
    start_date?: string;
    end_date?: string;
    period: string;
    contractValue: number;
    contract_value?: number;
    status: 'Draft' | 'Active' | 'Completed' | 'Cancelled' | string;
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoice_issued?: boolean;
    invoiceNumber: string;
    invoice_number?: string;
    targetQty: number;
    target_qty?: number;
    fiscal_mode?: 'ppn' | 'non-ppn';
    purchase_orders?: Array<{
        id: string | number;
        po_number: string;
        vendor_id: number;
        vendor?: { id: number; name: string };
        transaction_date?: string;
        issued_at?: string;
        subtotal: number;
        ppn: number;
        total: number;
        status?: string;
        notes?: string;
        items?: Array<{
            id: string | number;
            project_location_id: string | number;
            name: string;
            quantity: number;
            price: number;
        }>;
        payment_plan?: VendorPaymentPlanDB | null;
    }>;
}

export interface PurchasesPageProps {
    projects?: PurchaseProject[];
    vendors?: Array<{ id: number; name: string }>;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
}
