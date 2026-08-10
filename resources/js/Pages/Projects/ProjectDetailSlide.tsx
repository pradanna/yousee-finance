import React, { useState, useMemo, useRef } from "react";
import {
    BillboardLocation,
    Project,
    ActiveTab,
    FiscalMode,
    mockVendors,
    fmt,
    formatIndoDate,
    calcFinancials,
    ClientPaymentPlan,
    PaymentTerm,
    PaymentScheme,
    PaymentTermStatus,
    SCHEME_LABELS,
    calcPaymentSummary,
    VendorPaymentRecord,
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
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-neon-primary cursor-pointer"
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
                                <button type="submit" className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer">Simpan Titik Lokasi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function VendorPOTab({ locations, isPPN, projectCode, project, onIssuePO, onUpdateProject }: {
    locations: BillboardLocation[];
    isPPN: boolean;
    projectCode: string;
    project: Project;
    onIssuePO: (
        locId: number,
        poNumber: string,
        lighting?: "Berlampu" | "Tidak Berlampu",
        topNotes?: string,
        vendorTermScheme?: PaymentScheme,
        vendorTermPercents?: number[],
        vendorTermDates?: string[]
    ) => void;
    onUpdateProject: (updated: Project) => void;
}) {
    const [confirmingLoc, setConfirmingLoc] = useState<BillboardLocation | null>(null);
    const [confirmingVendorGroup, setConfirmingVendorGroup] = useState<{ vendorId: number; vendorName: string; unissuedItems: BillboardLocation[] } | null>(null);
    const [poLighting, setPoLighting] = useState<"Berlampu" | "Tidak Berlampu">("Berlampu");
    const [poTopNotes, setPoTopNotes] = useState<string>("Lunas setelah visual terpasang");

    // Collapsible Vendor TOP State
    const [expandedVendorTop, setExpandedVendorTop] = useState<Record<number, boolean>>({});

    // Vendor TOP Terms Breakdown State
    const [vendorTermScheme, setVendorTermScheme] = useState<PaymentScheme>("full");
    const [vendorTermPercents, setVendorTermPercents] = useState<number[]>([100]);
    const [vendorTermDates, setVendorTermDates] = useState<string[]>([new Date().toISOString().split("T")[0]]);

    const handleSelectVendorScheme = (scheme: PaymentScheme) => {
        setVendorTermScheme(scheme);
        const today = new Date().toISOString().split("T")[0];
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const month2 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        if (scheme === "full") {
            setVendorTermPercents([100]);
            setVendorTermDates([today]);
            setPoTopNotes("Lunas setelah visual terpasang");
        } else if (scheme === "dp") {
            setVendorTermPercents([50, 50]);
            setVendorTermDates([today, nextMonth]);
            setPoTopNotes("DP 50%, Pelunasan 50% setelah terpasang");
        } else if (scheme === "termin") {
            setVendorTermPercents([30, 40, 30]);
            setVendorTermDates([today, nextMonth, month2]);
            setPoTopNotes("Termin 3 Tahap (30%, 40%, 30%)");
        } else if (scheme === "installment") {
            setVendorTermPercents([100]);
            setVendorTermDates([nextMonth]);
            setPoTopNotes("Tempo 30 Hari (Net 30)");
        }
    };

    // Vendor Payment Modal State
    const [selectedVendorForPay, setSelectedVendorForPay] = useState<{
        vendorName: string;
        poNumber: string;
        totalAmount: number;
        remainingAmount: number;
        schedule: Array<{
            id: string;
            label: string;
            percent: number;
            targetAmount: number;
            paidAmount: number;
            remainingAmount: number;
            dueDate: string;
            isPaid: boolean;
            isPartial: boolean;
        }>;
        selectedTermId?: string;
    } | null>(null);
    const [vPayType, setVPayType] = useState<"full" | "partial">("full");
    const [vPayAmountInput, setVPayAmountInput] = useState<number>(0);
    const [vPayDateInput, setVPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
    const [vPayMethodInput, setVPayMethodInput] = useState<string>("Transfer Bank BCA");
    const [vPayRefInput, setVPayRefInput] = useState<string>("");
    const [vPayNotesInput, setVPayNotesInput] = useState<string>("");

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
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        };

        onIssuePO(confirmingLoc.id, poNumber, poLighting, poTopNotes, vendorTermScheme, vendorTermPercents, vendorTermDates);
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
            vendorTermScheme,
            vendorTermPercents,
            vendorTermDates,
        }));

        confirmingVendorGroup.unissuedItems.forEach(loc => {
            onIssuePO(loc.id, collectivePoNumber, poLighting, poTopNotes, vendorTermScheme, vendorTermPercents, vendorTermDates);
        });
        setConfirmingVendorGroup(null);

        // Auto Download PDF upon bulk issuance
        handleDownloadPO(confirmingVendorGroup.vendorName, collectivePoNumber, updatedItems);
    };

    const handleSaveEditPO = () => {
        if (!editingLoc) return;
        onIssuePO(editingLoc.id, editingLoc.poNumber || "", poLighting, poTopNotes, vendorTermScheme, vendorTermPercents, vendorTermDates);
        setEditingLoc(null);
    };

    const totalVendorDPP = locations.reduce((s, l) => s + l.vendorCost, 0);
    const totalPO = isPPN ? totalVendorDPP * 1.11 : totalVendorDPP;
    const issuedCount = locations.filter(l => l.poIssued).length;

    const [poFilterScheme, setPoFilterScheme] = useState<"all" | "kolektif" | "titik">("all");

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

    // Filter vendor POs by PO scheme (Kolektif vs Per Titik)
    const filteredVendorPOs = useMemo(() => {
        return groupedVendorPOs.filter(group => {
            const issuedItems = group.items.filter(l => l.poIssued);
            const uniquePoNumbers = new Set(issuedItems.map(l => l.poNumber));
            const isCollective = uniquePoNumbers.size === 1 && issuedItems.length > 1;
            const isPerTitik = uniquePoNumbers.size > 1 || (issuedItems.length === 1 && group.items.length === 1);

            if (poFilterScheme === "kolektif") return isCollective || issuedItems.length === 0;
            if (poFilterScheme === "titik") return isPerTitik || issuedItems.length === 0;
            return true;
        });
    }, [groupedVendorPOs, poFilterScheme]);

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

            {/* Filter Skema PO Segmented Switch */}
            <div className="flex items-center justify-between bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setPoFilterScheme("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            poFilterScheme === "all"
                                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <span>Semua Skema PO</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono">{groupedVendorPOs.length}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPoFilterScheme("kolektif")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            poFilterScheme === "kolektif"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>PO Kolektif Vendor</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPoFilterScheme("titik")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            poFilterScheme === "titik"
                                ? "bg-teal-600 text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>PO Per Titik Lokasi</span>
                    </button>
                </div>

                <div className="text-[11px] font-medium text-slate-500 pr-2">
                    Menampilkan <strong className="text-slate-800">{filteredVendorPOs.length} Vendor</strong>
                </div>
            </div>

            {filteredVendorPOs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                    <p className="text-xs font-medium">Tidak ada vendor untuk skema PO yang dipilih.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredVendorPOs.map((group) => {
                        const vendorDpp = group.items.reduce((s, l) => s + l.vendorCost, 0);
                        const vendorPpn = isPPN ? vendorDpp * 0.11 : 0;
                        const vendorGrandTotal = vendorDpp + vendorPpn;
                        const unissuedItems = group.items.filter(l => !l.poIssued);
                        const vendorIssuedCount = group.items.length - unissuedItems.length;

                        // Payment Calculations for Vendor
                        const vendorRecords = (project.vendorPayments || []).filter(vp => vp.vendorName === group.vendorName);
                        const totalVendorPaid = vendorRecords.reduce((s, r) => s + r.amount, 0);
                        const vendorRemaining = Math.max(0, vendorGrandTotal - totalVendorPaid);
                        const isFullyPaid = totalVendorPaid >= vendorGrandTotal && vendorGrandTotal > 0;
                        const isPartialPaid = totalVendorPaid > 0 && !isFullyPaid;

                        const firstPoNum = group.items.find(l => l.poNumber)?.poNumber || `PO-${group.vendorName.replace(/\s+/g, '')}`;

                        const issuedItems = group.items.filter(l => l.poIssued);
                        const uniquePoNumbers = new Set(issuedItems.map(l => l.poNumber));
                        const isCollectivePO = uniquePoNumbers.size === 1 && issuedItems.length > 1;
                        const isPerTitikPO = uniquePoNumbers.size > 1 || (issuedItems.length === 1 && group.items.length === 1);

                        return (
                            <div key={group.vendorId} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs space-y-0">
                                {/* Header Per Vendor (Soft Slate) */}
                                <div className="bg-slate-100/90 border-b border-slate-200/80 px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4" /></svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-xs font-bold text-slate-900 tracking-tight">{group.vendorName}</h4>

                                                {/* Badge Skema PO */}
                                                {isCollectivePO ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80 flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                        PO Kolektif
                                                    </span>
                                                ) : isPerTitikPO ? (
                                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        PO Per Titik
                                                    </span>
                                                ) : null}

                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                                                    isFullyPaid
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : isPartialPaid
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {isFullyPaid ? 'Lunas Vendor' : isPartialPaid ? 'Bayar Parsial' : 'Belum Dibayar'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {group.items.length} Titik Lokasi &bull; {vendorIssuedCount}/{group.items.length} PO Terbit
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Tombol Terbitkan PO Kolektif Per Vendor */}
                                        {unissuedItems.length > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmingVendorGroup({ vendorId: group.vendorId, vendorName: group.vendorName, unissuedItems })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                Terbitkan PO Vendor ({unissuedItems.length} Titik)
                                            </button>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-xl flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                Semua PO Terbit
                                            </span>
                                        )}

                                        {/* Dynamic Vendor TOP Schedule & Due Dates calculation */}
                                        {(() => {
                                            const firstIssuedLoc = group.items.find(l => l.poIssued);
                                            const schemePercents = firstIssuedLoc?.vendorTermPercents || (
                                                poTopNotes.includes("30") || poTopNotes.includes("Termin") ? [30, 40, 30] : [50, 50]
                                            );
                                            const schemeDates = firstIssuedLoc?.vendorTermDates || [
                                                new Date().toISOString().split("T")[0],
                                                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                                new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                            ];

                                            let runningPaid = totalVendorPaid;
                                            const vendorSchedule = schemePercents.map((pct, idx) => {
                                                const targetAmount = Math.round((vendorGrandTotal * pct) / 100);
                                                const paidAmount = Math.min(targetAmount, Math.max(0, runningPaid));
                                                runningPaid -= paidAmount;
                                                const remainingAmount = Math.max(0, targetAmount - paidAmount);
                                                const isPaid = paidAmount >= targetAmount && targetAmount > 0;
                                                const isPartial = paidAmount > 0 && !isPaid;
                                                const dueDate = schemeDates[idx] || new Date().toISOString().split("T")[0];

                                                const label = schemePercents.length === 1
                                                    ? "Pelunasan Total Vendor"
                                                    : idx === 0
                                                    ? "Termin 1 – Uang Muka (DP)"
                                                    : idx === schemePercents.length - 1
                                                    ? `Termin ${idx + 1} – Pelunasan`
                                                    : `Termin ${idx + 1} – Progres`;

                                                return {
                                                    id: `vterm-${group.vendorId}-${idx}`,
                                                    label,
                                                    percent: pct,
                                                    targetAmount,
                                                    paidAmount,
                                                    remainingAmount,
                                                    dueDate,
                                                    isPaid,
                                                    isPartial,
                                                };
                                            });

                                            if (vendorIssuedCount === 0) return null;

                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const firstUnpaid = vendorSchedule.find(t => !t.isPaid);
                                                        setSelectedVendorForPay({
                                                            vendorName: group.vendorName,
                                                            poNumber: firstPoNum,
                                                            totalAmount: vendorGrandTotal,
                                                            remainingAmount: vendorRemaining,
                                                            schedule: vendorSchedule,
                                                            selectedTermId: firstUnpaid?.id,
                                                        });
                                                        setVPayType(firstUnpaid ? "partial" : "full");
                                                        setVPayAmountInput(firstUnpaid ? firstUnpaid.remainingAmount : (vendorRemaining > 0 ? vendorRemaining : vendorGrandTotal));
                                                        setVPayDateInput(new Date().toISOString().split("T")[0]);
                                                        setVPayMethodInput("Transfer Bank BCA");
                                                        setVPayRefInput("");
                                                        setVPayNotesInput(firstUnpaid ? `Pembayaran ${firstUnpaid.label} PO ${firstPoNum}` : `Pelunasan PO ${firstPoNum}`);
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                    Bayar Vendor
                                                </button>
                                            );
                                        })()}

                                        {/* Ringkasan Keuangan Vendor */}
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono text-[10px]">
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Target PO</div>
                                                <div className="font-bold text-slate-800">{fmt(vendorGrandTotal)}</div>
                                            </div>
                                            <div className="h-5 w-px bg-slate-200 mx-1" />
                                            <div>
                                                <div className="text-[9px] font-bold text-emerald-600 uppercase">Dibayar</div>
                                                <div className="font-bold text-emerald-700">{fmt(totalVendorPaid)}</div>
                                            </div>
                                            <div className="h-5 w-px bg-slate-200 mx-1" />
                                            <div>
                                                <div className="text-[9px] font-bold text-rose-500 uppercase">Sisa Hutang</div>
                                                <div className="font-bold text-rose-600">{fmt(vendorRemaining)}</div>
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

                                {/* Dynamic Vendor TOP Stepper & Collapsible Schedule (Hanya tampil jika PO sudah terbit) */}
                                {vendorIssuedCount > 0 && (() => {
                                    const firstIssuedLoc = group.items.find(l => l.poIssued);
                                    const schemePercents = firstIssuedLoc?.vendorTermPercents || (
                                        poTopNotes.includes("30") || poTopNotes.includes("Termin") ? [30, 40, 30] : [50, 50]
                                    );
                                    const schemeDates = firstIssuedLoc?.vendorTermDates || [
                                        new Date().toISOString().split("T")[0],
                                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                    ];

                                    let runningPaid = totalVendorPaid;
                                    const vendorSchedule = schemePercents.map((pct, idx) => {
                                        const targetAmount = Math.round((vendorGrandTotal * pct) / 100);
                                        const paidAmount = Math.min(targetAmount, Math.max(0, runningPaid));
                                        runningPaid -= paidAmount;
                                        const remainingAmount = Math.max(0, targetAmount - paidAmount);
                                        const isPaid = paidAmount >= targetAmount && targetAmount > 0;
                                        const isPartial = paidAmount > 0 && !isPaid;
                                        const dueDate = schemeDates[idx] || new Date().toISOString().split("T")[0];

                                        const label = schemePercents.length === 1
                                            ? "Pelunasan Total Vendor"
                                            : idx === 0
                                            ? "Termin 1 – Uang Muka (DP)"
                                            : idx === schemePercents.length - 1
                                            ? `Termin ${idx + 1} – Pelunasan`
                                            : `Termin ${idx + 1} – Progres`;

                                        return {
                                            id: `vterm-${group.vendorId}-${idx}`,
                                            label,
                                            percent: pct,
                                            targetAmount,
                                            paidAmount,
                                            remainingAmount,
                                            dueDate,
                                            isPaid,
                                            isPartial,
                                        };
                                    });

                                    const isExpanded = !!expandedVendorTop[group.vendorId];

                                    return (
                                        <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedVendorTop(prev => ({ ...prev, [group.vendorId]: !prev[group.vendorId] }))}
                                                className="w-full flex items-center justify-between gap-4 cursor-pointer group text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 text-slate-700 text-xs font-bold">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>TOP Vendor:</span>
                                                    </div>

                                                    {/* Stepper Progress Bar horizontal */}
                                                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto py-0.5 scrollbar-none">
                                                        {vendorSchedule.map((term, idx) => (
                                                            <div key={term.id} className="flex items-center gap-2 flex-shrink-0">
                                                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                                                    term.isPaid
                                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                        : term.isPartial
                                                                        ? "bg-blue-50 text-blue-800 border-blue-200"
                                                                        : "bg-white text-slate-700 border-slate-200"
                                                                }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                                        term.isPaid ? "bg-emerald-500" : term.isPartial ? "bg-blue-500" : "bg-amber-500"
                                                                    }`} />
                                                                    <span>{term.label} ({term.percent}%)</span>
                                                                    <span className="text-slate-400 font-mono font-normal">| {formatIndoDate(term.dueDate)}</span>
                                                                </div>
                                                                {idx < vendorSchedule.length - 1 && (
                                                                    <span className="text-slate-300 font-bold text-xs">&rarr;</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold text-blue-600 group-hover:text-blue-800 transition-colors bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                                                    <span>{isExpanded ? "Sembunyikan Rincian" : "Rincian TOP"}</span>
                                                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {/* Collapsible Content */}
                                            {isExpanded && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                                        <span>Rincian Pelaksanaan & Jatuh Tempo Pembayaran Vendor</span>
                                                        <span className="font-bold text-slate-700">{vendorSchedule.length} Termin ({vendorGrandTotal > 0 ? Math.round((totalVendorPaid / vendorGrandTotal) * 100) : 0}% Realisasi)</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                        {vendorSchedule.map((term) => (
                                                            <div
                                                                key={term.id}
                                                                className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                                                                    term.isPaid
                                                                        ? "bg-emerald-50/60 border-emerald-200"
                                                                        : term.isPartial
                                                                        ? "bg-blue-50/60 border-blue-200"
                                                                        : "bg-white border-slate-200 shadow-2xs"
                                                                }`}
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs font-bold text-slate-900">{term.label}</span>
                                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                                                                            term.isPaid
                                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                                                : term.isPartial
                                                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                                                : "bg-amber-100 text-amber-800 border-amber-200"
                                                                        }`}>
                                                                            {term.isPaid ? "Lunas" : term.isPartial ? "Bayar Parsial" : "Belum Dibayar"}
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                                                        <span>Porsi: <strong className="text-slate-700">{term.percent}%</strong></span>
                                                                        <span className="font-mono font-bold text-slate-800">{fmt(term.targetAmount)}</span>
                                                                    </div>

                                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                        <span>Jatuh Tempo:</span>
                                                                        <span className="font-semibold text-slate-700 font-mono">{formatIndoDate(term.dueDate)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                                                                    <div className="text-[10px]">
                                                                        {term.isPaid ? (
                                                                            <span className="text-emerald-700 font-bold">Lunas ({fmt(term.targetAmount)})</span>
                                                                        ) : (
                                                                            <span className="text-rose-600 font-mono font-bold">Sisa: {fmt(term.remainingAmount)}</span>
                                                                        )}
                                                                    </div>

                                                                    {!term.isPaid && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedVendorForPay({
                                                                                    vendorName: group.vendorName,
                                                                                    poNumber: firstPoNum,
                                                                                    totalAmount: vendorGrandTotal,
                                                                                    remainingAmount: vendorRemaining,
                                                                                    schedule: vendorSchedule,
                                                                                    selectedTermId: term.id,
                                                                                });
                                                                                setVPayType(term.remainingAmount >= term.targetAmount ? "full" : "partial");
                                                                                setVPayAmountInput(term.remainingAmount);
                                                                                setVPayDateInput(new Date().toISOString().split("T")[0]);
                                                                                setVPayMethodInput("Transfer Bank BCA");
                                                                                setVPayRefInput("");
                                                                                setVPayNotesInput(`Pembayaran ${term.label} PO ${firstPoNum}`);
                                                                            }}
                                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                                                        >
                                                                            Bayar Termin Ini
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Riwayat Pembayaran Vendor per Vendor Group */}
                                {vendorRecords.length > 0 && (
                                    <div className="p-4 bg-slate-100/60 border-t border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                Riwayat Pembayaran Keluar (PO {group.vendorName})
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600">
                                                {vendorRecords.length} Transaksi Keluar
                                            </span>
                                        </div>

                                        <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-200/60 bg-white">
                                            {vendorRecords.map((rec) => (
                                                <div key={rec.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                                            ↑
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 truncate">
                                                                Transfer ke {rec.vendorName} ({rec.poNumber})
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                                                <span>Tgl: <strong className="text-slate-600">{formatIndoDate(rec.paidAt)}</strong></span>
                                                                <span>&bull;</span>
                                                                <span>Metode: <strong className="text-slate-600">{rec.paymentMethod}</strong></span>
                                                                {rec.paymentRef && (
                                                                    <>
                                                                        <span>&bull;</span>
                                                                        <span>Ref: <strong className="text-slate-600 font-mono">{rec.paymentRef}</strong></span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="text-right">
                                                            <div className="font-black font-mono text-rose-600 text-xs">- {fmt(rec.amount)}</div>
                                                            <div className="text-[9px] text-slate-400 font-medium">Pembayaran Vendor</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updatedVendorPayments = (project.vendorPayments || []).filter(vp => vp.id !== rec.id);
                                                                onUpdateProject({ ...project, vendorPayments: updatedVendorPayments });
                                                            }}
                                                            className="text-slate-400 hover:text-rose-600 font-bold text-xs p-1 cursor-pointer"
                                                            title="Hapus / Batal Transaksi Pembayaran Vendor Ini"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Catat Pembayaran Vendor */}
            {selectedVendorForPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                                    Catat Pembayaran Keluar (Vendor)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedVendorForPay.vendorName} ({selectedVendorForPay.poNumber})</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedVendorForPay(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Summary Box */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Tagihan PO Vendor</div>
                                <div className="text-sm font-black font-mono text-slate-900">{fmt(selectedVendorForPay.totalAmount)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Sisa Hutang</div>
                                <div className="text-xs font-bold font-mono text-rose-600">{fmt(selectedVendorForPay.remainingAmount)}</div>
                            </div>
                        </div>

                        {/* Jadwal Termin & Jatuh Tempo Selector */}
                        {selectedVendorForPay.schedule && selectedVendorForPay.schedule.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Pilih Termin Pembayaran & Jatuh Tempo</label>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {selectedVendorForPay.schedule.map((term) => {
                                        const isSelected = selectedVendorForPay.selectedTermId === term.id;
                                        return (
                                            <button
                                                key={term.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedVendorForPay({
                                                        ...selectedVendorForPay,
                                                        selectedTermId: term.id,
                                                    });
                                                    setVPayType("partial");
                                                    setVPayAmountInput(term.remainingAmount > 0 ? term.remainingAmount : term.targetAmount);
                                                    setVPayNotesInput(`Pembayaran ${term.label} PO ${selectedVendorForPay.poNumber}`);
                                                }}
                                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? "bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-600/20 font-bold"
                                                        : term.isPaid
                                                        ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
                                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold flex items-center gap-2">
                                                        <span>{term.label} ({term.percent}%)</span>
                                                        {term.isPaid && <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">Lunas</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                                        Jatuh Tempo: <strong className="text-slate-700 font-mono">{formatIndoDate(term.dueDate)}</strong>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold font-mono text-slate-900">{fmt(term.targetAmount)}</div>
                                                    <div className="text-[10px] font-mono text-rose-600 font-semibold">
                                                        {term.isPaid ? "Rp 0" : `Sisa: ${fmt(term.remainingAmount)}`}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Opsi Jenis Pembayaran: Full vs Partial */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Opsi Nominal Pembayaran</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVPayType("full");
                                        setVPayAmountInput(selectedVendorForPay.remainingAmount > 0 ? selectedVendorForPay.remainingAmount : selectedVendorForPay.totalAmount);
                                        setVPayNotesInput(`Pelunasan Total PO ${selectedVendorForPay.poNumber}`);
                                    }}
                                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        vPayType === "full"
                                            ? "bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-600/20 font-bold"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="text-xs font-bold">Pelunasan Total</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Sisa sisa tagihan PO</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setVPayType("partial");
                                    }}
                                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        vPayType === "partial"
                                            ? "bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="text-xs font-bold">Cicil / Nominal Termin</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 font-normal">Sebagian nominal</div>
                                </button>
                            </div>
                        </div>

                        {/* Nominal Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Nominal Dibayar (Rp)</label>
                            <input
                                type="number"
                                value={vPayAmountInput || ""}
                                readOnly={vPayType === "full"}
                                onChange={(e) => setVPayAmountInput(parseFloat(e.target.value) || 0)}
                                placeholder="Masukkan nominal pembayaran..."
                                className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold border rounded-xl focus:outline-none ${
                                    vPayType === "full" ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-blue-400 text-blue-950 focus:border-blue-600"
                                }`}
                            />
                        </div>

                        {/* Tanggal Pembayaran & Metode Pembayaran */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Tanggal Bayar</label>
                                <div className="relative flex items-center">
                                    <div className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono font-semibold text-slate-800 flex items-center justify-between cursor-pointer hover:border-blue-600 shadow-2xs">
                                        <span>{formatIndoDate(vPayDateInput)}</span>
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={vPayDateInput}
                                        onChange={(e) => setVPayDateInput(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Metode Bayar</label>
                                <select
                                    value={vPayMethodInput}
                                    onChange={(e) => setVPayMethodInput(e.target.value)}
                                    className="w-full px-2.5 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="Transfer Bank BCA">Transfer BCA</option>
                                    <option value="Transfer Bank Mandiri">Transfer Mandiri</option>
                                    <option value="Transfer Bank BRI">Transfer BRI</option>
                                    <option value="Kas / Tunai">Kas / Tunai</option>
                                </select>
                            </div>
                        </div>

                        {/* Ref / Catatan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">No. Ref / Bukti Transfer (Opsional)</label>
                            <input
                                type="text"
                                value={vPayRefInput}
                                onChange={(e) => setVPayRefInput(e.target.value)}
                                placeholder="Contoh: TRX-99234 / BCA ke Vendor"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedVendorForPay(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const newRecord: VendorPaymentRecord = {
                                        id: `vpay-${Date.now()}`,
                                        poNumber: selectedVendorForPay.poNumber,
                                        vendorName: selectedVendorForPay.vendorName,
                                        amount: vPayAmountInput,
                                        paidAt: vPayDateInput || new Date().toISOString(),
                                        paymentMethod: vPayMethodInput,
                                        paymentRef: vPayRefInput || undefined,
                                        notes: vPayNotesInput || undefined,
                                    };

                                    const updatedVendorPayments = [...(project.vendorPayments || []), newRecord];
                                    onUpdateProject({ ...project, vendorPayments: updatedVendorPayments });
                                    setSelectedVendorForPay(null);
                                }}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                Simpan Pembayaran Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Parameter PO */}
            {editingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex-shrink-0">
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
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
                                <div className="text-xs font-bold text-slate-800">{editingLoc.description}</div>
                                <div className="text-[11px] text-slate-500">{editingLoc.area} &middot; {editingLoc.type} &middot; {editingLoc.size}</div>
                                <div className="text-[11px] text-slate-500">Vendor: <span className="font-bold text-slate-700">{editingLoc.vendorName}</span></div>
                            </div>

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
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

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
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
                                                                ? "bg-blue-50/90 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold"
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
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                                    {(() => {
                                        const targetCost = editingLoc.vendorCost;
                                        const totalWithPpn = isPPN ? Math.round(targetCost * 1.11) : targetCost;
                                        const sumPct = vendorTermPercents.reduce((a, b) => a + (Number(b) || 0), 0);

                                        return (
                                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Termin, Persentase & Jatuh Tempo</label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                            sumPct === 100
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse"
                                                        }`}>
                                                            Total: {sumPct}% ({fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                                                        {vendorTermPercents.map((pct, idx) => {
                                                            const termAmt = Math.round((totalWithPpn * (pct || 0)) / 100);
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
                                                                                className="w-12 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded-lg text-center font-mono focus:outline-none focus:border-blue-600 bg-slate-50"
                                                                            />
                                                                            <span className="text-xs font-bold text-slate-600">%</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-slate-400 font-medium">Jatuh Tempo:</span>
                                                                            <div className="relative flex items-center">
                                                                                <div className="px-2 py-0.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-blue-600 shadow-2xs">
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
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
                            <button onClick={() => setEditingLoc(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                            <button onClick={handleSaveEditPO} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Simpan Perubahan PO</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Per Titik */}
            {confirmingLoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex-shrink-0">
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
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                                <div className="text-xs font-bold text-slate-800">{confirmingLoc.description}</div>
                                <div className="text-[11px] text-slate-500">{confirmingLoc.area} &middot; {confirmingLoc.type} &middot; {confirmingLoc.size}</div>
                                <div className="text-[11px] text-slate-500">Vendor: <span className="font-bold text-slate-700">{confirmingLoc.vendorName}</span></div>
                            </div>

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
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

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
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
                                                                ? "bg-blue-50/90 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold"
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
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                                    {(() => {
                                        const targetCost = confirmingLoc.vendorCost;
                                        const totalWithPpn = isPPN ? Math.round(targetCost * 1.11) : targetCost;
                                        const sumPct = vendorTermPercents.reduce((a, b) => a + (Number(b) || 0), 0);

                                        return (
                                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Termin, Persentase & Jatuh Tempo</label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                            sumPct === 100
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse"
                                                        }`}>
                                                            Total: {sumPct}% ({fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                                                        {vendorTermPercents.map((pct, idx) => {
                                                            const termAmt = Math.round((totalWithPpn * (pct || 0)) / 100);
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
                                                                                className="w-12 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded-lg text-center font-mono focus:outline-none focus:border-blue-600 bg-slate-50"
                                                                            />
                                                                            <span className="text-xs font-bold text-slate-600">%</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-slate-400 font-medium">Jatuh Tempo:</span>
                                                                            <div className="relative flex items-center">
                                                                                <div className="px-2 py-0.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-blue-600 shadow-2xs">
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
                                        );
                                    })()}
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
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
                            <button onClick={() => setConfirmingLoc(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                            <button onClick={handleConfirmPO} className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer">Ya, Terbitkan PO Titik Ini</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Terbitkan PO Kolektif Per Vendor */}
            {confirmingVendorGroup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                        <div className="bg-white px-6 py-4 border-b border-slate-100 flex-shrink-0">
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

                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
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

                            {/* 2-Column Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column: Opsi Penerangan PO & Skema Card */}
                                <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        {/* 1. Opsi Penerangan PO */}
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

                                        {/* 2. Pilih Skema Pembayaran Vendor */}
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
                                                                ? "bg-blue-50/90 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold"
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
                                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: RINCIAN TERMIN, PERSENTASE & JATUH TEMPO VENDOR */}
                                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                                    {(() => {
                                        const targetCost = confirmingVendorGroup.unissuedItems.reduce((s, it) => s + it.vendorCost, 0);
                                        const totalWithPpn = isPPN ? Math.round(targetCost * 1.11) : targetCost;
                                        const sumPct = vendorTermPercents.reduce((a, b) => a + (Number(b) || 0), 0);

                                        return (
                                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Termin, Persentase & Jatuh Tempo</label>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                            sumPct === 100
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse"
                                                        }`}>
                                                            Total: {sumPct}% ({fmt(totalWithPpn)})
                                                        </span>
                                                    </div>

                                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                                                        {vendorTermPercents.map((pct, idx) => {
                                                            const termAmt = Math.round((totalWithPpn * (pct || 0)) / 100);
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
                                                                                className="w-12 px-1.5 py-0.5 text-xs font-bold border border-slate-300 rounded-lg text-center font-mono focus:outline-none focus:border-blue-600 bg-slate-50"
                                                                            />
                                                                            <span className="text-xs font-bold text-slate-600">%</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[10px] text-slate-400 font-medium">Jatuh Tempo:</span>
                                                                            <div className="relative flex items-center">
                                                                                <div className="px-2 py-0.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer hover:border-blue-600 shadow-2xs">
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
                                        );
                                    })()}
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
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
                            <button onClick={() => setConfirmingVendorGroup(null)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer">Batal</button>
                            <button onClick={handleConfirmVendorBulkPO} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer">Ya, Terbitkan PO Kolektif Vendor Ini</button>
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

    // Issue Invoice Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [modalScheme, setModalScheme] = useState<PaymentScheme>("termin");
    const [modalDpPercent, setModalDpPercent] = useState<number>(30);
    const [modalTerminCount, setModalTerminCount] = useState<number>(3);
    const [modalTerminPercents, setModalTerminPercents] = useState<number[]>([30, 40, 30]);
    const [modalDueDates, setModalDueDates] = useState<Record<number, string>>({});
    const [modalPercentError, setModalPercentError] = useState<string | null>(null);

    // Receive Payment Modal State
    const [selectedPayTerm, setSelectedPayTerm] = useState<PaymentTerm | null>(null);
    const [payType, setPayType] = useState<"full" | "partial">("full");
    const [payAmountInput, setPayAmountInput] = useState<number>(0);
    const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
    const [payMethodInput, setPayMethodInput] = useState<string>("Transfer Bank BCA");
    const [payRefInput, setPayRefInput] = useState<string>("");

    const prevIsOpenRef = React.useRef(false);

    React.useEffect(() => {
        if (isOpen && project) {
            setDisplayedProject(project);
            setLocations(project.locations);
            if (!prevIsOpenRef.current) {
                setActiveTab("info");
            }
            setRender(true);
            if (project.clientPaymentPlan) {
                setModalScheme(project.clientPaymentPlan.scheme);
            }
            const timer = setTimeout(() => setActive(true), 20);
            prevIsOpenRef.current = true;
            return () => clearTimeout(timer);
        } else {
            prevIsOpenRef.current = false;
            setActive(false);
            const timer = setTimeout(() => setRender(false), 350);
            return () => clearTimeout(timer);
        }
    }, [isOpen, project]);

    if (!render || !displayedProject) return null;
    const prj = displayedProject;
    const isPPN = fiscalMode === "ppn";
    const fin = calcFinancials(prj, locations, fiscalMode);

    // Filter unpaid terms approaching due date (within 7 days or overdue)
    const dueAlerts = prj.clientPaymentPlan ? prj.clientPaymentPlan.terms.filter(t => {
        if (t.status === "paid") return false;
        const today = new Date();
        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7;
    }) : [];

    const hasPaidTerm = prj.clientPaymentPlan ? prj.clientPaymentPlan.terms.some(t => t.status === "paid") : false;

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
    ];

    const poCount = locations.filter(l => l.poIssued).length;

    const triggerInvoicePdf = (term?: PaymentTerm) => {
        const now = new Date();
        const monthStr = String(now.getMonth() + 1).padStart(2, "0");
        const yearStr = String(now.getFullYear()).slice(-2);
        const seqStr = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
        const newInvNumber = prj.invoiceNumber || (isPPN
            ? `INV-${monthStr}/${yearStr}/${seqStr}`
            : `INV-NP-${monthStr}/${yearStr}/${seqStr}`);

        if (!prj.invoiceIssued) {
            onUpdateProject({
                ...prj,
                invoiceIssued: true,
                invoiceNumber: newInvNumber,
            });
        }

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

        const ratio = term ? (term.percent / 100) : 1;
        const termTitle = term ? `${term.label} (${term.percent}%)` : "Lunas Sekaligus (100%)";

        appendInput("_token", csrfToken);
        appendInput("clientName", prj.clientName || "PT. Pakuwon Jati Tbk");
        appendInput("clientSubName", prj.salesPIC ? `Attn: ${prj.salesPIC}` : "");
        appendInput("invoiceNumber", newInvNumber);
        appendInput("invoiceDate", now.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }));
        appendInput("isPPN", isPPN ? "true" : "false");
        appendInput("stream", "true");
        appendInput("termLabel", termTitle);

        const sumVendorCost = locations.reduce((s, l) => s + (l.vendorCost || 0), 0);
        const itemsToExport = locations.length > 0 ? locations.map(loc => {
            const clientItemDpp = (sumVendorCost > 0
                ? (loc.vendorCost / sumVendorCost) * prj.contractValue
                : prj.contractValue / locations.length) * ratio;
            return {
                type: loc.type || "Billboard",
                size: loc.size || "4x6m",
                orientation: loc.orientation || "V",
                description: term ? `${term.label} – ${loc.description || prj.name}` : (loc.description || prj.name),
                area: loc.area || "",
                qty: loc.qty || 1,
                clientPrice: clientItemDpp,
                vendorCost: clientItemDpp,
            };
        }) : [
            {
                type: "Sewa Media Iklan",
                size: "-",
                orientation: "V",
                description: term ? `${term.label} – ${prj.name}` : (prj.name || "Kontrak Kampanye Iklan"),
                area: "",
                qty: 1,
                clientPrice: prj.contractValue * ratio,
                vendorCost: prj.contractValue * ratio,
            }
        ];

        itemsToExport.forEach((loc, idx) => {
            appendInput(`locations[${idx}][type]`, loc.type);
            appendInput(`locations[${idx}][size]`, loc.size);
            appendInput(`locations[${idx}][orientation]`, loc.orientation);
            appendInput(`locations[${idx}][description]`, loc.description);
            appendInput(`locations[${idx}][area]`, loc.area);
            appendInput(`locations[${idx}][qty]`, loc.qty.toString());
            appendInput(`locations[${idx}][clientPrice]`, loc.clientPrice.toString());
            appendInput(`locations[${idx}][vendorCost]`, loc.vendorCost.toString());
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop — klik luar TIDAK menutup, gunakan tombol X */}
            <div className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${active ? "opacity-100" : "opacity-0"}`} />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                <div className={`pointer-events-auto relative w-[1100px] max-w-[95vw] h-screen bg-slate-50 shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${active ? "translate-x-0" : "translate-x-full"}`}>

                    {/* HEADER — Clean Modern Executive Header */}
                    <div className="bg-white px-8 py-6 flex-shrink-0 relative border-b border-slate-200 shadow-2xs">
                        <div className="flex items-start justify-between gap-6 mb-5">
                            <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                                        {prj.code}
                                    </span>
                                    <StatusBadge status={prj.status} />
                                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                                        {isPPN ? "Mode PPN (11%)" : "Mode Non-PPN"}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug pt-0.5">{prj.name}</h2>
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <span className="text-slate-800 font-semibold">{prj.clientName}</span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {prj.period}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-all cursor-pointer shadow-2xs"
                                title="Tutup panel"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Executive Financial Metrics - Clean Grid */}
                        <div className="grid grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
                            {/* Card 1: Nilai DPP / Kontrak */}
                            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                                    {isPPN ? "Nilai DPP Kontrak" : "Nilai Kontrak"}
                                </div>
                                <div className="text-sm font-black text-slate-900 tracking-tight tabular-nums">{fmt(fin.dpp)}</div>
                            </div>

                            {/* Card 2: Total Tagihan */}
                            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/70">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                                    Total Tagihan Client {isPPN && <span className="text-blue-600 font-black text-[9px] lowercase">(+ppn)</span>}
                                </div>
                                <div className="text-sm font-black text-slate-900 tracking-tight tabular-nums">{fmt(fin.totalInvoice)}</div>
                            </div>

                            {/* Card 3: Estimasi Laba Bersih */}
                            <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700/70 mb-1">
                                    Estimasi Laba Bersih
                                </div>
                                <div className={`text-sm font-black tracking-tight tabular-nums ${fin.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                    {fmt(fin.netProfit)}
                                </div>
                            </div>

                            {/* Card 4: Margin Keuntungan */}
                            <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-100">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700/70 mb-1">
                                    Margin Keuntungan
                                </div>
                                <div className={`text-sm font-black tracking-tight tabular-nums ${fin.margin >= 30 ? "text-indigo-700" : "text-amber-700"}`}>
                                    {fin.margin.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABS NAVIGATION — Clean Modern Border Tabs */}
                    <div className="flex border-b border-slate-200 bg-white px-8 flex-shrink-0">
                        <div className="flex gap-6">
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${isActive
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                                            }`}
                                    >
                                        <span className={isActive ? "text-blue-600" : "text-slate-400"}>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                        {tab.badge !== undefined && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
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

                                {/* Section 3: PO Issuance Progress — Clean Modern Card */}
                                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-800">Progress Terbit PO Vendor</h4>
                                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                    {poCount} dari {locations.length} titik lokasi telah diterbitkan PO
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-extrabold font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80">
                                            {locations.length > 0 ? Math.round((poCount / locations.length) * 100) : 0}%
                                        </span>
                                    </div>

                                    {/* Subtle Progress Bar */}
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
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
                                onIssuePO={(locId, poNumber, lighting, topNotes, vendorTermScheme, vendorTermPercents, vendorTermDates) => {
                                    const updated = locations.map(l =>
                                        l.id === locId ? { ...l, poIssued: true, poNumber, lighting, topNotes, vendorTermScheme, vendorTermPercents, vendorTermDates } : l
                                    );
                                    setLocations(updated);
                                    onUpdateProject({ ...prj, locations: updated });
                                }}
                                onUpdateProject={onUpdateProject}
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

                                {/* Due Date Alert Reminder Banner */}
                                {dueAlerts.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
                                            🔔
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                                                Pengingat Penagihan: {dueAlerts.length} Termin Membutuhkan Follow-Up Client
                                            </div>
                                            <div className="text-[11px] text-amber-800/90 mt-1 space-y-0.5">
                                                {dueAlerts.map(alertTerm => {
                                                    const today = new Date();
                                                    const due = new Date(alertTerm.dueDate);
                                                    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
                                                    const isOverdue = diffDays < 0;
                                                    return (
                                                        <div key={alertTerm.id} className="flex items-center gap-1.5 font-medium">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                                            <span>{alertTerm.label} ({fmt(isPPN ? Math.round(alertTerm.amount * 1.11) : alertTerm.amount)})</span>
                                                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isOverdue ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
                                                                {isOverdue ? `Terlambat ${Math.abs(diffDays)} hari!` : `Jatuh tempo ${diffDays} hari lagi (${formatIndoDate(alertTerm.dueDate)})`}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Document Preview & Issuance Card */}
                                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-600" /> Penagihan & Skema Pembayaran Client
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Atur skema termin, tanggal jatuh tempo, dan terbitkan invoice resmi</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Case 1: No Payment Plan yet */}
                                            {!prj.clientPaymentPlan ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowInvoiceModal(true)}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                    Atur Skema Pembayaran
                                                </button>
                                            ) : !prj.invoiceIssued ? (
                                                /* Case 2: Payment Plan set, Invoice NOT issued yet */
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowInvoiceModal(true)}
                                                        className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                                    >
                                                        Ubah Skema
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const now = new Date();
                                                            const monthStr = String(now.getMonth() + 1).padStart(2, "0");
                                                            const yearStr = String(now.getFullYear()).slice(-2);
                                                            const seqStr = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
                                                            const invNo = isPPN ? `INV-${monthStr}/${yearStr}/${seqStr}` : `INV-NP-${monthStr}/${yearStr}/${seqStr}`;
                                                            const updatedPrj = { ...prj, invoiceIssued: true, invoiceNumber: invNo };
                                                            setDisplayedProject(updatedPrj);
                                                            onUpdateProject(updatedPrj);
                                                        }}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Terbitkan Invoice Resmi
                                                    </button>
                                                </>
                                            ) : (
                                                /* Case 3: Invoice already issued */
                                                <>
                                                    {!hasPaidTerm ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowInvoiceModal(true)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                                                        >
                                                            Ubah Skema Penagihan
                                                        </button>
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold flex items-center gap-1.5">
                                                            Skema Terkunci (Ada Pembayaran)
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment Plan / Term breakdown table for Invoice */}
                                    {prj.clientPaymentPlan && prj.clientPaymentPlan.terms.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-800">Tahapan Penagihan per Termin ({SCHEME_LABELS[prj.clientPaymentPlan.scheme]})</h4>
                                                <span className="text-[10px] font-semibold text-slate-400">Total {prj.clientPaymentPlan.terms.length} Termin Penagihan</span>
                                            </div>

                                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                                {prj.clientPaymentPlan.terms.map((term, tIdx) => {
                                                    const termAmountWithPpn = isPPN ? Math.round(term.amount * 1.11) : term.amount;
                                                    const today = new Date();
                                                    const due = new Date(term.dueDate);
                                                    const isOverdue = term.status === "unpaid" && due < today;

                                                    return (
                                                        <div key={term.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${term.status === 'paid'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : isOverdue
                                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                                                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                                    }`}>
                                                                    {term.status === 'paid' ? '✓' : tIdx + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-slate-900 truncate">{term.label}</span>
                                                                        {(() => {
                                                                            const isPartial = term.status !== "paid" && term.paidAmount && term.paidAmount > 0;
                                                                            return (
                                                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                                                                                    term.status === 'paid'
                                                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                        : isPartial
                                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                                                                                        : isOverdue
                                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                                }`}>
                                                                                    {term.status === 'paid' ? 'Lunas' : isPartial ? 'Bayar Parsial' : isOverdue ? 'Terlambat' : 'Belum Bayar'}
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                                        Porsi: <span className="font-semibold text-slate-600">{term.percent}%</span> &bull; Jatuh Tempo: <span className="font-semibold text-slate-700">{formatIndoDate(term.dueDate)}</span>
                                                                        {term.paidAt && (
                                                                            <span className="text-emerald-600 font-medium">
                                                                                {" "}&bull; Dibayar: {formatIndoDate(term.paidAt)}
                                                                                {term.paidAmount && ` (${fmt(isPPN ? Math.round(term.paidAmount * 1.11) : term.paidAmount)})`}
                                                                                {term.paymentMethod && ` via ${term.paymentMethod}`}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                                <div className="text-right">
                                                                    <div className="text-xs font-black font-mono text-slate-900">{fmt(termAmountWithPpn)}</div>
                                                                    <div className="text-[9px] text-slate-400">{isPPN ? "Termasuk PPN 11%" : "Non-PPN"}</div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => triggerInvoicePdf(term)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                    Cetak PDF
                                                                </button>

                                                                {term.status === "paid" ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updatedTerms = prj.clientPaymentPlan!.terms.map(t => {
                                                                                if (t.id === term.id) {
                                                                                    return {
                                                                                        ...t,
                                                                                        status: "unpaid" as PaymentTermStatus,
                                                                                        paidAmount: undefined,
                                                                                        paidAt: undefined,
                                                                                        paymentMethod: undefined,
                                                                                        paymentRef: undefined,
                                                                                    };
                                                                                }
                                                                                return t;
                                                                            });
                                                                            const updatedPlan = { ...prj.clientPaymentPlan!, terms: updatedTerms };
                                                                            const updatedPrj = { ...prj, clientPaymentPlan: updatedPlan };
                                                                            setDisplayedProject(updatedPrj);
                                                                            onUpdateProject(updatedPrj);
                                                                        }}
                                                                        className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                                                                    >
                                                                        Batal Lunas
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const targetAmt = isPPN ? Math.round(term.amount * 1.11) : term.amount;
                                                                            const existingPaid = term.paidAmount ? (isPPN ? Math.round(term.paidAmount * 1.11) : term.paidAmount) : 0;
                                                                            const remTarget = Math.max(0, targetAmt - existingPaid);

                                                                            setSelectedPayTerm(term);
                                                                            setPayType("full");
                                                                            setPayAmountInput(remTarget > 0 ? remTarget : targetAmt);
                                                                            setPayDateInput(new Date().toISOString().split("T")[0]);
                                                                            setPayMethodInput(term.paymentMethod || "Transfer Bank BCA");
                                                                            setPayRefInput(term.paymentRef || "");
                                                                        }}
                                                                        className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
                                                                    >
                                                                        Terima Pembayaran
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Riwayat Penerimaan Pembayaran Client */}
                                    {prj.clientPaymentPlan && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                        Riwayat Penerimaan Pembayaran Client
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Catatan log transaksi dana masuk dari client</p>
                                                </div>
                                                {(() => {
                                                    const paidTerms = prj.clientPaymentPlan.terms.filter(t => t.paidAt || (t.paidAmount && t.paidAmount > 0) || t.status === "paid");
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                            {paidTerms.length} Transaksi Masuk
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {(() => {
                                                const paidTerms = prj.clientPaymentPlan.terms.filter(t => t.paidAt || (t.paidAmount && t.paidAmount > 0) || t.status === "paid");
                                                if (paidTerms.length === 0) {
                                                    return (
                                                        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 text-center">
                                                            <div className="text-xs font-semibold text-slate-500">Belum ada riwayat pembayaran</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">Klik tombol "Terima Pembayaran" pada termin di atas untuk mencatat pembayaran masuk</div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                                        {paidTerms.map((term, pIdx) => {
                                                            const paidAmtDpp = term.paidAmount || term.amount;
                                                            const paidAmtWithPpn = isPPN ? Math.round(paidAmtDpp * 1.11) : paidAmtDpp;
                                                            const isFullPaid = term.status === "paid";

                                                            return (
                                                                <div key={`history-${term.id}-${pIdx}`} className="p-3.5 bg-slate-50/30 flex items-center justify-between gap-3 text-xs">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                                                            ↓
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-slate-900 truncate">{term.label}</span>
                                                                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                                                                    isFullPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                                                                }`}>
                                                                                    {isFullPaid ? "Lunas" : "Parsial"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                                                                                <span>Tgl: <strong className="text-slate-600">{formatIndoDate(term.paidAt)}</strong></span>
                                                                                <span>&bull;</span>
                                                                                <span>Metode: <strong className="text-slate-600">{term.paymentMethod || "Transfer Bank BCA"}</strong></span>
                                                                                {term.paymentRef && (
                                                                                    <>
                                                                                        <span>&bull;</span>
                                                                                        <span>Ref: <strong className="text-slate-600 font-mono">{term.paymentRef}</strong></span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right flex-shrink-0">
                                                                        <div className="font-black font-mono text-emerald-700 text-xs">+ {fmt(paidAmtWithPpn)}</div>
                                                                        <div className="text-[9px] text-slate-400 font-medium">Dana Masuk Diterima</div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

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
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rincian Total Tagihan */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Tagihan Akhir Proyek</div>
                                            <div className="text-xs text-slate-600 font-medium mt-0.5">
                                                {isPPN ? `DPP (${fmt(fin.dpp)}) + PPN 11% (${fmt(fin.ppnKeluaran)})` : `DPP (${fmt(fin.dpp)}) - Non PPN`}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grand Total Invoice</div>
                                            <div className="text-base font-bold font-mono text-slate-900">{fmt(fin.totalInvoice)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>

            {/* Modal Catat Pembayaran Client (Full vs Partial) */}
            {selectedPayTerm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                    Terima Pembayaran Client
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedPayTerm.label}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedPayTerm(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Summary Box */}
                        {(() => {
                            const targetAmt = isPPN ? Math.round(selectedPayTerm.amount * 1.11) : selectedPayTerm.amount;
                            return (
                                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Target Tagihan Termin</div>
                                        <div className="text-sm font-black font-mono text-slate-900">{fmt(targetAmt)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Porsi Proyek</div>
                                        <div className="text-xs font-bold text-blue-600">{selectedPayTerm.percent}%</div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Opsi Jenis Pembayaran: Full vs Partial */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Opsi Pembayaran</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPayType("full");
                                        const targetAmt = isPPN ? Math.round(selectedPayTerm.amount * 1.11) : selectedPayTerm.amount;
                                        setPayAmountInput(targetAmt);
                                    }}
                                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        payType === "full"
                                            ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20 font-bold"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="text-xs font-bold">Lunas Sekaligus</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">100% nominal termin</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPayType("partial");
                                    }}
                                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                        payType === "partial"
                                            ? "bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20 font-bold"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                >
                                    <div className="text-xs font-bold">Cicil / Parsial</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Sebagian nominal</div>
                                </button>
                            </div>
                        </div>

                        {/* Nominal Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Nominal Diterima (Rp)</label>
                            <input
                                type="number"
                                value={payAmountInput || ""}
                                readOnly={payType === "full"}
                                onChange={(e) => setPayAmountInput(parseFloat(e.target.value) || 0)}
                                placeholder="Masukkan nominal pembayaran..."
                                className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold border rounded-xl focus:outline-none ${
                                    payType === "full" ? "bg-slate-100 border-slate-300 text-slate-700" : "bg-white border-blue-400 text-blue-950 focus:border-blue-600"
                                }`}
                            />
                            {payType === "partial" && (
                                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>Sisa tagihan termin ini:</span>
                                    <span className="font-bold font-mono text-slate-700">
                                        {fmt(Math.max(0, (isPPN ? Math.round(selectedPayTerm.amount * 1.11) : selectedPayTerm.amount) - payAmountInput))}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tanggal Pembayaran & Metode Pembayaran */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Tanggal Bayar</label>
                                <div className="relative flex items-center">
                                    <div className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono font-semibold text-slate-800 flex items-center justify-between cursor-pointer hover:border-blue-600 shadow-2xs">
                                        <span>{formatIndoDate(payDateInput)}</span>
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={payDateInput}
                                        onChange={(e) => setPayDateInput(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Metode Bayar</label>
                                <select
                                    value={payMethodInput}
                                    onChange={(e) => setPayMethodInput(e.target.value)}
                                    className="w-full px-2.5 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                                >
                                    <option value="Transfer Bank BCA">Transfer BCA</option>
                                    <option value="Transfer Bank Mandiri">Transfer Mandiri</option>
                                    <option value="Transfer Bank BRI">Transfer BRI</option>
                                    <option value="Kas / Tunai">Kas / Tunai</option>
                                    <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
                                </select>
                            </div>
                        </div>

                        {/* Ref / Catatan */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">No. Ref / Bukti Transfer (Opsional)</label>
                            <input
                                type="text"
                                value={payRefInput}
                                onChange={(e) => setPayRefInput(e.target.value)}
                                placeholder="Contoh: TRX-884920 / BCA a/n Client"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setSelectedPayTerm(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const targetAmt = isPPN ? Math.round(selectedPayTerm.amount * 1.11) : selectedPayTerm.amount;
                                    const isFull = payAmountInput >= targetAmt;
                                    const dppPaidAmt = isPPN ? Math.round(payAmountInput / 1.11) : payAmountInput;

                                    const updatedTerms = prj.clientPaymentPlan!.terms.map(t => {
                                        if (t.id === selectedPayTerm.id) {
                                            return {
                                                ...t,
                                                status: (isFull ? "paid" : "unpaid") as PaymentTermStatus,
                                                paidAmount: dppPaidAmt,
                                                paidAt: payDateInput || new Date().toISOString(),
                                                paymentMethod: payMethodInput,
                                                paymentRef: payRefInput || undefined,
                                            };
                                        }
                                        return t;
                                    });

                                    const updatedPlan = { ...prj.clientPaymentPlan!, terms: updatedTerms };
                                    const updatedPrj = { ...prj, clientPaymentPlan: updatedPlan };
                                    setDisplayedProject(updatedPrj);
                                    onUpdateProject(updatedPrj);
                                    setSelectedPayTerm(null);
                                }}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                Simpan Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Terbitkan Invoice & Skema Penagihan */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                    {!prj.clientPaymentPlan ? "Atur Skema Pembayaran Client" : !prj.invoiceIssued ? "Atur Skema & Terbitkan Invoice" : "Ubah Skema Penagihan Client"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Tentukan metode pembayaran dan tanggal jatuh tempo per termin</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInvoiceModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Step 1: Pilih Scheme */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Pilih Skema Pembayaran</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: "full", label: "Lunas Sekaligus", desc: "Cash 100% saat terbit", defaultPercents: [100] },
                                    { id: "dp", label: "DP + Pelunasan", desc: "DP 30% & Pelunasan 70%", defaultPercents: [30, 70] },
                                    { id: "termin", label: "Termin 3 Tahap", desc: "Milestone progres 30-40-30%", defaultPercents: [30, 40, 30] },
                                    { id: "installment", label: "Cicilan Bulanan", desc: "Angsuran berkala per bulan", defaultPercents: [33, 33, 34] },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            setModalScheme(s.id as PaymentScheme);
                                            setModalTerminPercents(s.defaultPercents);
                                        }}
                                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${modalScheme === s.id
                                                ? "bg-blue-50/90 border-blue-600 text-blue-900 ring-2 ring-blue-600/20"
                                                : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        <div className="text-xs font-bold text-slate-900">{s.label}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 font-medium">{s.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Tanggal Jatuh Tempo & Persentase Manual */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rincian Termin, Persentase & Jatuh Tempo</label>
                                {(() => {
                                    const sumPct = modalTerminPercents.reduce((a, b) => a + (Number(b) || 0), 0);
                                    return (
                                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${sumPct === 100
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200 font-extrabold animate-pulse"
                                            }`}>
                                            Total: {sumPct}% ({fmt(fin.totalInvoice)})
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Additional Duration Controller for Installment Scheme */}
                            {modalScheme === "installment" && (
                                <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-2xl border border-blue-100/90">
                                    <div>
                                        <div className="text-xs font-bold text-blue-900">Durasi Angsuran Bulanan</div>
                                        <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Ubah jumlah bulan cicilan yang diinginkan</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {(() => {
                                            const calcInstallmentPercents = (count: number): number[] => {
                                                const per = Math.round(100 / count);
                                                const res = Array(count).fill(per);
                                                const sumExceptLast = per * (count - 1);
                                                res[count - 1] = 100 - sumExceptLast;
                                                return res;
                                            };

                                            return (
                                                <>
                                                    {[3, 6, 12].map(monthsCount => (
                                                        <button
                                                            key={monthsCount}
                                                            type="button"
                                                            onClick={() => setModalTerminPercents(calcInstallmentPercents(monthsCount))}
                                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${modalTerminPercents.length === monthsCount
                                                                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            {monthsCount} Bulan
                                                        </button>
                                                    ))}
                                                    <div className="h-4 w-px bg-blue-200 mx-1" />
                                                    <button
                                                        type="button"
                                                        disabled={modalTerminPercents.length <= 2}
                                                        onClick={() => {
                                                            const newCount = Math.max(2, modalTerminPercents.length - 1);
                                                            setModalTerminPercents(calcInstallmentPercents(newCount));
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-xs font-mono font-bold text-blue-950 w-5 text-center">{modalTerminPercents.length}</span>
                                                    <button
                                                        type="button"
                                                        disabled={modalTerminPercents.length >= 24}
                                                        onClick={() => {
                                                            const newCount = Math.min(24, modalTerminPercents.length + 1);
                                                            setModalTerminPercents(calcInstallmentPercents(newCount));
                                                        }}
                                                        className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center cursor-pointer"
                                                    >
                                                        +
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                {(() => {
                                    const now = new Date();
                                    const addDays = (d: Date, days: number) => {
                                        const res = new Date(d);
                                        res.setDate(res.getDate() + days);
                                        return res.toISOString().split("T")[0];
                                    };
                                    const addMonths = (d: Date, months: number) => {
                                        const res = new Date(d);
                                        res.setMonth(res.getMonth() + months);
                                        return res.toISOString().split("T")[0];
                                    };

                                    let defaultLabels: string[] = [];
                                    if (modalScheme === "full") {
                                        defaultLabels = ["Lunas Sekaligus (100%)"];
                                    } else if (modalScheme === "dp") {
                                        defaultLabels = ["Termin 1 – Uang Muka (DP)", "Termin 2 – Pelunasan"];
                                    } else if (modalScheme === "termin") {
                                        defaultLabels = ["Termin 1 – Uang Muka", "Termin 2 – Progress", "Termin 3 – Pelunasan"];
                                    } else {
                                        const count = modalTerminPercents.length;
                                        defaultLabels = Array.from({ length: count }, (_, i) => `Cicilan ${i + 1} dari ${count}`);
                                    }

                                    return defaultLabels.map((label, idx) => {
                                        const pct = modalTerminPercents[idx] ?? (modalScheme === "full" ? 100 : modalScheme === "dp" ? (idx === 0 ? 30 : 70) : 30);
                                        const termAmt = Math.round((prj.contractValue * pct) / 100);
                                        const termAmtWithPpn = isPPN ? Math.round(termAmt * 1.11) : termAmt;
                                        const defaultDue = modalScheme === "installment" ? addMonths(now, idx + 1) : addDays(now, (idx + 1) * 7);
                                        const currentDate = modalDueDates[idx] || defaultDue;

                                        return (
                                            <div key={idx} className="p-3 bg-slate-50/50 flex items-center justify-between gap-3 text-xs flex-wrap">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-800 truncate">{label}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 font-semibold">{fmt(termAmtWithPpn)}</div>
                                                </div>

                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    {/* Percentage Input */}
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-slate-400">Porsi:</span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={100}
                                                            value={pct}
                                                            onChange={(e) => {
                                                                const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                                                const updated = [...modalTerminPercents];
                                                                updated[idx] = val;
                                                                setModalTerminPercents(updated);
                                                                setModalPercentError(null);
                                                            }}
                                                            className="w-14 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                                                        />
                                                        <span className="text-xs font-bold text-slate-500">%</span>
                                                    </div>

                                                    {/* Due Date Picker (Indonesian Format) */}
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-slate-400">Jatuh Tempo:</span>
                                                        <div className="relative flex items-center">
                                                            <div className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white font-mono font-semibold text-slate-800 flex items-center gap-2 cursor-pointer hover:border-blue-600 transition-colors shadow-2xs">
                                                                <span>{formatIndoDate(currentDate)}</span>
                                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                value={currentDate}
                                                                onChange={(e) => setModalDueDates(prev => ({ ...prev, [idx]: e.target.value }))}
                                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Error Banner when sum != 100% */}
                        {modalPercentError && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3.5 rounded-2xl flex items-center justify-between shadow-2xs">
                                <span>{modalPercentError}</span>
                                <button
                                    type="button"
                                    onClick={() => setModalPercentError(null)}
                                    className="text-rose-500 hover:text-rose-700 font-extrabold text-sm cursor-pointer ml-2"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalPercentError(null);
                                    setShowInvoiceModal(false);
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const sumPct = modalTerminPercents.reduce((a, b) => a + (Number(b) || 0), 0);
                                    if (sumPct !== 100) {
                                        setModalPercentError(`Total persentase termin harus tepat 100% (saat ini ${sumPct}%). Silakan sesuaikan persentase termin.`);
                                        return;
                                    }
                                    setModalPercentError(null);

                                    const now = new Date();
                                    const monthStr = String(now.getMonth() + 1).padStart(2, "0");
                                    const yearStr = String(now.getFullYear()).slice(-2);
                                    const seqStr = String(Math.floor(Math.random() * 899) + 100).padStart(3, "0");
                                    const invNo = prj.invoiceNumber || (isPPN ? `INV-${monthStr}/${yearStr}/${seqStr}` : `INV-NP-${monthStr}/${yearStr}/${seqStr}`);

                                    const addDays = (d: Date, days: number) => {
                                        const res = new Date(d);
                                        res.setDate(res.getDate() + days);
                                        return res.toISOString().split("T")[0];
                                    };

                                    const addMonths = (d: Date, months: number) => {
                                        const res = new Date(d);
                                        res.setMonth(res.getMonth() + months);
                                        return res.toISOString().split("T")[0];
                                    };

                                    const totalDpp = prj.contractValue;
                                    let generatedTerms: PaymentTerm[] = [];

                                    if (modalScheme === "full") {
                                        const pct = modalTerminPercents[0] ?? 100;
                                        generatedTerms = [
                                            {
                                                id: `term-full-${Date.now()}`,
                                                label: `Lunas Sekaligus (${pct}%)`,
                                                amount: Math.round((totalDpp * pct) / 100),
                                                percent: pct,
                                                dueDate: modalDueDates[0] || addDays(now, 7),
                                                status: "unpaid",
                                            }
                                        ];
                                    } else if (modalScheme === "dp") {
                                        const dpPct = modalTerminPercents[0] ?? 30;
                                        const pelPct = modalTerminPercents[1] ?? (100 - dpPct);
                                        const dpAmt = Math.round(totalDpp * dpPct / 100);
                                        const pelAmt = Math.round(totalDpp * pelPct / 100);
                                        generatedTerms = [
                                            {
                                                id: `term-dp-${Date.now()}`,
                                                label: `Termin 1 – Uang Muka (${dpPct}%)`,
                                                amount: dpAmt,
                                                percent: dpPct,
                                                dueDate: modalDueDates[0] || addDays(now, 7),
                                                status: "unpaid",
                                            },
                                            {
                                                id: `term-pel-${Date.now()}`,
                                                label: `Termin 2 – Pelunasan (${pelPct}%)`,
                                                amount: pelAmt,
                                                percent: pelPct,
                                                dueDate: modalDueDates[1] || addDays(now, 14),
                                                status: "unpaid",
                                            }
                                        ];
                                    } else if (modalScheme === "termin") {
                                        const percents = modalTerminPercents.length === 3 ? modalTerminPercents : [30, 40, 30];
                                        generatedTerms = percents.map((pct, i) => {
                                            const amount = Math.round((totalDpp * pct) / 100);
                                            return {
                                                id: `term-t${i + 1}-${Date.now() + i}`,
                                                label: i === 0 ? `Termin 1 – Uang Muka (${pct}%)` : i === percents.length - 1 ? `Termin ${i + 1} – Pelunasan (${pct}%)` : `Termin ${i + 1} (${pct}%)`,
                                                amount,
                                                percent: pct,
                                                dueDate: modalDueDates[i] || addDays(now, (i + 1) * 7),
                                                status: "unpaid",
                                            };
                                        });
                                    } else {
                                        const percents = modalTerminPercents;
                                        generatedTerms = percents.map((pct, i) => {
                                            const amount = Math.round((totalDpp * pct) / 100);
                                            return {
                                                id: `term-ci${i + 1}-${Date.now() + i}`,
                                                label: `Cicilan ${i + 1} dari ${percents.length} (${pct}%)`,
                                                amount,
                                                percent: pct,
                                                dueDate: modalDueDates[i] || addMonths(now, i + 1),
                                                status: "unpaid",
                                            };
                                        });
                                    }

                                    const newPlan: ClientPaymentPlan = {
                                        scheme: modalScheme,
                                        totalAmount: fin.totalInvoice,
                                        terms: generatedTerms,
                                        createdAt: now.toISOString(),
                                    };

                                    const updated = {
                                        ...prj,
                                        invoiceIssued: true,
                                        invoiceNumber: invNo,
                                        clientPaymentPlan: newPlan,
                                    };

                                    setDisplayedProject(updated);
                                    onUpdateProject(updated);
                                    setShowInvoiceModal(false);
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                {!prj.clientPaymentPlan ? "Simpan Skema Pembayaran" : !prj.invoiceIssued ? "Simpan Skema & Terbitkan Invoice" : "Simpan Perubahan Skema"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

