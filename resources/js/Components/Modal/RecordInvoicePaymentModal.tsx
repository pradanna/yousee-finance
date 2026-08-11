import React, { useState } from "react";
import { fmt } from "@/Pages/Invoices/invoiceTypes";
import type { InvoiceData } from "@/Pages/Invoices/invoiceTypes";

export interface RecordInvoicePaymentModalSubmitData {
    invoiceNumber: string;
    termLabel: string;
    amount: number;
    date: string;
    method: string;
    referenceNo: string;
    notes: string;
}

interface RecordInvoicePaymentModalProps {
    isOpen: boolean;
    invoice: InvoiceData | null;
    remainingAmount: number;
    onClose: () => void;
    onSubmit: (data: RecordInvoicePaymentModalSubmitData) => void;
}

export const RecordInvoicePaymentModal: React.FC<RecordInvoicePaymentModalProps> = ({
    isOpen,
    invoice,
    remainingAmount,
    onClose,
    onSubmit,
}) => {
    if (!isOpen || !invoice) return null;

    const [termLabel, setTermLabel] = useState("Pelunasan Invoice");
    const [amount, setAmount] = useState<number>(remainingAmount);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [method, setMethod] = useState("Transfer Bank BCA");
    const [referenceNo, setReferenceNo] = useState(`BKM-2026-${Math.floor(100000 + Math.random() * 900000)}`);
    const [notes, setNotes] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;
        onSubmit({
            invoiceNumber: invoice.invoiceNumber,
            termLabel,
            amount: Number(amount),
            date,
            method,
            referenceNo,
            notes,
        });
    };

    const isFullPay = amount >= remainingAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Catat Penerimaan Kas (Client Payment)</h3>
                        <p className="text-xs text-emerald-100 font-mono">
                            {invoice.invoiceNumber} — {invoice.clientName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Summary Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400">Total Tagihan Invoice</div>
                            <div className="font-bold text-slate-900 dark:text-white text-base font-mono">
                                {fmt(invoice.totalAmount)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-slate-500 dark:text-slate-400">Sisa Piutang (Balance Due)</div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base font-mono">
                                {fmt(remainingAmount)}
                            </div>
                        </div>
                    </div>

                    {/* Skema / Label */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Label / Peruntukan Pembayaran
                        </label>
                        <select
                            value={termLabel}
                            onChange={(e) => setTermLabel(e.target.value)}
                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                        >
                            <option value="DP 30%">DP 30%</option>
                            <option value="DP 50%">DP 50%</option>
                            <option value="Termin 1">Termin 1</option>
                            <option value="Termin 2">Termin 2</option>
                            <option value="Pelunasan Invoice">Pelunasan Invoice</option>
                            <option value="Full Payment">Full Payment</option>
                            <option value="Pembayaran Cicilan">Pembayaran Cicilan</option>
                        </select>
                    </div>

                    {/* Nominal */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Nominal Diterima (Rp)
                            </label>
                            <button
                                type="button"
                                onClick={() => setAmount(remainingAmount)}
                                className="text-[11px] text-emerald-600 hover:underline font-bold"
                            >
                                Lunasi Semua ({fmt(remainingAmount)})
                            </button>
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={remainingAmount}
                            value={amount || ""}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            className="w-full text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 py-2.5 px-3"
                        />
                    </div>

                    {/* Grid: Tanggal & Bank */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Tanggal Diterima
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 py-2 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Akun Bank / Kas Masuk
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 py-2 px-3"
                            >
                                <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                                <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                                <option value="Kas Utama">Kas Utama (Cash)</option>
                            </select>
                        </div>
                    </div>

                    {/* No Ref */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            No. Referensi / Bukti Kas Masuk (BKM)
                        </label>
                        <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="Misal: BKM-2026-0810 / Transfer Ref"
                            required
                            className="w-full text-xs font-mono rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 py-2 px-3"
                        />
                    </div>

                    {/* Automatic Kwitansi Trigger Notice */}
                    {isFullPay && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Pembayaran ini melunasi 100% Invoice. <strong>Kwitansi Resmi (KW-xxx)</strong> akan otomatis diterbitkan oleh sistem.</span>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Catatan / Keterangan (Opsional)
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan penerimaan pembayaran..."
                            className="w-full text-xs rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 py-2 px-3"
                        />
                    </div>

                    {/* Submit buttons */}
                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
                        >
                            Simpan Penerimaan Kas
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
