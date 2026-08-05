import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import TextInput from '@/Components/Form/TextInput';
import SelectInput from '@/Components/Form/SelectInput';
import StatusBadge from '@/Components/UI/StatusBadge';
import MetricCard from '@/Components/Card/MetricCard';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import ClientFormModal, { ClientFormData } from '@/Components/Form/ClientFormModal';
import ClientEditModal, { ClientItem } from '@/Components/Form/ClientEditModal';
import ClientTransactionsModal from '@/Components/UI/ClientTransactionsModal';

export default function Clients() {
    const fiscalMode = useFiscalMode();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pkpFilter, setPkpFilter] = useState<'all' | 'pkp' | 'non-pkp'>('all');
    const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>('active');
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals state for Edit & View Invoices
    const [selectedClientForEdit, setSelectedClientForEdit] = useState<ClientItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedClientForTx, setSelectedClientForTx] = useState<ClientItem | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [clients, setClients] = useState<ClientItem[]>([
        { id: 1, name: 'PT. Gojek Tokopedia', npwp: '01.555.666.7-001.000', email: 'billing@gotocompany.com', phone: '021-30005000', address: 'Pasaraya Blok M Gedung B, Jakarta Selatan', pkp: true, status: 'active', count: 18, total: 'IDR 150.000.000' },
        { id: 2, name: 'Shopee Indonesia', npwp: '02.444.888.9-002.000', email: 'finance@shopee.co.id', phone: '021-80647100', address: 'Pacific Century Place Tower Lt. 26, SCBD, Jakarta Selatan', pkp: true, status: 'active', count: 14, total: 'IDR 240.000.000' },
        { id: 3, name: 'Traveloka Corp', npwp: '', email: 'ap@traveloka.com', phone: '021-29775800', address: 'Wisma Barito Pacific Tower B, Jakarta Barat', pkp: false, status: 'active', count: 9, total: 'IDR 85.000.000' },
        { id: 4, name: 'PT. Toko Kelontong Jaya', npwp: '', email: 'kelontong@jaya.id', phone: '0813-9999-8888', address: 'Jl. Ahmad Yani No. 100, Semarang', pkp: false, status: 'archived', count: 2, total: 'IDR 15.000.000' },
    ]);

    const handleAddClient = (formData: ClientFormData) => {
        const newClient: ClientItem = {
            id: clients.length + 1,
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
        setClients([newClient, ...clients]);
        setAlertMessage(`Client "${formData.name}" berhasil didaftarkan.`);
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenEditModal = (client: ClientItem) => {
        setSelectedClientForEdit(client);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedClient = (updated: ClientItem) => {
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        setAlertMessage(`Perubahan data client "${updated.name}" berhasil disimpan.`);
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleOpenTxModal = (client: ClientItem) => {
        setSelectedClientForTx(client);
        setIsTxModalOpen(true);
    };

    const handleToggleArchiveClient = (clientId: number) => {
        setClients(prev => prev.map(c => {
            if (c.id === clientId) {
                const newStatus: 'active' | 'archived' = c.status === 'archived' ? 'active' : 'archived';
                const actionText = newStatus === 'archived' ? 'diarsipkan' : 'diaktifkan kembali';
                setAlertMessage(`Client "${c.name}" berhasil ${actionText}.`);
                setTimeout(() => setAlertMessage(null), 4000);
                return { ...c, status: newStatus };
            }
            return c;
        }));
    };

    const getClientStats = (client: ClientItem) => {
        if (client.id > 4) {
            return { count: client.count, total: client.total };
        }
        if (fiscalMode === 'ppn') {
            switch (client.id) {
                case 1: return { count: 18, total: 'IDR 150.000.000' };
                case 2: return { count: 14, total: 'IDR 240.000.000' };
                case 3: return { count: 9, total: 'IDR 85.000.000' };
                case 4: return { count: 2, total: 'IDR 15.000.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        } else {
            switch (client.id) {
                case 1: return { count: 10, total: 'IDR 90.000.000' };
                case 2: return { count: 8, total: 'IDR 145.000.000' };
                case 3: return { count: 6, total: 'IDR 55.000.000' };
                case 4: return { count: 2, total: 'IDR 15.000.000' };
                default: return { count: 0, total: 'IDR 0' };
            }
        }
    };

    // Filtering
    const filteredClients = useMemo(() => {
        return clients.filter((c) => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.npwp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesPkp =
                pkpFilter === 'all' ||
                (pkpFilter === 'pkp' && c.pkp) ||
                (pkpFilter === 'non-pkp' && !c.pkp);

            const matchesStatus =
                statusTab === 'all' ||
                (statusTab === 'active' && c.status === 'active') ||
                (statusTab === 'archived' && c.status === 'archived');

            return matchesSearch && matchesPkp && matchesStatus;
        });
    }, [clients, searchQuery, pkpFilter, statusTab]);

    // Pagination
    const totalItems = filteredClients.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedClients = useMemo(() => {
        return filteredClients.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredClients, currentPage, itemsPerPage]);

    // Counts
    const totalClientCount = clients.length;
    const activeCount = clients.filter((c) => c.status === 'active').length;
    const archivedCount = clients.filter((c) => c.status === 'archived').length;
    const pkpCount = clients.filter((c) => c.pkp).length;

    return (
        <AppLayout
            activePage="clients"
            title="Direktori Client"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Data Master' }, { label: 'Client' }]}
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
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Direktori Pelanggan / Client</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Kelola data mitra pengiklan Yousee Indonesia untuk penagihan Invoice</p>
                    </div>
                    <PrimaryButton onClick={() => setIsAddModalOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Daftarkan Client Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Client Terdaftar"
                        value={`${totalClientCount} Client`}
                        badgeText="Mitra Pengiklan"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title="Status PKP (Wajib PPN)"
                        value={`${pkpCount} Client`}
                        badgeText="Faktur Pajak"
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Mode Pajak Aktif"
                        value={fiscalMode === 'ppn' ? 'Mode PPN (PKP)' : 'Mode Non-PPN'}
                        badgeText="Fiskal"
                        cardBgClass="bg-slate-100/80 border-slate-200/80 shadow-xs"
                        badgeColorClass="bg-white/90 text-slate-800 border-slate-200/60"
                        icon={
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Client</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <TextInput
                                type="text"
                                placeholder="Cari nama client, NPWP, atau email..."
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
                        {/* Status Client Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Client</label>
                            <SelectInput
                                value={statusTab}
                                onChange={(e) => {
                                    setStatusTab(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-44 text-xs"
                            >
                                <option value="active">Client Aktif ({activeCount})</option>
                                <option value="archived">Client Diarsipkan ({archivedCount})</option>
                                <option value="all">Semua Client ({totalClientCount})</option>
                            </SelectInput>
                        </div>

                        {/* Status PKP Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status PKP</label>
                            <SelectInput
                                value={pkpFilter}
                                onChange={(e) => {
                                    setPkpFilter(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-44 text-xs"
                            >
                                <option value="all">Semua Status PKP</option>
                                <option value="pkp">PKP (Wajib PPN)</option>
                                <option value="non-pkp">Non-PKP (Bebas PPN)</option>
                            </SelectInput>
                        </div>
                    </div>
                </div>

                {/* Clients Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {totalItems === 0 ? (
                        <EmptyState
                            title="Client Tidak Ditemukan"
                            description={
                                statusTab === 'archived'
                                    ? 'Belum ada client yang diarsipkan.'
                                    : 'Tidak ada data client yang cocok dengan pencarian atau filter Anda.'
                            }
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                            <th className="px-6 py-4">Nama Client</th>
                                            <th className="px-6 py-4">NPWP Resmi</th>
                                            <th className="px-6 py-4">Kontak (Email / Telepon)</th>
                                            <th className="px-6 py-4">Status PKP</th>
                                            <th className="px-6 py-4 text-right">Total Pendapatan ({fiscalMode === 'ppn' ? 'PPN' : 'Non-PPN'})</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                        {paginatedClients.map((client, idx) => {
                                            const stats = getClientStats(client);
                                            const isNearBottom = idx >= paginatedClients.length - 2;
                                            return (
                                                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{client.name}</span>
                                                            {client.status === 'archived' && (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                                    Diarsipkan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">
                                                            ID: CLI-{client.id.toString().padStart(3, '0')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 font-bold">
                                                        {client.npwp || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-semibold text-slate-700">{client.email}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{client.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <StatusBadge status={client.pkp ? 'pkp' : 'non-pkp'} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="font-mono font-bold text-slate-900 text-xs">{stats.total}</div>
                                                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{stats.count} Transaksi Invoice</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <ActionDropdown
                                                            direction={isNearBottom ? 'up' : 'down'}
                                                            items={[
                                                                {
                                                                    label: 'Edit Client',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.5L16.732 3.732z" />
                                                                        </svg>
                                                                    ),
                                                                    onClick: () => handleOpenEditModal(client),
                                                                },
                                                                {
                                                                    label: 'Lihat Transaksi Invoice',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    ),
                                                                    onClick: () => handleOpenTxModal(client),
                                                                },
                                                                {
                                                                    label: client.status === 'archived' ? 'Aktifkan Kembali' : 'Arsipkan Client',
                                                                    icon: (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 012-2h10a2 2 0 012 2m-14 0v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                                        </svg>
                                                                    ),
                                                                    variant: client.status === 'archived' ? 'default' : 'danger',
                                                                    onClick: () => handleToggleArchiveClient(client.id),
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

                {/* Register New Client Modal */}
                <ClientFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSubmit={handleAddClient}
                />

                {/* Edit Client Modal */}
                <ClientEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    client={selectedClientForEdit}
                    onSubmit={handleSaveEditedClient}
                />

                {/* View Client Invoice Transactions Modal */}
                <ClientTransactionsModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    client={selectedClientForTx}
                />
            </div>
        </AppLayout>
    );
}
