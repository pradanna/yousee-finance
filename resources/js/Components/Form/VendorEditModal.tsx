import React, { useState, useEffect } from 'react';
import Modal from '@/Components/UI/Modal';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';

export interface VendorItem {
    id: number;
    name: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    pkp: boolean;
    status: 'active' | 'archived';
    count: number;
    total: string;
}

interface VendorEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendor: VendorItem | null;
    onSubmit: (updatedVendor: VendorItem) => void;
}

export default function VendorEditModal({ isOpen, onClose, vendor, onSubmit }: VendorEditModalProps) {
    const [form, setForm] = useState<VendorItem>({
        id: 0,
        name: '',
        npwp: '',
        email: '',
        phone: '',
        address: '',
        pkp: false,
        status: 'active',
        count: 0,
        total: 'IDR 0',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (vendor && isOpen) {
            setForm({ ...vendor });
            setErrors({});
        }
    }, [vendor, isOpen]);

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

    if (!vendor) return null;

    const isVendorActive = form.status === 'active';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="xl" closeable={false}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.5L16.732 3.732z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight">Edit Data Vendor</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ubah rincian profil & status perpajakan vendor <span className="font-bold text-slate-700">{vendor.name}</span>
                        </p>
                    </div>
                </div>

                {/* Form Fields Grid */}
                <div className="space-y-4">
                    {/* Grid: Nama & NPWP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="edit-vendor-name" value="Nama Lengkap Vendor *" />
                            <TextInput
                                id="edit-vendor-name"
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="mt-1 block w-full text-xs font-semibold"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-vendor-npwp" value="NPWP Resmi Vendor" />
                            <TextInput
                                id="edit-vendor-npwp"
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
                            <InputLabel htmlFor="edit-vendor-email" value="Email Kontak" />
                            <TextInput
                                id="edit-vendor-email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="sales@vendor.com"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit-vendor-phone" value="Telepon / WhatsApp" />
                            <TextInput
                                id="edit-vendor-phone"
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="mt-1 block w-full text-xs"
                                placeholder="0812-xxxx-xxxx"
                            />
                        </div>
                    </div>

                    {/* Alamat Lengkap */}
                    <div>
                        <InputLabel htmlFor="edit-vendor-address" value="Alamat Lengkap" />
                        <textarea
                            id="edit-vendor-address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="mt-1 block w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-20 resize-none"
                            placeholder="Masukkan alamat lengkap..."
                        />
                    </div>

                    {/* Bottom Status Toggles Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Status Usaha Toggle Switch Card */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-slate-700 block">Status Usaha Vendor</span>
                                <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                                    {isVendorActive
                                        ? 'Vendor Aktif & dapat bertransaksi PO'
                                        : 'Vendor Diarsipkan (Non-aktif)'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, status: isVendorActive ? 'archived' : 'active' })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isVendorActive ? 'bg-primary' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isVendorActive ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* PKP Checkbox Card */}
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Checkbox
                                id="edit-pkp-checkbox"
                                checked={form.pkp}
                                onChange={(e) => setForm({ ...form, pkp: e.target.checked })}
                                className="mt-0.5"
                            />
                            <div className="space-y-0.5">
                                <label htmlFor="edit-pkp-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer block">
                                    Status PKP (Bisa PPN)
                                </label>
                                <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                                    Centang jika menerbitkan Faktur Pajak PPN (11%).
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
