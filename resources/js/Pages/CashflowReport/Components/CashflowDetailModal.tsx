import { CashflowEntry, fmt, formatDateIndo } from '../cashflowTypes';

interface CashflowDetailModalProps {
    entry: CashflowEntry | null;
    onClose: () => void;
}

export default function CashflowDetailModal({
    entry,
    onClose,
}: CashflowDetailModalProps) {
    if (!entry) return null;

    const isDebit = entry.type === 'inflow';

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'operating':
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        Aktivitas Operasional
                    </span>
                );
            case 'investing':
                return (
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                        Aktivitas Investasi Aset
                    </span>
                );
            case 'financing':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        Aktivitas Pendanaan
                    </span>
                );
            case 'transfer':
                return (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        Transfer Kas Internal
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="backdrop-blur-xs fixed inset-0 bg-slate-900/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                isDebit
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                            }`}
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                {isDebit ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                                    />
                                )}
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">
                                Detail Mutasi Kas
                            </h3>
                            <p className="text-xs text-slate-500">
                                Ref: {entry.refNo}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className="space-y-4 p-6">
                    {/* Amount Banner */}
                    <div
                        className={`rounded-2xl p-4 text-center ${
                            isDebit
                                ? 'border border-emerald-100 bg-emerald-50/60'
                                : 'border border-rose-100 bg-rose-50/60'
                        }`}
                    >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            {isDebit
                                ? 'Penerimaan Kas (Inflow)'
                                : 'Pengeluaran Kas (Outflow)'}
                        </span>
                        <div
                            className={`mt-1 text-2xl font-black ${
                                isDebit ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                        >
                            {isDebit ? '+' : '-'} {fmt(entry.amount)}
                        </div>
                    </div>

                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tanggal Transaksi
                            </span>
                            <span className="mt-1 block font-bold text-slate-800">
                                {formatDateIndo(entry.date)}
                            </span>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kategori PSAK 2
                            </span>
                            <div className="mt-1">
                                {getCategoryBadge(entry.category)}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Rekening Kas / Bank
                            </span>
                            <span className="mt-1 block font-bold text-slate-800">
                                {entry.accountCode} - {entry.accountName}
                            </span>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Akun Lawan (Contra)
                            </span>
                            <span className="mt-1 block font-bold text-slate-800">
                                {entry.contraCode || '-'}{' '}
                                {entry.contraName
                                    ? `(${entry.contraName})`
                                    : ''}
                            </span>
                        </div>

                        <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Rekanan / Partner Bisnis
                            </span>
                            <span className="mt-1 block font-bold text-slate-800">
                                {entry.partnerName || 'Umum'}
                            </span>
                        </div>

                        {entry.projectName && (
                            <div className="col-span-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                    Proyek Terkait
                                </span>
                                <span className="mt-1 block font-bold text-blue-900">
                                    {entry.projectCode} - {entry.projectName}
                                </span>
                            </div>
                        )}

                        <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Keterangan / Deskripsi
                            </span>
                            <p className="mt-1 font-medium leading-relaxed text-slate-700">
                                {entry.description || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
