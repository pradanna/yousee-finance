// ─────────────────────────────────────────────────────────────────────────────
// Types — Projects Module
// ─────────────────────────────────────────────────────────────────────────────

// ─── Payment Terms ────────────────────────────────────────────────────────────

export type PaymentScheme = 'full' | 'dp' | 'termin' | 'installment';
export type PaymentTermStatus = 'unpaid' | 'paid' | 'overdue';
export type PaymentDocumentType = 'invoice' | 'po';

export interface PaymentTerm {
    id: string;
    label: string; // e.g. "DP 30%", "Termin 1", "Cicilan 2", "Pelunasan"
    amount: number; // Jumlah nominal
    percent: number; // Persentase dari total (0–100)
    dueDate: string; // ISO date string
    status: PaymentTermStatus;
    paidAmount?: number; // Realisasi nominal yang dibayar (bisa partial / full)
    paidAt?: string; // Tanggal realisasi bayar (ISO date)
    paymentMethod?: string; // e.g. "Transfer Bank BCA"
    paymentRef?: string; // No. Ref / Catatan Bukti Pembayaran
    notes?: string;
}

export interface ClientPaymentPlan {
    scheme: PaymentScheme;
    totalAmount: number; // Total invoice (sudah termasuk PPN jika ada)
    terms: PaymentTerm[];
    notes?: string;
    createdAt: string;
}

// Helper: hitung ringkasan dari payment plan
export function calcPaymentSummary(plan: ClientPaymentPlan): {
    totalPaid: number;
    totalRemaining: number;
    progressPercent: number;
    paidCount: number;
    totalCount: number;
    nextDue: PaymentTerm | null;
} {
    const totalPaid = plan.terms.reduce(
        (s, t) => s + (t.paidAmount || (t.status === 'paid' ? t.amount : 0)),
        0,
    );
    const paidTerms = plan.terms.filter((t) => t.status === 'paid');
    const totalRemaining = Math.max(0, plan.totalAmount - totalPaid);
    const progressPercent =
        plan.totalAmount > 0
            ? Math.min(100, Math.round((totalPaid / plan.totalAmount) * 100))
            : 0;

    const unpaidTerms = plan.terms
        .filter((t) => t.status !== 'paid')
        .sort(
            (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
    const nextDue = unpaidTerms[0] ?? null;

    return {
        totalPaid,
        totalRemaining,
        progressPercent,
        paidCount: paidTerms.length,
        totalCount: plan.terms.length,
        nextDue,
    };
}

export const SCHEME_LABELS: Record<PaymentScheme, string> = {
    full: 'Lunas Sekaligus',
    dp: 'DP + Pelunasan',
    termin: 'Termin / Milestone',
    installment: 'Cicilan Berkala',
};

// ─── Legacy VendorPaymentTerm (kept for backward compat) ─────────────────────

export interface VendorPaymentTerm {
    type: 'full' | 'dp' | 'termin';
    notes?: string;

    fullDueDays?: number;
    fullDueDate?: string;

    dpPercent?: number;
    dpAmount?: number;
    dpDueDays?: number;
    dpDueDate?: string;
    pelunasanDueDays?: number;
    pelunasanDueDate?: string;

    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
}

export interface VendorPO {
    poNumber: string;
    vendorId: number;
    vendorName: string;
    paymentTerms: VendorPaymentTerm;
    issuedAt: string;
    totalAmount: number;
}

// ─── Billboard & Project ──────────────────────────────────────────────────────

export interface BillboardLocation {
    id: number;
    code: string;
    area: string;
    description: string;
    type: 'Billboard' | 'Videotron' | 'Baliho' | 'Neonbox';
    size: string;
    vendorId: number | null;
    vendorName: string;
    qty?: number;
    vendorCost: number;
    poIssued: boolean;
    poNumber: string;
    orientation?: 'V' | 'H';
    lighting?: 'Berlampu' | 'Tidak Berlampu';
    topNotes?: string;
    vendorTermScheme?: PaymentScheme;
    vendorTermPercents?: number[];
    vendorTermDates?: string[];
}

export interface VendorPaymentRecord {
    id: string;
    poNumber: string;
    vendorName: string;
    amount: number; // Nominal pembayaran keluar ke vendor
    paidAt: string; // Tanggal bayar (ISO date)
    paymentMethod: string; // e.g. "Transfer Bank BCA"
    paymentRef?: string; // Bukti transfer / No. Ref
    notes?: string;
}

export interface Project {
    id: number;
    code: string;
    name: string;
    clientId: number;
    clientName: string;
    salesPIC: string;
    period: string;
    contractValue: number;
    status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    targetQty: number;
    paymentTerms?: VendorPaymentTerm;
    clientPaymentPlan?: ClientPaymentPlan;
    vendorPayments?: VendorPaymentRecord[];
}

export type ActiveTab = 'info' | 'locations' | 'vendors' | 'invoice';
export type FiscalMode = 'ppn' | 'non-ppn';
export type ViewMode = 'grid' | 'kanban' | 'table';

export const PPN_RATE = 0.11;

export { mockClients, mockSalesPICs, mockVendors } from './projectData';

export const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export function formatIndoDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function calcFinancials(
    project: Project,
    locations: BillboardLocation[],
    fiscalMode: FiscalMode,
) {
    const isPPN = fiscalMode === 'ppn';
    const dpp = project.contractValue;
    const ppnKeluaran = isPPN ? dpp * PPN_RATE : 0;
    const totalInvoice = dpp + ppnKeluaran;

    const totalDppVendor = locations.reduce(
        (s, l) => s + l.vendorCost * (l.qty || 1),
        0,
    );
    const ppnMasukan = isPPN ? totalDppVendor * PPN_RATE : 0;
    const totalPO = totalDppVendor + ppnMasukan;

    const netProfit = dpp - totalDppVendor;
    const ppnNet = ppnKeluaran - ppnMasukan;
    const margin = dpp > 0 ? (netProfit / dpp) * 100 : 0;

    return {
        dpp,
        ppnKeluaran,
        totalInvoice,
        totalDppVendor,
        ppnMasukan,
        totalPO,
        netProfit,
        ppnNet,
        margin,
    };
}
