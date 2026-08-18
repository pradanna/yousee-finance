import React, { useEffect, useState } from 'react';
import type { VendorPO, VendorPaymentRecord } from './purchasesTypes';
import { fmt } from './purchasesTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — derive payment schedule from VendorPO
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentScheduleItem {
    id: string | number;
    label: string;
    percent: number;
    targetAmount: number;
    remainingAmount: number;
    dueDate?: string;
    isPaid: boolean;
    poNumber?: string;
}

export function formatIndoDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function deriveScheduleItems(po: VendorPO): PaymentScheduleItem[] {
    const totalAmount = po.totalAmount || 0;
    const payments = po.payments || [];
    const totalPaid = payments.reduce((s, r) => s + r.amount, 0);

    // If real database payment_plan exists, use its terms
    if (po.payment_plan && po.payment_plan.terms && po.payment_plan.terms.length > 0) {
        return po.payment_plan.terms.map((term) => {
            const termSettlementsPaid = (term.settlements || []).reduce(
                (sum, s) => sum + s.amount,
                0,
            );
            const isPaid = term.status === 'paid' || termSettlementsPaid >= term.amount;
            const remainingAmount = Math.max(0, term.amount - termSettlementsPaid);

            return {
                id: term.id,
                label: term.label,
                percent: term.percent,
                targetAmount: term.amount,
                remainingAmount,
                dueDate: term.due_date,
                isPaid,
                poNumber: po.poNumber,
            };
        });
    }

    // Otherwise derive from paymentTerms
    const t = po.paymentTerms;
    if (!t) {
        return [
            {
                id: 'full-1',
                label: 'Pelunasan Penuh',
                percent: 100,
                targetAmount: totalAmount,
                remainingAmount: Math.max(0, totalAmount - totalPaid),
                dueDate: po.issuedAt,
                isPaid: totalPaid >= totalAmount && totalAmount > 0,
                poNumber: po.poNumber,
            },
        ];
    }

    if (t.type === 'full') {
        return [
            {
                id: 'full-1',
                label: 'Pelunasan Penuh',
                percent: 100,
                targetAmount: totalAmount,
                remainingAmount: Math.max(0, totalAmount - totalPaid),
                dueDate: t.fullDueDate || po.issuedAt,
                isPaid: totalPaid >= totalAmount && totalAmount > 0,
                poNumber: po.poNumber,
            },
        ];
    }

    if (t.type === 'dp') {
        const dpPercent = t.dpPercent ?? 50;
        const dpAmt =
            t.dpAmount ?? Math.round(totalAmount * (dpPercent / 100));
        const pelunasanAmt = totalAmount - dpAmt;
        const pelunasanPercent = 100 - dpPercent;

        const dpPaid = Math.min(dpAmt, totalPaid);
        const dpRemaining = Math.max(0, dpAmt - dpPaid);
        const pelunasanPaid = Math.max(0, totalPaid - dpAmt);
        const pelunasanRemaining = Math.max(0, pelunasanAmt - pelunasanPaid);

        return [
            {
                id: 'dp-1',
                label: `Termin 1 – Uang Muka (DP) (${dpPercent}%)`,
                percent: dpPercent,
                targetAmount: dpAmt,
                remainingAmount: dpRemaining,
                dueDate: t.dpDueDate || po.issuedAt,
                isPaid: dpPaid >= dpAmt && dpAmt > 0,
                poNumber: po.poNumber,
            },
            {
                id: 'pelunasan-2',
                label: `Termin 2 – Pelunasan (${pelunasanPercent}%)`,
                percent: pelunasanPercent,
                targetAmount: pelunasanAmt,
                remainingAmount: pelunasanRemaining,
                dueDate: t.pelunasanDueDate,
                isPaid: pelunasanPaid >= pelunasanAmt && pelunasanAmt > 0,
                poNumber: po.poNumber,
            },
        ];
    }

    if (t.type === 'termin' && t.installments) {
        let runningPaid = totalPaid;
        return t.installments.map((inst, idx) => {
            const paid = Math.min(inst.amount, Math.max(0, runningPaid));
            runningPaid -= paid;
            const remaining = Math.max(0, inst.amount - paid);
            return {
                id: `termin-${idx + 1}`,
                label: inst.note || `Termin ${idx + 1}`,
                percent: inst.percent || Math.round((inst.amount / totalAmount) * 100),
                targetAmount: inst.amount,
                remainingAmount: remaining,
                dueDate: inst.dueDate,
                isPaid: paid >= inst.amount && inst.amount > 0,
                poNumber: po.poNumber,
            };
        });
    }

    return [
        {
            id: 'full-1',
            label: 'Pelunasan Penuh',
            percent: 100,
            targetAmount: totalAmount,
            remainingAmount: Math.max(0, totalAmount - totalPaid),
            dueDate: po.issuedAt,
            isPaid: totalPaid >= totalAmount && totalAmount > 0,
            poNumber: po.poNumber,
        },
    ];
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

export function VendorPaymentModal({
    isOpen,
    onClose,
    po,
    cashBankAccounts = [],
    onAddPayment,
    onSubmit,
}: VendorPaymentModalProps) {
    if (!isOpen || !po) return null;

    const schedule = deriveScheduleItems(po);
    const payments = po.payments ?? [];
    const totalPaid = payments.reduce((s, r) => s + r.amount, 0);
    const remainingAmount = Math.max(0, po.totalAmount - totalPaid);

    // Default to first unpaid termin or first termin
    const firstUnpaid = schedule.find((s) => !s.isPaid) || schedule[0];

    const [selectedTermId, setSelectedTermId] = useState<string | number>(
        firstUnpaid?.id ?? '',
    );
    const [payType, setPayType] = useState<'full' | 'partial'>('partial');
    const [amountInput, setAmountInput] = useState<number>(
        firstUnpaid?.remainingAmount || firstUnpaid?.targetAmount || remainingAmount,
    );
    const [dateInput, setDateInput] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [accountId, setAccountId] = useState<string | number>(
        cashBankAccounts[0]?.id || '',
    );
    const [method, setMethod] = useState<string>(
        cashBankAccounts[0]
            ? `Transfer ${cashBankAccounts[0].name}`
            : 'Transfer Bank BCA',
    );
    const [refInput, setRefInput] = useState<string>('');
    const [notesInput, setNotesInput] = useState<string>(
        firstUnpaid
            ? `Pembayaran ${firstUnpaid.label} PO ${po.poNumber}`
            : `Pembayaran PO ${po.poNumber}`,
    );

    // Sync state when po or open status changes
    useEffect(() => {
        const unpaid = schedule.find((s) => !s.isPaid) || schedule[0];
        if (unpaid) {
            setSelectedTermId(unpaid.id);
            setAmountInput(unpaid.remainingAmount || unpaid.targetAmount);
            setNotesInput(`Pembayaran ${unpaid.label} PO ${po.poNumber}`);
        }
        if (cashBankAccounts.length > 0 && !accountId) {
            setAccountId(cashBankAccounts[0].id);
        }
    }, [po.poNumber, isOpen]);

    const selectedTerm = schedule.find((s) => s.id === selectedTermId) || schedule[0];

    const handleSelectTerm = (term: PaymentScheduleItem) => {
        setSelectedTermId(term.id);
        setPayType('partial');
        setAmountInput(term.remainingAmount > 0 ? Math.round(term.remainingAmount) : Math.round(term.targetAmount));
        setNotesInput(`Pembayaran ${term.label} PO ${term.poNumber || po.poNumber}`);
    };

    const handleSelectFull = () => {
        setPayType('full');
        setAmountInput(remainingAmount > 0 ? remainingAmount : po.totalAmount);
        setNotesInput(`Pelunasan Total PO ${po.poNumber}`);
    };

    const handleSelectPartial = () => {
        setPayType('partial');
        if (selectedTerm) {
            setAmountInput(selectedTerm.remainingAmount > 0 ? selectedTerm.remainingAmount : selectedTerm.targetAmount);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountInput <= 0 || !dateInput) return;

        const termLabel =
            payType === 'full'
                ? 'Pelunasan Total'
                : selectedTerm?.label ?? 'Pembayaran';

        if (onSubmit) {
            onSubmit({
                poNumber: po.poNumber,
                termLabel,
                amount: Number(amountInput),
                date: dateInput,
                method,
                account_id: accountId || undefined,
                referenceNo: refInput,
                notes: notesInput,
                term_id: selectedTerm?.id,
            });
            return;
        }

        if (onAddPayment) {
            const record: VendorPaymentRecord = {
                id: `pay-${Date.now()}`,
                poNumber: po.poNumber,
                termLabel,
                amount: Number(amountInput),
                date: dateInput,
                method,
                referenceNo: refInput,
                notes: notesInput,
            };
            onAddPayment(po.poNumber, record);
            onClose();
        }
    };

    return (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
            <div className="animate-in fade-in zoom-in w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                            Catat Pembayaran Keluar (Vendor)
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            {po.vendorName} ({po.poNumber})
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Summary Box */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            TOTAL TAGIHAN PO VENDOR
                        </div>
                        <div className="font-mono text-sm font-black text-slate-900">
                            {fmt(po.totalAmount)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            SISA HUTANG
                        </div>
                        <div className="font-mono text-xs font-bold text-rose-600">
                            {fmt(remainingAmount)}
                        </div>
                    </div>
                </div>

                {/* Jadwal Termin & Jatuh Tempo Selector */}
                {schedule && schedule.length > 0 && (
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            PILIH TERMIN PEMBAYARAN & JATUH TEMPO
                        </label>
                        <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1">
                            {schedule.map((term) => {
                                const isSelected = selectedTermId === term.id;
                                return (
                                    <button
                                        key={term.id}
                                        type="button"
                                        onClick={() => handleSelectTerm(term)}
                                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                                            isSelected
                                                ? 'border-rose-600 bg-rose-50 font-bold text-rose-900 ring-2 ring-rose-600/20'
                                                : term.isPaid
                                                  ? 'border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                {term.poNumber && (
                                                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-700">
                                                        {term.poNumber}
                                                    </span>
                                                )}
                                                <span>
                                                    {term.label}
                                                </span>
                                                {term.isPaid && (
                                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                                        Lunas
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-slate-500">
                                                Jatuh Tempo:{' '}
                                                <strong className="font-mono text-slate-700">
                                                    {formatIndoDate(term.dueDate)}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-xs font-bold text-slate-900">
                                                {fmt(term.targetAmount)}
                                            </div>
                                            <div className="font-mono text-[10px] font-semibold text-rose-600">
                                                {term.isPaid
                                                    ? 'Rp 0'
                                                    : `Sisa: ${fmt(term.remainingAmount)}`}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Opsi Jenis Pembayaran: Full vs Partial */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        OPSI NOMINAL PEMBAYARAN
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleSelectFull}
                            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                payType === 'full'
                                    ? 'border-rose-600 bg-rose-50 font-bold text-rose-900 ring-2 ring-rose-600/20'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <div className="text-xs font-bold">
                                Pelunasan Total
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-500">
                                Sisa sisa tagihan PO
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectPartial}
                            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                payType === 'partial'
                                    ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <div className="text-xs font-bold">
                                Cicil / Nominal Termin
                            </div>
                            <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                                Sebagian nominal
                            </div>
                        </button>
                    </div>
                </div>

                {/* Nominal Input */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                        Nominal Dibayar (Rp)
                    </label>
                    <input
                        type="number"
                        value={amountInput || ''}
                        readOnly={payType === 'full'}
                        onChange={(e) =>
                            setAmountInput(parseFloat(e.target.value) || 0)
                        }
                        placeholder="Masukkan nominal pembayaran..."
                        className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none ${
                            payType === 'full'
                                ? 'border-slate-300 bg-slate-100 text-slate-700'
                                : 'border-blue-400 bg-white text-blue-950 focus:border-blue-600'
                        }`}
                    />
                </div>

                {/* Tanggal Pembayaran & Metode Pembayaran */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Tanggal Bayar
                        </label>
                        <div className="relative flex items-center">
                            <div className="shadow-2xs flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                <span>
                                    {formatIndoDate(dateInput)}
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
                                value={dateInput}
                                onChange={(e) => setDateInput(e.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Rekening / Sumber Dana Kas
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => {
                                setAccountId(e.target.value);
                                const acc = cashBankAccounts.find(
                                    (a) => String(a.id) === e.target.value,
                                );
                                if (acc) {
                                    setMethod(`Transfer ${acc.name}`);
                                }
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                        >
                            {cashBankAccounts && cashBankAccounts.length > 0 ? (
                                cashBankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.display_name || `${acc.code} - ${acc.name}`}
                                    </option>
                                ))
                            ) : (
                                <option value="">
                                    Transfer Bank BCA (Default)
                                </option>
                            )}
                        </select>
                    </div>
                </div>

                {/* Ref / Catatan */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                        No. Ref / Bukti Transfer (Opsional)
                    </label>
                    <input
                        type="text"
                        value={refInput}
                        onChange={(e) => setRefInput(e.target.value)}
                        placeholder="Contoh: TRX-99234 / BCA ke Vendor"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={amountInput <= 0}
                        className={`cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                            amountInput > 0
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'cursor-not-allowed bg-slate-200 text-slate-400'
                        }`}
                    >
                        Simpan Pembayaran Vendor
                    </button>
                </div>
            </div>
        </div>
    );
}

