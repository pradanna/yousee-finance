import SelectInput from '@/Components/Form/SelectInput';
import { RecordInvoicePaymentModal } from '@/Components/Modal/RecordInvoicePaymentModal';
import { RecordPaymentModal } from '@/Components/Modal/RecordPaymentModal';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import Toast from '@/Components/UI/Toast';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import type { PageProps as BasePageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
export interface MilestoneItem {
    id: string;
    sort_order: number;
    label: string;
    amount: number;
    paid_amount: number;
    remaining_amount: number;
    due_date: string | null;
    status: string;
    notes?: string | null;
}

export interface ReceivableRecord {
    id: string;
    invoice_number: string;
    client_id: string;
    client_name: string;
    project_id: string | null;
    project_code: string;
    project_name: string;
    sales_name: string;
    transaction_date: string | null;
    due_date: string | null;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'paid' | 'partial' | 'unpaid';
    scheme: string;
    milestones: MilestoneItem[];
    nearest_milestone: MilestoneItem | null;
    is_overdue: boolean;
    overdue_days: number;
    fiscal_mode: 'ppn' | 'non-ppn';
}

export interface PayableRecord {
    id: string;
    po_number: string;
    vendor_id: string;
    vendor_name: string;
    project_id: string | null;
    project_code: string;
    project_name: string;
    transaction_date: string | null;
    due_date: string | null;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: 'paid' | 'partial' | 'unpaid';
    scheme: string;
    milestones: MilestoneItem[];
    nearest_milestone: MilestoneItem | null;
    is_overdue: boolean;
    overdue_days: number;
    fiscal_mode: 'ppn' | 'non-ppn';
}

export interface CoaOption {
    id: string;
    code: string;
    name: string;
}

export interface DebtReceivablePageProps extends BasePageProps {
    receivables: ReceivableRecord[];
    payables: PayableRecord[];
    paymentAccounts: CoaOption[];
    summary: {
        totalReceivable: number;
        totalPayable: number;
        netBalance: number;
        overdueCount: number;
        overdueReceivablesCount: number;
        overduePayablesCount: number;
    };
    clients: Array<{ id: string; name: string }>;
    vendors: Array<{ id: string; name: string }>;
}

const fmt = (n: number | string) =>
    `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const ITEMS_PER_PAGE = 10;

export default function DebtReceivable() {
    const {
        receivables = [],
        payables = [],
        paymentAccounts = [],
        summary,
        clients = [],
        vendors = [],
    } = usePage<DebtReceivablePageProps>().props;

    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // Tabs & Filters
    const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>(
        'payable',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [partnerFilter, setPartnerFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<string>('due');

    const [receivablesPage, setReceivablesPage] = useState(1);
    const [payablesPage, setPayablesPage] = useState(1);

    // Modals
    const [termsModal, setTermsModal] = useState<{
        isOpen: boolean;
        type: 'receivable' | 'payable';
        item: ReceivableRecord | PayableRecord;
    } | null>(null);

    // Modal Catat Pembayaran Hutang Vendor (Payable)
    const [payablePaymentModal, setPayablePaymentModal] = useState<{
        isOpen: boolean;
        item: PayableRecord | null;
    }>({
        isOpen: false,
        item: null,
    });

    // Modal Catat Penerimaan Piutang Client (Receivable)
    const [receivablePaymentModal, setReceivablePaymentModal] = useState<{
        isOpen: boolean;
        item: ReceivableRecord | null;
    }>({
        isOpen: false,
        item: null,
    });

    const [isSubmittingPayable, setIsSubmittingPayable] = useState(false);
    const [isSubmittingReceivable, setIsSubmittingReceivable] = useState(false);

    const [toast, setToast] = useState<{
        show: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({
        show: false,
        type: 'success',
        title: '',
        message: '',
    });

    const triggerToast = (
        message: string,
        type: 'success' | 'error' | 'warning' = 'success',
        title = 'Notifikasi',
    ) => {
        setToast({ show: true, type, title, message });
    };

    // Handler Pelunasan Hutang Vendor
    const handleSavePayablePayment = (data: {
        poNumber: string;
        termLabel: string;
        amount: number;
        date: string;
        method: string;
        account_id?: string | number;
        referenceNo: string;
        notes: string;
    }) => {
        const p = payablePaymentModal.item;
        if (!p) return;

        const targetProjectId = p.project_id;
        const targetPoId = p.id;
        const unpaidMilestone =
            p.milestones.find(
                (m) => m.status !== 'paid' && m.remaining_amount > 0,
            ) || p.milestones[0];

        if (!targetProjectId || !targetPoId || !unpaidMilestone) {
            triggerToast(
                'Data PO atau termin pembayaran tidak valid.',
                'error',
                'Pembayaran Gagal',
            );
            return;
        }

        setIsSubmittingPayable(true);
        router.post(
            `/projects/${targetProjectId}/purchase-orders/${targetPoId}/payment-terms/${unpaidMilestone.id}/settle`,
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
                    setPayablePaymentModal({ isOpen: false, item: null });
                    triggerToast(
                        `Berhasil mencatat pembayaran kas ${fmt(data.amount)} untuk ${data.poNumber}!`,
                        'success',
                        'Pembayaran Vendor Berhasil',
                    );
                },
                onError: (errors) => {
                    const firstError =
                        Object.values(errors)[0] ||
                        'Gagal mencatat pembayaran hutang vendor. Periksa kembali nominal pembayaran.';
                    triggerToast(
                        String(firstError),
                        'error',
                        'Pembayaran Gagal',
                    );
                },
                onFinish: () => {
                    setIsSubmittingPayable(false);
                },
            },
        );
    };

    // Handler Penerimaan Piutang Klien
    const handleSaveReceivablePayment = (data: {
        invoiceNumber: string;
        term_id?: string | number;
        termLabel: string;
        amount: number;
        date: string;
        method: string;
        account_id?: string;
        referenceNo: string;
        notes: string;
    }) => {
        const r = receivablePaymentModal.item;
        if (!r) return;

        const targetProjectId = r.project_id;
        let targetTermId = data.term_id;
        if (!targetTermId) {
            const unpaidMilestone =
                r.milestones.find(
                    (m) => m.status !== 'paid' && m.remaining_amount > 0,
                ) || r.milestones[0];
            targetTermId = unpaidMilestone?.id;
        }

        if (!targetProjectId || !targetTermId) {
            triggerToast(
                'Data Invoice atau termin penerimaan tidak valid.',
                'error',
                'Pencatatan Gagal',
            );
            return;
        }

        setIsSubmittingReceivable(true);
        router.post(
            `/projects/${targetProjectId}/invoice/payment-terms/${targetTermId}/settle`,
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
                    setReceivablePaymentModal({ isOpen: false, item: null });
                    triggerToast(
                        `Berhasil mencatat penerimaan kas ${fmt(data.amount)} untuk Invoice ${data.invoiceNumber}!`,
                        'success',
                        'Penerimaan Piutang Berhasil',
                    );
                },
                onError: (errors) => {
                    const firstError =
                        Object.values(errors)[0] ||
                        'Gagal mencatat pelunasan piutang klien. Periksa kembali nominal penerimaan.';
                    triggerToast(
                        String(firstError),
                        'error',
                        'Pencatatan Gagal',
                    );
                },
                onFinish: () => {
                    setIsSubmittingReceivable(false);
                },
            },
        );
    };

    // Sinkronisasi data saat mode fiskal berubah
    React.useEffect(() => {
        router.get(
            '/debt-receivable',
            { fiscal_mode: fiscalMode },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['receivables', 'payables', 'summary'],
            },
        );
    }, [fiscalMode]);

    // Helper to get sorting timestamp (overdue first, earliest unpaid milestone due date)
    const getItemDueTime = (item: ReceivableRecord | PayableRecord): number => {
        if (item.status === 'paid' || item.remaining_amount <= 0) {
            return 9999999999999; // Lunas diletakkan paling bawah
        }
        const targetDate = item.nearest_milestone?.due_date || item.due_date;
        if (!targetDate) return 9999999999990;
        return new Date(targetDate).getTime();
    };

    // Filter & Sort Receivables
    const filteredReceivables = useMemo(() => {
        return receivables
            .filter((r) => {
                const matchesSearch =
                    r.invoice_number
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    r.client_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    r.project_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    r.project_code
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                let matchesStatus = true;
                if (statusFilter === 'overdue') matchesStatus = r.is_overdue;
                else if (statusFilter === 'partial')
                    matchesStatus = r.status === 'partial';
                else if (statusFilter === 'unpaid')
                    matchesStatus = r.status === 'unpaid';
                else if (statusFilter === 'paid')
                    matchesStatus = r.status === 'paid';

                const matchesPartner =
                    partnerFilter === 'all' || r.client_name === partnerFilter;

                return matchesSearch && matchesStatus && matchesPartner;
            })
            .sort((a, b) => {
                if (sortOrder === 'amount_desc')
                    return b.remaining_amount - a.remaining_amount;
                if (sortOrder === 'newest') {
                    return (
                        new Date(b.transaction_date || '').getTime() -
                        new Date(a.transaction_date || '').getTime()
                    );
                }
                // Default 'due': Prioritaskan yang overdue paling lama / jatuh tempo terdekat di atas
                return getItemDueTime(a) - getItemDueTime(b);
            });
    }, [receivables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Filter & Sort Payables
    const filteredPayables = useMemo(() => {
        return payables
            .filter((p) => {
                const matchesSearch =
                    p.po_number
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    p.vendor_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    p.project_name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    p.project_code
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                let matchesStatus = true;
                if (statusFilter === 'overdue') matchesStatus = p.is_overdue;
                else if (statusFilter === 'partial')
                    matchesStatus = p.status === 'partial';
                else if (statusFilter === 'unpaid')
                    matchesStatus = p.status === 'unpaid';
                else if (statusFilter === 'paid')
                    matchesStatus = p.status === 'paid';

                const matchesPartner =
                    partnerFilter === 'all' || p.vendor_name === partnerFilter;

                return matchesSearch && matchesStatus && matchesPartner;
            })
            .sort((a, b) => {
                if (sortOrder === 'amount_desc')
                    return b.remaining_amount - a.remaining_amount;
                if (sortOrder === 'newest') {
                    return (
                        new Date(b.transaction_date || '').getTime() -
                        new Date(a.transaction_date || '').getTime()
                    );
                }
                // Default 'due': Prioritaskan yang overdue paling lama / jatuh tempo terdekat di atas
                return getItemDueTime(a) - getItemDueTime(b);
            });
    }, [payables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Pagination computations
    const paginatedReceivables = useMemo(() => {
        const start = (receivablesPage - 1) * ITEMS_PER_PAGE;
        return filteredReceivables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReceivables, receivablesPage]);

    const paginatedPayables = useMemo(() => {
        const start = (payablesPage - 1) * ITEMS_PER_PAGE;
        return filteredPayables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPayables, payablesPage]);

    const totalReceivablesPages =
        Math.ceil(filteredReceivables.length / ITEMS_PER_PAGE) || 1;
    const totalPayablesPages =
        Math.ceil(filteredPayables.length / ITEMS_PER_PAGE) || 1;

    // Unique partner lists for dropdown
    const clientList = useMemo(
        () => Array.from(new Set(receivables.map((r) => r.client_name))),
        [receivables],
    );
    const vendorList = useMemo(
        () => Array.from(new Set(payables.map((p) => p.vendor_name))),
        [payables],
    );

    // Actions
    const getReceivableActionItems = (
        r: ReceivableRecord,
    ): ActionMenuItem[] => {
        const items: ActionMenuItem[] = [];

        if (r.remaining_amount > 0) {
            items.push({
                label: 'Catat Pelunasan Piutang',
                icon: (
                    <svg
                        className="h-4 w-4 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                ),
                onClick: () => {
                    setReceivablePaymentModal({
                        isOpen: true,
                        item: r,
                    });
                },
            });
        }

        items.push({
            label: 'Lihat Rincian Termin',
            icon: (
                <svg
                    className="h-4 w-4 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
            ),
            onClick: () =>
                setTermsModal({ isOpen: true, type: 'receivable', item: r }),
        });

        return items;
    };

    const getPayableActionItems = (p: PayableRecord): ActionMenuItem[] => {
        const items: ActionMenuItem[] = [];

        if (p.remaining_amount > 0) {
            items.push({
                label: 'Bayar Hutang Vendor',
                icon: (
                    <svg
                        className="h-4 w-4 text-rose-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                ),
                onClick: () => {
                    setPayablePaymentModal({
                        isOpen: true,
                        item: p,
                    });
                },
            });
        }

        items.push({
            label: 'Lihat Rincian Termin Vendor',
            icon: (
                <svg
                    className="h-4 w-4 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
            ),
            onClick: () =>
                setTermsModal({ isOpen: true, type: 'payable', item: p }),
        });

        return items;
    };

    return (
        <AppLayout
            activePage="debt-receivable"
            title="Hutang & Piutang Usaha"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Hutang Piutang' },
            ]}
        >
            <Head title="Hutang & Piutang Usaha" />

            <div className="w-full space-y-6">
                {/* Header Section */}
                <div className="shadow-2xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-slate-900">
                                Buku Pembantu Hutang & Piutang Usaha
                            </h2>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    isPPN
                                        ? 'border border-blue-200 bg-blue-100 text-blue-800'
                                        : 'border border-slate-200 bg-slate-100 text-slate-700'
                                }`}
                            >
                                Mode {isPPN ? 'PPN' : 'Non-PPN'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Monitoring piutang tagihan client (AR), kewajiban
                            biaya vendor (AP), serta kelancaran pencatatan
                            penerimaan & pengeluaran kas.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit('/sales-transactions')}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition-all hover:bg-blue-100"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Penagihan Invoice (AR)
                        </button>
                        <button
                            onClick={() => router.visit('/purchases')}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Pembayaran PO (AP)
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Piutang (AR) */}
                    <div className="shadow-2xs rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                Sisa Piutang Klien (AR)
                            </span>
                            <span className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </span>
                        </div>
                        <div className="mt-2 font-mono text-xl font-black text-blue-900">
                            {fmt(summary?.totalReceivable || 0)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                            <span>
                                {
                                    receivables.filter(
                                        (r) => r.status !== 'paid',
                                    ).length
                                }{' '}
                                invoice belum lunas
                            </span>
                        </div>
                    </div>

                    {/* Total Hutang (AP) */}
                    <div className="shadow-2xs rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                Sisa Hutang Vendor (AP)
                            </span>
                            <span className="rounded-lg bg-amber-100 p-1.5 text-amber-600">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </span>
                        </div>
                        <div className="mt-2 font-mono text-xl font-black text-amber-900">
                            {fmt(summary?.totalPayable || 0)}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                            <span>
                                {
                                    payables.filter((p) => p.status !== 'paid')
                                        .length
                                }{' '}
                                PO kewajiban berjalan
                            </span>
                        </div>
                    </div>

                    {/* Net Position */}
                    <div className="shadow-2xs rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                Proyeksi Net Kas (AR - AP)
                            </span>
                            <span className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </span>
                        </div>
                        <div
                            className={`mt-2 font-mono text-xl font-black ${(summary?.netBalance || 0) >= 0 ? 'text-emerald-900' : 'text-rose-600'}`}
                        >
                            {fmt(summary?.netBalance || 0)}
                        </div>
                        <div className="mt-1 text-[10.5px] font-semibold text-slate-500">
                            {(summary?.netBalance || 0) >= 0
                                ? 'Surplus Likuiditas Operasional'
                                : 'Defisit - Perlu Akselerasi Penagihan'}
                        </div>
                    </div>

                    {/* Overdue Warnings */}
                    <div className="shadow-2xs rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/50 to-white p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                                Tagihan Terlewat (Overdue)
                            </span>
                            <span className="rounded-lg bg-rose-100 p-1.5 text-rose-600">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </span>
                        </div>
                        <div className="mt-2 font-mono text-xl font-black text-rose-600">
                            {summary?.overdueCount || 0} Tagihan
                        </div>
                        <div className="mt-1 text-[10.5px] font-semibold text-slate-500">
                            {summary?.overdueReceivablesCount || 0} Piutang ·{' '}
                            {summary?.overduePayablesCount || 0} Hutang
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Tabs, Filter & Table */}
                <div className="shadow-2xs overflow-hidden rounded-3xl border border-slate-200/90 bg-white">
                    {/* Tab Navigation Header */}
                    <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-200/70 p-1">
                            <button
                                onClick={() => {
                                    setActiveTab('payable');
                                    setPayablesPage(1);
                                }}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'payable'
                                        ? 'shadow-2xs bg-white text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg
                                    className="h-4 w-4 text-amber-600"
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
                                <span>Hutang Usaha (Vendor AP)</span>
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                                    {
                                        payables.filter(
                                            (p) => p.status !== 'paid',
                                        ).length
                                    }
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('receivable');
                                    setReceivablesPage(1);
                                }}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'receivable'
                                        ? 'shadow-2xs bg-white text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>Piutang Usaha (Client AR)</span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                                    {
                                        receivables.filter(
                                            (r) => r.status !== 'paid',
                                        ).length
                                    }
                                </span>
                            </button>
                        </div>

                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {activeTab === 'receivable'
                                ? 'Daftar Tagihan Penjualan (Invoices)'
                                : 'Daftar Kewajiban Pembelian (PO)'}
                        </div>
                    </div>

                    {/* Filter Panel Bar */}
                    <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-4 sm:grid-cols-2 sm:items-end sm:p-6 lg:grid-cols-4">
                        {/* Search Input */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pencarian Data
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setReceivablesPage(1);
                                        setPayablesPage(1);
                                    }}
                                    placeholder="Cari No., Partner, atau Proyek..."
                                    className="shadow-2xs w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all focus:border-primary focus:outline-none"
                                />
                                <svg
                                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
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

                        {/* Filter Status */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Filter Status Tagihan
                            </label>
                            <SelectInput
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setReceivablesPage(1);
                                    setPayablesPage(1);
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Status' },
                                    {
                                        value: 'overdue',
                                        label: 'Melewati Jatuh Tempo',
                                    },
                                    {
                                        value: 'unpaid',
                                        label: 'Belum Dibayar (Unpaid)',
                                    },
                                    {
                                        value: 'partial',
                                        label: 'Terbayar Sebagian (Partial)',
                                    },
                                    { value: 'paid', label: 'Lunas (Paid)' },
                                ]}
                            />
                        </div>

                        {/* Filter Partner */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {activeTab === 'receivable'
                                    ? 'Filter Client'
                                    : 'Filter Vendor'}
                            </label>
                            <SelectInput
                                value={partnerFilter}
                                onChange={(e) => {
                                    setPartnerFilter(e.target.value);
                                    setReceivablesPage(1);
                                    setPayablesPage(1);
                                }}
                                options={[
                                    {
                                        value: 'all',
                                        label:
                                            activeTab === 'receivable'
                                                ? 'Semua Client'
                                                : 'Semua Vendor',
                                    },
                                    ...(activeTab === 'receivable'
                                        ? clientList.map((c) => ({
                                              value: c,
                                              label: c,
                                          }))
                                        : vendorList.map((v) => ({
                                              value: v,
                                              label: v,
                                          }))),
                                ]}
                            />
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Urutkan Berdasarkan
                            </label>
                            <SelectInput
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                options={[
                                    {
                                        value: 'due',
                                        label: 'Jatuh Tempo Terdekat',
                                    },
                                    {
                                        value: 'amount_desc',
                                        label: 'Sisa Nominal Tertinggi',
                                    },
                                    {
                                        value: 'newest',
                                        label: 'Transaksi Terbaru',
                                    },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        {activeTab === 'receivable' ? (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">
                                            No. Invoice & Tgl
                                        </th>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">
                                            Proyek Media
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Nilai Piutang
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Telah Diterima
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Sisa Piutang
                                        </th>
                                        <th className="px-6 py-4">
                                            Jatuh Tempo Terdekat
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {paginatedReceivables.map((r) => {
                                        const percentPaid =
                                            r.total_amount > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (r.paid_amount /
                                                              r.total_amount) *
                                                              100,
                                                      ),
                                                  )
                                                : 0;
                                        return (
                                            <tr
                                                key={r.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-slate-900">
                                                        {r.invoice_number}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(
                                                            r.transaction_date,
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {r.client_name}
                                                    </div>
                                                    {r.sales_name && (
                                                        <div className="text-[10px] font-medium text-slate-400">
                                                            Sales:{' '}
                                                            {r.sales_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    className="max-w-[220px] truncate px-6 py-4 font-semibold text-slate-600"
                                                    title={r.project_name}
                                                >
                                                    <span className="mr-1 font-mono text-[10px] text-primary">
                                                        [{r.project_code}]
                                                    </span>
                                                    {r.project_name}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                    {fmt(r.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">
                                                        {fmt(r.paid_amount)}
                                                    </div>
                                                    <div className="ml-auto mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${percentPaid}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                                    {fmt(r.remaining_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {r.nearest_milestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">
                                                                {
                                                                    r
                                                                        .nearest_milestone
                                                                        .label
                                                                }
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] font-medium text-slate-500">
                                                                    {formatDateIndo(
                                                                        r
                                                                            .nearest_milestone
                                                                            .due_date,
                                                                    )}
                                                                </span>
                                                                {r.is_overdue ? (
                                                                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                                                                        Terlewat{' '}
                                                                        {
                                                                            r.overdue_days
                                                                        }{' '}
                                                                        hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium font-semibold italic text-emerald-600">
                                                            Lunas
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${
                                                            r.status === 'paid'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : r.status ===
                                                                    'partial'
                                                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                r.status ===
                                                                'paid'
                                                                    ? 'bg-emerald-500'
                                                                    : r.status ===
                                                                        'partial'
                                                                      ? 'bg-blue-500'
                                                                      : 'bg-amber-500'
                                                            }`}
                                                        />
                                                        {r.status === 'paid'
                                                            ? 'Lunas'
                                                            : r.status ===
                                                                'partial'
                                                              ? 'Sebagian'
                                                              : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <ActionDropdown
                                                        items={getReceivableActionItems(
                                                            r,
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredReceivables.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="py-12 text-center"
                                            >
                                                <EmptyState
                                                    title="Belum Ada Data Piutang"
                                                    message="Tidak ditemukan catatan piutang client yang sesuai dengan pencarian / filter Anda."
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">
                                            No. PO & Tanggal
                                        </th>
                                        <th className="px-6 py-4">
                                            Vendor / Supplier
                                        </th>
                                        <th className="px-6 py-4">
                                            Proyek Media
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Total Kewajiban PO
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Telah Terbayar
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Sisa Hutang
                                        </th>
                                        <th className="px-6 py-4">
                                            Jatuh Tempo Terdekat
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {paginatedPayables.map((p) => {
                                        const percentPaid =
                                            p.total_amount > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (p.paid_amount /
                                                              p.total_amount) *
                                                              100,
                                                      ),
                                                  )
                                                : 0;
                                        return (
                                            <tr
                                                key={p.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-slate-900">
                                                        {p.po_number}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(
                                                            p.transaction_date,
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {p.vendor_name}
                                                    </div>
                                                </td>
                                                <td
                                                    className="max-w-[220px] truncate px-6 py-4 font-semibold text-slate-600"
                                                    title={p.project_name}
                                                >
                                                    <span className="mr-1 font-mono text-[10px] text-primary">
                                                        [{p.project_code}]
                                                    </span>
                                                    {p.project_name}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                    {fmt(p.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">
                                                        {fmt(p.paid_amount)}
                                                    </div>
                                                    <div className="ml-auto mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${percentPaid}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                                    {fmt(p.remaining_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {p.nearest_milestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">
                                                                {
                                                                    p
                                                                        .nearest_milestone
                                                                        .label
                                                                }
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] font-medium text-slate-500">
                                                                    {formatDateIndo(
                                                                        p
                                                                            .nearest_milestone
                                                                            .due_date,
                                                                    )}
                                                                </span>
                                                                {p.is_overdue ? (
                                                                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                                                                        Terlewat{' '}
                                                                        {
                                                                            p.overdue_days
                                                                        }{' '}
                                                                        hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium font-semibold italic text-emerald-600">
                                                            Lunas
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none ${
                                                            p.status === 'paid'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : p.status ===
                                                                    'partial'
                                                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                                  : 'border-amber-200 bg-amber-50 text-amber-800'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                p.status ===
                                                                'paid'
                                                                    ? 'bg-emerald-500'
                                                                    : p.status ===
                                                                        'partial'
                                                                      ? 'bg-blue-500'
                                                                      : 'bg-amber-500'
                                                            }`}
                                                        />
                                                        {p.status === 'paid'
                                                            ? 'Lunas'
                                                            : p.status ===
                                                                'partial'
                                                              ? 'Sebagian'
                                                              : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <ActionDropdown
                                                        items={getPayableActionItems(
                                                            p,
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredPayables.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="py-12 text-center"
                                            >
                                                <EmptyState
                                                    title="Belum Ada Data Hutang"
                                                    message="Tidak ditemukan kewajiban pembayaran vendor yang sesuai dengan pencarian / filter Anda."
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {activeTab === 'receivable' &&
                        filteredReceivables.length > 0 && (
                            <Pagination
                                currentPage={receivablesPage}
                                totalPages={totalReceivablesPages}
                                totalItems={filteredReceivables.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={(page) =>
                                    setReceivablesPage(page)
                                }
                            />
                        )}
                    {activeTab === 'payable' && filteredPayables.length > 0 && (
                        <Pagination
                            currentPage={payablesPage}
                            totalPages={totalPayablesPages}
                            totalItems={filteredPayables.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={(page) => setPayablesPage(page)}
                        />
                    )}
                </div>
            </div>

            {/* MODAL: DETAIL TERMIN (MILESTONE) */}
            {termsModal && termsModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setTermsModal(null)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Detail Skema & Syarat Pembayaran
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    {'invoice_number' in termsModal.item
                                        ? `${termsModal.item.invoice_number} · ${termsModal.item.client_name}`
                                        : `${termsModal.item.po_number} · ${termsModal.item.vendor_name}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setTermsModal(null)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 p-6 text-slate-800">
                            <div className="space-y-1">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Skema Pembayaran
                                </span>
                                <div className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase text-slate-800">
                                    {termsModal.item.scheme}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Rincian Termin Pembayaran:
                                </span>

                                <div className="space-y-2">
                                    {termsModal.item.milestones.map(
                                        (milestone, idx) => {
                                            const isMilestonePaid =
                                                milestone.status === 'paid' ||
                                                milestone.remaining_amount <= 0;

                                            return (
                                                <div
                                                    key={milestone.id || idx}
                                                    className={`space-y-1.5 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
                                                        isMilestonePaid
                                                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                                                            : 'border-slate-200/80 bg-slate-50 text-slate-800'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold">
                                                            {milestone.label}
                                                        </span>
                                                        <span className="font-mono font-bold text-slate-900">
                                                            {fmt(
                                                                milestone.amount,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="text-slate-500">
                                                            Jatuh Tempo:{' '}
                                                            {formatDateIndo(
                                                                milestone.due_date,
                                                            )}
                                                        </span>
                                                        <span>
                                                            {isMilestonePaid ? (
                                                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                    ✓ Lunas
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                    Sisa:{' '}
                                                                    {fmt(
                                                                        milestone.remaining_amount,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-100 pt-4">
                                <button
                                    onClick={() => setTermsModal(null)}
                                    className="shadow-xs cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pembayaran Hutang Vendor */}
            {payablePaymentModal.isOpen && payablePaymentModal.item && (
                <RecordPaymentModal
                    isOpen={payablePaymentModal.isOpen}
                    isLoading={isSubmittingPayable}
                    po={{
                        id: payablePaymentModal.item.id,
                        poNumber: payablePaymentModal.item.po_number,
                        vendorId:
                            Number(payablePaymentModal.item.vendor_id) || 0,
                        vendorName: payablePaymentModal.item.vendor_name,
                        projectName: payablePaymentModal.item.project_name,
                        totalAmount: payablePaymentModal.item.total_amount,
                        issuedAt:
                            payablePaymentModal.item.transaction_date || '',
                        projectId: payablePaymentModal.item.project_id || '',
                        milestones: payablePaymentModal.item.milestones,
                    }}
                    remainingAmount={payablePaymentModal.item.remaining_amount}
                    cashBankAccounts={paymentAccounts.map((acc) => ({
                        id: acc.id,
                        code: acc.code,
                        name: acc.name,
                        display_name: `${acc.code} - ${acc.name}`,
                    }))}
                    onClose={() =>
                        setPayablePaymentModal({ isOpen: false, item: null })
                    }
                    onSubmit={handleSavePayablePayment}
                />
            )}

            {/* Modal Penerimaan Piutang Client */}
            {receivablePaymentModal.isOpen && receivablePaymentModal.item && (
                <RecordInvoicePaymentModal
                    isOpen={receivablePaymentModal.isOpen}
                    isLoading={isSubmittingReceivable}
                    invoice={{
                        id: receivablePaymentModal.item.id,
                        invoiceNumber:
                            receivablePaymentModal.item.invoice_number,
                        clientName: receivablePaymentModal.item.client_name,
                        projectName: receivablePaymentModal.item.project_name,
                        totalAmount: receivablePaymentModal.item.total_amount,
                        terms: receivablePaymentModal.item.milestones.map(
                            (m) => ({
                                id: m.id,
                                sort_order: m.sort_order,
                                label: m.label,
                                amount: m.amount,
                                percent: Math.round(
                                    (m.amount /
                                        (receivablePaymentModal.item
                                            ?.total_amount || 1)) *
                                        100,
                                ),
                                due_date: m.due_date || undefined,
                                status: m.status === 'paid' ? 'paid' : 'unpaid',
                                paid_amount: m.paid_amount,
                                remaining_amount: m.remaining_amount,
                            }),
                        ),
                    }}
                    remainingAmount={
                        receivablePaymentModal.item.remaining_amount
                    }
                    cashBankAccounts={paymentAccounts.map((acc) => ({
                        id: acc.id,
                        code: acc.code,
                        name: acc.name,
                        display_name: `${acc.code} - ${acc.name}`,
                    }))}
                    onClose={() =>
                        setReceivablePaymentModal({ isOpen: false, item: null })
                    }
                    onSubmit={handleSaveReceivablePayment}
                />
            )}

            {/* Global Toast */}
            <Toast
                show={toast.show}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
        </AppLayout>
    );
}
