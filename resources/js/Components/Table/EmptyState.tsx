import React from 'react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({
    title = 'Belum ada data',
    description = 'Data tidak ditemukan atau belum ada transaksi yang tercatat.',
    icon,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center space-y-3 p-12 text-center ${className}`}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                {icon || (
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>
                )}
            </div>
            <div>
                <h4 className="text-sm font-bold tracking-tight text-slate-800">
                    {title}
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                    {description}
                </p>
            </div>
            {action && <div className="pt-2">{action}</div>}
        </div>
    );
}
