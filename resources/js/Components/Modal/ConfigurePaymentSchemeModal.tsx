import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export type ClientPaymentScheme = 'full' | 'dp' | 'termin' | 'installment';

export interface ConfigurePaymentSchemeModalSubmitData {
    scheme: ClientPaymentScheme;
    notes: string;
    termPercents: number[];
    termDates: string[];
}

interface ConfigurePaymentSchemeModalProps {
    isOpen: boolean;
    isLoading?: boolean;
    onClose: () => void;
    clientName: string;
    totalAmount: number;
    isPPN: boolean;
    onSubmit: (data: ConfigurePaymentSchemeModalSubmitData) => void;
}

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

export const ConfigurePaymentSchemeModal: React.FC<
    ConfigurePaymentSchemeModalProps
> = ({ isOpen, isLoading = false, onClose, totalAmount, isPPN, onSubmit }) => {
    const [scheme, setScheme] = useState<ClientPaymentScheme>('termin');
    const [termPercents, setTermPercents] = useState<number[]>([30, 40, 30]);
    const [termDates, setTermDates] = useState<string[]>([
        new Date().toISOString().split('T')[0],
        (() => {
            const d = new Date();
            d.setDate(d.getDate() + 14);
            return d.toISOString().split('T')[0];
        })(),
        (() => {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            return d.toISOString().split('T')[0];
        })(),
    ]);
    const [notes, setNotes] = useState('Milestone progres 30-40-30%');
    const [installCount, setInstallCount] = useState<number>(3);

    useEffect(() => {
        if (isOpen) {
            setScheme('termin');
            setTermPercents([30, 40, 30]);
            setTermDates([
                new Date().toISOString().split('T')[0],
                (() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 14);
                    return d.toISOString().split('T')[0];
                })(),
                (() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    return d.toISOString().split('T')[0];
                })(),
            ]);
            setNotes('Milestone progres 30-40-30%');
            setInstallCount(3);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const generateInstallments = (count: number) => {
        const validCount = Math.min(12, Math.max(1, count));
        setInstallCount(validCount);
        const basePercent = Math.floor(100 / validCount);
        const percents = Array.from({ length: validCount }, (_, i) =>
            i === validCount - 1
                ? 100 - basePercent * (validCount - 1)
                : basePercent,
        );
        setTermPercents(percents);

        const dates = Array.from({ length: validCount }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() + i + 1); // 1 Month interval
            return d.toISOString().split('T')[0];
        });
        setTermDates(dates);
        setNotes(
            validCount === 1
                ? 'Tempo 1 Bulan (Net 30)'
                : `Tempo ${validCount} Kali (${validCount} Bulan)`,
        );
    };

    const handleSelectScheme = (selectedScheme: ClientPaymentScheme) => {
        setScheme(selectedScheme);
        const todayStr = new Date().toISOString().split('T')[0];

        if (selectedScheme === 'full') {
            setTermPercents([100]);
            setTermDates([todayStr]);
            setNotes('Lunas Sekaligus');
        } else if (selectedScheme === 'dp') {
            setTermPercents([30, 70]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 14);
            setTermDates([todayStr, d2.toISOString().split('T')[0]]);
            setNotes('DP 30% & Pelunasan 70%');
        } else if (selectedScheme === 'termin') {
            setTermPercents([30, 40, 30]);
            const d2 = new Date();
            d2.setDate(d2.getDate() + 14);
            const d3 = new Date();
            d3.setDate(d3.getDate() + 30);
            setTermDates([
                todayStr,
                d2.toISOString().split('T')[0],
                d3.toISOString().split('T')[0],
            ]);
            setNotes('Milestone progres 30-40-30%');
        } else if (selectedScheme === 'installment') {
            generateInstallments(3);
        }
    };

    const sumPct = termPercents.reduce((a, b) => a + b, 0);

    const handleSubmit = () => {
        if (sumPct !== 100) {
            alert(`Total persentase termin harus 100%! (Saat ini: ${sumPct}%)`);
            return;
        }
        onSubmit({
            scheme,
            notes,
            termPercents,
            termDates,
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-white text-slate-800">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${isPPN ? 'bg-blue-600' : 'bg-emerald-600'}`}
                                />
                                Atur Skema Pembayaran Client
                            </h3>
                            <span
                                className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    isPPN
                                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                }`}
                            >
                                {isPPN ? 'PPN Mode' : 'Non-PPN Mode'}
                            </span>
                        </div>
                        <p className="mt-1.5 text-[11px] font-bold text-slate-400">
                            Tentukan metode pembayaran dan tanggal jatuh tempo
                            per termin
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

                {/* Body Content */}
                <div className="flex-1 space-y-6 overflow-y-auto bg-white px-8 py-6">
                    {/* Scheme Buttons Selection */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            PILIH SKEMA PEMBAYARAN
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    id: 'full',
                                    label: 'Lunas Sekaligus',
                                    desc: 'Cash 100% saat terbit',
                                },
                                {
                                    id: 'dp',
                                    label: 'DP + Pelunasan',
                                    desc: 'DP 30% & Pelunasan 70%',
                                },
                                {
                                    id: 'termin',
                                    label: 'Termin 3 Tahap',
                                    desc: 'Milestone progres 30–40–30%',
                                },
                                {
                                    id: 'installment',
                                    label: 'Custom Tempo',
                                    desc: 'Bebas atur termin hingga 12 bulan',
                                },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() =>
                                        handleSelectScheme(
                                            s.id as ClientPaymentScheme,
                                        )
                                    }
                                    className={`cursor-pointer rounded-3xl border p-4 text-left transition-all ${
                                        scheme === s.id
                                            ? 'bg-primary/5 ring-primary/20 shadow-2xs border-primary font-bold text-slate-900 ring-2'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="text-xs font-black text-slate-900">
                                        {s.label}
                                    </div>
                                    <div className="mt-1 text-[10px] font-semibold leading-tight text-slate-400">
                                        {s.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Tempo Durations Selection - Only shown when "installment" is selected */}
                    {scheme === 'installment' && (
                        <div className="bg-primary/5 border-primary/20 space-y-3 rounded-3xl border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="text-xs font-black text-slate-800">
                                        Jumlah Tempo / Termin
                                    </div>
                                    <div className="mt-0.5 text-[10px] font-bold text-primary">
                                        Bebas atur termin pembayaran invoice
                                        client hingga 12 bulan
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={installCount <= 1}
                                        onClick={() =>
                                            generateInstallments(
                                                installCount - 1,
                                            )
                                        }
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                                    >
                                        -
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={1}
                                            max={12}
                                            value={installCount}
                                            onChange={(e) => {
                                                const val =
                                                    parseInt(e.target.value) ||
                                                    1;
                                                generateInstallments(val);
                                            }}
                                            className="w-14 rounded-lg border border-slate-200 bg-white py-1 text-center font-mono text-xs font-bold text-slate-900 focus:border-primary focus:outline-none"
                                        />
                                        <span className="text-xs font-bold text-slate-700">
                                            Kali
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={installCount >= 12}
                                        onClick={() =>
                                            generateInstallments(
                                                installCount + 1,
                                            )
                                        }
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Pilihan Cepat */}
                            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200/60 pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Pilihan Cepat:
                                </span>
                                {[2, 3, 4, 6, 12].map((cnt) => (
                                    <button
                                        key={cnt}
                                        type="button"
                                        onClick={() =>
                                            generateInstallments(cnt)
                                        }
                                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                            installCount === cnt
                                                ? 'shadow-2xs bg-primary text-white'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cnt}x Tempo
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed list of terms */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                                RINCIAN TERMIN, PERSENTASE & JATUH TEMPO
                            </label>
                            <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                                Total: {sumPct}% ({fmt(totalAmount)})
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white">
                            {termPercents.map((pct, idx) => {
                                const termAmt = Math.round(
                                    (totalAmount * (pct || 0)) / 100,
                                );
                                const termLabel =
                                    scheme === 'installment'
                                        ? installCount === 1
                                            ? 'Tempo 1 Kali – Pelunasan 100%'
                                            : `Cicilan ${idx + 1} dari ${installCount} (Bulan ${idx + 1})`
                                        : termPercents.length === 1
                                          ? 'Pelunasan Total Client'
                                          : idx === 0
                                            ? 'Termin 1 – Uang Muka'
                                            : idx === termPercents.length - 1
                                              ? `Termin ${idx + 1} – Pelunasan`
                                              : `Termin ${idx + 1} – Progres`;

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between gap-4 p-4 text-xs hover:bg-slate-50/10"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-black text-slate-800">
                                                {termLabel}
                                            </div>
                                            <div className="mt-0.5 text-[11px] font-bold text-slate-400">
                                                {fmt(termAmt)}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    Porsi:
                                                </span>
                                                <input
                                                    type="number"
                                                    value={pct || ''}
                                                    onChange={(e) => {
                                                        const val =
                                                            parseFloat(
                                                                e.target.value,
                                                            ) || 0;
                                                        const updated = [
                                                            ...termPercents,
                                                        ];
                                                        updated[idx] = val;
                                                        setTermPercents(
                                                            updated,
                                                        );
                                                    }}
                                                    className="w-14 rounded-xl border border-slate-200 bg-white px-2 py-1 text-center font-mono text-xs font-black focus:border-primary focus:outline-none"
                                                />
                                                <span className="text-xs font-bold text-slate-500">
                                                    %
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    Jatuh Tempo:
                                                </span>
                                                <div className="relative flex items-center">
                                                    <div className="hover:shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-slate-800 transition-all hover:border-primary">
                                                        <span>
                                                            {formatIndoDate(
                                                                termDates[
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
                                                            strokeWidth={2}
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
                                                            termDates[idx] ||
                                                            new Date()
                                                                .toISOString()
                                                                .split('T')[0]
                                                        }
                                                        onChange={(e) => {
                                                            const updated = [
                                                                ...termDates,
                                                            ];
                                                            updated[idx] =
                                                                e.target.value;
                                                            setTermDates(
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

                {/* Footer Action Buttons */}
                <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-8 py-5">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        isLoading={isLoading}
                        loadingText="Menyimpan Skema..."
                    >
                        Simpan Skema Pembayaran
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
