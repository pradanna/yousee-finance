import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import MonthPicker from '@/Components/Form/MonthPicker';
import SalesEditModal, { SalesItem } from '@/Components/Form/SalesEditModal';
import SalesFormModal, {
    SalesFormData,
} from '@/Components/Form/SalesFormModal';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import SalesDealsModal from '@/Components/UI/SalesDealsModal';
import StatusBadge from '@/Components/UI/StatusBadge';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { useMemo, useState } from 'react';

const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default function Sales() {
    const fiscalMode = useFiscalMode();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>(
        'active',
    );
    const [selectedMonth, setSelectedMonth] =
        useState<string>(getCurrentMonthKey);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals state for Edit & View Deals
    const [selectedSalesForEdit, setSelectedSalesForEdit] =
        useState<SalesItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedSalesForTx, setSelectedSalesForTx] =
        useState<SalesItem | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [salesTeam, setSalesTeam] = useState<SalesItem[]>([
        {
            id: 1,
            name: 'Rian Hidayat',
            email: 'rian@youseeads.id',
            phone: '0812-1111-2222',
            commissionRate: 2.0,
            status: 'active',
            achieved: 'Rp 320.000.000',
            achievedVal: 320000000,
            commission: 'Rp 6.400.000',
            dealsCount: 2,
        },
        {
            id: 2,
            name: 'Siti Aminah',
            email: 'siti@youseeads.id',
            phone: '0813-3333-4444',
            commissionRate: 2.0,
            status: 'active',
            achieved: 'Rp 180.000.000',
            achievedVal: 180000000,
            commission: 'Rp 3.600.000',
            dealsCount: 1,
        },
        {
            id: 3,
            name: 'Budi Santoso',
            email: 'budi@youseeads.id',
            phone: '0815-5555-6666',
            commissionRate: 2.0,
            status: 'active',
            achieved: 'Rp 50.000.000',
            achievedVal: 50000000,
            commission: 'Rp 1.000.000',
            dealsCount: 1,
        },
        {
            id: 4,
            name: 'Doni Pratama',
            email: 'doni@youseeads.id',
            phone: '0817-7777-8888',
            commissionRate: 2.0,
            status: 'archived',
            achieved: 'Rp 0',
            achievedVal: 0,
            commission: 'Rp 0',
            dealsCount: 0,
        },
    ]);

    const handleAddSales = (formData: SalesFormData) => {
        const newSales: SalesItem = {
            id: salesTeam.length + 1,
            name: formData.name,
            email: formData.email || '—',
            phone: formData.phone || '—',
            commissionRate: formData.commissionRate || 2.0,
            status: 'active',
            achieved: 'Rp 0',
            achievedVal: 0,
            commission: 'Rp 0',
            dealsCount: 0,
        };
        setSalesTeam([newSales, ...salesTeam]);
        setAlertMessage(
            `Sales executive "${formData.name}" berhasil didaftarkan.`,
        );
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenEditModal = (sales: SalesItem) => {
        setSelectedSalesForEdit(sales);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedSales = (updated: SalesItem) => {
        setSalesTeam((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        setAlertMessage(
            `Perubahan data sales "${updated.name}" berhasil disimpan.`,
        );
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenTxModal = (sales: SalesItem) => {
        setSelectedSalesForTx(sales);
        setIsTxModalOpen(true);
    };

    const handleToggleArchiveSales = (salesId: number) => {
        setSalesTeam((prev) =>
            prev.map((s) => {
                if (s.id === salesId) {
                    const newStatus: 'active' | 'archived' =
                        s.status === 'archived' ? 'active' : 'archived';
                    const actionText =
                        newStatus === 'archived'
                            ? 'diarsipkan'
                            : 'diaktifkan kembali';
                    setAlertMessage(
                        `Sales executive "${s.name}" berhasil ${actionText}.`,
                    );
                    setTimeout(() => setAlertMessage(null), 4000);
                    return { ...s, status: newStatus };
                }
                return s;
            }),
        );
    };

    // Calculate total summary metrics
    const totalAchieved = useMemo(() => {
        return salesTeam.reduce((acc, curr) => acc + curr.achievedVal, 0);
    }, [salesTeam]);

    const totalCommission = useMemo(() => {
        return salesTeam.reduce((acc, curr) => {
            const val = parseInt(curr.commission.replace(/[^0-9]/g, '')) || 0;
            return acc + val;
        }, 0);
    }, [salesTeam]);

    // Filtering
    const filteredSales = useMemo(() => {
        return salesTeam.filter((s) => {
            const matchesSearch =
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.phone.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusTab === 'all' ||
                (statusTab === 'active' && s.status === 'active') ||
                (statusTab === 'archived' && s.status === 'archived');

            return matchesSearch && matchesStatus;
        });
    }, [salesTeam, searchQuery, statusTab]);

    // Pagination
    const totalItems = filteredSales.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedSales = useMemo(() => {
        return filteredSales.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        );
    }, [filteredSales, currentPage, itemsPerPage]);

    // Counts
    const totalSalesCount = salesTeam.length;
    const activeCount = salesTeam.filter((s) => s.status === 'active').length;
    const archivedCount = salesTeam.filter(
        (s) => s.status === 'archived',
    ).length;

    return (
        <AppLayout
            activePage="sales"
            title="Pelacakan Performa Sales"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Data Master' },
                { label: 'Sales' },
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
                            Pelacakan Performa Sales
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                            Pantau pencapaian omset dan estimasi komisi tim
                            marketing billboard Yousee
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
                        Daftarkan Sales Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <MetricCard
                        title="Pencapaian Omset Bulan Ini"
                        value={`Rp ${totalAchieved.toLocaleString('id-ID')}`}
                        badgeText="Bulan Ini"
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
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title="Komisi Terbentuk (2%)"
                        value={`Rp ${totalCommission.toLocaleString('id-ID')}`}
                        badgeText="Insentif Sales"
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
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Total Tim Sales Aktif"
                        value={`${activeCount} Sales`}
                        badgeText="Sales Executive"
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
                            Pencarian Sales
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
                                placeholder="Cari nama sales, email, atau telepon..."
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
                        {/* Month Picker Filter */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Periode Bulan
                            </label>
                            <MonthPicker
                                value={selectedMonth}
                                onChange={(newVal) => {
                                    setSelectedMonth(newVal);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {/* Status Sales Filter */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Status Sales
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
                                    Sales Aktif ({activeCount})
                                </option>
                                <option value="archived">
                                    Sales Diarsipkan ({archivedCount})
                                </option>
                                <option value="all">
                                    Semua Sales ({totalSalesCount})
                                </option>
                            </SelectInput>
                        </div>
                    </div>
                </div>

                {/* Sales Data Table */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    {totalItems === 0 ? (
                        <EmptyState
                            title="Sales Executive Tidak Ditemukan"
                            description={
                                statusTab === 'archived'
                                    ? 'Belum ada sales executive yang diarsipkan.'
                                    : 'Tidak ada data sales executive yang cocok dengan pencarian atau filter Anda.'
                            }
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                Sales Executive
                                            </th>
                                            <th className="px-6 py-4">
                                                Kontak (Email / Telepon)
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Pencapaian Omset (Bulan Ini)
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Estimasi Komisi (
                                                {fiscalMode === 'ppn'
                                                    ? 'Mode PPN'
                                                    : 'Non-PPN'}
                                                )
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {paginatedSales.map((sales, idx) => {
                                            const isNearBottom =
                                                idx >=
                                                paginatedSales.length - 2;
                                            return (
                                                <tr
                                                    key={sales.id}
                                                    className="transition-colors hover:bg-slate-50/50"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">
                                                                {sales.name}
                                                            </span>
                                                            {sales.status ===
                                                                'archived' && (
                                                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                                    Diarsipkan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                            ID: SLS-
                                                            {sales.id
                                                                .toString()
                                                                .padStart(
                                                                    3,
                                                                    '0',
                                                                )}{' '}
                                                            • Rate:{' '}
                                                            {
                                                                sales.commissionRate
                                                            }
                                                            %
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-semibold text-slate-700">
                                                            {sales.email}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                                            {sales.phone}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                        <div>
                                                            {sales.achieved}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                            {sales.dealsCount}{' '}
                                                            Closing Deal
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-bold text-emerald-600">
                                                        {sales.commission}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                                        <StatusBadge
                                                            status={
                                                                sales.status ===
                                                                'active'
                                                                    ? 'active'
                                                                    : 'archived'
                                                            }
                                                        />
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
                                                                    label: 'Edit Sales Executive',
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
                                                                                sales,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Lihat Riwayat Closing Deal',
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
                                                                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenTxModal(
                                                                                sales,
                                                                            ),
                                                                },
                                                                {
                                                                    label:
                                                                        sales.status ===
                                                                        'archived'
                                                                            ? 'Aktifkan Kembali'
                                                                            : 'Arsipkan Sales',
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
                                                                        sales.status ===
                                                                        'archived'
                                                                            ? 'default'
                                                                            : 'danger',
                                                                    onClick:
                                                                        () =>
                                                                            handleToggleArchiveSales(
                                                                                sales.id,
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

                {/* Register New Sales Modal */}
                <SalesFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddSales}
                />

                {/* Edit Sales Modal */}
                <SalesEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    sales={selectedSalesForEdit}
                    onSubmit={handleSaveEditedSales}
                />

                {/* View Sales Deals Modal */}
                <SalesDealsModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    sales={selectedSalesForTx}
                />
            </div>
        </AppLayout>
    );
}
