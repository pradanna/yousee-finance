import React, { useState, useEffect } from "react";

export interface IssuePOItem {
    id: number;
    description: string;
    area: string;
    vendorCost: number;
    qty?: number;
}

export type PaymentScheme = "full" | "dp" | "termin" | "installment";

export interface IssuePOModalSubmitData {
    lighting: string;
    scheme: PaymentScheme;
    topNotes: string;
    termPercents: number[];
    termDates: string[];
}

export interface IssuePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorName: string;
    items: IssuePOItem[];
    isPPN: boolean;
    onSubmit: (data: IssuePOModalSubmitData) => void;
}

const PPN_RATE = 0.11;

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

const formatIndoDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return dateStr;
    }
};

export const IssuePOModal: React.FC<IssuePOModalProps> = ({
    isOpen,
    onClose,
    vendorName,
    items,
    isPPN,
    onSubmit
}) => {
    const [poLighting, setPoLighting] = useState<"Berlampu" | "Tidak Berlampu">("Berlampu");
    const [vendorTermScheme, setVendorTermScheme] = useState<PaymentScheme>("full");
    const [poTopNotes, setPoTopNotes] = useState("Lunas setelah visual terpasang");
    const [vendorTermPercents, setVendorTermPercents] = useState<number[]>([100]);
    const [vendorTermDates, setVendorTermDates] = useState<string[]>([
        new Date().toISOString().split("T")[0]
    ]);

    useEffect(() => {
        if (isOpen) {
            setPoLighting("Berlampu");
            setVendorTermScheme("full");
            setPoTopNotes("Lunas setelah visual terpasang");
            setVendorTermPercents([100]);
            setVendorTermDates([new Date().toISOString().split("T")[0]]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectVendorScheme = (scheme: PaymentScheme) => {
        setVendorTermScheme(scheme);
        const todayStr = new Date().toISOString().split("T")[0];

        if (scheme === "full") {
            setVendorTermPercents([100]);
            setVendorTermDates([todayStr]);
            setPoTopNotes("Lunas setelah visual terpasang");
        } else if (scheme === "dp") {
            setVendorTermPercents([50, 50]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 14);
            setVendorTermDates([todayStr, d2.toISOString().split("T")[0]]);
            setPoTopNotes("DP 50% saat PO terbit & Pelunasan 50% setelah visual terpasang");
        } else if (scheme === "termin") {
            setVendorTermPercents([30, 40, 30]);
            const d2 = new Date(); d2.setDate(d2.getDate() + 14);
            const d3 = new Date(); d3.setDate(d3.getDate() + 30);
            setVendorTermDates([todayStr, d2.toISOString().split("T")[0], d3.toISOString().split("T")[0]]);
            setPoTopNotes("Termin 1 (30%), Termin 2 (40%), Termin 3 (30%)");
        } else if (scheme === "installment") {
            setVendorTermPercents([100]);
            const d2 = new Date(); d2.setDate(d2.getDate() + 30);
            setVendorTermDates([d2.toISOString().split("T")[0]]);
            setPoTopNotes("Pelunasan 30 hari kalender (Net 30)");
        }
    };

    const sumDpp = items.reduce((s, it) => s + (it.vendorCost * (it.qty || 1)), 0);
    const sumPpn = isPPN ? sumDpp * PPN_RATE : 0;
    const sumTotal = sumDpp + sumPpn;
    const sumPct = vendorTermPercents.reduce((a, b) => a + (Number(b) || 0), 0);

    const handleSubmit = () => {
        onSubmit({
            lighting: poLighting,
            scheme: vendorTermScheme,
            topNotes: poTopNotes,
            termPercents: vendorTermPercents,
            termDates: vendorTermDates
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200/90">
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Terbitkan PO Kolektif Vendor</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{vendorName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Item list summary */}
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 space-y-2">
                        <p className="text-xs font-bold text-primary">
                            Akan menerbitkan 1 nomor PO gabungan untuk {items.length} titik lokasi sekaligus:
                        </p>
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {items.map((item, i) => (
                                <li key={item.id} className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80 flex justify-between items-center">
                                    <span className="font-semibold">{i + 1}. {item.description} ({item.area})</span>
                                    <span className="font-mono font-bold text-slate-900">{fmt(item.vendorCost * (item.qty || 1))}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2-Column Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column: Lighting Option & Scheme Selector */}
                        <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                            <div className="space-y-4">
                                {/* 1. Lighting */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Penerangan PO</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPoLighting("Berlampu")}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                                poLighting === "Berlampu"
                                                    ? "bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-500/20"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            Berlampu (Default)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPoLighting("Tidak Berlampu")}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                                poLighting === "Tidak Berlampu"
                                                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                            Tidak Berlampu
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Payment Scheme */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Skema Pembayaran Vendor</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "full", label: "Lunas Sekaligus", desc: "Cash 100% setelah visual terpasang" },
                                            { id: "dp", label: "DP + Pelunasan", desc: "DP 50% & Pelunasan 50%" },
                                            { id: "termin", label: "Termin 3 Tahap", desc: "Milestone progres 30–40–30%" },
                                            { id: "installment", label: "Tempo / Net 30", desc: "Pelunasan 30 hari kalender" },
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleSelectVendorScheme(s.id as PaymentScheme)}
                                                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                                    vendorTermScheme === s.id
                                                        ? "bg-primary/10 border-primary text-slate-900 ring-2 ring-primary/20 font-bold"
                                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                            >
                                                <div className="text-xs font-bold text-slate-900">{s.label}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">{s.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Catatan TOP PO */}
                            <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Term of Payment (TOP) PO</label>
                                <input
                                    type="text"
                                    value={poTopNotes}
                                    onChange={(e) => setPoTopNotes(e.target.value)}
                                    placeholder="Ketik catatan Term of Payment (TOP)..."
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Right Column: Rincian Termin & Jatuh Tempo */}
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Termin, Persentase & Jatuh Tempo</label>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                            sumPct === 100
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse"
                                        }`}>
                                            Total: {sumPct}% ({fmt(sumTotal)})
                                        </span>
                                    </div>

                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                                        {vendorTermPercents.map((pct, idx) => {
                                            const termAmt = Math.round((sumTotal * (pct || 0)) / 100);
                                            const termLabel = vendorTermPercents.length === 1
                                                ? "Pelunasan Total Vendor"
                                                : idx === 0
                                                ? "Termin 1 – Uang Muka (DP)"
                                                : idx === vendorTermPercents.length - 1
                                                ? `Termin ${idx + 1} – Pelunasan`
                                                : `Termin ${idx + 1} – Progres`;

                                            return (
                                                <div key={idx} className="p-3 flex items-center justify-between gap-2 text-xs flex-wrap">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900">{termLabel}</div>
                                                        <div className="text-[10px] font-mono text-slate-500">{fmt(termAmt)}</div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-slate-400 font-medium">Porsi:</span>
                                                            <input
                                                                type="number"
                                                                value={pct || ""}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    const updated = [...vendorTermPercents];
                                                                    updated[idx] = val;
                                                                    setVendorTermPercents(updated);
                                                                }}
                                                                className="w-12 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded-lg text-center font-mono focus:outline-none focus:border-primary bg-slate-50"
                                                            />
                                                            <span className="text-xs font-bold text-slate-600">%</span>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-slate-400 font-medium">Jatuh Tempo:</span>
                                                            <div className="relative flex items-center">
                                                                <div className="px-2 py-0.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-primary shadow-2xs">
                                                                    <span>{formatIndoDate(vendorTermDates[idx] || new Date().toISOString().split("T")[0])}</span>
                                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                                <input
                                                                    type="date"
                                                                    value={vendorTermDates[idx] || new Date().toISOString().split("T")[0]}
                                                                    onChange={(e) => {
                                                                        const updated = [...vendorTermDates];
                                                                        updated[idx] = e.target.value;
                                                                        setVendorTermDates(updated);
                                                                    }}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Total DPP ({items.length} Titik):</span>
                            <span className="font-mono font-bold text-slate-800">{fmt(sumDpp)}</span>
                        </div>
                        {isPPN && (
                            <div className="flex justify-between text-violet-700">
                                <span>Total PPN (11%):</span>
                                <span className="font-mono font-bold">{fmt(sumPpn)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total Nilai PO Vendor Ini:</span>
                            <span className="font-mono text-primary text-sm">{fmt(sumTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                    >
                        Ya, Terbitkan PO Kolektif Vendor Ini
                    </button>
                </div>
            </div>
        </div>
    );
};
