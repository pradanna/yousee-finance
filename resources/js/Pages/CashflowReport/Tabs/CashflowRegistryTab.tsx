import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import { useMemo, useState } from 'react';
import {
    BankAccountBalance,
    CashflowEntry,
    fmt,
    formatDateIndo,
    ProjectOption,
} from '../cashflowTypes';

interface CashflowRegistryTabProps {
    entries: CashflowEntry[];
    bankAccounts: BankAccountBalance[];
    projects: ProjectOption[];
    onViewDetail: (entry: CashflowEntry) => void;
}

const ITEMS_PER_PAGE = 10;

export default function CashflowRegistryTab({
    entries,
    bankAccounts,
    projects,
    onViewDetail,
}: CashflowRegistryTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [accountFilter, setAccountFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter Logic
    const filteredEntries = useMemo(() => {
        return entries.filter((item) => {
            const matchesSearch =
                item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.partnerName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (item.projectName &&
                    item.projectName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            const matchesAccount =
                accountFilter === 'all' || item.accountCode === accountFilter;
            const matchesCategory =
                categoryFilter === 'all' || item.category === categoryFilter;
            const matchesType =
                typeFilter === 'all' || item.type === typeFilter;
            const matchesProject =
                projectFilter === 'all' ||
                (item.projectCode && item.projectCode === projectFilter);

            return (
                matchesSearch &&
                matchesAccount &&
                matchesCategory &&
                matchesType &&
                matchesProject
            );
        });
    }, [
        entries,
        searchQuery,
        accountFilter,
        categoryFilter,
        typeFilter,
        projectFilter,
    ]);

    // Paginated Dataset
    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEntries.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEntries, currentPage]);

    const getActivityBadge = (cat: string, isInternalTransfer: boolean) => {
        if (isInternalTransfer) {
            return (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Transfer Bank
                </span>
            );
        }
        switch (cat) {
            case 'operating':
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Operasional
                    </span>
                );
            case 'investing':
                return (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        Investasi Aset
                    </span>
                );
            case 'financing':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Pendanaan
                    </span>
                );
            default:
                return (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        Umum
                    </span>
                );
        }
    };

    const getRowActionItems = (cf: CashflowEntry): ActionMenuItem[] => {
        return [
            {
                label: 'Lihat Detail Mutasi',
                icon: (
                    <svg
                        className="h-4 w-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                ),
                onClick: () => onViewDetail(cf),
            },
        ];
    };

    return (
        <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                {/* Search Bar */}
                <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pencarian Mutasi
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Cari deskripsi, partner, ref no..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
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
                </div>

                {/* Filter Rekening Kas / Bank */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Akun Kas / Bank
                    </label>
                    <SelectInput
                        value={accountFilter}
                        onChange={(e) => {
                            setAccountFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Semua Rekening Kas</option>
                        {bankAccounts.map((b) => (
                            <option key={b.code} value={b.code}>
                                {b.code} - {b.bankName}
                            </option>
                        ))}
                    </SelectInput>
                </div>

                {/* Filter Kategori Aktivitas */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Kategori PSAK
                    </label>
                    <SelectInput
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Semua Kategori</option>
                        <option value="operating">Aktivitas Operasi</option>
                        <option value="investing">Aktivitas Investasi</option>
                        <option value="financing">Aktivitas Pendanaan</option>
                        <option value="transfer">Transfer Kas Internal</option>
                    </SelectInput>
                </div>

                {/* Filter Jenis Arus Kas */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Jenis Kas
                    </label>
                    <SelectInput
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Semua Jenis</option>
                        <option value="inflow">Kas Masuk (+)</option>
                        <option value="outflow">Kas Keluar (-)</option>
                    </SelectInput>
                </div>

                {/* Filter Proyek */}
                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Filter Proyek
                    </label>
                    <SelectInput
                        value={projectFilter}
                        onChange={(e) => {
                            setProjectFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">Semua Proyek</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.code}>
                                {p.code} - {p.name}
                            </option>
                        ))}
                    </SelectInput>
                </div>
            </div>

            {/* Registry Table */}
            <div className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-4 py-3.5">Tanggal & Ref</th>
                                <th className="px-4 py-3.5">Rekening Bank</th>
                                <th className="px-4 py-3.5">
                                    Deskripsi & Partner
                                </th>
                                <th className="px-4 py-3.5">Kategori</th>
                                <th className="px-4 py-3.5 text-right">
                                    Kas Masuk (In)
                                </th>
                                <th className="px-4 py-3.5 text-right">
                                    Kas Keluar (Out)
                                </th>
                                <th className="px-4 py-3.5 text-right">
                                    Saldo Berjalan
                                </th>
                                <th className="px-4 py-3.5 text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {paginatedEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8">
                                        <EmptyState
                                            title="Tidak Ada Mutasi Kas"
                                            description="Belum ada transaksi penerimaan atau pengeluaran kas pada periode ini."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                paginatedEntries.map((item) => {
                                    const isDebit = item.type === 'inflow';
                                    return (
                                        <tr
                                            key={item.uuid}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span className="font-bold text-slate-900">
                                                    {formatDateIndo(item.date)}
                                                </span>
                                                <span className="block text-[10px] font-bold text-slate-400">
                                                    {item.refNo}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-800">
                                                    {item.accountCode}
                                                </span>
                                                <span className="block max-w-[140px] truncate text-[10px] text-slate-500">
                                                    {item.accountName}
                                                </span>
                                            </td>

                                            <td className="max-w-md px-4 py-3">
                                                {/* Baris 1: Kategori / Nama Akun Lawan (e.g. Beban Perlengkapan & ATK Kantor) */}
                                                <div className="font-bold text-slate-900 leading-tight">
                                                    {item.contraName || item.accountName}
                                                </div>

                                                {/* Baris 2: Keterangan / Memo Transaksi Asli (e.g. asdasd / Pembelian buku) */}
                                                {item.description && (
                                                    <div className="mt-0.5 text-xs text-slate-600 font-normal">
                                                        {item.description}
                                                    </div>
                                                )}

                                                {/* Baris 3: Info Partner & Proyek */}
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {item.partnerName}
                                                    </span>
                                                    {item.projectName && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="max-w-[160px] truncate font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                                                {item.projectName}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {getActivityBadge(
                                                    item.category,
                                                    item.isInternalTransfer,
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-emerald-600">
                                                {isDebit
                                                    ? `+${fmt(item.amount)}`
                                                    : '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-rose-600">
                                                {!isDebit
                                                    ? `-${fmt(item.amount)}`
                                                    : '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right font-black text-slate-900">
                                                {item.runningBalance !==
                                                undefined
                                                    ? fmt(item.runningBalance)
                                                    : '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-center">
                                                <ActionDropdown
                                                    items={getRowActionItems(
                                                        item,
                                                    )}
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
                {filteredEntries.length > ITEMS_PER_PAGE && (
                    <div className="border-t border-slate-100 p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(
                                filteredEntries.length / ITEMS_PER_PAGE,
                            )}
                            totalItems={filteredEntries.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
