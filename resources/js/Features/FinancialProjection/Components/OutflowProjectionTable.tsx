import { formatRupiah } from '@/Utils/formatters';
import React, { useState } from 'react';
import { OutflowItem } from '../types';

interface OutflowProjectionTableProps {
    outflowItems: OutflowItem[];
}

export default function OutflowProjectionTable({
    outflowItems,
}: OutflowProjectionTableProps) {
    const [search, setSearch] = useState('');

    const filtered = outflowItems.filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            item.po_number.toLowerCase().includes(q) ||
            item.vendor_name.toLowerCase().includes(q) ||
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
                        Rincian Pengeluaran Jatuh Tempo (Expected Outflows)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Daftar kewajiban pembayaran PO ke vendor dan estimasi penyetoran PPN akhir bulan ke kas negara.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Cari PO, vendor, project..."
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
                            <th className="px-5 py-3.5">Dokumen & Jatuh Tempo</th>
                            <th className="px-4 py-3.5">Pihak Penerima (Vendor / DJP)</th>
                            <th className="px-4 py-3.5">Project</th>
                            <th className="px-4 py-3.5">Keterangan / Termin</th>
                            <th className="px-4 py-3.5 text-right">Total Kewajiban</th>
                            <th className="px-4 py-3.5 text-right">Sudah Dibayar</th>
                            <th className="px-5 py-3.5 text-right font-bold text-rose-700">
                                Sisa Pengeluaran (Outflow)
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                    {search
                                        ? 'Tidak ditemukan kewajiban pengeluaran yang sesuai pencarian.'
                                        : 'Tidak ada kewajiban pembayaran PO atau PPN yang jatuh tempo pada rentang waktu ini.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((item) => {
                                const isPpn = item.type === 'ppn';

                                return (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors ${
                                            isPpn
                                                ? 'bg-amber-50/40 hover:bg-amber-50/60'
                                                : 'hover:bg-slate-50/60'
                                        }`}
                                    >
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-slate-900">
                                                    {item.po_number}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                                        isPpn
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {isPpn ? 'PPN Pajak' : 'PO Vendor'}
                                                </span>
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
                                                {item.vendor_name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {item.project_name ? (
                                                <div className="text-[11px] text-slate-600">
                                                    <span className="font-mono font-medium text-slate-700">
                                                        {item.project_code}
                                                    </span>{' '}
                                                    - {item.project_name}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                                    isPpn
                                                        ? 'bg-amber-100/80 text-amber-800 font-semibold'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {item.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap text-slate-600">
                                            {formatRupiah(item.total_term_amount)}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono whitespace-nowrap text-slate-500">
                                            {formatRupiah(item.paid_amount)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap text-rose-600">
                                            -{formatRupiah(item.remaining_amount)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-slate-200 bg-slate-50/80 font-semibold text-slate-900">
                                <td colSpan={6} className="px-5 py-3 text-right text-xs">
                                    Total Proyeksi Pengeluaran:
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-sm font-bold text-rose-600 whitespace-nowrap">
                                    -{formatRupiah(totalFilteredRemaining)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
