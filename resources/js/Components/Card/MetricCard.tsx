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
    cardBgClass = 'bg-white border-slate-200/80'
}: MetricCardProps) {
    return (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-3 transition-all hover:shadow-md ${cardBgClass}`}>
            {/* Top Row: Icon on left, Badge on right */}
            <div className="flex justify-between items-center">
                {icon && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconColorClass}`}>
                        {icon}
                    </div>
                )}
                {!icon && <div />}
                {badgeText && (
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${badgeColorClass}`}>
                        {badgeText}
                    </span>
                )}
            </div>

            {/* Label and Value */}
            <div className="space-y-0.5 mt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {title}
                </span>
                <span className={`text-xl font-bold tracking-tight font-mono block ${valueColorClass}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}
