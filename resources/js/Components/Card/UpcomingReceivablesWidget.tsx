import React from 'react';

export interface ReceivableItem {
    id: string;
    actualId: string;
    client: string;
    project: string;
    notes?: string;
    dueDate: string;
    actualAmount: number;
    status: string;
}

interface UpcomingReceivablesWidgetProps {
    receivables: ReceivableItem[];
    selectedYear: string;
    selectedMonth: string;
    onReceivePayment: (id: string, amount: number, client: string) => void;
    formatDateIndo: (dateStr: string) => string;
    formatRupiah: (num: number) => string;
}

export default function UpcomingReceivablesWidget({
    receivables,
    selectedYear,
    selectedMonth,
    onReceivePayment,
    formatDateIndo,
    formatRupiah,
}: UpcomingReceivablesWidgetProps) {
    const unpaidCount = receivables.filter((r) => r.status === 'unpaid').length;

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Piutang Jatuh Tempo ≤ 7 Hari</h2>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {unpaidCount} Antrean
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Penagihan Client Mendatang (Inflow)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/10">
                                <th className="px-4 py-3">No. Invoice / Client</th>
                                <th className="px-4 py-3">Deskripsi Proyek</th>
                                <th className="px-4 py-3">Jatuh Tempo</th>
                                <th className="px-4 py-3 text-right">Nominal</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                            {receivables.map((rec) => {
                                const isPaid = rec.status === 'paid';
                                const currentSimulatedDate = new Date(`${selectedYear}-${selectedMonth}-27`);
                                const dueDate = new Date(rec.dueDate);
                                const diffTime = dueDate.getTime() - currentSimulatedDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                    <tr key={rec.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-mono font-bold text-slate-900 text-[11px]">{rec.actualId}</div>
                                            <div className="font-bold text-slate-800 text-[10px] mt-0.5">{rec.client}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-slate-500 max-w-[130px] truncate">{rec.project}</div>
                                            <div className="text-[9px] text-slate-400 font-normal italic mt-0.5">{rec.notes}</div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="font-semibold text-slate-700 text-[11px]">{formatDateIndo(rec.dueDate)}</div>
                                            {!isPaid && (
                                                <div className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                    {diffDays} Hari Lagi
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {formatRupiah(rec.actualAmount)}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                            {isPaid ? (
                                                <span className="text-[10px] font-bold text-emerald-600">Diterima</span>
                                            ) : (
                                                <button
                                                    onClick={() => onReceivePayment(rec.id, rec.actualAmount, rec.client)}
                                                    className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                                                >
                                                    Catat Terima
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
