import React, { useState, useMemo, useRef } from "react";
import {
    BillboardLocation,
    Project,
    ActiveTab,
    FiscalMode,
    mockVendors,
    fmt,
    calcFinancials,
    ClientPaymentPlan,
    PaymentTerm,
    SCHEME_LABELS,
    calcPaymentSummary,
} from "./projectTypes";
import { PrintablePODocument } from "./PrintablePODocument";

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: Project["status"] }) => {
    const map: Record<Project["status"], { bg: string; dot: string; text: string }> = {
        Draft: { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400", text: "Draft" },
        Active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", text: "Aktif" },
        Completed: { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", text: "Selesai" },
        Cancelled: { bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500", text: "Dibatalkan" },
    };
    const s = map[status] || map.Draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// LocationsTab
// ─────────────────────────────────────────────────────────────────────────────
function LocationsTab({ locations, isPPN, onAddLocation, onDeleteLocation }: {
    locations: BillboardLocation[];
    isPPN: boolean;
    onAddLocation: (loc: BillboardLocation) => void;
    onDeleteLocation: (id: number) => void;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");
    const [form, setForm] = useState({
        area: "",
        description: "",
        type: "Billboard" as BillboardLocation["type"],
        orientation: "V" as "V" | "H",
        size: "",
        vendorCost: "",
        taxMode: "dpp" as "dpp" | "inc",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const typeColors: Record<BillboardLocation["type"], string> = {
        Billboard: "bg-blue-50 text-blue-700 border-blue-100",
        Videotron: "bg-violet-50 text-violet-700 border-violet-100",
        Baliho: "bg-amber-50 text-amber-700 border-amber-100",
        Neonbox: "bg-emerald-50 text-emerald-700 border-emerald-100",
    };

    // Group locations by vendor
    const groupedLocations = useMemo(() => {
        const map = new Map<number, { vendorId: number; vendorName: string; items: BillboardLocation[] }>();

        locations.forEach(loc => {
            const vId = loc.vendorId || 0;
            if (!map.has(vId)) {
                map.set(vId, {
                    vendorId: vId,
                    vendorName: loc.vendorName || "Vendor Tidak Teridentifikasi",
                    items: [],
                });
            }
            map.get(vId)!.items.push(loc);
        });

        return Array.from(map.values());
    }, [locations]);

    // Live calculation for point cost in modal
    const parsedVendorRaw = parseInt(form.vendorCost.replace(/[^0-9]/g, ""), 10) || 0;
    const computedVendorCost = useMemo(() => {
        if (!parsedVendorRaw) return { dpp: 0, ppn: 0, total: 0 };
        if (!isPPN) return { dpp: parsedVendorRaw, ppn: 0, total: parsedVendorRaw };
        if (form.taxMode === "inc") {
            const dpp = Math.round(parsedVendorRaw / 1.11);
            const ppn = parsedVendorRaw - dpp;
            return { dpp, ppn, total: parsedVendorRaw };
        } else {
            const ppn = Math.round(parsedVendorRaw * 0.11);
            const total = parsedVendorRaw + ppn;
            return { dpp: parsedVendorRaw, ppn, total };
        }
    }, [parsedVendorRaw, form.taxMode, isPPN]);

    const openAddModal = (vendorIdStr: string = "") => {
        setSelectedVendorId(vendorIdStr);
        setForm({ area: "", description: "", type: "Billboard", orientation: "V", size: "", vendorCost: "", taxMode: "dpp" });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedVendorId) errs.vendorId = "Pilih vendor terlebih dahulu.";
        if (!form.area.trim()) errs.area = "Area wajib diisi.";
        if (!form.description.trim()) errs.description = "Deskripsi wajib diisi.";
        if (!form.size.trim()) errs.size = "Ukuran wajib diisi.";
        if (!form.vendorCost) errs.vendorCost = "Biaya titik wajib diisi.";
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        const vendor = mockVendors.find(v => v.id === parseInt(selectedVendorId))!;
        const newLoc: BillboardLocation = {
            id: Date.now(),
            code: `LOC-${String(Date.now()).slice(-4)}`,
            area: form.area.trim(),
            description: form.description.trim(),
            type: form.type,
            orientation: form.orientation,
            size: form.size.trim(),
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorCost: computedVendorCost.dpp, // Always store pure DPP
            poIssued: false,
            poNumber: "",
        };
        onAddLocation(newLoc);
        setIsModalOpen(false);
        setForm({ area: "", description: "", type: "Billboard", orientation: "V", size: "", vendorCost: "", taxMode: "dpp" });
        setSelectedVendorId("");
        setErrors({});
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Vendor Button */}
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Daftar Vendor & Titik Lokasi</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {groupedLocations.length} Vendor &bull; Total {locations.length} Titik Lokasi
                    </p>
                </div>
                <button
                    onClick={() => openAddModal("")}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Tambah Titik / Vendor
                </button>
            </div>

            {groupedLocations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <p className="text-xs font-bold text-slate-600">Belum ada Vendor & Titik Lokasi</p>
                    <p className="text-[11px] text-slate-400 mt-1">Pilih vendor terlebih dahulu untuk mulai menambahkan titik lokasi.</p>
                    <button
                        onClick={() => openAddModal("")}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                        + Tambah Vendor & Titik Pertama
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {groupedLocations.map((group) => {
                        const totalVendorDpp = group.items.reduce((s, item) => s + item.vendorCost, 0);
                        return (
                            <div key={group.vendorId} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                                {/* Vendor Group Header */}
                                <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">{group.vendorName}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {group.items.length} Titik Lokasi &bull; Total Biaya Vendor Ini: <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{fmt(totalVendorDpp)}</span> {isPPN && "(DPP)"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openAddModal(String(group.vendorId))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] rounded-xl border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        Tambah Titik di Vendor Ini
                                    </button>
                                </div>

                                {/* Items under Vendor */}
                                <div className="p-3 space-y-2.5 bg-slate-50/40">
                                    {group.items.map((loc, idx) => (
                                        <div key={loc.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-slate-800">{loc.description}</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeColors[loc.type]}`}>{loc.type}</span>
                                                            {loc.poIssued && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">PO Terbit</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                            Area: <span className="text-slate-600 font-semibold">{loc.area}</span> &middot; Ukuran: <span className="text-slate-600 font-semibold">{loc.size}</span>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                                                            Biaya Titik: <span className="font-bold text-slate-700">{fmt(loc.vendorCost)}</span>
                                                            {isPPN && <span className="text-slate-400"> (DPP) + PPN {fmt(loc.vendorCost * 0.11)}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!loc.poIssued && (
                                                    <button
                                                        onClick={() => onDeleteLocation(loc.id)}
                                                        className="flex-shrink-0 w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-all cursor-pointer"
                                                        title="Hapus titik lokasi"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Vendor Total Summary Footer Bar */}
                                <div className="bg-slate-50/70 px-4 py-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
                                    <span className="text-slate-600 uppercase tracking-wider text-[10px]">
                                        Subtotal Biaya Vendor ({group.vendorName})
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-normal">
                                            {group.items.length} Titik Lokasi
                                        </span>
                                        {/* Total Tanpa Background & Tanpa Outline (Clean Bold Text Only) */}
                                        <span className="font-mono font-black text-sm text-slate-900 px-1 py-1">
                                            {fmt(totalVendorDpp)} {isPPN && <span className="text-[10px] font-bold text-slate-500">(DPP)</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Form: Vendor Multi-step / Select-First */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-white px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Tambah Titik Lokasi</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Pilih vendor mitra terlebih dahulu lalu masukkan rincian titik lokasi</p>
                                </div>
                                <button onClick={() => { setIsModalOpen(false); setErrors({}); }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Langkah 1: Pilih Vendor */}
                            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2">
                                <label className="text-xs font-bold text-blue-900 uppercase tracking-wide block">
                                    1. Pilih Vendor Mitra <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedVendorId}
                                    onChange={e => { setSelectedVendorId(e.target.value); setErrors({ ...errors, vendorId: "" }); }}
                                    className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-blue-500 transition-all shadow-xs"
                                >
                                    <option value="">-- Pilih Vendor Mitra --</option>
                                    {mockVendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                {errors.vendorId && <span className="text-[10px] text-rose-500 font-bold block">{errors.vendorId}</span>}
                            </div>

                            {/* Langkah 2: Detail Titik (hanya aktif setelah vendor dipilih / diisi) */}
                            <div className="space-y-4 pt-1">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Detail Titik Lokasi</h4>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5 col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Area / Kota <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.area}
                                            onChange={e => setForm({ ...form, area: e.target.value })}
                                            placeholder="cth: Semarang..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        {errors.area && <span className="text-[10px] text-rose-500 font-bold">{errors.area}</span>}
                                    </div>
                                    <div className="space-y-1.5 col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Tipe Media <span className="text-rose-500">*</span></label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: e.target.value as BillboardLocation["type"] })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        >
                                            {["Billboard", "Videotron", "Baliho", "Neonbox"].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 col-span-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Orientasi V/H <span className="text-rose-500">*</span></label>
                                        <select
                                            value={form.orientation}
                                            onChange={e => setForm({ ...form, orientation: e.target.value as "V" | "H" })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        >
                                            <option value="V">V (Vertical)</option>
                                            <option value="H">H (Horizontal)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Deskripsi Lokasi <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            placeholder="cth: Billboard Jl. Pandanaran KM 3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        {errors.description && <span className="text-[10px] text-rose-500 font-bold">{errors.description}</span>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Ukuran (PxL) <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={form.size}
                                            onChange={e => setForm({ ...form, size: e.target.value })}
                                            placeholder="cth: 4x6m, 6x12m..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                        {errors.size && <span className="text-[10px] text-rose-500 font-bold">{errors.size}</span>}
                                    </div>
                                </div>

                                {/* Input Biaya Titik dengan Tax Mode Switcher */}
                                <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                                            Biaya Titik <span className="text-rose-500">*</span>
                                        </label>

                                        {isPPN && (
                                            <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, taxMode: "dpp" })}
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${form.taxMode === "dpp"
                                                        ? "bg-white text-blue-700 shadow-2xs font-black"
                                                        : "text-slate-500 hover:text-slate-800"
                                                        }`}
                                                >
                                                    Belum PPN (DPP)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, taxMode: "inc" })}
                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all ${form.taxMode === "inc"
                                                        ? "bg-blue-600 text-white shadow-2xs font-black"
                                                        : "text-slate-500 hover:text-slate-800"
                                                        }`}
                                                >
                                                    Sudah Inc. PPN (11%)
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        value={form.vendorCost}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/[^0-9]/g, "");
                                            const formatted = raw ? parseInt(raw, 10).toLocaleString("id-ID") : "";
                                            setForm({ ...form, vendorCost: formatted });
                                        }}
                                        placeholder={
                                            isPPN
                                                ? form.taxMode === "inc"
                                                    ? "Masukkan Biaya Total (Sudah Inc PPN)..."
                                                    : "Masukkan Biaya DPP (Sebelum PPN)..."
                                                : "Total biaya titik..."
                                        }
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono shadow-2xs"
                                    />
                                    {errors.vendorCost && <span className="text-[10px] text-rose-500 font-bold">{errors.vendorCost}</span>}

                                    {/* Breakdown Live Titik */}
                                    {isPPN && parsedVendorRaw > 0 && (
                                        <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100/90 space-y-1.5 text-xs">
                                            <div className="flex justify-between items-center text-slate-600">
                                                <span className="font-medium text-[11px]">Nilai DPP Titik (Dasar Pajak)</span>
                                                <span className="font-mono font-bold text-slate-900">{fmt(computedVendorCost.dpp)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-violet-700">
                                                <span className="font-medium text-[11px]">PPN Masukan Vendor (11%)</span>
                                                <span className="font-mono font-bold">{fmt(computedVendorCost.ppn)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-blue-200/60 text-slate-900 font-bold">
                                                <span className="text-[11px]">Total Biaya PO Titik</span>
                                                <span className="font-mono text-blue-700 font-black text-xs">{fmt(computedVendorCost.total)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex gap-3">
                                <button type="button" onClick={() => { setIsModalOpen(false); setErrors({}); }} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer">Batal</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Simpan Titik Lokasi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function VendorPOTab({ locations, isPPN, projectCode, project, onIssuePO }: {
    locations: BillboardLocation[];
    isPPN: boolean;
    projectCode: string;
    project: Project;
    onIssuePO: (locId: number, poNumber: string, lighting?: "Berlampu" | "Tidak Berlampu", topNotes?: string) => void;
}) {
    const [confirmingLoc, setConfirmingLoc] = useState<BillboardLocation | null>(null);
    const [confirmingVendorGroup, setConfirmingVendorGroup] = useState<{ vendorId: number; vendorName: string; unissuedItems: BillboardLocation[] } | null>(null);
    const [poLighting, setPoLighting] = useState<"Berlampu" | "Tidak Berlampu">("Berlampu");
    const [poTopNotes, setPoTopNotes] = useState<string>("Lunas setelah visual terpasang");

    const handleDownloadPO = (vendorName: string, poNumber: string, items: BillboardLocation[], triggerPrint: boolean = false) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/po-pdf";
        form.target = "_blank";

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";
        
        const appendInput = (name: string, value: string) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput("_token", csrfToken);
        appendInput("vendorName", vendorName);
        appendInput("poNumber", poNumber);
        appendInput("isPPN", isPPN ? "true" : "false");
        appendInput("stream", "true");

        items.forEach((item, index) => {
            appendInput(`locations[${index}][id]`, item.id.toString());
            appendInput(`locations[${index}][description]`, item.description);
            appendInput(`locations[${index}][area]`, item.area);
            appendInput(`locations[${index}][type]`, item.type);
            appendInput(`locations[${index}][orientation]`, item.orientation || "V");
            appendInput(`locations[${index}][size]`, item.size || "4x6");
            appendInput(`locations[${index}][vendorCost]`, item.vendorCost.toString());
            appendInput(`locations[${index}][lighting]`, item.lighting || "Berlampu");
            appendInput(`locations[${index}][topNotes]`, item.topNotes || "Lunas setelah visual terpasang");
        });

        appendInput("project[name]", project.name);
        appendInput("project[period]", project.period || "1 Minggu");

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const [editingLoc, setEditingLoc] = useState<BillboardLocation | null>(null);

    const handleConfirmPO = () => {
        if (!confirmingLoc) return;
        const now = new Date();
        const seq = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        const yearShort = String(now.getFullYear()).slice(-2);

        // PPN: No urut / PTSSI-PO / bln / thn (cth: 001/PTSSI-PO/06/26)
        // NON PPN: No urut / YS-PO / bln / thn (cth: 001/YS-PO/06/26)
        const poNumber = isPPN
            ? `${seq}/PTSSI-PO/${monthStr}/${yearShort}`
            : `${seq}/YS-PO/${monthStr}/${yearShort}`;

        const updatedLoc: BillboardLocation = {
            ...confirmingLoc,
            poIssued: true,
            poNumber,
            lighting: poLighting,
            topNotes: poTopNotes,
        };

        onIssuePO(confirmingLoc.id, poNumber, poLighting, poTopNotes);
        setConfirmingLoc(null);

        // Auto Download PDF upon issuance
        handleDownloadPO(confirmingLoc.vendorName || "Vendor", poNumber, [updatedLoc]);
    };

    const handleConfirmVendorBulkPO = () => {
        if (!confirmingVendorGroup || confirmingVendorGroup.unissuedItems.length === 0) return;
        const now = new Date();
        const seq = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        const yearShort = String(now.getFullYear()).slice(-2);

        // PPN: No urut / PTSSI-PO / bln / thn (cth: 001/PTSSI-PO/06/26)
        // NON PPN: No urut / YS-PO / bln / thn (cth: 001/YS-PO/06/26)
        const collectivePoNumber = isPPN
            ? `${seq}/PTSSI-PO/${monthStr}/${yearShort}`
            : `${seq}/YS-PO/${monthStr}/${yearShort}`;

        const updatedItems = confirmingVendorGroup.unissuedItems.map(loc => ({
            ...loc,
            poIssued: true,
            poNumber: collectivePoNumber,
            lighting: poLighting,
            topNotes: poTopNotes,
        }));

        confirmingVendorGroup.unissuedItems.forEach(loc => {
            onIssuePO(loc.id, collectivePoNumber, poLighting, poTopNotes);
        });
        setConfirmingVendorGroup(null);

        // Auto Download PDF upon bulk issuance
        handleDownloadPO(confirmingVendorGroup.vendorName, collectivePoNumber, updatedItems);
    };

    const handleSaveEditPO = () => {
        if (!editingLoc) return;
        onIssuePO(editingLoc.id, editingLoc.poNumber || "", poLighting, poTopNotes);
        setEditingLoc(null);
    };

    const totalVendorDPP = locations.reduce((s, l) => s + l.vendorCost, 0);
    const totalPO = isPPN ? totalVendorDPP * 1.11 : totalVendorDPP;
    const issuedCount = locations.filter(l => l.poIssued).length;

    // Group PO locations by vendor
    const groupedVendorPOs = useMemo(() => {
        const map = new Map<number, { vendorId: number; vendorName: string; items: BillboardLocation[] }>();
        locations.forEach(loc => {
            const vId = loc.vendorId || 0;
            if (!map.has(vId)) {
                map.set(vId, {
                    vendorId: vId,
                    vendorName: loc.vendorName || "Vendor Tidak Teridentifikasi",
                    items: [],
                });
            }
            map.get(vId)!.items.push(loc);
        });
        return Array.from(map.values());
    }, [locations]);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Lokasi</div>
                    <div className="text-lg font-bold text-slate-800">{locations.length} titik</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">PO Sudah Terbit</div>
                    <div className="text-lg font-bold text-emerald-700">{issuedCount} titik</div>
                </div>
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">{isPPN ? "Total All PO (DPP+PPN)" : "Total All PO"}</div>
                    <div className="text-sm font-bold font-mono text-amber-700">{fmt(totalPO)}</div>
                </div>
            </div>

            {groupedVendorPOs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-medium">Belum ada titik lokasi. Tambahkan di tab "Titik Lokasi" terlebih dahulu.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedVendorPOs.map((group) => {
                        const vendorDpp = group.items.reduce((s, l) => s + l.vendorCost, 0);
                        const vendorPpn = isPPN ? vendorDpp * 0.11 : 0;
                        const vendorGrandTotal = vendorDpp + vendorPpn;
                        const unissuedItems = group.items.filter(l => !l.poIssued);
                        const vendorIssuedCount = group.items.length - unissuedItems.length;

                        return (
                            <div key={group.vendorId} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
                                {/* Header Per Vendor (Soft Slate) */}
                                <div className="bg-slate-100/90 border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 tracking-tight">{group.vendorName}</h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {group.items.length} Titik Lokasi &bull; {vendorIssuedCount}/{group.items.length} PO Terbit
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Tombol Terbitkan PO Kolektif Per Vendor */}
                                        {unissuedItems.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingVendorGroup({ vendorId: group.vendorId, vendorName: group.vendorName, unissuedItems })}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                Terbitkan PO Vendor ({unissuedItems.length} Titik)
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-xl flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                Semua PO Vendor Terbit
                                            </span>
                                        )}

                                        {/* Total Tagihan Per Vendor */}
                                        <div className="text-right bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                Total PO Vendor {isPPN && "(DPP+PPN)"}
                                            </div>
                                            <div className="text-xs font-black font-mono text-slate-800">
                                                {fmt(vendorGrandTotal)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Daftar Titik PO Under Vendor */}
                                <div className="p-3.5 space-y-3 bg-slate-50/40">
                                    {group.items.map((loc, idx) => {
                                        const dppTotal = loc.vendorCost;
                                        const ppnTotal = isPPN ? dppTotal * 0.11 : 0;
                                        const grandTotal = dppTotal + ppnTotal;
                                        return (
                                            <div key={loc.id} className={`rounded-xl border p-4 transition-all ${loc.poIssued ? "bg-emerald-50/60 border-emerald-200/60" : "bg-white border-slate-200/80"}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">{idx + 1}</div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-bold text-slate-800">{loc.description}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">{loc.area} &middot; {loc.type} &middot; {loc.size}</div>
                                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                <span className="text-[10px] font-mono text-slate-600">DPP: <span className="font-bold">{fmt(dppTotal)}</span></span>
                                                                {isPPN && <span className="text-[10px] font-mono text-slate-500">PPN: <span className="font-bold text-violet-600">{fmt(ppnTotal)}</span></span>}
                                                                <span className="text-[10px] font-mono font-bold text-slate-800">Total Biaya PO Titik: {fmt(grandTotal)}</span>
                                                            </div>
                                                            {loc.poIssued && (
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-md text-[10px] font-bold font-mono">
                                                                        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                        {loc.poNumber}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {!loc.poIssued ? (
                                                        <button onClick={() => setConfirmingLoc(loc)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            Terbitkan PO
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <button
                                                                onClick={() => handleDownloadPO(group.vendorName, loc.poNumber, [loc], false)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                                                                title="Buka Dokumen PO PDF"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                Buka PO PDF
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingLoc(loc);
                                                                    setPoLighting(loc.lighting || "Berlampu");
                                                                    setPoTopNotes(loc.topNotes || "Lunas setelah visual terpasang");
                                                                }}
                                                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200"
                                                                title="Edit Parameter PO"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Edit Parameter PO */}
            {editingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-white px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Edit Parameter Purchase Order (PO)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">PO #: <span className="font-mono font-bold text-slate-800">{editingLoc.poNumber}</span></p>
                                </div>
                                <button onClick={() => setEditingLoc(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
                                <div className="text-xs font-bold text-slate-800">{editingLoc.description}</div>
                                <div className="text-[11px] text-slate-500">{editingLoc.area} &middot; {editingLoc.type} &middot; {editingLoc.size}</div>
                                <div className="text-[11px] text-slate-500">Vendor: <span className="font-bold text-slate-700">{editingLoc.vendorName}</span></div>
                            </div>

                            {/* Opsi Edit Penerangan & TOP */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Penerangan PO</label>
                                    <select
                                        value={poLighting}
                                        onChange={e => setPoLighting(e.target.value as "Berlampu" | "Tidak Berlampu")}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Berlampu">Berlampu (Default)</option>
                                        <option value="Tidak Berlampu">Tidak Berlampu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Term Of Payment (TOP)</label>
                                    <select
                                        value={poTopNotes}
                                        onChange={e => setPoTopNotes(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Lunas setelah visual terpasang">Lunas setelah visual terpasang</option>
                                        <option value="DP 50%, Pelunasan setelah terpasang">DP 50%, Pelunasan setelah terpasang</option>
                                        <option value="DP 30%, Pelunasan 30 hari">DP 30%, Pelunasan 30 hari</option>
                                        <option value="CBD (Cash Before Delivery)">CBD (Cash Before Delivery)</option>
                                        <option value="Tempo 30 Hari (Net 30)">Tempo 30 Hari (Net 30)</option>
                                        <option value="Tempo 14 Hari (Net 14)">Tempo 14 Hari (Net 14)</option>
                                        <option value="Tempo 7 Hari (Net 7)">Tempo 7 Hari (Net 7)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex gap-3">
                                <button onClick={() => setEditingLoc(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                                <button onClick={handleSaveEditPO} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Simpan Perubahan PO</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Per Titik */}
            {confirmingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-white px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Konfirmasi Penerbitan PO (Per Titik)</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Purchase Order khusus akan diterbitkan untuk titik ini</p>
                                </div>
                                <button onClick={() => setConfirmingLoc(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                                <div className="text-xs font-bold text-slate-800">{confirmingLoc.description}</div>
                                <div className="text-[11px] text-slate-500">{confirmingLoc.area} &middot; {confirmingLoc.type} &middot; {confirmingLoc.size}</div>
                                <div className="text-[11px] text-slate-500">Vendor: <span className="font-bold text-slate-700">{confirmingLoc.vendorName}</span></div>
                            </div>

                            {/* Opsi Penerangan & TOP */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Penerangan PO</label>
                                    <select
                                        value={poLighting}
                                        onChange={e => setPoLighting(e.target.value as "Berlampu" | "Tidak Berlampu")}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Berlampu">Berlampu (Default)</option>
                                        <option value="Tidak Berlampu">Tidak Berlampu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Term Of Payment (TOP)</label>
                                    <select
                                        value={poTopNotes}
                                        onChange={e => setPoTopNotes(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Lunas setelah visual terpasang">Lunas setelah visual terpasang</option>
                                        <option value="DP 50%, Pelunasan setelah terpasang">DP 50%, Pelunasan setelah terpasang</option>
                                        <option value="DP 30%, Pelunasan 30 hari">DP 30%, Pelunasan 30 hari</option>
                                        <option value="CBD (Cash Before Delivery)">CBD (Cash Before Delivery)</option>
                                        <option value="Tempo 30 Hari (Net 30)">Tempo 30 Hari (Net 30)</option>
                                        <option value="Tempo 14 Hari (Net 14)">Tempo 14 Hari (Net 14)</option>
                                        <option value="Tempo 7 Hari (Net 7)">Tempo 7 Hari (Net 7)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600"><span>DPP Biaya Vendor:</span><span className="font-mono font-bold text-slate-800">{fmt(confirmingLoc.vendorCost)}</span></div>
                                {isPPN && <div className="flex justify-between text-violet-700"><span>PPN 11%:</span><span className="font-mono font-bold">{fmt(confirmingLoc.vendorCost * 0.11)}</span></div>}
                                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-blue-200/60">
                                    <span>Total Nilai PO Titik Ini:</span>
                                    <span className="font-mono text-blue-700 text-sm">{fmt(isPPN ? confirmingLoc.vendorCost * 1.11 : confirmingLoc.vendorCost)}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex gap-3">
                                <button onClick={() => setConfirmingLoc(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                                <button onClick={handleConfirmPO} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Ya, Terbitkan PO Titik Ini</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Kolektif Per Vendor */}
            {confirmingVendorGroup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-white px-6 py-5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Terbitkan PO Kolektif Vendor</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{confirmingVendorGroup.vendorName}</p>
                                </div>
                                <button onClick={() => setConfirmingVendorGroup(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 space-y-2">
                                <p className="text-xs font-bold text-blue-900">
                                    Akan menerbitkan 1 nomor PO gabungan untuk {confirmingVendorGroup.unissuedItems.length} titik lokasi sekaligus:
                                </p>
                                <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {confirmingVendorGroup.unissuedItems.map((item, i) => (
                                        <li key={item.id} className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/70 flex justify-between items-center">
                                            <span className="font-semibold">{i + 1}. {item.description} ({item.area})</span>
                                            <span className="font-mono font-bold text-slate-900">{fmt(item.vendorCost)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Opsi Penerangan & TOP */}
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Penerangan PO</label>
                                    <select
                                        value={poLighting}
                                        onChange={e => setPoLighting(e.target.value as "Berlampu" | "Tidak Berlampu")}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Berlampu">Berlampu (Default)</option>
                                        <option value="Tidak Berlampu">Tidak Berlampu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Term Of Payment (TOP)</label>
                                    <select
                                        value={poTopNotes}
                                        onChange={e => setPoTopNotes(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="Lunas setelah visual terpasang">Lunas setelah visual terpasang</option>
                                        <option value="DP 50%, Pelunasan setelah terpasang">DP 50%, Pelunasan setelah terpasang</option>
                                        <option value="DP 30%, Pelunasan 30 hari">DP 30%, Pelunasan 30 hari</option>
                                        <option value="CBD (Cash Before Delivery)">CBD (Cash Before Delivery)</option>
                                        <option value="Tempo 30 Hari (Net 30)">Tempo 30 Hari (Net 30)</option>
                                        <option value="Tempo 14 Hari (Net 14)">Tempo 14 Hari (Net 14)</option>
                                        <option value="Tempo 7 Hari (Net 7)">Tempo 7 Hari (Net 7)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Calculation Summary */}
                            {(() => {
                                const sumDpp = confirmingVendorGroup.unissuedItems.reduce((s, it) => s + it.vendorCost, 0);
                                const sumPpn = isPPN ? sumDpp * 0.11 : 0;
                                const sumTotal = sumDpp + sumPpn;
                                return (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600"><span>Total DPP ({confirmingVendorGroup.unissuedItems.length} Titik):</span><span className="font-mono font-bold text-slate-800">{fmt(sumDpp)}</span></div>
                                        {isPPN && <div className="flex justify-between text-violet-700"><span>Total PPN (11%):</span><span className="font-mono font-bold">{fmt(sumPpn)}</span></div>}
                                        <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                                            <span>Total Nilai PO Vendor Ini:</span>
                                            <span className="font-mono text-blue-700 text-sm">{fmt(sumTotal)}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="pt-3 border-t border-slate-100 flex gap-3">
                                <button onClick={() => setConfirmingVendorGroup(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                                <button onClick={handleConfirmVendorBulkPO} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Ya, Terbitkan PO Kolektif Vendor</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjectDetailSlide — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjectDetailSlide({
    project,
    isOpen,
    onClose,
    fiscalMode,
    onUpdateProject,
}: {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
    fiscalMode: FiscalMode;
    onUpdateProject: (updated: Project) => void;
}) {
    const [render, setRender] = useState(false);
    const [active, setActive] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("info");
    const [displayedProject, setDisplayedProject] = useState<Project | null>(project);
    const [locations, setLocations] = useState<BillboardLocation[]>(project ? project.locations : []);

    React.useEffect(() => {
        if (isOpen && project) {
            setDisplayedProject(project);
            setLocations(project.locations);
            setActiveTab("info");
            setRender(true);
            const timer = setTimeout(() => setActive(true), 20);
            return () => clearTimeout(timer);
        } else {
            setActive(false);
            const timer = setTimeout(() => setRender(false), 350);
            return () => clearTimeout(timer);
        }
    }, [isOpen, project]);

    if (!render || !displayedProject) return null;
    const prj = displayedProject;
    const isPPN = fiscalMode === "ppn";
    const fin = calcFinancials(prj, locations, fiscalMode);

    const tabs = [
        {
            id: "info" as ActiveTab,
            label: "Info Proyek",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: "locations" as ActiveTab,
            label: "Titik Lokasi",
            badge: locations.length,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {
            id: "vendors" as ActiveTab,
            label: "Vendor & PO",
            badge: locations.filter(l => l.poIssued).length > 0 ? `${locations.filter(l => l.poIssued).length}/${locations.length}` : undefined,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            id: "invoice" as ActiveTab,
            label: "Invoice Client",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            id: "payment" as ActiveTab,
            label: "Pembayaran",
            badge: prj.clientPaymentPlan
                ? (() => {
                    const s = calcPaymentSummary(prj.clientPaymentPlan);
                    return s.progressPercent === 100 ? "✓ Lunas" : `${s.progressPercent}%`;
                })()
                : undefined,
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )
        },
    ];

    const poCount = locations.filter(l => l.poIssued).length;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop — klik luar TIDAK menutup, gunakan tombol X */}
            <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${active ? "opacity-100" : "opacity-0"}`} />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                <div className={`pointer-events-auto relative w-[1100px] max-w-[95vw] h-screen bg-slate-50 shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${active ? "translate-x-0" : "translate-x-full"}`}>

                    {/* HEADER — Dark Elegant Gradient Header with Rich Metrics */}
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 pt-7 pb-6 flex-shrink-0 relative overflow-hidden border-b border-slate-800">
                        {/* Subtle Glowing Background Accents */}
                        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-6">
                                <div className="min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-md tracking-wider uppercase border border-blue-500/25 shadow-xs font-mono">
                                            {prj.code}
                                        </span>
                                        <StatusBadge status={prj.status} />
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border backdrop-blur-md ${isPPN
                                            ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                                            : "bg-slate-800/80 text-slate-300 border-slate-700/80"
                                            }`}>
                                            {isPPN ? "Mode PPN (11%)" : "Mode Non-PPN"}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tight leading-snug drop-shadow-xs">{prj.name}</h2>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                        <span className="text-slate-200 font-bold">{prj.clientName}</span>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {prj.period}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700/80 transition-all cursor-pointer shadow-sm hover:scale-105"
                                    title="Tutup panel"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Executive Metric Cards */}
                            <div className="grid grid-cols-4 gap-3.5 mt-6">
                                {/* Card 1: Nilai DPP / Kontrak */}
                                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800/90 shadow-md group hover:border-slate-700 transition-all">
                                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider">{isPPN ? "Nilai DPP Kontrak" : "Nilai Kontrak"}</span>
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black font-mono text-emerald-400 tracking-tight">{fmt(fin.dpp)}</div>
                                </div>

                                {/* Card 2: Total Tagihan */}
                                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800/90 shadow-md group hover:border-slate-700 transition-all">
                                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider">
                                            Total Tagihan Client {isPPN && <span className="text-blue-400 font-extrabold text-[9px] lowercase">(+ppn)</span>}
                                        </span>
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-sm font-black font-mono text-white tracking-tight">{fmt(fin.totalInvoice)}</div>
                                </div>

                                {/* Card 3: Estimasi Laba Bersih */}
                                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800/90 shadow-md group hover:border-slate-700 transition-all">
                                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Estimasi Laba Bersih</span>
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black font-mono tracking-tight ${fin.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {fmt(fin.netProfit)}
                                    </div>
                                </div>

                                {/* Card 4: Margin Keuntungan */}
                                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800/90 shadow-md group hover:border-slate-700 transition-all">
                                    <div className="flex items-center justify-between text-slate-400 mb-1.5">
                                        <span className="text-[10px] font-black uppercase tracking-wider">Margin Keuntungan</span>
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black font-mono tracking-tight ${fin.margin >= 30 ? "text-emerald-400" : "text-amber-400"}`}>
                                        {fin.margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABS NAVIGATION — Premium Modern Pills */}
                    <div className="flex border-b border-slate-200/90 bg-white px-6 flex-shrink-0 shadow-2xs">
                        <div className="flex gap-2 py-2.5">
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                                            }`}
                                    >
                                        <span className={isActive ? "text-blue-400" : "text-slate-400"}>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {tab.badge !== undefined && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-200/70 text-slate-600"
                                                }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTENT BODY */}
                    <div className="flex-1 overflow-y-auto p-7 space-y-6">

                        {/* INFO TAB — Styled Visual Cards & Clean Hierarchy */}
                        {activeTab === "info" && (
                            <div className="space-y-6">
                                {/* Section 1: Financial Summary Cards */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-600" /> Ringkasan Finansial Proyek
                                        </h3>
                                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                            {isPPN ? "Mode PPN Aktif" : "Mode Non-PPN"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nilai Kontrak (DPP)</div>
                                            <div className="text-base font-black font-mono text-emerald-600">{fmt(prj.contractValue)}</div>
                                            <p className="text-[10px] text-slate-400">Harga murni kesepakatan kontrak client</p>
                                        </div>

                                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan (Invoice Client)</div>
                                            <div className="text-base font-black font-mono text-slate-900">{fmt(fin.totalInvoice)}</div>
                                            <p className="text-[10px] text-slate-400">
                                                {isPPN ? `Termasuk PPN 11% (${fmt(fin.ppnKeluaran)})` : "Tanpa PPN"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: General Information Grid */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600" /> Detail Administrasi & Sales
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            {
                                                label: "Kode Proyek",
                                                value: <span className="font-mono font-bold text-slate-900">{prj.code}</span>,
                                                icon: (
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                label: "Status Proyek",
                                                value: <StatusBadge status={prj.status} />,
                                                icon: (
                                                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                label: "Client / Pengiklan",
                                                value: prj.clientName,
                                                icon: (
                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                label: "Sales PIC",
                                                value: prj.salesPIC,
                                                icon: (
                                                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                label: "Periode Kampanye",
                                                value: prj.period,
                                                icon: (
                                                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                )
                                            },
                                            {
                                                label: "Total Titik Lokasi",
                                                value: <span className="font-bold text-slate-800">{locations.length} titik terdaftar</span>,
                                                icon: (
                                                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                )
                                            },
                                        ].map((row, i) => (
                                            <div key={i} className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/60 flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/80 flex-shrink-0">
                                                    {row.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{row.label}</div>
                                                    <div className="text-xs font-bold text-slate-800 truncate">{row.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 3: PO Issuance Progress */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-blue-100 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Progress Terbit PO Vendor
                                        </span>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold backdrop-blur-md">
                                            {poCount} dari {locations.length} titik lokasi
                                        </span>
                                    </div>
                                    <div className="bg-black/20 rounded-full h-3 p-0.5 overflow-hidden backdrop-blur-xs">
                                        <div
                                            className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                                            style={{ width: locations.length > 0 ? `${(poCount / locations.length) * 100}%` : "0%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LOCATIONS TAB */}
                        {activeTab === "locations" && (
                            <LocationsTab
                                locations={locations}
                                isPPN={isPPN}
                                onAddLocation={(newLoc) => {
                                    const updated = [...locations, newLoc];
                                    setLocations(updated);
                                    onUpdateProject({ ...prj, locations: updated });
                                }}
                                onDeleteLocation={(locId) => {
                                    const updated = locations.filter(l => l.id !== locId);
                                    setLocations(updated);
                                    onUpdateProject({ ...prj, locations: updated });
                                }}
                            />
                        )}

                        {/* VENDOR & PO TAB */}
                        {activeTab === "vendors" && (
                            <VendorPOTab
                                locations={locations}
                                isPPN={isPPN}
                                projectCode={prj.code}
                                project={prj}
                                onIssuePO={(locId, poNumber, lighting, topNotes) => {
                                    const updated = locations.map(l =>
                                        l.id === locId ? { ...l, poIssued: true, poNumber, lighting, topNotes } : l
                                    );
                                    setLocations(updated);
                                    onUpdateProject({ ...prj, locations: updated });
                                }}
                            />
                        )}

                        {/* INVOICE TAB */}
                        {activeTab === "invoice" && (
                            <div className="space-y-6">
                                {/* Header Summary Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Invoice Client</div>
                                        <div className="flex items-center gap-2">
                                            {prj.invoiceIssued ? (
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    Sudah Diterbitkan
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                                    Draft (Belum Terbit)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4">
                                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Nomor Invoice</div>
                                        <div className="text-sm font-bold font-mono text-blue-900">
                                            {prj.invoiceIssued ? (prj.invoiceNumber || "INV-PPN-2026/001") : "Belum Diterbitkan"}
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">{isPPN ? "Total Tagihan (+PPN 11%)" : "Total Tagihan Client"}</div>
                                        <div className="text-sm font-bold font-mono text-emerald-700">{fmt(fin.totalInvoice)}</div>
                                    </div>
                                </div>

                                {/* Main Document Preview Card */}
                                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600" /> Detail Invoice Tagihan Client
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Penagihan atas sewa media billboard / videotron</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!prj.invoiceIssued ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const now = new Date();
                                                        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
                                                        const yearStr = String(now.getFullYear()).slice(-2);
                                                        const seqStr = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
                                                        const newInvNumber = isPPN
                                                            ? `INV-${monthStr}/${yearStr}/${seqStr}`
                                                            : `INV-NP-${monthStr}/${yearStr}/${seqStr}`;
                                                        
                                                        const updatedPrj: Project = {
                                                            ...prj,
                                                            invoiceIssued: true,
                                                            invoiceNumber: newInvNumber,
                                                        };

                                                        onUpdateProject(updatedPrj);

                                                        // Auto trigger PDF download/preview after issuance
                                                        const form = document.createElement("form");
                                                        form.method = "POST";
                                                        form.action = "/client-invoice-pdf";
                                                        form.target = "_blank";

                                                        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

                                                        const appendInput = (name: string, value: string) => {
                                                            const input = document.createElement("input");
                                                            input.type = "hidden";
                                                            input.name = name;
                                                            input.value = value;
                                                            form.appendChild(input);
                                                        };

                                                        appendInput("_token", csrfToken);
                                                        appendInput("clientName", prj.clientName || "Bapak Sugiyamto, S.Pd., M.Pd.");
                                                        appendInput("clientSubName", "Kepala SMK Binawiyata Karangmalang Sragen");
                                                        appendInput("invoiceNumber", newInvNumber);
                                                        appendInput("invoiceDate", now.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }));
                                                        appendInput("isPPN", isPPN ? "true" : "false");
                                                        appendInput("stream", "true");

                                                        const sumVendorCost = locations.reduce((s, l) => s + (l.vendorCost || 0), 0);
                                                        locations.forEach((loc, idx) => {
                                                            const clientItemDpp = sumVendorCost > 0
                                                                ? (loc.vendorCost / sumVendorCost) * prj.contractValue
                                                                : (locations.length > 0 ? prj.contractValue / locations.length : 0);

                                                            appendInput(`locations[${idx}][type]`, loc.type);
                                                            appendInput(`locations[${idx}][size]`, loc.size || "4x6m");
                                                            appendInput(`locations[${idx}][orientation]`, loc.orientation || "V");
                                                            appendInput(`locations[${idx}][description]`, loc.description);
                                                            appendInput(`locations[${idx}][area]`, loc.area || "");
                                                            appendInput(`locations[${idx}][qty]`, (loc.qty || 1).toString());
                                                            appendInput(`locations[${idx}][clientPrice]`, clientItemDpp.toString());
                                                            appendInput(`locations[${idx}][vendorCost]`, clientItemDpp.toString());
                                                        });

                                                        document.body.appendChild(form);
                                                        form.submit();
                                                        document.body.removeChild(form);
                                                    }}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    Terbitkan Invoice Client
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const form = document.createElement("form");
                                                        form.method = "POST";
                                                        form.action = "/client-invoice-pdf";
                                                        form.target = "_blank";

                                                        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

                                                        const appendInput = (name: string, value: string) => {
                                                            const input = document.createElement("input");
                                                            input.type = "hidden";
                                                            input.name = name;
                                                            input.value = value;
                                                            form.appendChild(input);
                                                        };

                                                        appendInput("_token", csrfToken);
                                                        appendInput("clientName", prj.clientName || "Bapak Sugiyamto, S.Pd., M.Pd.");
                                                        appendInput("clientSubName", "Kepala SMK Binawiyata Karangmalang Sragen");
                                                        appendInput("invoiceNumber", prj.invoiceNumber || "INV-06/2026/001");
                                                        appendInput("invoiceDate", new Date().toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }));
                                                        appendInput("isPPN", isPPN ? "true" : "false");
                                                        appendInput("stream", "true");

                                                        const sumVendorCost = locations.reduce((s, l) => s + (l.vendorCost || 0), 0);
                                                        locations.forEach((loc, idx) => {
                                                            const clientItemDpp = sumVendorCost > 0
                                                                ? (loc.vendorCost / sumVendorCost) * prj.contractValue
                                                                : (locations.length > 0 ? prj.contractValue / locations.length : 0);

                                                            appendInput(`locations[${idx}][type]`, loc.type);
                                                            appendInput(`locations[${idx}][size]`, loc.size || "4x6m");
                                                            appendInput(`locations[${idx}][orientation]`, loc.orientation || "V");
                                                            appendInput(`locations[${idx}][description]`, loc.description);
                                                            appendInput(`locations[${idx}][area]`, loc.area || "");
                                                            appendInput(`locations[${idx}][qty]`, (loc.qty || 1).toString());
                                                            appendInput(`locations[${idx}][clientPrice]`, clientItemDpp.toString());
                                                            appendInput(`locations[${idx}][vendorCost]`, clientItemDpp.toString());
                                                        });

                                                        document.body.appendChild(form);
                                                        form.submit();
                                                        document.body.removeChild(form);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    Buka PDF Invoice
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Client & Invoice Meta Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditagihkan Kepada (Client)</div>
                                            <div className="text-xs font-bold text-slate-900">{prj.clientName}</div>
                                            <div className="text-[11px] text-slate-500 space-y-0.5">
                                                <div>Sales PIC: <span className="font-semibold text-slate-700">{prj.salesPIC}</span></div>
                                                <div>Periode Sewa: <span className="font-semibold text-slate-700">{prj.period}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skema Pembayaran</div>
                                            {prj.clientPaymentPlan ? (() => {
                                                const plan = prj.clientPaymentPlan!;
                                                const summary = calcPaymentSummary(plan);
                                                return (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                                {SCHEME_LABELS[plan.scheme]}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 space-y-0.5">
                                                            <div>Progress: <span className={`font-semibold ${summary.progressPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{summary.progressPercent}% ({summary.paidCount}/{summary.totalCount} termin)</span></div>
                                                            <div>Mode Pajak: <span className="font-semibold text-slate-700">{isPPN ? "PPN 11%" : "Non-PPN"}</span></div>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <div className="space-y-1">
                                                    <div className="text-xs font-bold text-amber-700">Belum Diatur</div>
                                                    <div className="text-[11px] text-slate-500">Mode Pajak: <span className="font-semibold text-slate-700">{isPPN ? "PPN 11%" : "Non-PPN"}</span></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab("payment")}
                                                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                                                    >
                                                        + Buat rencana pembayaran
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Table Breakdown */}
                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <th className="px-3.5 py-2.5 text-center w-10">NO</th>
                                                    <th className="px-3.5 py-2.5">DESKRIPSI TITIK LOKASI</th>
                                                    <th className="px-3.5 py-2.5 text-center w-20">UKURAN</th>
                                                    <th className="px-3.5 py-2.5 text-right w-36">NILAI KONTRAK CLIENT (DPP)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                                {(() => {
                                                    const sumVendorCost = locations.reduce((s, l) => s + (l.vendorCost || 0), 0);
                                                    return locations.map((loc, idx) => {
                                                        const clientItemDpp = sumVendorCost > 0
                                                            ? (loc.vendorCost / sumVendorCost) * prj.contractValue
                                                            : (locations.length > 0 ? prj.contractValue / locations.length : 0);
                                                        return (
                                                            <tr key={loc.id} className="hover:bg-slate-50/50">
                                                                <td className="px-3.5 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                                                <td className="px-3.5 py-3">
                                                                    <div className="font-bold text-slate-800">{loc.description}</div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5">{loc.area} &middot; {loc.type}</div>
                                                                </td>
                                                                <td className="px-3.5 py-3 text-center font-mono text-[11px]">{loc.size || "4x6m"}</td>
                                                                <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-800">{fmt(clientItemDpp)}</td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Rincian Total Tagihan */}
                                    <div className="bg-slate-900 rounded-2xl p-5 text-white flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Tagihan Akhir</div>
                                            <div className="text-xs text-slate-300 mt-0.5">
                                                {isPPN ? `DPP (${fmt(fin.dpp)}) + PPN 11% (${fmt(fin.ppnKeluaran)})` : `DPP (${fmt(fin.dpp)}) - Non PPN`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Grand Total Invoice</div>
                                            <div className="text-xl font-black font-mono text-emerald-400 tracking-tight">{fmt(fin.totalInvoice)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PAYMENT TAB */}
                        {activeTab === "payment" && (
                            <div className="space-y-5">
                                {prj.clientPaymentPlan ? (() => {
                                    const plan = prj.clientPaymentPlan!;
                                    const summary = calcPaymentSummary(plan);
                                    const isFullyPaid = summary.progressPercent === 100;

                                    return (
                                        <>
                                            {/* Status Header Banner */}
                                            <div className={`rounded-2xl p-4 border flex items-center gap-4 ${
                                                isFullyPaid
                                                    ? "bg-emerald-50 border-emerald-200"
                                                    : "bg-amber-50 border-amber-200"
                                            }`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    isFullyPaid ? "bg-emerald-100" : "bg-amber-100"
                                                }`}>
                                                    {isFullyPaid ? (
                                                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-black ${isFullyPaid ? "text-emerald-800" : "text-amber-800"}`}>
                                                        {isFullyPaid ? "Semua Pembayaran Lunas" : "Pembayaran Sedang Berjalan"}
                                                    </div>
                                                    <div className={`text-[11px] mt-0.5 ${isFullyPaid ? "text-emerald-600" : "text-amber-600"}`}>
                                                        Skema: <span className="font-semibold">{SCHEME_LABELS[plan.scheme]}</span>
                                                        {!isFullyPaid && summary.nextDue && (
                                                            <> &bull; Jatuh tempo berikutnya: <span className="font-semibold">
                                                                {new Date(summary.nextDue.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                            </span></>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`text-right flex-shrink-0 text-[10px] font-black uppercase tracking-wider ${isFullyPaid ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {summary.progressPercent}%
                                                </div>
                                            </div>

                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</div>
                                                    <div className="text-sm font-black font-mono text-slate-900">{fmt(summary.totalPaid + summary.totalRemaining)}</div>
                                                </div>
                                                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Sudah Diterima</div>
                                                    <div className="text-sm font-black font-mono text-emerald-700">{fmt(summary.totalPaid)}</div>
                                                </div>
                                                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-1">
                                                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Sisa Tagihan</div>
                                                    <div className="text-sm font-black font-mono text-rose-600">{fmt(summary.totalRemaining)}</div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="font-bold text-slate-500">Progress Pelunasan</span>
                                                    <span className={`font-black font-mono ${isFullyPaid ? "text-emerald-600" : "text-blue-600"}`}>{summary.progressPercent}%</span>
                                                </div>
                                                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${
                                                            isFullyPaid ? "bg-emerald-500" : "bg-blue-500"
                                                        }`}
                                                        style={{ width: `${summary.progressPercent}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {summary.paidCount} dari {summary.totalCount} termin selesai
                                                </div>
                                            </div>

                                            {/* Timeline Termin */}
                                            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden">
                                                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                        Timeline Pembayaran
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-slate-400">{plan.terms.length} Termin</span>
                                                </div>
                                                <div className="divide-y divide-slate-100">
                                                    {plan.terms.map((term, idx) => {
                                                        const isOverdue = term.status === "unpaid" && new Date(term.dueDate) < new Date();
                                                        const statusLabel = term.status === "paid" ? "Lunas" : isOverdue ? "Terlambat" : "Belum Bayar";
                                                        const statusColor = term.status === "paid"
                                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                            : isOverdue
                                                            ? "bg-rose-100 text-rose-700 border-rose-200"
                                                            : "bg-amber-100 text-amber-700 border-amber-200";

                                                        return (
                                                            <div key={term.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                                                                    term.status === "paid" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                                                }`}>
                                                                    {term.status === "paid" ? (
                                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) : idx + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-slate-800">{term.label}</div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                                        Jatuh tempo: {new Date(term.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                                                        {term.paidAt && (
                                                                            <> &bull; Dibayar: <span className="text-emerald-600 font-semibold">{new Date(term.paidAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span></>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex-shrink-0">
                                                                    <div className="text-xs font-black font-mono text-slate-800">{fmt(term.amount)}</div>
                                                                    <div className="text-[9px] text-slate-400">{term.percent}%</div>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border flex-shrink-0 ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* CTA */}
                                            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-white">Kelola Rencana Pembayaran</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Ubah skema, tambah termin, atau catat pembayaran</div>
                                                </div>
                                                <a
                                                    href={`/projects/${prj.id}/payment`}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
                                                >
                                                    Kelola
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </>
                                    );
                                })() : (
                                    /* Empty State */
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-sm font-black text-slate-700">Belum Ada Rencana Pembayaran</h3>
                                            <p className="text-xs text-slate-400 max-w-xs">Tentukan skema pembayaran (Lunas, DP, Termin, atau Cicilan) untuk proyek ini.</p>
                                        </div>
                                        <a
                                            href={`/projects/${prj.id}/payment`}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Buat Rencana Pembayaran
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

