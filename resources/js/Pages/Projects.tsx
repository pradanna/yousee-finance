import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    CreateProjectFormData,
    createProjectSchema,
} from './Projects/createProjectSchema';
import { StatusBadge } from './Projects/Show';

import {
    PPN_RATE,
    Project,
    ViewMode,
    calcFinancials,
    fmt,
} from './Projects/projectTypes';

interface ClientOption {
    id: string;
    name: string;
}

interface SalesOption {
    id: string;
    name: string;
}

interface VendorOption {
    id: string;
    name: string;
}

interface ProjectsPageProps {
    projects: {
        data: Array<{
            id: string;
            code: string;
            name: string;
            client_id: string;
            client?: { id: string; name: string };
            client_name?: string;
            sales_id?: string;
            sales?: { id: string; name: string };
            sales_pic?: string;
            fiscal_mode: 'ppn' | 'non-ppn';
            start_date: string;
            end_date: string;
            contract_value: number;
            target_qty: number;
            status: 'draft' | 'active' | 'completed' | 'cancelled';
            notes?: string;
            locations?: Array<{
                id: string;
                code: string;
                area: string;
                description: string;
                type: string;
                size: string;
                vendor_id?: string;
                vendor?: { id: string; name: string };
                vendor_cost: number;
                po_issued: boolean;
                po_number?: string;
            }>;
            purchase_orders?: Array<unknown>;
            invoices?: Array<unknown>;
            invoice_issued?: boolean;
            invoice_number?: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        meta?: Record<string, unknown>;
    };
    clients: ClientOption[];
    sales: SalesOption[];
    vendors?: VendorOption[];
    filters?: {
        client_id?: string;
        sales_id?: string;
        search?: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatPeriod(
    startStr: string,
    endStr: string,
): { label: string; duration: string } {
    if (!startStr || !endStr) return { label: '', duration: '' };

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return { label: '', duration: '' };
    }

    const monthNamesShort = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
    ];

    const startDay = String(start.getDate()).padStart(2, '0');
    const startMonth = monthNamesShort[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = String(end.getDate()).padStart(2, '0');
    const endMonth = monthNamesShort[end.getMonth()];
    const endYear = end.getFullYear();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;

    let label = '';
    if (startYear === endYear && start.getMonth() === end.getMonth()) {
        label = `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
        label = `${startMonth} - ${endMonth} ${startYear}`;
    } else {
        label = `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }

    const duration =
        months > 1 ? `${months} Bulan (${diffDays} Hari)` : `${diffDays} Hari`;

    return { label, duration };
}

const MONTH_MAP: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    Mei: 4,
    Jun: 5,
    Jul: 6,
    Agu: 7,
    Sep: 8,
    Okt: 9,
    Nov: 10,
    Des: 11,
};

/**
 * Parse period string like "01 Jun - 31 Agu 2026" or "01 Mar - 31 Mei 2026"
 * into { start: Date, end: Date }
 */
function parsePeriod(periodStr: string): { start: Date; end: Date } | null {
    // Format: "DD MMM - DD MMM YYYY" or "DD MMM YYYY - DD MMM YYYY"
    const match = periodStr.match(
        /^(\d{2})\s+(\w+)(?:\s+(\d{4}))?\s*-\s*(\d{2})\s+(\w+)\s+(\d{4})$/,
    );
    if (!match) return null;

    const [, startDay, startMonStr, startYearStr, endDay, endMonStr, endYear] =
        match;
    const startMon = MONTH_MAP[startMonStr];
    const endMon = MONTH_MAP[endMonStr];
    if (startMon === undefined || endMon === undefined) return null;

    const year = parseInt(endYear, 10);
    const startYear = startYearStr ? parseInt(startYearStr, 10) : year;

    const start = new Date(startYear, startMon, parseInt(startDay, 10));
    const end = new Date(year, endMon, parseInt(endDay, 10));
    return { start, end };
}

function calcPeriodProgress(
    periodStr: string,
    status: string,
): {
    percent: number;
    label: string;
    barClass: string;
    textClass: string;
} {
    // Completed project always shows 100%
    if (status === 'Completed') {
        return {
            percent: 100,
            label: 'Masa Tayang Selesai',
            barClass: 'bg-rose-500',
            textClass: 'text-rose-600 font-bold',
        };
    }

    const parsed = parsePeriod(periodStr);

    // Fallback if period can't be parsed
    if (!parsed) {
        return {
            percent: 0,
            label: 'Belum Tayang',
            barClass: 'bg-slate-300',
            textClass: 'text-slate-400 font-medium',
        };
    }

    const { start, end } = parsed;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

    // Belum mulai
    if (today < start) {
        return {
            percent: 0,
            label: 'Belum Tayang',
            barClass: 'bg-slate-300',
            textClass: 'text-slate-400 font-medium',
        };
    }

    // Sudah selesai
    if (today > end) {
        return {
            percent: 100,
            label: 'Masa Tayang Selesai',
            barClass: 'bg-rose-500',
            textClass: 'text-rose-600 font-bold',
        };
    }

    // Sedang berjalan
    const daysPassed =
        Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
    const daysLeft = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const percent = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    return {
        percent,
        label: `Berjalan ${daysPassed}/${totalDays} Hari (Sisa ${daysLeft} Hari)`,
        barClass:
            'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500',
        textClass: 'text-blue-600 font-mono',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Projects Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Projects({
    projects: paginatedProjectsData,
    clients,
    sales,
    vendors,
}: ProjectsPageProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // Map database projects to frontend Project format
    const projects: Project[] = useMemo(() => {
        const rawList = paginatedProjectsData?.data || [];
        return rawList
            .filter((p) =>
                isPPN ? p.fiscal_mode === 'ppn' : p.fiscal_mode === 'non-ppn',
            )
            .map((p) => {
                const statusMap: Record<string, Project['status']> = {
                    draft: 'Draft',
                    active: 'Active',
                    completed: 'Completed',
                    cancelled: 'Cancelled',
                };

                const periodObj = formatPeriod(p.start_date, p.end_date);

                return {
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    clientId: p.client_id,
                    clientName: p.client?.name ?? p.client_name ?? '-',
                    salesPIC: p.sales?.name ?? p.sales_pic ?? '-',
                    period:
                        periodObj.label || `${p.start_date} - ${p.end_date}`,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    contractValue: Number(p.contract_value) || 0,
                    status: statusMap[p.status] || 'Draft',
                    targetQty: p.target_qty || 1,
                    locations: (p.locations || []).map((loc) => ({
                        id: loc.id,
                        code: loc.code,
                        area: loc.area,
                        description: loc.description,
                        type: (loc.type as any) || 'Billboard',
                        size: loc.size,
                        vendorId: loc.vendor_id ?? null,
                        vendorName: loc.vendor?.name ?? '-',
                        vendorCost: Number(loc.vendor_cost) || 0,
                        poIssued: Boolean(loc.po_issued),
                        poNumber: loc.po_number || '',
                    })),
                    invoiceIssued: Boolean(p.invoice_issued),
                    invoiceNumber: p.invoice_number || '',
                };
            });
    }, [paginatedProjectsData, isPPN]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateProjectFormData>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            clientId: '',
            salesId: '',
            startDate: '',
            endDate: '',
            targetQty: '1',
            contractValue: '',
            taxMode: 'dpp', // "dpp" = Belum PPN, "inc" = Sudah PPN
        },
    });

    const watchedStartDate = watch('startDate');
    const watchedEndDate = watch('endDate');
    const watchedContractValue = watch('contractValue');
    const watchedTaxMode = watch('taxMode');

    const periodInfo = useMemo(() => {
        return formatPeriod(watchedStartDate, watchedEndDate);
    }, [watchedStartDate, watchedEndDate]);

    // Live calculations for Create Project modal
    const parsedRawValue =
        parseInt((watchedContractValue ?? '').replace(/[^0-9]/g, ''), 10) || 0;
    const computedFinancials = useMemo(() => {
        if (!parsedRawValue) return { dpp: 0, ppn: 0, total: 0 };
        if (!isPPN) {
            return { dpp: parsedRawValue, ppn: 0, total: parsedRawValue };
        }
        if (watchedTaxMode === 'inc') {
            // User inputs Grand Total (Inc PPN) -> Convert back to DPP: DPP = Total / 1.11
            const dpp = Math.round(parsedRawValue / 1.11);
            const ppn = parsedRawValue - dpp;
            return { dpp, ppn, total: parsedRawValue };
        } else {
            // User inputs DPP (Excl PPN) -> PPN = DPP * 11%
            const ppn = Math.round(parsedRawValue * PPN_RATE);
            const total = parsedRawValue + ppn;
            return { dpp: parsedRawValue, ppn, total };
        }
    }, [parsedRawValue, watchedTaxMode, isPPN]);

    // Maps backend (snake_case) validation error keys back to RHF field names.
    const SERVER_ERROR_FIELD_MAP: Record<string, keyof CreateProjectFormData> =
        {
            name: 'name',
            client_id: 'clientId',
            sales_id: 'salesId',
            start_date: 'startDate',
            end_date: 'endDate',
            contract_value: 'contractValue',
            target_qty: 'targetQty',
        };

    const onCreateProject = (data: CreateProjectFormData) => {
        const rawContractValue =
            parseInt(data.contractValue.replace(/[^0-9]/g, ''), 10) || 0;

        router.post(
            route('projects.store'),
            {
                name: data.name,
                client_id: data.clientId,
                sales_id: data.salesId || undefined,
                fiscal_mode: fiscalMode,
                start_date: data.startDate,
                end_date: data.endDate,
                contract_value: rawContractValue,
                is_ppn_inclusive: isPPN && data.taxMode === 'inc',
                target_qty: data.targetQty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
                onError: (serverErrors) => {
                    Object.entries(serverErrors).forEach(([key, message]) => {
                        const field = SERVER_ERROR_FIELD_MAP[key];
                        if (field) {
                            setError(field, { message });
                        }
                    });
                },
            },
        );
    };

    const handleUpdateProject = (_updated?: Project) => {
        router.reload();
    };

    // Metrics calculation
    const totalActiveProjects = useMemo(() => {
        return projects.filter((p) => p.status === 'Active').length;
    }, [projects]);

    const totalContractValue = useMemo(() => {
        return projects.reduce((acc, p) => acc + p.contractValue, 0);
    }, [projects]);

    const totalEstimatedProfit = useMemo(() => {
        return projects.reduce((acc, p) => {
            const fin = calcFinancials(p, p.locations, fiscalMode);
            return acc + fin.netProfit;
        }, 0);
    }, [projects, fiscalMode]);

    // Filtering + sort by tanggal mulai tayang (ascending)
    const filteredProjects = useMemo(() => {
        const filtered = projects.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && p.status === 'Active') ||
                (statusFilter === 'draft' && p.status === 'Draft') ||
                (statusFilter === 'completed' && p.status === 'Completed') ||
                (statusFilter === 'pending_po' &&
                    p.locations.some((l) => !l.poIssued)) ||
                (statusFilter === 'no_invoice' && !p.invoiceIssued);

            return matchesSearch && matchesStatus;
        });

        // Sort priority:
        //   1. Akan datang (belum tayang) — startDate ascending (yang paling dekat muncul duluan)
        //   2. Sedang berjalan (on-air)   — endDate ascending (yang mau habis duluan)
        //   3. Selesai / expired          — startDate descending (paling baru dulu)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getTayangGroup = (p: Project): number => {
            if (p.status === 'Completed' || p.status === 'Cancelled') return 3;
            const parsed = parsePeriod(p.period);
            if (!parsed) return 2; // fallback ke on-air group
            if (today < parsed.start) return 1; // belum mulai
            if (today > parsed.end) return 3; // sudah lewat
            return 2; // sedang berjalan
        };

        return filtered.sort((a, b) => {
            const groupA = getTayangGroup(a);
            const groupB = getTayangGroup(b);
            if (groupA !== groupB) return groupA - groupB;

            const parsedA = parsePeriod(a.period);
            const parsedB = parsePeriod(b.period);

            if (groupA === 1) {
                // Akan datang: startDate ascending
                const tA = parsedA ? parsedA.start.getTime() : Infinity;
                const tB = parsedB ? parsedB.start.getTime() : Infinity;
                return tA - tB;
            }
            if (groupA === 2) {
                // Sedang tayang: endDate ascending (yang mau habis duluan)
                const tA = parsedA ? parsedA.end.getTime() : Infinity;
                const tB = parsedB ? parsedB.end.getTime() : Infinity;
                return tA - tB;
            }
            // Selesai: startDate descending (paling baru dulu)
            const tA = parsedA ? parsedA.start.getTime() : 0;
            const tB = parsedB ? parsedB.start.getTime() : 0;
            return tB - tA;
        });
    }, [projects, searchQuery, statusFilter]);

    // Pagination
    const totalItems = filteredProjects.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedProjects = useMemo(() => {
        return filteredProjects.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        );
    }, [filteredProjects, currentPage, itemsPerPage]);

    // Counts for filter chips
    const countAll = projects.length;
    const countActive = projects.filter((p) => p.status === 'Active').length;
    const countDraft = projects.filter((p) => p.status === 'Draft').length;
    const countPendingPO = projects.filter((p) =>
        p.locations.some((l) => !l.poIssued),
    ).length;
    const countNoInvoice = projects.filter((p) => !p.invoiceIssued).length;

    return (
        <AppLayout
            activePage="projects"
            title="Manajemen Proyek Billboard"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Data Proyek' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header Title & CTA */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Manajemen Proyek Billboard
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                            Pantau pipeline kampanye iklan, titik lokasi media,
                            PO vendor, dan invoice client
                        </p>
                    </div>

                    <PrimaryButton onClick={() => setIsCreateOpen(true)}>
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Buat Proyek Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <MetricCard
                        title="Proyek Aktif"
                        value={`${totalActiveProjects} Proyek`}
                        badgeText="Proyek Berjalan"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title={
                            isPPN
                                ? 'Total Nilai Kontrak (DPP)'
                                : 'Total Nilai Kontrak'
                        }
                        value={fmt(totalContractValue)}
                        badgeText={isPPN ? 'Mode PPN 11%' : 'Mode Non-PPN'}
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-emerald-600 border-emerald-100 shadow-2xs"
                        valueColorClass="text-emerald-950"
                    />
                    <MetricCard
                        title="Estimasi Laba Bersih"
                        value={fmt(totalEstimatedProfit)}
                        badgeText="Profit Margin"
                        cardBgClass="bg-slate-100/80 border-slate-200/80 shadow-xs"
                        badgeColorClass="bg-white/90 text-slate-800 border-slate-200/60"
                        icon={
                            <svg
                                className="h-5 w-5 text-slate-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                        }
                        iconColorClass="bg-white text-slate-600 border-slate-200/60 shadow-2xs"
                        valueColorClass="text-slate-900"
                    />
                </div>

                {/* Search & Fast Filter Chips Bar */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4">
                    {/* Top Row: Search Input & View Switcher */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        {/* Search Input */}
                        <div className="max-w-md flex-1 space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Pencarian Proyek
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <TextInput
                                    type="text"
                                    placeholder="Cari nama proyek, kode, client, atau sales..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="block w-full pl-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* View Switcher Segmented Control */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Mode Tampilan
                            </label>
                            <div className="shadow-2xs flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        viewMode === 'grid'
                                            ? 'shadow-xs bg-primary text-white shadow-neon-primary'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    title="Tampilan Kartu Rich Modular"
                                >
                                    <span>Grid Kartu</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setViewMode('kanban')}
                                    className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        viewMode === 'kanban'
                                            ? 'shadow-xs bg-primary text-white shadow-neon-primary'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    title="Tampilan Kanban Pipeline Board"
                                >
                                    <span>Kanban</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`flex cursor-pointer items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        viewMode === 'table'
                                            ? 'shadow-xs bg-primary text-white shadow-neon-primary'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    title="Tampilan Tabel Detail"
                                >
                                    <span>Tabel</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Interactive Status Pills Navigation */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        {[
                            { key: 'all', label: `Semua Proyek (${countAll})` },
                            { key: 'active', label: `Aktif (${countActive})` },
                            { key: 'draft', label: `Draft (${countDraft})` },
                            {
                                key: 'pending_po',
                                label: `Pending PO (${countPendingPO})`,
                            },
                            {
                                key: 'no_invoice',
                                label: `Invoicing (${countNoInvoice})`,
                            },
                        ].map((pill) => {
                            const isSelected = statusFilter === pill.key;
                            return (
                                <button
                                    key={pill.key}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(pill.key);
                                        setCurrentPage(1);
                                    }}
                                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                                        isSelected
                                            ? 'shadow-2xs border-blue-200 bg-blue-50 font-extrabold text-blue-700'
                                            : 'border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── VIEW 1: GRID KARTU RICH MODULAR ── */}
                {viewMode === 'grid' && (
                    <>
                        {totalItems === 0 ? (
                            <EmptyState
                                title="Proyek Tidak Ditemukan"
                                description="Tidak ada data proyek billboard yang cocok dengan pencarian atau filter Anda."
                            />
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {paginatedProjects.map((project) => {
                                    const fin = calcFinancials(
                                        project,
                                        project.locations,
                                        fiscalMode,
                                    );
                                    const poCount = project.locations.filter(
                                        (l) => l.poIssued,
                                    ).length;
                                    const locCount = project.locations.length;
                                    const poProgress =
                                        locCount > 0 ? poCount / locCount : 0;

                                    const periodProg = calcPeriodProgress(
                                        project.period,
                                        project.status,
                                    );

                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() =>
                                                router.visit(
                                                    route(
                                                        'projects.show',
                                                        project.id,
                                                    ),
                                                )
                                            }
                                            className="shadow-xs group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
                                        >
                                            {/* Top Accent Line */}
                                            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />

                                            <div className="space-y-4">
                                                {/* Card Header Badges */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-extrabold text-blue-700">
                                                            {project.code}
                                                        </span>
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${
                                                                isPPN
                                                                    ? 'border-violet-100 bg-violet-50 text-violet-700'
                                                                    : 'border-slate-200 bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {isPPN
                                                                ? 'PPN 11%'
                                                                : 'Non-PPN'}
                                                        </span>
                                                    </div>
                                                    <StatusBadge
                                                        status={project.status}
                                                    />
                                                </div>

                                                {/* Project Title & Client info */}
                                                <div>
                                                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600">
                                                        {project.name}
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                        <svg
                                                            className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                            />
                                                        </svg>
                                                        <span className="truncate">
                                                            {project.clientName}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500">
                                                        <span>
                                                            PIC:{' '}
                                                            {project.salesPIC}{' '}
                                                            &middot;{' '}
                                                            {project.period}
                                                        </span>
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                            {poCount}/{locCount}{' '}
                                                            PO Terbit
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Milestone Stage Tracker Mini Bar - Progress Masa Tayang */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="text-slate-500">
                                                            Progress Masa Tayang
                                                        </span>
                                                        <span
                                                            className={`text-[10px] ${periodProg.textClass}`}
                                                        >
                                                            {periodProg.label}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className={`${periodProg.barClass} h-full rounded-full transition-all duration-500`}
                                                            style={{
                                                                width: `${periodProg.percent}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Footer Box */}
                                            <div className="mt-5 grid grid-cols-2 items-end gap-3 border-t border-slate-100 pt-4">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Nilai Tagihan
                                                    </span>
                                                    <span className="mt-0.5 block font-mono text-sm font-bold text-slate-900">
                                                        {fmt(fin.totalInvoice)}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Estimasi Laba
                                                    </span>
                                                    <div className="mt-0.5 flex items-center justify-end gap-1.5">
                                                        <span
                                                            className={`font-mono text-xs font-bold ${fin.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                                        >
                                                            {fmt(fin.netProfit)}
                                                        </span>
                                                        <span
                                                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                                                fin.margin >= 30
                                                                    ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                                                                    : 'border border-amber-100 bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {fin.margin.toFixed(
                                                                0,
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                        />
                    </>
                )}

                {/* ── VIEW 2: KANBAN PIPELINE BOARD ── */}
                {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
                        {/* Draft Column */}
                        <div className="space-y-4 rounded-3xl border border-slate-200/60 bg-slate-100/70 p-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                                        Draft Proyek
                                    </h3>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {
                                        projects.filter(
                                            (p) => p.status === 'Draft',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects
                                    .filter((p) => p.status === 'Draft')
                                    .map((project) => {
                                        const fin = calcFinancials(
                                            project,
                                            project.locations,
                                            fiscalMode,
                                        );
                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            'projects.show',
                                                            project.id,
                                                        ),
                                                    )
                                                }
                                                className="shadow-2xs cursor-pointer space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:shadow-md"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600">
                                                        {project.code}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-400">
                                                        {project.period}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold leading-snug text-slate-800">
                                                    {project.name}
                                                </h4>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    {project.clientName}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold">
                                                    <span className="text-slate-400">
                                                        Kontrak:
                                                    </span>
                                                    <span className="font-mono text-slate-900">
                                                        {fmt(fin.totalInvoice)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Active Column */}
                        <div className="space-y-4 rounded-3xl border border-blue-100/60 bg-blue-50/40 p-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900">
                                        Proyek Aktif (Berjalan)
                                    </h3>
                                </div>
                                <span className="rounded-full border border-blue-100 bg-white px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    {
                                        projects.filter(
                                            (p) => p.status === 'Active',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects
                                    .filter((p) => p.status === 'Active')
                                    .map((project) => {
                                        const fin = calcFinancials(
                                            project,
                                            project.locations,
                                            fiscalMode,
                                        );
                                        const poCount =
                                            project.locations.filter(
                                                (l) => l.poIssued,
                                            ).length;
                                        const locCount =
                                            project.locations.length;
                                        const poProgress =
                                            locCount > 0
                                                ? poCount / locCount
                                                : 0;

                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            'projects.show',
                                                            project.id,
                                                        ),
                                                    )
                                                }
                                                className="shadow-2xs cursor-pointer space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:shadow-md"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600">
                                                        {project.code}
                                                    </span>
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                                        Aktif
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold leading-snug text-slate-800">
                                                    {project.name}
                                                </h4>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    {project.clientName}
                                                </div>

                                                {/* Progress Masa Tayang */}
                                                {(() => {
                                                    const prog =
                                                        calcPeriodProgress(
                                                            project.period,
                                                            project.status,
                                                        );
                                                    return (
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                                                <span>
                                                                    Masa Tayang
                                                                </span>
                                                                <span className="font-mono text-slate-700">
                                                                    {poCount}/
                                                                    {locCount}{' '}
                                                                    PO Terbit
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className={`${prog.barClass} h-full rounded-full`}
                                                                    style={{
                                                                        width: `${prog.percent}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold">
                                                    <span className="text-slate-400">
                                                        Laba Bersih:
                                                    </span>
                                                    <span className="font-mono text-emerald-600">
                                                        {fmt(fin.netProfit)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Completed Column */}
                        <div className="space-y-4 rounded-3xl border border-emerald-100/60 bg-emerald-50/40 p-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-900">
                                        Proyek Selesai
                                    </h3>
                                </div>
                                <span className="rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    {
                                        projects.filter(
                                            (p) => p.status === 'Completed',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects
                                    .filter((p) => p.status === 'Completed')
                                    .map((project) => {
                                        const fin = calcFinancials(
                                            project,
                                            project.locations,
                                            fiscalMode,
                                        );
                                        return (
                                            <div
                                                key={project.id}
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            'projects.show',
                                                            project.id,
                                                        ),
                                                    )
                                                }
                                                className="shadow-2xs cursor-pointer space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all hover:shadow-md"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-600">
                                                        {project.code}
                                                    </span>
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                                        Selesai
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold leading-snug text-slate-800">
                                                    {project.name}
                                                </h4>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    {project.clientName}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold">
                                                    <span className="text-slate-400">
                                                        Total Tagihan:
                                                    </span>
                                                    <span className="font-mono text-slate-900">
                                                        {fmt(fin.totalInvoice)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── VIEW 3: TABEL LIST ── */}
                {viewMode === 'table' && (
                    <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                        {totalItems === 0 ? (
                            <EmptyState
                                title="Proyek Tidak Ditemukan"
                                description="Tidak ada data proyek billboard yang cocok dengan pencarian atau filter Anda."
                            />
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/40 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                <th className="px-6 py-4">
                                                    Kode & Proyek
                                                </th>
                                                <th className="px-6 py-4">
                                                    Client & Sales
                                                </th>
                                                <th className="px-6 py-4">
                                                    Periode
                                                </th>
                                                <th className="px-6 py-4 text-center">
                                                    Titik Lokasi
                                                </th>
                                                <th className="px-6 py-4 text-right">
                                                    Nilai Kontrak
                                                </th>
                                                <th className="px-6 py-4 text-right">
                                                    Estimasi Laba
                                                </th>
                                                <th className="px-6 py-4 text-center">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-center">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                            {paginatedProjects.map(
                                                (project, idx) => {
                                                    const isNearBottom =
                                                        idx >=
                                                        paginatedProjects.length -
                                                            2;
                                                    const fin = calcFinancials(
                                                        project,
                                                        project.locations,
                                                        fiscalMode,
                                                    );
                                                    const poProgress =
                                                        project.locations
                                                            .length > 0
                                                            ? project.locations.filter(
                                                                  (l) =>
                                                                      l.poIssued,
                                                              ).length /
                                                              project.locations
                                                                  .length
                                                            : 0;

                                                    return (
                                                        <tr
                                                            key={project.id}
                                                            className="transition-colors hover:bg-slate-50/50"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-600">
                                                                        {
                                                                            project.code
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 font-bold text-slate-800">
                                                                    {
                                                                        project.name
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-xs font-bold text-slate-800">
                                                                    {
                                                                        project.clientName
                                                                    }
                                                                </div>
                                                                <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                                    PIC:{' '}
                                                                    {
                                                                        project.salesPIC
                                                                    }
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-600">
                                                                {project.period}
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                <div className="text-xs font-bold text-slate-800">
                                                                    {
                                                                        project
                                                                            .locations
                                                                            .length
                                                                    }{' '}
                                                                    Titik
                                                                </div>
                                                                <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                                    {Math.round(
                                                                        poProgress *
                                                                            100,
                                                                    )}
                                                                    % PO Terbit
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                                <div>
                                                                    {fmt(
                                                                        fin.totalInvoice,
                                                                    )}
                                                                </div>
                                                                {isPPN && (
                                                                    <div className="text-[10px] font-semibold text-slate-400">
                                                                        DPP:{' '}
                                                                        {fmt(
                                                                            fin.dpp,
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-bold">
                                                                <div
                                                                    className={
                                                                        fin.netProfit >=
                                                                        0
                                                                            ? 'text-emerald-600'
                                                                            : 'text-rose-600'
                                                                    }
                                                                >
                                                                    {fmt(
                                                                        fin.netProfit,
                                                                    )}
                                                                </div>
                                                                <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                                    {fin.margin.toFixed(
                                                                        1,
                                                                    )}
                                                                    % margin
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                <StatusBadge
                                                                    status={
                                                                        project.status
                                                                    }
                                                                />
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                                <ActionDropdown
                                                                    direction={
                                                                        isNearBottom
                                                                            ? 'up'
                                                                            : 'down'
                                                                    }
                                                                    items={[
                                                                        {
                                                                            label: 'Kelola Detail Proyek',
                                                                            icon: (
                                                                                <svg
                                                                                    className="h-3.5 w-3.5 text-slate-500"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                    />
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                                    />
                                                                                </svg>
                                                                            ),
                                                                            onClick:
                                                                                () =>
                                                                                    router.visit(
                                                                                        route(
                                                                                            'projects.show',
                                                                                            project.id,
                                                                                        ),
                                                                                    ),
                                                                        },
                                                                    ]}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={(page) =>
                                        setCurrentPage(page)
                                    }
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* Create Project Modal */}
                <Modal
                    show={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    maxWidth="lg"
                >
                    <div className="space-y-5 p-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                Buat Proyek Kampanye Baru
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit(onCreateProject)}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Nama Proyek / Kampanye{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                    placeholder="Kampanye Iklan Film Toystory 5..."
                                />
                                {errors.name && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.name.message}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Client / Pengiklan{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <Controller
                                    control={control}
                                    name="clientId"
                                    render={({ field }) => (
                                        <SelectInput
                                            value={field.value}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Client --
                                            </option>
                                            {clients.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </SelectInput>
                                    )}
                                />
                                {errors.clientId && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.clientId.message}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Sales PIC
                                </label>
                                <Controller
                                    control={control}
                                    name="salesId"
                                    render={({ field }) => (
                                        <SelectInput
                                            value={field.value}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Sales PIC --
                                            </option>
                                            {sales.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </SelectInput>
                                    )}
                                />
                                {errors.salesId && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.salesId.message}
                                    </span>
                                )}
                            </div>

                            {/* Periode Kampanye (Date Range) */}
                            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                                        <svg
                                            className="h-4 w-4 text-blue-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        Periode Kampanye{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    {periodInfo.duration && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                                            <svg
                                                className="h-3 w-3 text-blue-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            {periodInfo.duration}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Tanggal Mulai
                                        </span>
                                        <input
                                            type="date"
                                            {...register('startDate')}
                                            onClick={(e) => {
                                                if (
                                                    'showPicker' in
                                                    HTMLInputElement.prototype
                                                ) {
                                                    try {
                                                        (
                                                            e.target as HTMLInputElement
                                                        ).showPicker();
                                                    } catch (err) {
                                                        // ignore
                                                    }
                                                }
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Tanggal Selesai
                                        </span>
                                        <input
                                            type="date"
                                            {...register('endDate')}
                                            onClick={(e) => {
                                                if (
                                                    'showPicker' in
                                                    HTMLInputElement.prototype
                                                ) {
                                                    try {
                                                        (
                                                            e.target as HTMLInputElement
                                                        ).showPicker();
                                                    } catch (err) {}
                                                }
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {(errors.startDate || errors.endDate) && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.startDate?.message ||
                                            errors.endDate?.message}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Jumlah Titik Lokasi{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    {...register('targetQty')}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                                />
                                {errors.targetQty && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.targetQty.message}
                                    </span>
                                )}
                            </div>

                            {/* Switch Tax Mode & Input Nilai Kontrak */}
                            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
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
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Nilai Kontrak{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    {/* Mode Switch Pills (Hanya jika PPN aktif) */}
                                    {isPPN && (
                                        <Controller
                                            control={control}
                                            name="taxMode"
                                            render={({ field }) => (
                                                <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                'dpp',
                                                            )
                                                        }
                                                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                                            field.value ===
                                                            'dpp'
                                                                ? 'shadow-2xs bg-white font-black text-blue-700'
                                                                : 'text-slate-500 hover:text-slate-800'
                                                        }`}
                                                    >
                                                        Belum PPN (DPP)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            field.onChange(
                                                                'inc',
                                                            )
                                                        }
                                                        className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                                            field.value ===
                                                            'inc'
                                                                ? 'shadow-2xs bg-primary font-black text-white'
                                                                : 'text-slate-500 hover:text-slate-800'
                                                        }`}
                                                    >
                                                        Sudah Inc. PPN (11%)
                                                    </button>
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>

                                <Controller
                                    control={control}
                                    name="contractValue"
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            value={field.value}
                                            onChange={(e) => {
                                                const raw =
                                                    e.target.value.replace(
                                                        /[^0-9]/g,
                                                        '',
                                                    );
                                                const formatted = raw
                                                    ? parseInt(
                                                          raw,
                                                          10,
                                                      ).toLocaleString('id-ID')
                                                    : '';
                                                field.onChange(formatted);
                                            }}
                                            className="shadow-2xs w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm font-bold text-slate-800 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder={
                                                isPPN
                                                    ? watchedTaxMode === 'inc'
                                                        ? 'Masukkan Nilai Total (Sudah Inc PPN 11%)...'
                                                        : 'Masukkan Nilai DPP (Sebelum PPN)...'
                                                    : 'Masukkan Nilai Total Kontrak...'
                                            }
                                        />
                                    )}
                                />
                                {errors.contractValue && (
                                    <span className="mt-1 block text-[10px] font-bold uppercase text-rose-500">
                                        {errors.contractValue.message}
                                    </span>
                                )}

                                {/* Live Calculations Breakdown Card */}
                                {isPPN && parsedRawValue > 0 && (
                                    <div className="space-y-1.5 rounded-xl border border-blue-100/90 bg-blue-50/80 p-3 text-xs">
                                        <div className="flex items-center justify-between text-slate-600">
                                            <span className="text-[11px] font-medium">
                                                Nilai DPP (Dasar Pajak)
                                            </span>
                                            <span className="font-mono font-bold text-slate-900">
                                                {fmt(computedFinancials.dpp)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-violet-700">
                                            <span className="text-[11px] font-medium">
                                                PPN Keluaran (11%)
                                            </span>
                                            <span className="font-mono font-bold">
                                                {fmt(computedFinancials.ppn)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-blue-200/60 pt-1 font-bold text-slate-900">
                                            <span className="text-[11px]">
                                                Total Tagihan Client
                                            </span>
                                            <span className="font-mono text-xs font-black text-blue-700">
                                                {fmt(computedFinancials.total)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting
                                        ? 'Menyimpan...'
                                        : 'Simpan Draft Proyek'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
