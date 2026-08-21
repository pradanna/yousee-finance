import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export interface RecordPaymentModalSubmitData {
    poNumber: string;
    term_id?: string | number;
    termLabel: string;
    amount: number;
    date: string;
    method: string;
    account_id?: string | number;
    referenceNo: string;
    notes: string;
}

export interface VendorPaymentTermModalItem {
    id: string | number;
    sort_order?: number;
    label: string;
    amount: number;
    percent: number;
    due_date?: string | null;
    status: 'unpaid' | 'paid' | 'overdue' | string;
    paid_amount?: number;
    remaining_amount?: number;
}

export interface RecordPaymentVendorPO {
    id?: string | number;
    poNumber: string;
    vendorId?: number | string;
    vendorName: string;
    projectName?: string;
    totalAmount: number;
    issuedAt?: string | null;
    projectId?: string | number;
    terms?: VendorPaymentTermModalItem[];
    milestones?: Array<{
        id: string | number;
        sort_order?: number;
        label: string;
        amount: number;
        percent?: number;
        due_date?: string | null;
        status: 'unpaid' | 'paid' | 'overdue' | string;
        paid_amount?: number;
        remaining_amount?: number;
    }>;
    payment_plan?: {
        id: string | number;
        scheme?: string;
        total_amount?: number;
        terms: Array<{
            id: string | number;
            sort_order?: number;
            label: string;
            amount: number;
            percent: number;
            due_date?: string | null;
            status: 'unpaid' | 'paid' | 'overdue';
            settlements?: Array<{ amount: number }>;
        }>;
    } | null;
    paymentTerms?: {
        type: 'full' | 'dp' | 'termin';
        dpPercent?: number;
        dpAmount?: number;
        dpDueDate?: string;
        pelunasanDueDate?: string;
        fullDueDate?: string;
        installments?: Array<{
            percent: number;
            amount: number;
            note: string;
            dueDate?: string;
        }>;
    };
    payments?: Array<{
        amount: number;
    }>;
}

interface RecordPaymentModalProps {
    isOpen: boolean;
    po: RecordPaymentVendorPO | null;
    initialTerm?: VendorPaymentTermModalItem | null;
    remainingAmount: number;
    isLoading?: boolean;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
    onClose: () => void;
    onSubmit: (data: RecordPaymentModalSubmitData) => void;
}

const fmt = (n: number | string) =>
    `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

const formatIndoDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
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

// Helper derive schedule from any PO shape
function deriveVendorTerms(po: RecordPaymentVendorPO): VendorPaymentTermModalItem[] {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const totalAmount = round2(po.totalAmount || 0);

    // 1. If terms are directly supplied
    if (po.terms && po.terms.length > 0) {
        return po.terms;
    }

    // 2. If milestones are supplied (from DebtReceivable)
    if (po.milestones && po.milestones.length > 0) {
        return po.milestones.map((m, idx) => ({
            id: m.id || `term-${idx + 1}`,
            sort_order: m.sort_order ?? idx + 1,
            label: m.label,
            amount: m.amount,
            percent: m.percent ?? (totalAmount > 0 ? Math.round((m.amount / totalAmount) * 100) : 100),
            due_date: m.due_date,
            status: m.status,
            paid_amount: m.paid_amount,
            remaining_amount: m.remaining_amount !== undefined ? m.remaining_amount : (m.status === 'paid' ? 0 : m.amount),
        }));
    }

    // 3. If real payment_plan DB relation exists
    if (po.payment_plan && po.payment_plan.terms && po.payment_plan.terms.length > 0) {
        return po.payment_plan.terms.map((term, idx) => {
            const termSettlementsPaid = round2(
                (term.settlements || []).reduce((sum, s) => sum + s.amount, 0),
            );
            const termAmt = round2(term.amount);
            const isPaid = term.status === 'paid' || termSettlementsPaid >= termAmt - 1.0;
            const remaining = isPaid ? 0 : Math.max(0, round2(termAmt - termSettlementsPaid));

            return {
                id: term.id || `term-${idx + 1}`,
                sort_order: term.sort_order ?? idx + 1,
                label: term.label,
                percent: term.percent,
                amount: termAmt,
                paid_amount: termSettlementsPaid,
                remaining_amount: remaining,
                due_date: term.due_date,
                status: isPaid ? 'paid' : term.status === 'overdue' ? 'overdue' : 'unpaid',
            };
        });
    }

    // 4. If paymentTerms property exists
    const payments = po.payments || [];
    const totalPaid = round2(payments.reduce((s, r) => s + r.amount, 0));
    const t = po.paymentTerms;

    if (t?.type === 'dp') {
        const dpPercent = t.dpPercent ?? 50;
        const dpAmt = t.dpAmount ?? Math.round(totalAmount * (dpPercent / 100));
        const pelunasanAmt = totalAmount - dpAmt;
        const pelunasanPercent = 100 - dpPercent;

        const dpPaid = Math.min(dpAmt, totalPaid);
        const dpRemaining = Math.max(0, dpAmt - dpPaid);
        const pelunasanPaid = Math.max(0, totalPaid - dpAmt);
        const pelunasanRemaining = Math.max(0, pelunasanAmt - pelunasanPaid);

        return [
            {
                id: 'dp-1',
                sort_order: 1,
                label: `Termin 1 – Uang Muka (DP) (${dpPercent}%)`,
                percent: dpPercent,
                amount: dpAmt,
                paid_amount: dpPaid,
                remaining_amount: dpRemaining,
                due_date: t.dpDueDate || po.issuedAt,
                status: dpPaid >= dpAmt && dpAmt > 0 ? 'paid' : 'unpaid',
            },
            {
                id: 'pelunasan-2',
                sort_order: 2,
                label: `Termin 2 – Pelunasan (${pelunasanPercent}%)`,
                percent: pelunasanPercent,
                amount: pelunasanAmt,
                paid_amount: pelunasanPaid,
                remaining_amount: pelunasanRemaining,
                due_date: t.pelunasanDueDate,
                status: pelunasanPaid >= pelunasanAmt && pelunasanAmt > 0 ? 'paid' : 'unpaid',
            },
        ];
    }

    if (t?.type === 'termin' && t.installments) {
        let runningPaid = totalPaid;
        return t.installments.map((inst, idx) => {
            const paid = Math.min(inst.amount, Math.max(0, runningPaid));
            runningPaid -= paid;
            const remaining = Math.max(0, inst.amount - paid);
            return {
                id: `termin-${idx + 1}`,
                sort_order: idx + 1,
                label: inst.note || `Termin ${idx + 1}`,
                percent: inst.percent || (totalAmount > 0 ? Math.round((inst.amount / totalAmount) * 100) : 100),
                amount: inst.amount,
                paid_amount: paid,
                remaining_amount: remaining,
                due_date: inst.dueDate,
                status: paid >= inst.amount && inst.amount > 0 ? 'paid' : 'unpaid',
            };
        });
    }

    // Default Full
    return [
        {
            id: 'full-1',
            sort_order: 1,
            label: 'Pelunasan Penuh',
            percent: 100,
            amount: totalAmount,
            paid_amount: totalPaid,
            remaining_amount: Math.max(0, totalAmount - totalPaid),
            due_date: t?.fullDueDate || po.issuedAt,
            status: totalPaid >= totalAmount && totalAmount > 0 ? 'paid' : 'unpaid',
        },
    ];
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    po,
    initialTerm,
    remainingAmount,
    isLoading = false,
    cashBankAccounts = [],
    onClose,
    onSubmit,
}) => {
    if (!isOpen || !po) return null;

    const terms = deriveVendorTerms(po);

    // Initial Term Picker
    const defaultTerm =
        (initialTerm && terms.find((t) => String(t.id) === String(initialTerm.id))) ||
        terms.find((t) => t.status !== 'paid' && (t.remaining_amount ?? t.amount) > 0) ||
        terms[0];

    const [selectedTermId, setSelectedTermId] = useState<string | number>(
        defaultTerm?.id ?? '',
    );
    const [payType, setPayType] = useState<'full' | 'partial'>('full');
    const [amount, setAmount] = useState<number>(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState<string | number>(
        cashBankAccounts[0]?.id || '',
    );
    const [method, setMethod] = useState<string>(
        cashBankAccounts[0] ? `Transfer ${cashBankAccounts[0].name}` : 'Transfer Bank BCA',
    );
    const [referenceNo, setReferenceNo] = useState('');
    const [notes, setNotes] = useState('');

    const activeSelectedTerm =
        terms.find((t) => String(t.id) === String(selectedTermId)) || terms[0];

    const activeTargetAmount = activeSelectedTerm
        ? activeSelectedTerm.remaining_amount !== undefined
            ? activeSelectedTerm.remaining_amount
            : activeSelectedTerm.status === 'paid'
              ? 0
              : activeSelectedTerm.amount
        : remainingAmount;

    // Reset state on modal opening or change
    useEffect(() => {
        if (isOpen && po) {
            const activeT =
                (initialTerm && terms.find((t) => String(t.id) === String(initialTerm.id))) ||
                terms.find((t) => t.status !== 'paid' && (t.remaining_amount ?? t.amount) > 0) ||
                terms[0];

            if (activeT) {
                setSelectedTermId(activeT.id);
                const rem =
                    activeT.remaining_amount !== undefined
                        ? activeT.remaining_amount
                        : activeT.status === 'paid'
                          ? 0
                          : activeT.amount;
                setAmount(Math.round(rem > 0 ? rem : activeT.amount));
                setNotes(`Pembayaran ${activeT.label} PO ${po.poNumber}`);
            } else {
                setSelectedTermId('');
                setAmount(Math.round(remainingAmount));
                setNotes(`Pembayaran PO ${po.poNumber}`);
            }

            setPayType('full');
            setDate(new Date().toISOString().split('T')[0]);
            setReferenceNo('');

            if (cashBankAccounts.length > 0) {
                setAccountId(cashBankAccounts[0].id);
                setMethod(`Transfer ${cashBankAccounts[0].name}`);
            }
        }
    }, [isOpen, po, initialTerm, remainingAmount]);

    const handleSelectTerm = (term: VendorPaymentTermModalItem) => {
        setSelectedTermId(term.id);
        setPayType('full');
        const rem =
            term.remaining_amount !== undefined
                ? term.remaining_amount
                : term.status === 'paid'
                  ? 0
                  : term.amount;
        setAmount(Math.round(rem > 0 ? rem : term.amount));
        setNotes(`Pembayaran ${term.label} PO ${po.poNumber}`);
    };

    const handleSelectPayType = (opt: 'full' | 'partial') => {
        setPayType(opt);
        if (opt === 'full') {
            setAmount(Math.round(activeTargetAmount > 0 ? activeTargetAmount : activeSelectedTerm?.amount || 0));
        } else {
            setAmount(Math.round((activeTargetAmount > 0 ? activeTargetAmount : activeSelectedTerm?.amount || 0) * 0.5));
        }
    };

    const handleSubmit = () => {
        if (!po) return;
        const roundedAmount = Math.round(Number(amount) || 0);
        if (roundedAmount <= 0) {
            alert('Nominal pembayaran harus lebih besar dari Rp 0!');
            return;
        }

        const termLabel =
            activeSelectedTerm?.label ||
            (payType === 'full' ? 'Pelunasan Penuh PO' : 'Pembayaran Cicilan PO');

        onSubmit({
            poNumber: po.poNumber,
            term_id: activeSelectedTerm?.id,
            termLabel,
            amount: roundedAmount,
            date,
            method,
            account_id: accountId || undefined,
            referenceNo,
            notes: notes || `${termLabel} via ${method}`,
        });
    };

    const isFullyPaid = remainingAmount <= 0;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white text-slate-800">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-5">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                            Catat Pembayaran Keluar (Vendor)
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            Vendor:{' '}
                            <span className="font-bold text-slate-700">
                                {po.vendorName}
                            </span>{' '}
                            • No. PO:{' '}
                            <span className="font-mono font-bold text-blue-600">
                                {po.poNumber}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-700"
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
                    {/* Top 4 KPI Metrics Card */}
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:grid-cols-4">
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TOTAL TAGIHAN PO
                            </span>
                            <span className="mt-1 block font-mono text-sm font-black text-slate-900">
                                {fmt(po.totalAmount)}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                SISA HUTANG PO
                            </span>
                            <span className="mt-1 block font-mono text-sm font-black text-rose-600">
                                {fmt(remainingAmount)}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                STATUS PELUNASAN
                            </span>
                            <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 border border-amber-200/60">
                                {isFullyPaid ? 'Lunas' : 'Belum Lunas'}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TOTAL TERMIN
                            </span>
                            <span className="mt-1 block font-mono text-sm font-bold text-slate-900">
                                {terms.length} Termin
                            </span>
                        </div>
                    </div>

                    {/* 2-Column Split: Left = Termin Selector, Right = Form Controls */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* LEFT COLUMN: Pilih Termin Pembayaran */}
                        <div className="space-y-3 lg:col-span-5">
                            <div className="flex items-center justify-between">
                                <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                    PILIH TERMIN PEMBAYARAN
                                </label>
                                <span className="text-[10px] font-semibold text-slate-400">
                                    Pilih salah satu
                                </span>
                            </div>

                            <div className="space-y-3">
                                {terms.map((term, index) => {
                                    const isSelected = selectedTermId === term.id;
                                    const isPriorTermsPaid = terms
                                        .slice(0, index)
                                        .every((prev) => prev.status === 'paid' || (prev.remaining_amount ?? 0) <= 0);
                                    const isTermCompleted = term.status === 'paid' || (term.remaining_amount ?? 0) <= 0;
                                    const isLocked = !isTermCompleted && !isPriorTermsPaid;

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
                                            className={`w-full rounded-2xl border p-4 text-left transition-all ${
                                                isLocked
                                                    ? 'cursor-not-allowed border-slate-200 bg-slate-50/70 text-slate-400 opacity-60'
                                                    : isSelected
                                                      ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-600/20'
                                                      : isTermCompleted
                                                        ? 'border-slate-200 bg-slate-50/70 text-slate-400 opacity-70 hover:opacity-100'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="text-xs font-black text-slate-900">
                                                        {term.label}{' '}
                                                        <span className="text-[11px] font-bold text-slate-400">
                                                            ({term.percent}%)
                                                        </span>
                                                    </div>
                                                    <div className="mt-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-slate-600">
                                                        {po.poNumber}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-mono text-xs font-black text-rose-600">
                                                        {fmt(term.amount)}
                                                    </span>
                                                    {isTermCompleted ? (
                                                        <div className="mt-1">
                                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-black text-emerald-800">
                                                                ✓ Lunas
                                                            </span>
                                                        </div>
                                                    ) : isLocked ? (
                                                        <div className="mt-1">
                                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9.5px] font-bold text-slate-600">
                                                                Terkunci
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100/80 pt-2 text-[10.5px] font-semibold text-slate-500">
                                                <span>
                                                    Target:{' '}
                                                    <strong className="font-mono text-slate-700">
                                                        {fmt(term.amount)}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Jatuh Tempo:{' '}
                                                    <strong className="text-slate-700">
                                                        {formatIndoDate(term.due_date)}
                                                    </strong>
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Opsi Nominal & Form Inputs */}
                        <div className="space-y-4 lg:col-span-7">
                            {/* Opsi Nominal Pembayaran */}
                            <div className="space-y-2">
                                <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                    OPSI NOMINAL PEMBAYARAN
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectPayType('full')}
                                        className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                                            payType === 'full'
                                                ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-2 ring-blue-600/20'
                                                : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="text-xs font-black text-blue-900">
                                            Pelunasan Penuh Termin
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                            Sesuai target/sisa termin ini
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSelectPayType('partial')}
                                        className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                                            payType === 'partial'
                                                ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-2 ring-blue-600/20'
                                                : 'border-slate-200 bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="text-xs font-black text-slate-900">
                                            Cicil Sebagian Termin
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                            Nominal bebas / dicicil
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Nominal Dibayar (Rp) Input */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                        Nominal Dibayar (Rp)
                                    </label>
                                    {amount > 0 && (
                                        <span className="font-mono text-xs font-black text-blue-600">
                                            {fmt(amount)}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-xs font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <TextInput
                                        type="text"
                                        inputMode="numeric"
                                        value={
                                            amount > 0
                                                ? Math.round(amount).toLocaleString('id-ID')
                                                : ''
                                        }
                                        disabled={payType === 'full'}
                                        onChange={(e) => {
                                            const cleanDigits = e.target.value.replace(/\D/g, '');
                                            setAmount(cleanDigits ? parseInt(cleanDigits, 10) : 0);
                                        }}
                                        placeholder="0"
                                        className="w-full rounded-2xl border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3 text-xs font-black text-slate-800 focus:border-blue-500 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Tanggal Bayar & Rekening / Sumber Kas */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                        Tanggal Bayar
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs font-bold text-slate-800 transition-all hover:border-blue-500">
                                            <span>{formatIndoDate(date)}</span>
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
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                        Rekening / Sumber Kas
                                    </label>
                                    {cashBankAccounts.length > 0 ? (
                                        <SelectInput
                                            value={String(accountId)}
                                            onChange={(e) => {
                                                setAccountId(e.target.value);
                                                const sel = cashBankAccounts.find(
                                                    (a) => String(a.id) === e.target.value,
                                                );
                                                if (sel) {
                                                    setMethod(`Transfer ${sel.name}`);
                                                }
                                            }}
                                            options={cashBankAccounts.map((acc) => ({
                                                value: String(acc.id),
                                                label: acc.display_name || `${acc.code} - ${acc.name}`,
                                            }))}
                                            className="w-full"
                                        />
                                    ) : (
                                        <SelectInput
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            options={[
                                                { value: 'Transfer Bank BCA', label: 'Transfer Bank BCA' },
                                                { value: 'Transfer Bank Mandiri', label: 'Transfer Bank Mandiri' },
                                                { value: 'Kas Operasional / Kas Kecil', label: 'Kas Operasional / Kas Kecil' },
                                            ]}
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* No. Ref / Bukti Transfer (Opsional) */}
                            <div className="space-y-1.5">
                                <label className="block text-[10.5px] font-black uppercase tracking-widest text-slate-600">
                                    No. Ref / Bukti Transfer (Opsional)
                                </label>
                                <TextInput
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    placeholder="Contoh: TRX-99234 / BCA ke Vendor"
                                    className="w-full rounded-2xl border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-8 py-4">
                    <SecondaryButton type="button" onClick={onClose} disabled={isLoading}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={amount <= 0 || isLoading}
                        isLoading={isLoading}
                        loadingText="Menyimpan Pembayaran..."
                    >
                        Simpan Pembayaran Vendor
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
