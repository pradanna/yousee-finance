import React, { useState } from 'react';
import Modal from '@/Components/UI/Modal';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import InputError from '@/Components/Form/InputError';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';

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

export default function SalesFormModal({ isOpen, onClose, onSubmit }: SalesFormModalProps) {
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
        <Modal show={isOpen} onClose={onClose} maxWidth="xl" closeable={false}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Daftarkan Sales Executive Baru</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tambahkan profil tim sales marketing billboard Yousee Indonesia untuk perhitungan komisi omset.
                        </p>
                    </div>
                </div>

                {/* Form Fields Grid */}
                <div className="space-y-4">
                    {/* Nama Sales Executive */}
                    <div>
                        <InputLabel htmlFor="sales-name" value="Nama Lengkap Sales Executive *" />
                        <TextInput
                            id="sales-name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="mt-1 block w-full text-xs font-semibold"
                            placeholder="Contoh: Rian Hidayat"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* Grid: Email & Telepon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="sales-email" value="Email Perusahaan / Pribadi" />
                            <TextInput
                                id="sales-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="rian@youseeads.id"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sales-phone" value="Telepon / WhatsApp" />
                            <TextInput
                                id="sales-phone"
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="0812-xxxx-xxxx"
                            />
                        </div>
                    </div>

                    {/* Persentase Rate Komisi */}
                    <div>
                        <InputLabel htmlFor="sales-commission-rate" value="Persentase Rate Komisi (%)" />
                        <TextInput
                            id="sales-commission-rate"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={form.commissionRate}
                            onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })}
                            className="mt-1 block w-full text-xs font-mono font-bold text-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                            Nilai default adalah 2.0% dari total nominal deal penawaran yang dibayarkan.
                        </span>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
