import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type BaseExcelButtonProps = {
    isLoading?: boolean;
    loadingText?: string;
    icon?: ReactNode;
    children?: ReactNode;
    className?: string;
};

type ButtonVariantProps = BaseExcelButtonProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        as?: 'button';
        href?: never;
    };

type LinkVariantProps = BaseExcelButtonProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
        as: 'a';
        href: string;
    };

type ExcelButtonProps = ButtonVariantProps | LinkVariantProps;

export default function ExcelButton(props: ExcelButtonProps) {
    const {
        className = '',
        isLoading = false,
        loadingText,
        icon,
        children = 'Export Excel',
        as = 'button',
    } = props;

    const baseClassName = `shadow-2xs inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-all duration-200 hover:bg-emerald-100 active:bg-emerald-200 ${className}`;

    const iconElement = isLoading ? (
        <svg
            className="h-4 w-4 animate-spin text-emerald-600"
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
    ) : (
        icon || (
            <svg
                className="h-4 w-4 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        )
    );

    if (as === 'a') {
        const { as: _, isLoading: _l, loadingText: _lt, icon: _i, children: _c, className: _cn, ...linkProps } = props as LinkVariantProps;
        return (
            <a
                {...linkProps}
                className={baseClassName}
            >
                {iconElement}
                <span>{isLoading && loadingText ? loadingText : children}</span>
            </a>
        );
    }

    const {
        as: _,
        isLoading: _l,
        loadingText: _lt,
        icon: _i,
        children: _c,
        className: _cn,
        disabled = false,
        type = 'button',
        ...buttonProps
    } = props as ButtonVariantProps;

    const isButtonDisabled = disabled || isLoading;

    return (
        <button
            {...buttonProps}
            type={type}
            disabled={isButtonDisabled}
            className={`${baseClassName} ${
                isButtonDisabled
                    ? 'cursor-not-allowed opacity-60 shadow-none'
                    : ''
            }`}
        >
            {iconElement}
            <span>{isLoading && loadingText ? loadingText : children}</span>
        </button>
    );
}

