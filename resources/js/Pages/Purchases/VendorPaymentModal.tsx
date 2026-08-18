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
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const totalAmount = round2(po.totalAmount || 0);
    const payments = po.payments || [];
    const totalPaid = round2(payments.reduce((s, r) => s + r.amount, 0));

    // If real database payment_plan exists, use its terms
    if (po.payment_plan && po.payment_plan.terms && po.payment_plan.terms.length > 0) {
        return po.payment_plan.terms.map((term) => {
            const termSettlementsPaid = round2(
                (term.settlements || []).reduce(
                    (sum, s) => sum + s.amount,
                    0,
                ),
            );
            const termAmt = round2(term.amount);
            const isPaid = term.status === 'paid' || termSettlementsPaid >= termAmt - 1.0;
            const remainingAmount = isPaid ? 0 : Math.max(0, round2(termAmt - termSettlementsPaid));

            return {
                id: term.id,
                label: term.label,
                percent: term.percent,
                targetAmount: termAmt,
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
    initialTerm?: { id: string | number } | null;
    isPPN?: boolean;
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
    initialTerm,
    isPPN = true,
    cashBankAccounts = [],
    onAddPayment,
    onSubmit,
}: VendorPaymentModalProps) {
    if (!isOpen || !po) return null;

    const schedule = deriveScheduleItems(po);
    const payments = po.payments ?? [];
    const totalPaid = payments.reduce((s, r) => s + r.amount, 0);
    const remainingAmount = Math.max(0, po.totalAmount - totalPaid);

    // Default to initialTerm if specified and unpaid, or first unpaid termin or first termin
    const defaultTerm =
        (initialTerm && schedule.find((s) => String(s.id) === String(initialTerm.id))) ||
        schedule.find((s) => !s.isPaid) ||
        schedule[0];

    const [selectedTermId, setSelectedTermId] = useState<string | number>(
        defaultTerm?.id ?? '',
    );
    const [payType, setPayType] = useState<'full' | 'partial'>('full');
    const [amountInput, setAmountInput] = useState<number>(
        defaultTerm?.remainingAmount > 0
            ? Math.round(defaultTerm.remainingAmount)
            : defaultTerm?.targetAmount
              ? Math.round(defaultTerm.targetAmount)
              : 0,
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
        defaultTerm
            ? `Pelunasan ${defaultTerm.label} PO ${po.poNumber}`
            : `Pembayaran PO ${po.poNumber}`,
    );

    // Sync state when po or open status changes
    useEffect(() => {
        const activeT =
            (initialTerm && schedule.find((s) => String(s.id) === String(initialTerm.id))) ||
            schedule.find((s) => !s.isPaid) ||
            schedule[0];

        if (activeT) {
            setSelectedTermId(activeT.id);
            setPayType('full');
            setAmountInput(
                activeT.remainingAmount > 0
                    ? Math.round(activeT.remainingAmount)
                    : Math.round(activeT.targetAmount),
            );
            setNotesInput(`Pelunasan ${activeT.label} PO ${po.poNumber}`);
        }
        if (cashBankAccounts.length > 0 && !accountId) {
            setAccountId(cashBankAccounts[0].id);
        }
    }, [po.poNumber, initialTerm?.id, isOpen]);

    const selectedTerm = schedule.find((s) => s.id === selectedTermId) || schedule[0];

    const handleSelectTerm = (term: PaymentScheduleItem) => {
        setSelectedTermId(term.id);
        setPayType('full');
        setAmountInput(
            term.remainingAmount > 0
                ? Math.round(term.remainingAmount)
                : Math.round(term.targetAmount),
        );
        setNotesInput(`Pelunasan ${term.label} PO ${term.poNumber || po.poNumber}`);
    };

    const handleSelectFull = () => {
        setPayType('full');
        if (selectedTerm) {
            setAmountInput(
                selectedTerm.remainingAmount > 0
                    ? Math.round(selectedTerm.remainingAmount)
                    : Math.round(selectedTerm.targetAmount),
            );
            setNotesInput(`Pelunasan ${selectedTerm.label} PO ${po.poNumber}`);
        }
    };

    const handleSelectPartial = () => {
        setPayType('partial');
        if (selectedTerm) {
            setAmountInput(
                selectedTerm.remainingAmount > 0
                    ? Math.round(selectedTerm.remainingAmount)
                    : Math.round(selectedTerm.targetAmount),
            );
            setNotesInput(`Cicil ${selectedTerm.label} PO ${po.poNumber}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountInput <= 0 || !dateInput) return;

        const termLabel = selectedTerm?.label ?? (payType === 'full' ? 'Pelunasan Termin' : 'Cicil Termin');

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
        <div className="backdrop-blur-xs fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
            <div className="animate-in fade-in zoom-in w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    isPPN ? 'bg-blue-600' : 'bg-slate-700'
                                }`}
                            />
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
                            {schedule.map((term, index) => {
                                const isSelected = selectedTermId === term.id;
                                // Sequential rule: all previous terms must be paid before this term can be selected
                                const isPriorTermsPaid = schedule
                                    .slice(0, index)
                                    .every((prev) => prev.isPaid);
                                const isLocked = !term.isPaid && !isPriorTermsPaid;

                                return (
                                    <button
                                        key={term.id}
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => {
                                            if (!isLocked) {
                                                handleSelectTerm(term);
                                            }
                                        }}
                                        className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                                            isLocked
                                                ? 'cursor-not-allowed border-slate-200 bg-slate-100/70 text-slate-400 opacity-60'
                                                : isSelected
                                                  ? isPPN
                                                      ? 'cursor-pointer border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                                      : 'cursor-pointer border-slate-800 bg-slate-100 font-bold text-slate-900 ring-2 ring-slate-800/20'
                                                  : term.isPaid
                                                    ? 'cursor-pointer border-slate-200 bg-slate-100 text-slate-400 opacity-60'
                                                    : 'cursor-pointer border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                {term.poNumber && (
                                                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-700">
                                                        {term.poNumber}
                                                    </span>
                                                )}
                                                <span>{term.label}</span>
                                                {term.isPaid ? (
                                                    <span className="py-0.2 rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-800">
                                                        Lunas
                                                    </span>
                                                ) : isLocked ? (
                                                    <span className="py-0.2 flex items-center gap-1 rounded bg-slate-200 px-1.5 text-[9px] font-bold text-slate-600">
                                                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                        Terkunci (Bayar termin sebelumnya)
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                                                <span>{term.percent}%</span>
                                                <span>•</span>
                                                <span className="font-mono font-bold text-slate-800">
                                                    {fmt(term.targetAmount)}
                                                </span>
                                                {term.dueDate && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            Tempo:{' '}
                                                            {formatIndoDate(
                                                                term.dueDate,
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400">
                                                Sisa
                                            </div>
                                            <div className="font-mono text-xs font-bold text-rose-600">
                                                {fmt(term.remainingAmount)}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Opsi Jenis Pembayaran: Full Termin vs Partial Termin */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        OPSI NOMINAL PEMBAYARAN TERMIN
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleSelectFull}
                            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                payType === 'full'
                                    ? isPPN
                                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                        : 'border-slate-800 bg-slate-100 font-bold text-slate-900 ring-2 ring-slate-800/20'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <div className="text-xs font-bold">
                                Pelunasan Termin
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-500">
                                Sisa tagihan termin ini ({fmt(selectedTerm?.remainingAmount > 0 ? selectedTerm.remainingAmount : selectedTerm?.targetAmount || 0)})
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectPartial}
                            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                payType === 'partial'
                                    ? isPPN
                                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                        : 'border-slate-800 bg-slate-100 font-bold text-slate-900 ring-2 ring-slate-800/20'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <div className="text-xs font-bold">
                                Cicil Sebagian Termin
                            </div>
                            <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                                Masukkan nominal manual
                            </div>
                        </button>
                    </div>
                </div>

                {/* Nominal Input with Thousands Separator */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">
                            Nominal Dibayar (Rp)
                        </label>
                        {amountInput > 0 && (
                            <span className="font-mono text-[11px] font-bold text-slate-500">
                                {fmt(amountInput)}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-sm font-bold text-slate-400">
                            Rp
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amountInput > 0 ? Math.round(amountInput).toLocaleString('id-ID') : ''}
                            readOnly={payType === 'full'}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                setAmountInput(rawValue ? parseInt(rawValue, 10) : 0);
                            }}
                            placeholder="0"
                            className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none ${
                                payType === 'full'
                                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                                    : isPPN
                                      ? 'border-blue-400 bg-white text-blue-950 focus:border-blue-600'
                                      : 'border-slate-400 bg-white text-slate-900 focus:border-slate-700'
                            }`}
                        />
                    </div>
                </div>

                {/* Tanggal Pembayaran & Metode Pembayaran */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                            Tanggal Bayar
                        </label>
                        <div className="relative flex items-center">
                            <div className="shadow-2xs flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                <span>{formatIndoDate(dateInput)}</span>
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
                                const selected = cashBankAccounts.find(
                                    (a) => String(a.id) === e.target.value,
                                );
                                if (selected) {
                                    setMethod(selected.name);
                                }
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                        >
                            {cashBankAccounts.length > 0 ? (
                                cashBankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.display_name ||
                                            `${acc.code} - ${acc.name}`}
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
                        className={`cursor-pointer rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all ${
                            amountInput > 0
                                ? isPPN
                                    ? 'bg-blue-600 shadow-sm hover:bg-blue-700'
                                    : 'bg-slate-800 shadow-sm hover:bg-slate-900'
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

