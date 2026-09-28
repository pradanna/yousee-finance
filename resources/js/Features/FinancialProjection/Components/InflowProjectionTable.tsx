import { formatRupiah } from '@/Utils/formatters';
import React, { useState } from 'react';
import { InflowItem } from '../types';

interface InflowProjectionTableProps {
    inflowItems: InflowItem[];
}

export default function InflowProjectionTable({
    inflowItems,
}: InflowProjectionTableProps) {
    const [search, setSearch] = useState('');

    const filtered = inflowItems.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.invoice_number.toLowerCase().includes(q) ||
            item.client_name.toLowerCase().includes(q) ||
            (item.project_name && item.project_name.toLowerCase().includes(q)) ||
            (item.project_code && item.project_code.toLowerCase().includes(q)) ||
            item.label.toLowerCase().includes(q)
        );
    });

    const totalFilteredRemaining = filtered.reduce(
        (sum, item) => sum + item.remaining_amount,
        0,
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">
                        Rincian Piutang Jatuh Tempo (Expected Inflows)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Daftar termin invoice penjualan kepada klien yang diproyeksikan akan cair.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Cari invoice, klien, project..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-3.5">Invoice & Jatuh Tempo</th>
                            <th className="px-4 py-3.5">Klien & Project</th>
                            <th className="px-4 py-3.5">Termin / Label</th>
                            <th className="px-4 py-3.5 text-right">Nilai Termin</th>
                            <th className="px-4 py-3.5 text-right">Sudah Dibayar</th>
                            <th className="px-5 py-3.5 text-right font-bold text-emerald-700">
                                Sisa Tagihan (Inflow)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                                    {search
                                        ? 'Tidak ditemukan tagihan invoice yang sesuai pencarian.'
                                        : 'Tidak ada tagihan piutang invoice yang jatuh tempo pada rentang waktu ini.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <div className="font-semibold text-slate-900">
                                            {item.invoice_number}
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span className="font-mono text-[11px] text-slate-500">
                                                {item.due_date}
                                            </span>
                                            {item.is_overdue && (
                                                <span className="inline-flex items-center rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="font-medium text-slate-900">
                                            {item.client_name}
                                        </div>
                                        {item.project_name && (
                                            <div className="text-[11px] text-slate-500">
                                                <span className="font-mono font-medium text-slate-600">
                                                    {item.project_code}
                                                </span>{' '}
                                                - {item.project_name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                            {item.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap text-slate-600">
                                        {formatRupiah(item.total_term_amount)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap text-slate-500">
                                        {formatRupiah(item.paid_amount)}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap text-emerald-600">
                                        +{formatRupiah(item.remaining_amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-slate-200 bg-slate-50/80 font-semibold text-slate-900">
                                <td colSpan={5} className="px-5 py-3 text-right text-xs">
                                    Total Proyeksi Piutang Masuk:
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-sm font-bold text-emerald-600 whitespace-nowrap">
                                    +{formatRupiah(totalFilteredRemaining)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
