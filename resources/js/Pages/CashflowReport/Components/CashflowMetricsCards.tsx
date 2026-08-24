import { fmt } from '../cashflowTypes';

interface CashflowMetricsCardsProps {
    beginningBalance: number;
    totalInflow: number;
    totalOutflow: number;
    endingBalance: number;
    netMovement: number;
}

export default function CashflowMetricsCards({
    beginningBalance,
    totalInflow,
    totalOutflow,
    endingBalance,
    netMovement,
}: CashflowMetricsCardsProps) {
    const isNetPositive = netMovement >= 0;

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Saldo Awal Periode */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:border-slate-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Saldo Awal Kas & Bank
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-xl font-black tracking-tight text-slate-900">
                        {fmt(beginningBalance)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <span>Posisi awal pembukuan periode</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            </div>

            {/* Card 2: Total Kas Masuk (Inflows) */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Total Kas Masuk (Inflow)
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
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-xl font-black tracking-tight text-emerald-600">
                        {fmt(totalInflow)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                        <span>Penerimaan Piutang & Setoran</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            </div>

            {/* Card 3: Total Kas Keluar (Outflows) */}
            <div className="shadow-xs group relative overflow-hidden rounded-2xl border border-rose-100 bg-white p-5 transition-all duration-300 hover:border-rose-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Total Kas Keluar (Outflow)
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
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-xl font-black tracking-tight text-rose-600">
                        {fmt(totalOutflow)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-rose-700">
                        <span>Vendor, Operasional & Pajak</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
            </div>

            {/* Card 4: Saldo Akhir Kas & Net Movement */}
            <div
                className={`shadow-xs group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${
                    isNetPositive
                        ? 'border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40'
                        : 'border-rose-200/80 bg-gradient-to-br from-white via-white to-rose-50/40'
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Saldo Akhir Kas & Bank
                    </span>
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                            isNetPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
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
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </div>
                <div className="mt-3">
                    <div
                        className={`text-xl font-black tracking-tight ${
                            isNetPositive ? 'text-slate-900' : 'text-rose-700'
                        }`}
                    >
                        {fmt(endingBalance)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold">
                        <span
                            className={
                                isNetPositive
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                            }
                        >
                            {isNetPositive ? '▲ Surplus' : '▼ Defisit'}{' '}
                            {fmt(Math.abs(netMovement))}
                        </span>
                        <span className="text-slate-400">• Mutasi Bersih</span>
                    </div>
                </div>
                <div
                    className={`absolute inset-x-0 bottom-0 h-1 ${
                        isNetPositive
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                />
            </div>
        </div>
    );
}
