import React from 'react';
import { NsfpModalState } from '../ppnTypes';

interface NsfpEditModalProps {
    nsfpModal: NsfpModalState | null;
    inputNsfp: string;
    onInputNsfpChange: (val: string) => void;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    isSubmitting?: boolean;
}

export default function NsfpEditModal({
    nsfpModal,
    inputNsfp,
    onInputNsfpChange,
    onClose,
    onSave,
    isSubmitting = false,
}: NsfpEditModalProps) {
    if (!nsfpModal || !nsfpModal.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                onClick={isSubmitting ? undefined : onClose}
            />
            <div className="animate-fade-in relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                    <div>
                        <h3 className="text-sm font-bold">
                            Update Nomor Seri Faktur Pajak (NSFP)
                        </h3>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">
                            {nsfpModal.item.docNo}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={onSave} className="space-y-4 p-6 text-xs">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">
                            Nomor Seri Faktur Pajak e-Faktur
                        </label>
                        <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Contoh: 010.000-26.88219005"
                            value={inputNsfp}
                            onChange={(e) => onInputNsfpChange(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                    </div>

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-75"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin text-white"
                                        xmlns="http://www.w3.org/2000/svg"
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
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan NSFP</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
