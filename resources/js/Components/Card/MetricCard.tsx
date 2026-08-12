import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    badgeText?: string;
    badgeColorClass?: string;
    icon?: React.ReactNode;
    iconColorClass?: string;
    valueColorClass?: string;
    cardBgClass?: string;
}

export default function MetricCard({
    title,
    value,
    badgeText,
    badgeColorClass = 'bg-white/80 text-slate-600 border-slate-200/60',
    icon,
    iconColorClass = 'bg-white text-slate-600 border-slate-100 shadow-2xs',
    valueColorClass = 'text-slate-900',
    cardBgClass = 'bg-white border-slate-200/80',
}: MetricCardProps) {
    return (
        <div
            className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 transition-all hover:shadow-sm sm:p-4 ${cardBgClass}`}
        >
            {/* Top Row: Icon on left, Badge on right */}
            <div className="flex items-center justify-between">
                {icon && (
                    <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs sm:h-8 sm:w-8 ${iconColorClass}`}
                    >
                        {icon}
                    </div>
                )}
                {!icon && <div />}
                {badgeText && (
                    <span
                        className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeColorClass}`}
                    >
                        {badgeText}
                    </span>
                )}
            </div>

            {/* Label and Value */}
            <div className="mt-0.5 space-y-0.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {title}
                </span>
                <span
                    className={`block font-mono text-base font-bold tracking-tight sm:text-lg ${valueColorClass}`}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}
