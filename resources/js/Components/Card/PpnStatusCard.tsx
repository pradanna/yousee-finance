import React from 'react';

interface PpnStatusCardProps {
    fiscalMode: 'ppn' | 'non-ppn';
    ppnKeluaranNominal?: string;
    ppnKeluaranPercent?: string;
    ppnMasukanNominal?: string;
    ppnMasukanPercent?: string;
    taxOrDebt?: string;
}

export default function PpnStatusCard({
    fiscalMode,
    ppnKeluaranNominal = 'Rp 0',
    ppnKeluaranPercent = '0%',
    ppnMasukanNominal = 'Rp 0',
    ppnMasukanPercent = '0%',
    taxOrDebt = 'Rp 0',
}: PpnStatusCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
            <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Status PPN Terpisah</h2>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Rasio Alokasi PPN dan Pajak</p>
            </div>

            {fiscalMode === 'ppn' ? (
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                    {/* PPN Keluaran Ratio */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                PPN Keluaran
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                                {ppnKeluaranNominal} <span className="text-[10px] text-slate-400 font-normal font-sans">({ppnKeluaranPercent})</span>
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: ppnKeluaranPercent }}></div>
                        </div>
                    </div>

                    {/* PPN Masukan Ratio */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                PPN Masukan
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                                {ppnMasukanNominal} <span className="text-[10px] text-slate-400 font-normal font-sans">({ppnMasukanPercent})</span>
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: ppnMasukanPercent }}></div>
                        </div>
                    </div>

                    {/* PPN Bersih Terhutang Box */}
                    <div className="mt-1 p-3 bg-amber-50/50 border border-amber-100/60 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">PPN Kurang Bayar</span>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-sm">Pelaporan</span>
                        </div>
                        <div className="text-base font-extrabold text-amber-700 font-mono">
                            {taxOrDebt}
                        </div>
                        <p className="text-[9.5px] text-amber-600 font-medium leading-normal">
                            Selisih nominal yang wajib disetor ke Kas Negara.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rasio PPN Dinonaktifkan</span>
                    <span className="text-[11px] text-slate-400 px-4">Ubah sidebar ke Mode PPN untuk melihat rasio alokasi pajak.</span>
                </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase">
                <span>Status Fiskal:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                    fiscalMode === 'ppn' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                }`}>
                    {fiscalMode}
                </span>
            </div>
        </div>
    );
}
