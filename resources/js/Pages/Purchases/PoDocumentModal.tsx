import PrintButton from '@/Components/Button/PrintButton';
import type { BillboardLocation, VendorPO } from './purchasesTypes';
import { PPN_RATE, fmt, formatDate } from './purchasesTypes';

// ─────────────────────────────────────────────────────────────────────────────
// PoDocumentModal — Reusable PO Document Viewer / Print Preview
// ─────────────────────────────────────────────────────────────────────────────

export interface PoDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    poNumber: string;
    projectCode: string;
    projectName: string;
    clientName: string;
    locations: BillboardLocation[];
    isPPN: boolean;
    vendorPOs: Record<string, VendorPO>;
}

export function PoDocumentModal({
    isOpen,
    onClose,
    poNumber,
    projectCode,
    projectName,
    clientName,
    locations,
    isPPN,
    vendorPOs,
}: PoDocumentModalProps) {
    if (!isOpen || !poNumber) return null;

    const po = vendorPOs[poNumber];
    if (!po) return null;

    const poLocs = locations.filter((l) => l.poNumber === poNumber);
    const dppSubtotal = poLocs.reduce(
        (s, l) => s + l.vendorCost * (l.qty || 1),
        0,
    );
    const ppnAmount = isPPN ? dppSubtotal * PPN_RATE : 0;
    const poTotal = dppSubtotal + ppnAmount;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4">
            <div
                className="backdrop-blur-xs animate-fade-in absolute inset-0 bg-slate-950/60"
                onClick={onClose}
            />
            <div className="animate-fade-in-down relative z-10 my-8 w-full max-w-4xl rounded-3xl bg-slate-100 shadow-2xl">
                {/* Modal Toolbar */}
                <div className="flex flex-shrink-0 items-center justify-between rounded-t-3xl bg-slate-900 px-6 py-4 text-white print:hidden">
                    <div>
                        <h3 className="text-sm font-bold">
                            Dokumen Purchase Order (PO)
                        </h3>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                            Nomor: {poNumber}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <PrintButton
                            onClick={() => window.print()}
                            className="bg-white/10 text-white border-white/20 hover:bg-white/20 active:bg-white/30"
                        >
                            Cetak PDF / Print
                        </PrintButton>
                        <button
                            onClick={onClose}
                            className="rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-400 transition-all hover:bg-slate-700 hover:text-white"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="relative space-y-8 overflow-hidden rounded-b-3xl bg-white p-8 font-sans text-slate-800 shadow-sm md:p-12 print:rounded-none print:p-0 print:shadow-none">
                    {/* Watermark */}
                    <div className="pointer-events-none absolute right-8 top-8 rotate-12 select-none rounded-xl border-4 border-blue-500/25 px-4 py-2 text-xl font-black uppercase tracking-widest text-blue-500/25">
                        PO ISSUED
                    </div>

                    {/* PO Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
                                    Y
                                </div>
                                <span className="text-lg font-black tracking-tight text-slate-900">
                                    YOUSEE MEDIA
                                </span>
                            </div>
                            <p className="text-[11px] font-semibold leading-relaxed text-slate-400">
                                PT. Yousee Media Indonesia
                                <br />
                                Jl. Pandanaran No. 100, Kel. Pekunden
                                <br />
                                Kec. Semarang Tengah, Kota Semarang 50134
                                <br />
                                info@youseemedia.co.id &middot; (024) 8601234
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                                PURCHASE ORDER
                            </h1>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left text-xs">
                                <span className="font-semibold text-slate-400">
                                    Nomor PO:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                    {poNumber}
                                </span>
                                <span className="font-semibold text-slate-400">
                                    Tanggal:
                                </span>
                                <span className="font-bold text-slate-800">
                                    {po.issuedAt}
                                </span>
                                <span className="font-semibold text-slate-400">
                                    Kode Proyek:
                                </span>
                                <span className="font-bold text-slate-800">
                                    {projectCode}
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Vendor & Project Details */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                VENDOR / MITRA REKLAME:
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {po.vendorName}
                            </div>
                            <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                                NPWP: 01.999.888.7-654.000
                                <br />
                                Mitra Partner Resmi &middot; Supplier Media Luar
                                Ruang
                            </p>
                        </div>
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                DESKRIPSI PROYEK KAMPANYE:
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                                {projectName}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-slate-500">
                                <span className="font-semibold">
                                    Nama Client:
                                </span>
                                <span>{clientName}</span>
                                <span className="font-semibold">
                                    Total Lokasi:
                                </span>
                                <span>{poLocs.length} titik</span>
                            </div>
                        </div>
                    </div>

                    {/* Table of Locations */}
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="w-12 px-4 py-3 text-center">
                                        NO
                                    </th>
                                    <th className="px-4 py-3">
                                        DESKRIPSI TITIK LOKASI
                                    </th>
                                    <th className="w-20 px-4 py-3 text-center">
                                        QTY
                                    </th>
                                    <th className="w-36 px-4 py-3 text-right">
                                        BIAYA SATUAN
                                    </th>
                                    <th className="w-40 px-4 py-3 text-right">
                                        TOTAL (DPP)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                {poLocs.map((loc, idx) => {
                                    const qty = loc.qty || 1;
                                    const rowTotal = loc.vendorCost * qty;
                                    return (
                                        <tr key={loc.id}>
                                            <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-800">
                                                    {loc.description}
                                                </div>
                                                <div className="mt-0.5 text-[10px] text-slate-400">
                                                    {loc.code} &middot;{' '}
                                                    {loc.size}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-semibold text-slate-900">
                                                {qty} Unit
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                                                {fmt(loc.vendorCost)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                                                {fmt(rowTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary & Payment Terms */}
                    <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                SKEMA PEMBAYARAN VENDOR PO:
                            </div>

                            {po.paymentTerms.type === 'full' && (
                                <div className="space-y-1 text-xs text-slate-700">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        Full Payment (100% setelah penagihan)
                                    </div>
                                    <div className="space-y-1 rounded-xl border border-slate-100 bg-white p-2.5 text-[11px]">
                                        <div>
                                            <span className="text-slate-400">
                                                Jatuh Tempo:
                                            </span>
                                            <span className="ml-1 font-bold text-slate-800">
                                                {po.paymentTerms.fullDueDate
                                                    ? formatDate(
                                                          po.paymentTerms
                                                              .fullDueDate,
                                                      )
                                                    : `${po.paymentTerms.fullDueDays || 30} hari setelah invoice diterima`}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold italic text-slate-500">
                                        "{po.paymentTerms.notes}"
                                    </p>
                                </div>
                            )}

                            {po.paymentTerms.type === 'dp' && (
                                <div className="space-y-2 text-xs text-slate-700">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        DP &amp; Pelunasan
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="space-y-1 rounded-xl border border-slate-100 bg-white p-2.5 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">
                                                    Uang Muka (
                                                    {po.paymentTerms.dpPercent}
                                                    %):
                                                </span>
                                                <span className="font-mono font-bold text-slate-800">
                                                    {fmt(
                                                        po.paymentTerms
                                                            .dpAmount || 0,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo DP:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms.dpDueDate
                                                        ? formatDate(
                                                              po.paymentTerms
                                                                  .dpDueDate,
                                                          )
                                                        : `${po.paymentTerms.dpDueDays || 7} hari setelah PO`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 rounded-xl border border-slate-100 bg-white p-2.5 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">
                                                    Sisa Pelunasan:
                                                </span>
                                                <span className="font-mono font-bold text-slate-800">
                                                    {fmt(
                                                        poTotal -
                                                            (po.paymentTerms
                                                                .dpAmount || 0),
                                                    )}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo Pelunasan:{' '}
                                                <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms
                                                        .pelunasanDueDate
                                                        ? formatDate(
                                                              po.paymentTerms
                                                                  .pelunasanDueDate,
                                                          )
                                                        : `${po.paymentTerms.pelunasanDueDays || 30} hari setelah serah terima`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-[11px] font-semibold italic text-slate-500">
                                        "{po.paymentTerms.notes}"
                                    </p>
                                </div>
                            )}

                            {po.paymentTerms.type === 'termin' &&
                                po.paymentTerms.installments && (
                                    <div className="space-y-2 text-xs text-slate-700">
                                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Pembayaran Bertahap (Termin)
                                        </div>
                                        <div className="space-y-1.5">
                                            {po.paymentTerms.installments.map(
                                                (inst, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="space-y-1 rounded-xl border border-slate-100 bg-white p-2.5 text-[11px]"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>
                                                                Termin {idx + 1}{' '}
                                                                ({inst.percent}
                                                                %) -{' '}
                                                                <span className="text-slate-400">
                                                                    {inst.note}
                                                                </span>
                                                            </span>
                                                            <span className="font-mono font-bold text-slate-800">
                                                                {fmt(
                                                                    inst.amount,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 border-t border-slate-50/50 pt-1 text-[10px] text-slate-500">
                                                            Jatuh Tempo:{' '}
                                                            <span className="font-semibold text-slate-700">
                                                                {inst.dueDate
                                                                    ? formatDate(
                                                                          inst.dueDate,
                                                                      )
                                                                    : `${inst.dueDays || 30} hari setelah PO`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        <div className="flex items-start justify-end">
                            <div className="w-full space-y-2 text-xs font-semibold text-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">
                                        Subtotal DPP Vendor
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {fmt(dppSubtotal)}
                                    </span>
                                </div>
                                {isPPN && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">
                                            PPN (11%)
                                        </span>
                                        <span className="font-mono font-bold text-violet-600">
                                            {fmt(ppnAmount)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                                    <span className="font-black text-slate-900">
                                        Total HPP PO
                                    </span>
                                    <span className="font-mono font-black text-blue-600">
                                        {fmt(poTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signatures */}
                    <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                SYARAT &amp; KETENTUAN PO:
                            </div>
                            <ul className="list-inside list-disc space-y-1 text-[9px] leading-relaxed text-slate-500">
                                <li>
                                    Vendor partner wajib menjamin konstruksi
                                    billboard kokoh dan layak tayang.
                                </li>
                                <li>
                                    Bukti dokumentasi tayang (siang &amp; malam)
                                    wajib disertakan saat penagihan.
                                </li>
                                <li>
                                    Keterlambatan tayang akan dikenakan denda
                                    keterlambatan.
                                </li>
                            </ul>
                        </div>
                        <div className="flex justify-between text-right">
                            <div className="w-36 text-center">
                                <div className="mb-10 text-[10px] font-bold text-slate-400">
                                    Diterima oleh, (Vendor Partner)
                                </div>
                                <div className="mx-4 h-6 border-b border-slate-200"></div>
                                <div className="mt-1 text-[9px] font-bold text-slate-400">
                                    Direktur / Penanggungjawab
                                </div>
                            </div>
                            <div className="w-36 text-center">
                                <div className="mb-6 text-[10px] font-bold text-slate-400">
                                    Diterbitkan oleh, (Yousee Media)
                                </div>
                                <div className="mx-auto mb-1 flex h-8 w-16 items-center justify-center rounded-lg border border-dashed border-blue-200 text-[8px] font-bold text-blue-300">
                                    STAMP
                                </div>
                                <div className="mx-4 border-b border-slate-200"></div>
                                <div className="mt-1 text-[9px] font-bold text-slate-400">
                                    Procurement &amp; Finance
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
