import Pagination from '@/Components/Table/Pagination';
import Toast, { ToastType } from '@/Components/UI/Toast';
import Modal from '@/Components/UI/Modal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import type { PageProps as BasePageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

export interface CoaOption {
    id: string;
    code: string;
    name: string;
    friendly_name?: string;
}

export interface ExpenseCategoryOption {
    id: string;
    name: string;
    account_id: string;
    account_code?: string;
    account_name?: string;
}

export interface ProjectOption {
    id: string;
    code: string;
    name: string;
}

export interface CashTransactionItem {
    id: string;
    transaction_number: string;
    fiscal_mode: 'ppn' | 'non-ppn';
    payment_account_id: string;
    expense_account_id: string;
    project_id: string | null;
    amount: number | string;
    transaction_date: string;
    recipient: string | null;
    description: string;
    created_at: string;
    payment_account?: CoaOption;
    expense_account?: CoaOption;
    project?: ProjectOption | null;
    creator?: {
        id: string;
        name: string;
    };
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedTransactions {
    data: CashTransactionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

export interface CashOutPageProps extends BasePageProps {
    transactions: PaginatedTransactions;
    paymentAccounts: CoaOption[];
    expenseCategories: ExpenseCategoryOption[];
    leafExpenseAccounts: CoaOption[];
    projects: ProjectOption[];
    stats: {
        currentMonthTotal: number;
        lastMonthTotal: number;
        totalFiltered: number;
    };
    filters: {
        month: string;
        year: string;
    };
}

const fmt = (n: number | string) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const MONTH_NAMES = [
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

export default function CashOut() {
    const {
        transactions,
        paymentAccounts,
        expenseCategories,
        leafExpenseAccounts,
        projects,
        stats,
        filters,
    } = usePage<CashOutPageProps>().props;

    const fiscalMode = useFiscalMode();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

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
        type: 'success' | 'error' | 'warning',
        title: string,
        message: string,
    ) => {
        setToast({ show: true, type, title, message });
    };

    // Filter local state
    const [selectedMonth, setSelectedMonth] = useState<string>(filters?.month || String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(filters?.year || String(new Date().getFullYear()));

    const handleFilterChange = (m: string, y: string) => {
        setSelectedMonth(m);
        setSelectedYear(y);
        router.get(
            '/cash-out',
            { month: m, year: y, fiscal_mode: fiscalMode },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Sinkronisasi data saat mode fiskal berubah
    React.useEffect(() => {
        router.get(
            '/cash-out',
            { month: selectedMonth, year: selectedYear, fiscal_mode: fiscalMode },
            { preserveState: true, preserveScroll: true, only: ['transactions', 'stats', 'projects'] },
        );
    }, [fiscalMode]);

    // Form Catat Pengeluaran
    const defaultPaymentAcc = paymentAccounts.length > 0 ? paymentAccounts[0].id : '';
    const defaultCategory = expenseCategories.length > 0 ? expenseCategories[0].id : '';

    const form = useForm({
        fiscal_mode: fiscalMode,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_account_id: defaultPaymentAcc,
        expense_category_id: defaultCategory,
        project_id: '',
        amount: '',
        recipient: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/cash-out', {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                form.reset('amount', 'recipient', 'description', 'project_id');
                triggerToast(
                    'success',
                    'Pengeluaran Kas Dicatat',
                    'Transaksi berhasil disimpan dan jurnal akuntansi telah dibukukan.',
                );
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0];
                triggerToast('error', 'Gagal Mencatat Pengeluaran', firstMsg || 'Periksa kembali data formulir.');
            },
        });
    };

    // Form Tambah Kategori Baru
    const categoryForm = useForm({
        name: '',
        account_id: leafExpenseAccounts.length > 0 ? leafExpenseAccounts[0].id : '',
        description: '',
    });

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        categoryForm.post('/cash-out/categories', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddCategoryModalOpen(false);
                categoryForm.reset('name', 'description');
                triggerToast(
                    'success',
                    'Kategori Berhasil Ditambahkan',
                    'Kategori baru telah tersimpan dan terhubung ke akun akuntansi.',
                );
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0];
                triggerToast('error', 'Gagal Menambah Kategori', firstMsg || 'Periksa kembali data formulir.');
            },
        });
    };

    return (
        <AppLayout
            activePage="cash-out"
            title="Pengeluaran Kas"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Pengeluaran Kas' },
            ]}
        >
            <Head title="Pengeluaran Kas" />

            <div className="w-full space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-800">
                            Riwayat Pengeluaran Operasional
                        </h2>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                            Pencatatan pengeluaran kas non-vendor (listrik, gaji, bensin, atk, pemeliharaan titik) · Mode{' '}
                            <span className="font-bold text-primary">{fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Month / Year Filter */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleFilterChange(e.target.value, selectedYear)}
                                className="border-none bg-transparent py-1 pl-2.5 pr-8 text-xs font-semibold text-slate-700 focus:ring-0"
                            >
                                <option value="all">Semua Bulan</option>
                                {MONTH_NAMES.map((m, idx) => (
                                    <option key={idx + 1} value={String(idx + 1)}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => handleFilterChange(selectedMonth, e.target.value)}
                                className="border-none bg-transparent py-1 pl-2.5 pr-8 text-xs font-semibold text-slate-700 focus:ring-0"
                            >
                                <option value="all">Semua Tahun</option>
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={String(y)}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsAddCategoryModalOpen(true)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                        >
                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            + Kategori Baru
                        </button>

                        <button
                            onClick={() => {
                                form.setData('fiscal_mode', fiscalMode);
                                setIsModalOpen(true);
                            }}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:scale-95"
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
                            Catat Pengeluaran
                        </button>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Pengeluaran Bulan Ini
                        </span>
                        <div className="mt-1.5 font-mono text-xl font-black text-slate-900">
                            {fmt(stats?.currentMonthTotal || 0)}
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-slate-400">
                            Bulan lalu: {fmt(stats?.lastMonthTotal || 0)}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Total Pengeluaran Sesuai Filter
                        </span>
                        <div className="mt-1.5 font-mono text-xl font-black text-primary">
                            {fmt(stats?.totalFiltered || 0)}
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-slate-400">
                            {transactions?.total || 0} transaksi tercatat
                        </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Otomasi Jurnal Akuntansi
                        </span>
                        <div className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
                            Mencatat pengeluaran di sini akan <strong>otomatis membukukan jurnal umum</strong>: (Dr) Akun Beban & (Cr) Akun Kas/Bank.
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-xs">
                            <thead className="border-b border-slate-200/80 bg-slate-50/70 font-bold tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">No. Transaksi</th>
                                    <th className="px-5 py-3">Tanggal</th>
                                    <th className="px-5 py-3">Kategori Pengeluaran</th>
                                    <th className="px-5 py-3">Sumber Kas</th>
                                    <th className="px-5 py-3">Penerima / Project</th>
                                    <th className="px-5 py-3">Keterangan</th>
                                    <th className="px-5 py-3 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {(transactions?.data || []).map((t) => (
                                    <tr
                                        key={t.id}
                                        className="transition-colors hover:bg-slate-50/60"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                {t.transaction_number}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {formatDate(t.transaction_date)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500"></span>
                                                <span className="font-semibold text-slate-800">
                                                    {t.expense_account?.name || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                                                <span className="text-slate-700 font-semibold">
                                                    {t.payment_account?.name || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            <div className="space-y-0.5">
                                                {t.recipient && (
                                                    <div className="font-semibold text-slate-800">
                                                        {t.recipient}
                                                    </div>
                                                )}
                                                {t.project && (
                                                    <span className="rounded bg-blue-50 px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-primary">
                                                        {t.project.code}
                                                    </span>
                                                )}
                                                {!t.recipient && !t.project && (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td
                                            className="max-w-[220px] truncate px-5 py-3.5 text-slate-500"
                                            title={t.description}
                                        >
                                            {t.description || '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono text-xs font-black text-slate-900">
                                            {fmt(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {(!transactions?.data || transactions.data.length === 0) && (
                            <div className="py-14 text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">Belum ada data pengeluaran kas.</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">Klik "Catat Pengeluaran" untuk menambahkan transaksi baru.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {transactions?.total > 0 && (
                        <Pagination
                            currentPage={transactions.current_page}
                            totalPages={transactions.last_page}
                            totalItems={transactions.total}
                            itemsPerPage={transactions.per_page}
                            onPageChange={(page) => {
                                router.get(
                                    '/cash-out',
                                    {
                                        page,
                                        month: selectedMonth,
                                        year: selectedYear,
                                        fiscal_mode: fiscalMode,
                                    },
                                    { preserveState: true, preserveScroll: true },
                                );
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Modal Tambah Pengeluaran */}
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-sm font-black tracking-tight text-slate-900">
                                Catat Pengeluaran Kas Operasional
                            </h3>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                Mode: <strong className="text-primary uppercase">{fiscalMode}</strong>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Tanggal Transaksi <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={form.data.transaction_date}
                                onChange={(e) =>
                                    form.setData('transaction_date', e.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            />
                            {form.errors.transaction_date && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{form.errors.transaction_date}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Sumber Kas / Rekening <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={form.data.payment_account_id}
                                onChange={(e) =>
                                    form.setData('payment_account_id', e.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            >
                                {paymentAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.friendly_name || acc.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.payment_account_id && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{form.errors.payment_account_id}</p>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="font-bold text-slate-700">
                                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddCategoryModalOpen(true);
                                    }}
                                    className="text-[10.5px] font-bold text-primary hover:underline"
                                >
                                    + Tambah Kategori
                                </button>
                            </div>
                            <select
                                required
                                value={form.data.expense_category_id}
                                onChange={(e) =>
                                    form.setData('expense_category_id', e.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            >
                                {expenseCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.expense_category_id && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{form.errors.expense_category_id}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block font-bold text-slate-700">
                                    Nominal Pengeluaran (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 font-mono text-xs font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={
                                            form.data.amount
                                                ? Number(form.data.amount).toLocaleString('id-ID')
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const rawVal = e.target.value.replace(/\D/g, '');
                                            form.setData('amount', rawVal);
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 font-mono text-xs font-bold text-slate-900 focus:border-primary focus:ring-primary"
                                    />
                                </div>
                                {form.errors.amount && (
                                    <p className="mt-1 text-[10px] text-rose-500 font-semibold">{form.errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block font-bold text-slate-700">
                                    Penerima Dana (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={form.data.recipient}
                                    onChange={(e) =>
                                        form.setData('recipient', e.target.value)
                                    }
                                    placeholder="Contoh: Toko Listrik / Budi"
                                    className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Tagging Proyek (Opsional)
                            </label>
                            <select
                                value={form.data.project_id}
                                onChange={(e) =>
                                    form.setData('project_id', e.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                            >
                                <option value="">-- Tanpa Proyek (Biaya Umum Kantor) --</option>
                                {projects.map((prj) => (
                                    <option key={prj.id} value={prj.id}>
                                        {prj.code} - {prj.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Keterangan / Memo <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                required
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Contoh: Pembelian token listrik videotron simpang lima..."
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                            ></textarea>
                            {form.errors.description && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{form.errors.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                        >
                            {form.processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Tambah Kategori Baru */}
            <Modal
                show={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={handleCategorySubmit} className="p-6">
                    <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-sm font-black tracking-tight text-slate-900">
                                Tambah Kategori Pengeluaran Baru
                            </h3>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                Kategori baru akan otomatis dipetakan ke akun jurnal akuntansi terkait
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddCategoryModalOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4 text-xs">
                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Nama Kategori (Bahasa Operasional) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={categoryForm.data.name}
                                onChange={(e) => categoryForm.setData('name', e.target.value)}
                                placeholder="Contoh: Konsumsi Tamu / Rapat Kantor"
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            />
                            {categoryForm.errors.name && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{categoryForm.errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Akun Akuntansi / COA Terkait (Debet Jurnal) <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={categoryForm.data.account_id}
                                onChange={(e) => categoryForm.setData('account_id', e.target.value)}
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            >
                                {leafExpenseAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            {categoryForm.errors.account_id && (
                                <p className="mt-1 text-[10px] text-rose-500 font-semibold">{categoryForm.errors.account_id}</p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                                Setiap pengeluaran dengan kategori ini akan otomatis didebetkan ke akun beban yang dipilih di atas.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Keterangan / Catatan (Opsional)
                            </label>
                            <textarea
                                rows={2}
                                value={categoryForm.data.description}
                                onChange={(e) => categoryForm.setData('description', e.target.value)}
                                placeholder="Keterangan peruntukan kategori..."
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddCategoryModalOpen(false)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={categoryForm.processing}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                        >
                            {categoryForm.processing ? 'Menyimpan...' : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </Modal>

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
