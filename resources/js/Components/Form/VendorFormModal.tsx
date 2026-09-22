import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { formatNpwp } from '@/Utils/formatters';
import React, { useEffect, useState } from 'react';

export interface VendorFormData {
    code?: string;
    name: string;
    pic?: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    pkp: boolean;
}

interface VendorFormModalProps {
    isOpen: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (data: VendorFormData) => void;
}

export default function VendorFormModal({
    isOpen,
    isSubmitting = false,
    onClose,
    onSubmit,
}: VendorFormModalProps) {
    const [form, setForm] = useState<VendorFormData>({
        code: '',
        name: '',
        pic: '',
        npwp: '',
        email: '',
        phone: '',
        address: '',
        pkp: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setForm({
                code: '',
                name: '',
                pic: '',
                npwp: '',
                email: '',
                phone: '',
                address: '',
                pkp: false,
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap vendor wajib diisi.';
        }

        if (form.pkp) {
            if (!form.npwp.trim()) {
                newErrors.npwp = 'NPWP wajib diisi jika vendor berstatus PKP.';
            } else {
                const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
                if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                    newErrors.npwp =
                        'Format NPWP tidak valid. Harus 15 atau 16 digit angka.';
                }
            }
        } else if (form.npwp.trim()) {
            const cleanNpwp = form.npwp.replace(/[^0-9]/g, '');
            if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
                newErrors.npwp =
                    'Format NPWP tidak valid. Harus 15 atau 16 digit angka.';
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
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Daftarkan Vendor Baru
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Lengkapi profil mitra vendor untuk keperluan
                                transaksi Purchase Order (PO)
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
                                htmlFor="vendor-code"
                                value="Kode Vendor (Opsional)"
                            />
                            <TextInput
                                id="vendor-code"
                                type="text"
                                value={form.code}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        code: e.target.value.toUpperCase(),
                                    })
                                }
                                className="mt-1 block w-full font-mono text-xs uppercase"
                                placeholder="cth: VND-0001 (Auto jika kosong)"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                                Kode unik vendor untuk identifikasi impor titik
                                / PO.
                            </p>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="vendor-pic"
                                value="PIC / Kontak Person (Opsional)"
                            />
                            <TextInput
                                id="vendor-pic"
                                type="text"
                                value={form.pic}
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
                                htmlFor="vendor-name"
                                value="Nama Lengkap Vendor *"
                            />
                            <TextInput
                                id="vendor-name"
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="mt-1 block w-full text-xs font-semibold"
                                placeholder="cth: PT. Megah Billboard Jaya"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="vendor-npwp"
                                value={
                                    form.pkp
                                        ? 'NPWP Resmi Vendor * (Wajib untuk PKP)'
                                        : 'NPWP Resmi Vendor (Opsional)'
                                }
                            />
                            <TextInput
                                id="vendor-npwp"
                                type="text"
                                value={form.npwp}
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
                                    form.pkp && !form.npwp.trim()
                                        ? 'border-amber-300 bg-amber-50/20'
                                        : ''
                                }`}
                                placeholder="01.234.567.8-901.000"
                            />
                            {form.pkp && !form.npwp.trim() && !errors.npwp && (
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
                                htmlFor="vendor-email"
                                value="Email Kontak (Opsional)"
                            />
                            <TextInput
                                id="vendor-email"
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
                                htmlFor="vendor-phone"
                                value="Telepon / WhatsApp (Opsional)"
                            />
                            <TextInput
                                id="vendor-phone"
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

                    {/* Alamat */}
                    <div>
                        <InputLabel
                            htmlFor="vendor-address"
                            value="Alamat Lengkap (Opsional)"
                        />
                        <textarea
                            id="vendor-address"
                            value={form.address}
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            className="focus:ring-primary/20 mt-1 block h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all focus:border-primary focus:outline-none focus:ring-2"
                            placeholder="Masukkan alamat kantor / workshop vendor..."
                        />
                    </div>

                    {/* PKP Checkbox Card */}
                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                            form.pkp && !form.npwp.trim()
                                ? 'border-amber-200 bg-amber-50/50'
                                : 'border-slate-100 bg-slate-50'
                        }`}
                    >
                        <Checkbox
                            id="pkp-checkbox"
                            checked={form.pkp}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setForm((prev) => ({ ...prev, pkp: checked }));
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
                                htmlFor="pkp-checkbox"
                                className="block cursor-pointer text-xs font-bold text-slate-700"
                            >
                                Status Pengusaha Kena Pajak (PKP)
                            </label>
                            <span className="block text-[10px] font-semibold leading-tight text-slate-400">
                                Centang jika vendor menerbitkan Faktur Pajak PPN
                                Masukan (11%) resmi. Wajib melampirkan NPWP
                                resmi.
                            </span>
                            {form.pkp && !form.npwp.trim() && (
                                <span className="block pt-0.5 text-[10px] font-bold text-amber-600">
                                    ⚠️ NPWP wajib diisi pada kolom di atas jika
                                    opsi ini dicentang.
                                </span>
                            )}
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
                        Simpan Vendor
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
