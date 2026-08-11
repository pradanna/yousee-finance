import React, { useState } from "react";
import { fmt } from "@/Pages/Purchases/purchasesTypes";
import type { VendorPO } from "@/Pages/Purchases/purchasesTypes";

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
    if (!isOpen || !po) return null;

    const [termLabel, setTermLabel] = useState("Pelunasan / Pembayaran");
    const [amount, setAmount] = useState<number>(remainingAmount);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [method, setMethod] = useState("Transfer Bank BCA");
    const [referenceNo, setReferenceNo] = useState(`PAY-PO-${Math.floor(100000 + Math.random() * 900000)}`);
    const [notes, setNotes] = useState("");

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Catat Pembayaran PO</h3>
                        <p className="text-xs text-blue-100 font-mono">
                            {po.poNumber} — {po.vendorName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Summary Info */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">Total PO</div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm font-mono">
                                {fmt(po.totalAmount)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-500 dark:text-slate-400">Sisa Tagihan PO</div>
                            <div className="font-bold text-amber-600 dark:text-amber-400 text-sm font-mono">
                                {fmt(remainingAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Skema / Label Pembayaran */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Label / Peruntukan Pembayaran
                        </label>
                        <select
                            value={termLabel}
                            onChange={(e) => setTermLabel(e.target.value)}
                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 py-2.5 px-3"
                        >
                            <option value="DP 30%">DP 30%</option>
                            <option value="DP 50%">DP 50%</option>
                            <option value="Termin 1">Termin 1</option>
                            <option value="Termin 2">Termin 2</option>
                            <option value="Pelunasan">Pelunasan</option>
                            <option value="Full Payment">Full Payment</option>
                            <option value="Pembayaran Cicilan">Pembayaran Cicilan</option>
                        </select>
                    </div>

                    {/* Nominal Pembayaran */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Nominal Dibayarkan (Rp)
                            </label>
                            <button
                                type="button"
                                onClick={() => setAmount(remainingAmount)}
                                className="text-[11px] text-blue-600 hover:underline font-medium"
                            >
                                Bayar Pelunasan ({fmt(remainingAmount)})
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={remainingAmount}
                            value={amount || ""}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            className="w-full text-sm font-mono font-semibold text-blue-700 dark:text-blue-400 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 py-2.5 px-3"
                        />
                    </div>

                    {/* Grid: Tanggal & Metode */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Tanggal Bayar
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Sumber Kas / Bank
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 py-2 px-3"
                            >
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                                <option value="Kas Kecil">Kas Kecil (Operational)</option>
                                <option value="Kas Utama">Kas Utama</option>
                            </select>
                        </div>
                    </div>

                    {/* Nomor Referensi / Bukti Kas */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            No. Referensi / Bukti Kas Keluar
                        </label>
                        <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="Misal: BKK-2026-0810 / Ref BCA"
                            required
                            className="w-full text-xs font-mono rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 py-2 px-3"
                        />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Catatan / Keterangan (Opsional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan pembayaran..."
                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 py-2 px-3"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                        >
                            Simpan Catatan Pembayaran
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
