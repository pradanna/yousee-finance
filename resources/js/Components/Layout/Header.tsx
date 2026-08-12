import Modal from '@/Components/UI/Modal';
import { router } from '@inertiajs/react';
import React, { useState } from 'react';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface HeaderProps {
    title: string;
    breadcrumbs: Breadcrumb[];
    fiscalMode?: 'ppn' | 'non-ppn';
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onFiscalModeToggle?: (mode: 'ppn' | 'non-ppn') => void;
}

export default function Header({
    title,
    breadcrumbs = [],
    fiscalMode,
    isCollapsed = false,
    onToggleCollapse,
    onFiscalModeToggle,
}: HeaderProps) {
    const [targetMode, setTargetMode] = useState<'ppn' | 'non-ppn' | null>(
        null,
    );

    const handleModeClick = (newMode: 'ppn' | 'non-ppn') => {
        if (newMode === fiscalMode) return;
        setTargetMode(newMode);
    };

    const confirmModeChange = () => {
        if (!targetMode) return;
        if (onFiscalModeToggle) onFiscalModeToggle(targetMode);
        setTargetMode(null);
        router.visit('/overview');
    };

    const formattedDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/55 bg-white/80 px-6 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-3.5">
                {/* Desktop Sidebar Toggle Button */}
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="hidden shrink-0 cursor-pointer rounded-xl border border-slate-200/70 p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 lg:flex"
                    title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                >
                    {isCollapsed ? (
                        <svg
                            className="h-4 w-4 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 5l7 7-7 7M5 5l7 7-7 7"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="h-4 w-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                            />
                        </svg>
                    )}
                </button>

                {/* Mobile Hamburger (for responsive views) */}
                <button className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden">
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
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>

                {/* Breadcrumbs & Title */}
                <div>
                    <nav className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        {breadcrumbs?.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && (
                                    <span className="text-slate-300">/</span>
                                )}
                                <span
                                    className={
                                        crumb.href
                                            ? 'cursor-pointer hover:text-slate-600'
                                            : 'text-slate-400'
                                    }
                                >
                                    {crumb.label}
                                </span>
                            </React.Fragment>
                        ))}
                    </nav>
                    <h1 className="flex items-center gap-2 text-lg font-bold leading-none tracking-tight text-slate-800">
                        {title}
                    </h1>
                </div>
            </div>

            {/* Right Date and Avatar */}
            <div className="flex items-center gap-4">
                {fiscalMode && onFiscalModeToggle && (
                    <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-slate-200/60 p-1">
                        <button
                            id="toggle-mode-ppn"
                            onClick={() => handleModeClick('ppn')}
                            className={`rounded-lg px-3 py-1.5 text-center text-xs font-bold tracking-wide transition-all ${
                                fiscalMode === 'ppn'
                                    ? 'shadow-2xs bg-primary text-white shadow-neon-primary'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mode PPN (PKP)"
                        >
                            PPN
                        </button>
                        <button
                            id="toggle-mode-non-ppn"
                            onClick={() => handleModeClick('non-ppn')}
                            className={`rounded-lg px-3 py-1.5 text-center text-xs font-bold tracking-wide transition-all ${
                                fiscalMode === 'non-ppn'
                                    ? 'shadow-2xs bg-primary text-white shadow-neon-primary'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mode Non-PPN"
                        >
                            Non-PPN
                        </button>
                    </div>
                )}

                <div className="hidden items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 md:flex">
                    <svg
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    {formattedDate}
                </div>

                <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200/60 bg-slate-100 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200">
                    PM
                </div>
            </div>

            {/* Modal Konfirmasi Ganti Mode Fiskal */}
            <Modal
                show={targetMode !== null}
                onClose={() => setTargetMode(null)}
                maxWidth="md"
            >
                <div className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
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
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Konfirmasi Beralih Silo Mode Fiskal
                            </h3>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Mode Fiskal akan diubah ke{' '}
                                <strong className="uppercase text-slate-800">
                                    {targetMode === 'ppn'
                                        ? 'Mode PPN (PKP)'
                                        : 'Mode Non-PPN'}
                                </strong>
                                .
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs font-medium leading-relaxed text-amber-900">
                        <p>
                            ⚠️ <strong>Perhatian:</strong> Data transaksi,
                            proyek, dan invoice pada{' '}
                            <strong>
                                {targetMode === 'ppn'
                                    ? 'Mode PPN'
                                    : 'Mode Non-PPN'}
                            </strong>{' '}
                            terisolasi secara terpisah.
                        </p>
                        <p>
                            Anda akan diarahkan kembali ke{' '}
                            <strong>Dashboard Overview</strong> setelah beralih
                            mode.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                        <button
                            type="button"
                            onClick={() => setTargetMode(null)}
                            className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmModeChange}
                            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                        >
                            Ya, Ganti Mode &amp; Buka Dashboard
                        </button>
                    </div>
                </div>
            </Modal>
        </header>
    );
}
