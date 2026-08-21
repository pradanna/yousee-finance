import { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
}

export default function PrimaryButton({
    className = '',
    disabled,
    isLoading = false,
    loadingText,
    children,
    type = 'button',
    ...props
}: PrimaryButtonProps) {
    const isButtonDisabled = disabled || isLoading;

    return (
        <button
            {...props}
            type={type}
            className={`inline-flex shrink-0 cursor-pointer flex-row items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800 ${
                isButtonDisabled
                    ? 'cursor-not-allowed opacity-60 shadow-none'
                    : ''
            } ${className}`}
            disabled={isButtonDisabled}
        >
            {isLoading && (
                <svg
                    className="h-3.5 w-3.5 animate-spin text-white"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            <span>{isLoading && loadingText ? loadingText : children}</span>
        </button>
    );
}
