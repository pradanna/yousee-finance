import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useState } from 'react';

export interface SalesFormData {
    name: string;
    email: string;
    phone: string;
    commissionRate: number;
}

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: SalesFormData) => void;
}

export default function SalesFormModal({
    isOpen,
    onClose,
    onSubmit,
}: SalesFormModalProps) {
    const [form, setForm] = useState<SalesFormData>({
        name: '',
        email: '',
        phone: '',
        commissionRate: 2.0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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
        setForm({ name: '', email: '', phone: '', commissionRate: 2.0 });
        setErrors({});
        onClose();
    };

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
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Daftarkan Sales Executive Baru
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tambahkan profil tim sales marketing billboard
                                Yousee Indonesia untuk perhitungan komisi omset.
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
                    {/* Nama Sales Executive */}
                    <div>
                        <InputLabel
                            htmlFor="sales-name"
                            value="Nama Lengkap Sales Executive *"
                        />
                        <TextInput
                            id="sales-name"
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="mt-1 block w-full text-xs font-semibold"
                            placeholder="Contoh: Rian Hidayat"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* Grid: Email & Telepon */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="sales-email"
                                value="Email Perusahaan / Pribadi"
                            />
                            <TextInput
                                id="sales-email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="rian@youseeads.id"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="sales-phone"
                                value="Telepon / WhatsApp"
                            />
                            <TextInput
                                id="sales-phone"
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

                    {/* Persentase Rate Komisi */}
                    <div>
                        <InputLabel
                            htmlFor="sales-commission-rate"
                            value="Persentase Rate Komisi (%)"
                        />
                        <TextInput
                            id="sales-commission-rate"
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
                        <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                            Nilai default adalah 2.0% dari total nominal deal
                            penawaran yang dibayarkan.
                        </span>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit">
                        Simpan Sales Executive
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
