import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'white' | 'slate' | 'emerald';

interface LoadingSpinnerProps {
    size?: SpinnerSize;
    color?: SpinnerColor;
    className?: string;
    label?: string;
}

export function LoadingSpinner({
    size = 'md',
    color = 'primary',
    className = '',
    label,
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-3',
        xl: 'w-12 h-12 border-4',
    };

    const colorClasses = {
        primary: 'border-slate-200 border-t-blue-600 text-blue-600',
        white: 'border-white/30 border-t-white text-white',
        slate: 'border-slate-200 border-t-slate-600 text-slate-600',
        emerald: 'border-emerald-200 border-t-emerald-600 text-emerald-600',
    };

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <div
                className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
                role="status"
                aria-label={label || 'Memuat...'}
            />
            {label && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {label}
                </span>
            )}
        </div>
    );
}

interface LoadingOverlayProps {
    show: boolean;
    label?: string;
    blur?: boolean;
    children?: React.ReactNode;
    fullScreen?: boolean;
}

export function LoadingOverlay({
    show,
    label = 'Memuat data...',
    blur = true,
    children,
    fullScreen = false,
}: LoadingOverlayProps) {
    if (!show && !children) return null;

    const overlayContent = show ? (
        <div
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 ${
                blur ? 'backdrop-blur-sm' : ''
            } transition-opacity duration-200`}
        >
            <div className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-xs text-center">
                <LoadingSpinner size="lg" color="primary" />
                {label && (
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {label}
                    </p>
                )}
            </div>
        </div>
    ) : null;

    if (fullScreen) {
        return overlayContent;
    }

    return (
        <div className="relative">
            {children}
            {show && (
                <div
                    className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 ${
                        blur ? 'backdrop-blur-[2px]' : ''
                    } rounded-lg transition-all duration-200`}
                >
                    <div className="flex flex-col items-center gap-2 p-3 bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                        <LoadingSpinner size="md" color="primary" />
                        {label && (
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {label}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded ${className}`}
        />
    );
}

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
    return (
        <div className="w-full space-y-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            {/* Header skeleton */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-2 border-b border-slate-100 dark:border-slate-700/50">
                {Array.from({ length: cols }).map((_, colIdx) => (
                    <div
                        key={colIdx}
                        className={`col-span-${Math.floor(12 / cols)}`}
                    >
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="grid grid-cols-12 gap-4 py-3 border-b border-slate-50 dark:border-slate-700/30 items-center"
                >
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div
                            key={colIdx}
                            className={`col-span-${Math.floor(12 / cols)}`}
                        >
                            <Skeleton
                                className={`h-4 ${
                                    colIdx === 0
                                        ? 'w-4/5 font-semibold'
                                        : 'w-2/3'
                                }`}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

interface CardSkeletonProps {
    count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3"
                >
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-3 w-48" />
                </div>
            ))}
        </div>
    );
}

export default LoadingSpinner;
