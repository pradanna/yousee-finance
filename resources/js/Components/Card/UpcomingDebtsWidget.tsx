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
        <div className="shadow-xs flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-slate-800">
                                Hutang Jatuh Tempo ≤ 7 Hari
                            </h2>
                            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                {unpaidCount} Antrean
                            </span>
                        </div>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-400">
                            Kewajiban Pembayaran Vendor (Outflow)
                        </p>
                    </div>
                </div>

                {debts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50/70 text-amber-600 shadow-2xs">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.75}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-3.5 text-xs font-bold text-slate-800">
                            Tidak Ada Hutang Jatuh Tempo
                        </h3>
                        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-400">
                            Semua kewajiban pembayaran vendor dalam 7 hari ke depan telah diselesaikan atau belum ada tagihan aktif.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/10 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-3">No. PO / Vendor</th>
                                    <th className="px-4 py-3">Deskripsi Proyek</th>
                                    <th className="px-4 py-3">Jatuh Tempo</th>
                                    <th className="px-4 py-3 text-right">
                                        Nominal
                                    </th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {debts.map((debt) => {
                                    const isPaid = debt.status === 'paid';
                                    const currentSimulatedDate = new Date(
                                        `${selectedYear}-${selectedMonth}-27`,
                                    );
                                    const dueDate = new Date(debt.dueDate);
                                    const diffTime =
                                        dueDate.getTime() -
                                        currentSimulatedDate.getTime();
                                    const diffDays = Math.ceil(
                                        diffTime / (1000 * 60 * 60 * 24),
                                    );

                                    return (
                                        <tr
                                            key={debt.id}
                                            className="transition-colors hover:bg-slate-50/30"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-mono text-[11px] font-bold text-slate-900">
                                                    {debt.actualId}
                                                </div>
                                                <div className="mt-0.5 text-[10px] font-bold text-slate-800">
                                                    {debt.vendor}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="max-w-[130px] truncate font-semibold text-slate-500">
                                                    {debt.project}
                                                </div>
                                                <div className="mt-0.5 text-[9px] font-normal italic text-slate-400">
                                                    {debt.notes}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5">
                                                <div className="text-[11px] font-semibold text-slate-700">
                                                    {formatDateIndo(debt.dueDate)}
                                                </div>
                                                {!isPaid && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-amber-600">
                                                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-500"></span>
                                                        {diffDays} Hari Lagi
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                                                {formatRupiah(debt.actualAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-center">
                                                {isPaid ? (
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        Terbayar
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            onPayDebt(
                                                                debt.id,
                                                                debt.actualAmount,
                                                                debt.vendor,
                                                            )
                                                        }
                                                        className="shadow-2xs cursor-pointer rounded-lg bg-primary px-2 py-1 text-[9px] font-bold text-white transition-all hover:bg-primary-700"
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
                )}
            </div>
        </div>
    );
}
