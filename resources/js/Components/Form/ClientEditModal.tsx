import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Checkbox from '@/Components/Form/Checkbox';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { formatNpwp } from '@/Utils/formatters';
import React, { useEffect, useState } from 'react';

export interface ClientItem {
    id: string | number;
    name: string;
    npwp?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    pkp: boolean;
    status: 'active' | 'archived';
    count: number;
    total: number | string;
    created_at?: string;
    updated_at?: string;
}

interface ClientEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ClientItem | null;
    onSubmit: (updatedClient: ClientItem) => void;
}

export default function ClientEditModal({
    isOpen,
    onClose,
    client,
    onSubmit,
}: ClientEditModalProps) {
    const [form, setForm] = useState<ClientItem>({
        id: '',
        name: '',
        npwp: '',
        email: '',
        phone: '',
        address: '',
        pkp: false,
        status: 'active',
        count: 0,
        total: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (client && isOpen) {
            setForm({
                id: client.id,
                name: client.name || '',
                npwp: client.npwp || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                pkp: Boolean(client.pkp || (client.npwp && client.npwp.trim().length > 0)),
                status: client.status || 'active',
                count: client.count || 0,
                total: client.total || 0,
            });
            setErrors({});
        }
    }, [client, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Nama lengkap client wajib diisi.';
        }

        if (form.npwp && form.npwp.trim()) {
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-800">
                                Edit Profil Client
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Perbarui informasi kontak atau legalitas client mitra Yousee Indonesia.
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
                                htmlFor="edit-client-name"
                                value="Nama Lengkap Client *"
                            />
                            <TextInput
                                id="edit-client-name"
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
                                htmlFor="edit-client-npwp"
                                value="NPWP Resmi Client"
                            />
                            <TextInput
                                id="edit-client-npwp"
                                type="text"
                                value={form.npwp || ''}
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
                                htmlFor="edit-client-email"
                                value="Alamat Email PIC / Finance"
                            />
                            <TextInput
                                id="edit-client-email"
                                type="email"
                                value={form.email || ''}
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
                                htmlFor="edit-client-phone"
                                value="No. Telepon / WhatsApp"
                            />
                            <TextInput
                                id="edit-client-phone"
                                type="text"
                                value={form.phone || ''}
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
                            htmlFor="edit-client-address"
                            value="Alamat Kantor / Domisili Pajak"
                        />
                        <textarea
                            id="edit-client-address"
                            rows={3}
                            value={form.address || ''}
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
                        Simpan Perubahan
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
