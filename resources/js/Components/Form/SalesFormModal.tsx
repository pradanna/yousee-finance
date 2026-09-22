import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useState } from 'react';

export interface SalesFormData {
    name: string;
    email?: string;
    phone: string;
}

interface SalesFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: SalesFormData) => void;
    isSubmitting?: boolean;
}

export default function SalesFormModal({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting = false,
}: SalesFormModalProps) {
    const [form, setForm] = useState<SalesFormData>({
        name: '',
        email: '',
        phone: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap personil sales wajib diisi.';
        }

        if (form.email && form.email.trim() !== '') {
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Daftarkan Personil Sales Baru
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tambahkan data profil Sales Team Yousee Indonesia untuk penugasan proyek & pencatatan komisi.
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
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    {/* Nama Sales */}
                    <div>
                        <InputLabel
                            htmlFor="name"
                            value="Nama Lengkap Personil Sales *"
                        />
                        <TextInput
                            id="name"
                            type="text"
                            placeholder="Contoh: Rian Hidayat"
                            value={form.name}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            className="mt-1.5 block w-full"
                        />
                        {errors.name && <InputError message={errors.name} />}
                    </div>

                    {/* Email Kantor */}
                    <div>
                        <InputLabel
                            htmlFor="email"
                            value="Email Kantor (Opsional)"
                        />
                        <TextInput
                            id="email"
                            type="email"
                            placeholder="contoh: rian.hidayat@youseeads.id"
                            value={form.email}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                            className="mt-1.5 block w-full"
                        />
                        {errors.email && <InputError message={errors.email} />}
                    </div>

                    {/* Telepon / WhatsApp */}
                    <div>
                        <InputLabel
                            htmlFor="phone"
                            value="Nomor Telepon / WhatsApp"
                        />
                        <TextInput
                            id="phone"
                            type="text"
                            placeholder="Contoh: 081211112222"
                            value={form.phone}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                }))
                            }
                            className="mt-1.5 block w-full"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        isLoading={isSubmitting}
                        loadingText="Menyimpan..."
                    >
                        Simpan Personil Sales
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
