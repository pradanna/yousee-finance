import ExcelButton from '@/Components/Button/ExcelButton';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import MonthPicker from '@/Components/Form/MonthPicker';
import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import AuditLogModal, { AuditLogItem } from '@/Components/UI/AuditLogModal';
import Modal from '@/Components/UI/Modal';
import Toast from '@/Components/UI/Toast';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import type { PageProps as BasePageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';

export interface CoaOption {
    id: string;
    code: string;
    name: string;
    friendly_name?: string;
    current_balance?: number;
}

export interface SourceAccountOption {
    id: string;
    code: string;
    name: string;
    type: string;
}

export interface JournalLineItem {
    id: string;
    account_id: string;
    debit: number | string;
    credit: number | string;
    memo?: string | null;
    account?: {
        id: string;
        code: string;
        name: string;
    };
}

export interface JournalEntryData {
    id: string;
    number: string;
    fiscal_mode: 'ppn' | 'non-ppn';
    transaction_date: string;
    description: string;
    items?: JournalLineItem[];
}

export interface CashInTransactionItem {
    id: string;
    transaction_number: string;
    fiscal_mode: 'ppn' | 'non-ppn';
    deposit_account_id: string;
    source_account_id: string;
    amount: number | string;
    transaction_date: string;
    payer: string | null;
    description: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_url?: string | null;
    status: 'active' | 'voided';
    voided_at?: string | null;
    void_reason?: string | null;
    created_at: string;
    deposit_account?: CoaOption;
    source_account?: SourceAccountOption;
    creator?: {
        id: string;
        name: string;
    };
    voided_by?: {
        id: string;
        name: string;
    } | null;
    journal_entry?: JournalEntryData | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedCashIn {
    data: CashInTransactionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

export interface CashInMetrics {
    total_inflow: number;
    capital_deposit_total: number;
    other_inflow_total: number;
    total_cash_balance: number;
}

export interface CashInPageProps extends BasePageProps {
    transactions: PaginatedCashIn;
    depositAccounts: CoaOption[];
    sourceAccounts: SourceAccountOption[];
    metrics: CashInMetrics;
    isPeriodLocked?: boolean;
    auditLogs?: AuditLogItem[];
}

const formatRupiah = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
};

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function CashIn({
    transactions,
    depositAccounts = [],
    sourceAccounts = [],
    metrics,
    isPeriodLocked = false,
    auditLogs = [],
}: CashInPageProps) {
    const fiscalMode = useFiscalMode();
    const pageProps = usePage().props;
    const flash = (pageProps as { flash?: { success?: string; error?: string } }).flash;

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(flash?.success ?? null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<CashInTransactionItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [voidTarget, setVoidTarget] = useState<CashInTransactionItem | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);

    // Filters state
    const urlParams = new URLSearchParams(window.location.search);
    const currentMonth = urlParams.get('month') ?? String(new Date().getMonth() + 1);
    const currentYear = urlParams.get('year') ?? String(new Date().getFullYear());
    const [search, setSearch] = useState(urlParams.get('search') ?? '');
    const [selectedDepositAcc, setSelectedDepositAcc] = useState(urlParams.get('deposit_account_id') ?? 'all');
    const [selectedSourceAcc, setSelectedSourceAcc] = useState(urlParams.get('source_account_id') ?? 'all');
    const monthPickerVal = currentMonth === 'all' ? 'all' : `${currentYear}-${currentMonth.padStart(2, '0')}`;

    // Create Form
    const {
        data: formData,
        setData: setFormData,
        post: postCreate,
        processing: isCreating,
        errors: createErrors,
        reset: resetCreateForm,
    } = useForm({
        fiscal_mode: fiscalMode,
        deposit_account_id: depositAccounts[0]?.id ?? '',
        source_account_id: sourceAccounts.find((a) => a.code === '3100')?.id ?? sourceAccounts[0]?.id ?? '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payer: '',
        description: '',
        project_id: '',
        attachment: null as File | null,
    });

    // Preset quick accounts
    const quickPresets = useMemo(() => {
        return [
            { label: 'Setoran Modal Pemilik', code: '3100', defaultDesc: 'Setoran modal dari pemilik' },
            { label: 'Pinjaman / Talangan Owner', code: '2119', defaultDesc: 'Pinjaman sementara operasional dari owner' },
            { label: 'Saldo Awal Migrasi', code: '3900', defaultDesc: 'Saldo awal kas migrasi sistem' },
            { label: 'Pendapatan Bunga Bank', code: '4990', defaultDesc: 'Pendapatan bunga giro & jasa bank' },
            { label: 'Pendapatan Pembulatan', code: '4910', defaultDesc: 'Pendapatan selisih pembulatan transaksi' },
        ];
    }, []);

    const handleApplyPreset = (code: string, defaultDesc: string) => {
        const found = sourceAccounts.find((a) => a.code === code);
        if (found) {
            setFormData((prev) => ({
                ...prev,
                source_account_id: found.id,
                description: prev.description || defaultDesc,
            }));
        }
    };

    const handleFilterChange = (params: Record<string, string>) => {
        const current = new URLSearchParams(window.location.search);
        Object.entries(params).forEach(([key, val]) => {
            if (val === '' || val === 'all') {
                current.delete(key);
            } else {
                current.set(key, val);
            }
        });
        router.get(window.location.pathname, Object.fromEntries(current), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleMonthChange = (val: string, year: string, month: string) => {
        if (val === 'all') {
            handleFilterChange({ month: 'all', year: 'all' });
        } else {
            handleFilterChange({ month, year });
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate(route('cash-in.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreateForm();
                setToastType('success');
                setToastMessage('Penerimaan kas berhasil dicatat dan jurnal telah dibukukan.');
            },
            onError: (errs) => {
                setToastType('error');
                setToastMessage(Object.values(errs)[0] ?? 'Gagal menyimpan transaksi kas masuk.');
            },
        });
    };

    const handleVoidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!voidTarget || !voidReason.trim()) return;

        setIsVoiding(true);
        router.post(
            route('cash-in.void', { cashInTransaction: voidTarget.id }),
            { void_reason: voidReason },
            {
                onSuccess: () => {
                    setIsVoidModalOpen(false);
                    setVoidTarget(null);
                    setVoidReason('');
                    setIsVoiding(false);
                    setToastType('success');
                    setToastMessage('Transaksi kas masuk berhasil dibatalkan dan jurnal pembalik telah dibukukan.');
                },
                onError: (errs) => {
                    setIsVoiding(false);
                    setToastType('error');
                    setToastMessage(Object.values(errs)[0] ?? 'Gagal membatalkan transaksi.');
                },
            },
        );
    };

    return (
        <AppLayout
            activePage="cash-in"
            title="Penerimaan Kas"
            breadcrumbs={[
                { label: 'Dashboard', href: route('overview') },
                { label: 'Penerimaan Kas' },
            ]}
        >
            <Head title="Penerimaan Kas Non-Invoice" />

            <Toast
                show={Boolean(toastMessage)}
                message={toastMessage || ''}
                type={toastType}
                onClose={() => setToastMessage(null)}
            />

            <div className="w-full space-y-6 pb-12">
                {/* ───────────────────────────────────────────────────────────── */}
                {/* 1. Header & Quick Action Bar */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-slate-900">
                                Penerimaan Kas
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border leading-none ${
                                    fiscalMode === 'ppn'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                Mode {fiscalMode.toUpperCase()}
                            </span>
                            {isPeriodLocked && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border leading-none bg-rose-50 text-rose-700 border-rose-200">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Periode Terkunci
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                            Pencatatan kas masuk non-invoice seperti setoran modal awal dari owner, pinjaman/talangan, bunga bank, dan saldo awal migrasi sistem.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SecondaryButton
                            onClick={() => setIsAuditModalOpen(true)}
                            className="!py-2.5 !px-3.5 !text-xs !rounded-xl"
                        >
                            <svg className="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Audit Log
                        </SecondaryButton>

                        <a
                            href={route('cash-in.export', Object.fromEntries(new URLSearchParams(window.location.search)))}
                            className="inline-flex items-center justify-center"
                        >
                            <ExcelButton />
                        </a>

                        <PrimaryButton
                            onClick={() => {
                                if (isPeriodLocked) {
                                    alert('Periode akuntansi ini telah ditutup/dikunci. Tidak dapat mencatat transaksi baru.');
                                    return;
                                }
                                setIsCreateModalOpen(true);
                            }}
                            className="shadow-neon-primary hover:shadow-neon-primary-lg"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Catat Kas Masuk
                        </PrimaryButton>
                    </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 2. Executive Metric Cards */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Total Penerimaan Kas */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Total Kas Masuk Periode Ini
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black font-mono tracking-tight text-emerald-600">
                                {formatRupiah(metrics.total_inflow)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                                Total arus kas masuk non-invoice aktif
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Setoran Modal Owner */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Setoran Modal / Ekuitas
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black font-mono tracking-tight text-blue-600">
                                {formatRupiah(metrics.capital_deposit_total)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                                Modal Disetor & Saldo Awal (Akun 3xxx)
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Pemasukan Lain-lain */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Pemasukan Non-Operasional
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black font-mono tracking-tight text-purple-600">
                                {formatRupiah(metrics.other_inflow_total)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                                Pinjaman, bunga bank & lainnya
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Total Saldo Kas & Bank */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                Saldo Kas & Bank Terkini
                            </span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-2xl font-black font-mono tracking-tight text-slate-900">
                                {formatRupiah(metrics.total_cash_balance)}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                                Real-time saldo gabungan rekening
                            </p>
                        </div>
                    </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 3. Saldo Rekening Kas & Bank Ringkas */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {depositAccounts.map((acc) => (
                        <div
                            key={acc.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">
                                    {acc.friendly_name ?? acc.name}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                    {acc.code}
                                </span>
                            </div>
                            <p className="text-base font-black font-mono tracking-tight text-slate-900 mt-2">
                                {formatRupiah(acc.current_balance ?? 0)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 4. Filter Panel Bar */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:items-end">
                        {/* Search Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Cari Transaksi
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleFilterChange({ search });
                                        }
                                    }}
                                    placeholder="No. transaksi, penyetor, memo..."
                                    className="w-full h-10 px-3.5 pl-9 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400"
                                />
                                <svg
                                    className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Rekening Penerima */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Rekening Penerima
                            </label>
                            <SelectInput
                                value={selectedDepositAcc}
                                onChange={(e) => {
                                    setSelectedDepositAcc(e.target.value);
                                    handleFilterChange({ deposit_account_id: e.target.value });
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Rekening Kas / Bank' },
                                    ...depositAccounts.map((acc) => ({
                                        value: acc.id,
                                        label: `${acc.code} - ${acc.friendly_name ?? acc.name}`,
                                    })),
                                ]}
                            />
                        </div>

                        {/* Filter Sumber Dana */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Sumber Dana / Kategori
                            </label>
                            <SelectInput
                                value={selectedSourceAcc}
                                onChange={(e) => {
                                    setSelectedSourceAcc(e.target.value);
                                    handleFilterChange({ source_account_id: e.target.value });
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Sumber Dana' },
                                    ...sourceAccounts.map((acc) => ({
                                        value: acc.id,
                                        label: `${acc.code} - ${acc.name}`,
                                    })),
                                ]}
                            />
                        </div>

                        {/* Filter Bulan / Tahun */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Periode Transaksi
                            </label>
                            <MonthPicker
                                value={monthPickerVal}
                                onChange={handleMonthChange}
                                allowAll={true}
                                allLabel="Semua Periode"
                            />
                        </div>
                    </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* 5. Data Table Transaksi Kas Masuk */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Tanggal & No. Transaksi
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Rekening Penerima
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Sumber Dana / Kategori
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Penyetor / Sumber
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Keterangan
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                                        Nominal Masuk (Rp)
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12">
                                            <EmptyState
                                                title="Belum Ada Transaksi Kas Masuk"
                                                description="Belum ada transaksi penerimaan kas yang tercatat pada periode dan filter yang dipilih."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.data.map((tx) => {
                                        const isVoid = tx.status === 'voided';
                                        return (
                                            <tr
                                                key={tx.id}
                                                className={`hover:bg-slate-50/50 transition-colors ${
                                                    isVoid ? 'bg-slate-50/70 opacity-60' : ''
                                                }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-xs text-slate-900">
                                                        {tx.transaction_number}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-400">
                                                        {formatDate(tx.transaction_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-slate-800">
                                                        {tx.deposit_account?.name ?? '-'}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-400">
                                                        {tx.deposit_account?.code ?? ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                                        {tx.source_account ? `${tx.source_account.code} - ${tx.source_account.name}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                                    {tx.payer || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate" title={tx.description}>
                                                    {tx.description}
                                                    {tx.attachment_path && (
                                                        <span className="ml-1 text-[10px] font-bold text-blue-600 hover:underline">
                                                            [Lampiran]
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-xs text-emerald-600">
                                                    +{formatRupiah(tx.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isVoid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-200 bg-rose-50 text-rose-700">
                                                            Dibatalkan
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                            Aktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <ActionDropdown
                                                        items={[
                                                            {
                                                                label: 'Lihat Detail & Jurnal',
                                                                icon: (
                                                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                ),
                                                                onClick: () => {
                                                                    setSelectedTransaction(tx);
                                                                    setIsDetailModalOpen(true);
                                                                },
                                                            },
                                                            ...(isVoid
                                                                ? []
                                                                : [
                                                                      {
                                                                          label: 'Batalkan Transaksi (Void)',
                                                                          variant: 'danger' as const,
                                                                          icon: (
                                                                              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                              </svg>
                                                                          ),
                                                                          onClick: () => {
                                                                              if (isPeriodLocked) {
                                                                                  alert('Periode transaksi ini telah ditutup/dikunci.');
                                                                                  return;
                                                                              }
                                                                              setVoidTarget(tx);
                                                                              setVoidReason('');
                                                                              setIsVoidModalOpen(true);
                                                                          },
                                                                      },
                                                                  ]),
                                                        ]}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {transactions.total > 0 && (
                        <Pagination
                            currentPage={transactions.current_page}
                            totalPages={transactions.last_page}
                            totalItems={transactions.total}
                            itemsPerPage={transactions.per_page}
                            onPageChange={(page) => handleFilterChange({ page: String(page) })}
                        />
                    )}
                </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 6. Modal Catat Kas Masuk (CreateCashInModal) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                maxWidth="xl"
            >
                <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                Catat Penerimaan Kas Non-Invoice
                            </h3>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">
                                Setoran modal pemilik, pinjaman/talangan, bunga bank, atau saldo awal
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Quick Presets Chips */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">
                            Pilih Cepat Kategori / Sumber:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {quickPresets.map((p) => (
                                <button
                                    key={p.code}
                                    type="button"
                                    onClick={() => handleApplyPreset(p.code, p.defaultDesc)}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-slate-600"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rekening Kas / Bank Penerima */}
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Rekening Penerima (Kas / Bank) <span className="text-rose-500">*</span>
                            </label>
                            <SelectInput
                                value={formData.deposit_account_id}
                                onChange={(e) => setFormData('deposit_account_id', e.target.value)}
                                options={depositAccounts.map((acc) => ({
                                    value: acc.id,
                                    label: `${acc.code} - ${acc.friendly_name ?? acc.name} (Saldo: ${formatRupiah(acc.current_balance ?? 0)})`,
                                }))}
                            />
                            {createErrors.deposit_account_id && (
                                <p className="text-[11px] font-bold text-rose-500 mt-1">
                                    {createErrors.deposit_account_id}
                                </p>
                            )}
                        </div>

                        {/* Akun Sumber Dana */}
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Akun Sumber Dana / Lawan Kredit <span className="text-rose-500">*</span>
                            </label>
                            <SelectInput
                                value={formData.source_account_id}
                                onChange={(e) => setFormData('source_account_id', e.target.value)}
                                options={sourceAccounts.map((acc) => ({
                                    value: acc.id,
                                    label: `${acc.code} - ${acc.name} (${acc.type.toUpperCase()})`,
                                }))}
                            />
                            {createErrors.source_account_id && (
                                <p className="text-[11px] font-bold text-rose-500 mt-1">
                                    {createErrors.source_account_id}
                                </p>
                            )}
                        </div>

                        {/* Nominal (Rp) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">
                                Nominal Uang Masuk (Rp) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="any"
                                value={formData.amount}
                                onChange={(e) => setFormData('amount', e.target.value)}
                                placeholder="0"
                                required
                                className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            />
                            {formData.amount && (
                                <p className="text-[11px] font-mono font-bold text-emerald-600">
                                    {formatRupiah(formData.amount)}
                                </p>
                            )}
                            {createErrors.amount && (
                                <p className="text-[11px] font-bold text-rose-500 mt-1">
                                    {createErrors.amount}
                                </p>
                            )}
                        </div>

                        {/* Tanggal Transaksi */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">
                                Tanggal Penerimaan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.transaction_date}
                                onChange={(e) => setFormData('transaction_date', e.target.value)}
                                required
                                className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            />
                            {createErrors.transaction_date && (
                                <p className="text-[11px] font-bold text-rose-500 mt-1">
                                    {createErrors.transaction_date}
                                </p>
                            )}
                        </div>

                        {/* Penyetor / Sumber Dana */}
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Nama Penyetor / Pengirim Uang (Opsional)
                            </label>
                            <input
                                type="text"
                                value={formData.payer}
                                onChange={(e) => setFormData('payer', e.target.value)}
                                placeholder="Contoh: Owner - Bapak Jojo / Bank BCA"
                                className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
                            />
                        </div>

                        {/* Keterangan / Deskripsi */}
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Keterangan / Memo <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData('description', e.target.value)}
                                rows={2}
                                placeholder="Contoh: Setoran modal awal untuk operasional kantor dan persiapan sewa titik reklame"
                                required
                                className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 resize-none"
                            />
                            {createErrors.description && (
                                <p className="text-[11px] font-bold text-rose-500 mt-1">
                                    {createErrors.description}
                                </p>
                            )}
                        </div>

                        {/* Upload Bukti Transfer */}
                        <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Bukti Transfer / Slip Setoran (Opsional)
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData('attachment', e.target.files[0]);
                                    }
                                }}
                                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            disabled={isCreating}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={isCreating}>
                            {isCreating ? 'Menyimpan...' : 'Simpan Penerimaan Kas'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 7. Modal Detail & Jurnal (DetailModal) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Modal
                show={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                maxWidth="xl"
            >
                {selectedTransaction && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Detail Penerimaan Kas [{selectedTransaction.transaction_number}]
                                </h3>
                                <p className="text-xs font-semibold text-slate-400">
                                    Tanggal: {formatDate(selectedTransaction.transaction_date)} • Mode: {selectedTransaction.fiscal_mode.toUpperCase()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Rekening Penerima
                                </span>
                                <span className="font-bold text-slate-900 mt-1 block">
                                    {selectedTransaction.deposit_account?.name ?? '-'} ({selectedTransaction.deposit_account?.code})
                                </span>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Sumber Dana
                                </span>
                                <span className="font-bold text-slate-900 mt-1 block">
                                    {selectedTransaction.source_account?.name ?? '-'} ({selectedTransaction.source_account?.code})
                                </span>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Penyetor / Sumber
                                </span>
                                <span className="font-bold text-slate-900 mt-1 block">
                                    {selectedTransaction.payer || '-'}
                                </span>
                            </div>

                            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                                    Nominal Diterima
                                </span>
                                <span className="font-black font-mono text-sm text-emerald-700 mt-1 block">
                                    {formatRupiah(selectedTransaction.amount)}
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Keterangan / Memo
                            </span>
                            <p className="text-xs font-semibold text-slate-800 mt-1">
                                {selectedTransaction.description}
                            </p>
                        </div>

                        {/* Lampiran */}
                        {selectedTransaction.attachment_url && (
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-700">
                                        {selectedTransaction.attachment_name || 'Bukti Transfer'}
                                    </span>
                                </div>
                                <a
                                    href={selectedTransaction.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 text-xs font-bold bg-white rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-all"
                                >
                                    Buka File
                                </a>
                            </div>
                        )}

                        {/* Jurnal Akuntansi */}
                        {selectedTransaction.journal_entry && (
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">
                                        Entri Jurnal Buku Besar [{selectedTransaction.journal_entry.number}]
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-slate-400">
                                        Double-Entry Balanced
                                    </span>
                                </div>
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                                            <th className="px-4 py-2 text-left">Akun COA</th>
                                            <th className="px-4 py-2 text-right">Debet (Rp)</th>
                                            <th className="px-4 py-2 text-right">Kredit (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedTransaction.journal_entry.items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2">
                                                    <span className="font-mono font-bold text-slate-700 mr-2">
                                                        {item.account?.code}
                                                    </span>
                                                    <span className="font-semibold text-slate-900">
                                                        {item.account?.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                                                    {parseFloat(String(item.debit)) > 0
                                                        ? formatRupiah(item.debit)
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">
                                                    {parseFloat(String(item.credit)) > 0
                                                        ? formatRupiah(item.credit)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <SecondaryButton onClick={() => setIsDetailModalOpen(false)}>
                                Tutup
                            </SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 8. Modal Pembatalan Transaksi (VoidModal) */}
            {/* ───────────────────────────────────────────────────────────── */}
            <Modal
                show={isVoidModalOpen}
                onClose={() => setIsVoidModalOpen(false)}
                maxWidth="md"
            >
                {voidTarget && (
                    <form onSubmit={handleVoidSubmit} className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">
                                    Batalkan Transaksi Kas Masuk?
                                </h3>
                                <p className="text-xs font-semibold text-slate-400">
                                    {voidTarget.transaction_number} • {formatRupiah(voidTarget.amount)}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600">
                            Membatalkan transaksi ini akan secara otomatis menerbitkan <strong>Jurnal Pembalik (Reversing Entry)</strong> untuk memulihkan saldo akun kas/bank dan akun sumber dana ke posisi semula.
                        </p>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">
                                Alasan Pembatalan <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                rows={3}
                                placeholder="Tuliskan alasan pembatalan transaksi secara rinci..."
                                required
                                className="w-full p-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-500 text-slate-900 resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <SecondaryButton
                                type="button"
                                onClick={() => setIsVoidModalOpen(false)}
                                disabled={isVoiding}
                            >
                                Batal
                            </SecondaryButton>
                            <button
                                type="submit"
                                disabled={isVoiding || !voidReason.trim()}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-all disabled:opacity-50"
                            >
                                {isVoiding ? 'Memproses...' : 'Konfirmasi Batalkan'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* 9. Modal Audit Log */}
            {/* ───────────────────────────────────────────────────────────── */}
            <AuditLogModal
                show={isAuditModalOpen}
                onClose={() => setIsAuditModalOpen(false)}
                logs={auditLogs}
                title="Audit Log Penerimaan Kas"
            />
        </AppLayout>
    );
}
