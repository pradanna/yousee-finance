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
        <div className="shadow-xs flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
            <div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold tracking-tight text-slate-800">
                                Piutang Jatuh Tempo ≤ 7 Hari
                            </h2>
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                {unpaidCount} Antrean
                            </span>
                        </div>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-400">
                            Penagihan Client Mendatang (Inflow)
                        </p>
                    </div>
                </div>

                {receivables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 text-emerald-600 shadow-2xs">
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
                            Tidak Ada Piutang Jatuh Tempo
                        </h3>
                        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-400">
                            Semua tagihan piutang client dalam 7 hari ke depan telah tertagih atau belum ada piutang jatuh tempo.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/10 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="px-4 py-3">
                                        No. Invoice / Client
                                    </th>
                                    <th className="px-4 py-3">Deskripsi Proyek</th>
                                    <th className="px-4 py-3">Jatuh Tempo</th>
                                    <th className="px-4 py-3 text-right">
                                        Nominal
                                    </th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                {receivables.map((rec) => {
                                    const isPaid = rec.status === 'paid';
                                    const currentSimulatedDate = new Date(
                                        `${selectedYear}-${selectedMonth}-27`,
                                    );
                                    const dueDate = new Date(rec.dueDate);
                                    const diffTime =
                                        dueDate.getTime() -
                                        currentSimulatedDate.getTime();
                                    const diffDays = Math.ceil(
                                        diffTime / (1000 * 60 * 60 * 24),
                                    );

                                    return (
                                        <tr
                                            key={rec.id}
                                            className="transition-colors hover:bg-slate-50/30"
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="font-mono text-[11px] font-bold text-slate-900">
                                                    {rec.actualId}
                                                </div>
                                                <div className="mt-0.5 text-[10px] font-bold text-slate-800">
                                                    {rec.client}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="max-w-[130px] truncate font-semibold text-slate-500">
                                                    {rec.project}
                                                </div>
                                                <div className="mt-0.5 text-[9px] font-normal italic text-slate-400">
                                                    {rec.notes}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5">
                                                <div className="text-[11px] font-semibold text-slate-700">
                                                    {formatDateIndo(rec.dueDate)}
                                                </div>
                                                {!isPaid && (
                                                    <div className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                                                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500"></span>
                                                        {diffDays} Hari Lagi
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                                                {formatRupiah(rec.actualAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-center">
                                                {isPaid ? (
                                                    <span className="text-[10px] font-bold text-emerald-600">
                                                        Diterima
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            onReceivePayment(
                                                                rec.id,
                                                                rec.actualAmount,
                                                                rec.client,
                                                            )
                                                        }
                                                        className="shadow-2xs cursor-pointer rounded-lg bg-emerald-600 px-2.5 py-1 text-[9px] font-bold text-white transition-all hover:bg-emerald-700"
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
                )}
            </div>
        </div>
    );
}
