import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import React, { useEffect, useState } from 'react';

export interface IssuePOItem {
    id: number;
    description: string;
    area: string;
    vendorCost: number;
    qty?: number;
}

export type PaymentScheme = 'full' | 'dp' | 'termin' | 'installment';

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

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const formatIndoDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
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
    onSubmit,
}) => {
    const [poLighting, setPoLighting] = useState<'Berlampu' | 'Tidak Berlampu'>(
        'Berlampu',
    );
    const [vendorTermScheme, setVendorTermScheme] =
        useState<PaymentScheme>('full');
    const [poTopNotes, setPoTopNotes] = useState(
        'Lunas setelah visual terpasang',
    );
    const [vendorTermPercents, setVendorTermPercents] = useState<number[]>([
        100,
    ]);
    const [vendorTermDates, setVendorTermDates] = useState<string[]>([
        new Date().toISOString().split('T')[0],
    ]);

    useEffect(() => {
        if (isOpen) {
            setPoLighting('Berlampu');
            setVendorTermScheme('full');
            setPoTopNotes('Lunas setelah visual terpasang');
            setVendorTermPercents([100]);
            setVendorTermDates([new Date().toISOString().split('T')[0]]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectVendorScheme = (scheme: PaymentScheme) => {
        setVendorTermScheme(scheme);
        const todayStr = new Date().toISOString().split('T')[0];

        if (scheme === 'full') {
            setVendorTermPercents([100]);
            setVendorTermDates([todayStr]);
            setPoTopNotes('Lunas setelah visual terpasang');
        } else if (scheme === 'dp') {
            setVendorTermPercents([50, 50]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 14);
            setVendorTermDates([todayStr, d2.toISOString().split('T')[0]]);
            setPoTopNotes(
                'DP 50% saat PO terbit & Pelunasan 50% setelah visual terpasang',
            );
        } else if (scheme === 'termin') {
            setVendorTermPercents([30, 40, 30]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 14);
            const d3 = new Date();
            d3.setDate(d3.getDate() + 30);
            setVendorTermDates([
                todayStr,
                d2.toISOString().split('T')[0],
                d3.toISOString().split('T')[0],
            ]);
            setPoTopNotes('Termin 1 (30%), Termin 2 (40%), Termin 3 (30%)');
        } else if (scheme === 'installment') {
            setVendorTermPercents([100]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 30);
            setVendorTermDates([d2.toISOString().split('T')[0]]);
            setPoTopNotes('Pelunasan 30 hari kalender (Net 30)');
        }
    };

    const sumDpp = items.reduce(
        (s, it) => s + it.vendorCost * (it.qty || 1),
        0,
    );
    const sumPpn = isPPN ? sumDpp * PPN_RATE : 0;
    const sumTotal = sumDpp + sumPpn;
    const sumPct = vendorTermPercents.reduce((a, b) => a + (Number(b) || 0), 0);

    const handleSubmit = () => {
        onSubmit({
            lighting: poLighting,
            scheme: vendorTermScheme,
            topNotes: poTopNotes,
            termPercents: vendorTermPercents,
            termDates: vendorTermDates,
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="backdrop-blur-xs absolute inset-0 bg-slate-950/70"
                onClick={onClose}
            />
            <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex-shrink-0 border-b border-slate-100 bg-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Terbitkan PO Kolektif Vendor
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {vendorName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
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

                {/* Content */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {/* Item list summary */}
                    <div className="bg-primary/5 border-primary/20 space-y-2 rounded-2xl border p-4">
                        <p className="text-xs font-bold text-primary">
                            Akan menerbitkan 1 nomor PO gabungan untuk{' '}
                            {items.length} titik lokasi sekaligus:
                        </p>
                        <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                            {items.map((item, i) => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white p-2 text-[11px] text-slate-700"
                                >
                                    <span className="font-semibold">
                                        {i + 1}. {item.description} ({item.area}
                                        )
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">
                                        {fmt(item.vendorCost * (item.qty || 1))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 2-Column Grid Layout */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Left Column: Lighting Option & Scheme Selector */}
                        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                            <div className="space-y-4">
                                {/* 1. Lighting */}
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Penerangan PO
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPoLighting('Berlampu')
                                            }
                                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                poLighting === 'Berlampu'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <svg
                                                className="h-4 w-4 flex-shrink-0 text-amber-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                                />
                                            </svg>
                                            Berlampu (Default)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPoLighting('Tidak Berlampu')
                                            }
                                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                                                poLighting === 'Tidak Berlampu'
                                                    ? 'shadow-2xs border-slate-800 bg-slate-800 text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <svg
                                                className="h-4 w-4 flex-shrink-0 text-slate-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                                />
                                            </svg>
                                            Tidak Berlampu
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Payment Scheme */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Pilih Skema Pembayaran Vendor
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            {
                                                id: 'full',
                                                label: 'Lunas Sekaligus',
                                                desc: 'Cash 100% setelah visual terpasang',
                                            },
                                            {
                                                id: 'dp',
                                                label: 'DP + Pelunasan',
                                                desc: 'DP 50% & Pelunasan 50%',
                                            },
                                            {
                                                id: 'termin',
                                                label: 'Termin 3 Tahap',
                                                desc: 'Milestone progres 30–40–30%',
                                            },
                                            {
                                                id: 'installment',
                                                label: 'Tempo / Net 30',
                                                desc: 'Pelunasan 30 hari kalender',
                                            },
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectVendorScheme(
                                                        s.id as PaymentScheme,
                                                    )
                                                }
                                                className={`cursor-pointer rounded-2xl border p-2.5 text-left transition-all ${
                                                    vendorTermScheme === s.id
                                                        ? 'bg-primary/10 ring-primary/20 border-primary font-bold text-slate-900 ring-2'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className="text-xs font-bold text-slate-900">
                                                    {s.label}
                                                </div>
                                                <div className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">
                                                    {s.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Catatan TOP PO */}
                            <div className="space-y-1 pt-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Catatan Term of Payment (TOP) PO
                                </label>
                                <input
                                    type="text"
                                    value={poTopNotes}
                                    onChange={(e) =>
                                        setPoTopNotes(e.target.value)
                                    }
                                    placeholder="Ketik catatan Term of Payment (TOP)..."
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Right Column: Rincian Termin & Jatuh Tempo */}
                        <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                            <div className="flex flex-1 flex-col justify-between space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Rincian Termin, Persentase & Jatuh
                                            Tempo
                                        </label>
                                        <span
                                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                                sumPct === 100
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                    : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                            }`}
                                        >
                                            Total: {sumPct}% ({fmt(sumTotal)})
                                        </span>
                                    </div>

                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                                        {vendorTermPercents.map((pct, idx) => {
                                            const termAmt = Math.round(
                                                (sumTotal * (pct || 0)) / 100,
                                            );
                                            const termLabel =
                                                vendorTermPercents.length === 1
                                                    ? 'Pelunasan Total Vendor'
                                                    : idx === 0
                                                      ? 'Termin 1 – Uang Muka (DP)'
                                                      : idx ===
                                                          vendorTermPercents.length -
                                                              1
                                                        ? `Termin ${idx + 1} – Pelunasan`
                                                        : `Termin ${idx + 1} – Progres`;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex flex-wrap items-center justify-between gap-2 p-3 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900">
                                                            {termLabel}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-slate-500">
                                                            {fmt(termAmt)}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                Porsi:
                                                            </span>
                                                            <input
                                                                type="number"
                                                                value={
                                                                    pct || ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const val =
                                                                        parseFloat(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ) || 0;
                                                                    const updated =
                                                                        [
                                                                            ...vendorTermPercents,
                                                                        ];
                                                                    updated[
                                                                        idx
                                                                    ] = val;
                                                                    setVendorTermPercents(
                                                                        updated,
                                                                    );
                                                                }}
                                                                className="w-12 rounded-lg border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-xs font-bold focus:border-primary focus:outline-none"
                                                            />
                                                            <span className="text-xs font-bold text-slate-600">
                                                                %
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                Jatuh Tempo:
                                                            </span>
                                                            <div className="relative flex items-center">
                                                                <div className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 hover:border-primary">
                                                                    <span>
                                                                        {formatIndoDate(
                                                                            vendorTermDates[
                                                                                idx
                                                                            ] ||
                                                                                new Date()
                                                                                    .toISOString()
                                                                                    .split(
                                                                                        'T',
                                                                                    )[0],
                                                                        )}
                                                                    </span>
                                                                    <svg
                                                                        className="h-3.5 w-3.5 text-slate-400"
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
                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <input
                                                                    type="date"
                                                                    value={
                                                                        vendorTermDates[
                                                                            idx
                                                                        ] ||
                                                                        new Date()
                                                                            .toISOString()
                                                                            .split(
                                                                                'T',
                                                                            )[0]
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const updated =
                                                                            [
                                                                                ...vendorTermDates,
                                                                            ];
                                                                        updated[
                                                                            idx
                                                                        ] =
                                                                            e.target.value;
                                                                        setVendorTermDates(
                                                                            updated,
                                                                        );
                                                                    }}
                                                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
                    <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
                        <div className="flex justify-between text-slate-600">
                            <span>Total DPP ({items.length} Titik):</span>
                            <span className="font-mono font-bold text-slate-800">
                                {fmt(sumDpp)}
                            </span>
                        </div>
                        {isPPN && (
                            <div className="flex justify-between text-violet-700">
                                <span>Total PPN (11%):</span>
                                <span className="font-mono font-bold">
                                    {fmt(sumPpn)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                            <span>Total Nilai PO Vendor Ini:</span>
                            <span className="font-mono text-sm text-primary">
                                {fmt(sumTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={handleSubmit}>
                        Ya, Terbitkan PO Kolektif Vendor Ini
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
};
