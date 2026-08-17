import React, { useMemo, useState } from 'react';
import { BillboardLocation, fmt } from '../projectTypes';

interface VendorOption {
    id: string;
    name: string;
}

export default function LocationsTab({
    locations,
    isPPN,
    vendors = [],
    onAddLocation,
    onDeleteLocation,
}: {
    locations: BillboardLocation[];
    isPPN: boolean;
    vendors?: VendorOption[];
    onAddLocation: (loc: BillboardLocation) => void;
    onDeleteLocation: (id: string) => void;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [form, setForm] = useState({
        area: '',
        description: '',
        type: 'Billboard' as BillboardLocation['type'],
        orientation: 'V' as 'V' | 'H',
        size: '',
        vendorCost: '',
        taxMode: 'dpp' as 'dpp' | 'inc',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const typeColors: Record<BillboardLocation['type'], string> = {
        Billboard: 'bg-blue-50 text-blue-700 border-blue-100',
        Videotron: 'bg-violet-50 text-violet-700 border-violet-100',
        Baliho: 'bg-amber-50 text-amber-700 border-amber-100',
        Neonbox: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };

    // Group locations by vendor
    const groupedLocations = useMemo(() => {
        const map = new Map<
            string,
            { vendorId: string; vendorName: string; items: BillboardLocation[] }
        >();

        locations.forEach((loc) => {
            const vId = loc.vendorId || 'unassigned';
            if (!map.has(vId)) {
                map.set(vId, {
                    vendorId: vId,
                    vendorName:
                        loc.vendorName || 'Vendor Tidak Teridentifikasi',
                    items: [],
                });
            }
            map.get(vId)!.items.push(loc);
        });

        return Array.from(map.values());
    }, [locations]);

    // Live calculation for point cost in modal
    const parsedVendorRaw =
        parseInt(form.vendorCost.replace(/[^0-9]/g, ''), 10) || 0;
    const computedVendorCost = useMemo(() => {
        if (!parsedVendorRaw) return { dpp: 0, ppn: 0, total: 0 };
        if (!isPPN)
            return { dpp: parsedVendorRaw, ppn: 0, total: parsedVendorRaw };
        if (form.taxMode === 'inc') {
            const dpp = Math.round(parsedVendorRaw / 1.11);
            const ppn = parsedVendorRaw - dpp;
            return { dpp, ppn, total: parsedVendorRaw };
        } else {
            const ppn = Math.round(parsedVendorRaw * 0.11);
            const total = parsedVendorRaw + ppn;
            return { dpp: parsedVendorRaw, ppn, total };
        }
    }, [parsedVendorRaw, form.taxMode, isPPN]);

    const openAddModal = (vendorIdStr: string = '') => {
        setSelectedVendorId(vendorIdStr);
        setForm({
            area: '',
            description: '',
            type: 'Billboard',
            orientation: 'V',
            size: '',
            vendorCost: '',
            taxMode: 'dpp',
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!selectedVendorId) errs.vendorId = 'Pilih vendor terlebih dahulu.';
        if (!form.area.trim()) errs.area = 'Area wajib diisi.';
        if (!form.description.trim())
            errs.description = 'Deskripsi wajib diisi.';
        if (!form.size.trim()) errs.size = 'Ukuran wajib diisi.';
        if (!form.vendorCost) errs.vendorCost = 'Biaya titik wajib diisi.';
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        const vendor = vendors.find((v) => v.id === selectedVendorId);
        const newLoc: BillboardLocation = {
            id: String(Date.now()),
            code: `LOC-${String(Date.now()).slice(-4)}`,
            area: form.area.trim(),
            description: form.description.trim(),
            type: form.type,
            orientation: form.orientation,
            size: form.size.trim(),
            vendorId: vendor ? vendor.id : selectedVendorId,
            vendorName: vendor ? vendor.name : 'Vendor',
            vendorCost: computedVendorCost.dpp, // Always store pure DPP
            poIssued: false,
            poNumber: '',
        };
        onAddLocation(newLoc);
        setIsModalOpen(false);
        setForm({
            area: '',
            description: '',
            type: 'Billboard',
            orientation: 'V',
            size: '',
            vendorCost: '',
            taxMode: 'dpp',
        });
        setSelectedVendorId('');
        setErrors({});
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Vendor Button */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">
                        Daftar Vendor & Titik Lokasi
                    </h3>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                        {groupedLocations.length} Vendor &bull; Total{' '}
                        {locations.length} Titik Lokasi
                    </p>
                </div>
                <button
                    onClick={() => openAddModal('')}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Tambah Titik / Vendor
                </button>
            </div>

            {groupedLocations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-400">
                    <svg
                        className="mx-auto mb-3 h-12 w-12 opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                    </svg>
                    <p className="text-xs font-bold text-slate-600">
                        Belum ada Vendor & Titik Lokasi
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Pilih vendor terlebih dahulu untuk mulai menambahkan
                        titik lokasi.
                    </p>
                    <button
                        onClick={() => openAddModal('')}
                        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
                    >
                        + Tambah Vendor & Titik Pertama
                    </button>
                </div>
            ) : (
                <div className="space-y-5">
                    {groupedLocations.map((group) => {
                        const totalVendorDpp = group.items.reduce(
                            (s, item) => s + item.vendorCost,
                            0,
                        );
                        return (
                            <div
                                key={group.vendorId}
                                className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
                            >
                                {/* Vendor Group Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-100/80 px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">
                                                {group.vendorName}
                                            </h4>
                                            <p className="text-[10px] font-medium text-slate-500">
                                                {group.items.length} Titik
                                                Lokasi &bull; Total Biaya Vendor
                                                Ini:{' '}
                                                <span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700">
                                                    {fmt(totalVendorDpp)}
                                                </span>{' '}
                                                {isPPN && '(DPP)'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            openAddModal(String(group.vendorId))
                                        }
                                        className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-blue-700 transition-all hover:bg-blue-100"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        Tambah Titik di Vendor Ini
                                    </button>
                                </div>

                                {/* Items under Vendor */}
                                <div className="space-y-2.5 bg-slate-50/40 p-3">
                                    {group.items.map((loc, idx) => (
                                        <div
                                            key={loc.id}
                                            className="rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-800">
                                                                {
                                                                    loc.description
                                                                }
                                                            </span>
                                                            <span
                                                                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${typeColors[loc.type]}`}
                                                            >
                                                                {loc.type}
                                                            </span>
                                                            {loc.poIssued && (
                                                                <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    PO Terbit
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                                            Area:{' '}
                                                            <span className="font-semibold text-slate-600">
                                                                {loc.area}
                                                            </span>{' '}
                                                            &middot; Ukuran:{' '}
                                                            <span className="font-semibold text-slate-600">
                                                                {loc.size}
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 font-mono text-[10px] text-slate-500">
                                                            Biaya Titik:{' '}
                                                            <span className="font-bold text-slate-700">
                                                                {fmt(
                                                                    loc.vendorCost,
                                                                )}
                                                            </span>
                                                            {isPPN && (
                                                                <span className="text-slate-400">
                                                                    {' '}
                                                                    (DPP) + PPN{' '}
                                                                    {fmt(
                                                                        loc.vendorCost *
                                                                            0.11,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!loc.poIssued && (
                                                    <button
                                                        onClick={() =>
                                                            onDeleteLocation(
                                                                loc.id,
                                                            )
                                                        }
                                                        className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-rose-400 transition-all hover:bg-rose-100 hover:text-rose-600"
                                                        title="Hapus titik lokasi"
                                                    >
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Vendor Total Summary Footer Bar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs font-bold">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-600">
                                        Subtotal Biaya Vendor (
                                        {group.vendorName})
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-normal text-slate-400">
                                            {group.items.length} Titik Lokasi
                                        </span>
                                        {/* Total Tanpa Background & Tanpa Outline (Clean Bold Text Only) */}
                                        <span className="px-1 py-1 font-mono text-sm font-black text-slate-900">
                                            {fmt(totalVendorDpp)}{' '}
                                            {isPPN && (
                                                <span className="text-[10px] font-bold text-slate-500">
                                                    (DPP)
                                                </span>
                                            )}
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
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Tambah Titik Lokasi
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Pilih vendor mitra terlebih dahulu lalu
                                        masukkan rincian titik lokasi
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setErrors({});
                                    }}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            {/* Langkah 1: Pilih Vendor */}
                            <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                                <label className="block text-xs font-bold uppercase tracking-wide text-blue-900">
                                    1. Pilih Vendor Mitra{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={selectedVendorId}
                                    onChange={(e) =>
                                        setSelectedVendorId(e.target.value)
                                    }
                                    className="shadow-xs w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition-all focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="">
                                        -- Pilih Vendor Mitra --
                                    </option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.vendorId && (
                                    <span className="block text-[10px] font-bold text-rose-500">
                                        {errors.vendorId}
                                    </span>
                                )}
                            </div>

                            {/* Langkah 2: Detail Titik (hanya aktif setelah vendor dipilih / diisi) */}
                            <div className="space-y-4 pt-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    2. Detail Titik Lokasi
                                </h4>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Area / Kota{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.area}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    area: e.target.value,
                                                })
                                            }
                                            placeholder="cth: Semarang..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                        />
                                        {errors.area && (
                                            <span className="text-[10px] font-bold text-rose-500">
                                                {errors.area}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Tipe Media{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={form.type}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    type: e.target
                                                        .value as BillboardLocation['type'],
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                        >
                                            {[
                                                'Billboard',
                                                'Videotron',
                                                'Baliho',
                                                'Neonbox',
                                            ].map((t) => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Orientasi V/H{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            value={form.orientation}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    orientation: e.target
                                                        .value as 'V' | 'H',
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                        >
                                            <option value="V">
                                                V (Vertical)
                                            </option>
                                            <option value="H">
                                                H (Horizontal)
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Deskripsi Lokasi{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.description}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="cth: Billboard Jl. Pandanaran KM 3"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                        />
                                        {errors.description && (
                                            <span className="text-[10px] font-bold text-rose-500">
                                                {errors.description}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Ukuran (PxL){' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.size}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    size: e.target.value,
                                                })
                                            }
                                            placeholder="cth: 4x6m, 6x12m..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                        />
                                        {errors.size && (
                                            <span className="text-[10px] font-bold text-rose-500">
                                                {errors.size}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Input Biaya Titik dengan Tax Mode Switcher */}
                                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                                            Biaya Titik{' '}
                                            <span className="text-rose-500">
                                                *
                                            </span>
                                        </label>

                                        {isPPN && (
                                            <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            taxMode: 'dpp',
                                                        })
                                                    }
                                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                                                        form.taxMode === 'dpp'
                                                            ? 'shadow-2xs bg-white font-black text-blue-700'
                                                            : 'text-slate-500 hover:text-slate-800'
                                                    }`}
                                                >
                                                    Belum PPN (DPP)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            taxMode: 'inc',
                                                        })
                                                    }
                                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition-all ${
                                                        form.taxMode === 'inc'
                                                            ? 'shadow-2xs bg-blue-600 font-black text-white'
                                                            : 'text-slate-500 hover:text-slate-800'
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
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(
                                                /[^0-9]/g,
                                                '',
                                            );
                                            const formatted = raw
                                                ? parseInt(
                                                      raw,
                                                      10,
                                                  ).toLocaleString('id-ID')
                                                : '';
                                            setForm({
                                                ...form,
                                                vendorCost: formatted,
                                            });
                                        }}
                                        placeholder={
                                            isPPN
                                                ? form.taxMode === 'inc'
                                                    ? 'Masukkan Biaya Total (Sudah Inc PPN)...'
                                                    : 'Masukkan Biaya DPP (Sebelum PPN)...'
                                                : 'Total biaya titik...'
                                        }
                                        className="shadow-2xs w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm font-bold text-slate-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    {errors.vendorCost && (
                                        <span className="text-[10px] font-bold text-rose-500">
                                            {errors.vendorCost}
                                        </span>
                                    )}

                                    {/* Breakdown Live Titik */}
                                    {isPPN && parsedVendorRaw > 0 && (
                                        <div className="space-y-1.5 rounded-xl border border-blue-100/90 bg-blue-50/80 p-3 text-xs">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="text-[11px] font-medium">
                                                    Nilai DPP Titik (Dasar
                                                    Pajak)
                                                </span>
                                                <span className="font-mono font-bold text-slate-900">
                                                    {fmt(
                                                        computedVendorCost.dpp,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-violet-700">
                                                <span className="text-[11px] font-medium">
                                                    PPN Masukan Vendor (11%)
                                                </span>
                                                <span className="font-mono font-bold">
                                                    {fmt(
                                                        computedVendorCost.ppn,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-blue-200/60 pt-1 font-bold text-slate-900">
                                                <span className="text-[11px]">
                                                    Total Biaya PO Titik
                                                </span>
                                                <span className="font-mono text-xs font-black text-blue-700">
                                                    {fmt(
                                                        computedVendorCost.total,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setErrors({});
                                    }}
                                    className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                                >
                                    Simpan Titik Lokasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
