import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import ClientEditModal, { ClientItem } from '@/Components/Form/ClientEditModal';
import ClientFormModal, {
    ClientFormData,
} from '@/Components/Form/ClientFormModal';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import StatusBadge from '@/Components/UI/StatusBadge';
import Toast, { ToastType } from '@/Components/UI/Toast';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { getWhatsAppUrl } from '@/Utils/formatters';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface ClientPaginationData {
    data: ClientItem[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
}

interface ClientsProps {
    clients: ClientPaginationData;
    metrics: {
        totalClients: number;
        activeClients: number;
        archivedClients: number;
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

export default function Clients({ clients, metrics, filters }: ClientsProps) {
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

    // Modals state for Edit
    const [selectedClientForEdit, setSelectedClientForEdit] =
        useState<ClientItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
            route('clients'),
            {
                search:
                    params.search !== undefined ? params.search : searchQuery,
                status: params.status !== undefined ? params.status : statusTab,
                pkp: params.pkp !== undefined ? params.pkp : pkpFilter,
                sort_by: activeSortBy,
                sort_direction: activeSortDirection,
                page: params.page || 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSort = (column: string) => {
        let nextDirection: 'asc' | 'desc' = 'asc';
        if (sortBy === column) {
            nextDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            nextDirection =
                column === 'updated_at' || column === 'created_at'
                    ? 'desc'
                    : 'asc';
        }
        setSortBy(column);
        setSortDirection(nextDirection);
        applyFilter({ sort_by: column, sort_direction: nextDirection });
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        applyFilter({ search: value, page: 1 });
    };

    const handlePkpChange = (value: 'all' | 'pkp' | 'non-pkp') => {
        setPkpFilter(value);
        applyFilter({ pkp: value, page: 1 });
    };

    const handleStatusTabChange = (tab: 'active' | 'archived' | 'all') => {
        setStatusTab(tab);
        applyFilter({ status: tab, page: 1 });
    };

    const handlePageChange = (page: number) => {
        applyFilter({ page });
    };

    const handleAddClient = (formData: ClientFormData) => {
        router.post(
            route('clients.store'),
            {
                name: formData.name,
                npwp: formData.npwp,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    triggerToast(
                        `Client "${formData.name}" berhasil didaftarkan.`,
                        'success',
                    );
                },
                onError: (errs) => {
                    const firstError =
                        Object.values(errs)[0] || 'Gagal menyimpan client';
                    triggerToast(String(firstError), 'error');
                },
            },
        );
    };

    const handleOpenEditModal = (client: ClientItem) => {
        setSelectedClientForEdit(client);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedClient = (updated: ClientItem) => {
        router.put(
            route('clients.update', updated.id),
            {
                name: updated.name,
                npwp: updated.npwp,
                email: updated.email,
                phone: updated.phone,
                address: updated.address,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    triggerToast(
                        `Perubahan data client "${updated.name}" berhasil disimpan.`,
                        'success',
                    );
                },
                onError: (errs) => {
                    const firstError =
                        Object.values(errs)[0] || 'Gagal memperbarui client';
                    triggerToast(String(firstError), 'error');
                },
            },
        );
    };

    const handleToggleArchiveClient = (client: ClientItem) => {
        const isCurrentlyArchived = client.status === 'archived';
        const targetRoute = isCurrentlyArchived
            ? route('clients.unarchive', client.id)
            : route('clients.archive', client.id);

        router.post(
            targetRoute,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    const actionText = isCurrentlyArchived
                        ? 'diaktifkan kembali'
                        : 'diarsipkan';
                    triggerToast(
                        `Client "${client.name}" berhasil ${actionText}.`,
                        'success',
                    );
                },
                onError: () => {
                    triggerToast(
                        `Gagal memproses status arsip client.`,
                        'error',
                    );
                },
            },
        );
    };

    const handleDeleteClient = (client: ClientItem) => {
        if (
            confirm(
                `Apakah Anda yakin ingin menghapus client "${client.name}" secara permanen? Data yang sudah dihapus tidak dapat dipulihkan.`,
            )
        ) {
            router.delete(route('clients.destroy', client.id), {
                preserveScroll: true,
                onSuccess: () => {
                    triggerToast(
                        `Client "${client.name}" berhasil dihapus.`,
                        'success',
                    );
                },
                onError: () => {
                    triggerToast(
                        `Gagal menghapus client. Pastikan client tidak memiliki transaksi aktif.`,
                        'error',
                    );
                },
            });
        }
    };

    const renderSortIcon = (column: string) => {
        const isActive = sortBy === column;
        return (
            <span
                className={`inline-flex flex-col text-[9px] transition-colors ${
                    isActive
                        ? 'text-blue-600'
                        : 'text-slate-300 group-hover:text-slate-400'
                }`}
            >
                <svg
                    className={`-mb-1 h-2.5 w-2.5 ${isActive && sortDirection === 'asc' ? 'font-black text-blue-600' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 4l-6 6h12z" />
                </svg>
                <svg
                    className={`h-2.5 w-2.5 ${isActive && sortDirection === 'desc' ? 'font-black text-blue-600' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 20l6-6H6z" />
                </svg>
            </span>
        );
    };

    const clientList = Array.isArray(clients?.data) ? clients.data : [];
    const activeClientsCount = metrics?.activeClients ?? 0;
    const pkpCount = metrics?.pkpCount ?? 0;
    const nonPkpCount = metrics?.nonPkpCount ?? 0;

    return (
        <AppLayout
            activePage="clients"
            title="Direktori Client"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Data Master' },
                { label: 'Client' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Floating Toast Notification */}
                <Toast
                    show={toast.show}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() =>
                        setToast((prev) => ({ ...prev, show: false }))
                    }
                    position="bottom-right"
                    duration={4000}
                />

                {/* Header Title & CTA */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Direktori Client Mitra
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                            Kelola data mitra pengiklan untuk penerbitan Invoice
                            dan Kontrak Proyek
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
                        Daftarkan Client Baru
                    </PrimaryButton>
                </div>

                {/* Top Metrics Cards Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Card 1: Total Client Aktif */}
                    <MetricCard
                        title="Total Client Aktif"
                        value={`${activeClientsCount} Client`}
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />

                    {/* Card 2: Status PKP (Bisa PPN) */}
                    <MetricCard
                        title="Status PKP (Bisa PPN)"
                        value={`${pkpCount} Client`}
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
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />

                    {/* Card 3: Status Non-PKP */}
                    <MetricCard
                        title="Status Non-PKP"
                        value={`${nonPkpCount} Client`}
                        badgeText="Non-Faktur"
                        cardBgClass="bg-amber-50/60 border-amber-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-amber-800 border-amber-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-amber-500"
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
                        iconColorClass="bg-white text-amber-500 border-amber-100 shadow-2xs"
                        valueColorClass="text-amber-950"
                    />
                </div>

                {/* Main Table Card */}
                <div className="shadow-2xs rounded-3xl border border-slate-200/80 bg-white p-6 transition-all hover:border-slate-300">
                    {/* Header Controls: Search, Filters, & CTA */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Input */}
                        <div className="relative w-full max-w-sm">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
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
                            </span>
                            <TextInput
                                type="text"
                                placeholder="Cari nama, NPWP, atau kontak..."
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
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

                        {/* Status Tabs & PKP Filter */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Filter Status: Active / Archived / All */}
                            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleStatusTabChange('active')
                                    }
                                    className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        statusTab === 'active'
                                            ? 'shadow-xs bg-white text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Aktif ({metrics?.activeClients ?? 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleStatusTabChange('archived')
                                    }
                                    className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        statusTab === 'archived'
                                            ? 'shadow-xs bg-white text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Diarsipkan ({metrics?.archivedClients ?? 0})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusTabChange('all')}
                                    className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        statusTab === 'all'
                                            ? 'shadow-xs bg-white text-blue-600'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Semua ({metrics?.totalClients ?? 0})
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

                    {/* Table Data */}
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        {/* Sortable: Nama Client */}
                                        <th
                                            scope="col"
                                            className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/60"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Nama Client</span>
                                                {renderSortIcon('name')}
                                            </div>
                                        </th>

                                        {/* Sortable: NPWP */}
                                        <th
                                            scope="col"
                                            className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/60"
                                            onClick={() => handleSort('npwp')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>NPWP</span>
                                                {renderSortIcon('npwp')}
                                            </div>
                                        </th>

                                        {/* Status Pajak */}
                                        <th
                                            scope="col"
                                            className="select-none px-6 py-4"
                                        >
                                            Status Pajak
                                        </th>

                                        {/* Contact & WhatsApp */}
                                        <th
                                            scope="col"
                                            className="select-none px-6 py-4"
                                        >
                                            Telepon / WhatsApp
                                        </th>

                                        {/* Address */}
                                        <th
                                            scope="col"
                                            className="select-none px-6 py-4"
                                        >
                                            Alamat Kantor
                                        </th>

                                        {/* Sortable: Terakhir Update */}
                                        <th
                                            scope="col"
                                            className="group cursor-pointer select-none px-6 py-4 transition-colors hover:bg-slate-100/60"
                                            onClick={() =>
                                                handleSort('updated_at')
                                            }
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>Terakhir Update</span>
                                                {renderSortIcon('updated_at')}
                                            </div>
                                        </th>

                                        {/* Actions */}
                                        <th
                                            scope="col"
                                            className="select-none px-6 py-4 text-center"
                                        >
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {clientList.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12">
                                                <EmptyState
                                                    title="Data Client Tidak Ditemukan"
                                                    description="Belum ada client yang terdaftar dengan kriteria filter ini."
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        clientList.map((client, index) => {
                                            const hasPhone =
                                                client.phone &&
                                                client.phone.trim() !== '' &&
                                                client.phone !== '—';
                                            const waUrl = hasPhone
                                                ? getWhatsAppUrl(
                                                      client.phone!,
                                                      `Halo ${client.name}, kami dari Yousee Indonesia ingin mengonfirmasi terkait proyek dan invoice...`,
                                                  )
                                                : null;

                                            const isNearBottom =
                                                index >=
                                                    clientList.length - 2 &&
                                                clientList.length > 3;

                                            return (
                                                <tr
                                                    key={client.id}
                                                    className="transition-colors hover:bg-slate-50/50"
                                                >
                                                    {/* Nama Client */}
                                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 font-mono text-xs font-bold text-blue-600">
                                                                {client.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="block text-xs font-bold text-slate-900">
                                                                    {
                                                                        client.name
                                                                    }
                                                                </span>
                                                                <span className="block text-[11px] text-slate-400">
                                                                    {client.email ||
                                                                        '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* NPWP */}
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                                                        {client.npwp || '—'}
                                                    </td>

                                                    {/* Status Pajak */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <StatusBadge
                                                            status={
                                                                client.pkp
                                                                    ? 'pkp'
                                                                    : 'non-pkp'
                                                            }
                                                        />
                                                    </td>

                                                    {/* Phone / WhatsApp Direct Click */}
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        {hasPhone ? (
                                                            <a
                                                                href={
                                                                    waUrl ||
                                                                    `tel:${client.phone}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={`Chat WhatsApp ke ${client.phone}`}
                                                                className="group/wa hover:shadow-xs inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-950"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5 fill-emerald-600 transition-transform group-hover/wa:scale-110"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                                                </svg>
                                                                <span className="font-mono text-[11px]">
                                                                    {
                                                                        client.phone
                                                                    }
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <span className="font-mono text-xs text-slate-300">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Alamat */}
                                                    <td className="max-w-[200px] truncate px-6 py-4 text-xs font-medium text-slate-600">
                                                        {client.address || '—'}
                                                    </td>

                                                    {/* Terakhir Update */}
                                                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-500">
                                                        {formatDate(
                                                            client.updated_at,
                                                        )}
                                                    </td>

                                                    {/* Actions Dropdown */}
                                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                                        <ActionDropdown
                                                            direction={
                                                                isNearBottom
                                                                    ? 'up'
                                                                    : 'down'
                                                            }
                                                            items={[
                                                                {
                                                                    label: 'Edit Client',
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
                                                                                client,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Buka di Menu Proyek',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-blue-600"
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
                                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () => {
                                                                            router.get(
                                                                                route(
                                                                                    'projects',
                                                                                ),
                                                                                {
                                                                                    client_id:
                                                                                        client.id,
                                                                                },
                                                                            );
                                                                        },
                                                                },
                                                                {
                                                                    label:
                                                                        client.status ===
                                                                        'archived'
                                                                            ? 'Aktifkan Kembali'
                                                                            : 'Arsipkan Client',
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
                                                                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleToggleArchiveClient(
                                                                                client,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Hapus Client',
                                                                    variant:
                                                                        'danger',
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
                                                                    onClick:
                                                                        () =>
                                                                            handleDeleteClient(
                                                                                client,
                                                                            ),
                                                                },
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
                    </div>

                    {/* Pagination */}
                    {clients?.last_page > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={clients.current_page}
                                totalPages={clients.last_page}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>

                {/* Modals Container */}
                <ClientFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddClient}
                />

                <ClientEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    client={selectedClientForEdit}
                    onSubmit={handleSaveEditedClient}
                />
            </div>
        </AppLayout>
    );
}
