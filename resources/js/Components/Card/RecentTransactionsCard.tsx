import React, { useState } from 'react';
import StatusBadge from '@/Components/UI/StatusBadge';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';

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

export default function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalItems = transactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    const paginatedTransactions = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-tight">Transaksi Terakhir</h2>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Daftar Jurnal Pembelian & Penjualan Terbaru</p>
                </div>
                <span className="text-xs font-bold text-primary hover:underline cursor-pointer">Lihat Semua</span>
            </div>

            {totalItems === 0 ? (
                <EmptyState title="Belum ada transaksi" description="Tidak ada transaksi yang tercatat untuk periode ini." />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Dokumen</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Client/Vendor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {paginatedTransactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500 whitespace-nowrap">{tx.date}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">{tx.doc}</td>
                                        <td className="px-6 py-4 text-slate-800 font-semibold">{tx.desc}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-600">{tx.client}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={tx.status as any} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{tx.amount}</td>
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
