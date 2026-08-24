import SelectInput from '@/Components/Form/SelectInput';
import React from 'react';
import { fmt } from '../ppnTypes';

interface NtpnSettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    netPpnAmount: number;
    inputNtpn: string;
    onInputNtpnChange: (val: string) => void;
    inputPaidDate: string;
    onInputPaidDateChange: (val: string) => void;
    inputBank: string;
    onInputBankChange: (val: string) => void;
    isSubmitting?: boolean;
    isPaid?: boolean;
}

export default function NtpnSettlementModal({
    isOpen,
    onClose,
    onSave,
    netPpnAmount,
    inputNtpn,
    onInputNtpnChange,
    inputPaidDate,
    onInputPaidDateChange,
    inputBank,
    onInputBankChange,
    isSubmitting = false,
    isPaid = false,
}: NtpnSettlementModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                onClick={isSubmitting ? undefined : onClose}
            />
            <div className="animate-fade-in relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                <div
                    className={`flex items-center justify-between px-6 py-4 text-white ${
                        isPaid ? 'bg-slate-900' : 'bg-slate-900'
                    }`}
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold">
                                {isPaid
                                    ? 'Koreksi Data Setoran PPN (NTPN)'
                                    : 'Pembayaran PPN Kas Negara (NTPN)'}
                            </h3>
                            {isPaid && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                    Lunas
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                            {isPaid
                                ? 'Perbarui data bukti setor dan sinkronkan jurnal kas keluar'
                                : 'Bukti Penerimaan Negara (BPN) Masa Pajak'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={onSave} className="space-y-4 p-6 text-xs">
                    {isPaid && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                            <svg
                                className="h-4 w-4 shrink-0 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="leading-snug">
                                Masa pajak ini telah berstatus{' '}
                                <strong>LUNAS</strong>. Perubahan nomor NTPN,
                                tanggal, atau bank akan otomatis mengupdate ayat
                                jurnal umum.
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 font-bold">
                        <span className="text-slate-500">
                            Nominal Kurang Bayar:
                        </span>
                        <span className="font-mono text-sm text-amber-700">
                            {fmt(netPpnAmount)}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                            Nomor Transaksi Penerimaan Negara (NTPN)
                        </label>
                        <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="16 Karakter Alfanumerik NTPN..."
                            value={inputNtpn}
                            onChange={(e) => onInputNtpnChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                            Tanggal Pembayaran / Setor
                        </label>
                        <input
                            type="date"
                            required
                            disabled={isSubmitting}
                            value={inputPaidDate}
                            onChange={(e) =>
                                onInputPaidDateChange(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                            Bank Persepsi Penyetor
                        </label>
                        <SelectInput
                            value={inputBank}
                            disabled={isSubmitting}
                            onChange={(e) => onInputBankChange(e.target.value)}
                            options={[
                                {
                                    value: 'Bank Mandiri Solo Baru',
                                    label: 'Bank Mandiri Solo Baru',
                                },
                                {
                                    value: 'Bank BCA Operasional',
                                    label: 'Bank BCA Operasional',
                                },
                                {
                                    value: 'Bank BRI Giro',
                                    label: 'Bank BRI Giro',
                                },
                                {
                                    value: 'Pos Indonesia',
                                    label: 'Pos Indonesia',
                                },
                            ]}
                        />
                    </div>

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-75"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        />
                                    </svg>
                                    <span>Menyimpan ke Database...</span>
                                </>
                            ) : (
                                <span>
                                    {isPaid
                                        ? 'Perbarui Data NTPN'
                                        : 'Simpan NTPN'}
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
