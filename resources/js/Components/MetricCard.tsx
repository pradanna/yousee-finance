import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    badgeText?: string;
    badgeColorClass?: string;
    icon?: React.ReactNode;
    iconColorClass?: string;
    valueColorClass?: string;
}

export default function MetricCard({
    title,
    value,
    badgeText,
    badgeColorClass = 'bg-slate-50 text-slate-500 border-slate-100',
    icon,
    iconColorClass = 'bg-slate-50 text-slate-400 border-slate-100',
    valueColorClass = 'text-slate-900'
}: MetricCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100/80 shadow-xs flex flex-col justify-between h-40 transition-all hover:shadow-md hover:border-slate-200/50">
            {/* Top Row: Icon on left, Badge on right */}
            <div className="flex justify-between items-center">
                {icon && (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconColorClass}`}>
                        {icon}
                    </div>
                )}
                {!icon && <div />}
                {badgeText && (
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${badgeColorClass}`}>
                        {badgeText}
                    </span>
                )}
            </div>

            {/* Label and Value */}
            <div className="space-y-1 mt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    {title}
                </span>
                <span className={`text-2xl font-bold tracking-tight font-mono block ${valueColorClass}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}
