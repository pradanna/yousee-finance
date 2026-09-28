import { formatRupiah } from '@/Utils/formatters';
import React from 'react';
import { ProjectionTimelineItem } from '../types';

interface ProjectionTimelineTableProps {
    timeline: ProjectionTimelineItem[];
    onSelectDay?: (date: string) => void;
}

export default function ProjectionTimelineTable({
    timeline,
    onSelectDay,
}: ProjectionTimelineTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">
                            Simulasi Arus Kas Harian (Timeline)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Estimasi saldo kas berjalan hari demi hari berdasarkan tanggal jatuh tempo invoice, PO, dan PPN.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-600">Pemasukan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                            <span className="text-slate-600">Pengeluaran PO</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            <span className="text-slate-600">PPN Akhir Bulan</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="px-5 py-3.5">Tanggal & Hari</th>
                            <th className="px-4 py-3.5 text-right text-emerald-700">Piutang Cair (Inflow)</th>
                            <th className="px-4 py-3.5 text-right text-rose-700">Hutang PO (Outflow)</th>
                            <th className="px-4 py-3.5 text-right text-amber-700">PPN Akhir Bulan</th>
                            <th className="px-4 py-3.5 text-right text-slate-700">Total Pengeluaran</th>
                            <th className="px-4 py-3.5 text-right text-slate-700">Net Harian</th>
                            <th className="px-5 py-3.5 text-right font-bold text-slate-900">Saldo Berjalan (Kas)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                        {timeline.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                    Tidak ada data timeline untuk rentang waktu yang dipilih.
                                </td>
                            </tr>
                        ) : (
                            timeline.map((row) => {
                                const hasActivity = row.inflow > 0 || row.total_outflow > 0;
                                const isNetPos = row.net > 0;
                                const isNetNeg = row.net < 0;

                                return (
                                    <tr
                                        key={row.date}
                                        onClick={() => hasActivity && onSelectDay?.(row.date)}
                                        className={`transition-colors ${
                                            row.is_today
                                                ? 'bg-blue-50/40 font-medium'
                                                : row.is_month_end
                                                ? 'bg-amber-50/30'
                                                : 'hover:bg-slate-50/60'
                                        } ${hasActivity && onSelectDay ? 'cursor-pointer' : ''}`}
                                    >
                                        {/* Tanggal & Hari */}
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <span className="font-semibold text-slate-900">
                                                        {row.day_name},
                                                    </span>{' '}
                                                    <span className="font-mono text-slate-700">
                                                        {row.date}
                                                    </span>
                                                </div>
                                                {row.is_today && (
                                                    <span className="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                                        Hari Ini
                                                    </span>
                                                )}
                                                {row.is_month_end && (
                                                    <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                                        Akhir Bulan
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Piutang Cair (Inflow) */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {row.inflow > 0 ? (
                                                <div>
                                                    <span className="font-mono font-bold text-emerald-600">
                                                        +{formatRupiah(row.inflow)}
                                                    </span>
                                                    <div className="text-[10px] text-emerald-700/80">
                                                        {row.inflow_count} invoice
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Hutang PO */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {row.outflow_po > 0 ? (
                                                <div>
                                                    <span className="font-mono font-bold text-rose-600">
                                                        -{formatRupiah(row.outflow_po)}
                                                    </span>
                                                    <div className="text-[10px] text-rose-700/80">
                                                        {row.outflow_count} PO
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* PPN Akhir Bulan */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {row.outflow_ppn > 0 ? (
                                                <div>
                                                    <span className="font-mono font-bold text-amber-600">
                                                        -{formatRupiah(row.outflow_ppn)}
                                                    </span>
                                                    <div className="text-[10px] text-amber-700/80">
                                                        Setor PPN
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Total Pengeluaran */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {row.total_outflow > 0 ? (
                                                <span className="font-mono font-semibold text-rose-700">
                                                    -{formatRupiah(row.total_outflow)}
                                                </span>
                                            ) : (
                                                <span className="font-mono text-slate-300">-</span>
                                            )}
                                        </td>

                                        {/* Net Harian */}
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono font-semibold">
                                            {isNetPos && (
                                                <span className="text-emerald-600">
                                                    +{formatRupiah(row.net)}
                                                </span>
                                            )}
                                            {isNetNeg && (
                                                <span className="text-rose-600">
                                                    -{formatRupiah(Math.abs(row.net))}
                                                </span>
                                            )}
                                            {!isNetPos && !isNetNeg && (
                                                <span className="text-slate-300">Rp 0</span>
                                            )}
                                        </td>

                                        {/* Saldo Berjalan (Kas) */}
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <span
                                                className={`font-mono text-sm font-black ${
                                                    row.running_balance >= 0
                                                        ? 'text-slate-900'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {formatRupiah(row.running_balance)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
