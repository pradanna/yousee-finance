import React, { useState } from "react";
import { fmt, formatDate } from "./purchasesTypes";
import type { VendorPO, VendorPaymentRecord } from "./purchasesTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — derive payment schedule from VendorPO.paymentTerms
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentScheduleItem {
    label: string;
    targetAmount: number;
    dueDate?: string;
}

export function deriveSchedule(po: VendorPO): PaymentScheduleItem[] {
    const { paymentTerms: t, totalAmount } = po;

    if (t.type === "full") {
        return [
            {
                label: "Pelunasan Penuh",
                targetAmount: totalAmount,
                dueDate: t.fullDueDate,
            },
        ];
    }

    if (t.type === "dp") {
        const dpAmt = t.dpAmount ?? Math.round(totalAmount * ((t.dpPercent ?? 50) / 100));
        return [
            { label: `Uang Muka (DP ${t.dpPercent ?? 50}%)`, targetAmount: dpAmt, dueDate: t.dpDueDate },
            { label: "Pelunasan Sisa", targetAmount: totalAmount - dpAmt, dueDate: t.pelunasanDueDate },
        ];
    }

    if (t.type === "termin" && t.installments) {
        return t.installments.map((inst, idx) => ({
            label: inst.note || `Termin ${idx + 1}`,
            targetAmount: inst.amount,
            dueDate: inst.dueDate,
        }));
    }

    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// VendorPaymentModal
// ─────────────────────────────────────────────────────────────────────────────

interface VendorPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: VendorPO;
    onAddPayment: (poNumber: string, record: VendorPaymentRecord) => void;
}

const PAYMENT_METHODS = [
    "Transfer Bank BCA",
    "Transfer Bank BRI",
    "Transfer Bank Mandiri",
    "Transfer Bank BNI",
    "Transfer Bank BSI",
    "QRIS / E-Wallet",
    "Tunai",
    "Giro / Cek",
];

export function VendorPaymentModal({ isOpen, onClose, po, onAddPayment }: VendorPaymentModalProps) {
    const schedule = deriveSchedule(po);
    const payments = po.payments ?? [];
    const totalPaid = payments.reduce((s, r) => s + r.amount, 0);
    const remaining = Math.max(0, po.totalAmount - totalPaid);
    const isFullyPaid = totalPaid >= po.totalAmount && po.totalAmount > 0;

    // Compute running paid per schedule item
    let runningPaid = totalPaid;
    const scheduleWithStatus = schedule.map((item, idx) => {
        const paid = Math.min(item.targetAmount, Math.max(0, runningPaid));
        runningPaid -= paid;
        const rem = Math.max(0, item.targetAmount - paid);
        return {
            ...item,
            idx,
            paid,
            remaining: rem,
            isPaid: paid >= item.targetAmount && item.targetAmount > 0,
        };
    });

    // First unpaid termin
    const firstUnpaid = scheduleWithStatus.find((s) => !s.isPaid);

    // Form state
    const [selectedTermIdx, setSelectedTermIdx] = useState<number>(firstUnpaid?.idx ?? 0);
    const [amount, setAmount] = useState<number>(firstUnpaid?.remaining ?? remaining);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [method, setMethod] = useState("Transfer Bank BCA");
    const [refNo, setRefNo] = useState("");
    const [notes, setNotes] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const selectedTerm = scheduleWithStatus[selectedTermIdx];

    const handleTermChange = (idx: number) => {
        setSelectedTermIdx(idx);
        setAmount(scheduleWithStatus[idx]?.remaining ?? 0);
    };

    const handleSubmit = () => {
        if (amount <= 0 || !date) return;
        const record: VendorPaymentRecord = {
            id: `pay-${Date.now()}`,
            poNumber: po.poNumber,
            termLabel: selectedTerm?.label ?? "Pembayaran",
            amount,
            date,
            method,
            referenceNo: refNo,
            notes,
        };
        onAddPayment(po.poNumber, record);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            onClose();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-down my-4">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Catat Pembayaran Vendor</div>
                            <h3 className="font-bold text-base leading-tight">{po.vendorName}</h3>
                            <p className="text-[11px] opacity-80 mt-0.5 font-mono">{po.poNumber} &middot; Terbit: {formatDate(po.issuedAt)}</p>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all flex-shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold opacity-80 mb-1.5">
                            <span>Terbayar: {fmt(totalPaid)}</span>
                            <span>Sisa: {fmt(remaining)}</span>
                        </div>
                        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${po.totalAmount > 0 ? Math.min(100, (totalPaid / po.totalAmount) * 100) : 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] opacity-60 mt-1">
                            <span>Total PO: {fmt(po.totalAmount)}</span>
                            <span>{po.totalAmount > 0 ? Math.round((totalPaid / po.totalAmount) * 100) : 0}% Terbayar</span>
                        </div>
                    </div>
                </div>

                {/* Schedule Items */}
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jadwal Termin Pembayaran</p>
                        {payments.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-[10px] font-bold text-primary hover:underline"
                            >
                                {showHistory ? "Sembunyikan" : `Riwayat (${payments.length})`}
                            </button>
                        )}
                    </div>

                    {/* Payment History */}
                    {showHistory && payments.length > 0 && (
                        <div className="mb-4 space-y-1.5 border border-slate-100 rounded-2xl p-3 bg-slate-50/60">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Transaksi</p>
                            {payments.map((p) => (
                                <div key={p.id} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-800">{p.termLabel}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{formatDate(p.date)} &middot; {p.method}</div>
                                        {p.referenceNo && <div className="text-[9px] text-slate-400 font-mono">Ref: {p.referenceNo}</div>}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xs font-bold text-emerald-700 font-mono">{fmt(p.amount)}</div>
                                        <div className="text-[9px] text-emerald-500 font-bold">Lunas</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule grid */}
                    <div className="space-y-2 mb-5">
                        {scheduleWithStatus.map((item) => (
                            <div
                                key={item.idx}
                                onClick={() => !item.isPaid && !isFullyPaid && handleTermChange(item.idx)}
                                className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 transition-all ${
                                    item.isPaid
                                        ? "bg-emerald-50 border-emerald-200/80 cursor-default"
                                        : selectedTermIdx === item.idx && !isFullyPaid
                                        ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 cursor-pointer"
                                        : "bg-slate-50 border-slate-200/80 hover:border-slate-300 cursor-pointer"
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        item.isPaid ? "bg-emerald-500" : selectedTermIdx === item.idx && !isFullyPaid ? "bg-primary" : "bg-slate-200"
                                    }`}>
                                        {item.isPaid ? (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="text-[9px] font-black text-white">{item.idx + 1}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 truncate">{item.label}</div>
                                        {item.dueDate && (
                                            <div className={`text-[10px] font-medium mt-0.5 ${item.isPaid ? "text-emerald-600" : "text-slate-400"}`}>
                                                {item.isPaid ? "✓ Terbayar" : `Jatuh Tempo: ${formatDate(item.dueDate)}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className={`text-xs font-bold font-mono ${item.isPaid ? "text-emerald-700" : "text-slate-900"}`}>
                                        {fmt(item.targetAmount)}
                                    </div>
                                    {!item.isPaid && item.paid > 0 && (
                                        <div className="text-[9px] text-amber-600 font-bold">Sisa: {fmt(item.remaining)}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Form */}
                {!isFullyPaid ? (
                    <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Form Pencatatan Pembayaran</p>

                        {/* Amount + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Jumlah Dibayar (Rp)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    min={0}
                                    max={remaining}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                />
                                <p className="text-[9px] text-slate-400 mt-1">Maks: {fmt(remaining)}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Tanggal Bayar</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Method + Ref */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Metode Pembayaran</label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">No. Referensi / Bukti</label>
                                <input
                                    type="text"
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                    placeholder="TRX-xxxx / Kode Bukti"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Catatan (Opsional)</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Keterangan tambahan..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-primary focus:bg-white transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={amount <= 0 || submitted}
                                className={`flex-[2] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    submitted
                                        ? "bg-emerald-500 text-white"
                                        : amount > 0
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                            >
                                {submitted ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Tersimpan!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Simpan Pembayaran {fmt(amount)}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 pb-6 pt-4 border-t border-slate-100">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-800">PO Ini Sudah Lunas Sepenuhnya</p>
                                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Total {fmt(totalPaid)} telah terbayar dari {po.vendorName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-full mt-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
