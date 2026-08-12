import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-300 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700 dark:focus:ring-offset-slate-800 ${
                disabled ? 'cursor-not-allowed opacity-50 shadow-none' : ''
            } ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
