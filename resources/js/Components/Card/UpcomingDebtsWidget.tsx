import React from 'react';

export interface DebtItem {
    id: string;
    actualId: string;
    vendor: string;
    project: string;
    notes?: string;
    dueDate: string;
    actualAmount: number;
    status: string;
}

interface UpcomingDebtsWidgetProps {
    debts: DebtItem[];
    selectedYear: string;
    selectedMonth: string;
    onPayDebt: (id: string, amount: number, vendor: string) => void;
    formatDateIndo: (dateStr: string) => string;
    formatRupiah: (num: number) => string;
}

export default function UpcomingDebtsWidget({
    debts,
    selectedYear,
    selectedMonth,
    onPayDebt,
    formatDateIndo,
    formatRupiah,
}: UpcomingDebtsWidgetProps) {
    const unpaidCount = debts.filter((d) => d.status === 'unpaid').length;

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/20">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Hutang Jatuh Tempo ≤ 7 Hari</h2>
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {unpaidCount} Antrean
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Kewajiban Pembayaran Vendor (Outflow)</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/10">
                                <th className="px-4 py-3">No. PO / Vendor</th>
                                <th className="px-4 py-3">Deskripsi Proyek</th>
                                <th className="px-4 py-3">Jatuh Tempo</th>
                                <th className="px-4 py-3 text-right">Nominal</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                            {debts.map((debt) => {
                                const isPaid = debt.status === 'paid';
                                const currentSimulatedDate = new Date(`${selectedYear}-${selectedMonth}-27`);
                                const dueDate = new Date(debt.dueDate);
                                const diffTime = dueDate.getTime() - currentSimulatedDate.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                return (
                                    <tr key={debt.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="font-mono font-bold text-slate-900 text-[11px]">{debt.actualId}</div>
                                            <div className="font-bold text-slate-800 text-[10px] mt-0.5">{debt.vendor}</div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-semibold text-slate-500 max-w-[130px] truncate">{debt.project}</div>
                                            <div className="text-[9px] text-slate-400 font-normal italic mt-0.5">{debt.notes}</div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="font-semibold text-slate-700 text-[11px]">{formatDateIndo(debt.dueDate)}</div>
                                            {!isPaid && (
                                                <div className="text-[9px] text-amber-600 font-bold mt-0.5 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                                    {diffDays} Hari Lagi
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                            {formatRupiah(debt.actualAmount)}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                            {isPaid ? (
                                                <span className="text-[10px] font-bold text-slate-400">Terbayar</span>
                                            ) : (
                                                <button
                                                    onClick={() => onPayDebt(debt.id, debt.actualAmount, debt.vendor)}
                                                    className="px-2 py-1 rounded-lg text-[9px] font-bold bg-primary hover:bg-primary-700 text-white shadow-2xs transition-all cursor-pointer"
                                                >
                                                    Catat Bayar
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
