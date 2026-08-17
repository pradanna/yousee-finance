import { ClientItem } from '@/Components/Form/ClientEditModal';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import Modal from '@/Components/UI/Modal';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatRupiah } from '@/Utils/formatters';
import { useEffect, useState } from 'react';

interface ClientProjectTransaction {
    id: string;
    date: string;
    project: string;
    amount: string;
    fiscal: 'ppn' | 'non-ppn';
    status: 'active' | 'finished' | 'draft';
}

interface ClientTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ClientItem | null;
}

export default function ClientTransactionsModal({
    isOpen,
    onClose,
    client,
}: ClientTransactionsModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<ClientProjectTransaction[]>([]);
    const itemsPerPage = 5;

    useEffect(() => {
        if (isOpen && client) {
            setLoading(true);
            setCurrentPage(1);
            fetch(route('clients.transactions', client.id))
                .then((res) => res.json())
                .then((data) => {
                    const formatted = (data.transactions || []).map(
                        (tx: {
                            id: string;
                            date: string;
                            project_name: string;
                            amount: number;
                            fiscal_mode: 'ppn' | 'non-ppn';
                            status: 'active' | 'finished' | 'draft';
                        }) => ({
                            id: tx.id,
                            date: tx.date,
                            project: tx.project_name || 'Project Utama',
                            amount: formatRupiah(tx.amount),
                            fiscal: tx.fiscal_mode || 'ppn',
                            status: tx.status === 'finished' ? 'finished' : tx.status === 'draft' ? 'draft' : 'active',
                        }),
                    );
                    setTransactions(formatted);
                })
                .catch((err) => {
                    console.error('Failed to load client transactions', err);
                    setTransactions([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setTransactions([]);
        }
    }, [isOpen, client]);

    if (!client) return null;

    // Pagination
    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const formattedTotal =
        typeof client.total === 'number'
            ? formatRupiah(client.total)
            : client.total;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="3xl">
            <div className="space-y-6 p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                    <div className="flex items-start gap-4">
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
                                <h3 className="text-lg font-bold tracking-tight text-slate-800">
                                    Riwayat Transaksi & Proyek
                                </h3>
                                <StatusBadge
                                    status={client.status}
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Client:{' '}
                                <strong className="font-semibold text-slate-700">
                                    {client.name}
                                </strong>{' '}
                                &bull; NPWP: {client.npwp || 'Non-PKP'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Summary Info Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Total Kontrak Proyek
                        </p>
                        <p className="mt-1 font-mono text-base font-bold text-blue-600">
                            {formattedTotal}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Total Proyek / Deals
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-800">
                            {totalItems} Proyek
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            Status Pajak
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                            <span
                                className={`inline-block h-2 w-2 rounded-full ${client.pkp ? 'bg-blue-500' : 'bg-slate-400'}`}
                            />
                            <span className="text-xs font-bold text-slate-700">
                                {client.pkp ? 'PKP (Bisa PPN)' : 'Non-PKP'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        <p className="text-xs text-slate-500">Memuat transaksi client...</p>
                    </div>
                ) : (
                    <>
                        {/* Table Transactions */}
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Kode / ID</th>
                                        <th className="px-5 py-3">Nama Project</th>
                                        <th className="px-5 py-3">Nilai Kontrak</th>
                                        <th className="px-5 py-3">Mode Pajak</th>
                                        <th className="px-5 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {paginatedTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8">
                                                <EmptyState
                                                    title="Belum Ada Transaksi Proyek"
                                                    description="Client ini belum memiliki kontrak proyek atau invoice yang tercatat di sistem."
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedTransactions.map((tx) => (
                                            <tr
                                                key={tx.id}
                                                className="transition-colors hover:bg-slate-50/60"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono font-bold text-blue-600">
                                                        {tx.id}
                                                    </span>
                                                    <span className="block text-[10px] text-slate-400">
                                                        {tx.date}
                                                    </span>
                                                </td>
                                                <td className="max-w-[200px] truncate px-5 py-3.5 font-medium text-slate-800">
                                                    {tx.project}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                                                    {tx.amount}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                                                            tx.fiscal === 'ppn'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        }`}
                                                    >
                                                        {tx.fiscal.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <StatusBadge
                                                        status={tx.status}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}

                {/* Close Button */}
                <div className="flex justify-end border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-800"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
}
