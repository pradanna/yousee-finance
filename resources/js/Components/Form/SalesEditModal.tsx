import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export interface SalesItem {
    id: number;
    name: string;
    email: string;
    phone: string;
    commissionRate: number;
    status: 'active' | 'archived';
    achieved: string;
    achievedVal: number;
    commission: string;
    dealsCount: number;
}

interface SalesEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    sales: SalesItem | null;
    onSubmit: (updatedSales: SalesItem) => void;
}

export default function SalesEditModal({
    isOpen,
    onClose,
    sales,
    onSubmit,
}: SalesEditModalProps) {
    const [form, setForm] = useState<SalesItem>({
        id: 0,
        name: '',
        email: '',
        phone: '',
        commissionRate: 2.0,
        status: 'active',
        achieved: 'Rp 0',
        achievedVal: 0,
        commission: 'Rp 0',
        dealsCount: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (sales && isOpen) {
            setForm({ ...sales });
            setErrors({});
        }
    }, [sales, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap sales executive wajib diisi.';
        }

        if (form.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.email)) {
                newErrors.email = 'Format email tidak valid.';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(form);
        onClose();
    };

    if (!sales) return null;

    const isSalesActive = form.status === 'active';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.5L16.732 3.732z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Edit Data Sales Executive
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Ubah rincian profil & komisi insentif sales{' '}
                                <span className="font-bold text-slate-700">
                                    {sales.name}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent bg-slate-50 text-slate-500 transition-all hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form Fields Grid */}
                <div className="space-y-4">
                    {/* Nama Sales */}
                    <div>
                        <InputLabel
                            htmlFor="edit-sales-name"
                            value="Nama Lengkap Sales Executive *"
                        />
                        <TextInput
                            id="edit-sales-name"
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="mt-1 block w-full text-xs font-semibold"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* Grid: Email & Telepon */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="edit-sales-email"
                                value="Email Perusahaan / Pribadi"
                            />
                            <TextInput
                                id="edit-sales-email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="sales@youseeads.id"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-sales-phone"
                                value="Telepon / WhatsApp"
                            />
                            <TextInput
                                id="edit-sales-phone"
                                type="text"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="0812-xxxx-xxxx"
                            />
                        </div>
                    </div>

                    {/* Rate Komisi & Status Switch Grid */}
                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        {/* Rate Komisi */}
                        <div>
                            <InputLabel
                                htmlFor="edit-sales-rate"
                                value="Rate Komisi (%)"
                            />
                            <TextInput
                                id="edit-sales-rate"
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                value={form.commissionRate}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        commissionRate:
                                            parseFloat(e.target.value) || 0,
                                    })
                                }
                                className="mt-1 block w-full font-mono text-xs font-bold text-slate-800"
                            />
                        </div>

                        {/* Status Sales Toggle Switch Card */}
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                            <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-slate-700">
                                    Status Sales
                                </span>
                                <span className="block text-[10px] font-semibold leading-tight text-slate-400">
                                    {isSalesActive
                                        ? 'Aktif & Menerima Deals'
                                        : 'Diarsipkan (Non-aktif)'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        status: isSalesActive
                                            ? 'archived'
                                            : 'active',
                                    })
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isSalesActive
                                        ? 'bg-primary'
                                        : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isSalesActive
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit">
                        Simpan Perubahan
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
