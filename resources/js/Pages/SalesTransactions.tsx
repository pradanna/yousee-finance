import { ConfigurePaymentSchemeModal } from '@/Components/Modal/ConfigurePaymentSchemeModal';
import type { RecordInvoicePaymentModalSubmitData } from '@/Components/Modal/RecordInvoicePaymentModal';
import { RecordInvoicePaymentModal } from '@/Components/Modal/RecordInvoicePaymentModal';
import Pagination from '@/Components/Table/Pagination';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import type {
    InvoicePaymentRecord,
    Kwitansi,
} from '@/Pages/Invoices/invoiceTypes';
import { router } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface InvoicePaymentTerm {
    type: 'full' | 'dp' | 'termin' | 'installment';
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

interface BillboardLocation {
    id: string | number;
    code: string;
    area: string;
    description: string;
    type: string;
    size: string;
    vendorId: string | number | null;
    vendorName: string;
    qty?: number;
    vendorCost: number;
    poIssued: boolean;
    poNumber: string;
}

interface PaymentSettlementItem {
    id: string;
    amount: number;
    paid_at: string;
    payment_method: string;
    payment_ref?: string | null;
    notes?: string | null;
}

interface PaymentPlanTermItem {
    id: string;
    sort_order: number;
    label: string;
    amount: number;
    percent: number;
    due_date?: string;
    status: string;
    notes?: string | null;
    settlements?: PaymentSettlementItem[];
}

interface ProjectInvoiceItem {
    id: string;
    invoice_number?: string;
    status?: string;
    subtotal: number;
    ppn: number;
    total: number;
    transaction_date?: string;
    due_date?: string;
    payment_plan?: {
        id: string;
        scheme?: string;
        total_amount: number;
        notes?: string;
        terms: PaymentPlanTermItem[];
    } | null;
}

interface Project {
    id: string | number;
    code: string;
    name: string;
    clientId: string | number;
    clientName: string;
    salesPIC: string;
    period: string;
    contractValue: number;
    status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    invoiceIssuedAt?: string;
    targetQty: number;
    fiscal_mode?: 'ppn' | 'non-ppn';
    paymentTerms?: InvoicePaymentTerm;
    invoices?: ProjectInvoiceItem[];
}

interface SalesTransactionProps {
    projects: Array<{
        id: string;
        code: string;
        name: string;
        client_id: string;
        client?: { id: string; name: string };
        client_name?: string;
        sales_id?: string;
        sales?: { id: string; name: string };
        sales_pic?: string;
        fiscal_mode: 'ppn' | 'non-ppn';
        start_date: string;
        end_date: string;
        contract_value: number;
        target_qty: number;
        status: 'draft' | 'active' | 'completed' | 'cancelled';
        notes?: string;
        locations?: Array<{
            id: string;
            code: string;
            area: string;
            description: string;
            type: string;
            size: string;
            vendor_id?: string;
            vendor?: { id: string; name: string };
            vendor_cost: number;
            po_issued: boolean;
            po_number?: string;
        }>;
        invoices?: ProjectInvoiceItem[];
        invoice_issued?: boolean;
        invoice_number?: string;
    }>;
    clients: Array<{ id: string; name: string }>;
    sales: Array<{ id: string; name: string }>;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
}

const PPN_RATE = 0.11;
const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;
const formatDate = (dateStr?: string): string => {
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

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────
const ProjectStatusBadge = ({ status }: { status: Project['status'] }) => {
    const map: Record<
        Project['status'],
        { bg: string; dot: string; text: string }
    > = {
        Draft: {
            bg: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-400',
            text: 'Draft',
        },
        Active: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
            text: 'Active',
        },
        Completed: {
            bg: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
            text: 'Selesai',
        },
        Cancelled: {
            bg: 'bg-red-50 text-red-700 border-red-200',
            dot: 'bg-red-500',
            text: 'Dibatalkan',
        },
    };
    const s = map[status] || map.Draft;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

const InvoiceStatusBadge = ({
    status,
}: {
    status: 'draft' | 'issued' | 'partial' | 'paid';
}) => {
    const map = {
        draft: {
            bg: 'bg-slate-100 text-slate-600 border-slate-200',
            dot: 'bg-slate-400',
            text: 'DRAFT',
        },
        issued: {
            bg: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500 animate-pulse',
            text: 'ISSUED',
        },
        partial: {
            bg: 'bg-amber-50 text-amber-800 border-amber-300',
            dot: 'bg-amber-500 animate-pulse',
            text: 'PARTIAL',
        },
        paid: {
            bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
            dot: 'bg-emerald-600',
            text: 'PAID / LUNAS',
        },
    };
    const s = map[status] || map.draft;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesTransactions({
    projects: rawProjects = [],
    clients = [],
    sales = [],
    cashBankAccounts = [],
}: SalesTransactionProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // Normalize raw projects from backend to match frontend Project shape
    const formattedProjects: Project[] = rawProjects.map((p) => {
        const primaryInv = p.invoices?.[0];
        const hasIssuedInvoice = p.invoice_issued || (primaryInv && primaryInv.status !== 'draft') || false;
        const invNumber = p.invoice_number || primaryInv?.invoice_number || '';
        
        let paymentTerms: InvoicePaymentTerm | undefined = undefined;
        if (primaryInv?.payment_plan) {
            const plan = primaryInv.payment_plan;
            const terms = plan.terms || [];
            if (plan.scheme === 'full') {
                paymentTerms = {
                    type: 'full',
                    fullDueDate: terms[0]?.due_date,
                    notes: plan.notes || undefined,
                };
            } else if (plan.scheme === 'dp') {
                paymentTerms = {
                    type: 'dp',
                    dpPercent: terms[0]?.percent,
                    dpAmount: terms[0]?.amount,
                    dpDueDate: terms[0]?.due_date,
                    pelunasanDueDate: terms[1]?.due_date,
                    notes: plan.notes || undefined,
                };
            } else if (plan.scheme === 'termin') {
                paymentTerms = {
                    type: 'termin',
                    installments: terms.map((t) => ({
                        percent: t.percent,
                        amount: t.amount,
                        note: t.label,
                        dueDate: t.due_date,
                    })),
                    notes: plan.notes || undefined,
                };
            } else if (plan.scheme === 'installment') {
                paymentTerms = {
                    type: 'installment',
                    fullDueDate: terms[0]?.due_date,
                    notes: plan.notes || undefined,
                };
            }
        }

        return {
            id: p.id,
            code: p.code,
            name: p.name,
            clientId: p.client_id,
            clientName: p.client?.name || p.client_name || 'Client',
            salesPIC: p.sales?.name || p.sales_pic || '-',
            period: `${p.start_date || ''} - ${p.end_date || ''}`,
            contractValue: Number(p.contract_value || 0),
            status: (p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : 'Draft') as Project['status'],
            locations: (p.locations || []).map((loc) => ({
                id: loc.id,
                code: loc.code,
                area: loc.area,
                description: loc.description,
                type: loc.type,
                size: loc.size,
                vendorId: loc.vendor_id || null,
                vendorName: loc.vendor?.name || 'Vendor',
                qty: 1,
                vendorCost: Number(loc.vendor_cost || 0),
                poIssued: loc.po_issued,
                poNumber: loc.po_number || '',
            })),
            invoiceIssued: hasIssuedInvoice,
            invoiceNumber: invNumber,
            invoiceIssuedAt: primaryInv?.transaction_date,
            targetQty: p.target_qty || 1,
            fiscal_mode: p.fiscal_mode,
            paymentTerms,
            invoices: p.invoices,
        };
    });

    // Filter projects based on active fiscal mode
    const projects = formattedProjects.filter((p) => {
        if (p.fiscal_mode) {
            return p.fiscal_mode === fiscalMode;
        }
        return true;
    });

    // Initial state from URL query parameters (?project=103&tab=issued)
    const [selectedProjectId, setSelectedProjectIdState] = useState<string | number | null>(() => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const pId = params.get('project');
        return pId || null;
    });

    const [activeTab, setActiveTabState] = useState<
        'all' | 'pending' | 'issued' | 'ar_schedule'
    >(() => {
        if (typeof window === 'undefined') return 'all';
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['all', 'pending', 'issued', 'ar_schedule'].includes(tab)) {
            return tab as any;
        }
        return 'all';
    });

    const setSelectedProjectId = (id: string | number | null) => {
        setSelectedProjectIdState(id);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (id !== null) {
                url.searchParams.set('project', String(id));
            } else {
                url.searchParams.delete('project');
            }
            window.history.replaceState({}, '', url.toString());
        }
    };

    const setActiveTab = (
        tab: 'all' | 'pending' | 'issued' | 'ar_schedule',
    ) => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const pId = params.get('project');
            setSelectedProjectIdState(pId || null);
            const tab = params.get('tab');
            if (
                tab &&
                ['all', 'pending', 'issued', 'ar_schedule'].includes(tab)
            ) {
                setActiveTabState(tab as any);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const [expandedInvoicePayment, setExpandedInvoicePayment] = useState<
        string | null
    >(null);
    const [filterSalesPIC, setFilterSalesPIC] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    // Pagination
    const ITEMS_PER_PAGE = 6;
    const [allPage, setAllPage] = useState(1);
    const [pendingPage, setPendingPage] = useState(1);
    const [issuedPage, setIssuedPage] = useState(1);
    const [arPage, setArPage] = useState(1);

    // Derive paymentsByInvoice & kwitansiByInvoice directly from DB settlements
    const paymentsByInvoice: Record<string, InvoicePaymentRecord[]> = {};
    const kwitansiByInvoice: Record<string, Kwitansi> = {};

    formattedProjects.forEach((p) => {
        const inv = p.invoices?.[0];
        if (!inv || !p.invoiceNumber) return;
        const invNum = p.invoiceNumber;
        const pmtList: InvoicePaymentRecord[] = [];

        inv.payment_plan?.terms.forEach((term) => {
            (term.settlements || []).forEach((set) => {
                pmtList.push({
                    id: set.id,
                    invoiceNumber: invNum,
                    termLabel: term.label,
                    amount: Number(set.amount),
                    date: set.paid_at,
                    method: set.payment_method,
                    referenceNo: set.payment_ref || '',
                    notes: set.notes || `Pembayaran ${term.label} (${set.payment_method})`,
                });
            });
        });

        if (pmtList.length > 0) {
            paymentsByInvoice[invNum] = pmtList;
            const totalPaid = pmtList.reduce((s, pay) => s + pay.amount, 0);
            const totalInvVal = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);
            if (totalPaid >= totalInvVal) {
                const latestPaid = pmtList[pmtList.length - 1];
                kwitansiByInvoice[invNum] = {
                    receiptNumber: `KW-${invNum}`,
                    amount: totalInvVal,
                    paidAt: latestPaid?.date || new Date().toISOString().split('T')[0],
                    receivedFrom: p.clientName,
                    forPaymentOf: `Pelunasan Sewa Media Iklan - ${p.name}`,
                };
            }
        }
    });

    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
        useState<Project | null>(null);
    const [selectedPaymentTerm, setSelectedPaymentTerm] =
        useState<PaymentPlanTermItem | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const activeProject = projects.find((p) => String(p.id) === String(selectedProjectId));

    // ── Derived data ──────────────────────────────────────────────────────────
    const allSalesPICs = Array.from(
        new Set(projects.map((p) => p.salesPIC)),
    ).sort();

    const filteredProjects = projects.filter((p) => {
        const matchSearch =
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSales =
            filterSalesPIC === 'all' || p.salesPIC === filterSalesPIC;
        return matchSearch && matchSales;
    });

    const issuedProjects = filteredProjects.filter((p) => p.invoiceIssued);
    const pendingProjects = filteredProjects.filter((p) => !p.invoiceIssued);

    // Metric summary
    const totalIssued = projects.filter((p) => p.invoiceIssued).length;
    const totalPending = projects.filter((p) => !p.invoiceIssued).length;
    const totalARValue = issuedProjects.reduce((s, p) => {
        const invNum = p.invoiceNumber;
        const total = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);
        const paid = (paymentsByInvoice[invNum] || []).reduce(
            (sum, pay) => sum + pay.amount,
            0,
        );
        return s + Math.max(0, total - paid);
    }, 0);
    const totalRealized = issuedProjects.reduce((s, p) => {
        const invNum = p.invoiceNumber;
        return (
            s +
            (paymentsByInvoice[invNum] || []).reduce(
                (sum, pay) => sum + pay.amount,
                0,
            )
        );
    }, 0);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleConfigurePaymentPlan = (data: {
        scheme: 'full' | 'dp' | 'termin' | 'installment';
        termPercents: number[];
        termDates: string[];
        notes?: string;
    }) => {
        if (!activeProject) return;

        router.post(
            `/projects/${activeProject.id}/payment-plan`,
            {
                scheme: data.scheme,
                percents: data.termPercents,
                due_dates: data.termDates,
                notes: data.notes,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowInvoiceForm(false);
                    setSuccessMessage(
                        `Skema pembayaran untuk ${activeProject.name} berhasil disimpan!`,
                    );
                    setTimeout(() => setSuccessMessage(''), 4000);
                },
            },
        );
    };

    const handleIssueOfficialInvoice = () => {
        if (!activeProject) return;

        router.post(
            `/projects/${activeProject.id}/invoice/issue`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSuccessMessage(
                        `Invoice resmi berhasil diterbitkan untuk ${activeProject.clientName}!`,
                    );
                    setTimeout(() => setSuccessMessage(''), 4000);
                },
            },
        );
    };

    const handleSaveInvoicePayment = (
        data: RecordInvoicePaymentModalSubmitData,
    ) => {
        if (!selectedInvoiceForPayment) return;

        // Find target payment term id from invoice
        const primaryInv = selectedInvoiceForPayment.invoices?.[0];
        const terms = primaryInv?.payment_plan?.terms || [];
        
        let targetTerm = selectedPaymentTerm;
        if (!targetTerm) {
            targetTerm = terms.find((t: PaymentPlanTermItem) => t.status !== 'paid') || terms[0] || null;
        }

        if (!targetTerm) {
            alert('Tidak ditemukan data termin untuk dicatat pembayarannya.');
            return;
        }

        router.post(
            `/projects/${selectedInvoiceForPayment.id}/invoice/payment-terms/${targetTerm.id}/settle`,
            {
                amount: data.amount,
                paid_at: data.date,
                payment_method: data.method,
                account_id: data.account_id || null,
                payment_ref: data.referenceNo || null,
                notes: data.notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowRecordPaymentModal(false);
                    setSelectedInvoiceForPayment(null);
                    setSelectedPaymentTerm(null);
                    setSuccessMessage(
                        `Berhasil mencatat penerimaan ${fmt(data.amount)}!`,
                    );
                    setTimeout(() => setSuccessMessage(''), 4000);
                },
            },
        );
    };

    // ── Active project computed values ────────────────────────────────────────
    const activeInvNum = activeProject?.invoiceNumber || '';
    const activeTotalAmount = activeProject
        ? activeProject.contractValue * (isPPN ? 1 + PPN_RATE : 1)
        : 0;
    const activePayments = paymentsByInvoice[activeInvNum] || [];
    const activeKwitansi = kwitansiByInvoice[activeInvNum];
    const activeTotalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
    const activeRemaining = Math.max(0, activeTotalAmount - activeTotalPaid);
    const activeInvoiceStatus: 'draft' | 'issued' | 'partial' | 'paid' =
        !activeProject?.invoiceIssued
            ? 'draft'
            : activeTotalPaid >= activeTotalAmount
              ? 'paid'
              : activeTotalPaid > 0
                ? 'partial'
                : 'issued';

    const activeScheduleItems = activeProject
        ? (() => {
              const total = activeTotalAmount;
              const terms = activeProject.paymentTerms;
              if (!terms) {
                  return [
                      {
                          label: 'Pelunasan Full (100%)',
                          percent: 100,
                          dueDate: undefined,
                          amount: total,
                      },
                  ];
              }
              if (terms.type === 'full') {
                  return [
                      {
                          label: 'Full Payment (100%)',
                          percent: 100,
                          dueDate: terms.fullDueDate,
                          amount: total,
                      },
                  ];
              }
              if (terms.type === 'dp') {
                  const dpPct = terms.dpPercent || 50;
                  const dpAmt =
                      terms.dpAmount || Math.round(total * (dpPct / 100));
                  return [
                      {
                          label: `Uang Muka (DP ${dpPct}%)`,
                          percent: dpPct,
                          dueDate: terms.dpDueDate,
                          amount: dpAmt,
                      },
                      {
                          label: `Pelunasan (${100 - dpPct}%)`,
                          percent: 100 - dpPct,
                          dueDate: terms.pelunasanDueDate,
                          amount: total - dpAmt,
                      },
                  ];
              }
              if (terms.type === 'termin' && terms.installments) {
                  return terms.installments.map((inst, i) => ({
                      label: inst.note || `Termin ${i + 1}`,
                      percent: inst.percent,
                      dueDate: inst.dueDate,
                      amount: inst.amount,
                  }));
              }
              if (terms.type === 'installment') {
                  return [
                      {
                          label: 'Cicilan Bulanan',
                          percent: 100,
                          dueDate: terms.fullDueDate,
                          amount: total,
                      },
                  ];
              }
              return [
                  {
                      label: 'Pembayaran Invoice',
                      percent: 100,
                      dueDate: undefined,
                      amount: total,
                  },
              ];
          })()
        : [];

    // ── Helper: get invoice status for a project ──────────────────────────────
    const getProjectInvoiceStatus = (
        p: Project,
    ): 'draft' | 'issued' | 'partial' | 'paid' => {
        if (!p.invoiceIssued) return 'draft';
        const paid = (paymentsByInvoice[p.invoiceNumber] || []).reduce(
            (s, pay) => s + pay.amount,
            0,
        );
        const total = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);
        if (paid >= total) return 'paid';
        if (paid > 0) return 'partial';
        return 'issued';
    };

    // ── AR Schedule items ─────────────────────────────────────────────────────
    const arScheduleItems = issuedProjects
        .flatMap((p) => {
            const total = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);
            const invStatus = getProjectInvoiceStatus(p);
            const terms = p.paymentTerms;
            if (!terms)
                return [
                    {
                        project: p,
                        label: 'Pembayaran Invoice',
                        dueDate: undefined,
                        amount: total,
                        invStatus,
                    },
                ];
            if (terms.type === 'full')
                return [
                    {
                        project: p,
                        label: 'Full Payment',
                        dueDate: terms.fullDueDate,
                        amount: total,
                        invStatus,
                    },
                ];
            if (terms.type === 'dp')
                return [
                    {
                        project: p,
                        label: `DP ${terms.dpPercent || 50}%`,
                        dueDate: terms.dpDueDate,
                        amount: terms.dpAmount || Math.round(total * 0.5),
                        invStatus,
                    },
                    {
                        project: p,
                        label: 'Pelunasan',
                        dueDate: terms.pelunasanDueDate,
                        amount:
                            total - (terms.dpAmount || Math.round(total * 0.5)),
                        invStatus,
                    },
                ];
            if (terms.type === 'termin' && terms.installments)
                return terms.installments.map((inst, i) => ({
                    project: p,
                    label: inst.note || `Termin ${i + 1}`,
                    dueDate: inst.dueDate,
                    amount: inst.amount,
                    invStatus,
                }));
            if (terms.type === 'installment')
                return [
                    {
                        project: p,
                        label: 'Cicilan Bulanan',
                        dueDate: terms.fullDueDate,
                        amount: total,
                        invStatus,
                    },
                ];
            return [
                {
                    project: p,
                    label: 'Pembayaran Invoice',
                    dueDate: undefined,
                    amount: total,
                    invStatus,
                },
            ];
        })
        .sort((a, b) => {
            const da = a.dueDate
                ? new Date(a.dueDate).getTime()
                : 9999999999999;
            const db = b.dueDate
                ? new Date(b.dueDate).getTime()
                : 9999999999999;
            return da - db;
        });

    const getDueDateStatus = (dueDate?: string) => {
        if (!dueDate)
            return {
                label: 'Belum Terjadwal',
                style: 'bg-slate-100 text-slate-600 border-slate-200',
                dot: 'bg-slate-400',
            };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (diff < 0)
            return {
                label: `Telah Lewat (${Math.abs(diff)} Hari)`,
                style: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
                dot: 'bg-rose-500 animate-ping',
            };
        if (diff === 0)
            return {
                label: 'Jatuh Tempo Hari Ini!',
                style: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
                dot: 'bg-rose-500 animate-pulse',
            };
        if (diff <= 7)
            return {
                label: `Segera Jatuh Tempo (H-${diff})`,
                style: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
                dot: 'bg-amber-500 animate-pulse',
            };
        return {
            label: `Belum Jatuh Tempo (H-${diff})`,
            style: 'bg-blue-50 text-blue-700 border-blue-200',
            dot: 'bg-blue-500',
        };
    };

    // ── Download Invoice PDF ──────────────────────────────────────────────────
    const handleDownloadInvoicePdf = (p: Project) => {
        const total = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);
        const payments = paymentsByInvoice[p.invoiceNumber] || [];
        const paidSoFar = payments.reduce((s, pay) => s + pay.amount, 0);
        const dpAmount = Math.max(0, paidSoFar);

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/client-invoice-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('clientName', p.clientName);
        appendInput('clientSubName', 'Attn: Finance & Procurement');
        appendInput('invoiceNumber', p.invoiceNumber);
        appendInput('invoiceDate', new Date().toLocaleDateString('id-ID'));
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('dpAmount', String(dpAmount));
        appendInput('contractTotalDpp', String(p.contractValue));
        appendInput('contractTotalInvoice', String(total));
        appendInput('termLabel', p.paymentTerms?.notes || '');
        appendInput('stream', 'true');

        p.locations.forEach((loc, i) => {
            appendInput(`locations[${i}][type]`, loc.type);
            appendInput(`locations[${i}][size]`, loc.size);
            appendInput(`locations[${i}][description]`, loc.description);
            appendInput(`locations[${i}][area]`, loc.area);
            appendInput(`locations[${i}][qty]`, String(loc.qty ?? 1));
            appendInput(
                `locations[${i}][clientPrice]`,
                String(p.contractValue / p.locations.length),
            );
            appendInput(
                `locations[${i}][vendorCost]`,
                String(p.contractValue / p.locations.length),
            );
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // ── Download Kwitansi PDF ─────────────────────────────────────────────────
    const handleDownloadKwitansiPdf = (
        p: Project,
        pmt?: InvoicePaymentRecord,
    ) => {
        const invNum = p.invoiceNumber;
        const kwitansi = kwitansiByInvoice[invNum];
        const totalAmount = p.contractValue * (isPPN ? 1 + PPN_RATE : 1);

        const locDetails =
            p.locations && p.locations.length > 0
                ? p.locations
                      .map(
                          (loc) =>
                              `Pemasangan ${loc.type} ${loc.size} ${loc.description}${loc.area ? ' (' + loc.area + ')' : ''}`,
                      )
                      .join(' dan ')
                : p.name;

        const totalTerms =
            p.paymentTerms?.installments?.length ||
            (p.paymentTerms?.type === 'dp' ? 2 : 1);

        let receiptNum = kwitansi?.receiptNumber;
        let amountVal = kwitansi?.amount || totalAmount;
        let dateVal =
            kwitansi?.paidAt || new Date().toISOString().split('T')[0];

        const paymentTermText = pmt?.termLabel
            ? `${pmt.termLabel}${totalTerms > 1 ? ' dari ' + totalTerms + ' Termin' : ''}`
            : `Pelunasan`;

        let paymentDesc =
            kwitansi?.forPaymentOf ||
            `Pembayaran ${paymentTermText} Sewa Media Iklan - ${locDetails}`;

        if (pmt) {
            if (pmt.referenceNo) {
                receiptNum = `KW-${pmt.referenceNo}`;
            }
            amountVal = pmt.amount;
            dateVal = pmt.date;
            paymentDesc =
                pmt.notes ||
                `Pembayaran ${pmt.termLabel}${totalTerms > 1 ? ' dari ' + totalTerms + ' Termin' : ''} Sewa Media Iklan - ${locDetails}`;
        }

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/kwitansi-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('receiptNumber', receiptNum || `KW-${p.invoiceNumber}`);
        appendInput('receivedFrom', kwitansi?.receivedFrom || p.clientName);
        appendInput('amount', String(amountVal));
        appendInput('forPaymentOf', paymentDesc);
        appendInput('date', dateVal);
        appendInput('stream', 'true');

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleSendTerminInvoice = (item: {
        label: string;
        amount: number;
    }) => {
        if (!activeProject) return;
        handleDownloadInvoicePdf(activeProject);
        setSuccessMessage(
            `Invoice ${item.label} (${fmt(item.amount)}) berhasil dikirim / disiapkan untuk ${activeProject.clientName}!`,
        );
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const handleRecordPaymentForTermin = (item: {
        label: string;
        amount: number;
    }) => {
        if (!activeProject) return;
        setSelectedInvoiceForPayment(activeProject);
        setShowRecordPaymentModal(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AppLayout
            activePage="sales-transactions"
            title="Penjualan (Invoices)"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Penjualan (Invoice)' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Success Toast */}
                {successMessage && (
                    <div className="animate-in fade-in flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-sm duration-200">
                        <div className="flex items-center gap-2">
                            <svg
                                className="h-4 w-4 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="font-black text-emerald-600 hover:text-emerald-900"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── VIEW A: LIST / TAB VIEW ── */}
                {!selectedProjectId ? (
                    <div className="space-y-5">
                        {/* Page Header */}
                        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                                    Penerbitan & Kelola Invoice Client
                                </h2>
                                <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                                    Pusat Manajemen Tagihan Penjualan Sewa Media
                                    Iklan ·{' '}
                                    {isPPN ? 'Mode PPN Aktif' : 'Mode Non-PPN'}
                                </p>
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Invoice Diterbitkan',
                                    value: String(totalIssued),
                                    badge: 'Telah Terbit',
                                    badgeClass:
                                        'bg-primary/10 text-primary border-primary/20',
                                    valueClass: 'text-primary',
                                    icon: (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    ),
                                },
                                {
                                    title: 'Menunggu Penerbitan',
                                    value: String(totalPending),
                                    badge:
                                        totalPending > 0
                                            ? 'Pending Task'
                                            : 'Lengkap',
                                    badgeClass:
                                        totalPending > 0
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                    valueClass:
                                        totalPending > 0
                                            ? 'text-amber-600 font-black'
                                            : 'text-slate-700',
                                    icon: (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    ),
                                },
                                {
                                    title: 'Piutang Usaha (A/R)',
                                    value: fmt(totalARValue),
                                    badge: 'Belum Diterima',
                                    badgeClass:
                                        'bg-rose-50 text-rose-700 border-rose-200',
                                    valueClass: 'text-rose-600 font-black',
                                    icon: (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    ),
                                },
                                {
                                    title: 'Total Terealisasi',
                                    value: fmt(totalRealized),
                                    badge: 'Sudah Diterima',
                                    badgeClass:
                                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                                    valueClass: 'text-emerald-700',
                                    icon: (
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    ),
                                },
                            ].map((card, i) => (
                                <div
                                    key={i}
                                    className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-4 transition-shadow hover:shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {card.title}
                                            </span>
                                            <span
                                                className={`block truncate font-mono text-base font-black ${card.valueClass}`}
                                            >
                                                {card.value}
                                            </span>
                                            <span
                                                className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${card.badgeClass}`}
                                            >
                                                {card.badge}
                                            </span>
                                        </div>
                                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                            <svg
                                                className="w-4.5 h-4.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                {card.icon}
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tab Filter + Search */}
                        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-3.5">
                            <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
                                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
                                    {[
                                        {
                                            key: 'all' as const,
                                            label: 'Semua Invoice',
                                            badge: String(
                                                filteredProjects.length,
                                            ),
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                                />
                                            ),
                                            isSpecial: false,
                                        },
                                        {
                                            key: 'issued' as const,
                                            label: 'Invoice Resmi Terbit',
                                            badge: String(
                                                issuedProjects.length,
                                            ),
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            ),
                                            isSpecial: false,
                                        },
                                        {
                                            key: 'ar_schedule' as const,
                                            label: 'Jadwal Penerimaan Kas',
                                            badge: null,
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            ),
                                            isSpecial: false,
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setActiveTab(tab.key);
                                                setAllPage(1);
                                                setPendingPage(1);
                                                setIssuedPage(1);
                                                setArPage(1);
                                            }}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-neon-primary' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                {tab.icon}
                                            </svg>
                                            <span>{tab.label}</span>
                                            {tab.badge !== null && (
                                                <span
                                                    className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}

                                    {/* Antrean Penerbitan (Special Style like pending queue in PO) */}
                                    <button
                                        onClick={() => {
                                            setActiveTab('pending');
                                            setAllPage(1);
                                            setPendingPage(1);
                                            setIssuedPage(1);
                                            setArPage(1);
                                        }}
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeTab === 'pending' ? 'shadow-2xs bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'}`}
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>Antrean Penerbitan</span>
                                        {pendingProjects.length > 0 && (
                                            <span
                                                className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] font-black ${activeTab === 'pending' ? 'animate-pulse bg-amber-500 text-white' : 'animate-pulse bg-amber-500 text-white'}`}
                                            >
                                                {pendingProjects.length} Proyek
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                                    {/* Filter Sales PIC */}
                                    <div className="relative">
                                        <select
                                            value={filterSalesPIC}
                                            onChange={(e) => {
                                                setFilterSalesPIC(
                                                    e.target.value,
                                                );
                                                setAllPage(1);
                                                setPendingPage(1);
                                                setIssuedPage(1);
                                                setArPage(1);
                                            }}
                                            className="shadow-2xs cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs font-semibold text-slate-700 transition-all focus:border-primary focus:outline-none"
                                        >
                                            <option value="all">
                                                Semua Sales PIC
                                            </option>
                                            {allSalesPICs.map((pic) => (
                                                <option key={pic} value={pic}>
                                                    {pic}
                                                </option>
                                            ))}
                                        </select>
                                        <svg
                                            className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <svg
                                            className="pointer-events-none absolute right-2 top-3 h-3 w-3 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                    {/* Search bar */}
                                    <div className="relative w-56">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            placeholder="Cari proyek, client, invoice..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                        />
                                        <svg
                                            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TAB 1: SEMUA INVOICE ── */}
                        {activeTab === 'all' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                                        Semua Invoice Proyek
                                    </h3>
                                    <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                        {filteredProjects.length} Proyek
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                    {filteredProjects
                                        .slice(
                                            (allPage - 1) * ITEMS_PER_PAGE,
                                            allPage * ITEMS_PER_PAGE,
                                        )
                                        .map((p) => {
                                            const invStatus =
                                                getProjectInvoiceStatus(p);
                                            const total =
                                                p.contractValue *
                                                (isPPN ? 1 + PPN_RATE : 1);
                                            const paid = (
                                                paymentsByInvoice[
                                                    p.invoiceNumber
                                                ] || []
                                            ).reduce(
                                                (s, pay) => s + pay.amount,
                                                0,
                                            );
                                            const pct =
                                                total > 0
                                                    ? Math.min(
                                                          100,
                                                          Math.round(
                                                              (paid / total) *
                                                                  100,
                                                          ),
                                                      )
                                                    : 0;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() =>
                                                        setSelectedProjectId(
                                                            p.id,
                                                        )
                                                    }
                                                    className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/60"
                                                >
                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                                {p.code}
                                                            </span>
                                                            <span className="truncate text-xs font-bold text-slate-900">
                                                                {p.name}
                                                            </span>
                                                            <ProjectStatusBadge
                                                                status={
                                                                    p.status
                                                                }
                                                            />
                                                            <InvoiceStatusBadge
                                                                status={
                                                                    invStatus
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className={`h-full transition-all ${invStatus === 'paid' ? 'bg-emerald-500' : 'bg-primary'}`}
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {pct}% terbayar
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-400">
                                                            <span>
                                                                Client:{' '}
                                                                <strong className="text-slate-600">
                                                                    {
                                                                        p.clientName
                                                                    }
                                                                </strong>
                                                            </span>
                                                            <span>·</span>
                                                            <span>
                                                                Sales:{' '}
                                                                <strong className="text-slate-600">
                                                                    {p.salesPIC}
                                                                </strong>
                                                            </span>
                                                            <span>·</span>
                                                            <span>
                                                                Periode:{' '}
                                                                <strong className="text-slate-600">
                                                                    {p.period}
                                                                </strong>
                                                            </span>
                                                            {p.invoiceIssued && (
                                                                <>
                                                                    <span>
                                                                        ·
                                                                    </span>
                                                                    <span className="font-mono font-bold text-primary">
                                                                        {
                                                                            p.invoiceNumber
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <div className="font-mono text-xs font-bold text-slate-900">
                                                            {fmt(total)}
                                                        </div>
                                                        <div className="text-[9.5px] font-medium text-slate-500">
                                                            Terbayar:{' '}
                                                            <strong className="font-mono text-emerald-700">
                                                                {fmt(paid)}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {filteredProjects.length === 0 && (
                                        <div className="p-8 text-center text-xs font-semibold italic text-slate-400">
                                            Tidak ada proyek yang sesuai dengan
                                            pencarian.
                                        </div>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={allPage}
                                    totalPages={Math.ceil(
                                        filteredProjects.length /
                                            ITEMS_PER_PAGE,
                                    )}
                                    totalItems={filteredProjects.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setAllPage}
                                />
                            </div>
                        )}

                        {/* ── TAB 2: ANTREAN PENERBITAN ── */}
                        {activeTab === 'pending' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                            Antrean Penerbitan Invoice (Pending
                                            Task)
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Proyek yang belum memiliki invoice
                                            resmi
                                        </p>
                                    </div>
                                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                                        {pendingProjects.length} Proyek
                                    </span>
                                </div>
                                {pendingProjects.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                                            <svg
                                                className="h-6 w-6 text-emerald-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-700">
                                            Semua proyek sudah memiliki invoice!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                        {pendingProjects
                                            .slice(
                                                (pendingPage - 1) *
                                                    ITEMS_PER_PAGE,
                                                pendingPage * ITEMS_PER_PAGE,
                                            )
                                            .sort(
                                                (a, b) =>
                                                    b.contractValue -
                                                    a.contractValue,
                                            )
                                            .map((p) => {
                                                const total =
                                                    p.contractValue *
                                                    (isPPN ? 1 + PPN_RATE : 1);
                                                const isDraft =
                                                    p.status === 'Draft';
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/40"
                                                    >
                                                        <div className="min-w-0 flex-1 space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                                    {p.code}
                                                                </span>
                                                                <span className="truncate text-xs font-bold text-slate-900">
                                                                    {p.name}
                                                                </span>
                                                                <ProjectStatusBadge
                                                                    status={
                                                                        p.status
                                                                    }
                                                                />
                                                                {isDraft && (
                                                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                                        ⚠ Proyek
                                                                        Belum
                                                                        Aktif
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-400">
                                                                <span>
                                                                    Client:{' '}
                                                                    <strong className="text-slate-600">
                                                                        {
                                                                            p.clientName
                                                                        }
                                                                    </strong>
                                                                </span>
                                                                <span>·</span>
                                                                <span>
                                                                    Sales:{' '}
                                                                    <strong className="text-slate-600">
                                                                        {
                                                                            p.salesPIC
                                                                        }
                                                                    </strong>
                                                                </span>
                                                                <span>·</span>
                                                                <span>
                                                                    Periode:{' '}
                                                                    <strong className="text-slate-600">
                                                                        {
                                                                            p.period
                                                                        }
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] font-medium text-slate-400">
                                                                DPP:{' '}
                                                                <strong className="font-mono text-slate-700">
                                                                    {fmt(
                                                                        p.contractValue,
                                                                    )}
                                                                </strong>
                                                                {isPPN && (
                                                                    <span>
                                                                        {' '}
                                                                        · PPN
                                                                        11%:{' '}
                                                                        <strong className="font-mono text-slate-700">
                                                                            {fmt(
                                                                                p.contractValue *
                                                                                    PPN_RATE,
                                                                            )}
                                                                        </strong>
                                                                    </span>
                                                                )}
                                                                {' · '}Total:{' '}
                                                                <strong className="font-mono font-black text-slate-900">
                                                                    {fmt(total)}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProjectId(
                                                                    p.id,
                                                                );
                                                                setShowInvoiceForm(
                                                                    true,
                                                                );
                                                            }}
                                                            disabled={isDraft}
                                                            title={
                                                                isDraft
                                                                    ? 'Tidak dapat tetapkan skema pembayaran untuk proyek Draft'
                                                                    : 'Tetapkan Skema Pembayaran'
                                                            }
                                                            className={`shadow-2xs flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[11px] font-bold transition-all ${isDraft ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400' : 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'}`}
                                                        >
                                                            <svg
                                                                className="h-3.5 w-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M12 4v16m8-8H4"
                                                                />
                                                            </svg>
                                                            <span>
                                                                Tetapkan Skema
                                                                Pembayaran
                                                            </span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                                <Pagination
                                    currentPage={pendingPage}
                                    totalPages={Math.ceil(
                                        pendingProjects.length / ITEMS_PER_PAGE,
                                    )}
                                    totalItems={pendingProjects.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setPendingPage}
                                />
                            </div>
                        )}

                        {/* ── TAB 3: INVOICE RESMI TERBIT ── */}
                        {activeTab === 'issued' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            Invoice Resmi Terbit
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Dokumen invoice resmi beserta status
                                            & riwayat penerimaan
                                        </p>
                                    </div>
                                    <span className="rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                                        {issuedProjects.length} Dokumen Invoice
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                    {issuedProjects
                                        .slice(
                                            (issuedPage - 1) * ITEMS_PER_PAGE,
                                            issuedPage * ITEMS_PER_PAGE,
                                        )
                                        .map((p) => {
                                            const invStatus =
                                                getProjectInvoiceStatus(p);
                                            const total =
                                                p.contractValue *
                                                (isPPN ? 1 + PPN_RATE : 1);
                                            const paid = (
                                                paymentsByInvoice[
                                                    p.invoiceNumber
                                                ] || []
                                            ).reduce(
                                                (s, pay) => s + pay.amount,
                                                0,
                                            );
                                            const remaining = Math.max(
                                                0,
                                                total - paid,
                                            );
                                            const pct =
                                                total > 0
                                                    ? Math.min(
                                                          100,
                                                          Math.round(
                                                              (paid / total) *
                                                                  100,
                                                          ),
                                                      )
                                                    : 0;
                                            const isExpanded =
                                                expandedInvoicePayment ===
                                                p.invoiceNumber;
                                            const kwitansi =
                                                kwitansiByInvoice[
                                                    p.invoiceNumber
                                                ];
                                            return (
                                                <div
                                                    key={p.id}
                                                    className="divide-y divide-slate-100 bg-white transition-colors hover:bg-slate-50/40"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                                                        <div className="min-w-0 flex-1 space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="bg-primary/10 border-primary/20 rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                                                                    {
                                                                        p.invoiceNumber
                                                                    }
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900">
                                                                    {
                                                                        p.clientName
                                                                    }
                                                                </span>
                                                                <InvoiceStatusBadge
                                                                    status={
                                                                        invStatus
                                                                    }
                                                                />
                                                                {kwitansi &&
                                                                    invStatus ===
                                                                        'paid' && (
                                                                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                            ✓
                                                                            Kwitansi
                                                                            Terbit
                                                                        </span>
                                                                    )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                                                                    <div
                                                                        className={`h-full transition-all duration-500 ${invStatus === 'paid' ? 'bg-emerald-500' : 'bg-primary'}`}
                                                                        style={{
                                                                            width: `${pct}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                                                <span>
                                                                    Terbit:{' '}
                                                                    <strong className="text-slate-700">
                                                                        {formatDate(
                                                                            p.invoiceIssuedAt,
                                                                        )}
                                                                    </strong>
                                                                </span>
                                                                <span>·</span>
                                                                <span>
                                                                    Proyek:{' '}
                                                                    <strong className="font-mono text-slate-700">
                                                                        {p.code}
                                                                    </strong>{' '}
                                                                    {p.name}
                                                                </span>
                                                                <span>·</span>
                                                                <span>
                                                                    Skema:{' '}
                                                                    <strong className="text-slate-700">
                                                                        {p
                                                                            .paymentTerms
                                                                            ?.notes ||
                                                                            p
                                                                                .paymentTerms
                                                                                ?.type ||
                                                                            '-'}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-shrink-0 items-center gap-3">
                                                            <div className="text-right">
                                                                <div className="font-mono text-xs font-bold text-slate-900">
                                                                    {fmt(total)}
                                                                </div>
                                                                <div className="text-[9.5px] font-medium text-slate-500">
                                                                    Terbayar:{' '}
                                                                    <strong className="font-mono text-emerald-700">
                                                                        {fmt(
                                                                            paid,
                                                                        )}
                                                                    </strong>{' '}
                                                                    · Sisa:{' '}
                                                                    <strong className="font-mono text-rose-600">
                                                                        {fmt(
                                                                            remaining,
                                                                        )}
                                                                    </strong>
                                                                </div>
                                                            </div>
                                                            {remaining > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedInvoiceForPayment(
                                                                            p,
                                                                        );
                                                                        setShowRecordPaymentModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="shadow-2xs flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                >
                                                                    <svg
                                                                        className="h-3.5 w-3.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        Catat
                                                                        Terima
                                                                        Bayar
                                                                    </span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setExpandedInvoicePayment(
                                                                        isExpanded
                                                                            ? null
                                                                            : p.invoiceNumber,
                                                                    )
                                                                }
                                                                className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${isExpanded ? 'border-slate-300 bg-slate-200 text-slate-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                                                            >
                                                                <span>
                                                                    Riwayat (
                                                                    {
                                                                        (
                                                                            paymentsByInvoice[
                                                                                p
                                                                                    .invoiceNumber
                                                                            ] ||
                                                                            []
                                                                        ).length
                                                                    }
                                                                    )
                                                                </span>
                                                                <svg
                                                                    className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M19 9l-7 7-7-7"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDownloadInvoicePdf(
                                                                        p,
                                                                    )
                                                                }
                                                                className="flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700 transition-all hover:bg-indigo-100"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                <span>PDF</span>
                                                            </button>
                                                            {kwitansi && (
                                                                <span
                                                                    className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700"
                                                                    title={`Kwitansi: ${kwitansi.receiptNumber}`}
                                                                >
                                                                    <svg
                                                                        className="h-3.5 w-3.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                                                        />
                                                                    </svg>
                                                                    Kwitansi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="animate-in slide-in-from-top-1 space-y-3 border-t border-slate-100 bg-slate-50/80 p-4 duration-200">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                                                <span>
                                                                    Riwayat
                                                                    Penerimaan
                                                                    Kas (
                                                                    {
                                                                        p.invoiceNumber
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            {(
                                                                paymentsByInvoice[
                                                                    p
                                                                        .invoiceNumber
                                                                ] || []
                                                            ).length > 0 ? (
                                                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs">
                                                                    <table className="w-full border-collapse text-left">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                                                                <th className="px-3 py-2">
                                                                                    Tanggal
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    Label
                                                                                    /
                                                                                    Termin
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    Metode
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    No.
                                                                                    Referensi
                                                                                </th>
                                                                                <th className="px-3 py-2 text-right">
                                                                                    Nominal
                                                                                </th>
                                                                                <th className="px-3 py-2 text-center">
                                                                                    Aksi
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {(
                                                                                paymentsByInvoice[
                                                                                    p
                                                                                        .invoiceNumber
                                                                                ] ||
                                                                                []
                                                                            ).map(
                                                                                (
                                                                                    pmt,
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            pmt.id
                                                                                        }
                                                                                        className="hover:bg-slate-50/70"
                                                                                    >
                                                                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                                                                                            {formatDate(
                                                                                                pmt.date,
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-semibold text-slate-900">
                                                                                            {
                                                                                                pmt.termLabel
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-slate-600">
                                                                                            {
                                                                                                pmt.method
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-mono text-slate-600">
                                                                                            {
                                                                                                pmt.referenceNo
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                                                                                            {fmt(
                                                                                                pmt.amount,
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-center">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleDownloadKwitansiPdf(
                                                                                                        p,
                                                                                                        pmt,
                                                                                                    )
                                                                                                }
                                                                                                className="shadow-2xs mx-auto flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                                                title="Cetak Kwitansi PDF untuk pembayaran ini"
                                                                                            >
                                                                                                <svg
                                                                                                    className="h-3 w-3"
                                                                                                    fill="none"
                                                                                                    viewBox="0 0 24 24"
                                                                                                    stroke="currentColor"
                                                                                                    strokeWidth={
                                                                                                        2.5
                                                                                                    }
                                                                                                >
                                                                                                    <path
                                                                                                        strokeLinecap="round"
                                                                                                        strokeLinejoin="round"
                                                                                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                                                                                    />
                                                                                                </svg>
                                                                                                <span>
                                                                                                    Cetak
                                                                                                    Kwitansi
                                                                                                </span>
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs italic text-slate-500">
                                                                    Belum ada
                                                                    catatan
                                                                    penerimaan
                                                                    pembayaran
                                                                    untuk
                                                                    invoice ini.
                                                                </div>
                                                            )}
                                                            {kwitansi && (
                                                                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
                                                                    <div className="space-y-0.5">
                                                                        <div className="font-bold text-emerald-800">
                                                                            Kwitansi
                                                                            Diterbitkan:{' '}
                                                                            <span className="font-mono">
                                                                                {
                                                                                    kwitansi.receiptNumber
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        <div className="font-medium text-emerald-700">
                                                                            Diterima
                                                                            dari{' '}
                                                                            {
                                                                                kwitansi.receivedFrom
                                                                            }{' '}
                                                                            ·{' '}
                                                                            {formatDate(
                                                                                kwitansi.paidAt,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-mono font-black text-emerald-800">
                                                                        {fmt(
                                                                            kwitansi.amount,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    {issuedProjects.length === 0 && (
                                        <div className="p-8 text-center text-xs font-semibold italic text-slate-400">
                                            Belum ada invoice yang diterbitkan.
                                        </div>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={issuedPage}
                                    totalPages={Math.ceil(
                                        issuedProjects.length / ITEMS_PER_PAGE,
                                    )}
                                    totalItems={issuedProjects.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setIssuedPage}
                                />
                            </div>
                        )}

                        {/* ── TAB 4: JADWAL PENERIMAAN KAS (AR SCHEDULE) ── */}
                        {activeTab === 'ar_schedule' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                                            Jadwal Penerimaan Kas (Accounts
                                            Receivable Schedule)
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Monitoring jatuh tempo penerimaan
                                            pembayaran dari client · Diurutkan
                                            dari jatuh tempo terdekat
                                        </p>
                                    </div>
                                    <span className="bg-primary/10 border-primary/20 rounded-xl border px-2.5 py-1 text-[10px] font-bold text-primary">
                                        {arScheduleItems.length} Tagihan
                                        Terjadwal
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                    {arScheduleItems
                                        .slice(
                                            (arPage - 1) * ITEMS_PER_PAGE,
                                            arPage * ITEMS_PER_PAGE,
                                        )
                                        .map((item, idx) => {
                                            const dueDateStatus =
                                                getDueDateStatus(item.dueDate);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/40"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span
                                                            className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dueDateStatus.dot}`}
                                                        />
                                                        <div className="min-w-0 space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="bg-primary/10 border-primary/20 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                                                                    {
                                                                        item
                                                                            .project
                                                                            .invoiceNumber
                                                                    }
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900">
                                                                    {
                                                                        item
                                                                            .project
                                                                            .clientName
                                                                    }
                                                                </span>
                                                                <InvoiceStatusBadge
                                                                    status={
                                                                        item.invStatus
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-500">
                                                                <span>
                                                                    Termin:{' '}
                                                                    <strong className="text-slate-700">
                                                                        {
                                                                            item.label
                                                                        }
                                                                    </strong>
                                                                </span>
                                                                <span>·</span>
                                                                <span>
                                                                    Proyek:{' '}
                                                                    <strong className="font-mono text-slate-700">
                                                                        {
                                                                            item
                                                                                .project
                                                                                .code
                                                                        }
                                                                    </strong>
                                                                </span>
                                                                <span>·</span>
                                                                <div className="flex items-center gap-1">
                                                                    <svg
                                                                        className="h-3 w-3 text-slate-400"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        Jatuh
                                                                        Tempo:{' '}
                                                                        <strong className="text-slate-700">
                                                                            {item.dueDate
                                                                                ? formatDate(
                                                                                      item.dueDate,
                                                                                  )
                                                                                : 'Sesuai Kesepakatan'}
                                                                        </strong>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-shrink-0 items-center gap-3">
                                                        <span
                                                            className={`rounded-full border px-2.5 py-0.5 text-[9.5px] ${dueDateStatus.style}`}
                                                        >
                                                            {
                                                                dueDateStatus.label
                                                            }
                                                        </span>
                                                        <span className="font-mono text-xs font-black text-slate-900">
                                                            {fmt(item.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {arScheduleItems.length === 0 && (
                                        <div className="p-8 text-center text-xs font-semibold italic text-slate-400">
                                            Belum ada jadwal penerimaan kas.
                                            Terbitkan invoice terlebih dahulu.
                                        </div>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={arPage}
                                    totalPages={Math.ceil(
                                        arScheduleItems.length / ITEMS_PER_PAGE,
                                    )}
                                    totalItems={arScheduleItems.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setArPage}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    // ── VIEW B: Detail Per Proyek ──────────────────────────────────────────
                    <div className="space-y-6">
                        {/* Back button + Header */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setSelectedProjectId(null);
                                    setShowInvoiceForm(false);
                                }}
                                className="shadow-2xs flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 transition-all hover:bg-slate-100"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                            </button>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                                    Kelola Invoice: {activeProject?.name}
                                </h2>
                                <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                                    {activeProject?.clientName} ·{' '}
                                    {activeProject?.code}
                                </p>
                            </div>
                        </div>

                        {/* Invoice Status Timeline */}
                        {activeProject && (
                            <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-5">
                                <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Status Lifecycle Invoice
                                </div>
                                <div className="flex items-center gap-0">
                                    {[
                                        {
                                            key: 'draft',
                                            label: 'Draft',
                                            desc: 'Belum Terbit',
                                            active: true,
                                        },
                                        {
                                            key: 'issued',
                                            label: 'Issued',
                                            desc: 'Diterbitkan',
                                            active: activeProject.invoiceIssued,
                                        },
                                        {
                                            key: 'paid',
                                            label: 'Paid / Lunas',
                                            desc: 'Telah Dilunasi',
                                            active:
                                                activeInvoiceStatus ===
                                                    'paid' ||
                                                activeInvoiceStatus ===
                                                    'partial',
                                        },
                                    ].map((step, i, arr) => {
                                        const isCurrent =
                                            step.key === activeInvoiceStatus ||
                                            (step.key === 'draft' &&
                                                !activeProject.invoiceIssued);
                                        return (
                                            <React.Fragment key={step.key}>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div
                                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${step.active ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-400'} ${isCurrent ? 'ring-primary/20 ring-4' : ''}`}
                                                    >
                                                        {step.active ? (
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={3}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        ) : (
                                                            <span>{i + 1}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <div
                                                            className={`text-[10px] font-black ${step.active ? 'text-primary' : 'text-slate-400'}`}
                                                        >
                                                            {step.label}
                                                        </div>
                                                        <div className="text-[9px] font-medium text-slate-400">
                                                            {step.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div
                                                        className={`mx-1 mb-5 h-0.5 flex-1 ${arr[i + 1].active ? 'bg-primary' : 'bg-slate-200'}`}
                                                    />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Project Info */}
                        {activeProject && (
                            <div className="shadow-2xs grid grid-cols-1 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 md:grid-cols-4">
                                <div className="col-span-2">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className="bg-primary/10 border-primary/20 rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                            {activeProject.code}
                                        </span>
                                        <ProjectStatusBadge
                                            status={activeProject.status}
                                        />
                                    </div>
                                    <h3 className="text-base font-bold leading-tight text-slate-900">
                                        {activeProject.name}
                                    </h3>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        {activeProject.clientName} · Sales:{' '}
                                        {activeProject.salesPIC}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-center">
                                    <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Nilai Kontrak (DPP)
                                    </div>
                                    <div className="font-mono text-base font-black text-slate-900">
                                        {fmt(activeProject.contractValue)}
                                    </div>
                                    {isPPN && (
                                        <div className="mt-0.5 text-[10px] text-slate-500">
                                            +PPN:{' '}
                                            {fmt(
                                                activeProject.contractValue *
                                                    PPN_RATE,
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-center">
                                    <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Total Tagihan
                                    </div>
                                    <div className="font-mono text-base font-black text-primary">
                                        {fmt(activeTotalAmount)}
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                                        {isPPN ? 'incl. PPN 11%' : 'Non-PPN'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Invoice Action Card */}
                        {activeProject && (
                            <div className="shadow-2xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5">
                                {!activeProject.invoiceIssued ? (
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800">
                                                {activeProject.paymentTerms ? 'Skema Pembayaran Telah Diatur' : 'Penerbitan Invoice Belum Dilakukan'}
                                            </h4>
                                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                                {activeProject.paymentTerms
                                                    ? 'Klik tombol terbitkan invoice resmi untuk mencatat piutang dan mengaktifkan penagihan.'
                                                    : 'Atur termin dan skema pembayaran client terlebih dahulu.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowInvoiceForm(true)}
                                                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                            >
                                                {activeProject.paymentTerms ? 'Ubah Skema Termin' : 'Atur Skema Pembayaran'}
                                            </button>
                                            {activeProject.paymentTerms && (
                                                <button
                                                    type="button"
                                                    onClick={handleIssueOfficialInvoice}
                                                    className="shadow-neon-primary cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-700"
                                                >
                                                    Terbitkan Invoice Resmi
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Invoice Summary */}
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="bg-primary/10 border-primary/20 rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                                                        {activeProject.invoiceNumber ||
                                                            'INVOICE DRAFT'}
                                                    </span>
                                                    <InvoiceStatusBadge
                                                        status={
                                                            activeInvoiceStatus
                                                        }
                                                    />
                                                    {activeKwitansi && (
                                                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                            ✓ Kwitansi:{' '}
                                                            {
                                                                activeKwitansi.receiptNumber
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-400">
                                                    Skema:{' '}
                                                    {activeProject.paymentTerms
                                                        ?.notes || '-'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowInvoiceForm(true)}
                                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                                >
                                                    Ubah Skema
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadInvoicePdf(activeProject)}
                                                    className="cursor-pointer rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    Cetak Invoice PDF
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payment Summary Bar */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                                                <span>
                                                    Realisasi Penerimaan
                                                </span>
                                                <span>
                                                    {activeTotalPaid > 0
                                                        ? Math.round(
                                                              (activeTotalPaid /
                                                                  activeTotalAmount) *
                                                                  100,
                                                          )
                                                        : 0}
                                                    %
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${activeInvoiceStatus === 'paid' ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{
                                                        width: `${activeTotalAmount > 0 ? Math.min(100, Math.round((activeTotalPaid / activeTotalAmount) * 100)) : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between font-mono text-[10px] text-slate-500">
                                                <span>
                                                    Terbayar:{' '}
                                                    <strong className="text-emerald-700">
                                                        {fmt(activeTotalPaid)}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Sisa Piutang:{' '}
                                                    <strong className="text-rose-600">
                                                        {fmt(activeRemaining)}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Scheduled Invoices / Payment Terms Table */}
                                        <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-100/90 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                                                <span>
                                                    Rincian Termin & Status Pembayaran
                                                </span>
                                                <span>
                                                    {activeScheduleItems.length}{' '}
                                                    Termin
                                                </span>
                                            </div>
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                                        <th className="px-4 py-2.5">
                                                            Tahap / Label
                                                        </th>
                                                        <th className="px-4 py-2.5">
                                                            Porsi (%)
                                                        </th>
                                                        <th className="px-4 py-2.5">
                                                            Jatuh Tempo
                                                        </th>
                                                        <th className="px-4 py-2.5">
                                                            Status
                                                        </th>
                                                        <th className="px-4 py-2.5 text-right">
                                                            Nominal
                                                        </th>
                                                        <th className="px-4 py-2.5 text-center">
                                                            Aksi
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {activeScheduleItems.map(
                                                        (item, i) => {
                                                            const termsList = activeProject.invoices?.[0]?.payment_plan?.terms || [];
                                                            const dbTerm = termsList[i] || null;
                                                            const termPaidAmt = dbTerm ? (dbTerm.settlements || []).reduce((s, set) => s + Number(set.amount), 0) : 0;
                                                            const isTermFullyPaid = dbTerm ? (termPaidAmt >= Number(dbTerm.amount) || dbTerm.status === 'paid') : false;

                                                            return (
                                                                <tr
                                                                    key={i}
                                                                    className="hover:bg-slate-50/60"
                                                                >
                                                                    <td className="px-4 py-2.5 font-bold text-slate-800">
                                                                        {item.label}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 font-mono text-slate-600">
                                                                        {item.percent}%
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-slate-600">
                                                                        {item.dueDate
                                                                            ? formatDate(item.dueDate)
                                                                            : '-'}
                                                                    </td>
                                                                    <td className="px-4 py-2.5">
                                                                        {isTermFullyPaid ? (
                                                                            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700">
                                                                                LUNAS
                                                                            </span>
                                                                        ) : termPaidAmt > 0 ? (
                                                                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-700">
                                                                                PARSIAL ({fmt(termPaidAmt)})
                                                                            </span>
                                                                        ) : (
                                                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600">
                                                                                BELUM BAYAR
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                                                                        {fmt(item.amount)}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-center">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            {!isTermFullyPaid && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedInvoiceForPayment(activeProject);
                                                                                        setSelectedPaymentTerm(dbTerm);
                                                                                        setShowRecordPaymentModal(true);
                                                                                    }}
                                                                                    className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[10.5px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                                    title={`Catat pembayaran untuk ${item.label}`}
                                                                                >
                                                                                    <span>Catat Bayar</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Payment History Table */}
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <div className="bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Riwayat Penerimaan Kas
                                            </div>
                                            {activePayments.length > 0 ? (
                                                <table className="w-full border-collapse text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                                            <th className="px-4 py-2.5">
                                                                Tanggal
                                                            </th>
                                                            <th className="px-4 py-2.5">
                                                                Label / Termin
                                                            </th>
                                                            <th className="px-4 py-2.5">
                                                                Metode
                                                            </th>
                                                            <th className="px-4 py-2.5">
                                                                No. Referensi
                                                            </th>
                                                            <th className="px-4 py-2.5 text-right">
                                                                Nominal
                                                            </th>
                                                            <th className="px-4 py-2.5 text-center">
                                                                Kwitansi
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {activePayments.map(
                                                            (pmt) => (
                                                                <tr
                                                                    key={pmt.id}
                                                                    className="hover:bg-slate-50/70"
                                                                >
                                                                    <td className="px-4 py-2.5 font-mono text-slate-700">
                                                                        {formatDate(
                                                                            pmt.date,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                                                                        {
                                                                            pmt.termLabel
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-slate-600">
                                                                        {
                                                                            pmt.method
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 font-mono text-slate-600">
                                                                        {pmt.referenceNo ||
                                                                            '-'}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                                                        {fmt(
                                                                            pmt.amount,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleDownloadKwitansiPdf(
                                                                                    activeProject,
                                                                                    pmt,
                                                                                )
                                                                            }
                                                                            className="mx-auto flex cursor-pointer items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                                                                            title={`Download Kwitansi PDF untuk ${pmt.termLabel}`}
                                                                        >
                                                                            <svg
                                                                                className="h-3.5 w-3.5"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                                strokeWidth={
                                                                                    2.5
                                                                                }
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                />
                                                                            </svg>
                                                                            <span>
                                                                                Cetak
                                                                                Kwitansi
                                                                            </span>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-6 text-center text-xs italic text-slate-500">
                                                    Belum ada catatan penerimaan
                                                    pembayaran.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Issue Invoice Modal */}
            {activeProject && (
                <ConfigurePaymentSchemeModal
                    isOpen={showInvoiceForm}
                    onClose={() => setShowInvoiceForm(false)}
                    clientName={activeProject.clientName}
                    totalAmount={activeTotalAmount}
                    isPPN={isPPN}
                    onSubmit={handleConfigurePaymentPlan}
                />
            )}

            {/* Record Invoice Payment Modal */}
            <RecordInvoicePaymentModal
                isOpen={showRecordPaymentModal}
                cashBankAccounts={cashBankAccounts}
                invoice={
                    selectedInvoiceForPayment
                        ? {
                              id: selectedInvoiceForPayment.id,
                              invoiceNumber:
                                  selectedInvoiceForPayment.invoiceNumber,
                              clientName: selectedInvoiceForPayment.clientName,
                              projectName: selectedInvoiceForPayment.name,
                              totalAmount:
                                  selectedInvoiceForPayment.contractValue *
                                  (isPPN ? 1 + PPN_RATE : 1),
                              paymentTerms:
                                  selectedInvoiceForPayment.paymentTerms,
                          }
                        : null
                }
                remainingAmount={
                    selectedInvoiceForPayment
                        ? Math.max(
                              0,
                              selectedInvoiceForPayment.contractValue *
                                  (isPPN ? 1 + PPN_RATE : 1) -
                                  (
                                      paymentsByInvoice[
                                          selectedInvoiceForPayment
                                              .invoiceNumber
                                      ] || []
                                  ).reduce((s, p) => s + p.amount, 0),
                          )
                        : 0
                }
                onClose={() => {
                    setShowRecordPaymentModal(false);
                    setSelectedInvoiceForPayment(null);
                    setSelectedPaymentTerm(null);
                }}
                onSubmit={handleSaveInvoicePayment}
            />
        </AppLayout>
    );
}
