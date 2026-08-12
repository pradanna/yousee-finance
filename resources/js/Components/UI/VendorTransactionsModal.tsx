import { VendorItem } from '@/Components/Form/VendorEditModal';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import Modal from '@/Components/UI/Modal';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useState } from 'react';

interface VendorPoTransaction {
    id: string;
    date: string;
    project: string;
    amount: string;
    fiscal: 'ppn' | 'non-ppn';
    status: 'paid' | 'issued' | 'finished';
}

interface VendorTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: VendorItem | null;
}

export default function VendorTransactionsModal({
    isOpen,
    onClose,
    vendor,
}: VendorTransactionsModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    if (!vendor) return null;

    // Mock PO transactions data based on vendor ID
    const getPoTransactions = (): VendorPoTransaction[] => {
        switch (vendor.id) {
            case 1:
                return [
                    {
                        id: 'PO-2026-001',
                        date: '02 Feb 2026',
                        project: 'Sewa Billboard Sudirman 6 Bulan',
                        amount: 'IDR 25.000.000',
                        fiscal: 'ppn',
                        status: 'paid',
                    },
                    {
                        id: 'PO-2026-004',
                        date: '18 Jan 2026',
                        project: 'Biaya Cetak Flexi Frontlite 440g',
                        amount: 'IDR 12.000.000',
                        fiscal: 'ppn',
                        status: 'finished',
                    },
                    {
                        id: 'PO-2026-008',
                        date: '05 Jan 2026',
                        project: 'Maintenance Frame Neonbox Senayan',
                        amount: 'IDR 8.000.000',
                        fiscal: 'ppn',
                        status: 'finished',
                    },
                ];
            case 2:
                return [
                    {
                        id: 'PO-2026-002',
                        date: '28 Jan 2026',
                        project: 'Konstruksi Mini Megatron Pulogadung',
                        amount: 'IDR 18.300.000',
                        fiscal: 'ppn',
                        status: 'paid',
                    },
                    {
                        id: 'PO-2026-006',
                        date: '12 Jan 2026',
                        project: 'Instalasi Lampu LED Spotlight 100W',
                        amount: 'IDR 6.000.000',
                        fiscal: 'ppn',
                        status: 'finished',
                    },
                ];
            case 3:
                return [
                    {
                        id: 'PO-2026-003',
                        date: '25 Jan 2026',
                        project: 'Sewa Banner Kemang Raya 1 Bulan',
                        amount: 'IDR 3.200.000',
                        fiscal: 'non-ppn',
                        status: 'paid',
                    },
                    {
                        id: 'PO-2026-007',
                        date: '10 Jan 2026',
                        project: 'Pemasangan Stiker Branding Mobil Ops',
                        amount: 'IDR 2.000.000',
                        fiscal: 'non-ppn',
                        status: 'finished',
                    },
                ];
            case 4:
                return [
                    {
                        id: 'PO-2026-005',
                        date: '15 Jan 2026',
                        project: 'Biaya Izin Lokasi Sunset Road Bali',
                        amount: 'IDR 1.500.000',
                        fiscal: 'non-ppn',
                        status: 'finished',
                    },
                ];
            default:
                return [];
        }
    };

    const transactions = getPoTransactions();

    // Pagination
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="6xl" closeable={true}>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-lg font-bold tracking-tight text-slate-900">
                                    {vendor.name}
                                </h3>
                                <StatusBadge
                                    status={vendor.pkp ? 'pkp' : 'non-pkp'}
                                />
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                                Riwayat Transaksi Purchase Order (PO) — Total
                                Belanja Kumulatif:{' '}
                                <span className="font-mono font-bold text-slate-900">
                                    {vendor.total}
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Transactions Table Container */}
                <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                    {totalItems === 0 ? (
                        <EmptyState
                            title="Belum Ada Transaksi PO"
                            description="Vendor ini belum memiliki riwayat transaksi Purchase Order."
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                Nomor PO
                                            </th>
                                            <th className="px-6 py-4">
                                                Tanggal Transaksi
                                            </th>
                                            <th className="px-6 py-4">
                                                Deskripsi / Project PO
                                            </th>
                                            <th className="px-6 py-4">
                                                Skema Pajak
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Nominal PO
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status Transaksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {paginatedTransactions.map((po) => (
                                            <tr
                                                key={po.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-blue-600">
                                                    {po.id}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-500">
                                                    {po.date}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-800">
                                                    {po.project}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                            po.fiscal === 'ppn'
                                                                ? 'border border-blue-100 bg-blue-50 text-blue-700'
                                                                : 'border border-slate-200 bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {po.fiscal === 'ppn'
                                                            ? 'PPN 11%'
                                                            : 'Non-PPN'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-bold text-slate-900">
                                                    {po.amount}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <StatusBadge
                                                        status={po.status}
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
