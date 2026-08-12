import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useState } from 'react';

export interface RecentTransactionItem {
    date: string;
    doc: string;
    desc: string;
    client: string;
    status: string;
    amount: string;
}

interface RecentTransactionsCardProps {
    transactions: RecentTransactionItem[];
}

export default function RecentTransactionsCard({
    transactions,
}: RecentTransactionsCardProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return (
        <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                    <h2 className="text-sm font-bold tracking-tight text-slate-800">
                        Transaksi Terakhir
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                        Daftar Jurnal Pembelian & Penjualan Terbaru
                    </p>
                </div>
                <span className="cursor-pointer text-xs font-bold text-primary hover:underline">
                    Lihat Semua
                </span>
            </div>

            {totalItems === 0 ? (
                <EmptyState
                    title="Belum ada transaksi"
                    description="Tidak ada transaksi yang tercatat untuk periode ini."
                />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Dokumen</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Client/Vendor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">
                                        Nominal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {paginatedTransactions.map((tx, idx) => (
                                    <tr
                                        key={idx}
                                        className="transition-colors hover:bg-slate-50/50"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-500">
                                            {tx.date}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                                            {tx.doc}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800">
                                            {tx.desc}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-600">
                                            {tx.client}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={tx.status as any}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-bold text-slate-900">
                                            {tx.amount}
                                        </td>
                                    </tr>
                                ))}
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
    );
}
