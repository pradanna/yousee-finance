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
import VendorTransactionsModal from '@/Components/UI/VendorTransactionsModal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { useMemo, useState } from 'react';

export default function Vendors() {
    const fiscalMode = useFiscalMode();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pkpFilter, setPkpFilter] = useState<'all' | 'pkp' | 'non-pkp'>(
        'all',
    );
    const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>(
        'active',
    );
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals state for Edit & View POs
    const [selectedVendorForEdit, setSelectedVendorForEdit] =
        useState<VendorItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedVendorForTx, setSelectedVendorForTx] =
        useState<VendorItem | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [vendors, setVendors] = useState<VendorItem[]>([
        {
            id: 1,
            name: 'PT. Megah Billboard Jaya',
            npwp: '01.234.567.8-901.000',
            email: 'sales@megahbillboard.com',
            phone: '021-5551234',
            address: 'Jl. Jend. Sudirman No. 12, Jakarta Pusat',
            pkp: true,
            status: 'active',
            count: 12,
            total: 'IDR 45.000.000',
        },
        {
            id: 2,
            name: 'PT. Promosi Outdoor Kreasindo',
            npwp: '12.345.678.9-012.000',
            email: 'info@promosicreative.co.id',
            phone: '021-5555678',
            address: 'Kawasan Industri Pulogadung Blok B3, Jakarta Timur',
            pkp: true,
            status: 'active',
            count: 8,
            total: 'IDR 24.300.000',
        },
        {
            id: 3,
            name: 'CV. Media Ad Perkasa',
            npwp: '',
            email: 'contact@mediaadperkasa.net',
            phone: '0812-3456-7890',
            address: 'Jl. Kemang Raya No. 45, Jakarta Selatan',
            pkp: false,
            status: 'active',
            count: 15,
            total: 'IDR 5.200.000',
        },
        {
            id: 4,
            name: 'CV. Citra Bali Billboard',
            npwp: '89.123.456.7-891.000',
            email: 'bali@citrabillboard.com',
            phone: '0361-223344',
            address: 'Jl. Sunset Road No. 88, Kuta, Bali',
            pkp: false,
            status: 'archived',
            count: 3,
            total: 'IDR 1.500.000',
        },
    ]);

    const handleAddVendor = (formData: VendorFormData) => {
        const newVendor: VendorItem = {
            id: vendors.length + 1,
            name: formData.name,
            npwp: formData.npwp || '—',
            email: formData.email || '—',
            phone: formData.phone || '—',
            address: formData.address || '—',
            pkp: formData.pkp,
            status: 'active',
            count: 0,
            total: 'IDR 0',
        };
        setVendors([newVendor, ...vendors]);
        setAlertMessage(`Vendor "${formData.name}" berhasil didaftarkan.`);
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenEditModal = (vendor: VendorItem) => {
        setSelectedVendorForEdit(vendor);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedVendor = (updated: VendorItem) => {
        setVendors((prev) =>
            prev.map((v) => (v.id === updated.id ? updated : v)),
        );
        setAlertMessage(
            `Perubahan data vendor "${updated.name}" berhasil disimpan.`,
        );
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenTxModal = (vendor: VendorItem) => {
        setSelectedVendorForTx(vendor);
        setIsTxModalOpen(true);
    };

    const handleToggleArchiveVendor = (vendorId: number) => {
        setVendors((prev) =>
            prev.map((v) => {
                if (v.id === vendorId) {
                    const newStatus: 'active' | 'archived' =
                        v.status === 'archived' ? 'active' : 'archived';
                    const actionText =
                        newStatus === 'archived'
                            ? 'diarsipkan'
                            : 'diaktifkan kembali';
                    setAlertMessage(
                        `Vendor "${v.name}" berhasil ${actionText}.`,
                    );
                    setTimeout(() => setAlertMessage(null), 4000);
                    return { ...v, status: newStatus };
                }
                return v;
            }),
        );
    };

    const getVendorStats = (vendor: VendorItem) => {
        if (vendor.id > 4) {
            return { count: vendor.count, total: vendor.total };
        }
        if (fiscalMode === 'ppn') {
            switch (vendor.id) {
                case 1:
                    return { count: 12, total: 'IDR 45.000.000' };
                case 2:
                    return { count: 8, total: 'IDR 24.300.000' };
                case 3:
                    return { count: 15, total: 'IDR 5.200.000' };
                case 4:
                    return { count: 3, total: 'IDR 1.500.000' };
                default:
                    return { count: 0, total: 'IDR 0' };
            }
        } else {
            switch (vendor.id) {
                case 1:
                    return { count: 6, total: 'IDR 18.000.000' };
                case 2:
                    return { count: 4, total: 'IDR 12.000.000' };
                case 3:
                    return { count: 10, total: 'IDR 3.500.000' };
                case 4:
                    return { count: 1, total: 'IDR 500.000' };
                default:
                    return { count: 0, total: 'IDR 0' };
            }
        }
    };

    // Filtering
    const filteredVendors = useMemo(() => {
        return vendors.filter((v) => {
            const matchesSearch =
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.npwp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPkp =
                pkpFilter === 'all' ||
                (pkpFilter === 'pkp' && v.pkp) ||
                (pkpFilter === 'non-pkp' && !v.pkp);

            const matchesStatus =
                statusTab === 'all' ||
                (statusTab === 'active' && v.status === 'active') ||
                (statusTab === 'archived' && v.status === 'archived');

            return matchesSearch && matchesPkp && matchesStatus;
        });
    }, [vendors, searchQuery, pkpFilter, statusTab]);

    // Pagination
    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedVendors = useMemo(() => {
        return filteredVendors.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        );
    }, [filteredVendors, currentPage, itemsPerPage]);

    // Counts
    const totalVendorCount = vendors.length;
    const activeCount = vendors.filter((v) => v.status === 'active').length;
    const archivedCount = vendors.filter((v) => v.status === 'archived').length;
    const pkpCount = vendors.filter((v) => v.pkp).length;

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
                {/* Alert Notification */}
                {alertMessage && (
                    <div className="animate-fade-in shadow-2xs flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                        <div className="flex items-center gap-2.5">
                            <svg
                                className="h-5 w-5 text-emerald-600"
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
                            <span>{alertMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAlertMessage(null)}
                            className="text-emerald-500 hover:text-emerald-800"
                        >
                            ✕
                        </button>
                    </div>
                )}

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
                        title="Total Vendor Terdaftar"
                        value={`${totalVendorCount} Vendor`}
                        badgeText="Mitra Usaha"
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
                        value={`${pkpCount} Vendor`}
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
                        title="Mode Pajak Aktif"
                        value={
                            fiscalMode === 'ppn'
                                ? 'Mode PPN (PKP)'
                                : 'Mode Non-PPN'
                        }
                        badgeText="Fiskal"
                        cardBgClass="bg-slate-100/80 border-slate-200/80 shadow-xs"
                        badgeColorClass="bg-white/90 text-slate-800 border-slate-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-slate-600"
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
                        }
                        iconColorClass="bg-white text-slate-600 border-slate-200/60 shadow-2xs"
                        valueColorClass="text-slate-900"
                    />
                </div>

                {/* Search & Filter Bar */}
                <div className="shadow-xs flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
                    {/* Search Input */}
                    <div className="max-w-md flex-1 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Pencarian Vendor
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                                placeholder="Cari nama vendor, NPWP, atau email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="block w-full pl-9 text-xs"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Vendor Filter */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Status Vendor
                            </label>
                            <SelectInput
                                value={statusTab}
                                onChange={(e) => {
                                    setStatusTab(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-44 text-xs"
                            >
                                <option value="active">
                                    Vendor Aktif ({activeCount})
                                </option>
                                <option value="archived">
                                    Vendor Diarsipkan ({archivedCount})
                                </option>
                                <option value="all">
                                    Semua Vendor ({totalVendorCount})
                                </option>
                            </SelectInput>
                        </div>

                        {/* Status PKP Filter */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Status PKP
                            </label>
                            <SelectInput
                                value={pkpFilter}
                                onChange={(e) => {
                                    setPkpFilter(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-44 text-xs"
                            >
                                <option value="all">Semua Status PKP</option>
                                <option value="pkp">PKP (Bisa PPN)</option>
                                <option value="non-pkp">Non-PKP</option>
                            </SelectInput>
                        </div>
                    </div>
                </div>

                {/* Vendors Data Table */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    {totalItems === 0 ? (
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
                                        <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                Nama Vendor
                                            </th>
                                            <th className="px-6 py-4">
                                                NPWP Resmi
                                            </th>
                                            <th className="px-6 py-4">
                                                Kontak (Email / Telepon)
                                            </th>
                                            <th className="px-6 py-4">
                                                Status PKP
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Total Belanja (
                                                {fiscalMode === 'ppn'
                                                    ? 'PPN'
                                                    : 'Non-PPN'}
                                                )
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {paginatedVendors.map((vendor, idx) => {
                                            const stats =
                                                getVendorStats(vendor);
                                            const isNearBottom =
                                                idx >=
                                                paginatedVendors.length - 2;
                                            return (
                                                <tr
                                                    key={vendor.id}
                                                    className="transition-colors hover:bg-slate-50/50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">
                                                                {vendor.name}
                                                            </span>
                                                            {vendor.status ===
                                                                'archived' && (
                                                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                                    Diarsipkan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                            ID: VND-
                                                            {vendor.id
                                                                .toString()
                                                                .padStart(
                                                                    3,
                                                                    '0',
                                                                )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                                                        {vendor.npwp || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-semibold text-slate-700">
                                                            {vendor.email}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                                            {vendor.phone}
                                                        </div>
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
                                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                                        <div className="font-mono text-xs font-bold text-slate-900">
                                                            {stats.total}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                            {stats.count}{' '}
                                                            Transaksi PO
                                                        </div>
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
                                                                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.5L16.732 3.732z"
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
                                                                                vendor.id,
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
                                onPageChange={(page) => setCurrentPage(page)}
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
