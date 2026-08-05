import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import TextInput from '@/Components/Form/TextInput';
import SelectInput from '@/Components/Form/SelectInput';
import MonthPicker from '@/Components/Form/MonthPicker';
import StatusBadge from '@/Components/UI/StatusBadge';
import MetricCard from '@/Components/Card/MetricCard';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import SalesFormModal, { SalesFormData } from '@/Components/Form/SalesFormModal';
import SalesEditModal, { SalesItem } from '@/Components/Form/SalesEditModal';
import SalesDealsModal from '@/Components/UI/SalesDealsModal';

const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default function Sales() {
    const fiscalMode = useFiscalMode();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>('active');
    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals state for Edit & View Deals
    const [selectedSalesForEdit, setSelectedSalesForEdit] = useState<SalesItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedSalesForTx, setSelectedSalesForTx] = useState<SalesItem | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [salesTeam, setSalesTeam] = useState<SalesItem[]>([
        { id: 1, name: 'Rian Hidayat', email: 'rian@youseeads.id', phone: '0812-1111-2222', commissionRate: 2.0, status: 'active', achieved: 'Rp 320.000.000', achievedVal: 320000000, commission: 'Rp 6.400.000', dealsCount: 2 },
        { id: 2, name: 'Siti Aminah', email: 'siti@youseeads.id', phone: '0813-3333-4444', commissionRate: 2.0, status: 'active', achieved: 'Rp 180.000.000', achievedVal: 180000000, commission: 'Rp 3.600.000', dealsCount: 1 },
        { id: 3, name: 'Budi Santoso', email: 'budi@youseeads.id', phone: '0815-5555-6666', commissionRate: 2.0, status: 'active', achieved: 'Rp 50.000.000', achievedVal: 50000000, commission: 'Rp 1.000.000', dealsCount: 1 },
        { id: 4, name: 'Doni Pratama', email: 'doni@youseeads.id', phone: '0817-7777-8888', commissionRate: 2.0, status: 'archived', achieved: 'Rp 0', achievedVal: 0, commission: 'Rp 0', dealsCount: 0 },
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
        setAlertMessage(`Sales executive "${formData.name}" berhasil didaftarkan.`);
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenEditModal = (sales: SalesItem) => {
        setSelectedSalesForEdit(sales);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedSales = (updated: SalesItem) => {
        setSalesTeam(prev => prev.map(s => s.id === updated.id ? updated : s));
        setAlertMessage(`Perubahan data sales "${updated.name}" berhasil disimpan.`);
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenTxModal = (sales: SalesItem) => {
        setSelectedSalesForTx(sales);
        setIsTxModalOpen(true);
    };

    const handleToggleArchiveSales = (salesId: number) => {
        setSalesTeam(prev => prev.map(s => {
            if (s.id === salesId) {
                const newStatus: 'active' | 'archived' = s.status === 'archived' ? 'active' : 'archived';
                const actionText = newStatus === 'archived' ? 'diarsipkan' : 'diaktifkan kembali';
                setAlertMessage(`Sales executive "${s.name}" berhasil ${actionText}.`);
                setTimeout(() => setAlertMessage(null), 4000);
                return { ...s, status: newStatus };
            }
            return s;
        }));
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
            currentPage * itemsPerPage
        );
    }, [filteredSales, currentPage, itemsPerPage]);

    // Counts
    const totalSalesCount = salesTeam.length;
    const activeCount = salesTeam.filter((s) => s.status === 'active').length;
    const archivedCount = salesTeam.filter((s) => s.status === 'archived').length;

    return (
        <AppLayout
            activePage="sales"
            title="Pelacakan Performa Sales"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Data Master' }, { label: 'Sales' }]}
        >
            <div className="space-y-6 w-full">
                {/* Alert Notification */}
                {alertMessage && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between text-xs font-bold animate-fade-in shadow-2xs">
                        <div className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{alertMessage}</span>
                        </div>
                        <button type="button" onClick={() => setAlertMessage(null)} className="text-emerald-500 hover:text-emerald-800">
                            ✕
                        </button>
                    </div>
                )}

                {/* Header Title & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pelacakan Performa Sales</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Pantau pencapaian omset dan estimasi komisi tim marketing billboard Yousee</p>
                    </div>
                    <PrimaryButton onClick={() => setIsAddModalOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Daftarkan Sales Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Pencapaian Omset Bulan Ini"
                        value={`Rp ${totalAchieved.toLocaleString('id-ID')}`}
                        badgeText="Bulan Ini"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                        iconColorClass="bg-white text-slate-600 border-slate-200/60 shadow-2xs"
                        valueColorClass="text-slate-900"
                    />
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    {/* Search Input */}
                    <div className="flex-1 max-w-md space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Sales</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                                className="pl-9 text-xs block w-full"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Month Picker Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periode Bulan</label>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Sales</label>
                            <SelectInput
                                value={statusTab}
                                onChange={(e) => {
                                    setStatusTab(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-44 text-xs"
                            >
                                <option value="active">Sales Aktif ({activeCount})</option>
                                <option value="archived">Sales Diarsipkan ({archivedCount})</option>
                                <option value="all">Semua Sales ({totalSalesCount})</option>
                            </SelectInput>
                        </div>
                    </div>
                </div>

                {/* Sales Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                            <th className="px-6 py-4">Sales Executive</th>
                                            <th className="px-6 py-4">Kontak (Email / Telepon)</th>
                                            <th className="px-6 py-4 text-right">Pencapaian Omset (Bulan Ini)</th>
                                            <th className="px-6 py-4 text-right">Estimasi Komisi ({fiscalMode === 'ppn' ? 'Mode PPN' : 'Non-PPN'})</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                        {paginatedSales.map((sales, idx) => {
                                            const isNearBottom = idx >= paginatedSales.length - 2;
                                            return (
                                                <tr key={sales.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{sales.name}</span>
                                                            {sales.status === 'archived' && (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                    Diarsipkan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">
                                                            ID: SLS-{sales.id.toString().padStart(3, '0')} • Rate: {sales.commissionRate}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-semibold text-slate-700">{sales.email}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{sales.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                        <div>{sales.achieved}</div>
                                                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{sales.dealsCount} Closing Deal</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap text-sm">
                                                        {sales.commission}
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <StatusBadge status={sales.status === 'active' ? 'active' : 'archived'} />
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <ActionDropdown
                                                            direction={isNearBottom ? 'up' : 'down'}
                                                            items={[
                                                                {
                                                                    label: 'Edit Sales Executive',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.5L16.732 3.732z" />
                                                                        </svg>
                                                                    ),
                                                                    onClick: () => handleOpenEditModal(sales),
                                                                },
                                                                {
                                                                    label: 'Lihat Riwayat Closing Deal',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                                        </svg>
                                                                    ),
                                                                    onClick: () => handleOpenTxModal(sales),
                                                                },
                                                                {
                                                                    label: sales.status === 'archived' ? 'Aktifkan Kembali' : 'Arsipkan Sales',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2m-14 0v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                        </svg>
                                                                    ),
                                                                    variant: sales.status === 'archived' ? 'default' : 'danger',
                                                                    onClick: () => handleToggleArchiveSales(sales.id),
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
