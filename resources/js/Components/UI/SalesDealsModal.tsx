import MonthPicker from '@/Components/Form/MonthPicker';
import { SalesItem } from '@/Components/Form/SalesEditModal';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import Modal from '@/Components/UI/Modal';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useMemo, useState } from 'react';

interface SalesDealTransaction {
    id: string;
    clientName: string;
    date: string;
    monthKey: string; // Format: "YYYY-MM"
    project: string;
    amount: string;
    amountVal: number;
    commissionAmount: string;
    commissionVal: number;
    fiscal: 'ppn' | 'non-ppn';
    status: 'paid' | 'issued' | 'finished';
}

interface SalesDealsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sales: SalesItem | null;
}

const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export default function SalesDealsModal({
    isOpen,
    onClose,
    sales,
}: SalesDealsModalProps) {
    const [selectedMonth, setSelectedMonth] =
        useState<string>(getCurrentMonthKey);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // All hooks MUST be declared before any early returns to prevent "Rendered more hooks" React error
    const allTransactions = useMemo<SalesDealTransaction[]>(() => {
        if (!sales) return [];
        switch (sales.id) {
            case 1:
                return [
                    {
                        id: 'DEAL-2026-001',
                        clientName: 'PT. Gojek Tokopedia',
                        date: '01 Feb 2026',
                        monthKey: '2026-02',
                        project: 'Campaign Ads Billboard Sudirman Q1',
                        amount: 'Rp 200.000.000',
                        amountVal: 200000000,
                        commissionAmount: 'Rp 4.000.000',
                        commissionVal: 4000000,
                        fiscal: 'ppn',
                        status: 'paid',
                    },
                    {
                        id: 'DEAL-2026-004',
                        clientName: 'Traveloka Corp',
                        date: '15 Jan 2026',
                        monthKey: '2026-01',
                        project: 'Branding Transjakarta GoFood 3 Bulan',
                        amount: 'Rp 120.000.000',
                        amountVal: 120000000,
                        commissionAmount: 'Rp 2.400.000',
                        commissionVal: 2400000,
                        fiscal: 'non-ppn',
                        status: 'finished',
                    },
                ];
            case 2:
                return [
                    {
                        id: 'DEAL-2026-002',
                        clientName: 'Shopee Indonesia',
                        date: '26 Feb 2026',
                        monthKey: '2026-02',
                        project: 'Videotron Megatron SCBD 1 Bulan',
                        amount: 'Rp 180.000.000',
                        amountVal: 180000000,
                        commissionAmount: 'Rp 3.600.000',
                        commissionVal: 3600000,
                        fiscal: 'ppn',
                        status: 'paid',
                    },
                ];
            case 3:
                return [
                    {
                        id: 'DEAL-2026-003',
                        clientName: 'PT. Toko Kelontong Jaya',
                        date: '20 Jan 2026',
                        monthKey: '2026-01',
                        project: 'Promosi Banner Barito Tower Jakarta Barat',
                        amount: 'Rp 50.000.000',
                        amountVal: 50000000,
                        commissionAmount: 'Rp 1.000.000',
                        commissionVal: 1000000,
                        fiscal: 'non-ppn',
                        status: 'finished',
                    },
                ];
            default:
                return [];
        }
    }, [sales]);

    // Filter by selected month
    const filteredTransactions = useMemo(() => {
        if (!selectedMonth) return allTransactions;
        return allTransactions.filter((t) => t.monthKey === selectedMonth);
    }, [allTransactions, selectedMonth]);

    // Calculate totals for selected month
    const monthTotalOmset = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + t.amountVal, 0);
    }, [filteredTransactions]);

    const monthTotalCommission = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, t) => acc + t.commissionVal,
            0,
        );
    }, [filteredTransactions]);

    // Pagination
    const totalItems = filteredTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedTransactions = useMemo(() => {
        return filteredTransactions.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        );
    }, [filteredTransactions, currentPage, itemsPerPage]);

    // Render early return AFTER all hooks
    if (!sales) return null;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="6xl" closeable={true}>
            <div className="space-y-6 p-6">
                {/* Header with MonthPicker Filter */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                            <svg
                                className="h-6 w-6"
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
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                                    {sales.name}
                                </h3>
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                    Rate Komisi: {sales.commissionRate}%
                                </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                                Rincian Pencapaian Omset — Total Omset:{' '}
                                <span className="font-mono font-bold text-slate-900">
                                    Rp {monthTotalOmset.toLocaleString('id-ID')}
                                </span>{' '}
                                | Estimasi Komisi:{' '}
                                <span className="font-mono font-bold text-emerald-600">
                                    Rp{' '}
                                    {monthTotalCommission.toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Month Picker Filter */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Filter Periode Bulan
                            </label>
                            <MonthPicker
                                value={selectedMonth}
                                onChange={(newVal) => {
                                    setSelectedMonth(newVal);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Deals Table Container */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    {totalItems === 0 ? (
                        <EmptyState
                            title="Tidak Ada Closing Deal Pada Periode Ini"
                            description="Sales executive ini belum memiliki riwayat closing deal pada bulan yang dipilih."
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                ID Closing
                                            </th>
                                            <th className="px-6 py-4">
                                                Tanggal Closing
                                            </th>
                                            <th className="px-6 py-4">
                                                Client
                                            </th>
                                            <th className="px-6 py-4">
                                                Project / Campaign
                                            </th>
                                            <th className="px-6 py-4">
                                                Skema Pajak
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Nominal Omset
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Komisi ({sales.commissionRate}%)
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {paginatedTransactions.map((deal) => (
                                            <tr
                                                key={deal.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-blue-600">
                                                    {deal.id}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-500">
                                                    {deal.date}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-800">
                                                    {deal.clientName}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-700">
                                                    {deal.project}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                            deal.fiscal ===
                                                            'ppn'
                                                                ? 'border border-blue-100 bg-blue-50 text-blue-700'
                                                                : 'border border-slate-200 bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {deal.fiscal === 'ppn'
                                                            ? 'PPN 11%'
                                                            : 'Non-PPN'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-bold text-slate-900">
                                                    {deal.amount}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-bold text-emerald-600">
                                                    {deal.commissionAmount}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <StatusBadge
                                                        status={deal.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination component inside Modal */}
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
            </div>
        </Modal>
    );
}
