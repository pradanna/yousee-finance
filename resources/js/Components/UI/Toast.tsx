import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';

export interface ToastProps {
    show: boolean;
    type?: ToastType;
    position?: ToastPosition;
    title?: string;
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    show,
    type = 'success',
    position = 'bottom-right',
    title,
    message,
    onClose,
    duration = 4000,
}: ToastProps) {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const getStyles = () => {
        switch (type) {
            case 'error':
                return {
                    bg: 'bg-rose-50 border-rose-200 text-rose-900',
                    iconBg: 'bg-rose-100 text-rose-600',
                    defaultTitle: 'Terjadi Kesalahan',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    ),
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 border-amber-200 text-amber-900',
                    iconBg: 'bg-amber-100 text-amber-600',
                    defaultTitle: 'Peringatan',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    ),
                };
            case 'info':
                return {
                    bg: 'bg-blue-50 border-blue-200 text-blue-900',
                    iconBg: 'bg-blue-100 text-blue-600',
                    defaultTitle: 'Informasi',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ),
                };
            case 'success':
            default:
                return {
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                    iconBg: 'bg-emerald-100 text-emerald-600',
                    defaultTitle: 'Berhasil',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ),
                };
        }
    };

    const style = getStyles();

    const getPositionClass = () => {
        switch (position) {
            case 'top-right':
                return 'fixed top-6 right-6 animate-in fade-in slide-in-from-top-3';
            case 'top-left':
                return 'fixed top-6 left-6 animate-in fade-in slide-in-from-top-3';
            case 'bottom-left':
                return 'fixed bottom-6 left-6 animate-in fade-in slide-in-from-bottom-3';
            case 'bottom-right':
            default:
                return 'fixed bottom-6 right-6 animate-in fade-in slide-in-from-bottom-3';
        }
    };

    return (
        <div
            className={`${getPositionClass()} z-50 max-w-sm w-full duration-300 pointer-events-auto`}
        >
            <div
                className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${style.bg}`}
            >
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
                >
                    {style.icon}
                </div>

                <div className="flex-1 pt-0.5">
                    <h4 className="text-xs font-bold tracking-tight">
                        {title || style.defaultTitle}
                    </h4>
                    <p className="mt-0.5 text-xs font-medium opacity-90 leading-relaxed">
                        {message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 p-1 text-slate-400 hover:text-slate-700 transition-colors"
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
        </div>
    );
}
