// ─────────────────────────────────────────────────────────────────────────────
// Purchases — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const PPN_RATE = 0.11;

export const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

export const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return dateStr;
    }
};

export interface VendorPaymentTerm {
    type: "full" | "dp" | "termin";
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
    id: string;
    poNumber: string;
    termLabel: string;   // e.g. "Termin 1 – DP", "Pelunasan", "Full Payment"
    amount: number;
    date: string;        // ISO date string
    method: string;      // e.g. "Transfer Bank BCA"
    referenceNo: string;
    notes: string;
}

export interface VendorPO {
    poNumber: string;
    vendorId: number;
    vendorName: string;
    paymentTerms: VendorPaymentTerm;
    issuedAt: string;
    totalAmount: number;
    // Fields from IssuePOModal — used for PDF generation
    lighting?: string;
    topNotes?: string;
    // Payment records for this PO
    payments?: VendorPaymentRecord[];
}

export interface BillboardLocation {
    id: number;
    code: string;
    area: string;
    description: string;
    type: "Billboard" | "Videotron" | "Baliho" | "Neonbox";
    size: string;
    vendorId: number | null;
    vendorName: string;
    qty?: number;
    vendorCost: number;
    poIssued: boolean;
    poNumber: string;
}

export interface PurchaseProject {
    id: number;
    code: string;
    name: string;
    clientId: number;
    clientName: string;
    salesPIC: string;
    period: string;
    contractValue: number;
    status: "Draft" | "Active" | "Completed" | "Cancelled";
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    targetQty: number;
}
