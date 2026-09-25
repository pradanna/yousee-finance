import PrimaryButton from '@/Components/Button/PrimaryButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import InputError from '@/Components/Form/InputError';
import InputLabel from '@/Components/Form/InputLabel';
import TextInput from '@/Components/Form/TextInput';
import Modal from '@/Components/UI/Modal';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface AccountUser {
    id?: string | number;
    name?: string;
    email?: string;
    roles?: string[];
}

interface AccountModalProps {
    show: boolean;
    onClose: () => void;
    user?: AccountUser | null;
}

export default function AccountModal({
    show,
    onClose,
    user,
}: AccountModalProps) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const getRoleName = (roles?: string[]): string => {
        if (!roles || roles.length === 0) return 'Pengguna';
        const role = roles[0].toLowerCase();
        switch (role) {
            case 'pimpinan':
                return 'Pimpinan / Owner';
            case 'admin':
                return 'Administrator';
            case 'akuntan':
                return 'Akuntan / Finance';
            case 'staff':
                return 'Staff Operasional';
            default:
                return role.toUpperCase();
        }
    };

    const handlePasswordSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                }
                if (formErrors.current_password) {
                    reset('current_password');
                }
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <div className="flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Pengaturan Akun
                            </h3>
                            <p className="text-xs text-slate-500">
                                Informasi akun dan perbarui kata sandi Anda
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

                <div className="space-y-6 p-6">
                    {/* User Card Summary */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                        <div className="shadow-xs flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white">
                            {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-slate-900">
                                {user?.name || 'User'}
                            </h4>
                            <p className="truncate text-xs font-medium text-slate-500">
                                {user?.email || '-'}
                            </p>
                        </div>
                        <span className="inline-flex items-center rounded-xl bg-blue-100/80 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {getRoleName(user?.roles)}
                        </span>
                    </div>

                    {/* Notification Alert */}
                    {recentlySuccessful && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                            <svg
                                className="h-4 w-4 shrink-0 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Kata sandi berhasil diperbarui!
                        </div>
                    )}

                    {/* Change Password Form */}
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Ganti Kata Sandi
                            </h4>
                            <p className="text-[11px] text-slate-400">
                                Pastikan kata sandi baru Anda minimal 8 karakter
                            </p>
                        </div>

                        {/* Current Password */}
                        <div>
                            <InputLabel
                                htmlFor="current_password"
                                value="Kata Sandi Saat Ini"
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="relative mt-1">
                                <TextInput
                                    id="current_password"
                                    name="current_password"
                                    type={
                                        showCurrentPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={data.current_password}
                                    onChange={(e) =>
                                        setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Masukkan kata sandi saat ini"
                                    className="w-full rounded-xl border-slate-200 bg-white pr-10 text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrentPassword(
                                            !showCurrentPassword,
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showCurrentPassword ? (
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
                                message={errors.current_password}
                                className="mt-1"
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <InputLabel
                                htmlFor="password"
                                value="Kata Sandi Baru"
                                className="text-xs font-bold text-slate-700"
                            />
                            <div className="relative mt-1">
                                <TextInput
                                    id="password"
                                    name="password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="Masukkan kata sandi baru (min. 8 karakter)"
                                    className="w-full rounded-xl border-slate-200 bg-white pr-10 text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNewPassword ? (
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

                        {/* Password Confirmation */}
                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Konfirmasi Kata Sandi Baru"
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
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full rounded-xl border-slate-200 bg-white pr-10 text-xs text-slate-800 focus:border-blue-600 focus:ring-blue-600/20"
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

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4">
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
                                ) : (
                                    'Simpan Kata Sandi'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
