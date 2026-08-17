import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import React, { useEffect, useState } from 'react';

export interface SalesItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    commission_rate: number;
    is_archived: boolean;
    status: 'active' | 'archived';
    projects_count?: number;
    created_at?: string;
    updated_at?: string;
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
        id: '',
        name: '',
        email: '',
        phone: '',
        commission_rate: 2.0,
        is_archived: false,
        status: 'active',
        projects_count: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (sales && isOpen) {
            setForm({
                ...sales,
                phone: sales.phone || '',
                commission_rate: sales.commission_rate ?? 2.0,
            });
            setErrors({});
        }
    }, [sales, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap personil sales wajib diisi.';
        }

        if (!form.email.trim()) {
            newErrors.email = 'Email resmi kantor wajib diisi.';
        } else {
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
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.03H3v-3.5L16.732 3.732z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Edit Profil Sales Executive
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Perbarui data personil sales, nomor kontak, atau persentase rate komisi.
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
                            htmlFor="edit_name"
                            value="Nama Lengkap Personil Sales *"
                        />
                        <TextInput
                            id="edit_name"
                            type="text"
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
                            htmlFor="edit_email"
                            value="Email Resmi Kantor *"
                        />
                        <TextInput
                            id="edit_email"
                            type="email"
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
                            htmlFor="edit_phone"
                            value="Nomor Telepon / WhatsApp"
                        />
                        <TextInput
                            id="edit_phone"
                            type="text"
                            placeholder="Contoh: 081211112222"
                            value={form.phone || ''}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                }))
                            }
                            className="mt-1.5 block w-full"
                        />
                    </div>

                    {/* Komisi Rate (%) */}
                    <div>
                        <InputLabel
                            htmlFor="edit_commission_rate"
                            value="Standard Komisi Sales (%) *"
                        />
                        <div className="relative mt-1.5">
                            <TextInput
                                id="edit_commission_rate"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={form.commission_rate}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        commission_rate: parseFloat(e.target.value) || 0,
                                    }))
                                }
                                className="block w-full pr-10"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 font-mono text-xs font-bold text-slate-400">
                                %
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
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
