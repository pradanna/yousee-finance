import { fmt, formatDateIndo, TaxSettlementRecord } from '../ppnTypes';

interface PpnMetricsCardsProps {
    totalKeluaranPpn: number;
    totalKeluaranDpp: number;
    totalMasukanPpnCreditable: number;
    totalMasukanDpp: number;
    netPpnAmount: number;
    isKurangBayar: boolean;
    taxSettlement: TaxSettlementRecord;
}

export default function PpnMetricsCards({
    totalKeluaranPpn,
    totalKeluaranDpp,
    totalMasukanPpnCreditable,
    totalMasukanDpp,
    netPpnAmount,
    isKurangBayar,
    taxSettlement,
}: PpnMetricsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Total PPN Keluaran */}
            <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        TOTAL PPN KELUARAN (SALES)
                    </span>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Dipungut
                    </span>
                </div>
                <span className="block font-mono text-2xl font-bold text-slate-900">
                    {fmt(totalKeluaranPpn)}
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                    Dari total DPP {fmt(totalKeluaranDpp)}
                </span>
            </div>

            {/* 2. Total PPN Masukan */}
            <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        TOTAL PPN MASUKAN (PURCHASES)
                    </span>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Dikreditkan
                    </span>
                </div>
                <span className="block font-mono text-2xl font-bold text-emerald-700">
                    {fmt(totalMasukanPpnCreditable)}
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                    Dari total DPP {fmt(totalMasukanDpp)}
                </span>
            </div>

            {/* 3. Status PPN Net Masa Pajak */}
            <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        STATUS PPN NET MASA PAJAK
                    </span>
                    <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isKurangBayar
                                ? 'border-amber-200 bg-amber-50 text-amber-800'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        }`}
                    >
                        {isKurangBayar ? 'Kurang Bayar' : 'Lebih Bayar'}
                    </span>
                </div>
                <span
                    className={`block font-mono text-2xl font-bold ${
                        isKurangBayar ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                >
                    {fmt(Math.abs(netPpnAmount))}
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                    {isKurangBayar
                        ? 'Wajib disetor ke Kas Negara'
                        : 'Kompensasi ke Masa Berikutnya'}
                </span>
            </div>

            {/* 4. Penyetoran Kas Negara (NTPN) */}
            <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        PENYETORAN KAS NEGARA (NTPN)
                    </span>
                    <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            taxSettlement.status === 'paid'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                    >
                        {taxSettlement.status === 'paid'
                            ? '✓ Lunas Disetor'
                            : 'Belum Disetor'}
                    </span>
                </div>
                <span className="block truncate font-mono text-sm font-bold text-slate-900">
                    {taxSettlement.ntpn || 'Belum Ada NTPN'}
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                    {taxSettlement.paidDate
                        ? `Tanggal Setor: ${formatDateIndo(taxSettlement.paidDate)}`
                        : 'Segera lakukan penyetoran'}
                </span>
            </div>
        </div>
    );
}
