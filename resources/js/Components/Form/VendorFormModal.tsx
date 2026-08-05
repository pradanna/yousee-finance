import React, { useState, useEffect } from 'react';
import Modal from '@/Components/UI/Modal';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';

export interface VendorFormData {
    name: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    pkp: boolean;
}

interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: VendorFormData) => void;
}

export default function VendorFormModal({ isOpen, onClose, onSubmit }: VendorFormModalProps) {
    const [form, setForm] = useState<VendorFormData>({
        name: '',
        npwp: '',
        email: '',
        phone: '',
        address: '',
        pkp: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setForm({ name: '', npwp: '', email: '', phone: '', address: '', pkp: false });
            setErrors({});
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap vendor wajib diisi.';
        }

        if (form.npwp.trim()) {
            const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
            if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                newErrors.npwp = 'Format NPWP tidak valid. Harus 15 atau 16 digit angka.';
            }
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

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl" closeable={false}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Daftarkan Vendor Baru</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Lengkapi profil mitra vendor untuk keperluan transaksi Purchase Order (PO)
                        </p>
                    </div>
                </div>

                {/* Form Fields Grid */}
                <div className="space-y-4">
                    {/* Grid: Nama & NPWP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="vendor-name" value="Nama Lengkap Vendor *" />
                            <TextInput
                                id="vendor-name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="mt-1 block w-full text-xs font-semibold"
                                placeholder="cth: PT. Megah Billboard Jaya"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="vendor-npwp" value="NPWP Resmi Vendor (Opsional)" />
                            <TextInput
                                id="vendor-npwp"
                                type="text"
                                value={form.npwp}
                                onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                                className="mt-1 block w-full text-xs font-mono"
                                placeholder="01.234.567.8-901.000"
                            />
                            <InputError message={errors.npwp} className="mt-1" />
                        </div>
                    </div>

                    {/* Grid: Email & Telepon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="vendor-email" value="Email Kontak (Opsional)" />
                            <TextInput
                                id="vendor-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="sales@vendor.com"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="vendor-phone" value="Telepon / WhatsApp (Opsional)" />
                            <TextInput
                                id="vendor-phone"
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="0812-xxxx-xxxx"
                            />
                        </div>
                    </div>

                    {/* Alamat */}
                    <div>
                        <InputLabel htmlFor="vendor-address" value="Alamat Lengkap (Opsional)" />
                        <textarea
                            id="vendor-address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                            placeholder="Masukkan alamat kantor / workshop vendor..."
                        />
                    </div>

                    {/* PKP Checkbox Card */}
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Checkbox
                            id="pkp-checkbox"
                            checked={form.pkp}
                            onChange={(e) => setForm({ ...form, pkp: e.target.checked })}
                            className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                            <label htmlFor="pkp-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer block">
                                Status Pengusaha Kena Pajak (PKP)
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                                Centang jika vendor menerbitkan Faktur Pajak PPN Masukan (11%) resmi.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <SecondaryButton type="button" onClick={onClose}>
                        Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit">
                        Simpan Vendor
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
