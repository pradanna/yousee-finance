import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import React, { useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
type CashflowType = 'inflow' | 'outflow';
type ActivityCategory = 'operating' | 'investing' | 'financing';

interface CashflowEntry {
    id: string;
    date: string;
    refNo: string;
    docNo: string;
    accountCode: string;
    accountName: string;
    description: string;
    partnerName: string;
    type: CashflowType;
    category: ActivityCategory;
    amount: number;
    runningBalance?: number;
}

interface BankAccountBalance {
    code: string;
    bankName: string;
    accountNumber: string;
    holderName: string;
    beginningBalance: number;
    inflowTotal: number;
    outflowTotal: number;
    currentBalance: number;
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

const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CashflowReport() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeTab, setActiveTab] = useState<'registry' | 'psak' | 'banks'>(
        'registry',
    );

    // Beginning Balances
    const initialBeginningBalance = 150000000; // Rp 150.000.000 awal periode

    // Initial Bank Accounts Master Balance
    const [bankAccounts, setBankAccounts] = useState<BankAccountBalance[]>([
        {
            code: '1111',
            bankName: 'Bank Mandiri Solo Baru',
            accountNumber: '138-00-2010633-7',
            holderName: 'Yousee Indonesia / Indung Sukma',
            beginningBalance: 85000000,
            inflowTotal: isPPN ? 11100000 : 10000000,
            outflowTotal: isPPN ? 3330000 : 3000000,
            currentBalance:
                85000000 + (isPPN ? 11100000 - 3330000 : 10000000 - 3000000),
        },
        {
            code: '1112',
            bankName: 'Bank BCA Operasional Utama',
            accountNumber: '015-882-9901',
            holderName: 'Yousee Indonesia',
            beginningBalance: 50000000,
            inflowTotal: isPPN ? 16650000 : 15000000,
            outflowTotal: isPPN ? 1200000 : 1200000,
            currentBalance:
                50000000 + (isPPN ? 16650000 - 1200000 : 15000000 - 1200000),
        },
        {
            code: '1110',
            bankName: 'Kas Tunai Operasional',
            accountNumber: 'KAS-01',
            holderName: 'Kasir Utama',
            beginningBalance: 15000000,
            inflowTotal: 0,
            outflowTotal: 1500000,
            currentBalance: 13500000,
        },
    ]);

    // Initial Raw Cashflow Mutasi Dataset
    const [cashflowList, setCashflowList] = useState<CashflowEntry[]>([
        {
            id: 'CF-2026-001',
            date: '2026-06-25',
            refNo: 'BCA-IN-99120',
            docNo: 'KW-2026-0812',
            accountCode: '1112',
            accountName: 'Bank BCA Operasional Utama',
            description: `Penerimaan Pelunasan Invoice #${isPPN ? 'INV-PPN-001' : 'INV-NP-001'}`,
            partnerName: 'PT. Gojek Tokopedia',
            type: 'inflow',
            category: 'operating',
            amount: isPPN ? 11100000 : 10000000,
        },
        {
            id: 'CF-2026-002',
            date: '2026-06-24',
            refNo: 'MANDIRI-OUT-8812',
            docNo: 'OUT-PAY-0041',
            accountCode: '1111',
            accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
            description: `Pembayaran Kewajiban PO #${isPPN ? 'PO-PPN-001' : 'PO-NP-001'} Media Billboard`,
            partnerName: 'PT. Megah Billboard Jaya',
            type: 'outflow',
            category: 'operating',
            amount: isPPN ? 3330000 : 3000000,
        },
        {
            id: 'CF-2026-003',
            date: '2026-06-22',
            refNo: 'BCA-IN-99121',
            docNo: 'KW-2026-0813',
            accountCode: '1112',
            accountName: 'Bank BCA Operasional Utama',
            description: `Penerimaan Uang Muka (DP) Invoice #${isPPN ? 'INV-PPN-002' : 'INV-NP-002'} Videotron`,
            partnerName: 'Traveloka Corp',
            type: 'inflow',
            category: 'operating',
            amount: isPPN ? 5550000 : 5000000,
        },
        {
            id: 'CF-2026-004',
            date: '2026-06-20',
            refNo: 'KAS-OUT-0012',
            docNo: 'ADJ-2026-001',
            accountCode: '1110',
            accountName: 'Kas Tunai Operasional',
            description:
                'Pembayaran Beban Operasional Listrik Videotron Simpang Lima Juni',
            partnerName: 'PLN Persero',
            type: 'outflow',
            category: 'operating',
            amount: 1500000,
        },
        {
            id: 'CF-2026-005',
            date: '2026-06-18',
            refNo: 'BCA-IN-99125',
            docNo: 'KW-2026-0815',
            accountCode: '1112',
            accountName: 'Bank BCA Operasional Utama',
            description: `Penerimaan Pelunasan Invoice #${isPPN ? 'INV-PPN-004' : 'INV-NP-004'} Billboard Yogya`,
            partnerName: 'Shopee Indonesia',
            type: 'inflow',
            category: 'operating',
            amount: isPPN ? 11100000 : 10000000,
        },
        {
            id: 'CF-2026-006',
            date: '2026-06-15',
            refNo: 'MANDIRI-OUT-8815',
            docNo: 'PO-PPN-003',
            accountCode: '1111',
            accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
            description:
                'Pembayaran Belanja Konstruksi Rangka Billboard Baru Ring Road',
            partnerName: 'CV. Media Ad Perkasa',
            type: 'outflow',
            category: 'investing',
            amount: 12000000,
        },
    ]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [accountFilter, setAccountFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state for manual cashflow transaction
    const [addCashflowModal, setAddCashflowModal] = useState(false);
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // Form inputs for manual cashflow
    const [newType, setNewType] = useState<CashflowType>('outflow');
    const [newCategory, setNewCategory] =
        useState<ActivityCategory>('operating');
    const [newAccountCode, setNewAccountCode] = useState('1111');
    const [newAmount, setNewAmount] = useState('');
    const [newPartner, setNewPartner] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newRefNo, setNewRefNo] = useState('');

    // Compute Running Balance & Filtered Mutasi
    const { computedCashflows, totalInflow, totalOutflow, endingBalance } =
        useMemo(() => {
            // Sort chronologically ascending for running balance calculation
            const sortedAsc = [...cashflowList].sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            );

            let cumBalance = initialBeginningBalance;
            let totIn = 0;
            let totOut = 0;

            const withRunning = sortedAsc.map((item) => {
                if (item.type === 'inflow') {
                    cumBalance += item.amount;
                    totIn += item.amount;
                } else {
                    cumBalance -= item.amount;
                    totOut += item.amount;
                }
                return { ...item, runningBalance: cumBalance };
            });

            // Now sort descending for page display (latest date first)
            const sortedDesc = [...withRunning].sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
            );

            // Apply UI Filters
            const filtered = sortedDesc.filter((item) => {
                const matchesSearch =
                    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.refNo
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.docNo
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    item.partnerName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                const matchesAccount =
                    accountFilter === 'all' ||
                    item.accountCode === accountFilter;
                const matchesCategory =
                    categoryFilter === 'all' ||
                    item.category === categoryFilter;
                const matchesType =
                    typeFilter === 'all' || item.type === typeFilter;

                let matchesDate = true;
                if (startDateFilter)
                    matchesDate =
                        matchesDate &&
                        new Date(item.date) >= new Date(startDateFilter);
                if (endDateFilter)
                    matchesDate =
                        matchesDate &&
                        new Date(item.date) <= new Date(endDateFilter);

                return (
                    matchesSearch &&
                    matchesAccount &&
                    matchesCategory &&
                    matchesType &&
                    matchesDate
                );
            });

            return {
                computedCashflows: filtered,
                totalInflow: totIn,
                totalOutflow: totOut,
                endingBalance: initialBeginningBalance + totIn - totOut,
            };
        }, [
            cashflowList,
            searchQuery,
            accountFilter,
            categoryFilter,
            typeFilter,
            startDateFilter,
            endDateFilter,
        ]);

    // Paginated Dataset
    const paginatedCashflows = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return computedCashflows.slice(start, start + ITEMS_PER_PAGE);
    }, [computedCashflows, currentPage]);

    // Breakdown PSAK Categories
    const psakBreakdown = useMemo(() => {
        let operatingIn = 0;
        let operatingOut = 0;
        let investingIn = 0;
        let investingOut = 0;
        let financingIn = 0;
        let financingOut = 0;

        cashflowList.forEach((c) => {
            if (c.category === 'operating') {
                if (c.type === 'inflow') operatingIn += c.amount;
                else operatingOut += c.amount;
            } else if (c.category === 'investing') {
                if (c.type === 'inflow') investingIn += c.amount;
                else investingOut += c.amount;
            } else if (c.category === 'financing') {
                if (c.type === 'inflow') financingIn += c.amount;
                else financingOut += c.amount;
            }
        });

        const netOperating = operatingIn - operatingOut;
        const netInvesting = investingIn - investingOut;
        const netFinancing = financingIn - financingOut;
        const netCashIncrease = netOperating + netInvesting + netFinancing;

        return {
            operatingIn,
            operatingOut,
            netOperating,
            investingIn,
            investingOut,
            netInvesting,
            financingIn,
            financingOut,
            netFinancing,
            netCashIncrease,
        };
    }, [cashflowList]);

    // Category Badge Helper
    const getActivityBadge = (cat: ActivityCategory) => {
        switch (cat) {
            case 'operating':
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Operasional
                    </span>
                );
            case 'investing':
                return (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        Investasi Aset
                    </span>
                );
            case 'financing':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Pendanaan Usaha
                    </span>
                );
        }
    };

    // Handle Manual Cashflow Save
    const handleSaveNewCashflow = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(newAmount) || 0;
        if (amt <= 0) {
            alert('Nominal transaksi kas harus lebih dari Rp 0.');
            return;
        }

        const selectedAcc = bankAccounts.find((b) => b.code === newAccountCode);

        const newEntry: CashflowEntry = {
            id: `CF-2026-${Math.floor(100 + Math.random() * 900)}`,
            date: new Date().toISOString().split('T')[0],
            refNo:
                newRefNo || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
            docNo: `CASH-${Math.floor(1000 + Math.random() * 9000)}`,
            accountCode: newAccountCode,
            accountName: selectedAcc
                ? `${selectedAcc.bankName} (${selectedAcc.accountNumber})`
                : 'Kas Operasional',
            description: newDesc,
            partnerName: newPartner || 'Umum',
            type: newType,
            category: newCategory,
            amount: amt,
        };

        setCashflowList((prev) => [newEntry, ...prev]);

        // Update Bank Balance Account
        setBankAccounts((prev) =>
            prev.map((acc) => {
                if (acc.code === newAccountCode) {
                    const addIn = newType === 'inflow' ? amt : 0;
                    const addOut = newType === 'outflow' ? amt : 0;
                    return {
                        ...acc,
                        inflowTotal: acc.inflowTotal + addIn,
                        outflowTotal: acc.outflowTotal + addOut,
                        currentBalance: acc.currentBalance + (addIn - addOut),
                    };
                }
                return acc;
            }),
        );

        setAddCashflowModal(false);
        setSuccessAlert(
            `Sukses! Transaksi Mutasi Kas (${newType === 'inflow' ? 'Uang Masuk' : 'Uang Keluar'}) sebesar ${fmt(amt)} berhasil dicatat.`,
        );
        setTimeout(() => setSuccessAlert(null), 5000);

        // Reset form
        setNewAmount('');
        setNewDesc('');
        setNewPartner('');
        setNewRefNo('');
    };

    // Action Items for Rows
    const getRowActionItems = (cf: CashflowEntry): ActionMenuItem[] => {
        return [
            {
                label: 'Cetak Bukti Mutasi Kas PDF',
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
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                ),
                onClick: () =>
                    alert(
                        `Mencetak Bukti Mutasi Kas #${cf.id} (${cf.refNo})...`,
                    ),
            },
        ];
    };

    return (
        <AppLayout
            activePage="cashflow"
            title="Laporan Arus Kas (Statement of Cash Flows)"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Accounting' },
                { label: 'Cashflow' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header Section */}
                <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-slate-900">
                                Laporan Arus Kas (Statement of Cash Flows & Cash
                                Registry)
                            </h2>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${isPPN ? 'border border-blue-200 bg-blue-100 text-blue-800' : 'border border-slate-200 bg-slate-100 text-slate-700'}`}
                            >
                                Mode {isPPN ? 'PPN 11%' : 'Non-PPN'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Monitoring realisasi penerimaan uang masuk,
                            pengeluaran kas, saldo berjalan (running balance),
                            serta laporan arus kas terstruktur PSAK.
                        </p>
                    </div>

                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <button
                            onClick={() =>
                                alert(
                                    'Mengunduh Rekap Laporan Arus Kas (PDF / Excel)...',
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
                            <span>Export Laporan</span>
                        </button>

                        <button
                            onClick={() => setAddCashflowModal(true)}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800"
                        >
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            <span>+ Mutasi Kas Manual</span>
                        </button>
                    </div>
                </div>

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
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            SALDO AWAL KAS & BANK
                        </span>
                        <span className="block font-mono text-2xl font-bold text-slate-900">
                            {fmt(initialBeginningBalance)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Posisi pembuka awal bulan
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TOTAL UANG MASUK (INFLOW)
                            </span>
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                + Inflow
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-emerald-700">
                            {fmt(totalInflow)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Dari pelunasan invoice client
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TOTAL UANG KELUAR (OUTFLOW)
                            </span>
                            <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                - Outflow
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-rose-600">
                            {fmt(totalOutflow)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Dari pembayaran PO vendor & beban
                        </span>
                    </div>

                    <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white bg-gradient-to-br from-blue-50/60 to-white p-5 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                SALDO AKHIR KAS & BANK
                            </span>
                            <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                Ending Cash
                            </span>
                        </div>
                        <span className="block font-mono text-2xl font-bold text-blue-800">
                            {fmt(endingBalance)}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                            Net likuiditas kas perusahaan
                        </span>
                    </div>
                </div>

                {/* Main Tab Navigation Toolbar */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                    <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
                        <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
                            <button
                                onClick={() => {
                                    setActiveTab('registry');
                                    setCurrentPage(1);
                                }}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'registry'
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
                                <span>Buku Mutasi Kas & Running Balance</span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                                    {cashflowList.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('psak')}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'psak'
                                        ? 'shadow-2xs bg-white text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg
                                    className="h-4 w-4 text-purple-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Laporan Arus Kas (Format PSAK 2)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('banks')}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'banks'
                                        ? 'shadow-2xs bg-white text-slate-900'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
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
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                                <span>Saldo Per Rekening Bank</span>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                    {bankAccounts.length}
                                </span>
                            </button>
                        </div>

                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {activeTab === 'registry'
                                ? 'Daftar Mutasi Debet / Kredit Kas Running Balance'
                                : activeTab === 'psak'
                                  ? 'Format Laporan Arus Kas 3 Aktivitas (PSAK 2 / IAS 7)'
                                  : 'Rincian Saldo Riil Per Rekening Bank Perusahaan'}
                        </div>
                    </div>

                    {/* Filter Panel Bar */}
                    {activeTab === 'registry' && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-5">
                            <div className="space-y-1 lg:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Pencarian Mutasi
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Cari Ref No., Dokumen, Partner, Keterangan..."
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

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Filter Rekening Bank
                                </label>
                                <SelectInput
                                    value={accountFilter}
                                    onChange={(e) => {
                                        setAccountFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        {
                                            value: 'all',
                                            label: 'Semua Rekening Kas/Bank',
                                        },
                                        {
                                            value: '1111',
                                            label: '1111 - Bank Mandiri Solo Baru',
                                        },
                                        {
                                            value: '1112',
                                            label: '1112 - Bank BCA Operasional',
                                        },
                                        {
                                            value: '1110',
                                            label: '1110 - Kas Tunai Operasional',
                                        },
                                    ]}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Kategori Aktivitas
                                </label>
                                <SelectInput
                                    value={categoryFilter}
                                    onChange={(e) => {
                                        setCategoryFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        {
                                            value: 'all',
                                            label: 'Semua Aktivitas',
                                        },
                                        {
                                            value: 'operating',
                                            label: 'Aktivitas Operasional',
                                        },
                                        {
                                            value: 'investing',
                                            label: 'Aktivitas Investasi',
                                        },
                                        {
                                            value: 'financing',
                                            label: 'Aktivitas Pendanaan',
                                        },
                                    ]}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Jenis Mutasi
                                </label>
                                <SelectInput
                                    value={typeFilter}
                                    onChange={(e) => {
                                        setTypeFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    options={[
                                        {
                                            value: 'all',
                                            label: 'Semua Jenis Mutasi',
                                        },
                                        {
                                            value: 'inflow',
                                            label: '+ Uang Masuk (Inflow)',
                                        },
                                        {
                                            value: 'outflow',
                                            label: '- Uang Keluar (Outflow)',
                                        },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* TAB 1: BUKU REGISTRY MUTASI KAS */}
                {activeTab === 'registry' && (
                    <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4">
                                            Tanggal & Ref
                                        </th>
                                        <th className="px-6 py-4">
                                            Dokumen & Partner
                                        </th>
                                        <th className="px-6 py-4">
                                            Akun Kas / Bank
                                        </th>
                                        <th className="px-6 py-4">
                                            Keterangan Mutasi
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Uang Masuk (+)
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Uang Keluar (-)
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Saldo Berjalan
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedCashflows.map((cf) => (
                                        <tr
                                            key={cf.id}
                                            className="transition-colors hover:bg-slate-50/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">
                                                    {formatDateIndo(cf.date)}
                                                </div>
                                                <div className="font-mono text-[10.5px] font-bold text-blue-600">
                                                    {cf.refNo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono font-bold text-slate-800">
                                                    {cf.docNo}
                                                </div>
                                                <div className="text-[10.5px] font-medium text-slate-500">
                                                    {cf.partnerName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">
                                                    {cf.accountName}
                                                </div>
                                                <div>
                                                    {getActivityBadge(
                                                        cf.category,
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className="max-w-[220px] truncate px-6 py-4 font-semibold text-slate-700"
                                                title={cf.description}
                                            >
                                                {cf.description}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                                                {cf.type === 'inflow'
                                                    ? fmt(cf.amount)
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                                                {cf.type === 'outflow'
                                                    ? fmt(cf.amount)
                                                    : '—'}
                                            </td>
                                            <td className="bg-slate-50/40 px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                {fmt(cf.runningBalance || 0)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <ActionDropdown
                                                    items={getRowActionItems(
                                                        cf,
                                                    )}
                                                />
                                            </td>
                                        </tr>
                                    ))}

                                    {computedCashflows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="py-12 text-center"
                                            >
                                                <EmptyState
                                                    title="Belum Ada Mutasi Kas"
                                                    message="Tidak ditemukan catatan mutasi arus kas yang sesuai dengan pencarian."
                                                />
                                            </td>
                                        </tr>
                                    )}

                                    {/* Footer Summary */}
                                    {computedCashflows.length > 0 && (
                                        <tr className="border-t-2 border-slate-300 bg-slate-100/80 font-bold text-slate-900">
                                            <td
                                                colSpan={4}
                                                className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-700"
                                            >
                                                TOTAL MUTASI SELEKSI PERIODE
                                                INI:
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-emerald-700">
                                                {fmt(totalInflow)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-rose-600">
                                                {fmt(totalOutflow)}
                                            </td>
                                            <td className="bg-blue-50/60 px-6 py-4 text-right font-mono text-sm font-bold text-blue-800">
                                                {fmt(endingBalance)}
                                            </td>
                                            <td className="px-6 py-4"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {computedCashflows.length > 0 && (
                            <div className="border-t border-slate-100 p-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(
                                        computedCashflows.length /
                                            ITEMS_PER_PAGE,
                                    )}
                                    totalItems={computedCashflows.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: LAPORAN ARUS KAS FORMAT PSAK 2 */}
                {activeTab === 'psak' && (
                    <div className="shadow-xs space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6">
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-slate-900">
                                Laporan Arus Kas Menurut Standar Akuntansi (PSAK
                                2 / IAS 7)
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Klasifikasi arus kas dari aktivitas operasional,
                                investasi aset, dan pendanaan usaha.
                            </p>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Section 1: Operating */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h4 className="font-bold uppercase text-slate-900">
                                        1. Arus Kas dari Aktivitas Operasional
                                    </h4>
                                    <span className="font-mono text-sm font-bold text-slate-900">
                                        {fmt(psakBreakdown.netOperating)}
                                    </span>
                                </div>
                                <div className="space-y-1.5 pl-4 font-medium text-slate-700">
                                    <div className="flex justify-between">
                                        <span>
                                            Penerimaan Kas dari Pelunasan
                                            Tagihan Client (+):
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700">
                                            {fmt(psakBreakdown.operatingIn)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>
                                            Pembayaran Kas untuk Biaya PO Vendor
                                            & Operasional (-):
                                        </span>
                                        <span className="font-mono font-bold text-rose-600">
                                            ({fmt(psakBreakdown.operatingOut)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Investing */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h4 className="font-bold uppercase text-slate-900">
                                        2. Arus Kas dari Aktivitas Investasi
                                    </h4>
                                    <span className="font-mono text-sm font-bold text-slate-900">
                                        {fmt(psakBreakdown.netInvesting)}
                                    </span>
                                </div>
                                <div className="space-y-1.5 pl-4 font-medium text-slate-700">
                                    <div className="flex justify-between">
                                        <span>
                                            Penerimaan dari Pelepasan Aset Tetap
                                            (+):
                                        </span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>
                                            Pembelian & Konstruksi Aset Tetap
                                            Billboard (-):
                                        </span>
                                        <span className="font-mono font-bold text-rose-600">
                                            ({fmt(psakBreakdown.investingOut)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financing */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h4 className="font-bold uppercase text-slate-900">
                                        3. Arus Kas dari Aktivitas Pendanaan
                                    </h4>
                                    <span className="font-mono text-sm font-bold text-slate-900">
                                        {fmt(psakBreakdown.netFinancing)}
                                    </span>
                                </div>
                                <div className="space-y-1.5 pl-4 font-medium text-slate-700">
                                    <div className="flex justify-between">
                                        <span>
                                            Penerimaan dari Setoran Modal
                                            Pemilik (+):
                                        </span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>
                                            Pembayaran Prive / Dividen Pemilik
                                            (-):
                                        </span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Final Reconciliation */}
                            <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-xs font-bold text-slate-900">
                                <div className="flex justify-between">
                                    <span>
                                        Kenaikan / (Penurunan) Bersih Kas &
                                        Bank:
                                    </span>
                                    <span className="font-mono text-blue-800">
                                        {fmt(psakBreakdown.netCashIncrease)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>
                                        Saldo Kas & Bank Pada Awal Periode:
                                    </span>
                                    <span className="font-mono">
                                        {fmt(initialBeginningBalance)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-2 text-sm text-blue-900">
                                    <span>
                                        Saldo Kas & Bank Pada Akhir Periode:
                                    </span>
                                    <span className="font-mono text-base">
                                        {fmt(
                                            initialBeginningBalance +
                                                psakBreakdown.netCashIncrease,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: SALDO PER REKENING BANK */}
                {activeTab === 'banks' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {bankAccounts.map((bank) => (
                            <div
                                key={bank.code}
                                className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 transition-all hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {bank.bankName}
                                        </h4>
                                        <div className="mt-0.5 font-mono text-xs font-bold text-blue-600">
                                            {bank.accountNumber}
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                        {bank.code}
                                    </span>
                                </div>

                                <div className="space-y-1.5 rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-xs font-medium">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Saldo Awal:</span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {fmt(bank.beginningBalance)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Mutasi Masuk (+):</span>
                                        <span className="font-mono font-bold">
                                            {fmt(bank.inflowTotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-rose-600">
                                        <span>Mutasi Keluar (-):</span>
                                        <span className="font-mono font-bold">
                                            {fmt(bank.outflowTotal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                                    <span className="text-xs font-bold uppercase text-slate-500">
                                        Saldo Berjalan
                                    </span>
                                    <span className="font-mono text-lg font-bold text-blue-800">
                                        {fmt(bank.currentBalance)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: TAMBAH MUTASI KAS MANUAL */}
            {addCashflowModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setAddCashflowModal(false)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Catat Mutasi Kas / Bank Baru
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    Pencatatan penerimaan / pengeluaran kas
                                    operasional
                                </p>
                            </div>
                            <button
                                onClick={() => setAddCashflowModal(false)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveNewCashflow}
                            className="space-y-4 p-6 text-xs"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Jenis Mutasi Kas
                                    </label>
                                    <SelectInput
                                        value={newType}
                                        onChange={(e) =>
                                            setNewType(
                                                e.target.value as CashflowType,
                                            )
                                        }
                                        options={[
                                            {
                                                value: 'outflow',
                                                label: '- Uang Keluar (Outflow)',
                                            },
                                            {
                                                value: 'inflow',
                                                label: '+ Uang Masuk (Inflow)',
                                            },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Kategori Aktivitas
                                    </label>
                                    <SelectInput
                                        value={newCategory}
                                        onChange={(e) =>
                                            setNewCategory(
                                                e.target
                                                    .value as ActivityCategory,
                                            )
                                        }
                                        options={[
                                            {
                                                value: 'operating',
                                                label: 'Operasional',
                                            },
                                            {
                                                value: 'investing',
                                                label: 'Investasi Aset',
                                            },
                                            {
                                                value: 'financing',
                                                label: 'Pendanaan Usaha',
                                            },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Pilih Akun Kas / Bank (COA)
                                </label>
                                <SelectInput
                                    value={newAccountCode}
                                    onChange={(e) =>
                                        setNewAccountCode(e.target.value)
                                    }
                                    options={bankAccounts.map((b) => ({
                                        value: b.code,
                                        label: `${b.code} - ${b.bankName}`,
                                    }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Nominal Mutasi (IDR)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Contoh: 1500000"
                                        value={newAmount}
                                        onChange={(e) =>
                                            setNewAmount(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        No. Referensi / Bukti Bank
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="No. Ref Bank..."
                                        value={newRefNo}
                                        onChange={(e) =>
                                            setNewRefNo(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Mitra Partner / Pihak Terkait
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nama Client, Vendor, atau Supplier..."
                                    value={newPartner}
                                    onChange={(e) =>
                                        setNewPartner(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Keterangan / Deskripsi Transaksi
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Deskripsi pengeluaran / penerimaan..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAddCashflowModal(false)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                                >
                                    Simpan Mutasi Kas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
