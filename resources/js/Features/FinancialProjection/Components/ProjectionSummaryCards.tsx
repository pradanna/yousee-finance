import { formatRupiah } from '@/Utils/formatters';
import { ProjectionSummary } from '../types';

interface ProjectionSummaryCardsProps {
    summary: ProjectionSummary;
    days: number;
    inflowCount: number;
    outflowCount: number;
}

export default function ProjectionSummaryCards({
    summary,
    days,
    inflowCount,
    outflowCount,
}: ProjectionSummaryCardsProps) {
    const isNetPositive = summary.projected_net_cashflow >= 0;
    const isEndingCashHealthy = summary.projected_ending_cash_balance >= 0;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Saldo Kas & Bank Saat Ini */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Saldo Kas & Bank Saat Ini
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="font-mono text-xl font-black tracking-tight text-slate-900">
                        {formatRupiah(summary.current_cash_balance)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <span>Total likuiditas riil di buku kas/bank</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>

            {/* Card 2: Proyeksi Piutang Masuk (Inflow) */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Proyeksi Piutang Masuk ({days} Hari)
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="font-mono text-xl font-black tracking-tight text-emerald-600">
                        +{formatRupiah(summary.projected_inflow_total)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {inflowCount} Termin Invoice
                        </span>
                        <span>jatuh tempo</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            </div>

            {/* Card 3: Proyeksi Pengeluaran (Outflow) */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 transition-all duration-300 hover:border-rose-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Proyeksi Pengeluaran ({days} Hari)
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-110">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 13l-5 5m0 0l-5-5m5 5V6"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="font-mono text-xl font-black tracking-tight text-rose-600">
                        -{formatRupiah(summary.projected_outflow_total)}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                            {outflowCount} Tagihan / PO
                        </span>
                        <span>jatuh tempo</span>
                        {summary.projected_outflow_ppn_total > 0 && (
                            <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                PPN:{' '}
                                {formatRupiah(
                                    summary.projected_outflow_ppn_total,
                                )}
                            </span>
                        )}
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
            </div>

            {/* Card 4: Proyeksi Saldo Akhir Kas */}
            <div
                className={`shadow-xs group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${
                    isEndingCashHealthy
                        ? 'border-indigo-100 bg-white hover:border-indigo-200'
                        : 'border-red-200 bg-red-50/40 hover:border-red-300'
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Proyeksi Saldo Akhir
                    </span>
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                            isEndingCashHealthy
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div
                        className={`font-mono text-xl font-black tracking-tight ${
                            isEndingCashHealthy
                                ? 'text-indigo-600'
                                : 'text-red-700'
                        }`}
                    >
                        {formatRupiah(summary.projected_ending_cash_balance)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium">
                        <span
                            className={`font-semibold ${
                                isNetPositive
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                            }`}
                        >
                            Net: {isNetPositive ? '+' : ''}
                            {formatRupiah(summary.projected_net_cashflow)}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">
                            {isNetPositive ? 'Surplus' : 'Defisit'}
                        </span>
                    </div>
                </div>
                <div
                    className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${
                        isEndingCashHealthy
                            ? 'from-indigo-500 to-purple-500'
                            : 'from-red-500 to-rose-600'
                    }`}
                />
            </div>
        </div>
    );
}
