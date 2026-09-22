import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { formatNpwp } from '@/Utils/formatters';
import React, { useEffect, useState } from 'react';

export interface VendorItem {
    id: string | number;
    code?: string;
    name: string;
    pic?: string | null;
    npwp: string | null;
    email?: string;
    phone?: string;
    address?: string;
    pkp: boolean;
    status: 'active' | 'archived';
    count: number;
    total: number | string;
    is_archived?: boolean;
    created_at?: string;
    updated_at?: string;
}

interface VendorEditModalProps {
    isOpen: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    vendor: VendorItem | null;
    onSubmit: (updatedVendor: VendorItem) => void;
}

export default function VendorEditModal({
    isOpen,
    isSubmitting = false,
    onClose,
    vendor,
    onSubmit,
}: VendorEditModalProps) {
    const [form, setForm] = useState<VendorItem>({
        id: '',
        code: '',
        name: '',
        pic: '',
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
            setForm({
                id: vendor.id,
                code: vendor.code ?? '',
                name: vendor.name,
                pic: vendor.pic ?? '',
                npwp: vendor.npwp ?? '',
                email: vendor.email ?? '',
                phone: vendor.phone ?? '',
                address: vendor.address ?? '',
                pkp: vendor.pkp,
                status: vendor.status,
                count: vendor.count,
                total: vendor.total,
            });
            setErrors({});
        }
    }, [vendor, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap vendor wajib diisi.';
        }

        if (form.pkp) {
            if (!form.npwp || !form.npwp.trim()) {
                newErrors.npwp = 'NPWP wajib diisi jika vendor berstatus PKP.';
            } else {
                const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
                if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                    newErrors.npwp =
                        'Format NPWP tidak valid. Harus 15 atau 16 digit angka.';
                }
            }
        } else if (form.npwp && form.npwp.trim()) {
            const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
            if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                newErrors.npwp =
                    'Format NPWP tidak valid. Harus 15 atau 16 digit angka.';
            }
        }

        if (form.email && form.email.trim()) {
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
                                Edit Data Vendor
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Perbarui profil dan informasi kontak mitra
                                vendor
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
                    {/* Grid: Kode Vendor & PIC */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-code"
                                value="Kode Vendor"
                            />
                            <TextInput
                                id="edit-vendor-code"
                                type="text"
                                value={form.code ?? ''}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        code: e.target.value.toUpperCase(),
                                    })
                                }
                                className="mt-1 block w-full font-mono text-xs uppercase"
                                placeholder="cth: VND-0001"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                                Kode unik vendor untuk identifikasi impor titik
                                / PO.
                            </p>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-pic"
                                value="PIC / Kontak Person"
                            />
                            <TextInput
                                id="edit-vendor-pic"
                                type="text"
                                value={form.pic ?? ''}
                                onChange={(e) =>
                                    setForm({ ...form, pic: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="cth: Bpk. Hendra Gunawan"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                                Nama orang yang bertanggung jawab / kontak
                                vendor.
                            </p>
                        </div>
                    </div>

                    {/* Grid: Nama & NPWP */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-name"
                                value="Nama Lengkap Vendor *"
                            />
                            <TextInput
                                id="edit-vendor-name"
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="mt-1 block w-full text-xs font-semibold"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-npwp"
                                value={
                                    form.pkp
                                        ? 'NPWP Resmi Vendor * (Wajib untuk PKP)'
                                        : 'NPWP Resmi Vendor'
                                }
                            />
                            <TextInput
                                id="edit-vendor-npwp"
                                type="text"
                                value={form.npwp ?? ''}
                                onChange={(e) => {
                                    const formatted = formatNpwp(
                                        e.target.value,
                                    );
                                    setForm((prev) => ({
                                        ...prev,
                                        npwp: formatted,
                                        pkp:
                                            formatted.trim().length > 0
                                                ? true
                                                : prev.pkp,
                                    }));
                                    if (errors.npwp) {
                                        setErrors((prev) => {
                                            const copy = { ...prev };
                                            delete copy.npwp;
                                            return copy;
                                        });
                                    }
                                }}
                                className={`mt-1 block w-full font-mono text-xs ${
                                    form.pkp && !form.npwp?.trim()
                                        ? 'border-amber-300 bg-amber-50/20'
                                        : ''
                                }`}
                                placeholder="01.234.567.8-901.000"
                            />
                            {form.pkp && !form.npwp?.trim() && !errors.npwp && (
                                <p className="mt-1 text-[10px] font-medium text-amber-600">
                                    ⚠️ Vendor ditandai PKP: Wajib mengisi NPWP
                                    resmi 15/16 digit.
                                </p>
                            )}
                            <InputError
                                message={errors.npwp}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Grid: Email & Telepon */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-email"
                                value="Email Kontak"
                            />
                            <TextInput
                                id="edit-vendor-email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="sales@vendor.com"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit-vendor-phone"
                                value="Telepon / WhatsApp"
                            />
                            <TextInput
                                id="edit-vendor-phone"
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

                    {/* Alamat Lengkap */}
                    <div>
                        <InputLabel
                            htmlFor="edit-vendor-address"
                            value="Alamat Lengkap"
                        />
                        <textarea
                            id="edit-vendor-address"
                            value={form.address}
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            className="focus:ring-primary/20 mt-1 block h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all focus:border-primary focus:outline-none focus:ring-2"
                            placeholder="Masukkan alamat lengkap..."
                        />
                    </div>

                    {/* Bottom Status Toggles Section */}
                    <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                        {/* Status Usaha Toggle Switch Card */}
                        <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="space-y-1">
                                <span className="block text-xs font-bold text-slate-700">
                                    Status Usaha Vendor
                                </span>
                                <span className="block text-[10px] font-semibold leading-tight text-slate-400">
                                    {isVendorActive
                                        ? 'Vendor Aktif & dapat bertransaksi PO'
                                        : 'Vendor Diarsipkan (Non-aktif)'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        status: isVendorActive
                                            ? 'archived'
                                            : 'active',
                                    })
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isVendorActive
                                        ? 'bg-primary'
                                        : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        isVendorActive
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* PKP Checkbox Card */}
                        <div
                            className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                                form.pkp && !form.npwp?.trim()
                                    ? 'border-amber-200 bg-amber-50/50'
                                    : 'border-slate-100 bg-slate-50'
                            }`}
                        >
                            <Checkbox
                                id="edit-pkp-checkbox"
                                checked={form.pkp}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setForm((prev) => ({
                                        ...prev,
                                        pkp: checked,
                                    }));
                                    if (
                                        !checked &&
                                        errors.npwp?.includes('wajib')
                                    ) {
                                        setErrors((prev) => {
                                            const copy = { ...prev };
                                            delete copy.npwp;
                                            return copy;
                                        });
                                    }
                                }}
                                className="mt-0.5"
                            />
                            <div className="space-y-0.5">
                                <label
                                    htmlFor="edit-pkp-checkbox"
                                    className="block cursor-pointer text-xs font-bold text-slate-700"
                                >
                                    Status PKP (Bisa PPN)
                                </label>
                                <span className="block text-[10px] font-semibold leading-tight text-slate-400">
                                    Centang jika menerbitkan Faktur Pajak PPN
                                    (11%). Wajib melampirkan NPWP resmi.
                                </span>
                                {form.pkp && !form.npwp?.trim() && (
                                    <span className="block pt-0.5 text-[10px] font-bold text-amber-600">
                                        ⚠️ NPWP wajib diisi pada kolom di atas
                                        jika opsi ini dicentang.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="disabled:opacity-50"
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        loadingText="Menyimpan..."
                    >
                        Simpan Perubahan
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
