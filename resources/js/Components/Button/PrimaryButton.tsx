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
            className={
                `bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''
                } ${className}`
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
