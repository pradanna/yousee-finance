import React, { useState, useEffect } from 'react';
import Modal from '@/Components/UI/Modal';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import TextInput from '@/Components/Form/TextInput';
import InputLabel from '@/Components/Form/InputLabel';
import SelectInput from '@/Components/Form/SelectInput';
import { useFiscalMode } from '@/Layouts/AppLayout';

export interface PaymentModalData {
    id: string;
    title: string; // e.g. "INV-PPN-001" or "PO-PPN-001"
    partyName: string; // e.g. "PT. Gojek Tokopedia"
    amount: number;
    type: 'receive' | 'pay'; // receive = Catat Terima, pay = Catat Bayar
}

interface PaymentModalProps {
    show: boolean;
    onClose: () => void;
    data: PaymentModalData | null;
    onSubmit: (result: {
        id: string;
        account: string;
        amount: number;
        date: string;
        method: string;
        reference: string;
        taxInvoiceNo?: string;
        type: 'receive' | 'pay';
        partyName: string;
    }) => void;
}

const CASH_ACCOUNTS = [
    { id: 'bca', name: 'Bank BCA - 1234 5678 90 (a.n PT Yousee Indonesia)', badge: 'Bank' },
    { id: 'mandiri', name: 'Bank Mandiri - 9876 5432 10 (a.n PT Yousee Indonesia)', badge: 'Bank' },
    { id: 'kas_utama', name: 'Kas Utama / Tunai', badge: 'Kas' },
    { id: 'kas_kecil', name: 'Kas Kecil (Petty Cash)', badge: 'Kas' },
];

export default function PaymentModal({ show, onClose, data, onSubmit }: PaymentModalProps) {
    if (!data) return null;

    const fiscalMode = useFiscalMode();
    const isPpn = fiscalMode === 'ppn';
    const isReceive = data.type === 'receive';

    const [selectedAccount, setSelectedAccount] = useState('bca');
    const [amount, setAmount] = useState(data.amount);
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('Transfer Bank');
    const [reference, setReference] = useState('');
    const [taxInvoiceNo, setTaxInvoiceNo] = useState('');

    useEffect(() => {
        if (data) {
            setAmount(data.amount);
            setSelectedAccount('bca');
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setMethod('Transfer Bank');
            setReference('');
            setTaxInvoiceNo('');
        }
    }, [data]);

    // Calculate DPP and PPN 11%
    const dpp = isPpn ? Math.round(amount / 1.11) : amount;
    const ppnVal = isPpn ? amount - dpp : 0;

    const formatRupiah = (num: number) => `Rp ${Math.round(num).toLocaleString('id-ID')}`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const accountObj = CASH_ACCOUNTS.find((a) => a.id === selectedAccount);
        onSubmit({
            id: data.id,
            account: accountObj ? accountObj.name : selectedAccount,
            amount: Number(amount),
            date: paymentDate,
            method,
            reference,
            taxInvoiceNo: isPpn ? taxInvoiceNo : undefined,
            type: data.type,
            partyName: data.partyName,
        });
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                isReceive
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}
                        >
                            {isReceive ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 tracking-tight">
                                {isReceive ? 'Catat Penerimaan Piutang' : 'Catat Pembayaran Hutang'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {data.title} — <span className="font-semibold text-slate-700">{data.partyName}</span>
                            </p>
                        </div>
                    </div>

                    {/* Fiscal Mode Badge */}
                    <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isPpn
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                    >
                        Mode: {isPpn ? 'PPN (PKP)' : 'Non-PPN'}
                    </span>
                </div>

                {/* Body Form */}
                <div className="space-y-4">
                    {/* Account Target / Source */}
                    <div>
                        <InputLabel htmlFor="account" value={isReceive ? 'Masuk ke Kas / Bank Mana?' : 'Bayar dari Kas / Bank Mana?'} />
                        <SelectInput
                            id="account"
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="mt-1"
                        >
                            {CASH_ACCOUNTS.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    [{acc.badge}] {acc.name}
                                </option>
                            ))}
                        </SelectInput>
                    </div>

                    {/* Grid: Nominal & Tanggal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="amount" value="Nominal Transaksi (Gross Rp)" />
                            <TextInput
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="mt-1 block w-full text-xs font-mono font-bold"
                                required
                            />
                            {/* PPN Breakdown Info */}
                            {isPpn && (
                                <div className="mt-1.5 p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-[10px] text-blue-900 font-semibold flex items-center justify-between">
                                    <span>DPP: <strong>{formatRupiah(dpp)}</strong></span>
                                    <span>PPN (11%): <strong>{formatRupiah(ppnVal)}</strong></span>
                                </div>
                            )}
                        </div>
                        <div>
                            <InputLabel htmlFor="paymentDate" value="Tanggal Transaksi" />
                            <TextInput
                                id="paymentDate"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                                required
                            />
                        </div>
                    </div>

                    {/* Grid: Metode, Referensi & Faktur Pajak (If PPN) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="method" value="Metode Pembayaran" />
                            <SelectInput
                                id="method"
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="mt-1"
                            >
                                <option value="Transfer Bank">Transfer Bank</option>
                                <option value="Cash / Tunai">Cash / Tunai</option>
                                <option value="Giro / Cek">Giro / Cek</option>
                                <option value="E-Wallet / QRIS">E-Wallet / QRIS</option>
                            </SelectInput>
                        </div>
                        <div>
                            <InputLabel htmlFor="reference" value="No. Referensi / Catatan (Opsional)" />
                            <TextInput
                                id="reference"
                                type="text"
                                placeholder="cth: TRF-BCA-987123"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="mt-1 block w-full text-xs"
                            />
                        </div>
                    </div>

                    {/* Tax Invoice Field (Mode PPN Only) */}
                    {isPpn && (
                        <div className="pt-2 border-t border-slate-100">
                            <InputLabel htmlFor="taxInvoiceNo" value="No. Faktur Pajak / e-Faktur (Opsional)" />
                            <TextInput
                                id="taxInvoiceNo"
                                type="text"
                                placeholder="cth: 010.000-26.00000001"
                                value={taxInvoiceNo}
                                onChange={(e) => setTaxInvoiceNo(e.target.value)}
                                className="mt-1 block w-full text-xs font-mono"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit" className={isReceive ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : ''}>
                        {isReceive ? 'Simpan Penerimaan' : 'Simpan Pembayaran'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
