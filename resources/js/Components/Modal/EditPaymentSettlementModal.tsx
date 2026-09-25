import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export interface EditPaymentSettlementSubmitData {
    amount: number;
    paid_at: string;
    payment_method: string;
    account_id?: string;
    payment_ref: string;
    notes: string;
    reason: string;
}

export interface EditableSettlementItem {
    id: string;
    amount: number;
    paid_at: string | null;
    payment_method: string;
    payment_ref?: string | null;
    notes?: string | null;
    account_id?: string | null;
    account_name?: string | null;
    account_code?: string | null;
}

interface EditPaymentSettlementModalProps {
    isOpen: boolean;
    isLoading?: boolean;
    settlement: EditableSettlementItem | null;
    termLabel: string;
    documentNumber: string;
    partnerName: string;
    maxAllowedAmount: number;
    cashBankAccounts?: Array<{
        id: string | number;
        code: string;
        name: string;
        display_name?: string;
    }>;
    onClose: () => void;
    onSubmit: (data: EditPaymentSettlementSubmitData) => void;
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export const EditPaymentSettlementModal: React.FC<
    EditPaymentSettlementModalProps
> = ({
    isOpen,
    isLoading = false,
    settlement,
    termLabel,
    documentNumber,
    partnerName,
    maxAllowedAmount,
    cashBankAccounts = [],
    onClose,
    onSubmit,
}) => {
    const [amount, setAmount] = useState<number>(0);
    const [paidAt, setPaidAt] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('Transfer Bank');
    const [accountId, setAccountId] = useState<string>('');
    const [paymentRef, setPaymentRef] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (settlement && isOpen) {
            setAmount(settlement.amount);
            setPaidAt(
                settlement.paid_at || new Date().toISOString().split('T')[0],
            );
            setPaymentMethod(settlement.payment_method || 'Transfer Bank');
            setAccountId(settlement.account_id ? String(settlement.account_id) : '');
            setPaymentRef(settlement.payment_ref || '');
            setNotes(settlement.notes || '');
            setReason('');
            setValidationError(null);
        }
    }, [settlement, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (amount <= 0) {
            setValidationError('Nominal pembayaran harus lebih dari 0.');
            return;
        }

        if (amount > maxAllowedAmount + 1) {
            setValidationError(
                `Nominal pembayaran (${fmt(amount)}) melebihi batas termin ini (${fmt(maxAllowedAmount)}).`,
            );
            return;
        }

        if (!paidAt) {
            setValidationError('Tanggal pembayaran wajib diisi.');
            return;
        }

        if (!paymentMethod.trim()) {
            setValidationError('Metode pembayaran wajib diisi.');
            return;
        }

        onSubmit({
            amount,
            paid_at: paidAt,
            payment_method: paymentMethod,
            account_id: accountId || undefined,
            payment_ref: paymentRef,
            notes,
            reason,
        });
    };

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            maxWidth="lg"
            zIndex="z-[120]"
            closeable={!isLoading}
        >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
                <div>
                    <h3 className="text-sm font-bold text-white">
                        Koreksi / Edit Riwayat Pembayaran
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {documentNumber} · {partnerName} ({termLabel})
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white disabled:opacity-50"
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {validationError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                        ⚠️ {validationError}
                    </div>
                )}

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-800">
                    <span className="font-bold">Info Sinkronisasi Akuntansi:</span>{' '}
                    Perubahan nominal atau rekening kas/bank akan otomatis menyinkronkan jurnal buku besar dan menghitung ulang status lunas termin terkait.
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Tanggal Bayar */}
                    <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                            Tanggal Pembayaran <span className="text-rose-500">*</span>
                        </label>
                        <TextInput
                            type="date"
                            value={paidAt}
                            onChange={(e) => setPaidAt(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full text-xs"
                        />
                    </div>

                    {/* Nominal */}
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                                Nominal (Rp) <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                                Maks: {fmt(maxAllowedAmount)}
                            </span>
                        </div>
                        <TextInput
                            type="number"
                            min="1"
                            step="any"
                            value={amount || ''}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                            disabled={isLoading}
                            className="w-full font-mono text-xs font-bold text-slate-900"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Rekening Kas / Bank */}
                    <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                            Rekening Kas / Bank
                        </label>
                        <SelectInput
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            disabled={isLoading}
                            className="w-full text-xs"
                        >
                            <option value="">-- Tetap Gunakan Akun Jurnal Awal --</option>
                            {cashBankAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </SelectInput>
                    </div>

                    {/* Metode Pembayaran */}
                    <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                            Metode Pembayaran <span className="text-rose-500">*</span>
                        </label>
                        <SelectInput
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={isLoading}
                            className="w-full text-xs"
                        >
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="Transfer BCA">Transfer BCA</option>
                            <option value="Transfer Mandiri">Transfer Mandiri</option>
                            <option value="Transfer BRI">Transfer BRI</option>
                            <option value="Kas / Tunai">Kas / Tunai</option>
                            <option value="Cek / Giro">Cek / Giro</option>
                            <option value="Lainnya">Lainnya</option>
                        </SelectInput>
                    </div>
                </div>

                {/* No. Referensi */}
                <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                        Nomor Referensi / Bukti Transfer
                    </label>
                    <TextInput
                        type="text"
                        placeholder="Contoh: TRF-20260923-01 / No. Slip"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        disabled={isLoading}
                        className="w-full text-xs"
                    />
                </div>

                {/* Catatan */}
                <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                        Catatan Internal
                    </label>
                    <textarea
                        rows={2}
                        placeholder="Catatan tambahan pembayaran (opsional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 transition-colors focus:border-slate-800 focus:outline-hidden"
                    />
                </div>

                {/* Alasan Koreksi */}
                <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                        Alasan Koreksi / Perubahan
                    </label>
                    <TextInput
                        type="text"
                        placeholder="Contoh: Salah ketik nominal atau ganti rekening kas tujuan"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={isLoading}
                        className="w-full text-xs"
                    />
                </div>

                <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-xs"
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={isLoading}
                        className="text-xs font-bold"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export default EditPaymentSettlementModal;
