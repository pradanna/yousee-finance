import { useState } from 'react';
import type { VendorPO, VendorPaymentRecord } from './purchasesTypes';
import { fmt, formatDate } from './purchasesTypes';

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

    if (t.type === 'full') {
        return [
            {
                label: 'Pelunasan Penuh',
                targetAmount: totalAmount,
                dueDate: t.fullDueDate,
            },
        ];
    }

    if (t.type === 'dp') {
        const dpAmt =
            t.dpAmount ?? Math.round(totalAmount * ((t.dpPercent ?? 50) / 100));
        return [
            {
                label: `Uang Muka (DP ${t.dpPercent ?? 50}%)`,
                targetAmount: dpAmt,
                dueDate: t.dpDueDate,
            },
            {
                label: 'Pelunasan Sisa',
                targetAmount: totalAmount - dpAmt,
                dueDate: t.pelunasanDueDate,
            },
        ];
    }

    if (t.type === 'termin' && t.installments) {
        return t.installments.map((inst, idx) => ({
            label: inst.note || `Termin ${idx + 1}`,
            targetAmount: inst.amount,
            dueDate: inst.dueDate,
        }));
    }

    return [];
}

export interface VendorPaymentModalSubmitData {
    poNumber: string;
    termLabel: string;
    amount: number;
    date: string;
    method: string;
    account_id?: string | number;
    referenceNo: string;
    notes: string;
    term_id?: string | number;
}

interface VendorPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    po: VendorPO | null;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
    onAddPayment?: (poNumber: string, record: VendorPaymentRecord) => void;
    onSubmit?: (data: VendorPaymentModalSubmitData) => void;
}

const PAYMENT_METHODS = [
    'Transfer Bank BCA',
    'Transfer Bank BRI',
    'Transfer Bank Mandiri',
    'Transfer Bank BNI',
    'Transfer Bank BSI',
    'QRIS / E-Wallet',
    'Tunai',
    'Giro / Cek',
];

export function VendorPaymentModal({
    isOpen,
    onClose,
    po,
    cashBankAccounts = [],
    onAddPayment,
    onSubmit,
}: VendorPaymentModalProps) {
    if (!isOpen || !po) return null;
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
    const [selectedTermIdx, setSelectedTermIdx] = useState<number>(
        firstUnpaid?.idx ?? 0,
    );
    const [amount, setAmount] = useState<number>(
        firstUnpaid?.remaining ?? remaining,
    );
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState<string | number>(
        cashBankAccounts[0]?.id || '',
    );
    const [method, setMethod] = useState(
        cashBankAccounts[0]
            ? `Transfer ${cashBankAccounts[0].name}`
            : 'Transfer Bank BCA',
    );
    const [refNo, setRefNo] = useState(
        `PAY-PO-${Math.floor(100000 + Math.random() * 900000)}`,
    );
    const [notes, setNotes] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const selectedTerm = scheduleWithStatus[selectedTermIdx];

    const handleTermChange = (idx: number) => {
        setSelectedTermIdx(idx);
        setAmount(scheduleWithStatus[idx]?.remaining ?? 0);
    };

    const handleSubmit = () => {
        if (amount <= 0 || !date) return;
        const termLabel = selectedTerm?.label ?? 'Pembayaran';

        if (onSubmit) {
            onSubmit({
                poNumber: po.poNumber,
                termLabel,
                amount: Number(amount),
                date,
                method,
                account_id: accountId || undefined,
                referenceNo: refNo,
                notes,
            });
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
            }, 1000);
            return;
        }

        if (onAddPayment) {
            const record: VendorPaymentRecord = {
                id: `pay-${Date.now()}`,
                poNumber: po.poNumber,
                termLabel,
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
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto p-4 sm:items-center">
            <div
                className="backdrop-blur-xs animate-fade-in absolute inset-0 bg-slate-950/60"
                onClick={onClose}
            />
            <div className="animate-fade-in-down relative z-10 my-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-70">
                                Catat Pembayaran Vendor
                            </div>
                            <h3 className="text-base font-bold leading-tight">
                                {po.vendorName}
                            </h3>
                            <p className="mt-0.5 font-mono text-[11px] opacity-80">
                                {po.poNumber} &middot; Terbit:{' '}
                                {formatDate(po.issuedAt)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30"
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
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-[10px] font-bold opacity-80">
                            <span>Terbayar: {fmt(totalPaid)}</span>
                            <span>Sisa: {fmt(remaining)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/20">
                            <div
                                className="h-full rounded-full bg-white transition-all duration-500"
                                style={{
                                    width: `${po.totalAmount > 0 ? Math.min(100, (totalPaid / po.totalAmount) * 100) : 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-1 flex justify-between text-[9px] opacity-60">
                            <span>Total PO: {fmt(po.totalAmount)}</span>
                            <span>
                                {po.totalAmount > 0
                                    ? Math.round(
                                          (totalPaid / po.totalAmount) * 100,
                                      )
                                    : 0}
                                % Terbayar
                            </span>
                        </div>
                    </div>
                </div>

                {/* Schedule Items */}
                <div className="px-6 pb-3 pt-5">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Jadwal Termin Pembayaran
                        </p>
                        {payments.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="text-[10px] font-bold text-primary hover:underline"
                            >
                                {showHistory
                                    ? 'Sembunyikan'
                                    : `Riwayat (${payments.length})`}
                            </button>
                        )}
                    </div>

                    {/* Payment History */}
                    {showHistory && payments.length > 0 && (
                        <div className="mb-4 space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Riwayat Transaksi
                            </p>
                            {payments.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
                                >
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-800">
                                            {p.termLabel}
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-400">
                                            {formatDate(p.date)} &middot;{' '}
                                            {p.method}
                                        </div>
                                        {p.referenceNo && (
                                            <div className="font-mono text-[9px] text-slate-400">
                                                Ref: {p.referenceNo}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="font-mono text-xs font-bold text-emerald-700">
                                            {fmt(p.amount)}
                                        </div>
                                        <div className="text-[9px] font-bold text-emerald-500">
                                            Lunas
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Schedule grid */}
                    <div className="mb-5 space-y-2">
                        {scheduleWithStatus.map((item) => (
                            <div
                                key={item.idx}
                                onClick={() =>
                                    !item.isPaid &&
                                    !isFullyPaid &&
                                    handleTermChange(item.idx)
                                }
                                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all ${
                                    item.isPaid
                                        ? 'cursor-default border-emerald-200/80 bg-emerald-50'
                                        : selectedTermIdx === item.idx &&
                                            !isFullyPaid
                                          ? 'bg-primary/5 border-primary/40 ring-primary/20 cursor-pointer ring-1'
                                          : 'cursor-pointer border-slate-200/80 bg-slate-50 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                                            item.isPaid
                                                ? 'bg-emerald-500'
                                                : selectedTermIdx ===
                                                        item.idx && !isFullyPaid
                                                  ? 'bg-primary'
                                                  : 'bg-slate-200'
                                        }`}
                                    >
                                        {item.isPaid ? (
                                            <svg
                                                className="h-3.5 w-3.5 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        ) : (
                                            <span className="text-[9px] font-black text-white">
                                                {item.idx + 1}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-xs font-bold text-slate-800">
                                            {item.label}
                                        </div>
                                        {item.dueDate && (
                                            <div
                                                className={`mt-0.5 text-[10px] font-medium ${item.isPaid ? 'text-emerald-600' : 'text-slate-400'}`}
                                            >
                                                {item.isPaid
                                                    ? '✓ Terbayar'
                                                    : `Jatuh Tempo: ${formatDate(item.dueDate)}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <div
                                        className={`font-mono text-xs font-bold ${item.isPaid ? 'text-emerald-700' : 'text-slate-900'}`}
                                    >
                                        {fmt(item.targetAmount)}
                                    </div>
                                    {!item.isPaid && item.paid > 0 && (
                                        <div className="text-[9px] font-bold text-amber-600">
                                            Sisa: {fmt(item.remaining)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Form */}
                {!isFullyPaid ? (
                    <div className="space-y-4 border-t border-slate-100 px-6 pb-6 pt-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Form Pencatatan Pembayaran
                        </p>

                        {/* Amount + Date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Jumlah Dibayar (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(Number(e.target.value))
                                    }
                                    min={0}
                                    max={remaining}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-800 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                />
                                <p className="mt-1 text-[9px] text-slate-400">
                                    Maks: {fmt(remaining)}
                                </p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Tanggal Bayar
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Method + Ref */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Rekening Kas / Bank
                                </label>
                                {cashBankAccounts && cashBankAccounts.length > 0 ? (
                                    <select
                                        value={accountId}
                                        onChange={(e) => {
                                            setAccountId(e.target.value);
                                            const acc = cashBankAccounts.find((a) => String(a.id) === e.target.value);
                                            if (acc) {
                                                setMethod(`Transfer ${acc.name}`);
                                            }
                                        }}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                    >
                                        {cashBankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.display_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                    >
                                        {PAYMENT_METHODS.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    No. Referensi / Bukti
                                </label>
                                <input
                                    type="text"
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                    placeholder="TRX-xxxx / Kode Bukti"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Catatan (Opsional)
                            </label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Keterangan tambahan..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all focus:border-primary focus:bg-white focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={amount <= 0 || submitted}
                                className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                    submitted
                                        ? 'bg-emerald-500 text-white'
                                        : amount > 0
                                          ? 'cursor-pointer bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                          : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                }`}
                            >
                                {submitted ? (
                                    <>
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
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Tersimpan!
                                    </>
                                ) : (
                                    <>
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
                                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                            />
                                        </svg>
                                        Simpan Pembayaran {fmt(amount)}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-slate-100 px-6 pb-6 pt-4">
                        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                                <svg
                                    className="h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-800">
                                    PO Ini Sudah Lunas Sepenuhnya
                                </p>
                                <p className="mt-0.5 text-[10px] font-medium text-emerald-600">
                                    Total {fmt(totalPaid)} telah terbayar dari{' '}
                                    {po.vendorName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
