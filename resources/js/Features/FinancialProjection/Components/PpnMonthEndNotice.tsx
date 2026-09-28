import { formatRupiah } from '@/Utils/formatters';
import { ProjectionSummary } from '../types';

interface PpnMonthEndNoticeProps {
    summary: ProjectionSummary;
    fiscalMode: string;
}

export default function PpnMonthEndNotice({
    summary,
    fiscalMode,
}: PpnMonthEndNoticeProps) {
    if (fiscalMode === 'non-ppn') {
        return (
            <div className="shadow-xs flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs text-slate-700">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <div>
                    <span className="font-bold text-slate-900">
                        Mode Non-PPN Aktif:
                    </span>{' '}
                    Kewajiban dan perhitungan penyetoran PPN akhir bulan
                    dinonaktifkan pada pembukuan entitas Non-PPN.
                </div>
            </div>
        );
    }

    if (summary.ppn_is_settled) {
        return (
            <div className="shadow-xs flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
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
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                                PPN Masa Bulan {summary.ppn_month}/
                                {summary.ppn_year} Telah Disetor
                            </span>
                            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                Lunas DJP
                            </span>
                        </div>
                        <p className="mt-0.5 text-slate-500">
                            Kewajiban PPN telah diselesaikan ke Kas Negara.
                            Tidak ada beban pengeluaran PPN tambahan di akhir
                            bulan ini.
                        </p>
                    </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-600 sm:text-right">
                    Sudah Disetor
                </div>
            </div>
        );
    }

    if (summary.crosses_month_end) {
        if (summary.ppn_net_payable > 0) {
            return (
                <div className="shadow-xs rounded-2xl border border-slate-200/80 bg-white p-5 transition-all">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="shadow-2xs mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50 text-amber-600">
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
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">
                                        Perhatian: Melewati Akhir Bulan (
                                        {summary.month_end_date})
                                    </span>
                                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                        PPN Kurang Bayar Terdeteksi
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-600">
                                    Estimasi penyetoran PPN ke Kas Negara
                                    sebesar{' '}
                                    <strong className="font-mono font-bold text-slate-900">
                                        {formatRupiah(summary.ppn_net_payable)}
                                    </strong>{' '}
                                    (PPN Keluaran{' '}
                                    {formatRupiah(summary.ppn_keluaran_total)} −
                                    PPN Masukan{' '}
                                    {formatRupiah(summary.ppn_masukan_total)})
                                    otomatis dimasukkan sebagai beban
                                    pengeluaran pada tanggal{' '}
                                    <strong className="text-slate-900">
                                        {summary.month_end_date}
                                    </strong>
                                    .
                                </p>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 lg:w-auto">
                            <div className="text-left lg:text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Estimasi Beban PPN
                                </div>
                                <div className="font-mono text-base font-black text-amber-700">
                                    {formatRupiah(summary.ppn_net_payable)}
                                </div>
                            </div>
                            <div className="hidden h-8 w-px bg-slate-200 lg:block" />
                            <div className="text-right text-[11px] text-slate-500">
                                <div>Jatuh Tempo:</div>
                                <div className="font-mono font-semibold text-slate-700">
                                    {summary.month_end_date}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="shadow-xs flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs text-slate-700">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
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
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <div>
                    <span className="font-bold text-slate-900">
                        Status PPN Akhir Bulan:
                    </span>{' '}
                    PPN Masukan ({formatRupiah(summary.ppn_masukan_total)})
                    seimbang atau lebih besar dari PPN Keluaran (
                    {formatRupiah(summary.ppn_keluaran_total)}). Tidak ada
                    estimasi beban penyetoran PPN ke Kas Negara pada akhir bulan
                    ini (Nihil / Lebih Bayar).
                </div>
            </div>
        );
    }

    return (
        <div className="shadow-xs flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs text-slate-600">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg
                    className="h-4 w-4"
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
            <span>
                Rentang waktu proyeksi saat ini tidak melewati tanggal akhir
                bulan (<strong>{summary.month_end_date}</strong>). Penyetoran
                PPN akhir bulan tidak dihitung dalam jangka waktu ini.
            </span>
        </div>
    );
}
