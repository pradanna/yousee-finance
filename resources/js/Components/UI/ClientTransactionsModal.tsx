import React, { useState } from 'react';
import Modal from '@/Components/UI/Modal';
import StatusBadge from '@/Components/UI/StatusBadge';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import { ClientItem } from '@/Components/Form/ClientEditModal';

interface ClientInvoiceTransaction {
    id: string;
    date: string;
    project: string;
    amount: string;
    fiscal: 'ppn' | 'non-ppn';
    status: 'paid' | 'issued' | 'finished';
}

interface ClientTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ClientItem | null;
}

export default function ClientTransactionsModal({ isOpen, onClose, client }: ClientTransactionsModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    if (!client) return null;

    // Mock Invoice transactions data based on client ID
    const getInvoiceTransactions = (): ClientInvoiceTransaction[] => {
        switch (client.id) {
            case 1:
                return [
                    { id: 'INV-2026-001', date: '01 Feb 2026', project: 'Campaign Ads Billboard Sudirman Q1', amount: 'IDR 85.000.000', fiscal: 'ppn', status: 'paid' },
                    { id: 'INV-2026-004', date: '15 Jan 2026', project: 'Branding Transjakarta GoFood 3 Bulan', amount: 'IDR 65.000.000', fiscal: 'ppn', status: 'finished' },
                ];
            case 2:
                return [
                    { id: 'INV-2026-002', date: '26 Jan 2026', project: 'Videotron Megatron SCBD 1 Bulan', amount: 'IDR 140.000.000', fiscal: 'ppn', status: 'paid' },
                    { id: 'INV-2026-006', date: '10 Jan 2026', project: 'Sewa LED Screen Pacific Place 2 Minggu', amount: 'IDR 100.000.000', fiscal: 'ppn', status: 'finished' },
                ];
            case 3:
                return [
                    { id: 'INV-2026-003', date: '20 Jan 2026', project: 'Promosi Banner Barito Tower Jakarta Barat', amount: 'IDR 55.000.000', fiscal: 'non-ppn', status: 'paid' },
                    { id: 'INV-2026-007', date: '08 Jan 2026', project: 'Maintenance Banner Promosi Traveloka', amount: 'IDR 30.000.000', fiscal: 'non-ppn', status: 'finished' },
                ];
            case 4:
                return [
                    { id: 'INV-2026-005', date: '12 Jan 2026', project: 'Sewa Baliho Ahmad Yani Semarang', amount: 'IDR 15.000.000', fiscal: 'non-ppn', status: 'finished' },
                ];
            default:
                return [];
        }
    };

    const transactions = getInvoiceTransactions();

    // Pagination
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="6xl" closeable={true}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{client.name}</h3>
                                <StatusBadge status={client.pkp ? 'pkp' : 'non-pkp'} />
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Riwayat Transaksi Invoice Penjualan — Total Pendapatan Kumulatif: <span className="font-mono font-bold text-slate-900">{client.total}</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Transactions Table Container */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {totalItems === 0 ? (
                        <EmptyState
                            title="Belum Ada Transaksi Invoice"
                            description="Client ini belum memiliki riwayat transaksi Invoice Penjualan."
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                            <th className="px-6 py-4">Nomor Invoice</th>
                                            <th className="px-6 py-4">Tanggal Transaksi</th>
                                            <th className="px-6 py-4">Deskripsi / Project Campaign</th>
                                            <th className="px-6 py-4">Skema Pajak</th>
                                            <th className="px-6 py-4 text-right">Nominal Invoice</th>
                                            <th className="px-6 py-4 text-center">Status Transaksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                        {paginatedTransactions.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                    {inv.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                                                    {inv.date}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-800">
                                                    {inv.project}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                        inv.fiscal === 'ppn' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {inv.fiscal === 'ppn' ? 'PPN 11%' : 'Non-PPN'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-sm">
                                                    {inv.amount}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <StatusBadge status={inv.status} />
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
