import React, { useMemo, useState } from 'react';
import { BillboardLocation, fmt, PurchaseOrderWithPlan } from '../projectTypes';

interface VendorOption {
    id: string;
    name: string;
}

export default function LocationsTab({
    locations,
    isPPN,
    vendors = [],
    purchaseOrders = [],
    onAddLocation,
    onUpdateLocation,
    onDeleteLocation,
    onCancelPO,
}: {
    locations: BillboardLocation[];
    isPPN: boolean;
    vendors?: VendorOption[];
    purchaseOrders?: PurchaseOrderWithPlan[];
    onAddLocation: (loc: BillboardLocation) => void;
    onUpdateLocation?: (
        id: string,
        data: {
            vendor_id?: string;
            area?: string;
            description?: string;
            type?: BillboardLocation['type'];
            orientation?: 'V' | 'H';
            size?: string;
            vendor_cost?: number;
            is_ppn_inclusive?: boolean;
        },
    ) => void;
    onDeleteLocation: (id: string) => void;
    onCancelPO?: (poId: string | number) => void;
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<BillboardLocation | null>(null);
    const [locationToDelete, setLocationToDelete] =
        useState<BillboardLocation | null>(null);
    const [poToCancel, setPoToCancel] = useState<{
        poId: string | number;
        poNumber: string;
        locationDesc: string;
    } | null>(null);
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
        setEditingLocation(null);
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

    const openEditModal = (loc: BillboardLocation) => {
        setEditingLocation(loc);
        setSelectedVendorId(loc.vendorId || '');
        setForm({
            area: loc.area || '',
            description: loc.description || '',
            type: loc.type || 'Billboard',
            orientation: (loc.orientation as 'V' | 'H') || 'V',
            size: loc.size || '',
            vendorCost: loc.vendorCost
                ? Math.round(loc.vendorCost).toLocaleString('id-ID')
                : '',
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

        if (editingLocation) {
            if (onUpdateLocation) {
                onUpdateLocation(editingLocation.id, {
                    vendor_id: selectedVendorId,
                    area: form.area.trim(),
                    description: form.description.trim(),
                    type: form.type,
                    orientation: form.orientation,
                    size: form.size.trim(),
                    vendor_cost: computedVendorCost.dpp,
                    is_ppn_inclusive: form.taxMode === 'inc',
                });
            }
        } else {
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
        }

        setIsModalOpen(false);
        setEditingLocation(null);
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

                                                <div className="flex items-center gap-1.5">
                                                    {!loc.poIssued ? (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        loc,
                                                                    )
                                                                }
                                                                className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 hover:text-blue-700"
                                                                title="Edit titik lokasi"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setLocationToDelete(
                                                                        loc,
                                                                    )
                                                                }
                                                                className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition-all hover:bg-rose-100 hover:text-rose-700"
                                                                title="Hapus titik lokasi"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        (() => {
                                                            // Cek apakah PO terkait sudah punya pembayaran
                                                            const matchedPO =
                                                                purchaseOrders.find(
                                                                    (po) =>
                                                                        String(
                                                                            po.id,
                                                                        ) ===
                                                                            String(
                                                                                loc.purchaseOrderId,
                                                                            ) ||
                                                                        (po.po_number &&
                                                                            loc.poNumber &&
                                                                            po.po_number ===
                                                                                loc.poNumber),
                                                                );

                                                            const hasPayment =
                                                                matchedPO?.payment_plan?.terms?.some(
                                                                    (term) =>
                                                                        term.status ===
                                                                            'paid' ||
                                                                        (term.settlements &&
                                                                            term
                                                                                .settlements
                                                                                .length >
                                                                                0),
                                                                );

                                                            if (
                                                                !hasPayment &&
                                                                (matchedPO ||
                                                                    loc.purchaseOrderId)
                                                            ) {
                                                                const poIdToCancel =
                                                                    matchedPO?.id ||
                                                                    loc.purchaseOrderId!;
                                                                const poNumberStr =
                                                                    matchedPO?.po_number ||
                                                                    loc.poNumber ||
                                                                    'PO Vendor';

                                                                return (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setPoToCancel(
                                                                                    {
                                                                                        poId: poIdToCancel,
                                                                                        poNumber:
                                                                                            poNumberStr,
                                                                                        locationDesc:
                                                                                            loc.description,
                                                                                    },
                                                                                )
                                                                            }
                                                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 transition-all hover:bg-amber-100 hover:text-amber-800"
                                                                            title="Batalkan PO ini agar titik lokasi dapat diedit kembali"
                                                                        >
                                                                            <svg
                                                                                className="h-3 w-3"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                                />
                                                                            </svg>
                                                                            Batal
                                                                            PO &
                                                                            Edit
                                                                            Titik
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <span
                                                                    className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400"
                                                                    title="Titik terkunci karena PO telah memiliki realisasi pembayaran"
                                                                >
                                                                    <svg
                                                                        className="h-3 w-3 text-slate-400"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                                        />
                                                                    </svg>
                                                                    Terkunci PO
                                                                    (Ada Bayar)
                                                                </span>
                                                            );
                                                        })()
                                                    )}
                                                </div>
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

            {/* Modal Form: Vendor Multi-step / Select-First / Edit Mode */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {editingLocation
                                            ? 'Edit Titik Lokasi'
                                            : 'Tambah Titik Lokasi'}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {editingLocation
                                            ? 'Perbarui detail titik lokasi atau ubah vendor mitra'
                                            : 'Pilih vendor mitra terlebih dahulu lalu masukkan rincian titik lokasi'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingLocation(null);
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

                            {/* Langkah 2: Detail Titik */}
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
                                            placeholder="cth: Semarang Kota, Jl. Pemuda"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
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
                                        setEditingLocation(null);
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
                                    {editingLocation
                                        ? 'Perbarui Titik Lokasi'
                                        : 'Simpan Titik Lokasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Titik Lokasi */}
            {locationToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        onClick={() => setLocationToDelete(null)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900">
                                    Hapus Titik Lokasi?
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Apakah Anda yakin ingin menghapus titik
                                    lokasi{' '}
                                    <strong className="text-slate-800">
                                        "{locationToDelete.description}"
                                    </strong>{' '}
                                    ({locationToDelete.area})? Tindakan ini
                                    tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setLocationToDelete(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteLocation(locationToDelete.id);
                                    setLocationToDelete(null);
                                }}
                                className="flex-1 cursor-pointer rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-700"
                            >
                                Ya, Hapus Titik
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Batalkan PO & Buka Kunci Edit Titik */}
            {poToCancel && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        onClick={() => setPoToCancel(null)}
                    />
                    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-slate-900">
                                    Batalkan PO & Buka Kunci Edit?
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Dokumen{' '}
                                    <strong className="text-slate-800">
                                        "{poToCancel.poNumber}"
                                    </strong>{' '}
                                    akan dibatalkan dan dihapus sehingga titik
                                    lokasi{' '}
                                    <strong className="text-slate-800">
                                        "{poToCancel.locationDesc}"
                                    </strong>{' '}
                                    dapat diedit atau dihapus kembali.
                                </p>
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-medium text-amber-800">
                                    Pastikan vendor belum memproses pembayaran
                                    PO ini. Anda dapat menerbitkan ulang PO baru
                                    setelah selesai mengedit data.
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setPoToCancel(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (onCancelPO) {
                                        onCancelPO(poToCancel.poId);
                                    }
                                    setPoToCancel(null);
                                }}
                                className="flex-1 cursor-pointer rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-700"
                            >
                                Ya, Batalkan PO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
