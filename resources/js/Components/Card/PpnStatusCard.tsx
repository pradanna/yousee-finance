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
        <div className="shadow-xs flex flex-col justify-between space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6">
            <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-800">
                    Status PPN Terpisah
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                    Rasio Alokasi PPN dan Pajak
                </p>
            </div>

            {fiscalMode === 'ppn' ? (
                <div className="flex flex-1 flex-col justify-center space-y-4">
                    {/* PPN Keluaran Ratio */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                PPN Keluaran
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                                {ppnKeluaranNominal}{' '}
                                <span className="font-sans text-[10px] font-normal text-slate-400">
                                    ({ppnKeluaranPercent})
                                </span>
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: ppnKeluaranPercent }}
                            ></div>
                        </div>
                    </div>

                    {/* PPN Masukan Ratio */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                PPN Masukan
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                                {ppnMasukanNominal}{' '}
                                <span className="font-sans text-[10px] font-normal text-slate-400">
                                    ({ppnMasukanPercent})
                                </span>
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: ppnMasukanPercent }}
                            ></div>
                        </div>
                    </div>

                    {/* PPN Bersih Terhutang Box */}
                    <div className="mt-1 space-y-1 rounded-xl border border-amber-100/60 bg-amber-50/50 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                PPN Kurang Bayar
                            </span>
                            <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                Pelaporan
                            </span>
                        </div>
                        <div className="font-mono text-base font-extrabold text-amber-700">
                            {taxOrDebt}
                        </div>
                        <p className="text-[9.5px] font-medium leading-normal text-amber-600">
                            Selisih nominal yang wajib disetor ke Kas Negara.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col items-center justify-center space-y-2 py-8 text-center text-slate-400">
                    <svg
                        className="h-10 w-10 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Rasio PPN Dinonaktifkan
                    </span>
                    <span className="px-4 text-[11px] text-slate-400">
                        Ubah sidebar ke Mode PPN untuk melihat rasio alokasi
                        pajak.
                    </span>
                </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-semibold uppercase text-slate-400">
                <span>Status Fiskal:</span>
                <span
                    className={`rounded-md px-2 py-0.5 font-bold ${
                        fiscalMode === 'ppn'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {fiscalMode}
                </span>
            </div>
        </div>
    );
}
