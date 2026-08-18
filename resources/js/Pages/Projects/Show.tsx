import { RecordInvoicePaymentModal, RecordInvoicePaymentModalSubmitData } from '@/Components/Modal/RecordInvoicePaymentModal';
import Toast, { ToastType } from '@/Components/UI/Toast';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { calcPeriodProgress, formatIndoPeriod } from '@/Utils/formatters';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    ActiveTab,
    BillboardLocation,
    calcFinancials,
    ClientPaymentPlan,
    FiscalMode,
    fmt,
    formatIndoDate,
    PaymentScheme,
    PaymentTerm,
    PaymentTermStatus,
    Project,
    PurchaseOrderWithPlan,
    VendorPaymentPlanTerm,
} from './projectTypes';

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: Project['status'] }) => {
    const map: Record<
        Project['status'],
        { bg: string; dot: string; text: string }
    > = {
        Draft: {
            bg: 'bg-amber-50 text-amber-700 border-amber-100',
            dot: 'bg-amber-400',
            text: 'Draft',
        },
        Active: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            dot: 'bg-emerald-500',
            text: 'Aktif',
        },
        Completed: {
            bg: 'bg-blue-50 text-blue-700 border-blue-100',
            dot: 'bg-blue-500',
            text: 'Selesai',
        },
        Cancelled: {
            bg: 'bg-red-50 text-red-700 border-red-100',
            dot: 'bg-red-500',
            text: 'Dibatalkan',
        },
    };
    const s = map[status] || map.Draft;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// LocationsTab
import InfoTab from './Tabs/InfoTab';
import InvoiceTab from './Tabs/InvoiceTab';
import LocationsTab from './Tabs/LocationsTab';
import VendorPOTab from './Tabs/VendorPOTab';

interface DbPaymentSettlement {
    id: string;
    amount: number | string;
    paid_at?: string;
    payment_method: string;
    payment_ref?: string | null;
    notes?: string | null;
}

interface DbPaymentTerm {
    id: string;
    sort_order?: number;
    label: string;
    amount: number | string;
    percent: number | string;
    due_date?: string;
    status: string;
    notes?: string;
    settlements?: DbPaymentSettlement[];
}

interface DbPurchaseOrder {
    id: string;
    po_number: string;
    vendor_id: string;
    vendor?: { id: string; name: string };
    total?: number | string;
    payment_plan?: {
        id: string;
        scheme?: string;
        total_amount?: number | string;
        notes?: string | null;
        terms?: DbPaymentTerm[];
    } | null;
}

interface DbProjectLocation {
    id: string;
    code: string;
    area: string;
    description: string;
    type?: BillboardLocation['type'];
    size: string;
    vendor_id?: string | null;
    vendor?: { id: string; name: string };
    vendor_cost: number | string;
    po_issued?: boolean;
    po_number?: string;
    purchase_order_id?: string | null;
    orientation?: 'V' | 'H';
    lighting?: 'Berlampu' | 'Tidak Berlampu';
    top_notes?: string;
}

interface DbProject {
    id: string;
    code: string;
    name: string;
    client_id: string;
    client?: { id: string; name: string };
    client_name?: string;
    sales_id?: string;
    sales?: { id: string; name: string; commission_rate?: number | string };
    sales_commission_rate?: number | string;
    sales_pic?: string;
    fiscal_mode?: 'ppn' | 'non-ppn';
    start_date: string;
    end_date: string;
    contract_value: number | string;
    status: 'draft' | 'active' | 'completed' | 'cancelled' | string;
    target_qty?: number;
    notes?: string;
    invoice_issued?: boolean;
    invoice_number?: string;
    invoices?: Array<{
        id?: string;
        invoice_number?: string;
        created_at?: string;
        payment_plan?: {
            id?: string;
            scheme?: string;
            total_amount?: number | string;
            notes?: string;
            terms?: DbPaymentTerm[];
        };
    }>;
    locations?: DbProjectLocation[];
    purchase_orders?: DbPurchaseOrder[];
}

interface ShowProjectProps {
    project: DbProject;
    clients?: Array<{ id: string; name: string }>;
    sales?: Array<{
        id: string;
        name: string;
        commission_rate?: number | string;
    }>;
    vendors?: Array<{ id: string; name: string }>;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Show Project Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Show({
    project: dbProject,
    vendors = [],
    cashBankAccounts = [],
}: ShowProjectProps) {
    const fiscalMode: FiscalMode =
        dbProject?.fiscal_mode === 'non-ppn' ? 'non-ppn' : 'ppn';

    const statusMap: Record<string, Project['status']> = {
        draft: 'Draft',
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };

    // Construct frontend Project model from database response
    const displayedProject: Project = useMemo(() => {
        if (!dbProject) {
            return {
                id: '',
                code: '',
                name: '',
                clientId: '',
                clientName: '',
                salesPIC: '',
                period: '',
                contractValue: 0,
                status: 'Draft',
                locations: [],
                invoiceIssued: false,
                invoiceNumber: '',
                targetQty: 1,
            };
        }

        const invoice = dbProject.invoices?.[0];
        const paymentPlan = invoice?.payment_plan;
        const commRate =
            Number(
                dbProject.sales?.commission_rate ??
                    dbProject.sales_commission_rate,
            ) || 0;

        const periodObj = formatIndoPeriod(
            dbProject.start_date,
            dbProject.end_date,
        );

        return {
            id: dbProject.id,
            code: dbProject.code,
            name: dbProject.name,
            clientId: dbProject.client_id,
            clientName: dbProject.client?.name ?? dbProject.client_name ?? '-',
            salesId: dbProject.sales_id,
            salesPIC: dbProject.sales?.name ?? dbProject.sales_pic ?? '-',
            salesCommissionRate: commRate,
            period:
                periodObj.label ||
                `${dbProject.start_date} - ${dbProject.end_date}`,
            startDate: dbProject.start_date,
            endDate: dbProject.end_date,
            contractValue: Number(dbProject.contract_value) || 0,
            status: statusMap[dbProject.status] || 'Draft',
            targetQty: dbProject.target_qty || 1,
            invoiceIssued: Boolean(dbProject.invoice_issued),
            invoiceNumber:
                dbProject.invoice_number || invoice?.invoice_number || '',
            clientPaymentPlan: paymentPlan
                ? {
                      scheme: (paymentPlan.scheme as PaymentScheme) || 'full',
                      totalAmount: Number(paymentPlan.total_amount) || 0,
                      notes: paymentPlan.notes,
                      createdAt: invoice.created_at || '',
                      terms: (paymentPlan.terms || []).map(
                          (term: DbPaymentTerm) => {
                              const settlements = term.settlements || [];
                              const paidAmount = settlements.reduce(
                                  (s: number, set: DbPaymentSettlement) =>
                                      s + (Number(set.amount) || 0),
                                  0,
                              );
                              const latestSettlement =
                                  settlements[settlements.length - 1];
                              const termAmount = Number(term.amount) || 0;
                              const isPaid =
                                  term.status === 'paid' ||
                                  (termAmount > 0 &&
                                      paidAmount >= termAmount - 1);

                              return {
                                  id: term.id,
                                  label: term.label,
                                  amount: termAmount,
                                  percent: Number(term.percent) || 0,
                                  dueDate: term.due_date || '',
                                  status: isPaid
                                      ? ('paid' as PaymentTermStatus)
                                      : ((term.status as PaymentTermStatus) ||
                                        'unpaid'),
                                  paidAmount:
                                      paidAmount > 0 ? paidAmount : undefined,
                                  paidAt: latestSettlement?.paid_at,
                                  paymentMethod:
                                      latestSettlement?.payment_method,
                                  paymentRef:
                                      latestSettlement?.payment_ref ||
                                      undefined,
                                  notes: term.notes,
                              };
                          },
                      ),
                  }
                : undefined,
            locations: (Array.isArray(dbProject.locations)
                ? dbProject.locations
                : []
            ).map((loc: DbProjectLocation) => ({
                id: loc.id,
                code: loc.code,
                area: loc.area,
                description: loc.description,
                type: loc.type || 'Billboard',
                size: loc.size,
                vendorId: loc.vendor_id ?? null,
                vendorName: loc.vendor?.name ?? '-',
                vendorCost: Number(loc.vendor_cost) || 0,
                poIssued: Boolean(loc.po_issued),
                poNumber: loc.po_number || '',
                purchaseOrderId: loc.purchase_order_id ?? undefined,
                orientation: loc.orientation,
                lighting: loc.lighting,
                topNotes: loc.top_notes,
            })),
            purchaseOrders: (Array.isArray(dbProject.purchase_orders)
                ? dbProject.purchase_orders
                : []
            ).map((po: DbPurchaseOrder): PurchaseOrderWithPlan => {
                const plan = po.payment_plan ?? null;
                return {
                    id: po.id,
                    po_number: po.po_number,
                    vendor_id: po.vendor_id,
                    vendor_name: po.vendor?.name ?? '-',
                    total: Number(po.total) || 0,
                    payment_plan: plan
                        ? {
                              id: plan.id,
                              scheme: (plan.scheme as PaymentScheme) || 'full',
                              total_amount: Number(plan.total_amount) || 0,
                              notes: plan.notes ?? null,
                              terms: (plan.terms ?? []).map(
                                  (
                                      term: DbPaymentTerm,
                                  ): VendorPaymentPlanTerm => {
                                      const settlements = (
                                          term.settlements ?? []
                                      ).map((s) => ({
                                          id: s.id,
                                          amount: Number(s.amount) || 0,
                                          paid_at: s.paid_at ?? '',
                                          payment_method: s.payment_method,
                                          payment_ref: s.payment_ref ?? null,
                                          notes: s.notes ?? null,
                                      }));
                                      const totalPaid = settlements.reduce(
                                          (sum, s) => sum + s.amount,
                                          0,
                                      );
                                      const termAmount =
                                          Number(term.amount) || 0;
                                      const isPaid =
                                          term.status === 'paid' ||
                                          (termAmount > 0 &&
                                              totalPaid >= termAmount - 1);
                                      const remaining = isPaid
                                          ? 0
                                          : Math.max(
                                                0,
                                                termAmount - totalPaid,
                                            );
                                      return {
                                          id: term.id,
                                          sort_order: term.sort_order ?? 0,
                                          label: term.label,
                                          amount: termAmount,
                                          percent: Number(term.percent) || 0,
                                          due_date: term.due_date ?? '',
                                          status: isPaid
                                              ? ('paid' as PaymentTermStatus)
                                              : (term.status as PaymentTermStatus) ??
                                                'unpaid',
                                          notes: term.notes ?? null,
                                          settlements,
                                          totalPaid,
                                          remaining: Math.max(
                                              0,
                                              termAmount - totalPaid,
                                          ),
                                          isPaid: term.status === 'paid',
                                      };
                                  },
                              ),
                          }
                        : null,
                };
            }),
        };
    }, [dbProject]);

    const locations = displayedProject.locations || [];

    const onUpdateProject = (_updated?: Project) => {
        void _updated;
        router.reload();
    };

    const validTabs: ActiveTab[] = ['info', 'locations', 'vendors', 'invoice'];

    const getInitialTab = (): ActiveTab => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '') as ActiveTab;
            if (validTabs.includes(hash)) return hash;

            const searchParams = new URLSearchParams(window.location.search);
            const tabParam = searchParams.get('tab') as ActiveTab;
            if (validTabs.includes(tabParam)) return tabParam;
        }
        return 'info';
    };

    const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.hash = tab;
            window.history.replaceState(null, '', url.toString());
        }
    };

    // Issue Invoice Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [modalScheme, setModalScheme] = useState<PaymentScheme>('termin');
    const [modalTerminPercents, setModalTerminPercents] = useState<number[]>([
        30, 40, 30,
    ]);
    const [modalDueDates, setModalDueDates] = useState<Record<number, string>>(
        {},
    );
    const [modalPercentError, setModalPercentError] = useState<string | null>(
        null,
    );

    // Receive Payment Modal State
    const [selectedPayTerm, setSelectedPayTerm] = useState<PaymentTerm | null>(
        null,
    );
    const [payType, setPayType] = useState<'full' | 'partial'>('full');
    const [payAmountInput, setPayAmountInput] = useState<number>(0);
    const [payDateInput, setPayDateInput] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [payAccountId, setPayAccountId] = useState<string>('');
    const [payRefInput, setPayRefInput] = useState<string>('');

    // Toast state
    const [toast, setToast] = useState<{
        show: boolean;
        type: ToastType;
        title?: string;
        message: string;
    }>({
        show: false,
        type: 'success',
        message: '',
    });

    const triggerToast = (
        message: string,
        type: ToastType = 'success',
        title?: string,
    ) => {
        setToast({
            show: true,
            type,
            title,
            message,
        });
    };

    // Flash Message Listener
    const { flash } =
        usePage<PageProps<{ flash?: { success?: string; error?: string } }>>()
            .props;

    useEffect(() => {
        if (flash?.success) {
            triggerToast(flash.success, 'success', 'Operasi Berhasil');
        } else if (flash?.error) {
            triggerToast(flash.error, 'error', 'Operasi Gagal');
        }
    }, [flash]);

    const prj = displayedProject;
    const isPPN = fiscalMode === 'ppn';
    const fin = calcFinancials(prj, locations, fiscalMode);

    const tabs = [
        {
            id: 'info' as ActiveTab,
            label: 'Info Proyek',
            icon: (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            id: 'locations' as ActiveTab,
            label: 'Titik Lokasi',
            badge: locations.length,
            icon: (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
        },
        {
            id: 'vendors' as ActiveTab,
            label: 'Vendor & PO',
            badge:
                locations.filter((l) => l.poIssued).length > 0
                    ? `${locations.filter((l) => l.poIssued).length}/${locations.length}`
                    : undefined,
            icon: (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            ),
        },
        {
            id: 'invoice' as ActiveTab,
            label: 'Invoice Client',
            icon: (
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
        },
    ];

    return (
        <AppLayout
            title="Detail Proyek"
            activePage="projects"
            breadcrumbs={[
                { label: 'Proyek', href: '/projects' },
                { label: prj.name, href: `/projects/${prj.id}` },
            ]}
        >
            <div className="w-full">
                <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-4 flex">
                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center gap-2 rounded-lg py-2 pr-4 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
                        >
                            <svg
                                className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600"
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
                            Kembali ke Daftar Proyek
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
                        {/* HEADER — Clean Modern Executive Header */}
                        <div className="border-b border-slate-200 bg-white px-8 py-6">
                            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                                {/* Left Side: Project Core Info */}
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                                            {prj.code}
                                        </span>
                                        <StatusBadge status={prj.status} />
                                        <span className="rounded-md border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                                            {isPPN
                                                ? 'Mode PPN (11%)'
                                                : 'Mode Non-PPN'}
                                        </span>
                                    </div>
                                    <h2 className="pt-0.5 text-xl font-black leading-snug tracking-tight text-slate-900 sm:text-2xl">
                                        {prj.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                            {prj.clientName}
                                        </span>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1 text-slate-600">
                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
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
                                            PIC:{' '}
                                            <strong className="font-semibold text-slate-800">
                                                {prj.salesPIC}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side: Prominent Masa Tayang Card with Progress */}
                                {(() => {
                                    const prog = calcPeriodProgress(
                                        prj.startDate,
                                        prj.endDate,
                                        prj.status,
                                    );
                                    return (
                                        <div className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:w-auto sm:min-w-[340px]">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                                                        Masa Tayang Kampanye
                                                    </span>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${prog.badgeBg}`}
                                                >
                                                    {prog.state === 'running'
                                                        ? `${prog.percent}% Selesai`
                                                        : prog.state ===
                                                            'upcoming'
                                                          ? 'Akan Tayang'
                                                          : prog.state ===
                                                              'completed'
                                                            ? 'Selesai'
                                                            : 'Jadwal'}
                                                </span>
                                            </div>

                                            {/* Date Range String */}
                                            <div className="font-mono text-xs font-bold text-slate-800">
                                                {prj.period}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-2.5 space-y-1.5">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${prog.barClass}`}
                                                        style={{
                                                            width: `${prog.percent}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="font-semibold text-slate-500">
                                                        {prog.label}
                                                    </span>
                                                    {prog.totalDays > 0 && (
                                                        <span className="font-mono font-bold text-slate-700">
                                                            {prog.totalDays}{' '}
                                                            Hari
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* TABS NAVIGATION — Clean Modern Border Tabs */}
                        <div className="flex flex-shrink-0 border-b border-slate-200 bg-white px-8">
                            <div className="flex gap-6">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() =>
                                                handleTabChange(tab.id)
                                            }
                                            className={`flex cursor-pointer items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'border-primary font-black text-primary'
                                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                                            }`}
                                        >
                                            <span
                                                className={
                                                    isActive
                                                        ? 'text-primary'
                                                        : 'text-slate-400'
                                                }
                                            >
                                                {tab.icon}
                                            </span>
                                            <span>{tab.label}</span>
                                            {tab.badge !== undefined && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                                                        isActive
                                                            ? 'bg-primary/10 ring-primary/20 text-primary ring-1'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CONTENT BODY */}
                        <div className="flex-1 space-y-6 overflow-y-auto p-7">
                            {/* INFO TAB — Styled Visual Cards & Clean Hierarchy */}
                            {activeTab === 'info' && (
                                <InfoTab
                                    project={displayedProject}
                                    isPPN={isPPN}
                                />
                            )}

                            {/* LOCATIONS TAB */}
                            {activeTab === 'locations' && (
                                <LocationsTab
                                    locations={locations}
                                    isPPN={isPPN}
                                    vendors={vendors}
                                    purchaseOrders={prj.purchaseOrders ?? []}
                                    onAddLocation={(newLoc) => {
                                        if (!newLoc.vendorId) return;
                                        router.post(
                                            `/projects/${prj.id}/locations`,
                                            {
                                                vendor_id: newLoc.vendorId,
                                                area: newLoc.area,
                                                description: newLoc.description,
                                                type: newLoc.type,
                                                size: newLoc.size,
                                                orientation: newLoc.orientation,
                                                lighting: newLoc.lighting,
                                                qty: newLoc.qty || 1,
                                                vendor_cost: newLoc.vendorCost,
                                                top_notes: newLoc.topNotes,
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                    onUpdateLocation={(locId, updatedData) => {
                                        router.put(
                                            `/projects/${prj.id}/locations/${locId}`,
                                            updatedData,
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                    onDeleteLocation={(locId) => {
                                        router.delete(
                                            `/projects/${prj.id}/locations/${locId}`,
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                    onCancelPO={(poId) => {
                                        router.delete(
                                            `/projects/${prj.id}/purchase-orders/${poId}`,
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                />
                            )}

                            {/* VENDOR & PO TAB */}
                            {activeTab === 'vendors' && (
                                <VendorPOTab
                                    locations={locations}
                                    isPPN={isPPN}
                                    project={prj}
                                    projectId={prj.id}
                                    purchaseOrders={prj.purchaseOrders ?? []}
                                    cashBankAccounts={cashBankAccounts}
                                    onTriggerToast={(message, type, title) =>
                                        triggerToast(message, type, title)
                                    }
                                    onIssuePO={(
                                        locId,
                                        _poNumber,
                                        lighting,
                                        topNotes,
                                        vendorTermScheme,
                                        vendorTermPercents,
                                        vendorTermDates,
                                    ) => {
                                        const targetLoc = locations.find(
                                            (l) => l.id === locId,
                                        );
                                        if (!targetLoc?.vendorId) return;

                                        router.post(
                                            `/projects/${prj.id}/purchase-orders`,
                                            {
                                                vendor_id: targetLoc.vendorId,
                                                location_ids: [targetLoc.id],
                                                transaction_date: new Date()
                                                    .toISOString()
                                                    .split('T')[0],
                                                lighting:
                                                    lighting ||
                                                    targetLoc.lighting ||
                                                    'Berlampu',
                                                top_notes:
                                                    topNotes ||
                                                    targetLoc.topNotes ||
                                                    'Lunas setelah visual terpasang',
                                                term_scheme:
                                                    vendorTermScheme || 'full',
                                                term_percents:
                                                    vendorTermPercents &&
                                                    vendorTermPercents.length >
                                                        0
                                                        ? vendorTermPercents
                                                        : [100],
                                                term_due_dates:
                                                    vendorTermDates &&
                                                    vendorTermDates.length > 0
                                                        ? vendorTermDates
                                                        : [
                                                              new Date()
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0],
                                                          ],
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                    onIssueBulkPO={(
                                        vendorId,
                                        locationIds,
                                        _poNumber,
                                        lighting,
                                        topNotes,
                                        vendorTermScheme,
                                        vendorTermPercents,
                                        vendorTermDates,
                                    ) => {
                                        router.post(
                                            `/projects/${prj.id}/purchase-orders`,
                                            {
                                                vendor_id: vendorId,
                                                location_ids: locationIds,
                                                transaction_date: new Date()
                                                    .toISOString()
                                                    .split('T')[0],
                                                lighting:
                                                    lighting || 'Berlampu',
                                                top_notes:
                                                    topNotes ||
                                                    'Lunas setelah visual terpasang',
                                                term_scheme:
                                                    vendorTermScheme || 'full',
                                                term_percents:
                                                    vendorTermPercents &&
                                                    vendorTermPercents.length >
                                                        0
                                                        ? vendorTermPercents
                                                        : [100],
                                                term_due_dates:
                                                    vendorTermDates &&
                                                    vendorTermDates.length > 0
                                                        ? vendorTermDates
                                                        : [
                                                              new Date()
                                                                  .toISOString()
                                                                  .split(
                                                                      'T',
                                                                  )[0],
                                                          ],
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    router.reload();
                                                },
                                            },
                                        );
                                    }}
                                    onUpdateProject={onUpdateProject}
                                />
                            )}

                            {/* INVOICE TAB */}
                            {activeTab === 'invoice' && (
                                <InvoiceTab
                                    project={displayedProject}
                                    isPPN={isPPN}
                                    onOpenInvoiceModal={() =>
                                        setShowInvoiceModal(true)
                                    }
                                    onUpdateProject={onUpdateProject}
                                    onTriggerToast={triggerToast}
                                    onOpenPaymentModal={(term) => {
                                        setSelectedPayTerm(term);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Catat Pembayaran Client (Reusable Component) */}
                {selectedPayTerm && (
                    <RecordInvoicePaymentModal
                        isOpen={!!selectedPayTerm}
                        invoice={{
                            id: prj.id,
                            invoiceNumber: prj.invoiceNumber || `INV-${prj.code}`,
                            clientName: prj.clientName,
                            projectName: prj.name,
                            totalAmount: prj.contractValue,
                            terms: (prj.clientPaymentPlan?.terms || []).map((t: PaymentTerm) => ({
                                id: t.id,
                                label: t.label,
                                amount: t.amount,
                                percent: t.percent,
                                due_date: t.dueDate,
                                status: t.status === 'paid' ? 'paid' : 'unpaid',
                                paid_amount: t.paidAmount || 0,
                                remaining_amount: Math.max(
                                    0,
                                    t.amount - (t.paidAmount || 0),
                                ),
                            })),
                        }}
                        initialTerm={{
                            id: selectedPayTerm.id,
                            label: selectedPayTerm.label,
                            amount: selectedPayTerm.amount,
                            percent: selectedPayTerm.percent,
                            due_date: selectedPayTerm.dueDate,
                            status: selectedPayTerm.status === 'paid' ? 'paid' : 'unpaid',
                            paid_amount: selectedPayTerm.paidAmount || 0,
                            remaining_amount: Math.max(
                                0,
                                selectedPayTerm.amount - (selectedPayTerm.paidAmount || 0),
                            ),
                        }}
                        cashBankAccounts={cashBankAccounts}
                        remainingAmount={
                            Math.max(
                                0,
                                selectedPayTerm.amount - (selectedPayTerm.paidAmount || 0),
                            )
                        }
                        onClose={() => setSelectedPayTerm(null)}
                        onSubmit={(data: RecordInvoicePaymentModalSubmitData) => {
                            const termId = data.term_id || selectedPayTerm.id;
                            const dppPaidAmt = data.amount;

                            const selectedAccount = cashBankAccounts.find(
                                (a) => String(a.id) === String(data.account_id),
                            );
                            const derivedMethod = selectedAccount
                                ? selectedAccount.name
                                : (data.method || 'Transfer Bank BCA');

                            router.post(
                                `/projects/${prj.id}/invoice/payment-terms/${termId}/settle`,
                                {
                                    amount: dppPaidAmt,
                                    paid_at: data.date || new Date().toISOString().split('T')[0],
                                    payment_method: derivedMethod,
                                    account_id: data.account_id ? String(data.account_id) : undefined,
                                    payment_ref: data.referenceNo || undefined,
                                    notes: data.notes || `Penerimaan Pembayaran ${data.termLabel} - ${prj.clientName}`,
                                },
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: () => {
                                        setSelectedPayTerm(null);
                                        triggerToast(
                                            `Pembayaran ${data.termLabel} sebesar ${fmt(data.amount)} berhasil dicatat & dibukukan ke jurnal akuntansi.`,
                                            'success',
                                            'Pembayaran Diterima',
                                        );
                                    },
                                    onError: (errors) => {
                                        const errMsg =
                                            errors.amount ||
                                            errors.paid_at ||
                                            Object.values(errors)[0] ||
                                            'Gagal mencatat pembayaran.';
                                        triggerToast(
                                            String(errMsg),
                                            'error',
                                            'Gagal Menyimpan',
                                        );
                                    },
                                },
                            );
                        }}
                    />
                )}

                {/* Modal Terbitkan Invoice & Skema Penagihan */}
                {showInvoiceModal && (
                    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
                        <div className="animate-in fade-in zoom-in w-full max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                        {!prj.clientPaymentPlan
                                            ? 'Atur Skema Pembayaran Client'
                                            : 'Ubah Skema Pembayaran Client'}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Atur termin tagihan pembayaran untuk
                                        proyek ini
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                        Total Nilai Tagihan
                                    </div>
                                    <div className="font-mono text-base font-black text-blue-950">
                                        {fmt(fin.totalInvoice)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                        Status Pajak
                                    </div>
                                    <div className="text-xs font-bold text-blue-700">
                                        {isPPN ? 'PPN 11% Aktif' : 'Non-PPN'}
                                    </div>
                                </div>
                            </div>

                            {/* Pilihan Skema */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Pilih Skema Pembayaran
                                </label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        {
                                            id: 'full' as PaymentScheme,
                                            label: 'Lunas 100%',
                                            desc: '1 kali pembayaran penuh',
                                        },
                                        {
                                            id: 'dp' as PaymentScheme,
                                            label: 'DP + Pelunasan',
                                            desc: '2 kali (DP 50% & Sisa 50%)',
                                        },
                                        {
                                            id: 'termin' as PaymentScheme,
                                            label: 'Termin Kustom',
                                            desc: 'Fleksibel 2-4 tahapan',
                                        },
                                    ].map((sc) => (
                                        <button
                                            key={sc.id}
                                            type="button"
                                            onClick={() => {
                                                setModalScheme(sc.id);
                                                if (sc.id === 'full') {
                                                    setModalTerminPercents([
                                                        100,
                                                    ]);
                                                } else if (sc.id === 'dp') {
                                                    setModalTerminPercents([
                                                        50, 50,
                                                    ]);
                                                } else {
                                                    setModalTerminPercents([
                                                        30, 40, 30,
                                                    ]);
                                                }
                                                setModalPercentError(null);
                                            }}
                                            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                                modalScheme === sc.id
                                                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                                                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div
                                                className={`text-xs font-bold ${
                                                    modalScheme === sc.id
                                                        ? 'text-blue-900'
                                                        : 'text-slate-800'
                                                }`}
                                            >
                                                {sc.label}
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-slate-500">
                                                {sc.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Breakdown Tahapan Termin */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Rincian Termin, Persentase & Jatuh Tempo
                                    </label>
                                    {(() => {
                                        const sumPct =
                                            modalTerminPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );
                                        return (
                                            <span
                                                className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                                                    sumPct === 100
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                                }`}
                                            >
                                                Total: {sumPct}% (
                                                {fmt(fin.totalInvoice)})
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Additional Duration Controller for Installment Scheme */}
                                {modalScheme === 'installment' && (
                                    <div className="flex items-center justify-between rounded-2xl border border-blue-100/90 bg-blue-50/70 p-3">
                                        <div>
                                            <div className="text-xs font-bold text-blue-900">
                                                Durasi Angsuran Bulanan
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-medium text-blue-700">
                                                Ubah jumlah bulan cicilan yang
                                                diinginkan
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {(() => {
                                                const calcInstallmentPercents =
                                                    (
                                                        count: number,
                                                    ): number[] => {
                                                        const per = Math.round(
                                                            100 / count,
                                                        );
                                                        const res =
                                                            Array(count).fill(
                                                                per,
                                                            );
                                                        const sumExceptLast =
                                                            per * (count - 1);
                                                        res[count - 1] =
                                                            100 - sumExceptLast;
                                                        return res;
                                                    };

                                                return (
                                                    <>
                                                        {[3, 6, 12].map(
                                                            (monthsCount) => (
                                                                <button
                                                                    key={
                                                                        monthsCount
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setModalTerminPercents(
                                                                            calcInstallmentPercents(
                                                                                monthsCount,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                                                                        modalTerminPercents.length ===
                                                                        monthsCount
                                                                            ? 'shadow-2xs border-blue-600 bg-blue-600 text-white'
                                                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {
                                                                        monthsCount
                                                                    }{' '}
                                                                    Bulan
                                                                </button>
                                                            ),
                                                        )}
                                                        <div className="mx-1 h-4 w-px bg-blue-200" />
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                modalTerminPercents.length <=
                                                                2
                                                            }
                                                            onClick={() => {
                                                                const newCount =
                                                                    Math.max(
                                                                        2,
                                                                        modalTerminPercents.length -
                                                                            1,
                                                                    );
                                                                setModalTerminPercents(
                                                                    calcInstallmentPercents(
                                                                        newCount,
                                                                    ),
                                                                );
                                                            }}
                                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-5 text-center font-mono text-xs font-bold text-blue-950">
                                                            {
                                                                modalTerminPercents.length
                                                            }
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                modalTerminPercents.length >=
                                                                24
                                                            }
                                                            onClick={() => {
                                                                const newCount =
                                                                    Math.min(
                                                                        24,
                                                                        modalTerminPercents.length +
                                                                            1,
                                                                    );
                                                                setModalTerminPercents(
                                                                    calcInstallmentPercents(
                                                                        newCount,
                                                                    ),
                                                                );
                                                            }}
                                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            +
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-64 divide-y divide-slate-100 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200">
                                    {(() => {
                                        const now = new Date();
                                        const addDays = (
                                            d: Date,
                                            days: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setDate(res.getDate() + days);
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };
                                        const addMonths = (
                                            d: Date,
                                            months: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setMonth(
                                                res.getMonth() + months,
                                            );
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };

                                        let defaultLabels: string[] = [];
                                        if (modalScheme === 'full') {
                                            defaultLabels = [
                                                'Lunas Sekaligus (100%)',
                                            ];
                                        } else if (modalScheme === 'dp') {
                                            defaultLabels = [
                                                'Termin 1 – Uang Muka (DP)',
                                                'Termin 2 – Pelunasan',
                                            ];
                                        } else if (modalScheme === 'termin') {
                                            defaultLabels = [
                                                'Termin 1 – Uang Muka',
                                                'Termin 2 – Progress',
                                                'Termin 3 – Pelunasan',
                                            ];
                                        } else {
                                            const count =
                                                modalTerminPercents.length;
                                            defaultLabels = Array.from(
                                                { length: count },
                                                (_, i) =>
                                                    `Cicilan ${i + 1} dari ${count}`,
                                            );
                                        }

                                        return defaultLabels.map(
                                            (label, idx) => {
                                                const pct =
                                                    modalTerminPercents[idx] ??
                                                    (modalScheme === 'full'
                                                        ? 100
                                                        : modalScheme === 'dp'
                                                          ? idx === 0
                                                              ? 30
                                                              : 70
                                                          : 30);
                                                const termAmt = Math.round(
                                                    (prj.contractValue * pct) /
                                                        100,
                                                );
                                                const termAmtWithPpn = isPPN
                                                    ? Math.round(termAmt * 1.11)
                                                    : termAmt;
                                                const defaultDue =
                                                    modalScheme ===
                                                    'installment'
                                                        ? addMonths(
                                                              now,
                                                              idx + 1,
                                                          )
                                                        : addDays(
                                                              now,
                                                              (idx + 1) * 7,
                                                          );
                                                const currentDate =
                                                    modalDueDates[idx] ||
                                                    defaultDue;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3 text-xs"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate font-bold text-slate-800">
                                                                {label}
                                                            </div>
                                                            <div className="font-mono text-[10px] font-semibold text-slate-500">
                                                                {fmt(
                                                                    termAmtWithPpn,
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-shrink-0 items-center gap-3">
                                                            {/* Percentage Input */}
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Porsi:
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={100}
                                                                    value={pct}
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const val =
                                                                            Math.max(
                                                                                0,
                                                                                Math.min(
                                                                                    100,
                                                                                    parseFloat(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                ),
                                                                            );
                                                                        const updated =
                                                                            [
                                                                                ...modalTerminPercents,
                                                                            ];
                                                                        updated[
                                                                            idx
                                                                        ] = val;
                                                                        setModalTerminPercents(
                                                                            updated,
                                                                        );
                                                                        setModalPercentError(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                                                                />
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    %
                                                                </span>
                                                            </div>

                                                            {/* Due Date Picker (Indonesian Format) */}
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Jatuh Tempo:
                                                                </span>
                                                                <div className="relative flex items-center">
                                                                    <div className="shadow-2xs flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 transition-colors hover:border-blue-600">
                                                                        <span>
                                                                            {formatIndoDate(
                                                                                currentDate,
                                                                            )}
                                                                        </span>
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-slate-400"
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
                                                                    </div>
                                                                    <input
                                                                        type="date"
                                                                        value={
                                                                            currentDate
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setModalDueDates(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [idx]: e
                                                                                        .target
                                                                                        .value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Error Banner when sum != 100% */}
                            {modalPercentError && (
                                <div className="shadow-2xs flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                                    <span>{modalPercentError}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModalPercentError(null)
                                        }
                                        className="ml-2 cursor-pointer text-sm font-extrabold text-rose-500 hover:text-rose-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Footer Action */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalPercentError(null);
                                        setShowInvoiceModal(false);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const sumPct =
                                            modalTerminPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );
                                        // Persiapkan array due_dates sesuai urutan termin
                                        const now = new Date();
                                        const addDays = (d: Date, days: number) => {
                                            const res = new Date(d);
                                            res.setDate(res.getDate() + days);
                                            return res.toISOString().split('T')[0];
                                        };
                                        const addMonths = (d: Date, months: number) => {
                                            const res = new Date(d);
                                            res.setMonth(res.getMonth() + months);
                                            return res.toISOString().split('T')[0];
                                        };

                                        const percents = modalScheme === 'full'
                                            ? [100]
                                            : modalScheme === 'dp'
                                              ? [modalTerminPercents[0] ?? 30, modalTerminPercents[1] ?? 70]
                                              : modalTerminPercents;

                                        const dueDates = percents.map((_, idx) => {
                                            if (modalDueDates[idx]) {
                                                return modalDueDates[idx];
                                            }
                                            return modalScheme === 'installment'
                                                ? addMonths(now, idx + 1)
                                                : addDays(now, (idx + 1) * 7);
                                        });

                                        // Pastikan URL hash tetap di #invoice
                                        if (typeof window !== 'undefined') {
                                            const currentUrl = new URL(window.location.href);
                                            currentUrl.hash = 'invoice';
                                            window.history.replaceState(null, '', currentUrl.toString());
                                        }

                                        router.post(
                                            `/projects/${prj.id}/payment-plan`,
                                            {
                                                scheme: modalScheme,
                                                percents: percents,
                                                due_dates: dueDates,
                                                notes: null,
                                            },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                                onSuccess: () => {
                                                    setShowInvoiceModal(false);
                                                    setToast({
                                                        show: true,
                                                        type: 'success',
                                                        title: 'Skema Pembayaran Disimpan',
                                                        message: `Skema pembayaran termin client berhasil disimpan untuk proyek ${prj.name}.`,
                                                    });
                                                },
                                                onError: (errs) => {
                                                    const errorMsg = Object.values(errs).flat().join(' ') || 'Gagal menyimpan skema pembayaran.';
                                                    setModalPercentError(errorMsg);
                                                    setToast({
                                                        show: true,
                                                        type: 'error',
                                                        title: 'Gagal Menyimpan',
                                                        message: errorMsg,
                                                    });
                                                },
                                            },
                                        );
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {!prj.clientPaymentPlan
                                        ? 'Simpan Skema Pembayaran'
                                        : !prj.invoiceIssued
                                          ? 'Simpan Skema Pembayaran'
                                          : 'Simpan Perubahan Skema'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Floating Toast Notification */}
                <Toast
                    show={toast.show}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() =>
                        setToast((prev) => ({ ...prev, show: false }))
                    }
                />
            </div>
        </AppLayout>
    );
}
