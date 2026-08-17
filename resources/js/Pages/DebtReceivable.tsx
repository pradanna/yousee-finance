import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import React, { useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface PaymentTerms {
    type: 'full' | 'dp' | 'termin';
    notes?: string;
    dpPercent?: number;
    dpAmount?: number;
    dpDueDate?: string;
    pelunasanDueDate?: string;
    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
}

interface ReceivableItem {
    id: string;
    client: string;
    project: string;
    date: string;
    due: string;
    total: number;
    paid: number;
    status: 'paid' | 'partial' | 'unpaid';
    terms: PaymentTerms;
    salesPIC?: string;
}

interface PayableItem {
    id: string;
    vendor: string;
    project: string;
    date: string;
    due: string;
    total: number;
    paid: number;
    status: 'paid' | 'partial' | 'unpaid';
    terms: PaymentTerms;
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const formatDateIndo = (dateStr: string) => {
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

interface ResolvedMilestone {
    label: string;
    amount: number;
    dueDate: string;
    cumulativeAmount: number;
}

interface MilestoneStatus {
    nearestMilestone: ResolvedMilestone | null;
    isOverdue: boolean;
    overdueDays: number;
    statusText: string;
}

const getMilestones = (
    item: ReceivableItem | PayableItem,
): ResolvedMilestone[] => {
    const list: ResolvedMilestone[] = [];
    const t = item.terms;
    if (t.type === 'full') {
        list.push({
            label: 'Pelunasan 100%',
            amount: item.total,
            dueDate: item.due,
            cumulativeAmount: item.total,
        });
    } else if (t.type === 'dp') {
        const dpAmt = t.dpAmount || (item.total * (t.dpPercent || 0)) / 100;
        list.push({
            label: `Uang Muka (DP ${t.dpPercent || 0}%)`,
            amount: dpAmt,
            dueDate: t.dpDueDate || item.date,
            cumulativeAmount: dpAmt,
        });
        list.push({
            label: 'Pelunasan Akhir',
            amount: item.total - dpAmt,
            dueDate: t.pelunasanDueDate || item.due,
            cumulativeAmount: item.total,
        });
    } else if (t.type === 'termin' && t.installments) {
        let cum = 0;
        t.installments.forEach((inst, idx) => {
            cum += inst.amount;
            list.push({
                label: inst.note || `Termin ${idx + 1}`,
                amount: inst.amount,
                dueDate: inst.dueDate || item.due,
                cumulativeAmount: cum,
            });
        });
    }
    return list;
};

const getNearestMilestoneInfo = (
    item: ReceivableItem | PayableItem,
    currentDateStr: string = new Date().toISOString().split('T')[0],
): MilestoneStatus => {
    const milestones = getMilestones(item);
    const unpaidMilestone = milestones.find(
        (m) => item.paid < m.cumulativeAmount - 1,
    );

    if (!unpaidMilestone) {
        return {
            nearestMilestone: null,
            isOverdue: false,
            overdueDays: 0,
            statusText: 'Lunas',
        };
    }

    const currentDate = new Date(currentDateStr);
    currentDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(unpaidMilestone.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const timeDiff = currentDate.getTime() - dueDate.getTime();
    const isOverdue = timeDiff > 0;
    const overdueDays = isOverdue
        ? Math.ceil(timeDiff / (1000 * 3600 * 24))
        : 0;

    return {
        nearestMilestone: unpaidMilestone,
        isOverdue,
        overdueDays,
        statusText: unpaidMilestone.label,
    };
};

const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DebtReceivable() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // State for Client Receivables (Piutang)
    const [receivables, setReceivables] = useState<ReceivableItem[]>([
        {
            id: isPPN ? 'INV-PPN-001' : 'INV-NP-001',
            client: 'PT. Gojek Tokopedia',
            project: 'Kampanye Ramadhan Baliho Jawa Tengah',
            date: '2026-06-25',
            due: '2026-07-25',
            total: isPPN ? 11100000 : 10000000,
            paid: isPPN ? 11100000 : 10000000,
            status: 'paid',
            terms: {
                type: 'full',
                notes: 'Pembayaran 100% lunas 30 hari setelah invoice diterima.',
            },
            salesPIC: 'Eko Prasetyo',
        },
        {
            id: isPPN ? 'INV-PPN-002' : 'INV-NP-002',
            client: 'Traveloka Corp',
            project: 'Sewa Videotron Simpang Lima Semarang',
            date: '2026-06-22',
            due: '2026-07-22',
            total: isPPN ? 5550000 : 5000000,
            paid: 2000000,
            status: 'partial',
            terms: {
                type: 'dp',
                dpPercent: 30,
                dpAmount: isPPN ? 1665000 : 1500000,
                dpDueDate: '2026-06-25',
                pelunasanDueDate: '2026-07-22',
                notes: 'Uang muka (DP) 30% dibayar di awal, pelunasan 70% setelah pasang.',
            },
            salesPIC: 'Rina Wijaya',
        },
        {
            id: isPPN ? 'INV-PPN-003' : 'INV-NP-003',
            client: 'Shopee Indonesia',
            project: 'Sewa Billboard Ring Road Yogyakarta',
            date: '2026-06-12',
            due: '2026-07-12',
            total: isPPN ? 8880000 : 8000000,
            paid: 0,
            status: 'unpaid',
            terms: {
                type: 'termin',
                installments: [
                    {
                        percent: 50,
                        amount: isPPN ? 4440000 : 4000000,
                        note: 'Termin 1 (DP 50%)',
                        dueDate: '2026-06-18',
                    },
                    {
                        percent: 50,
                        amount: isPPN ? 4440000 : 4000000,
                        note: 'Termin 2 (Pelunasan 50%)',
                        dueDate: '2026-07-12',
                    },
                ],
                notes: 'Pembayaran dibagi 2 termin (Termin 1: 50%, Termin 2: 50%).',
            },
            salesPIC: 'Budi Santoso',
        },
        {
            id: isPPN ? 'INV-PPN-004' : 'INV-NP-004',
            client: 'CV. Soto Bangkong Lestari',
            project: 'Baliho Kuliner Lokal Soto Bangkong - Solo',
            date: '2026-08-01',
            due: '2026-08-11',
            total: isPPN ? 49950000 : 45000000,
            paid: 0,
            status: 'unpaid',
            terms: {
                type: 'termin',
                installments: [
                    {
                        percent: 30,
                        amount: isPPN ? 14985000 : 13500000,
                        note: 'Termin 1',
                        dueDate: '2026-08-11',
                    },
                    {
                        percent: 40,
                        amount: isPPN ? 19980000 : 18000000,
                        note: 'Termin 2',
                        dueDate: '2026-08-25',
                    },
                    {
                        percent: 30,
                        amount: isPPN ? 14985000 : 13500000,
                        note: 'Termin 3',
                        dueDate: '2026-09-10',
                    },
                ],
                notes: 'Angsuran berkala 3 bulan (30-40-30)',
            },
            salesPIC: 'Eko Prasetyo',
        },
    ]);

    // State for Vendor Payables (Hutang)
    const [payables, setPayables] = useState<PayableItem[]>([
        {
            id: isPPN ? 'PO-PPN-001' : 'PO-NP-001',
            vendor: 'PT. Megah Billboard Jaya',
            project: 'Kampanye Ramadhan Baliho Jawa Tengah',
            date: '2026-06-24',
            due: '2026-07-24',
            total: isPPN ? 3330000 : 3000000,
            paid: isPPN ? 3330000 : 3000000,
            status: 'paid',
            terms: {
                type: 'full',
                notes: 'Pembayaran 100% setelah penyerahan dokumen penagihan lengkap.',
            },
        },
        {
            id: isPPN ? 'PO-PPN-002' : 'PO-NP-002',
            vendor: 'PT. Promosi Outdoor Kreasindo',
            project: 'Sewa Videotron Simpang Lima Semarang',
            date: '2026-06-20',
            due: '2026-07-20',
            total: isPPN ? 8880000 : 8000000,
            paid: 4000000,
            status: 'partial',
            terms: {
                type: 'dp',
                dpPercent: 50,
                dpAmount: isPPN ? 4440000 : 4000000,
                dpDueDate: '2026-06-23',
                pelunasanDueDate: '2026-06-26',
                notes: 'DP 50% di muka, Pelunasan 50% setelah pemasangan selesai.',
            },
        },
        {
            id: isPPN ? 'PO-PPN-003' : 'PO-NP-003',
            vendor: 'CV. Media Ad Perkasa',
            project: 'Samsung Galaxy S27 Launching',
            date: '2026-06-15',
            due: '2026-06-20',
            total: isPPN ? 1200000 : 1200000,
            paid: 0,
            status: 'unpaid',
            terms: {
                type: 'full',
                notes: 'Pembayaran 100% setelah serah terima pekerjaan.',
            },
        },
    ]);

    const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>(
        'payable',
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [partnerFilter, setPartnerFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<string>('due');

    const [receivablesPage, setReceivablesPage] = useState(1);
    const [payablesPage, setPayablesPage] = useState(1);

    // Modal states
    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        type: 'receivable' | 'payable';
        item: ReceivableItem | PayableItem;
    } | null>(null);
    const [termsModal, setTermsModal] = useState<{
        isOpen: boolean;
        item: ReceivableItem | PayableItem;
    } | null>(null);
    const [payAmountInput, setPayAmountInput] = useState('');
    const [payMethodInput, setPayMethodInput] = useState('Transfer BCA');
    const [payRefInput, setPayRefInput] = useState('');
    const [payDateInput, setPayDateInput] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [payNotesInput, setPayNotesInput] = useState('');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // Dynamic computations
    const totalReceivable = receivables.reduce(
        (s, r) => s + (r.total - r.paid),
        0,
    );
    const totalPayable = payables.reduce((s, p) => s + (p.total - p.paid), 0);
    const netBalance = totalReceivable - totalPayable;

    const overdueReceivables = receivables.filter(
        (r) => getNearestMilestoneInfo(r).isOverdue,
    );
    const overduePayables = payables.filter(
        (p) => getNearestMilestoneInfo(p).isOverdue,
    );
    const totalOverdueCount =
        overdueReceivables.length + overduePayables.length;

    // Extract unique partner names
    const clientList = useMemo(
        () => Array.from(new Set(receivables.map((r) => r.client))),
        [receivables],
    );
    const vendorList = useMemo(
        () => Array.from(new Set(payables.map((p) => p.vendor))),
        [payables],
    );

    // Filter & Sort Receivables
    const filteredReceivables = useMemo(() => {
        return receivables
            .filter((r) => {
                const matchesSearch =
                    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    r.client
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    r.project.toLowerCase().includes(searchQuery.toLowerCase());

                const milestoneInfo = getNearestMilestoneInfo(r);
                let matchesStatus = true;
                if (statusFilter === 'overdue')
                    matchesStatus = milestoneInfo.isOverdue;
                else if (statusFilter === 'partial')
                    matchesStatus = r.status === 'partial';
                else if (statusFilter === 'unpaid')
                    matchesStatus = r.status === 'unpaid';
                else if (statusFilter === 'paid')
                    matchesStatus = r.status === 'paid';

                const matchesPartner =
                    partnerFilter === 'all' || r.client === partnerFilter;

                return matchesSearch && matchesStatus && matchesPartner;
            })
            .sort((a, b) => {
                if (sortOrder === 'amount_desc')
                    return b.total - b.paid - (a.total - a.paid);
                if (sortOrder === 'newest')
                    return (
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                return new Date(a.due).getTime() - new Date(b.due).getTime();
            });
    }, [receivables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Filter & Sort Payables
    const filteredPayables = useMemo(() => {
        return payables
            .filter((p) => {
                const matchesSearch =
                    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.vendor
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    p.project.toLowerCase().includes(searchQuery.toLowerCase());

                const milestoneInfo = getNearestMilestoneInfo(p);
                let matchesStatus = true;
                if (statusFilter === 'overdue')
                    matchesStatus = milestoneInfo.isOverdue;
                else if (statusFilter === 'partial')
                    matchesStatus = p.status === 'partial';
                else if (statusFilter === 'unpaid')
                    matchesStatus = p.status === 'unpaid';
                else if (statusFilter === 'paid')
                    matchesStatus = p.status === 'paid';

                const matchesPartner =
                    partnerFilter === 'all' || p.vendor === partnerFilter;

                return matchesSearch && matchesStatus && matchesPartner;
            })
            .sort((a, b) => {
                if (sortOrder === 'amount_desc')
                    return b.total - b.paid - (a.total - a.paid);
                if (sortOrder === 'newest')
                    return (
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                return new Date(a.due).getTime() - new Date(b.due).getTime();
            });
    }, [payables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Paginated items
    const paginatedReceivables = useMemo(() => {
        const start = (receivablesPage - 1) * ITEMS_PER_PAGE;
        return filteredReceivables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReceivables, receivablesPage]);

    const paginatedPayables = useMemo(() => {
        const start = (payablesPage - 1) * ITEMS_PER_PAGE;
        return filteredPayables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPayables, payablesPage]);

    // Open Catat Pembayaran Modal
    const handleOpenPayment = (
        type: 'receivable' | 'payable',
        item: ReceivableItem | PayableItem,
    ) => {
        const remaining = item.total - item.paid;
        const milestoneInfo = getNearestMilestoneInfo(item);
        const milestoneAmt = milestoneInfo.nearestMilestone
            ? milestoneInfo.nearestMilestone.amount
            : remaining;

        setPaymentModal({ isOpen: true, type, item });
        setPayAmountInput(String(Math.min(remaining, milestoneAmt)));
        setPayMethodInput('Transfer BCA');
        setPayRefInput(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
        setPayDateInput(new Date().toISOString().split('T')[0]);
        setPayNotesInput(
            `Pembayaran ${milestoneInfo.nearestMilestone?.label || 'Tagihan'} - ${item.project}`,
        );
    };

    // Confirm Catat Pembayaran
    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModal) return;

        const amount = parseFloat(payAmountInput) || 0;
        if (amount <= 0) {
            alert('Jumlah pembayaran harus lebih dari Rp 0.');
            return;
        }

        const remaining = paymentModal.item.total - paymentModal.item.paid;
        if (amount > remaining) {
            alert(
                `Jumlah pembayaran melebihi sisa tagihan (${fmt(remaining)}).`,
            );
            return;
        }

        if (paymentModal.type === 'receivable') {
            const partnerName =
                'client' in paymentModal.item
                    ? paymentModal.item.client
                    : 'Klien';
            setReceivables((prev) =>
                prev.map((item) => {
                    if (item.id === paymentModal.item.id) {
                        const newPaid = item.paid + amount;
                        const newStatus =
                            newPaid >= item.total ? 'paid' : 'partial';
                        return { ...item, paid: newPaid, status: newStatus };
                    }
                    return item;
                }),
            );
            setSuccessAlert(
                `Sukses! Pembayaran piutang dari ${partnerName} sebesar ${fmt(amount)} berhasil dicatat.`,
            );
        } else {
            const partnerName =
                'vendor' in paymentModal.item
                    ? paymentModal.item.vendor
                    : 'Vendor';
            setPayables((prev) =>
                prev.map((item) => {
                    if (item.id === paymentModal.item.id) {
                        const newPaid = item.paid + amount;
                        const newStatus =
                            newPaid >= item.total ? 'paid' : 'partial';
                        return { ...item, paid: newPaid, status: newStatus };
                    }
                    return item;
                }),
            );
            setSuccessAlert(
                `Sukses! Pembayaran hutang ke ${partnerName} sebesar ${fmt(amount)} berhasil dicatat.`,
            );
        }

        setPaymentModal(null);
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Build Action Menu Items for Table Rows
    const getReceivableActionItems = (r: ReceivableItem): ActionMenuItem[] => {
        const remaining = r.total - r.paid;
        const items: ActionMenuItem[] = [];

        if (remaining > 0) {
            items.push({
                label: 'Catat Terima Bayar',
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
                onClick: () => handleOpenPayment('receivable', r),
            });
        }

        if (r.paid > 0) {
            items.push({
                label: 'Cetak Kwitansi PDF',
                icon: (
                    <svg
                        className="h-4 w-4 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                ),
                onClick: () =>
                    alert(
                        `Membuka dokumen Kwitansi PDF untuk Invoice ${r.id}...`,
                    ),
            });
        }

        items.push({
            label: 'Download Invoice PDF',
            icon: (
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            ),
            onClick: () => alert(`Mengunduh dokumen Invoice ${r.id}...`),
        });

        items.push({
            label: 'Lihat Skema Termin',
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
            onClick: () => setTermsModal({ isOpen: true, item: r }),
        });

        return items;
    };

    const getPayableActionItems = (p: PayableItem): ActionMenuItem[] => {
        const remaining = p.total - p.paid;
        const items: ActionMenuItem[] = [];

        if (remaining > 0) {
            items.push({
                label: 'Catat Bayar Vendor',
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
                onClick: () => handleOpenPayment('payable', p),
            });
        }

        items.push({
            label: 'Download PO PDF',
            icon: (
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            ),
            onClick: () => alert(`Mengunduh dokumen Purchase Order ${p.id}...`),
        });

        items.push({
            label: 'Lihat Skema Termin Vendor',
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
            onClick: () => setTermsModal({ isOpen: true, item: p }),
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
            <div className="w-full space-y-6">
                {/* Header Section */}
                <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-slate-900">
                                Buku Pembantu Hutang & Piutang Usaha
                            </h2>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isPPN ? 'border border-blue-200 bg-blue-100 text-blue-800' : 'border border-slate-200 bg-slate-100 text-slate-700'}`}
                            >
                                Mode {isPPN ? 'PPN 11%' : 'Non-PPN'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Monitoring piutang tagihan client (AR), kewajiban
                            biaya vendor (AP), serta kelancaran pencatatan
                            penerimaan & pengeluaran kas.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-2 md:w-auto">
                        <button
                            onClick={() =>
                                alert(
                                    'Mengunduh Laporan Umur Piutang (Aging AR/AP Report)...',
                                )
                            }
                            className="shadow-2xs flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                        >
                            <svg
                                className="h-4 w-4 text-slate-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Export Rekap AP/AR</span>
                        </button>
                    </div>
                </div>

                {/* Overdue Alert Banner */}
                {totalOverdueCount > 0 && (
                    <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-5 md:flex-row md:items-center">
                        <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
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
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rose-950">
                                    Perhatian: Terdapat Tagihan yang Melewati
                                    Jatuh Tempo!
                                </h3>
                                <p className="mt-0.5 text-xs font-medium leading-relaxed text-rose-800/90">
                                    Terdapat{' '}
                                    <strong className="font-bold text-rose-950">
                                        {overdueReceivables.length} Piutang
                                        Client
                                    </strong>{' '}
                                    dan{' '}
                                    <strong className="font-bold text-rose-950">
                                        {overduePayables.length} Hutang Vendor
                                    </strong>{' '}
                                    yang memerlukan tindak lanjut
                                    penagihan/pembayaran segera.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="animate-fade-in shadow-2xs flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-all">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
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
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <div className="text-xs font-bold leading-tight text-emerald-900">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Executive Summary Metric Cards (4 Grid) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                PIUTANG CLIENT (ACTIVE AR)
                            </span>
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                Client AR
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-slate-900">
                            {fmt(totalReceivable)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Dari{' '}
                            {
                                receivables.filter((r) => r.status !== 'paid')
                                    .length
                            }{' '}
                            proyek penagihan aktif
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                PIUTANG JATUH TEMPO
                            </span>
                            <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                {overdueReceivables.length} Invoice
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-rose-600">
                            {fmt(
                                overdueReceivables.reduce(
                                    (s, r) => s + (r.total - r.paid),
                                    0,
                                ),
                            )}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Memerlukan penagihan intensif
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                HUTANG VENDOR (ACTIVE AP)
                            </span>
                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                Vendor AP
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-slate-900">
                            {fmt(totalPayable)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Kewajiban bayar PO ke vendor billboard
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                NET WORKING CAPITAL EXPOSURE
                            </span>
                            <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${netBalance >= 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-800'}`}
                            >
                                {netBalance >= 0 ? 'Surplus AR' : 'Defisit AP'}
                            </span>
                        </div>
                        <span
                            className={`block font-mono text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}
                        >
                            {fmt(netBalance)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Selisih piutang client dikurangi hutang vendor
                        </span>
                    </div>
                </div>

                {/* Main Tab Navigation & Filter Panel */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                    {/* Tab Buttons */}
                    <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
                        <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
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
                                        label: '⚠ Melewati Jatuh Tempo',
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
                                        label: 'Nominal Terbesar',
                                    },
                                    {
                                        value: 'newest',
                                        label: 'Tanggal Terbaru',
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table Container */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                    <div className="overflow-x-auto">
                        {activeTab === 'receivable' ? (
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">
                                            No. Invoice & Tanggal
                                        </th>
                                        <th className="px-6 py-4">
                                            Client / Pelanggan
                                        </th>
                                        <th className="px-6 py-4">
                                            Proyek Media
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Total Tagihan
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Telah Terbayar
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Sisa Piutang
                                        </th>
                                        <th className="px-6 py-4">
                                            Tagihan Terdekat
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedReceivables.map((r) => {
                                        const remaining = r.total - r.paid;
                                        const milestoneInfo =
                                            getNearestMilestoneInfo(r);
                                        const percentPaid =
                                            r.total > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (r.paid / r.total) *
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
                                                        {r.id}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(r.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {r.client}
                                                    </div>
                                                    {r.salesPIC && (
                                                        <div className="text-[10px] font-medium text-slate-400">
                                                            Sales: {r.salesPIC}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    className="max-w-[220px] truncate px-6 py-4 font-semibold text-slate-600"
                                                    title={r.project}
                                                >
                                                    {r.project}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                    {fmt(r.total)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">
                                                        {fmt(r.paid)}
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
                                                    {fmt(remaining)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">
                                                                {
                                                                    milestoneInfo
                                                                        .nearestMilestone
                                                                        .label
                                                                }
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] font-medium text-slate-500">
                                                                    {formatDateIndo(
                                                                        milestoneInfo
                                                                            .nearestMilestone
                                                                            .dueDate,
                                                                    )}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                                                                        Terlewat{' '}
                                                                        {
                                                                            milestoneInfo.overdueDays
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
                                                        <span className="font-medium italic text-slate-400">
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
                                    <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedPayables.map((p) => {
                                        const remaining = p.total - p.paid;
                                        const milestoneInfo =
                                            getNearestMilestoneInfo(p);
                                        const percentPaid =
                                            p.total > 0
                                                ? Math.min(
                                                      100,
                                                      Math.round(
                                                          (p.paid / p.total) *
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
                                                        {p.id}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(p.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {p.vendor}
                                                    </div>
                                                </td>
                                                <td
                                                    className="max-w-[220px] truncate px-6 py-4 font-semibold text-slate-600"
                                                    title={p.project}
                                                >
                                                    {p.project}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                    {fmt(p.total)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">
                                                        {fmt(p.paid)}
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
                                                    {fmt(remaining)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">
                                                                {
                                                                    milestoneInfo
                                                                        .nearestMilestone
                                                                        .label
                                                                }
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] font-medium text-slate-500">
                                                                    {formatDateIndo(
                                                                        milestoneInfo
                                                                            .nearestMilestone
                                                                            .dueDate,
                                                                    )}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="shrink-0 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-700">
                                                                        Terlewat{' '}
                                                                        {
                                                                            milestoneInfo.overdueDays
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
                                                        <span className="font-medium italic text-slate-400">
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
                                                    message="Tidak ditemukan kewajiban hutang vendor yang sesuai dengan pencarian / filter Anda."
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
                            <div className="border-t border-slate-100 p-4">
                                <Pagination
                                    currentPage={receivablesPage}
                                    totalPages={Math.ceil(
                                        filteredReceivables.length /
                                            ITEMS_PER_PAGE,
                                    )}
                                    totalItems={filteredReceivables.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setReceivablesPage}
                                />
                            </div>
                        )}

                    {activeTab === 'payable' && filteredPayables.length > 0 && (
                        <div className="border-t border-slate-100 p-4">
                            <Pagination
                                currentPage={payablesPage}
                                totalPages={Math.ceil(
                                    filteredPayables.length / ITEMS_PER_PAGE,
                                )}
                                totalItems={filteredPayables.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPayablesPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: CATAT PEMBAYARAN */}
            {paymentModal && paymentModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setPaymentModal(null)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Catat Transaksi Pembayaran
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    {paymentModal.type === 'receivable'
                                        ? 'Penerimaan Kas Piutang Client'
                                        : 'Pengeluaran Kas Hutang Vendor'}
                                </p>
                            </div>
                            <button
                                onClick={() => setPaymentModal(null)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleConfirmPayment}
                            className="space-y-4 p-6"
                        >
                            <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs text-slate-700">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">
                                        Nomor Dokumen:
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {paymentModal.item.id}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">
                                        Mitra Partner:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {paymentModal.type === 'receivable' &&
                                        'client' in paymentModal.item
                                            ? paymentModal.item.client
                                            : 'vendor' in paymentModal.item
                                              ? paymentModal.item.vendor
                                              : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-500">
                                        Nama Proyek:
                                    </span>
                                    <span className="max-w-[260px] truncate font-bold text-slate-900">
                                        {paymentModal.item.project}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-center">
                                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                                        TOTAL TAGIHAN
                                    </span>
                                    <span className="font-mono text-xs font-bold text-slate-900">
                                        {fmt(paymentModal.item.total)}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-center">
                                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                                        TERBAYAR
                                    </span>
                                    <span className="font-mono text-xs font-bold text-emerald-700">
                                        {fmt(paymentModal.item.paid)}
                                    </span>
                                </div>
                                <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-center">
                                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                                        SISA SALDO
                                    </span>
                                    <span className="font-mono text-xs font-bold text-rose-600">
                                        {fmt(
                                            paymentModal.item.total -
                                                paymentModal.item.paid,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold tracking-tight text-slate-700">
                                        Jumlah Pembayaran (IDR)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={
                                            paymentModal.item.total -
                                            paymentModal.item.paid
                                        }
                                        value={payAmountInput}
                                        onChange={(e) =>
                                            setPayAmountInput(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold tracking-tight text-slate-700">
                                        Akun Kas / Bank Destinasi (COA)
                                    </label>
                                    <SelectInput
                                        value={payMethodInput}
                                        onChange={(e) =>
                                            setPayMethodInput(e.target.value)
                                        }
                                        options={[
                                            {
                                                value: '1111 - Bank Mandiri Solo Baru (138-00-2010633-7)',
                                                label: '1111 - Bank Mandiri Solo Baru',
                                            },
                                            {
                                                value: '1112 - Bank BCA Operasional Utama',
                                                label: '1112 - Bank BCA Operasional',
                                            },
                                            {
                                                value: '1110 - Kas Tunai / Operasional',
                                                label: '1110 - Kas Tunai Operasional',
                                            },
                                            {
                                                value: '1113 - Bank BRI Giro Usaha',
                                                label: '1113 - Bank BRI Giro Usaha',
                                            },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold tracking-tight text-slate-700">
                                        Tanggal Transaksi
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={payDateInput}
                                        onChange={(e) =>
                                            setPayDateInput(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold tracking-tight text-slate-700">
                                        No. Referensi / Bukti Transfer
                                    </label>
                                    <input
                                        type="text"
                                        value={payRefInput}
                                        onChange={(e) =>
                                            setPayRefInput(e.target.value)
                                        }
                                        placeholder="No. Ref Bank..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold tracking-tight text-slate-700">
                                    Catatan / Keterangan Pembayaran
                                </label>
                                <input
                                    type="text"
                                    value={payNotesInput}
                                    onChange={(e) =>
                                        setPayNotesInput(e.target.value)
                                    }
                                    placeholder="Keterangan tambahan..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                                >
                                    Simpan Transaksi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                    {termsModal.item.id} ·{' '}
                                    {'client' in termsModal.item
                                        ? termsModal.item.client
                                        : 'vendor' in termsModal.item
                                          ? termsModal.item.vendor
                                          : '-'}
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
                                <div className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800">
                                    {termsModal.item.terms.type === 'full'
                                        ? 'Full Payment 100%'
                                        : termsModal.item.terms.type === 'dp'
                                          ? 'DP & Pelunasan'
                                          : 'Termin Bertahap'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Rincian Milestone Pembayaran:
                                </span>

                                <div className="space-y-2">
                                    {getMilestones(termsModal.item).map(
                                        (milestone, idx) => {
                                            const isMilestonePaid =
                                                termsModal.item.paid >=
                                                milestone.cumulativeAmount - 1;
                                            const milestoneInfo =
                                                getNearestMilestoneInfo(
                                                    termsModal.item,
                                                );

                                            return (
                                                <div
                                                    key={idx}
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
                                                                milestone.dueDate,
                                                            )}
                                                        </span>
                                                        <span>
                                                            {isMilestonePaid ? (
                                                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                    ✓ Lunas
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                    Menunggu
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>

                                {termsModal.item.terms.notes && (
                                    <div className="mt-2 rounded-xl border border-slate-200/60 bg-slate-50 p-3 text-xs italic text-slate-500">
                                        Catatan: {termsModal.item.terms.notes}
                                    </div>
                                )}
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
        </AppLayout>
    );
}
