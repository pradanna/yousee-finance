import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import { formatRupiah } from '@/Utils/formatters';
import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';

export interface CoaPaymentOption {
    id: string;
    code: string;
    name: string;
    friendly_name?: string;
    current_balance?: number;
}

interface TransferCashModalProps {
    show: boolean;
    onClose: () => void;
    paymentAccounts: CoaPaymentOption[];
    fiscalMode: string;
    onTriggerToast: (
        type: 'success' | 'error' | 'warning',
        title: string,
        message: string,
    ) => void;
}

export default function TransferCashModal({
    show,
    onClose,
    paymentAccounts,
    fiscalMode,
    onTriggerToast,
}: TransferCashModalProps) {
    const form = useForm({
        fiscal_mode: fiscalMode || 'ppn',
        from_account_id: paymentAccounts.length > 0 ? paymentAccounts[0].id : '',
        to_account_id: paymentAccounts.length > 1 ? paymentAccounts[1].id : '',
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        description: '',
    });

    // Perbarui pilihan akun awal saat modal dibuka atau list akun berubah
    useEffect(() => {
        if (show && paymentAccounts.length >= 2) {
            if (!form.data.from_account_id || form.data.from_account_id === '') {
                form.setData('from_account_id', paymentAccounts[0].id);
            }
            if (
                !form.data.to_account_id ||
                form.data.to_account_id === '' ||
                form.data.to_account_id === paymentAccounts[0].id
            ) {
                form.setData('to_account_id', paymentAccounts[1].id);
            }
        }
    }, [show, paymentAccounts]);

    const fromAccount = paymentAccounts.find(
        (a) => a.id === form.data.from_account_id,
    );
    const toAccount = paymentAccounts.find(
        (a) => a.id === form.data.to_account_id,
    );

    const availableBalance = fromAccount?.current_balance ?? 0;
    const isAmountExceeded = form.data.amount > availableBalance && availableBalance >= 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.data.from_account_id === form.data.to_account_id) {
            onTriggerToast(
                'error',
                'Rekening Tidak Valid',
                'Rekening sumber dan rekening tujuan tidak boleh sama.',
            );
            return;
        }

        if (form.data.amount <= 0) {
            onTriggerToast(
                'error',
                'Nominal Tidak Valid',
                'Nominal transfer harus lebih besar dari Rp 0.',
            );
            return;
        }

        form.post('/cash-out/transfer', {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                form.reset('amount', 'reference_number', 'description');
                onTriggerToast(
                    'success',
                    'Transfer Kas Berhasil',
                    `Pindah dana senilai ${formatRupiah(form.data.amount)} dari ${fromAccount?.friendly_name || fromAccount?.name} ke ${toAccount?.friendly_name || toAccount?.name} berhasil dibukukan.`,
                );
            },
            onError: (errors) => {
                const msg =
                    errors.transfer_error ||
                    Object.values(errors)[0] ||
                    'Gagal memproses perpindahan dana antar rekening.';
                onTriggerToast('error', 'Gagal Transfer Kas', String(msg));
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={handleSubmit} className="p-6">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Pindah Dana / Transfer Antar Rekening
                            </h3>
                            <p className="text-xs text-slate-500">
                                Mutasi kas internal antar bank/kas tanpa membiaskan arus kas operasional
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    {/* Rekening Sumber (From) */}
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                                Dari Rekening (Sumber Dana){' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            {fromAccount && (
                                <span className="text-[11px] font-semibold text-slate-500">
                                    Saldo:{' '}
                                    <strong className="font-mono text-slate-800">
                                        {formatRupiah(availableBalance)}
                                    </strong>
                                </span>
                            )}
                        </div>
                        <select
                            value={form.data.from_account_id}
                            onChange={(e) =>
                                form.setData('from_account_id', e.target.value)
                            }
                            className="w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            {paymentAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.friendly_name || acc.name} (Saldo:{' '}
                                    {formatRupiah(acc.current_balance ?? 0)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Rekening Tujuan (To) */}
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700">
                                Ke Rekening (Penerima Dana){' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            {toAccount && (
                                <span className="text-[11px] font-semibold text-slate-500">
                                    Saldo Saat Ini:{' '}
                                    <strong className="font-mono text-slate-800">
                                        {formatRupiah(toAccount.current_balance ?? 0)}
                                    </strong>
                                </span>
                            )}
                        </div>
                        <select
                            value={form.data.to_account_id}
                            onChange={(e) =>
                                form.setData('to_account_id', e.target.value)
                            }
                            className="w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            {paymentAccounts.map((acc) => (
                                <option
                                    key={acc.id}
                                    value={acc.id}
                                    disabled={acc.id === form.data.from_account_id}
                                >
                                    {acc.friendly_name || acc.name}{' '}
                                    {acc.id === form.data.from_account_id
                                        ? '(Sumber - Tidak Bisa Dipilih)'
                                        : `(Saldo: ${formatRupiah(acc.current_balance ?? 0)})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tanggal & Nominal */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                Tanggal Transfer <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.data.transaction_date}
                                onChange={(e) =>
                                    form.setData('transaction_date', e.target.value)
                                }
                                className="mt-1 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                Nominal Transfer (Rp) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute left-3 top-2 font-mono text-xs font-bold text-slate-400">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={
                                        form.data.amount
                                            ? Number(form.data.amount).toLocaleString('id-ID')
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const rawVal = e.target.value.replace(/\D/g, '');
                                        form.setData('amount', rawVal ? Number(rawVal) : 0);
                                    }}
                                    className="w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 font-mono text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            {isAmountExceeded && (
                                <p className="mt-1 text-[10.5px] font-bold text-amber-600">
                                    ⚠️ Nominal ({formatRupiah(form.data.amount)}) melebihi saldo kas pengirim ({formatRupiah(availableBalance)})
                                </p>
                            )}
                        </div>
                    </div>

                    {/* No. Referensi / Bukti Transfer */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700">
                            No. Referensi / Bukti Transfer (Opsional)
                        </label>
                        <input
                            type="text"
                            value={form.data.reference_number}
                            onChange={(e) =>
                                form.setData('reference_number', e.target.value)
                            }
                            placeholder="Contoh: REF/2026/BCA-MDR-001 / No. Mutasi Bank"
                            className="mt-1 w-full rounded-xl border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Keterangan / Memo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700">
                            Keterangan / Memo Perpindahan Dana
                        </label>
                        <textarea
                            rows={2}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            placeholder="Contoh: Pengisian Kas Kecil Operasional Kantor dari Bank BCA"
                            className="mt-1 w-full rounded-xl border-slate-200 text-xs font-normal text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={form.processing}
                        className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
                    >
                        {form.processing ? 'Memproses...' : 'Konfirmasi Pindah Dana'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
