import { Project } from '@/Pages/Projects/projectTypes';

interface ProjectStatusBadgeProps {
    status: Project['status'];
}

export default function ProjectStatusBadge({
    status,
}: ProjectStatusBadgeProps) {
    const map: Record<
        Project['status'],
        { bg: string; dot: string; text: string }
    > = {
        Draft: {
            bg: 'bg-amber-50 text-amber-700 border-amber-100',
            dot: 'bg-amber-400',
            text: 'Draft',
        },
        Active: {
            bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            dot: 'bg-emerald-500',
            text: 'Aktif',
        },
        Completed: {
            bg: 'bg-blue-50 text-blue-700 border-blue-100',
            dot: 'bg-blue-500',
            text: 'Selesai',
        },
        Cancelled: {
            bg: 'bg-red-50 text-red-700 border-red-100',
            dot: 'bg-red-500',
            text: 'Dibatalkan',
        },
    };
    const s = map[status] || map.Draft;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${s.bg}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
}

export { ProjectStatusBadge as StatusBadge };
