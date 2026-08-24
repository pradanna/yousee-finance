import {
    DetailModalState,
    fmt,
    formatDateIndo,
    PpnKeluaranItem,
    PpnMasukanItem,
} from '../ppnTypes';

interface DetailFakturModalProps {
    modalState: DetailModalState | null;
    onClose: () => void;
    onEditNsfp: (
        item: PpnKeluaranItem | PpnMasukanItem,
        type: 'keluaran' | 'masukan',
    ) => void;
}

export const getEfakturBadge = (status: 'approved' | 'ready' | 'draft') => {
    switch (status) {
        case 'approved':
            return (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    ✓ Sukses Upload DJP
                </span>
            );
        case 'ready':
            return (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                    Siap Upload DJP
                </span>
            );
        case 'draft':
            return (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Draft
                </span>
            );
    }
};

export default function DetailFakturModal({
    modalState,
    onClose,
    onEditNsfp,
}: DetailFakturModalProps) {
    if (!modalState) return null;

    const { item, type } = modalState;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                onClick={onClose}
            />
            <div className="animate-fade-in relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    type === 'masukan'
                                        ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                                        : 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                                }`}
                            >
                                {type === 'masukan'
                                    ? 'Faktur Pajak Masukan (Pembelian)'
                                    : 'Faktur Pajak Keluaran (Penjualan)'}
                            </span>
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-white">
                            {item.docNo}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[80vh] space-y-4 overflow-y-auto p-6 text-xs">
                    {/* Badges Status Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                        <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Status e-Faktur DJP
                            </span>
                            <div>{getEfakturBadge(item.efakturStatus)}</div>
                        </div>
                        {type === 'masukan' && 'creditableStatus' in item && (
                            <div className="space-y-1 text-right">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Status Pengkreditan
                                </span>
                                <div>
                                    {item.creditableStatus === 'creditable' ? (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                            ✓ Dapat Dikreditkan
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                                            ✕ Tidak Dikreditkan
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Rincian Dokumen & Lawan Transaksi */}
                    <div className="shadow-2xs space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Informasi Dokumen & Perpajakan
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span className="block text-[10px] font-medium text-slate-400">
                                    Nomor Seri Faktur Pajak (NSFP)
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-900">
                                    {item.nsfp || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-medium text-slate-400">
                                    Tanggal Dokumen
                                </span>
                                <span className="font-medium text-slate-900">
                                    {formatDateIndo(item.date)}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-medium text-slate-400">
                                    {type === 'masukan'
                                        ? 'Nama Vendor (PKP)'
                                        : 'Nama Client (PKP)'}
                                </span>
                                <span className="font-bold text-slate-900">
                                    {'vendor' in item
                                        ? item.vendor
                                        : item.client}
                                </span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-medium text-slate-400">
                                    NPWP
                                </span>
                                <span className="font-mono font-medium text-slate-700">
                                    {item.npwp || '-'}
                                </span>
                            </div>
                            {item.projectName && (
                                <div className="col-span-2">
                                    <span className="block text-[10px] font-medium text-slate-400">
                                        Proyek Terkait
                                    </span>
                                    <span className="font-medium text-slate-800">
                                        {item.projectName}{' '}
                                        {item.projectCode && (
                                            <span className="text-slate-400">
                                                ({item.projectCode})
                                            </span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Rincian Nilai Pajak & Finansial */}
                    <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Nilai Dasar & Perhitungan PPN
                        </h4>
                        <div className="space-y-1.5 border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Dasar Pengenaan Pajak (DPP)</span>
                                <span className="font-mono font-bold text-slate-800">
                                    {fmt(item.dpp)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Tarif PPN (11%)</span>
                                <span className="font-mono font-bold text-primary">
                                    {fmt(item.ppn)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-0.5 font-bold text-slate-900">
                            <span>Total Tagihan Dokumen</span>
                            <span className="font-mono text-sm text-slate-900">
                                {fmt(item.total)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                    >
                        Tutup
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            onEditNsfp(item, type);
                        }}
                        className="flex-1 cursor-pointer rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                    >
                        Edit NSFP
                    </button>
                </div>
            </div>
        </div>
    );
}
