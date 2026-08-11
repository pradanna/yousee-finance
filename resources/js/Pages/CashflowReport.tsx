import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import SelectInput from '@/Components/Form/SelectInput';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';

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

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
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

    const [activeTab, setActiveTab] = useState<'registry' | 'psak' | 'banks'>('registry');

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
            currentBalance: 85000000 + (isPPN ? 11100000 - 3330000 : 10000000 - 3000000)
        },
        {
            code: '1112',
            bankName: 'Bank BCA Operasional Utama',
            accountNumber: '015-882-9901',
            holderName: 'Yousee Indonesia',
            beginningBalance: 50000000,
            inflowTotal: isPPN ? 16650000 : 15000000,
            outflowTotal: isPPN ? 1200000 : 1200000,
            currentBalance: 50000000 + (isPPN ? 16650000 - 1200000 : 15000000 - 1200000)
        },
        {
            code: '1110',
            bankName: 'Kas Tunai Operasional',
            accountNumber: 'KAS-01',
            holderName: 'Kasir Utama',
            beginningBalance: 15000000,
            inflowTotal: 0,
            outflowTotal: 1500000,
            currentBalance: 13500000
        }
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
            amount: isPPN ? 11100000 : 10000000
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
            amount: isPPN ? 3330000 : 3000000
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
            amount: isPPN ? 5550000 : 5000000
        },
        {
            id: 'CF-2026-004',
            date: '2026-06-20',
            refNo: 'KAS-OUT-0012',
            docNo: 'ADJ-2026-001',
            accountCode: '1110',
            accountName: 'Kas Tunai Operasional',
            description: 'Pembayaran Beban Operasional Listrik Videotron Simpang Lima Juni',
            partnerName: 'PLN Persero',
            type: 'outflow',
            category: 'operating',
            amount: 1500000
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
            amount: isPPN ? 11100000 : 10000000
        },
        {
            id: 'CF-2026-006',
            date: '2026-06-15',
            refNo: 'MANDIRI-OUT-8815',
            docNo: 'PO-PPN-003',
            accountCode: '1111',
            accountName: 'Bank Mandiri Solo Baru (138-00-2010633-7)',
            description: 'Pembayaran Belanja Konstruksi Rangka Billboard Baru Ring Road',
            partnerName: 'CV. Media Ad Perkasa',
            type: 'outflow',
            category: 'investing',
            amount: 12000000
        }
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
    const [newCategory, setNewCategory] = useState<ActivityCategory>('operating');
    const [newAccountCode, setNewAccountCode] = useState('1111');
    const [newAmount, setNewAmount] = useState('');
    const [newPartner, setNewPartner] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newRefNo, setNewRefNo] = useState('');

    // Compute Running Balance & Filtered Mutasi
    const { computedCashflows, totalInflow, totalOutflow, endingBalance } = useMemo(() => {
        // Sort chronologically ascending for running balance calculation
        const sortedAsc = [...cashflowList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let cumBalance = initialBeginningBalance;
        let totIn = 0;
        let totOut = 0;

        const withRunning = sortedAsc.map(item => {
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
        const sortedDesc = [...withRunning].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Apply UI Filters
        const filtered = sortedDesc.filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.partnerName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesAccount = accountFilter === 'all' || item.accountCode === accountFilter;
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            let matchesDate = true;
            if (startDateFilter) matchesDate = matchesDate && new Date(item.date) >= new Date(startDateFilter);
            if (endDateFilter) matchesDate = matchesDate && new Date(item.date) <= new Date(endDateFilter);

            return matchesSearch && matchesAccount && matchesCategory && matchesType && matchesDate;
        });

        return {
            computedCashflows: filtered,
            totalInflow: totIn,
            totalOutflow: totOut,
            endingBalance: initialBeginningBalance + totIn - totOut
        };
    }, [cashflowList, searchQuery, accountFilter, categoryFilter, typeFilter, startDateFilter, endDateFilter]);

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

        cashflowList.forEach(c => {
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
            operatingIn, operatingOut, netOperating,
            investingIn, investingOut, netInvesting,
            financingIn, financingOut, netFinancing,
            netCashIncrease
        };
    }, [cashflowList]);

    // Category Badge Helper
    const getActivityBadge = (cat: ActivityCategory) => {
        switch (cat) {
            case 'operating':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Operasional</span>;
            case 'investing':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Investasi Aset</span>;
            case 'financing':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Pendanaan Usaha</span>;
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

        const selectedAcc = bankAccounts.find(b => b.code === newAccountCode);

        const newEntry: CashflowEntry = {
            id: `CF-2026-${Math.floor(100 + Math.random() * 900)}`,
            date: new Date().toISOString().split('T')[0],
            refNo: newRefNo || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
            docNo: `CASH-${Math.floor(1000 + Math.random() * 9000)}`,
            accountCode: newAccountCode,
            accountName: selectedAcc ? `${selectedAcc.bankName} (${selectedAcc.accountNumber})` : 'Kas Operasional',
            description: newDesc,
            partnerName: newPartner || 'Umum',
            type: newType,
            category: newCategory,
            amount: amt
        };

        setCashflowList(prev => [newEntry, ...prev]);

        // Update Bank Balance Account
        setBankAccounts(prev => prev.map(acc => {
            if (acc.code === newAccountCode) {
                const addIn = newType === 'inflow' ? amt : 0;
                const addOut = newType === 'outflow' ? amt : 0;
                return {
                    ...acc,
                    inflowTotal: acc.inflowTotal + addIn,
                    outflowTotal: acc.outflowTotal + addOut,
                    currentBalance: acc.currentBalance + (addIn - addOut)
                };
            }
            return acc;
        }));

        setAddCashflowModal(false);
        setSuccessAlert(`Sukses! Transaksi Mutasi Kas (${newType === 'inflow' ? 'Uang Masuk' : 'Uang Keluar'}) sebesar ${fmt(amt)} berhasil dicatat.`);
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
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                onClick: () => alert(`Mencetak Bukti Mutasi Kas #${cf.id} (${cf.refNo})...`)
            }
        ];
    };

    return (
        <AppLayout
            activePage="cashflow"
            title="Laporan Arus Kas (Statement of Cash Flows)"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Cashflow' }]}
        >
            <div className="w-full space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Laporan Arus Kas (Statement of Cash Flows & Cash Registry)</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isPPN ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                Mode {isPPN ? "PPN 11%" : "Non-PPN"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Monitoring realisasi penerimaan uang masuk, pengeluaran kas, saldo berjalan (running balance), serta laporan arus kas terstruktur PSAK.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => alert("Mengunduh Rekap Laporan Arus Kas (PDF / Excel)...")}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export Laporan</span>
                        </button>

                        <button
                            onClick={() => setAddCashflowModal(true)}
                            className="bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span>+ Mutasi Kas Manual</span>
                        </button>
                    </div>
                </div>

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-in shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-xs font-bold text-emerald-900 leading-tight">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Executive Summary Metric Cards (4 Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SALDO AWAL KAS & BANK</span>
                        <span className="text-2xl font-bold text-slate-900 font-mono block">{fmt(initialBeginningBalance)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Posisi pembuka awal bulan</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL UANG MASUK (INFLOW)</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">+ Inflow</span>
                        </div>
                        <span className="text-2xl font-bold text-emerald-700 font-mono block">{fmt(totalInflow)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Dari pelunasan invoice client</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL UANG KELUAR (OUTFLOW)</span>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">- Outflow</span>
                        </div>
                        <span className="text-2xl font-bold text-rose-600 font-mono block">{fmt(totalOutflow)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Dari pembayaran PO vendor & beban</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2 bg-gradient-to-br from-blue-50/60 to-white">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SALDO AKHIR KAS & BANK</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold border border-blue-200">Ending Cash</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-800 font-mono block">{fmt(endingBalance)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Net likuiditas kas perusahaan</span>
                    </div>
                </div>

                {/* Main Tab Navigation Toolbar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/80 w-full sm:w-auto">
                            <button
                                onClick={() => { setActiveTab('registry'); setCurrentPage(1); }}
                                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'registry' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Buku Mutasi Kas & Running Balance</span>
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {cashflowList.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab('psak')}
                                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'psak' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Laporan Arus Kas (Format PSAK 2)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('banks')}
                                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'banks' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>Saldo Per Rekening Bank</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {bankAccounts.length}
                                </span>
                            </button>
                        </div>

                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {activeTab === 'registry' ? 'Daftar Mutasi Debet / Kredit Kas Running Balance' :
                             activeTab === 'psak' ? 'Format Laporan Arus Kas 3 Aktivitas (PSAK 2 / IAS 7)' :
                             'Rincian Saldo Riil Per Rekening Bank Perusahaan'}
                        </div>
                    </div>

                    {/* Filter Panel Bar */}
                    {activeTab === 'registry' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:items-end">
                            <div className="space-y-1 lg:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Mutasi</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        placeholder="Cari Ref No., Dokumen, Partner, Keterangan..."
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all placeholder-slate-400 shadow-2xs"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Rekening Bank</label>
                                <SelectInput
                                    value={accountFilter}
                                    onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Semua Rekening Kas/Bank' },
                                        { value: '1111', label: '1111 - Bank Mandiri Solo Baru' },
                                        { value: '1112', label: '1112 - Bank BCA Operasional' },
                                        { value: '1110', label: '1110 - Kas Tunai Operasional' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Aktivitas</label>
                                <SelectInput
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Semua Aktivitas' },
                                        { value: 'operating', label: 'Aktivitas Operasional' },
                                        { value: 'investing', label: 'Aktivitas Investasi' },
                                        { value: 'financing', label: 'Aktivitas Pendanaan' },
                                    ]}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenis Mutasi</label>
                                <SelectInput
                                    value={typeFilter}
                                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                                    options={[
                                        { value: 'all', label: 'Semua Jenis Mutasi' },
                                        { value: 'inflow', label: '+ Uang Masuk (Inflow)' },
                                        { value: 'outflow', label: '- Uang Keluar (Outflow)' },
                                    ]}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* TAB 1: BUKU REGISTRY MUTASI KAS */}
                {activeTab === 'registry' && (
                    <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                        <th className="py-4 px-6">Tanggal & Ref</th>
                                        <th className="py-4 px-6">Dokumen & Partner</th>
                                        <th className="py-4 px-6">Akun Kas / Bank</th>
                                        <th className="py-4 px-6">Keterangan Mutasi</th>
                                        <th className="py-4 px-6 text-right">Uang Masuk (+)</th>
                                        <th className="py-4 px-6 text-right">Uang Keluar (-)</th>
                                        <th className="py-4 px-6 text-right">Saldo Berjalan</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedCashflows.map((cf) => (
                                        <tr key={cf.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-900">{formatDateIndo(cf.date)}</div>
                                                <div className="text-[10.5px] font-mono font-bold text-blue-600">{cf.refNo}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-mono font-bold text-slate-800">{cf.docNo}</div>
                                                <div className="text-[10.5px] text-slate-500 font-medium">{cf.partnerName}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="font-bold text-slate-800">{cf.accountName}</div>
                                                <div>{getActivityBadge(cf.category)}</div>
                                            </td>
                                            <td className="py-4 px-6 font-semibold text-slate-700 max-w-[220px] truncate" title={cf.description}>
                                                {cf.description}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">
                                                {cf.type === 'inflow' ? fmt(cf.amount) : '—'}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-bold text-rose-600">
                                                {cf.type === 'outflow' ? fmt(cf.amount) : '—'}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 bg-slate-50/40">
                                                {fmt(cf.runningBalance || 0)}
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <ActionDropdown items={getRowActionItems(cf)} />
                                            </td>
                                        </tr>
                                    ))}

                                    {computedCashflows.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center">
                                                <EmptyState title="Belum Ada Mutasi Kas" message="Tidak ditemukan catatan mutasi arus kas yang sesuai dengan pencarian." />
                                            </td>
                                        </tr>
                                    )}

                                    {/* Footer Summary */}
                                    {computedCashflows.length > 0 && (
                                        <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                                            <td colSpan={4} className="py-4 px-6 text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                                                TOTAL MUTASI SELEKSI PERIODE INI:
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-sm font-bold text-emerald-700">
                                                {fmt(totalInflow)}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-sm font-bold text-rose-600">
                                                {fmt(totalOutflow)}
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-sm font-bold text-blue-800 bg-blue-50/60">
                                                {fmt(endingBalance)}
                                            </td>
                                            <td className="py-4 px-6"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {computedCashflows.length > 0 && (
                            <div className="p-4 border-t border-slate-100">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(computedCashflows.length / ITEMS_PER_PAGE)}
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
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Laporan Arus Kas Menurut Standar Akuntansi (PSAK 2 / IAS 7)</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Klasifikasi arus kas dari aktivitas operasional, investasi aset, dan pendanaan usaha.
                            </p>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Section 1: Operating */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="font-bold text-slate-900 uppercase">1. Arus Kas dari Aktivitas Operasional</h4>
                                    <span className="font-mono font-bold text-sm text-slate-900">{fmt(psakBreakdown.netOperating)}</span>
                                </div>
                                <div className="space-y-1.5 font-medium text-slate-700 pl-4">
                                    <div className="flex justify-between">
                                        <span>Penerimaan Kas dari Pelunasan Tagihan Client (+):</span>
                                        <span className="font-mono text-emerald-700 font-bold">{fmt(psakBreakdown.operatingIn)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pembayaran Kas untuk Biaya PO Vendor & Operasional (-):</span>
                                        <span className="font-mono text-rose-600 font-bold">({fmt(psakBreakdown.operatingOut)})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Investing */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="font-bold text-slate-900 uppercase">2. Arus Kas dari Aktivitas Investasi</h4>
                                    <span className="font-mono font-bold text-sm text-slate-900">{fmt(psakBreakdown.netInvesting)}</span>
                                </div>
                                <div className="space-y-1.5 font-medium text-slate-700 pl-4">
                                    <div className="flex justify-between">
                                        <span>Penerimaan dari Pelepasan Aset Tetap (+):</span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pembelian & Konstruksi Aset Tetap Billboard (-):</span>
                                        <span className="font-mono text-rose-600 font-bold">({fmt(psakBreakdown.investingOut)})</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Financing */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="font-bold text-slate-900 uppercase">3. Arus Kas dari Aktivitas Pendanaan</h4>
                                    <span className="font-mono font-bold text-sm text-slate-900">{fmt(psakBreakdown.netFinancing)}</span>
                                </div>
                                <div className="space-y-1.5 font-medium text-slate-700 pl-4">
                                    <div className="flex justify-between">
                                        <span>Penerimaan dari Setoran Modal Pemilik (+):</span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pembayaran Prive / Dividen Pemilik (-):</span>
                                        <span className="font-mono">Rp 0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Final Reconciliation */}
                            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 space-y-2 font-bold text-slate-900 text-xs">
                                <div className="flex justify-between">
                                    <span>Kenaikan / (Penurunan) Bersih Kas & Bank:</span>
                                    <span className="font-mono text-blue-800">{fmt(psakBreakdown.netCashIncrease)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saldo Kas & Bank Pada Awal Periode:</span>
                                    <span className="font-mono">{fmt(initialBeginningBalance)}</span>
                                </div>
                                <div className="flex justify-between border-t border-blue-200 pt-2 text-sm text-blue-900">
                                    <span>Saldo Kas & Bank Pada Akhir Periode:</span>
                                    <span className="font-mono text-base">{fmt(initialBeginningBalance + psakBreakdown.netCashIncrease)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: SALDO PER REKENING BANK */}
                {activeTab === 'banks' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {bankAccounts.map((bank) => (
                            <div key={bank.code} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">{bank.bankName}</h4>
                                        <div className="text-xs font-mono font-bold text-blue-600 mt-0.5">{bank.accountNumber}</div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        {bank.code}
                                    </span>
                                </div>

                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs space-y-1.5 font-medium">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Saldo Awal:</span>
                                        <span className="font-mono font-bold text-slate-800">{fmt(bank.beginningBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Mutasi Masuk (+):</span>
                                        <span className="font-mono font-bold">{fmt(bank.inflowTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600">
                                        <span>Mutasi Keluar (-):</span>
                                        <span className="font-mono font-bold">{fmt(bank.outflowTotal)}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Saldo Berjalan</span>
                                    <span className="text-lg font-mono font-bold text-blue-800">{fmt(bank.currentBalance)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: TAMBAH MUTASI KAS MANUAL */}
            {addCashflowModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setAddCashflowModal(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Catat Mutasi Kas / Bank Baru</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Pencatatan penerimaan / pengeluaran kas operasional</p>
                            </div>
                            <button onClick={() => setAddCashflowModal(false)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveNewCashflow} className="p-6 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Jenis Mutasi Kas</label>
                                    <SelectInput
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as CashflowType)}
                                        options={[
                                            { value: 'outflow', label: '- Uang Keluar (Outflow)' },
                                            { value: 'inflow', label: '+ Uang Masuk (Inflow)' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Kategori Aktivitas</label>
                                    <SelectInput
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                                        options={[
                                            { value: 'operating', label: 'Operasional' },
                                            { value: 'investing', label: 'Investasi Aset' },
                                            { value: 'financing', label: 'Pendanaan Usaha' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Pilih Akun Kas / Bank (COA)</label>
                                <SelectInput
                                    value={newAccountCode}
                                    onChange={(e) => setNewAccountCode(e.target.value)}
                                    options={bankAccounts.map(b => ({ value: b.code, label: `${b.code} - ${b.bankName}` }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Nominal Mutasi (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Contoh: 1500000"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">No. Referensi / Bukti Bank</label>
                                    <input
                                        type="text"
                                        placeholder="No. Ref Bank..."
                                        value={newRefNo}
                                        onChange={(e) => setNewRefNo(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Mitra Partner / Pihak Terkait</label>
                                <input
                                    type="text"
                                    placeholder="Nama Client, Vendor, atau Supplier..."
                                    value={newPartner}
                                    onChange={(e) => setNewPartner(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Keterangan / Deskripsi Transaksi</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Deskripsi pengeluaran / penerimaan..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddCashflowModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
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
