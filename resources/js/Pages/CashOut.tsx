import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import Toast from '@/Components/UI/Toast';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import type { PageProps as BasePageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

export interface CoaOption {
    id: string;
    code: string;
    name: string;
    friendly_name?: string;
    current_balance?: number;
}

export interface ExpenseCategoryOption {
    id: string;
    name: string;
    account_id: string;
    account_code?: string;
    account_name?: string;
}

export interface JournalLineItem {
    id: string;
    account_id: string;
    debit: number | string;
    credit: number | string;
    memo?: string | null;
    account?: CoaOption;
}

export interface JournalEntryData {
    id: string;
    number: string;
    fiscal_mode: 'ppn' | 'non-ppn';
    transaction_date: string;
    description: string;
    items?: JournalLineItem[];
}

export interface CashTransactionItem {
    id: string;
    transaction_number: string;
    fiscal_mode: 'ppn' | 'non-ppn';
    payment_account_id: string;
    expense_account_id: string;
    amount: number | string;
    transaction_date: string;
    recipient: string | null;
    description: string;
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_url?: string | null;
    status?: 'active' | 'voided';
    voided_at?: string | null;
    void_reason?: string | null;
    created_at: string;
    payment_account?: CoaOption;
    expense_account?: CoaOption;
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

export interface AuditLogItem {
    id: string;
    event: string;
    description: string;
    user_name: string;
    created_at: string;
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

export interface TopExpenseCategory {
    account_id: string;
    account_code: string;
    account_name: string;
    total_amount: number;
    tx_count: number;
    percentage: number;
}

export interface CashOutPageProps extends BasePageProps {
    transactions: PaginatedTransactions;
    paymentAccounts: CoaOption[];
    expenseCategories: ExpenseCategoryOption[];
    leafExpenseAccounts: CoaOption[];
    isPeriodLocked?: boolean;
    auditLogs?: AuditLogItem[];
    stats: {
        currentMonthTotal: number;
        lastMonthTotal: number;
        totalFiltered: number;
        topExpenses?: TopExpenseCategory[];
    };
    filters: {
        month: string;
        year: string;
        search?: string;
        payment_account_id?: string;
        expense_category_id?: string;
    };
}

const fmt = (n: number | string) =>
    `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const matchEventBadge = (event: string) => {
    switch (event) {
        case 'created':
            return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        case 'updated':
            return 'bg-amber-100 text-amber-700 border border-amber-200';
        case 'voided':
            return 'bg-rose-100 text-rose-700 border border-rose-200';
        case 'deleted':
            return 'bg-slate-800 text-white';
        default:
            return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
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
        isPeriodLocked = false,
        auditLogs = [],
        stats,
        filters,
    } = usePage<CashOutPageProps>().props;

    const fiscalMode = useFiscalMode();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] =
        useState<CashTransactionItem | null>(null);
    const [editingTransaction, setEditingTransaction] =
        useState<CashTransactionItem | null>(null);
    const [deletingTransaction, setDeletingTransaction] =
        useState<CashTransactionItem | null>(null);
    const [voidingTransaction, setVoidingTransaction] =
        useState<CashTransactionItem | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [isVoidingProcessing, setIsVoidingProcessing] = useState(false);

    // State Modal Audit Log Besar
    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
    const [auditLogSearch, setAuditLogSearch] = useState('');
    const [auditLogEventFilter, setAuditLogEventFilter] = useState('all');
    const [auditLogStartDate, setAuditLogStartDate] = useState('');
    const [auditLogEndDate, setAuditLogEndDate] = useState('');

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
    const [selectedMonth, setSelectedMonth] = useState<string>(
        filters?.month || String(new Date().getMonth() + 1),
    );
    const [selectedYear, setSelectedYear] = useState<string>(
        filters?.year || String(new Date().getFullYear()),
    );
    const [searchQuery, setSearchQuery] = useState<string>(
        filters?.search || '',
    );
    const [selectedPaymentAcc, setSelectedPaymentAcc] = useState<string>(
        filters?.payment_account_id || 'all',
    );
    const [selectedCategory, setSelectedCategory] = useState<string>(
        filters?.expense_category_id || 'all',
    );

    const isInitialMount = React.useRef(true);

    const applyFilters = (overrides?: {
        month?: string;
        year?: string;
        search?: string;
        payment_account_id?: string;
        expense_category_id?: string;
    }) => {
        const m = overrides?.month ?? selectedMonth;
        const y = overrides?.year ?? selectedYear;
        const s = overrides?.search ?? searchQuery;
        const p = overrides?.payment_account_id ?? selectedPaymentAcc;
        const c = overrides?.expense_category_id ?? selectedCategory;

        router.get(
            '/cash-out',
            {
                month: m,
                year: y,
                search: s,
                payment_account_id: p,
                expense_category_id: c,
                fiscal_mode: fiscalMode,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Debounce search otomatis saat user mengetik (jeda 500ms)
    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            applyFilters({ search: searchQuery });
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Sinkronisasi data saat mode fiskal berubah
    React.useEffect(() => {
        router.get(
            '/cash-out',
            {
                month: selectedMonth,
                year: selectedYear,
                search: searchQuery,
                payment_account_id: selectedPaymentAcc,
                expense_category_id: selectedCategory,
                fiscal_mode: fiscalMode,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['transactions', 'stats', 'isPeriodLocked'],
            },
        );
    }, [fiscalMode]);

    // Form Catat & Edit Pengeluaran
    const defaultPaymentAcc =
        paymentAccounts.length > 0 ? paymentAccounts[0].id : '';
    const defaultCategory =
        expenseCategories.length > 0 ? expenseCategories[0].id : '';

    const form = useForm<{
        fiscal_mode: string;
        transaction_date: string;
        payment_account_id: string;
        expense_category_id: string;
        amount: string;
        recipient: string;
        description: string;
        attachment: File | null;
    }>({
        fiscal_mode: fiscalMode,
        transaction_date: new Date().toISOString().split('T')[0],
        payment_account_id: defaultPaymentAcc,
        expense_category_id: defaultCategory,
        amount: '',
        recipient: '',
        description: '',
        attachment: null,
    });

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const openCreateModal = () => {
        setEditingTransaction(null);
        form.setData({
            fiscal_mode: fiscalMode,
            transaction_date: new Date().toISOString().split('T')[0],
            payment_account_id: defaultPaymentAcc,
            expense_category_id: defaultCategory,
            amount: '',
            recipient: '',
            description: '',
            attachment: null,
        });
        form.clearErrors();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsModalOpen(true);
    };

    const openEditModal = (t: CashTransactionItem) => {
        setEditingTransaction(t);
        // Temukan kategori yang sesuai berdasarkan expense_account_id
        const matchedCategory = expenseCategories.find(
            (c) => c.account_id === t.expense_account_id,
        );

        // Format tanggal ke YYYY-MM-DD agar terbaca tepat oleh input type="date"
        let formattedDate = t.transaction_date;
        if (formattedDate) {
            formattedDate = formattedDate.split('T')[0].split(' ')[0];
        } else {
            formattedDate = new Date().toISOString().split('T')[0];
        }

        form.setData({
            fiscal_mode: t.fiscal_mode,
            transaction_date: formattedDate,
            payment_account_id: t.payment_account_id,
            expense_category_id: matchedCategory
                ? matchedCategory.id
                : defaultCategory,
            amount: String(Math.round(Number(t.amount) || 0)),
            recipient: t.recipient || '',
            description: t.description || '',
            attachment: null,
        });
        form.clearErrors();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingTransaction
            ? `/cash-out/${editingTransaction.id}`
            : '/cash-out';

        form.post(url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingTransaction(null);
                form.reset('amount', 'recipient', 'description', 'attachment');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                triggerToast(
                    'success',
                    editingTransaction
                        ? 'Pengeluaran Diperbarui'
                        : 'Pengeluaran Kas Dicatat',
                    editingTransaction
                        ? 'Data transaksi dan jurnal akuntansi telah disesuaikan.'
                        : 'Transaksi berhasil disimpan dan jurnal akuntansi telah dibukukan.',
                );
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0];
                triggerToast(
                    'error',
                    editingTransaction
                        ? 'Gagal Memperbarui Pengeluaran'
                        : 'Gagal Mencatat Pengeluaran',
                    firstMsg || 'Periksa kembali data formulir.',
                );
            },
        });
    };

    const confirmDelete = (t: CashTransactionItem) => {
        setDeletingTransaction(t);
    };

    const handleDelete = () => {
        if (!deletingTransaction) return;

        router.delete(`/cash-out/${deletingTransaction.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingTransaction(null);
                triggerToast(
                    'success',
                    'Transaksi Dihapus',
                    'Data pengeluaran kas dan jurnal umum terkait berhasil dihapus.',
                );
            },
            onError: (errs) => {
                const firstMsg = Object.values(errs)[0];
                triggerToast(
                    'error',
                    'Gagal Menghapus Transaksi',
                    firstMsg || 'Terjadi kesalahan saat menghapus data.',
                );
            },
        });
    };

    const getTransactionActionItems = (
        t: CashTransactionItem,
    ): ActionMenuItem[] => {
        const items: ActionMenuItem[] = [
            {
                label: 'Detail & Jurnal',
                icon: (
                    <svg
                        className="h-4 w-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                ),
                onClick: () => setViewingTransaction(t),
            },
        ];

        if (t.attachment_url) {
            items.push({
                label: 'Buka Foto Nota',
                icon: (
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                ),
                onClick: () => {
                    window.open(t.attachment_url!, '_blank');
                },
            });
        }

        // Aksi Edit, Void & Hapus hanya jika periode belum dikunci
        if (!isPeriodLocked) {
            if (t.status !== 'voided') {
                items.push({
                    label: 'Edit Transaksi',
                    icon: (
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                    ),
                    onClick: () => openEditModal(t),
                });

                items.push({
                    label: 'Batalkan (Void)',
                    icon: (
                        <svg
                            className="h-4 w-4 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                            />
                        </svg>
                    ),
                    onClick: () => {
                        setVoidReason('');
                        setVoidingTransaction(t);
                    },
                });
            }

            items.push({
                label: 'Hapus Transaksi',
                icon: (
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                ),
                variant: 'danger',
                onClick: () => confirmDelete(t),
            });
        }

        return items;
    };

    // Form Tambah Kategori Baru
    const categoryForm = useForm({
        name: '',
        account_id:
            leafExpenseAccounts.length > 0 ? leafExpenseAccounts[0].id : '',
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
                triggerToast(
                    'error',
                    'Gagal Menambah Kategori',
                    firstMsg || 'Periksa kembali data formulir.',
                );
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
                            Pencatatan pengeluaran kas non-vendor (listrik,
                            gaji, bensin, atk, pemeliharaan titik) · Mode{' '}
                            <span className="font-bold text-primary">
                                {fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Tombol Cetak PDF Rekap Kas (DomPDF) */}
                        <a
                            href={`/cash-out-pdf?month=${selectedMonth}&year=${selectedYear}&payment_account_id=${selectedPaymentAcc}&expense_category_id=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&fiscal_mode=${fiscalMode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                            <svg
                                className="h-4 w-4 text-rose-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            <span>Cetak PDF</span>
                        </a>

                        {/* Tombol Export Excel */}
                        <a
                            href={`/cash-out-export?month=${selectedMonth}&year=${selectedYear}&payment_account_id=${selectedPaymentAcc}&expense_category_id=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&fiscal_mode=${fiscalMode}`}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
                        >
                            <svg
                                className="h-4 w-4 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Export Excel</span>
                        </a>

                        <button
                            type="button"
                            disabled={isPeriodLocked}
                            onClick={() => setIsAddCategoryModalOpen(true)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <svg
                                className="h-4 w-4 text-slate-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Kategori Baru
                        </button>

                        <button
                            disabled={isPeriodLocked}
                            onClick={openCreateModal}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        >
                            {isPeriodLocked ? (
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            ) : (
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
                            )}
                            {isPeriodLocked
                                ? 'Buku Terkunci'
                                : 'Catat Pengeluaran'}
                        </button>
                    </div>
                </div>

                {/* Banner Periode Ditutup / Terkunci */}
                {isPeriodLocked && (
                    <div className="shadow-2xs flex items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/60 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
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
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-amber-900">
                                    Periode Akuntansi Ini Telah Ditutup &
                                    Dikunci (Locked)
                                </h4>
                                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-amber-700">
                                    Seluruh transaksi pada bulan ini bersifat{' '}
                                    <strong>read-only</strong>. Tidak dapat
                                    menambah, mengubah, atau menghapus data
                                    kecuali gembok periode dibuka oleh
                                    Owner/Pimpinan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metric Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-5">
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

                    <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-5">
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

                    <div className="shadow-2xs rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            Otomasi Jurnal Akuntansi
                        </span>
                        <div className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
                            Mencatat pengeluaran di sini akan{' '}
                            <strong>otomatis membukukan jurnal umum</strong>:
                            (Dr) Akun Beban & (Cr) Akun Kas/Bank.
                        </div>
                    </div>
                </div>

                {/* Mini-Cards: Real-Time Cash & Bank Balances (Kas Alert) */}
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Sisa Saldo Kas & Bank Berjalan (
                            {fiscalMode === 'ppn' ? 'Mode PPN' : 'Mode Non-PPN'}
                            )
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-400">
                            Real-time dari Buku Besar Jurnal
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {paymentAccounts.map((acc) => {
                            const bal = acc.current_balance ?? 0;
                            const isCash =
                                acc.code === '1111' ||
                                acc.name.toLowerCase().includes('tunai') ||
                                acc.name.toLowerCase().includes('kecil');
                            const isLowBalance = isCash && bal < 500000;
                            const isNegative = bal < 0;

                            return (
                                <div
                                    key={acc.id}
                                    className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                                        isNegative
                                            ? 'border-rose-300 bg-rose-50/50'
                                            : isLowBalance
                                              ? 'border-amber-300 bg-amber-50/50'
                                              : 'border-slate-200/90 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`h-2 w-2 rounded-full ${
                                                    isNegative
                                                        ? 'animate-pulse bg-rose-500'
                                                        : isLowBalance
                                                          ? 'animate-pulse bg-amber-500'
                                                          : 'bg-emerald-500'
                                                }`}
                                            ></span>
                                            <span className="text-[11px] font-bold text-slate-700">
                                                {acc.friendly_name || acc.name}
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10px] font-bold text-slate-400">
                                            {acc.code}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex items-baseline justify-between">
                                        <div
                                            className={`font-mono text-base font-black ${
                                                isNegative
                                                    ? 'text-rose-600'
                                                    : isLowBalance
                                                      ? 'text-amber-700'
                                                      : 'text-slate-900'
                                            }`}
                                        >
                                            {fmt(bal)}
                                        </div>
                                    </div>

                                    {isNegative && (
                                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600">
                                            <span>
                                                ⚠️ Saldo Minus (Perlu Koreksi)
                                            </span>
                                        </div>
                                    )}

                                    {isLowBalance && !isNegative && (
                                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                                            <span>
                                                ⚠️ Kas Menipis (&lt; 500rb)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="shadow-2xs flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                        {/* Month Filter */}
                        <div className="min-w-[130px]">
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    applyFilters({ month: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                            >
                                <option value="all">Semua Bulan</option>
                                {MONTH_NAMES.map((m, idx) => (
                                    <option
                                        key={idx + 1}
                                        value={String(idx + 1)}
                                    >
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Year Filter */}
                        <div className="min-w-[110px]">
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    applyFilters({ year: e.target.value });
                                }}
                                className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                            >
                                <option value="all">Semua Tahun</option>
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={String(y)}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown Filter Sumber Kas */}
                        <div className="min-w-[160px]">
                            <select
                                value={selectedPaymentAcc}
                                onChange={(e) => {
                                    setSelectedPaymentAcc(e.target.value);
                                    applyFilters({
                                        payment_account_id: e.target.value,
                                    });
                                }}
                                className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                            >
                                <option value="all">Semua Sumber Kas</option>
                                {paymentAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.friendly_name || acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown Filter Kategori Pengeluaran */}
                        <div className="min-w-[160px]">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilters({
                                        expense_category_id: e.target.value,
                                    });
                                }}
                                className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                            >
                                <option value="all">Semua Kategori</option>
                                {expenseCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                }}
                                placeholder="Cari no. transaksi, penerima, memo..."
                                className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-primary"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                    }}
                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                                >
                                    <svg
                                        className="h-4 w-4"
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
                            )}
                        </div>
                    </div>

                    {/* Tombol Reset (Hanya muncul jika ada filter non-default) */}
                    {(searchQuery ||
                        selectedMonth !== String(new Date().getMonth() + 1) ||
                        selectedYear !== String(new Date().getFullYear()) ||
                        selectedPaymentAcc !== 'all' ||
                        selectedCategory !== 'all') && (
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const currM = String(
                                        new Date().getMonth() + 1,
                                    );
                                    const currY = String(
                                        new Date().getFullYear(),
                                    );
                                    setSearchQuery('');
                                    setSelectedMonth(currM);
                                    setSelectedYear(currY);
                                    setSelectedPaymentAcc('all');
                                    setSelectedCategory('all');
                                    applyFilters({
                                        search: '',
                                        month: currM,
                                        year: currY,
                                        payment_account_id: 'all',
                                        expense_category_id: 'all',
                                    });
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Reset Filter
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-xs">
                            <thead className="border-b border-slate-200/80 bg-slate-50/70 font-bold tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">No. Transaksi</th>
                                    <th className="px-5 py-3">Tanggal</th>
                                    <th className="px-5 py-3">
                                        Kategori Pengeluaran
                                    </th>
                                    <th className="px-5 py-3">Sumber Kas</th>
                                    <th className="px-5 py-3">Penerima</th>
                                    <th className="px-5 py-3">Keterangan</th>
                                    <th className="px-5 py-3 text-center">
                                        Bukti
                                    </th>
                                    <th className="px-5 py-3 text-right">
                                        Nominal
                                    </th>
                                    <th className="px-5 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {(transactions?.data || []).map((t) => {
                                    const isVoided = t.status === 'voided';

                                    return (
                                        <tr
                                            key={t.id}
                                            className={`transition-colors ${
                                                isVoided
                                                    ? 'bg-rose-50/40 text-slate-400'
                                                    : 'hover:bg-slate-50/60'
                                            }`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                                                            isVoided
                                                                ? 'border-rose-200 bg-rose-100 text-rose-700 line-through'
                                                                : 'border-slate-200 bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {t.transaction_number}
                                                    </span>
                                                    {isVoided && (
                                                        <span className="rounded bg-rose-500 px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                                                            VOID
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td
                                                className={`px-5 py-3.5 ${isVoided ? 'text-slate-400 line-through' : 'text-slate-600'}`}
                                            >
                                                {formatDate(t.transaction_date)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isVoided ? 'bg-slate-300' : 'bg-rose-500'}`}
                                                    ></span>
                                                    <span
                                                        className={`font-semibold ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                                    >
                                                        {t.expense_account
                                                            ?.name || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isVoided ? 'bg-slate-300' : 'bg-emerald-500'}`}
                                                    ></span>
                                                    <span
                                                        className={`font-semibold ${isVoided ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                                    >
                                                        {t.payment_account
                                                            ?.name || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {t.recipient ? (
                                                    <div
                                                        className={`font-semibold ${isVoided ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                                    >
                                                        {t.recipient}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className={`max-w-[220px] truncate px-5 py-3.5 ${isVoided ? 'text-slate-400 line-through' : 'text-slate-500'}`}
                                                title={
                                                    isVoided
                                                        ? `DIBATALKAN (VOID): ${t.void_reason || '-'}`
                                                        : t.description
                                                }
                                            >
                                                {isVoided
                                                    ? `[VOID: ${t.void_reason || '-'}]`
                                                    : t.description || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {t.attachment_url ? (
                                                    <a
                                                        href={t.attachment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={
                                                            t.attachment_name ||
                                                            'Lihat Bukti Nota'
                                                        }
                                                        className="hover:bg-primary/5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-primary transition-all hover:border-primary"
                                                    >
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                            />
                                                        </svg>
                                                        <span>Nota</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className={`px-5 py-3.5 text-right font-mono text-xs font-black ${
                                                    isVoided
                                                        ? 'text-slate-400 line-through'
                                                        : 'text-slate-900'
                                                }`}
                                            >
                                                {fmt(t.amount)}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <ActionDropdown
                                                    items={getTransactionActionItems(
                                                        t,
                                                    )}
                                                    align="right"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {transactions?.data &&
                                transactions.data.length > 0 && (
                                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-bold text-slate-800">
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-5 py-3.5 text-right text-[11px] uppercase tracking-wider text-slate-600"
                                            >
                                                Total Pengeluaran (Halaman Ini)
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono text-xs font-black text-rose-600">
                                                {fmt(
                                                    transactions.data.reduce(
                                                        (acc, item) =>
                                                            acc +
                                                            (Number(
                                                                item.amount,
                                                            ) || 0),
                                                        0,
                                                    ),
                                                )}
                                            </td>
                                            <td></td>
                                        </tr>
                                        {transactions.last_page > 1 && (
                                            <tr className="border-t border-slate-200/60 bg-slate-100/60">
                                                <td
                                                    colSpan={7}
                                                    className="px-5 py-2.5 text-right text-[10px] uppercase tracking-wider text-slate-500"
                                                >
                                                    Total Keseluruhan (Sesuai
                                                    Filter ·{' '}
                                                    {transactions.total}{' '}
                                                    Transaksi)
                                                </td>
                                                <td className="px-5 py-2.5 text-right font-mono text-xs font-black text-slate-900">
                                                    {fmt(
                                                        stats?.totalFiltered ||
                                                            0,
                                                    )}
                                                </td>
                                                <td></td>
                                            </tr>
                                        )}
                                    </tfoot>
                                )}
                        </table>

                        {(!transactions?.data ||
                            transactions.data.length === 0) && (
                            <div className="py-14 text-center">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Belum ada data pengeluaran kas.
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Klik "Catat Pengeluaran" untuk menambahkan
                                    transaksi baru.
                                </p>
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
                                        search: searchQuery,
                                        payment_account_id: selectedPaymentAcc,
                                        expense_category_id: selectedCategory,
                                        fiscal_mode: fiscalMode,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                );
                            }}
                        />
                    )}
                </div>

                {/* Baris Bawah: Widget Top Kategori Pengeluaran & Live Audit Log (Berdampingan) */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                    {/* Kolom Kiri (7 Kolom): Top 5 Kategori Pengeluaran */}
                    <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-7">
                        <div className="mb-3.5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                    📊 Distribusi & Top Kategori Pengeluaran
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Proporsi alokasi dana operasional (Sesuai
                                    Filter)
                                </p>
                            </div>
                            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10.5px] font-bold text-slate-600">
                                Total: {fmt(stats?.totalFiltered || 0)}
                            </span>
                        </div>

                        {stats?.topExpenses && stats.topExpenses.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {stats.topExpenses.map((cat, idx) => {
                                    const colors = [
                                        'bg-primary',
                                        'bg-amber-500',
                                        'bg-indigo-500',
                                        'bg-rose-500',
                                        'bg-emerald-500',
                                    ];
                                    const barColor =
                                        colors[idx % colors.length];

                                    return (
                                        <div
                                            key={cat.account_id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span
                                                    className="truncate pr-2 font-bold text-slate-800"
                                                    title={cat.account_name}
                                                >
                                                    {cat.account_name}
                                                </span>
                                                <span className="font-mono font-black text-slate-900">
                                                    {cat.percentage}%
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className={`h-full ${barColor} transition-all duration-500`}
                                                    style={{
                                                        width: `${cat.percentage}%`,
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-500">
                                                <span className="font-mono">
                                                    {cat.tx_count} transaksi
                                                </span>
                                                <span className="font-mono font-bold text-slate-700">
                                                    {fmt(cat.total_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                Belum ada data pengeluaran pada filter ini.
                            </div>
                        )}
                    </div>

                    {/* Kolom Kanan (5 Kolom): Live Audit Trail Activity Logs */}
                    <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-5 lg:col-span-5">
                        <div className="mb-3.5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                    🛡️ Jejak Audit Keamanan (Audit Log)
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Log aktivitas input, edit, void & hapus
                                    transaksi
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setAuditLogSearch('');
                                    setAuditLogEventFilter('all');
                                    setIsAuditLogModalOpen(true);
                                }}
                                className="hover:bg-primary/5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-primary transition-all hover:border-primary"
                            >
                                <span>Lihat Semua</span>
                                <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </button>
                        </div>

                        {auditLogs && auditLogs.length > 0 ? (
                            <div className="max-h-[260px] space-y-2.5 overflow-y-auto pr-1">
                                {auditLogs.slice(0, 6).map((log) => {
                                    const isVoid = log.event === 'voided';
                                    return (
                                        <div
                                            key={log.id}
                                            className={`rounded-xl border p-2.5 text-xs transition-all ${
                                                isVoid
                                                    ? 'border-amber-200 bg-amber-50/40'
                                                    : 'border-slate-100 bg-slate-50/60'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-black uppercase ${
                                                        isVoid
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                                >
                                                    {log.event}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {log.created_at
                                                        ? new Date(
                                                              log.created_at,
                                                          ).toLocaleTimeString(
                                                              'id-ID',
                                                              {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              },
                                                          )
                                                        : '-'}{' '}
                                                    WIB
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11px] font-medium leading-tight text-slate-700">
                                                {log.description}
                                            </p>
                                            <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                                Oleh:{' '}
                                                <span className="text-slate-600">
                                                    {log.user_name}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                Belum ada riwayat audit log tercatat.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah / Edit Pengeluaran */}
            <Modal
                show={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                }}
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-sm font-black tracking-tight text-slate-900">
                                {editingTransaction
                                    ? `Edit Pengeluaran Kas (${editingTransaction.transaction_number})`
                                    : 'Catat Pengeluaran Kas Operasional'}
                            </h3>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                Mode:{' '}
                                <strong className="uppercase text-primary">
                                    {fiscalMode}
                                </strong>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingTransaction(null);
                            }}
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
                                Tanggal Transaksi{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={form.data.transaction_date}
                                onChange={(e) =>
                                    form.setData(
                                        'transaction_date',
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                            />
                            {form.errors.transaction_date && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {form.errors.transaction_date}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="font-bold text-slate-700">
                                    Sumber Kas / Rekening (Kredit Jurnal){' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                {(() => {
                                    const selectedAcc = paymentAccounts.find(
                                        (a) =>
                                            a.id ===
                                            form.data.payment_account_id,
                                    );
                                    if (!selectedAcc) return null;
                                    const bal =
                                        selectedAcc.current_balance ?? 0;
                                    return (
                                        <span
                                            className={`text-[10.5px] font-bold ${bal < 0 ? 'text-rose-500' : 'text-slate-500'}`}
                                        >
                                            Sisa Saldo:{' '}
                                            <strong
                                                className={
                                                    bal < 500000
                                                        ? 'text-amber-600'
                                                        : 'text-emerald-600'
                                                }
                                            >
                                                {fmt(bal)}
                                            </strong>
                                        </span>
                                    );
                                })()}
                            </div>
                            <select
                                required
                                value={form.data.payment_account_id}
                                onChange={(e) =>
                                    form.setData(
                                        'payment_account_id',
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            >
                                {paymentAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} -{' '}
                                        {acc.friendly_name || acc.name} (Saldo:{' '}
                                        {fmt(acc.current_balance ?? 0)})
                                    </option>
                                ))}
                            </select>
                            {form.errors.payment_account_id && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {form.errors.payment_account_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="font-bold text-slate-700">
                                    Kategori Pengeluaran{' '}
                                    <span className="text-rose-500">*</span>
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
                                    form.setData(
                                        'expense_category_id',
                                        e.target.value,
                                    )
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
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {form.errors.expense_category_id}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block font-bold text-slate-700">
                                    Nominal Pengeluaran (Rp){' '}
                                    <span className="text-rose-500">*</span>
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
                                                ? Number(
                                                      form.data.amount,
                                                  ).toLocaleString('id-ID')
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const rawVal =
                                                e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                );
                                            form.setData('amount', rawVal);
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 font-mono text-xs font-bold text-slate-900 focus:border-primary focus:ring-primary"
                                    />
                                </div>
                                {(() => {
                                    const selectedAcc = paymentAccounts.find(
                                        (a) =>
                                            a.id ===
                                            form.data.payment_account_id,
                                    );
                                    const enteredAmt =
                                        Number(form.data.amount) || 0;
                                    const availableBal =
                                        selectedAcc?.current_balance ?? 0;
                                    if (
                                        selectedAcc &&
                                        enteredAmt > availableBal &&
                                        availableBal >= 0
                                    ) {
                                        return (
                                            <p className="mt-1 text-[10px] font-bold text-amber-600">
                                                ⚠️ Pengeluaran (
                                                {fmt(enteredAmt)}) melebihi
                                                saldo kas ({fmt(availableBal)})
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                                {form.errors.amount && (
                                    <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                        {form.errors.amount}
                                    </p>
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
                                        form.setData(
                                            'recipient',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Toko Listrik / Budi"
                                    className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Keterangan / Memo{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                required
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Contoh: Pembelian kertas HVS 5 rim dan tinta printer kantor..."
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-primary focus:ring-primary"
                            ></textarea>
                            {form.errors.description && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {form.errors.description}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Bukti Foto Nota / Struk Kas{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                    (Khusus Gambar, dikompres otomatis)
                                </span>
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-primary hover:bg-slate-100">
                                    <svg
                                        className="h-4 w-4 text-slate-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span>
                                        {form.data.attachment
                                            ? 'Ganti Foto'
                                            : 'Pilih Foto Struk'}
                                    </span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => {
                                            const file =
                                                e.target.files?.[0] || null;
                                            form.setData('attachment', file);
                                        }}
                                        className="hidden"
                                    />
                                </label>

                                {form.data.attachment && (
                                    <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700">
                                        <span className="max-w-[160px] truncate font-medium">
                                            {form.data.attachment.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                form.setData(
                                                    'attachment',
                                                    null,
                                                );
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value =
                                                        '';
                                                }
                                            }}
                                            className="text-rose-500 hover:text-rose-700"
                                            title="Hapus lampiran"
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
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
                                )}
                            </div>
                            {form.errors.attachment && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {form.errors.attachment}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingTransaction(null);
                            }}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Menyimpan...'
                                : editingTransaction
                                  ? 'Simpan Perubahan'
                                  : 'Simpan Pengeluaran'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Konfirmasi Hapus */}
            <Modal
                show={!!deletingTransaction}
                onClose={() => setDeletingTransaction(null)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Hapus Pengeluaran Kas
                            </h3>
                            <p className="text-xs text-slate-500">
                                {deletingTransaction?.transaction_number}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-600">
                        Apakah Anda yakin ingin menghapus transaksi pengeluaran
                        ini sebesar{' '}
                        <strong className="font-mono font-bold text-slate-900">
                            {fmt(deletingTransaction?.amount || 0)}
                        </strong>
                        ? Tindakan ini juga akan otomatis membatalkan/menghapus{' '}
                        <strong>jurnal umum akuntansi</strong> terkait.
                    </p>

                    <div className="mt-6 flex justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={() => setDeletingTransaction(null)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700"
                        >
                            Ya, Hapus Transaksi
                        </button>
                    </div>
                </div>
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
                                Kategori baru akan otomatis dipetakan ke akun
                                jurnal akuntansi terkait
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddCategoryModalOpen(false)}
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
                                Nama Kategori (Bahasa Operasional){' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={categoryForm.data.name}
                                onChange={(e) =>
                                    categoryForm.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Konsumsi Tamu / Rapat Kantor"
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            />
                            {categoryForm.errors.name && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {categoryForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Akun Akuntansi / COA Terkait (Debet Jurnal){' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={categoryForm.data.account_id}
                                onChange={(e) =>
                                    categoryForm.setData(
                                        'account_id',
                                        e.target.value,
                                    )
                                }
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs font-semibold focus:border-primary focus:ring-primary"
                            >
                                {leafExpenseAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            {categoryForm.errors.account_id && (
                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                    {categoryForm.errors.account_id}
                                </p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400">
                                Setiap pengeluaran dengan kategori ini akan
                                otomatis didebetkan ke akun beban yang dipilih
                                di atas.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block font-bold text-slate-700">
                                Keterangan / Catatan (Opsional)
                            </label>
                            <textarea
                                rows={2}
                                value={categoryForm.data.description}
                                onChange={(e) =>
                                    categoryForm.setData(
                                        'description',
                                        e.target.value,
                                    )
                                }
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
                            {categoryForm.processing
                                ? 'Menyimpan...'
                                : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail Transaksi & Quick View Jurnal */}
            <Modal
                show={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                maxWidth="lg"
            >
                {viewingTransaction && (
                    <div className="p-6">
                        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl text-primary">
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
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black tracking-tight text-slate-900">
                                        Detail Transaksi & Jurnal Akuntansi
                                    </h3>
                                    <p className="mt-0.5 font-mono text-[11px] font-bold text-slate-500">
                                        {viewingTransaction.transaction_number}{' '}
                                        · Mode{' '}
                                        <span className="uppercase text-primary">
                                            {viewingTransaction.fiscal_mode}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingTransaction(null)}
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

                        {viewingTransaction.status === 'voided' && (
                            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
                                <div className="flex items-center gap-1.5 font-black uppercase text-rose-700">
                                    <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9.5px] text-white">
                                        VOID
                                    </span>
                                    <span>Transaksi Ini Telah Dibatalkan</span>
                                </div>
                                <p className="mt-1 text-[11px]">
                                    <strong>Alasan:</strong>{' '}
                                    {viewingTransaction.void_reason || '-'}
                                </p>
                                <p className="mt-0.5 text-[10px] text-rose-700/80">
                                    Dibatalkan oleh:{' '}
                                    <strong>
                                        {viewingTransaction.voided_by?.name ||
                                            'User'}
                                    </strong>{' '}
                                    · Waktu:{' '}
                                    {viewingTransaction.voided_at
                                        ? new Date(
                                              viewingTransaction.voided_at,
                                          ).toLocaleString('id-ID')
                                        : '-'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-5 text-xs">
                            {/* Header Info Grid */}
                            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Tanggal
                                    </span>
                                    <p className="mt-0.5 font-semibold text-slate-800">
                                        {formatDate(
                                            viewingTransaction.transaction_date,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Sumber Kas
                                    </span>
                                    <p className="mt-0.5 font-semibold text-slate-800">
                                        {viewingTransaction.payment_account
                                            ?.name || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Penerima Dana
                                    </span>
                                    <p className="mt-0.5 font-semibold text-slate-800">
                                        {viewingTransaction.recipient || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        Dicatat Oleh
                                    </span>
                                    <p className="mt-0.5 font-semibold text-slate-800">
                                        {viewingTransaction.creator?.name ||
                                            'System Admin'}
                                    </p>
                                </div>
                            </div>

                            {/* Keterangan & Lampiran Nota */}
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Keterangan / Memo
                                        </span>
                                        <p className="mt-1 text-xs font-semibold text-slate-800">
                                            {viewingTransaction.description ||
                                                '-'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Total Nominal
                                        </span>
                                        <div className="font-mono text-lg font-black text-rose-600">
                                            {fmt(viewingTransaction.amount)}
                                        </div>
                                    </div>
                                </div>

                                {viewingTransaction.attachment_url && (
                                    <div className="mt-3.5 border-t border-slate-100 pt-3">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            Lampiran Foto Nota
                                        </span>
                                        <div className="mt-2 flex items-center gap-3">
                                            <a
                                                href={
                                                    viewingTransaction.attachment_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative flex h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                                            >
                                                <img
                                                    src={
                                                        viewingTransaction.attachment_url
                                                    }
                                                    alt="Bukti Nota"
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <svg
                                                        className="h-5 w-5 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                    </svg>
                                                </div>
                                            </a>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {viewingTransaction.attachment_name ||
                                                        'Foto_Struk_Kas.jpg'}
                                                </p>
                                                <a
                                                    href={
                                                        viewingTransaction.attachment_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                                >
                                                    Lihat Ukuran Penuh ↗
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Breakdown Jurnal Akuntansi */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Pembukuan Jurnal Akuntansi
                                    </h4>
                                    {viewingTransaction.journal_entry
                                        ?.number && (
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700">
                                            {
                                                viewingTransaction.journal_entry
                                                    .number
                                            }
                                        </span>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-slate-500">
                                            <tr>
                                                <th className="px-4 py-2.5">
                                                    Kode & Nama Akun
                                                </th>
                                                <th className="px-4 py-2.5">
                                                    Posisi / Keterangan
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Debet (Rp)
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Kredit (Rp)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {viewingTransaction.journal_entry
                                                ?.items &&
                                            viewingTransaction.journal_entry
                                                .items.length > 0 ? (
                                                viewingTransaction.journal_entry.items.map(
                                                    (item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                                <span className="font-mono text-slate-500">
                                                                    {item
                                                                        .account
                                                                        ?.code ||
                                                                        '-'}
                                                                </span>{' '}
                                                                -{' '}
                                                                {item.account
                                                                    ?.name ||
                                                                    '-'}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-slate-500">
                                                                {Number(
                                                                    item.debit,
                                                                ) > 0 ? (
                                                                    <span className="font-bold text-rose-600">
                                                                        (Dr)
                                                                        Beban
                                                                        Operasional
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-bold text-emerald-600">
                                                                        (Cr)
                                                                        Pengeluaran
                                                                        Kas
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                                                                {Number(
                                                                    item.debit,
                                                                ) > 0
                                                                    ? fmt(
                                                                          item.debit,
                                                                      )
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                                                                {Number(
                                                                    item.credit,
                                                                ) > 0
                                                                    ? fmt(
                                                                          item.credit,
                                                                      )
                                                                    : '-'}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )
                                            ) : (
                                                <>
                                                    <tr>
                                                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                            <span className="font-mono text-slate-500">
                                                                {
                                                                    viewingTransaction
                                                                        .expense_account
                                                                        ?.code
                                                                }
                                                            </span>{' '}
                                                            -{' '}
                                                            {
                                                                viewingTransaction
                                                                    .expense_account
                                                                    ?.name
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2.5 font-bold text-rose-600">
                                                            (Dr) Beban
                                                            Operasional
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                                                            {fmt(
                                                                viewingTransaction.amount,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-slate-400">
                                                            -
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                                                            <span className="font-mono text-slate-500">
                                                                {
                                                                    viewingTransaction
                                                                        .payment_account
                                                                        ?.code
                                                                }
                                                            </span>{' '}
                                                            -{' '}
                                                            {
                                                                viewingTransaction
                                                                    .payment_account
                                                                    ?.name
                                                            }
                                                        </td>
                                                        <td className="px-4 py-2.5 font-bold text-emerald-600">
                                                            (Cr) Pengeluaran Kas
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right text-slate-400">
                                                            -
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">
                                                            {fmt(
                                                                viewingTransaction.amount,
                                                            )}
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setViewingTransaction(null)}
                                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Konfirmasi Pembatalan (Void) Transaksi */}
            <Modal
                show={!!voidingTransaction}
                onClose={() => {
                    if (!isVoidingProcessing) {
                        setVoidingTransaction(null);
                    }
                }}
                maxWidth="md"
            >
                {voidingTransaction && (
                    <div className="p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600">
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
                                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight text-slate-900">
                                    Batalkan Transaksi (Void)
                                </h3>
                                <p className="text-[11px] font-semibold text-slate-400">
                                    {voidingTransaction.transaction_number} ·
                                    Nominal {fmt(voidingTransaction.amount)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-900">
                            <p className="font-bold">⚠️ Perhatian Akuntansi:</p>
                            <p className="mt-1 text-[11px] leading-relaxed">
                                Transaksi ini{' '}
                                <strong>TIDAK akan dihapus</strong> melainkan
                                statusnya diubah menjadi{' '}
                                <strong className="text-rose-600">VOID</strong>.
                                Sistem akan{' '}
                                <strong>
                                    secara otomatis membukukan Jurnal Pembalik
                                    (Reversing Entry)
                                </strong>{' '}
                                untuk memulihkan saldo kas tanpa menghilangkan
                                jejak audit.
                            </p>
                        </div>

                        <div className="mt-4">
                            <label className="mb-1 block text-xs font-bold text-slate-700">
                                Alasan Pembatalan / Void{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                required
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder="Contoh: Salah menginput nominal pengeluaran listrik kantor..."
                                className="w-full rounded-xl border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:ring-amber-500"
                            ></textarea>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                disabled={isVoidingProcessing}
                                onClick={() => setVoidingTransaction(null)}
                                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={
                                    isVoidingProcessing || !voidReason.trim()
                                }
                                onClick={() => {
                                    if (
                                        !voidingTransaction ||
                                        !voidReason.trim()
                                    )
                                        return;
                                    setIsVoidingProcessing(true);
                                    router.post(
                                        `/cash-out/${voidingTransaction.id}/void`,
                                        { reason: voidReason },
                                        {
                                            onSuccess: () => {
                                                setIsVoidingProcessing(false);
                                                setVoidingTransaction(null);
                                                triggerToast(
                                                    'warning',
                                                    'Transaksi Dibatalkan (Void)',
                                                    'Jurnal pembalik otomatis telah dibukukan dan log audit telah dicatat.',
                                                );
                                            },
                                            onError: (errs) => {
                                                setIsVoidingProcessing(false);
                                                const firstMsg =
                                                    Object.values(errs)[0];
                                                triggerToast(
                                                    'error',
                                                    'Gagal Membatalkan Transaksi',
                                                    firstMsg ||
                                                        'Terjadi kesalahan sistem.',
                                                );
                                            },
                                        },
                                    );
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-50"
                            >
                                {isVoidingProcessing
                                    ? 'Memproses Void...'
                                    : 'Konfirmasi Void'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Besar: Riwayat Lengkap Jejak Audit (Audit Trail) */}
            <Modal
                show={isAuditLogModalOpen}
                onClose={() => setIsAuditLogModalOpen(false)}
                maxWidth="5xl"
            >
                <div className="p-6">
                    <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-slate-900">
                                    Jejak Audit Keamanan & Riwayat Mutasi Kas
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    Audit trail mutasi pencatatan, pembaruan,
                                    pembatalan (void), dan penghapusan transaksi
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAuditLogModalOpen(false)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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

                    {/* Toolbar Pencarian & Filter di dalam Modal */}
                    <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                        {/* Search Bar */}
                        <div className="relative sm:col-span-4">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={auditLogSearch}
                                onChange={(e) =>
                                    setAuditLogSearch(e.target.value)
                                }
                                placeholder="Cari nomor transaksi, user, deskripsi..."
                                className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-primary focus:ring-primary"
                            />
                        </div>

                        {/* Filter Event */}
                        <div className="sm:col-span-3">
                            <select
                                value={auditLogEventFilter}
                                onChange={(e) =>
                                    setAuditLogEventFilter(e.target.value)
                                }
                                className="w-full rounded-xl border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 focus:border-primary focus:ring-primary"
                            >
                                <option value="all">
                                    Semua Jenis Aktivitas
                                </option>
                                <option value="created">
                                    🟢 Input Baru (Created)
                                </option>
                                <option value="updated">
                                    🟡 Pembaruan (Updated)
                                </option>
                                <option value="voided">
                                    🟠 Pembatalan (Voided)
                                </option>
                                <option value="deleted">
                                    🔴 Hapus (Deleted)
                                </option>
                            </select>
                        </div>

                        {/* Filter Tanggal Mulai */}
                        <div className="sm:col-span-2">
                            <input
                                type="date"
                                value={auditLogStartDate}
                                onChange={(e) =>
                                    setAuditLogStartDate(e.target.value)
                                }
                                title="Tanggal Mulai"
                                className="w-full rounded-xl border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-primary focus:ring-primary"
                            />
                        </div>

                        {/* Filter Tanggal Sampai */}
                        <div className="sm:col-span-2">
                            <input
                                type="date"
                                value={auditLogEndDate}
                                onChange={(e) =>
                                    setAuditLogEndDate(e.target.value)
                                }
                                title="Tanggal Sampai"
                                className="w-full rounded-xl border-slate-200 px-2.5 py-2 text-xs text-slate-700 focus:border-primary focus:ring-primary"
                            />
                        </div>

                        {/* Reset Filter Button */}
                        <div className="sm:col-span-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setAuditLogSearch('');
                                    setAuditLogEventFilter('all');
                                    setAuditLogStartDate('');
                                    setAuditLogEndDate('');
                                }}
                                title="Reset Filter"
                                className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Tabel Daftar Log Audit */}
                    <div className="max-h-[460px] overflow-y-auto rounded-2xl border border-slate-200/90 bg-white">
                        {(() => {
                            const filteredLogs = (auditLogs || []).filter(
                                (log) => {
                                    // 1. Filter Event
                                    const matchEvent =
                                        auditLogEventFilter === 'all' ||
                                        log.event === auditLogEventFilter;

                                    // 2. Filter Search
                                    const q = auditLogSearch
                                        .toLowerCase()
                                        .trim();
                                    const matchSearch =
                                        !q ||
                                        log.description
                                            .toLowerCase()
                                            .includes(q) ||
                                        log.user_name
                                            .toLowerCase()
                                            .includes(q) ||
                                        log.event.toLowerCase().includes(q);

                                    // 3. Filter Rentang Tanggal
                                    let matchDate = true;
                                    if (log.created_at) {
                                        const logDateStr =
                                            log.created_at.substring(0, 10);
                                        if (
                                            auditLogStartDate &&
                                            logDateStr < auditLogStartDate
                                        ) {
                                            matchDate = false;
                                        }
                                        if (
                                            auditLogEndDate &&
                                            logDateStr > auditLogEndDate
                                        ) {
                                            matchDate = false;
                                        }
                                    }

                                    return (
                                        matchEvent && matchSearch && matchDate
                                    );
                                },
                            );

                            if (filteredLogs.length === 0) {
                                return (
                                    <div className="py-16 text-center text-xs text-slate-400">
                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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
                                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        Tidak ditemukan catatan audit log yang
                                        sesuai dengan filter.
                                    </div>
                                );
                            }

                            return (
                                <table className="w-full text-left text-xs">
                                    <thead className="backdrop-blur-xs sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 font-bold text-slate-600">
                                        <tr>
                                            <th className="px-5 py-3">
                                                Waktu Transaksi
                                            </th>
                                            <th className="px-5 py-3">
                                                Aktivitas
                                            </th>
                                            <th className="px-5 py-3">
                                                Staf / Pengguna
                                            </th>
                                            <th className="px-5 py-3">
                                                Rincian Deskripsi Audit
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {filteredLogs.map((log) => {
                                            const badgeColor = matchEventBadge(
                                                log.event,
                                            );

                                            return (
                                                <tr
                                                    key={log.id}
                                                    className="transition-colors hover:bg-slate-50/80"
                                                >
                                                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[11px] text-slate-500">
                                                        {log.created_at
                                                            ? new Date(
                                                                  log.created_at,
                                                              ).toLocaleString(
                                                                  'id-ID',
                                                                  {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  },
                                                              )
                                                            : '-'}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-[10px] font-black uppercase ${badgeColor}`}
                                                        >
                                                            {log.event}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">
                                                        {log.user_name}
                                                    </td>
                                                    <td className="px-5 py-3.5 leading-relaxed text-slate-700">
                                                        {log.description}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-[11px] font-medium text-slate-400">
                            Total {auditLogs?.length || 0} catatan aktivitas
                            tersimpan
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsAuditLogModalOpen(false)}
                            className="rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-slate-900 active:scale-95"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
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
