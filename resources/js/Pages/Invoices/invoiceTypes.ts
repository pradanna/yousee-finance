// ─────────────────────────────────────────────────────────────────────────────
// Invoice & Billing — Type Definitions & Helpers
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

export interface InvoicePaymentRecord {
    id: string;
    invoiceNumber: string;
    termLabel: string; // e.g. "DP 50%", "Pelunasan", "Termin 1"
    amount: number;
    date: string; // ISO date string
    method: string; // e.g. "Transfer Bank BCA", "Transfer Bank Mandiri"
    referenceNo: string;
    notes: string;
}

export interface Kwitansi {
    receiptNumber: string;
    amount: number;
    paidAt: string;
    receivedFrom: string;
    forPaymentOf: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid';
export type InvoicePaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface InvoiceData {
    id: number;
    invoiceNumber: string;
    projectId: number;
    projectCode: string;
    projectName: string;
    clientId: number;
    clientName: string;
    salesPIC: string;
    status: InvoiceStatus;
    transactionDate: string;
    dueDate: string;
    subtotal: number;
    ppn: number;
    totalAmount: number;
    payments?: InvoicePaymentRecord[];
    kwitansi?: Kwitansi;
}

export const getInvoicePaymentSummary = (inv: {
    totalAmount: number;
    payments?: InvoicePaymentRecord[];
    status: InvoiceStatus;
}) => {
    const totalPaid = (inv.payments || []).reduce(
        (sum, p) => sum + p.amount,
        0,
    );
    const remaining = Math.max(0, inv.totalAmount - totalPaid);

    let paymentStatus: InvoicePaymentStatus = 'unpaid';
    if (totalPaid >= inv.totalAmount && inv.totalAmount > 0) {
        paymentStatus = 'paid';
    } else if (totalPaid > 0) {
        paymentStatus = 'partial';
    }

    return {
        totalPaid,
        remaining,
        paymentStatus,
        percentage:
            inv.totalAmount > 0
                ? Math.min(100, Math.round((totalPaid / inv.totalAmount) * 100))
                : 0,
    };
};
