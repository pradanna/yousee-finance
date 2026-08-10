import React from "react";
import type { BillboardLocation, VendorPO } from "./purchasesTypes";
import { PPN_RATE, fmt, formatDate } from "./purchasesTypes";

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
    const dppSubtotal = poLocs.reduce((s, l) => s + l.vendorCost * (l.qty || 1), 0);
    const ppnAmount = isPPN ? dppSubtotal * PPN_RATE : 0;
    const poTotal = dppSubtotal + ppnAmount;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />
            <div className="bg-slate-100 rounded-3xl w-full max-w-4xl shadow-2xl relative z-10 animate-fade-in-down my-8">
                {/* Modal Toolbar */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center rounded-t-3xl flex-shrink-0 print:hidden">
                    <div>
                        <h3 className="font-bold text-sm">Dokumen Purchase Order (PO)</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nomor: {poNumber}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Cetak PDF / Print
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="p-8 md:p-12 bg-white print:p-0 print:shadow-none shadow-sm rounded-b-3xl print:rounded-none font-sans text-slate-800 space-y-8 relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute top-8 right-8 border-4 border-blue-500/25 text-blue-500/25 font-black text-xl px-4 py-2 rounded-xl rotate-12 tracking-widest uppercase pointer-events-none select-none">
                        PO ISSUED
                    </div>

                    {/* PO Header */}
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">Y</div>
                                <span className="font-black text-lg text-slate-900 tracking-tight">YOUSEE MEDIA</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                PT. Yousee Media Indonesia<br />
                                Jl. Pandanaran No. 100, Kel. Pekunden<br />
                                Kec. Semarang Tengah, Kota Semarang 50134<br />
                                info@youseemedia.co.id &middot; (024) 8601234
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">PURCHASE ORDER</h1>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left text-xs">
                                <span className="text-slate-400 font-semibold">Nomor PO:</span>
                                <span className="font-mono font-bold text-slate-800">{poNumber}</span>
                                <span className="text-slate-400 font-semibold">Tanggal:</span>
                                <span className="font-bold text-slate-800">{po.issuedAt}</span>
                                <span className="text-slate-400 font-semibold">Kode Proyek:</span>
                                <span className="font-bold text-slate-800">{projectCode}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Vendor & Project Details */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">VENDOR / MITRA REKLAME:</div>
                            <div className="font-bold text-slate-900 text-sm">{po.vendorName}</div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                NPWP: 01.999.888.7-654.000<br />
                                Mitra Partner Resmi &middot; Supplier Media Luar Ruang
                            </p>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DESKRIPSI PROYEK KAMPANYE:</div>
                            <div className="font-bold text-slate-900 text-sm">{projectName}</div>
                            <div className="grid grid-cols-2 gap-x-2 mt-2 text-[11px] text-slate-500">
                                <span className="font-semibold">Nama Client:</span>
                                <span>{clientName}</span>
                                <span className="font-semibold">Total Lokasi:</span>
                                <span>{poLocs.length} titik</span>
                            </div>
                        </div>
                    </div>

                    {/* Table of Locations */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-center w-12">NO</th>
                                    <th className="px-4 py-3">DESKRIPSI TITIK LOKASI</th>
                                    <th className="px-4 py-3 text-center w-20">QTY</th>
                                    <th className="px-4 py-3 text-right w-36">BIAYA SATUAN</th>
                                    <th className="px-4 py-3 text-right w-40">TOTAL (DPP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                {poLocs.map((loc, idx) => {
                                    const qty = loc.qty || 1;
                                    const rowTotal = loc.vendorCost * qty;
                                    return (
                                        <tr key={loc.id}>
                                            <td className="px-4 py-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-800">{loc.description}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{loc.code} &middot; {loc.size}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-slate-900 font-semibold">{qty} Unit</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-slate-600">{fmt(loc.vendorCost)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(rowTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary & Payment Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKEMA PEMBAYARAN VENDOR PO:</div>

                            {po.paymentTerms.type === "full" && (
                                <div className="text-xs space-y-1 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Full Payment (100% setelah penagihan)
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                        <div>
                                            <span className="text-slate-400">Jatuh Tempo:</span>
                                            <span className="font-bold text-slate-800 ml-1">
                                                {po.paymentTerms.fullDueDate
                                                    ? formatDate(po.paymentTerms.fullDueDate)
                                                    : `${po.paymentTerms.fullDueDays || 30} hari setelah invoice diterima`}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{po.paymentTerms.notes}"</p>
                                </div>
                            )}

                            {po.paymentTerms.type === "dp" && (
                                <div className="text-xs space-y-2 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        DP &amp; Pelunasan
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Uang Muka ({po.paymentTerms.dpPercent}%):</span>
                                                <span className="font-bold text-slate-800 font-mono">{fmt(po.paymentTerms.dpAmount || 0)}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo DP: <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms.dpDueDate
                                                        ? formatDate(po.paymentTerms.dpDueDate)
                                                        : `${po.paymentTerms.dpDueDays || 7} hari setelah PO`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Sisa Pelunasan:</span>
                                                <span className="font-bold text-slate-800 font-mono">{fmt(poTotal - (po.paymentTerms.dpAmount || 0))}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo Pelunasan: <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms.pelunasanDueDate
                                                        ? formatDate(po.paymentTerms.pelunasanDueDate)
                                                        : `${po.paymentTerms.pelunasanDueDays || 30} hari setelah serah terima`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{po.paymentTerms.notes}"</p>
                                </div>
                            )}

                            {po.paymentTerms.type === "termin" && po.paymentTerms.installments && (
                                <div className="text-xs space-y-2 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Pembayaran Bertahap (Termin)
                                    </div>
                                    <div className="space-y-1.5">
                                        {po.paymentTerms.installments.map((inst, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span>Termin {idx + 1} ({inst.percent}%) - <span className="text-slate-400">{inst.note}</span></span>
                                                    <span className="font-bold font-mono text-slate-800">{fmt(inst.amount)}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 border-t border-slate-50/50 pt-1 mt-1">
                                                    Jatuh Tempo: <span className="font-semibold text-slate-700">
                                                        {inst.dueDate
                                                            ? formatDate(inst.dueDate)
                                                            : `${inst.dueDays || 30} hari setelah PO`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end items-start">
                            <div className="w-full space-y-2 text-xs font-semibold text-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Subtotal DPP Vendor</span>
                                    <span className="font-mono text-slate-900 font-bold">{fmt(dppSubtotal)}</span>
                                </div>
                                {isPPN && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">PPN (11%)</span>
                                        <span className="font-mono text-violet-600 font-bold">{fmt(ppnAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                                    <span className="font-black text-slate-900">Total HPP PO</span>
                                    <span className="font-mono font-black text-blue-600">{fmt(poTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signatures */}
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SYARAT &amp; KETENTUAN PO:</div>
                            <ul className="text-[9px] text-slate-500 list-disc list-inside space-y-1 leading-relaxed">
                                <li>Vendor partner wajib menjamin konstruksi billboard kokoh dan layak tayang.</li>
                                <li>Bukti dokumentasi tayang (siang &amp; malam) wajib disertakan saat penagihan.</li>
                                <li>Keterlambatan tayang akan dikenakan denda keterlambatan.</li>
                            </ul>
                        </div>
                        <div className="text-right flex justify-between">
                            <div className="text-center w-36">
                                <div className="text-[10px] text-slate-400 font-bold mb-10">Diterima oleh, (Vendor Partner)</div>
                                <div className="border-b border-slate-200 mx-4 h-6"></div>
                                <div className="text-[9px] text-slate-400 font-bold mt-1">Direktur / Penanggungjawab</div>
                            </div>
                            <div className="text-center w-36">
                                <div className="text-[10px] text-slate-400 font-bold mb-6">Diterbitkan oleh, (Yousee Media)</div>
                                <div className="w-16 h-8 border border-dashed border-blue-200 text-[8px] text-blue-300 font-bold flex items-center justify-center rounded-lg mx-auto mb-1">
                                    STAMP
                                </div>
                                <div className="border-b border-slate-200 mx-4"></div>
                                <div className="text-[9px] text-slate-400 font-bold mt-1">Procurement &amp; Finance</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
