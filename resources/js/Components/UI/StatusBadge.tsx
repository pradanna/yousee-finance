export type StatusType =
    | 'draft'
    | 'issued'
    | 'paid'
    | 'received'
    | 'active'
    | 'finished'
    | 'pkp'
    | 'non-pkp'
    | 'archived';

interface StatusBadgeProps {
    status: StatusType;
    labelOverride?: string;
}

export default function StatusBadge({
    status,
    labelOverride,
}: StatusBadgeProps) {
    const getStyles = () => {
        switch (status) {
            case 'paid':
            case 'received':
            case 'finished':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100/80',
                    dot: 'bg-emerald-500',
                    label:
                        status === 'paid'
                            ? 'Lunas'
                            : status === 'received'
                              ? 'Diterima'
                              : 'Selesai',
                };
            case 'issued':
            case 'active':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-100/80',
                    dot: 'bg-blue-500',
                    label: status === 'issued' ? 'Diterbitkan' : 'Aktif',
                };
            case 'pkp':
                return {
                    bg: 'bg-blue-50 text-blue-700 border-blue-100/80',
                    dot: 'bg-blue-500',
                    label: 'PKP (Bisa PPN)',
                };
            case 'non-pkp':
                return {
                    bg: 'bg-slate-100 text-slate-600 border-slate-200/80',
                    dot: 'bg-slate-400',
                    label: 'Non-PKP',
                };
            case 'archived':
                return {
                    bg: 'bg-slate-100 text-slate-500 border-slate-200/80',
                    dot: 'bg-slate-400',
                    label: 'Diarsipkan',
                };
            case 'draft':
            default:
                return {
                    bg: 'bg-slate-100 text-slate-700 border-slate-200/80',
                    dot: 'bg-slate-400',
                    label: 'Draf',
                };
        }
    };

    const styles = getStyles();

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none ${styles.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}></span>
            {labelOverride || styles.label}
        </span>
    );
}
