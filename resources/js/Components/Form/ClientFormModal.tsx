import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { formatNpwp } from '@/Utils/formatters';
import React, { useEffect, useState } from 'react';

export interface ClientFormData {
    name: string;
    npwp: string;
    email: string;
    phone: string;
    address: string;
    pkp: boolean;
}

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: ClientFormData) => void;
}

export default function ClientFormModal({
    isOpen,
    onClose,
    onSubmit,
}: ClientFormModalProps) {
    const [form, setForm] = useState<ClientFormData>({
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
            setForm({
                name: '',
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
            newErrors.name = 'Nama lengkap client wajib diisi.';
        }

        if (form.npwp.trim()) {
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
        setForm({
            name: '',
            npwp: '',
            email: '',
            phone: '',
            address: '',
            pkp: false,
        });
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
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Daftarkan Client Baru
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Tambahkan profil mitra client pengiklan Yousee
                                Indonesia untuk pembuatan Invoice.
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

                {/* Form Fields Grid */}
                <div className="space-y-4">
                    {/* Grid: Nama & NPWP */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="client-name"
                                value="Nama Lengkap Client *"
                            />
                            <TextInput
                                id="client-name"
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                className="mt-1 block w-full text-xs font-semibold"
                                placeholder="cth: PT Gojek Tokopedia Tbk"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="client-npwp"
                                value="NPWP Resmi Client (Opsional)"
                            />
                            <TextInput
                                id="client-npwp"
                                type="text"
                                value={form.npwp}
                                onChange={(e) => {
                                    const formatted = formatNpwp(e.target.value);
                                    setForm({
                                        ...form,
                                        npwp: formatted,
                                        pkp: formatted.trim().length > 0,
                                    });
                                }}
                                className="mt-1 block w-full font-mono text-xs"
                                placeholder="01.234.567.8-901.000"
                            />
                            <InputError
                                message={errors.npwp}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Grid: Email & No Telp */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="client-email"
                                value="Alamat Email PIC / Finance (Opsional)"
                            />
                            <TextInput
                                id="client-email"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="billing@client.com"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="client-phone"
                                value="No. Telepon / WhatsApp (Opsional)"
                            />
                            <TextInput
                                id="client-phone"
                                type="text"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                                className="mt-1 block w-full text-xs"
                                placeholder="081234567890"
                            />
                        </div>
                    </div>

                    {/* Alamat Kantor */}
                    <div>
                        <InputLabel
                            htmlFor="client-address"
                            value="Alamat Kantor / Domisili Pajak (Opsional)"
                        />
                        <textarea
                            id="client-address"
                            rows={3}
                            value={form.address}
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Jl. Jend. Sudirman Kav. 52-53, SCBD, Jakarta Selatan"
                        />
                    </div>

                    {/* Checkbox PKP */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                                name="pkp"
                                checked={form.pkp}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        pkp: e.target.checked,
                                    })
                                }
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-xs font-bold text-slate-800">
                                    Status Pengusaha Kena Pajak (PKP)
                                </span>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    Centang jika client berstatus PKP dan berhak
                                    diterbitkan Faktur Pajak Keluaran (PPN).
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                        Batal
                    </SecondaryButton>
                    <PrimaryButton
                        type="submit"
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md shadow-blue-600/20 hover:bg-blue-700"
                    >
                        Simpan Client
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
