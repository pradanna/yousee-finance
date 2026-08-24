import MonthPicker from '@/Components/Form/MonthPicker';
import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import { getEfakturBadge } from '../Components/DetailFakturModal';
import { fmt, formatDateIndo, PpnMasukanItem } from '../ppnTypes';

interface PpnMasukanTabProps {
    items: PpnMasukanItem[];
    paginatedItems: PpnMasukanItem[];
    currentPage: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onViewDetail: (item: PpnMasukanItem) => void;
    onEditNsfp: (item: PpnMasukanItem) => void;
    onToggleStatus: (item: PpnMasukanItem) => void;
    searchQuery: string;
    onSearchQueryChange: (q: string) => void;
    statusFilter: string;
    onStatusFilterChange: (s: string) => void;
    selectedMonth: string;
    selectedYear: string;
    onPeriodChange: (year: string, month: string) => void;
    isPeriodLocked?: boolean;
}

export default function PpnMasukanTab({
    items,
    paginatedItems,
    currentPage,
    onPageChange,
    itemsPerPage,
    onViewDetail,
    onEditNsfp,
    onToggleStatus,
    searchQuery,
    onSearchQueryChange,
    statusFilter,
    onStatusFilterChange,
    selectedMonth,
    selectedYear,
    onPeriodChange,
    isPeriodLocked = false,
}: PpnMasukanTabProps) {
    const getMasukanActionItems = (m: PpnMasukanItem): ActionMenuItem[] => {
        const actionItems: ActionMenuItem[] = [
            {
                label: 'Detail Faktur Masukan',
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
                onClick: () => onViewDetail(m),
            },
        ];

        // Jika periode tidak dikunci, izinkan edit NSFP & toggle status e-Faktur
        if (!isPeriodLocked) {
            actionItems.push({
                label: 'Edit NSFP Vendor',
                icon: (
                    <svg
                        className="h-4 w-4 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                ),
                onClick: () => onEditNsfp(m),
            });

            if (m.efakturStatus === 'approved') {
                actionItems.push({
                    label: 'Kembalikan ke Siap Upload',
                    icon: (
                        <svg
                            className="h-4 w-4 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    ),
                    onClick: () => onToggleStatus(m),
                });
            } else {
                actionItems.push({
                    label: 'Tandai Sudah Di-upload ke DJP',
                    icon: (
                        <svg
                            className="h-4 w-4 text-emerald-600"
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
                    ),
                    onClick: () => onToggleStatus(m),
                });
            }
        }

        return actionItems;
    };

    return (
        <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
                <div className="space-y-1 lg:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Pencarian Faktur Masukan
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) =>
                                onSearchQueryChange(e.target.value)
                            }
                            placeholder="Cari NSFP Vendor, No. PO, Vendor, atau NPWP..."
                            className="shadow-2xs w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all focus:border-primary focus:outline-none"
                        />
                        <svg
                            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Status e-Faktur / Pengkreditan
                    </label>
                    <SelectInput
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        options={[
                            {
                                value: 'all',
                                label: 'Semua Status e-Faktur',
                            },
                            {
                                value: 'approved',
                                label: '✓ Sukses Upload DJP',
                            },
                            {
                                value: 'ready',
                                label: 'Siap Upload DJP',
                            },
                            {
                                value: 'draft',
                                label: 'Draft',
                            },
                            {
                                value: 'creditable',
                                label: 'Dapat Dikreditkan',
                            },
                        ]}
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Masa Pajak
                    </label>
                    <MonthPicker
                        value={
                            selectedYear !== 'all' && selectedMonth !== 'all'
                                ? `${selectedYear}-${selectedMonth}`
                                : 'all'
                        }
                        onChange={(_val, yr, mo) => onPeriodChange(yr, mo)}
                        allowAll={true}
                        allLabel="Semua Masa Pajak"
                        className="w-full [&>button]:w-full [&>button]:justify-between [&>button]:py-2.5"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-4">NSFP Vendor</th>
                                <th className="px-6 py-4">No. PO & Tanggal</th>
                                <th className="px-6 py-4">
                                    Vendor Partner & NPWP
                                </th>
                                <th className="px-6 py-4 text-right">
                                    DPP (IDR)
                                </th>
                                <th className="px-6 py-4 text-right">
                                    PPN 11% (IDR)
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Status Pengkreditan
                                </th>
                                <th className="px-6 py-4 text-center">
                                    Status e-Faktur
                                </th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedItems.map((m) => (
                                <tr
                                    key={m.id}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                        {m.nsfp}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono font-bold text-amber-700">
                                            {m.docNo}
                                        </div>
                                        <div className="text-[10.5px] font-medium text-slate-400">
                                            {formatDateIndo(m.date)}
                                        </div>
                                        {m.projectName &&
                                            m.projectName !== '-' && (
                                                <div className="mt-0.5 inline-block rounded border border-amber-100 bg-amber-50/60 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800">
                                                    📁 {m.projectName}
                                                </div>
                                            )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">
                                            {m.vendor}
                                        </div>
                                        <div className="font-mono text-[10px] text-slate-400">
                                            NPWP: {m.npwp}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                        {fmt(m.dpp)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                                        {fmt(m.ppn)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                        <span
                                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                                m.creditableStatus ===
                                                'creditable'
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'border-slate-200 bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {m.creditableStatus === 'creditable'
                                                ? 'Dapat Dikreditkan'
                                                : 'Tidak Dikreditkan'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                        {getEfakturBadge(m.efakturStatus)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                        <ActionDropdown
                                            items={getMasukanActionItems(m)}
                                        />
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center"
                                    >
                                        <EmptyState
                                            title="Belum Ada Faktur Masukan"
                                            message="Tidak ditemukan faktur PPN Masukan yang sesuai dengan pencarian."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {items.length > 0 && (
                    <div className="border-t border-slate-100 p-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(items.length / itemsPerPage)}
                            totalItems={items.length}
                            itemsPerPage={itemsPerPage}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
