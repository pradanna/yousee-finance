import { fmt, TaxSettlementRecord } from '../ppnTypes';

interface PpnSptTabProps {
    periodLabel: string;
    totalKeluaranPpn: number;
    totalKeluaranDpp: number;
    totalMasukanPpnCreditable: number;
    totalMasukanDpp: number;
    netPpnAmount: number;
    taxSettlement: TaxSettlementRecord;
}

export default function PpnSptTab({
    periodLabel,
    totalKeluaranPpn,
    totalKeluaranDpp,
    totalMasukanPpnCreditable,
    totalMasukanDpp,
    netPpnAmount,
    taxSettlement,
}: PpnSptTabProps) {
    return (
        <div className="shadow-xs space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6">
            <div>
                <h3 className="text-sm font-bold tracking-tight text-slate-900">
                    Form SPT Masa PPN 1111 (Rekapitulasi {periodLabel})
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Ikhtisar penghitungan PPN Kurang/Lebih Bayar sesuai Lampiran
                    Formulir 1111 AB DJP Online.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Section A: PPN Keluaran */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold uppercase text-slate-800">
                            I. PPN Keluaran Dipungut (Penjualan)
                        </span>
                        <span className="font-mono text-xs font-bold text-blue-700">
                            {fmt(totalKeluaranPpn)}
                        </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                        <div className="flex justify-between">
                            <span>Ekspor BKP / JKP:</span>
                            <span className="font-mono">Rp 0</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Penyerahan Dalam Negeri (DPP):</span>
                            <span className="font-mono">
                                {fmt(totalKeluaranDpp)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>PPN Keluaran (11%):</span>
                            <span className="font-mono font-bold text-slate-900">
                                {fmt(totalKeluaranPpn)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section B: PPN Masukan */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold uppercase text-slate-800">
                            II. PPN Masukan Dapat Dikreditkan
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                            {fmt(totalMasukanPpnCreditable)}
                        </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                        <div className="flex justify-between">
                            <span>Perolehan BKP / JKP Dalam Negeri:</span>
                            <span className="font-mono">
                                {fmt(totalMasukanDpp)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>PPN Masukan Dikreditkan:</span>
                            <span className="font-mono font-bold text-slate-900">
                                {fmt(totalMasukanPpnCreditable)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section C: Net Result */}
            <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-xs">
                <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>
                        III. PPN Net (Kurang / Lebih Bayar {periodLabel}):
                    </span>
                    <span className="font-mono text-base text-blue-800">
                        {fmt(netPpnAmount)}
                    </span>
                </div>
                <div className="flex items-center justify-between font-medium text-slate-600">
                    <span>Status Penyetoran Kas Negara (NTPN):</span>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                            taxSettlement.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                        {taxSettlement.status === 'paid'
                            ? `Disetor (${taxSettlement.ntpn})`
                            : 'Belum Disetor'}
                    </span>
                </div>
            </div>
        </div>
    );
}
