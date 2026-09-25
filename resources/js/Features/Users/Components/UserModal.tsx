import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import SelectInput, { SelectOption } from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { UserData, UserFormData } from '@/Features/Users/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

interface UserModalProps {
    show: boolean;
    onClose: () => void;
    user?: UserData | null;
}

const ROLE_OPTIONS: SelectOption[] = [
    { value: 'pimpinan', label: 'Pimpinan / Owner' },
    { value: 'admin', label: 'Administrator' },
    { value: 'akuntan', label: 'Akuntan / Finance' },
    { value: 'staff', label: 'Staff Operasional' },
];

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
];

export default function UserModal({ show, onClose, user }: UserModalProps) {
    const isEditMode = Boolean(user);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserFormData>({
            name: '',
            email: '',
            role: 'staff',
            status: 'active',
            password: '',
            password_confirmation: '',
        });

    useEffect(() => {
        if (user) {
            setData({
                name: user.name,
                email: user.email,
                role: user.role || 'staff',
                status: user.status || 'active',
                password: '',
                password_confirmation: '',
            });
        } else {
            setData({
                name: '',
                email: '',
                role: 'staff',
                status: 'active',
                password: '',
                password_confirmation: '',
            });
        }
        clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [user, show]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditMode && user) {
            put(route('users.update', user.id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('users.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="xl">
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            {isEditMode ? (
                                <svg
                                    className="h-5 w-5"
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
                            ) : (
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                    />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {isEditMode
                                    ? 'Ubah Data Pengguna'
                                    : 'Tambah Pengguna Baru'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isEditMode
                                    ? 'Perbarui rincian pengguna dan hak akses'
                                    : 'Daftarkan pengguna baru ke sistem Yousee Finance'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg
                            className="h-5 w-5"
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

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Nama Lengkap */}
                        <div className="sm:col-span-2">
                            <InputLabel
                                htmlFor="name"
                                value="Nama Lengkap"
                                className="text-xs font-bold text-slate-700"
                            />
                            <TextInput
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Contoh: Budi Santoso"
                                className="mt-1 w-full rounded-xl border-slate-200 bg-white text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        {/* Email */}
                        <div className="sm:col-span-2">
                            <InputLabel
                                htmlFor="email"
                                value="Alamat Email"
                                className="text-xs font-bold text-slate-700"
                            />
                            <TextInput
                                id="email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="nama@yousee.co.id"
                                className="mt-1 w-full rounded-xl border-slate-200 bg-white text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                required
                            />
                            <InputError
                                message={errors.email}
                                className="mt-1"
                            />
                        </div>

                        {/* Hak Akses / Peran */}
                        <div>
                            <InputLabel
                                htmlFor="role"
                                value="Peran / Hak Akses"
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="mt-1">
                                <SelectInput
                                    id="role"
                                    value={data.role}
                                    options={ROLE_OPTIONS}
                                    onChange={(e) =>
                                        setData('role', e.target.value)
                                    }
                                />
                            </div>
                            <InputError
                                message={errors.role}
                                className="mt-1"
                            />
                        </div>

                        {/* Status Akun */}
                        <div>
                            <InputLabel
                                htmlFor="status"
                                value="Status Akun"
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="mt-1">
                                <SelectInput
                                    id="status"
                                    value={data.status}
                                    options={STATUS_OPTIONS}
                                    onChange={(e) =>
                                        setData('status', e.target.value)
                                    }
                                />
                            </div>
                            <InputError
                                message={errors.status}
                                className="mt-1"
                            />
                        </div>

                        {/* Kata Sandi */}
                        <div>
                            <InputLabel
                                htmlFor="password"
                                value={
                                    isEditMode
                                        ? 'Kata Sandi Baru (Opsional)'
                                        : 'Kata Sandi'
                                }
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="relative mt-1">
                                <TextInput
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password || ''}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder={
                                        isEditMode
                                            ? 'Kosongkan jika tidak diubah'
                                            : 'Min. 8 karakter'
                                    }
                                    className="w-full rounded-xl border-slate-200 bg-white pr-10 text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                    required={!isEditMode}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? (
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
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                                            />
                                        </svg>
                                    ) : (
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
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>

                        {/* Konfirmasi Kata Sandi */}
                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value={
                                    isEditMode
                                        ? 'Konfirmasi Kata Sandi Baru'
                                        : 'Konfirmasi Kata Sandi'
                                }
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="relative mt-1">
                                <TextInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={data.password_confirmation || ''}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ulangi kata sandi"
                                    className="w-full rounded-xl border-slate-200 bg-white pr-10 text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                    required={
                                        !isEditMode || Boolean(data.password)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? (
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
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                                            />
                                        </svg>
                                    ) : (
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
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                        <SecondaryButton
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="gap-2"
                        >
                            {processing ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : isEditMode ? (
                                'Simpan Perubahan'
                            ) : (
                                'Tambah Pengguna'
                            )}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
