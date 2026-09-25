import DangerButton from '@/Components/Button/DangerButton';
import SecondaryButton from '@/Components/Button/SecondaryButton';
import Modal from '@/Components/UI/Modal';
import { UserData } from '@/Features/Users/types';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface DeleteUserModalProps {
    show: boolean;
    onClose: () => void;
    user?: UserData | null;
}

export default function DeleteUserModal({
    show,
    onClose,
    user,
}: DeleteUserModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!user) return null;

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(route('users.destroy', user.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            Hapus Pengguna
                        </h3>
                        <p className="text-xs text-slate-500">
                            Tindakan ini tidak dapat dibatalkan
                        </p>
                    </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600">
                    Apakah Anda yakin ingin menghapus akun pengguna{' '}
                    <span className="font-bold text-slate-900">
                        {user.name}
                    </span>{' '}
                    ({user.email})? Pengguna ini tidak akan dapat login lagi ke
                    dalam sistem Yousee Finance.
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <SecondaryButton
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Batal
                    </SecondaryButton>
                    <DangerButton
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        {isDeleting ? (
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
                                Menghapus...
                            </>
                        ) : (
                            'Ya, Hapus Pengguna'
                        )}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
