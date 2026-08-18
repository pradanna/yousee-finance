import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export interface RecordInvoicePaymentModalSubmitData {
    invoiceNumber: string;
    termLabel: string;
    amount: number;
    date: string;
    method: string;
    account_id?: string;
    referenceNo: string;
    notes: string;
}

interface RecordInvoicePaymentModalProps {
    isOpen: boolean;
    invoice: {
        id: number | string;
        invoiceNumber: string;
        clientName: string;
        projectName: string;
        totalAmount: number;
        paymentTerms?: {
            type: string;
            dpPercent?: number;
            installments?: Array<{
                percent: number;
                note: string;
                amount: number;
            }>;
        };
    } | null;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name: string;
    }>;
    remainingAmount: number;
    onClose: () => void;
    onSubmit: (data: RecordInvoicePaymentModalSubmitData) => void;
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

export const RecordInvoicePaymentModal: React.FC<
    RecordInvoicePaymentModalProps
> = ({ isOpen, invoice, cashBankAccounts = [], remainingAmount, onClose, onSubmit }) => {
    const [optionType, setOptionType] = useState<'lunas' | 'cicil'>('lunas');
    const [amount, setAmount] = useState<number>(remainingAmount);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('Transfer BCA');
    const [accountId, setAccountId] = useState<string>('');
    const [referenceNo, setReferenceNo] = useState('');
    const [termLabel, setTermLabel] = useState('');

    // Detect installment details from terms or set default labels
    useEffect(() => {
        if (isOpen && invoice) {
            setAmount(remainingAmount);
            setOptionType('lunas');
            setDate(new Date().toISOString().split('T')[0]);
            setReferenceNo('');

            // Build default term label based on schema type
            if (invoice.paymentTerms?.type === 'dp') {
                setTermLabel('DP / Uang Muka');
            } else if (invoice.paymentTerms?.type === 'termin') {
                setTermLabel('Pembayaran Termin');
            } else if (invoice.paymentTerms?.type === 'installment') {
                setTermLabel('Cicilan Bulanan');
            } else {
                setTermLabel('Pelunasan Invoice');
            }

            if (cashBankAccounts.length > 0) {
                setAccountId(String(cashBankAccounts[0].id));
            }
        }
    }, [isOpen, invoice, remainingAmount, cashBankAccounts]);

    const handleSelectOption = (opt: 'lunas' | 'cicil') => {
        setOptionType(opt);
        if (opt === 'lunas') {
            setAmount(remainingAmount);
        } else {
            setAmount(Math.round(remainingAmount * 0.5)); // default partial to 50% of remainder
        }
    };

    const handleSubmit = () => {
        if (!invoice) return;

        if (amount <= 0) {
            alert('Nominal pembayaran harus lebih besar dari Rp 0!');
            return;
        }
        onSubmit({
            invoiceNumber: invoice.invoiceNumber,
            termLabel,
            amount: Number(amount),
            date,
            method,
            account_id: accountId || undefined,
            referenceNo,
            notes: `${termLabel} via ${method}`,
        });
    };

    // Calculate dynamic porsi tagihan
    if (!isOpen || !invoice) return null;

    const porsiTagihanPct =
        invoice.totalAmount > 0
            ? Math.round((remainingAmount / invoice.totalAmount) * 100)
            : 100;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl">
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white text-slate-800">
                {/* Header */}
                <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-black tracking-tight text-slate-900">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                            Terima Pembayaran Client
                        </h3>
                        <p className="mt-1.5 text-[11px] font-bold leading-tight text-slate-400">
                            {invoice.clientName} · {invoice.projectName}
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
                <div className="flex-1 space-y-5 overflow-y-auto bg-white px-8 py-6">
                    {/* Top Total Amount and portion Display */}
                    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-5">
                        <div>
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                                TARGET TAGIHAN TERMIN
                            </span>
                            <span className="mt-1 block font-mono text-base font-black text-slate-800">
                                {fmt(remainingAmount)}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                                PORSI PROYEK
                            </span>
                            <span className="mt-1 block text-sm font-black text-emerald-600">
                                {porsiTagihanPct}%
                            </span>
                        </div>
                    </div>

                    {/* Payment Options (Lunas vs Cicil) */}
                    <div className="space-y-2.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            OPSI PEMBAYARAN
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    id: 'lunas',
                                    label: 'Lunas Sekaligus',
                                    desc: '100% nominal termin',
                                },
                                {
                                    id: 'cicil',
                                    label: 'Cicil / Parsial',
                                    desc: 'Sebagian nominal',
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                        handleSelectOption(
                                            opt.id as 'lunas' | 'cicil',
                                        )
                                    }
                                    className={`cursor-pointer rounded-3xl border p-4 text-left transition-all ${
                                        optionType === opt.id
                                            ? 'shadow-2xs border-emerald-500 bg-emerald-50/50 font-bold text-slate-900 ring-2 ring-emerald-500/20'
                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="text-xs font-black text-slate-900">
                                        {opt.label}
                                    </div>
                                    <div className="mt-1 text-[10px] font-semibold leading-tight text-slate-400">
                                        {opt.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Numeric Input */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Nominal Diterima (Rp)
                        </label>
                        <input
                            type="number"
                            value={amount || ''}
                            disabled={optionType === 'lunas'}
                            onChange={(e) =>
                                setAmount(
                                    Math.max(0, parseInt(e.target.value) || 0),
                                )
                            }
                            placeholder="Ketik nominal transfer..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-black text-slate-800 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-500"
                        />
                    </div>

                    {/* Form Layout fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Tanggal Bayar
                            </label>
                            <div className="relative flex items-center">
                                <div className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-800 transition-all hover:border-emerald-500">
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
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Rekening Kas / Bank Penerima
                            </label>
                            {cashBankAccounts.length > 0 ? (
                                <select
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-800 focus:border-emerald-500 focus:outline-none"
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
                                    className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="Transfer BCA">
                                        Transfer BCA
                                    </option>
                                    <option value="Transfer Mandiri">
                                        Transfer Mandiri
                                    </option>
                                    <option value="Cash / Tunai">
                                        Cash / Tunai
                                    </option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Reference text box */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                            No. Ref / Bukti Transfer (Opsional)
                        </label>
                        <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            placeholder="Contoh: TRX-884920 / BCA a/n Client"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-white px-8 py-5">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={handleSubmit}>
                        Simpan Pembayaran
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
