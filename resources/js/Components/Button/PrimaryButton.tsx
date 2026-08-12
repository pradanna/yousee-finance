import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            type={type}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800 ${
                disabled ? 'cursor-not-allowed opacity-50 shadow-none' : ''
            } ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
