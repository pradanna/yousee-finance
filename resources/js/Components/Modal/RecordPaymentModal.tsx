import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import type { VendorPO } from '@/Pages/Purchases/purchasesTypes';
import { fmt } from '@/Pages/Purchases/purchasesTypes';
import React, { useState } from 'react';

export interface RecordPaymentModalSubmitData {
    poNumber: string;
    termLabel: string;
    amount: number;
    date: string;
    method: string;
    referenceNo: string;
    notes: string;
}

interface RecordPaymentModalProps {
    isOpen: boolean;
    po: VendorPO | null;
    remainingAmount: number;
    onClose: () => void;
    onSubmit: (data: RecordPaymentModalSubmitData) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    po,
    remainingAmount,
    onClose,
    onSubmit,
}) => {
    const [termLabel, setTermLabel] = useState('Pelunasan / Pembayaran');
    const [amount, setAmount] = useState<number>(remainingAmount);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('Transfer Bank BCA');
    const [referenceNo, setReferenceNo] = useState(
        `PAY-PO-${Math.floor(100000 + Math.random() * 900000)}`,
    );
    const [notes, setNotes] = useState('');

    if (!isOpen || !po) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;
        onSubmit({
            poNumber: po.poNumber,
            termLabel,
            amount: Number(amount),
            date,
            method,
            referenceNo,
            notes,
        });
    };

    return (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
                    <div>
                        <h3 className="text-lg font-bold">
                            Catat Pembayaran PO
                        </h3>
                        <p className="font-mono text-xs text-blue-100">
                            {po.poNumber} — {po.vendorName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white/10 text-blue-100 transition-all hover:bg-white/20 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    {/* Summary Info */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-700 dark:bg-slate-800/60">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">
                                Total PO
                            </div>
                            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                                {fmt(po.totalAmount)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-500 dark:text-slate-400">
                                Sisa Tagihan PO
                            </div>
                            <div className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                                {fmt(remainingAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Skema / Label Pembayaran */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Label / Peruntukan Pembayaran
                        </label>
                        <select
                            value={termLabel}
                            onChange={(e) => setTermLabel(e.target.value)}
                            className="w-full rounded-xl border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <option value="DP 30%">DP 30%</option>
                            <option value="DP 50%">DP 50%</option>
                            <option value="Termin 1">Termin 1</option>
                            <option value="Termin 2">Termin 2</option>
                            <option value="Pelunasan">Pelunasan</option>
                            <option value="Full Payment">Full Payment</option>
                            <option value="Pembayaran Cicilan">
                                Pembayaran Cicilan
                            </option>
                        </select>
                    </div>

                    {/* Nominal Pembayaran */}
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Nominal Dibayarkan (Rp)
                            </label>
                            <button
                                type="button"
                                onClick={() => setAmount(remainingAmount)}
                                className="text-[11px] font-medium text-blue-600 hover:underline"
                            >
                                Bayar Pelunasan ({fmt(remainingAmount)})
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={remainingAmount}
                            value={amount || ''}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            className="w-full rounded-xl border-slate-300 bg-white px-3 py-2.5 font-mono text-sm font-semibold text-blue-700 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
                        />
                    </div>

                    {/* Grid: Tanggal & Metode */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Tanggal Bayar
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full rounded-xl border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Sumber Kas / Bank
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full rounded-xl border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="Transfer Bank BCA">
                                    Transfer Bank BCA
                                </option>
                                <option value="Transfer Bank Mandiri">
                                    Transfer Bank Mandiri
                                </option>
                                <option value="Transfer Bank BRI">
                                    Transfer Bank BRI
                                </option>
                                <option value="Kas Kecil">
                                    Kas Kecil (Operational)
                                </option>
                                <option value="Kas Utama">Kas Utama</option>
                            </select>
                        </div>
                    </div>

                    {/* Nomor Referensi / Bukti Kas */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            No. Referensi / Bukti Kas Keluar
                        </label>
                        <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="Misal: BKK-2026-0810 / Ref BCA"
                            required
                            className="w-full rounded-xl border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Catatan / Keterangan (Opsional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan pembayaran..."
                            className="w-full rounded-xl border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={onClose}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit">
                            Simpan Catatan Pembayaran
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </div>
    );
};
