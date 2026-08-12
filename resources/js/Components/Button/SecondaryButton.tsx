import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-slate-100 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-800 ${
                disabled ? 'cursor-not-allowed opacity-50 shadow-none' : ''
            } ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
