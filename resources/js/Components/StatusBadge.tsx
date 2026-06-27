import React from 'react';

interface StatusBadgeProps {
    status: 'draft' | 'issued' | 'paid' | 'received' | 'active' | 'finished';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStyles = () => {
        switch (status) {
            case 'paid':
            case 'received':
            case 'finished':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    dot: 'bg-emerald-500',
                    label: status === 'paid' ? 'Paid' : status === 'received' ? 'Received' : 'Finished'
                };
            case 'issued':
            case 'active':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-100',
                    dot: 'bg-blue-500',
                    label: status === 'issued' ? 'Issued' : 'Active'
                };
            case 'draft':
            default:
                return {
                    bg: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                    label: 'Draft'
                };
        }
    };

    const styles = getStyles();

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none ${styles.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
            {styles.label}
        </span>
    );
}
