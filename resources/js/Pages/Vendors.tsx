import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import VendorEditModal, { VendorItem } from '@/Components/Form/VendorEditModal';
import VendorFormModal, {
    VendorFormData,
} from '@/Components/Form/VendorFormModal';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import StatusBadge from '@/Components/UI/StatusBadge';
import Toast, { ToastType } from '@/Components/UI/Toast';
import VendorTransactionsModal from '@/Components/UI/VendorTransactionsModal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { getWhatsAppUrl } from '@/Utils/formatters';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface VendorPaginationData {
    data: VendorItem[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
}

interface VendorsProps {
    vendors: VendorPaginationData;
    metrics: {
        totalVendors: number;
        activeVendors: number;
        archivedVendors: number;
        pkpCount: number;
        nonPkpCount: number;
    };
    filters: {
        search: string;
        status: 'active' | 'archived' | 'all';
        pkp: 'all' | 'pkp' | 'non-pkp';
        sort_by?: string;
        sort_direction?: 'asc' | 'desc';
    };
}

const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

export default function Vendors({
    vendors,
    metrics,
    filters,
}: VendorsProps) {
    const fiscalMode = useFiscalMode();
    const { flash } =
        usePage<PageProps<{ flash?: { success?: string; error?: string } }>>()
            .props;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [pkpFilter, setPkpFilter] = useState<'all' | 'pkp' | 'non-pkp'>(
        filters?.pkp || 'all',
    );
    const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>(
        filters?.status || 'active',
    );
    const [sortBy, setSortBy] = useState<string>(
        filters?.sort_by || 'updated_at',
    );
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
        filters?.sort_direction || 'desc',
    );

    // Toast state
    const [toast, setToast] = useState<{
        show: boolean;
        type: ToastType;
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
        type: ToastType = 'success',
        title?: string,
    ) => {
        setToast({
            show: true,
            type,
            title:
                title ||
                (type === 'success'
                    ? 'Berhasil'
                    : type === 'error'
                      ? 'Terjadi Kesalahan'
                      : 'Pemberitahuan'),
            message,
        });
    };

    // Sync flash message from server
    useEffect(() => {
        if (flash?.success) {
            triggerToast(flash.success, 'success', 'Operasi Berhasil');
        } else if (flash?.error) {
            triggerToast(flash.error, 'error', 'Operasi Gagal');
        }
    }, [flash]);

    // Modals state for Edit & View POs
    const [selectedVendorForEdit, setSelectedVendorForEdit] =
        useState<VendorItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedVendorForTx, setSelectedVendorForTx] =
        useState<VendorItem | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const applyFilter = (params: {
        search?: string;
        status?: 'active' | 'archived' | 'all';
        pkp?: 'all' | 'pkp' | 'non-pkp';
        sort_by?: string;
        sort_direction?: 'asc' | 'desc';
        page?: number;
    }) => {
        const activeSortBy =
            params.sort_by !== undefined ? params.sort_by : sortBy;
        const activeSortDirection =
            params.sort_direction !== undefined
                ? params.sort_direction
                : sortDirection;

        router.get(
            route('vendors'),
            {
                search:
                    params.search !== undefined ? params.search : searchQuery,
                status: params.status !== undefined ? params.status : statusTab,
                pkp: params.pkp !== undefined ? params.pkp : pkpFilter,
                sort_by: activeSortBy,
                sort_direction: activeSortDirection,
                page: params.page !== undefined ? params.page : 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        applyFilter({ search: value, page: 1 });
    };

    const handleStatusChange = (value: 'active' | 'archived' | 'all') => {
        setStatusTab(value);
        applyFilter({ status: value, page: 1 });
    };

    const handlePkpChange = (value: 'all' | 'pkp' | 'non-pkp') => {
        setPkpFilter(value);
        applyFilter({ pkp: value, page: 1 });
    };

    const handleSort = (column: string) => {
        let newDirection: 'asc' | 'desc' = 'asc';
        if (sortBy === column) {
            newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Default sort direction for new column selection
            newDirection =
                column === 'updated_at' || column === 'created_at'
                    ? 'desc'
                    : 'asc';
        }
        setSortBy(column);
        setSortDirection(newDirection);
        applyFilter({ sort_by: column, sort_direction: newDirection, page: 1 });
    };

    const handlePageChange = (page: number) => {
        applyFilter({ page });
    };

    const handleAddVendor = (formData: VendorFormData) => {
        router.post(
            route('vendors.store'),
            {
                name: formData.name,
                npwp: formData.npwp ? formData.npwp : null,
                phone: formData.phone ? formData.phone : null,
                email: formData.email ? formData.email : null,
                address: formData.address ? formData.address : null,
            },
            {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    triggerToast(
                        `Vendor "${formData.name}" berhasil didaftarkan.`,
                        'success',
                        'Pendaftaran Berhasil',
                    );
                },
                onError: (errs) => {
                    const firstErr =
                        Object.values(errs)[0] ||
                        'Gagal mendaftarkan vendor. Silakan periksa kembali formulir.';
                    triggerToast(
                        firstErr,
                        'error',
                        'Pendaftaran Gagal',
                    );
                },
            },
        );
    };

    const handleOpenEditModal = (vendor: VendorItem) => {
        setSelectedVendorForEdit(vendor);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedVendor = (updated: VendorItem) => {
        router.put(
            route('vendors.update', updated.id),
            {
                name: updated.name,
                npwp: updated.npwp ? updated.npwp : null,
                phone: updated.phone ? updated.phone : null,
                email: updated.email ? updated.email : null,
                address: updated.address ? updated.address : null,
            },
            {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    triggerToast(
                        `Perubahan data vendor "${updated.name}" berhasil disimpan.`,
                        'success',
                        'Pembaruan Berhasil',
                    );
                },
                onError: (errs) => {
                    const firstErr =
                        Object.values(errs)[0] ||
                        'Gagal memperbarui data vendor.';
                    triggerToast(firstErr, 'error', 'Pembaruan Gagal');
                },
            },
        );
    };

    const handleOpenTxModal = (vendor: VendorItem) => {
        setSelectedVendorForTx(vendor);
        setIsTxModalOpen(true);
    };

    const handleToggleArchiveVendor = (vendor: VendorItem) => {
        const isArchived = vendor.status === 'archived';
        const actionRoute = isArchived
            ? route('vendors.unarchive', vendor.id)
            : route('vendors.archive', vendor.id);
        const actionText = isArchived ? 'diaktifkan kembali' : 'diarsipkan';

        router.post(
            actionRoute,
            {},
            {
                onSuccess: () => {
                    triggerToast(
                        `Vendor "${vendor.name}" berhasil ${actionText}.`,
                        'success',
                        'Status Diperbarui',
                    );
                },
                onError: () => {
                    triggerToast(
                        `Gagal memproses status arsip vendor "${vendor.name}".`,
                        'error',
                        'Gagal Memproses',
                    );
                },
            },
        );
    };

    const handleDeleteVendor = (vendor: VendorItem) => {
        if (
            confirm(
                `Apakah Anda yakin ingin menghapus vendor "${vendor.name}"?`,
            )
        ) {
            router.delete(route('vendors.destroy', vendor.id), {
                onSuccess: () => {
                    triggerToast(
                        `Vendor "${vendor.name}" berhasil dihapus.`,
                        'success',
                        'Vendor Dihapus',
                    );
                },
                onError: () => {
                    triggerToast(
                        `Gagal menghapus vendor "${vendor.name}".`,
                        'error',
                        'Gagal Menghapus',
                    );
                },
            });
        }
    };

    const renderSortIcon = (column: string) => {
        const isActive = sortBy === column;
        return (
            <span className="inline-flex items-center ml-1.5 transition-colors">
                {isActive ? (
                    sortDirection === 'asc' ? (
                        <svg
                            className="h-3.5 w-3.5 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 15l7-7 7 7"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-3.5 w-3.5 text-blue-600"
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
                    )
                ) : (
                    <svg
                        className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                    </svg>
                )}
            </span>
        );
    };

    const vendorList = Array.isArray(vendors?.data) ? vendors.data : [];
    const totalItems = vendors?.total ?? vendorList.length;
    const currentPage = vendors?.current_page ?? 1;
    const totalPages = vendors?.last_page ?? 1;
    const itemsPerPage = vendors?.per_page ?? 10;

    // Metrics calculations
    const activeVendorsCount = metrics?.activeVendors ?? 0;
    const archivedVendorsCount = metrics?.archivedVendors ?? 0;
    const totalVendorsCount = metrics?.totalVendors ?? 0;
    const pkpVendorsCount = metrics?.pkpCount ?? 0;
    const nonPkpVendorsCount = metrics?.nonPkpCount ?? 0;

    return (
        <AppLayout
            activePage="vendors"
            title="Direktori Vendor"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Data Master' },
                { label: 'Vendor' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Floating Toast Notification */}
                <Toast
                    show={toast.show}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() => setToast((prev) => ({ ...prev, show: false }))}
                />

                {/* Header Title & CTA */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Direktori Vendor Partner
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                            Kelola data mitra vendor untuk transaksi Purchase
                            Order (PO)
                        </p>
                    </div>
                    <PrimaryButton onClick={() => setIsAddModalOpen(true)}>
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Daftarkan Vendor Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <MetricCard
                        title="Total Vendor Aktif"
                        value={`${activeVendorsCount} Vendor`}
                        badgeText="Siap Transaksi"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-blue-600"
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
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title="Status PKP (Bisa PPN)"
                        value={`${pkpVendorsCount} Vendor`}
                        badgeText="Faktur Pajak"
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-emerald-600"
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
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Status Non-PKP"
                        value={`${nonPkpVendorsCount} Vendor`}
                        badgeText="Tanpa PPN"
                        cardBgClass="bg-amber-50/60 border-amber-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-amber-800 border-amber-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-amber-600"
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
                        }
                        iconColorClass="bg-white text-amber-600 border-amber-100 shadow-2xs"
                        valueColorClass="text-amber-950"
                    />
                </div>

                {/* Search & Filter Bar */}
                <div className="shadow-xs flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search Input */}
                    <div className="max-w-md flex-1">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <TextInput
                                type="text"
                                placeholder="Cari nama vendor atau NPWP..."
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 py-2.5 pr-4 pl-10 text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Tabs & PKP Filter */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filter Status: Active / Archived / All */}
                        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                            <button
                                type="button"
                                onClick={() => handleStatusChange('active')}
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    statusTab === 'active'
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Aktif ({activeVendorsCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusChange('archived')}
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    statusTab === 'archived'
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Diarsipkan ({archivedVendorsCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusChange('all')}
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    statusTab === 'all'
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Semua ({totalVendorsCount})
                            </button>
                        </div>

                        {/* Dropdown Filter PKP */}
                        <div className="w-36">
                            <SelectInput
                                value={pkpFilter}
                                onChange={(e) =>
                                    handlePkpChange(
                                        e.target.value as
                                            | 'all'
                                            | 'pkp'
                                            | 'non-pkp',
                                    )
                                }
                                options={[
                                    { label: 'Semua PKP', value: 'all' },
                                    { label: 'Hanya PKP', value: 'pkp' },
                                    {
                                        label: 'Hanya Non-PKP',
                                        value: 'non-pkp',
                                    },
                                ]}
                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Vendors Data Table */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    {vendorList.length === 0 ? (
                        <EmptyState
                            title="Vendor Tidak Ditemukan"
                            description={
                                statusTab === 'archived'
                                    ? 'Belum ada vendor yang diarsipkan.'
                                    : 'Tidak ada data vendor yang cocok dengan pencarian atau filter Anda.'
                            }
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            {/* Nama Vendor (Sortable) */}
                                            <th
                                                onClick={() =>
                                                    handleSort('name')
                                                }
                                                className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/70 hover:text-slate-800"
                                            >
                                                <div className="flex items-center">
                                                    <span>Nama Vendor</span>
                                                    {renderSortIcon('name')}
                                                </div>
                                            </th>

                                            {/* NPWP (Sortable) */}
                                            <th
                                                onClick={() =>
                                                    handleSort('npwp')
                                                }
                                                className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/70 hover:text-slate-800"
                                            >
                                                <div className="flex items-center">
                                                    <span>NPWP Resmi</span>
                                                    {renderSortIcon('npwp')}
                                                </div>
                                            </th>

                                            {/* Status PKP */}
                                            <th className="px-6 py-4">
                                                Status PKP
                                            </th>

                                            {/* Telepon / WhatsApp */}
                                            <th className="px-6 py-4">
                                                Telepon / WhatsApp
                                            </th>

                                            {/* Terakhir Diperbarui (Sortable) */}
                                            <th
                                                onClick={() =>
                                                    handleSort('updated_at')
                                                }
                                                className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/70 hover:text-slate-800"
                                            >
                                                <div className="flex items-center">
                                                    <span>Terakhir Update</span>
                                                    {renderSortIcon('updated_at')}
                                                </div>
                                            </th>

                                            {/* Aksi */}
                                            <th className="px-6 py-4 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {vendorList.map((vendor, idx) => {
                                            const isNearBottom =
                                                idx >= vendorList.length - 2;

                                            const isArchived =
                                                vendor.status === 'archived';

                                            const waUrl = getWhatsAppUrl(
                                                vendor.phone,
                                                `Halo ${vendor.name}, kami dari PT Yousee Indonesia terkait administrasi Purchase Order (PO)...`,
                                            );

                                            return (
                                                <tr
                                                    key={vendor.id}
                                                    className={`transition-colors ${
                                                        isArchived
                                                            ? 'bg-rose-50/70 hover:bg-rose-100/70'
                                                            : 'hover:bg-slate-50/50'
                                                    }`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`font-bold ${
                                                                    isArchived
                                                                        ? 'text-rose-950'
                                                                        : 'text-slate-800'
                                                                }`}
                                                            >
                                                                {vendor.name}
                                                            </span>
                                                            {isArchived && (
                                                                <span className="shadow-2xs inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-100/80 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                                                    Diarsipkan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                            ID: VND-
                                                            {vendor.id
                                                                .toString()
                                                                .substring(
                                                                    0,
                                                                    8,
                                                                )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                                                        {vendor.npwp || '—'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <StatusBadge
                                                            status={
                                                                vendor.pkp
                                                                    ? 'pkp'
                                                                    : 'non-pkp'
                                                            }
                                                        />
                                                    </td>
                                                    {/* Telepon / WhatsApp Clickable */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        {vendor.phone ? (
                                                            <a
                                                                href={
                                                                    waUrl ||
                                                                    `tel:${vendor.phone}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group/wa inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-950 hover:shadow-xs"
                                                                title={`Chat WhatsApp ke ${vendor.phone}`}
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5 fill-emerald-600 transition-transform group-hover/wa:scale-110"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872-.118.571-.347 1.758-7.18 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                                                                </svg>
                                                                <span className="font-mono text-[11px]">
                                                                    {
                                                                        vendor.phone
                                                                    }
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <span className="font-mono text-xs text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-500">
                                                        {formatDate(
                                                            vendor.updated_at,
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                                        <ActionDropdown
                                                            direction={
                                                                isNearBottom
                                                                    ? 'up'
                                                                    : 'down'
                                                            }
                                                            items={[
                                                                {
                                                                    label: 'Edit Vendor',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-slate-500"
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
                                                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.03H3v-3.5L16.732 3.732z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenEditModal(
                                                                                vendor,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Lihat Transaksi PO',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-slate-500"
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
                                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenTxModal(
                                                                                vendor,
                                                                            ),
                                                                },
                                                                {
                                                                    label:
                                                                        vendor.status ===
                                                                        'archived'
                                                                            ? 'Aktifkan Kembali'
                                                                            : 'Arsipkan Vendor',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5"
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
                                                                                d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2m-14 0v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    variant:
                                                                        vendor.status ===
                                                                        'archived'
                                                                            ? 'default'
                                                                            : 'danger',
                                                                    onClick:
                                                                        () =>
                                                                            handleToggleArchiveVendor(
                                                                                vendor,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Hapus Vendor',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-rose-500"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    variant:
                                                                        'danger',
                                                                    onClick:
                                                                        () =>
                                                                            handleDeleteVendor(
                                                                                vendor,
                                                                            ),
                                                                },
                                                            ]}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                            />
                        </>
                    )}
                </div>

                {/* Register New Vendor Modal */}
                <VendorFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddVendor}
                />

                {/* Edit Vendor Modal */}
                <VendorEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    vendor={selectedVendorForEdit}
                    onSubmit={handleSaveEditedVendor}
                />

                {/* View Vendor PO Transactions Modal */}
                <VendorTransactionsModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    vendor={selectedVendorForTx}
                />
            </div>
        </AppLayout>
    );
}
