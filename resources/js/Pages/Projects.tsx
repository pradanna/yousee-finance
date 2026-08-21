import PrimaryButton from '@/Components/Button/PrimaryButton';
import MetricCard from '@/Components/Card/MetricCard';
import MonthPicker from '@/Components/Form/MonthPicker';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import AuditLogModal, { AuditLogItem } from '@/Components/UI/AuditLogModal';
import Modal from '@/Components/UI/Modal';
import Toast, { ToastType } from '@/Components/UI/Toast';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    CreateProjectFormData,
    createProjectSchema,
} from './Projects/createProjectSchema';
import { StatusBadge } from './Projects/Show';

import { formatPeriod } from '@/Utils/formatters';
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
            sales?: { id: string; name: string; commission_rate?: number };
            sales_pic?: string;
            sales_commission_rate?: number;
            fiscal_mode: 'ppn' | 'non-ppn';
            start_date: string;
            end_date: string;
            created_at?: string;
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
            purchase_orders?: Array<{
                id: string;
                po_number: string;
                vendor_id: string;
                total: number | string;
                status?: string;
                payment_plan?: {
                    id: string;
                    scheme?: string;
                    total_amount?: number | string;
                    terms?: Array<{
                        id: string;
                        label: string;
                        amount: number | string;
                        percent: number | string;
                        status: string;
                        settlements?: Array<{
                            id: string;
                            amount: number | string;
                        }>;
                    }>;
                } | null;
            }>;
            invoices?: Array<{
                id: string;
                invoice_number?: string;
                status?: string;
                subtotal: number | string;
                ppn: number | string;
                total: number | string;
                payment_plan?: {
                    id: string;
                    scheme?: string;
                    total_amount?: number | string;
                    terms?: Array<{
                        id: string;
                        label: string;
                        amount: number | string;
                        percent: number | string;
                        status: string;
                    }>;
                } | null;
            }>;
            invoice_issued?: boolean;
            invoice_number?: string;
        }>;
        links: Array<{ url: string | null; label: string; active: boolean }>;
        meta?: Record<string, unknown>;
    };
    clients: ClientOption[];
    sales: SalesOption[];
    vendors?: VendorOption[];
    auditLogs?: AuditLogItem[];
    filters?: {
        client_id?: string;
        sales_id?: string;
        search?: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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
            barClass: 'bg-emerald-500',
            textClass: 'text-emerald-600 font-bold',
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
            barClass: 'bg-emerald-500',
            textClass: 'text-emerald-600 font-bold',
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

function isProjectCompleted(
    p: ProjectsPageProps['projects']['data'][number],
): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPeriodPassed = p.end_date ? today > new Date(p.end_date) : false;

    const poList = p.purchase_orders || [];
    const isAllPoPaid =
        poList.length > 0 &&
        poList.every((po) => {
            const terms = po.payment_plan?.terms || [];
            if (terms.length > 0) {
                return terms.every((t) => t.status === 'paid');
            }
            return po.status === 'completed' || po.status === 'paid';
        });

    const invList = p.invoices || [];
    const isAllInvoicesPaid =
        invList.length > 0 &&
        invList.every((inv) => {
            const terms = inv.payment_plan?.terms || [];
            if (terms.length > 0) {
                return terms.every((t) => t.status === 'paid');
            }
            return inv.status === 'paid';
        });

    return (
        p.status === 'completed' ||
        (isPeriodPassed && isAllPoPaid && isAllInvoicesPaid)
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Projects Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Projects({
    projects: paginatedProjectsData,
    clients,
    sales,
    vendors,
    auditLogs = [],
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

                let derivedStatus: Project['status'] =
                    statusMap[p.status] || 'Draft';
                if (isProjectCompleted(p)) {
                    derivedStatus = 'Completed';
                }

                // Hitung total realisasi pembayaran yang sudah terjadi di proyek ini
                let totalPaidAmount = 0;
                let hasPaymentRealized = false;

                // Cek pembayaran PO vendor (settlements)
                (p.purchase_orders || []).forEach((po) => {
                    (po.payment_plan?.terms || []).forEach((term) => {
                        (term.settlements || []).forEach((st) => {
                            const val = Number(st.amount) || 0;
                            if (val > 0) {
                                totalPaidAmount += val;
                                hasPaymentRealized = true;
                            }
                        });
                    });
                });

                // Cek pembayaran Invoice client
                (p.invoices || []).forEach((inv) => {
                    if (inv.status === 'paid') {
                        hasPaymentRealized = true;
                        totalPaidAmount += Number(inv.total) || 0;
                    }
                    (inv.payment_plan?.terms || []).forEach((t) => {
                        if (t.status === 'paid') {
                            hasPaymentRealized = true;
                            totalPaidAmount += Number(t.amount) || 0;
                        }
                    });
                });

                return {
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    clientId: p.client_id,
                    clientName: p.client?.name ?? p.client_name ?? '-',
                    salesId: p.sales_id ?? p.sales?.id ?? undefined,
                    salesPIC: p.sales?.name ?? p.sales_pic ?? '-',
                    salesCommissionRate: Number(
                        p.sales_commission_rate ??
                            p.sales?.commission_rate ??
                            0,
                    ),
                    period:
                        periodObj.label || `${p.start_date} - ${p.end_date}`,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    createdAt: p.created_at,
                    contractValue: Number(p.contract_value) || 0,
                    status: derivedStatus,
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
                    hasPayments: hasPaymentRealized,
                    totalPaid: totalPaidAmount,
                };
            });
    }, [paginatedProjectsData, isPPN]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');
    const [salesFilter, setSalesFilter] = useState<string>('all');
    const [filterBasis, setFilterBasis] = useState<
        'active_period' | 'start_date' | 'created_at'
    >('created_at');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Extract available years dynamically from projects
    const availableYears = useMemo<string[]>(() => {
        const yearsSet = new Set<string>();
        projects.forEach((p) => {
            if (p.createdAt) yearsSet.add(p.createdAt.substring(0, 4));
            if (p.startDate) yearsSet.add(p.startDate.substring(0, 4));
            if (p.endDate) yearsSet.add(p.endDate.substring(0, 4));
        });
        const currentYear = String(new Date().getFullYear());
        yearsSet.add(currentYear);
        return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    }, [projects]);

    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

    // Toast state
    const [projectToCancel, setProjectToCancel] = useState<Project | null>(
        null,
    );
    const [isCancelling, setIsCancelling] = useState(false);
    const [errorDialog, setErrorDialog] = useState<{
        show: boolean;
        title: string;
        message: string;
    }>({
        show: false,
        title: '',
        message: '',
    });
    const [toast, setToast] = useState<{
        show: boolean;
        type: ToastType;
        title?: string;
        message: string;
    }>({
        show: false,
        type: 'success',
        message: '',
    });

    const handleConfirmCancelProject = () => {
        if (!projectToCancel) return;
        setIsCancelling(true);
        router.delete(route('projects.destroy', projectToCancel.id), {
            preserveScroll: true,
            onSuccess: () => {
                triggerToast(
                    `Proyek "${projectToCancel.name}" berhasil dibatalkan.`,
                    'success',
                    'Proyek Dibatalkan',
                );
                setProjectToCancel(null);
                setIsCancelling(false);
            },
            onError: (errs) => {
                const errorMessage =
                    (typeof errs.error === 'string' && errs.error) ||
                    (typeof errs.message === 'string' && errs.message) ||
                    Object.values(errs)[0] ||
                    'Proyek tidak dapat dibatalkan karena tidak memenuhi syarat pembatalan.';

                setProjectToCancel(null);
                setIsCancelling(false);
                setErrorDialog({
                    show: true,
                    title: 'Pembatalan Proyek Ditolak',
                    message: String(errorMessage),
                });
            },
        });
    };

    const triggerToast = (
        message: string,
        type: ToastType = 'success',
        title?: string,
    ) => {
        setToast({
            show: true,
            type,
            title,
            message,
        });
    };

    // Flash Message Listener
    const { flash } =
        usePage<PageProps<{ flash?: { success?: string; error?: string } }>>()
            .props;

    useEffect(() => {
        if (flash?.success) {
            triggerToast(flash.success, 'success', 'Operasi Berhasil');
        } else if (flash?.error) {
            triggerToast(flash.error, 'error', 'Operasi Gagal');
        }
    }, [flash]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        setValue,
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

    const handleOpenCreateProject = () => {
        setProjectToEdit(null);
        reset({
            name: '',
            clientId: '',
            salesId: '',
            startDate: '',
            endDate: '',
            targetQty: '1',
            contractValue: '',
            taxMode: 'dpp',
        });
        setIsCreateOpen(true);
    };

    const handleOpenEditProject = (proj: Project) => {
        setProjectToEdit(proj);
        reset({
            name: proj.name,
            clientId: proj.clientId,
            salesId: proj.salesId || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
            targetQty: String(proj.targetQty || 1),
            contractValue: proj.contractValue
                ? Math.round(proj.contractValue).toLocaleString('id-ID')
                : '',
            taxMode: 'dpp',
        });
        setIsCreateOpen(true);
    };

    const watchedStartDate = watch('startDate');
    const watchedEndDate = watch('endDate');
    const watchedContractValue = watch('contractValue');
    const watchedTaxMode = watch('taxMode');

    const periodInfo = useMemo(() => {
        return formatPeriod(watchedStartDate, watchedEndDate);
    }, [watchedStartDate, watchedEndDate]);

    // Live calculations for Create / Edit Project modal
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

    const onSubmitProject = (data: CreateProjectFormData) => {
        const rawContractValue =
            parseInt(data.contractValue.replace(/[^0-9]/g, ''), 10) || 0;

        if (projectToEdit) {
            // Edit existing project
            router.put(
                route('projects.update', projectToEdit.id),
                {
                    name: data.name,
                    client_id: data.clientId,
                    sales_id: data.salesId || undefined,
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
                        setProjectToEdit(null);
                        reset();
                        triggerToast(
                            `Proyek "${data.name}" berhasil diperbarui.`,
                            'success',
                            'Proyek Diperbarui',
                        );
                    },
                    onError: (serverErrors) => {
                        Object.entries(serverErrors).forEach(
                            ([key, message]) => {
                                const field = SERVER_ERROR_FIELD_MAP[key];
                                if (field) {
                                    setError(field, { message });
                                }
                            },
                        );
                        const firstError = Object.values(serverErrors)[0];
                        if (firstError) {
                            triggerToast(
                                String(firstError),
                                'error',
                                'Gagal Memperbarui Proyek',
                            );
                        }
                    },
                },
            );
        } else {
            // Create new project
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
                        triggerToast(
                            `Proyek "${data.name}" berhasil dibuat.`,
                            'success',
                            'Proyek Dibuat',
                        );
                    },
                    onError: (serverErrors) => {
                        Object.entries(serverErrors).forEach(
                            ([key, message]) => {
                                const field = SERVER_ERROR_FIELD_MAP[key];
                                if (field) {
                                    setError(field, { message });
                                }
                            },
                        );
                        const firstError = Object.values(serverErrors)[0];
                        if (firstError) {
                            triggerToast(
                                String(firstError),
                                'error',
                                'Gagal Membuat Proyek',
                            );
                        }
                    },
                },
            );
        }
    };

    const handleUpdateProject = (_updated?: Project) => {
        router.reload();
    };

    // Helper: Filter by Period Basis
    const periodFilteredProjects = useMemo(() => {
        if (filterYear === 'all' && filterMonth === 'all') {
            return projects;
        }

        return projects.filter((p) => {
            const startStr = p.startDate || '';
            const endStr = p.endDate || startStr;

            if (filterBasis === 'start_date') {
                if (!startStr) return false;
                const pYear = startStr.substring(0, 4);
                const pMonth = startStr.substring(5, 7);
                const matchesYear =
                    filterYear === 'all' || pYear === filterYear;
                const matchesMonth =
                    filterMonth === 'all' ||
                    pMonth === filterMonth.padStart(2, '0');
                return matchesYear && matchesMonth;
            }

            if (filterBasis === 'created_at') {
                const dateRef = p.createdAt || startStr;
                if (!dateRef) return false;
                const pYear = dateRef.substring(0, 4);
                const pMonth = dateRef.substring(5, 7);
                const matchesYear =
                    filterYear === 'all' || pYear === filterYear;
                const matchesMonth =
                    filterMonth === 'all' ||
                    pMonth === filterMonth.padStart(2, '0');
                return matchesYear && matchesMonth;
            }

            // Default: 'active_period' (Overlap test)
            const targetYear = filterYear === 'all' ? null : Number(filterYear);
            const targetMonth =
                filterMonth === 'all' ? null : Number(filterMonth);

            let periodStart: string;
            let periodEnd: string;

            if (targetYear && targetMonth) {
                const monthStr = String(targetMonth).padStart(2, '0');
                const lastDay = new Date(targetYear, targetMonth, 0).getDate();
                periodStart = `${targetYear}-${monthStr}-01`;
                periodEnd = `${targetYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
            } else if (targetYear) {
                periodStart = `${targetYear}-01-01`;
                periodEnd = `${targetYear}-12-31`;
            } else if (targetMonth) {
                const currentYear = new Date().getFullYear();
                const monthStr = String(targetMonth).padStart(2, '0');
                const lastDay = new Date(currentYear, targetMonth, 0).getDate();
                periodStart = `${currentYear}-${monthStr}-01`;
                periodEnd = `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
            } else {
                return true;
            }

            // Overlap condition: (p.start <= periodEnd) && (p.end >= periodStart)
            return (
                (!startStr || startStr <= periodEnd) &&
                (!endStr || endStr >= periodStart)
            );
        });
    }, [projects, filterBasis, filterYear, filterMonth]);

    // Metrics calculation — adapts dynamically to period filter
    const totalActiveProjects = useMemo(() => {
        return periodFilteredProjects.filter((p) => p.status === 'Active')
            .length;
    }, [periodFilteredProjects]);

    const totalContractValue = useMemo(() => {
        return periodFilteredProjects.reduce(
            (acc, p) => acc + p.contractValue,
            0,
        );
    }, [periodFilteredProjects]);

    const totalEstimatedProfit = useMemo(() => {
        return periodFilteredProjects.reduce((acc, p) => {
            const fin = calcFinancials(p, p.locations, fiscalMode);
            return acc + fin.netProfit;
        }, 0);
    }, [periodFilteredProjects, fiscalMode]);

    // Filtering + sort by tanggal mulai tayang (ascending)
    const filteredProjects = useMemo(() => {
        const filtered = periodFilteredProjects.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClient =
                clientFilter === 'all' || p.clientId === clientFilter;

            const matchesSales =
                salesFilter === 'all' ||
                p.salesId === salesFilter ||
                p.salesPIC.toLowerCase() === salesFilter.toLowerCase();

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && p.status === 'Active') ||
                (statusFilter === 'draft' && p.status === 'Draft') ||
                (statusFilter === 'completed' && p.status === 'Completed') ||
                (statusFilter === 'cancelled' && p.status === 'Cancelled') ||
                (statusFilter === 'pending_po' &&
                    p.locations.some((l) => !l.poIssued)) ||
                (statusFilter === 'no_invoice' && !p.invoiceIssued);

            return (
                matchesSearch && matchesClient && matchesSales && matchesStatus
            );
        });

        // Sort priority
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getTayangGroup = (p: Project): number => {
            if (p.status === 'Completed' || p.status === 'Cancelled') return 3;
            const parsed = parsePeriod(p.period);
            if (!parsed) return 2;
            if (today < parsed.start) return 1;
            if (today > parsed.end) return 3;
            return 2;
        };

        return filtered.sort((a, b) => {
            const groupA = getTayangGroup(a);
            const groupB = getTayangGroup(b);
            if (groupA !== groupB) return groupA - groupB;

            const parsedA = parsePeriod(a.period);
            const parsedB = parsePeriod(b.period);

            if (groupA === 1) {
                const tA = parsedA ? parsedA.start.getTime() : Infinity;
                const tB = parsedB ? parsedB.start.getTime() : Infinity;
                return tA - tB;
            }
            if (groupA === 2) {
                const tA = parsedA ? parsedA.end.getTime() : Infinity;
                const tB = parsedB ? parsedB.end.getTime() : Infinity;
                return tA - tB;
            }
            const tA = parsedA ? parsedA.start.getTime() : 0;
            const tB = parsedB ? parsedB.start.getTime() : 0;
            return tB - tA;
        });
    }, [
        periodFilteredProjects,
        searchQuery,
        clientFilter,
        salesFilter,
        statusFilter,
    ]);

    // Subset filtered by client and sales (for status pill counts)
    const baseClientSalesFiltered = useMemo(() => {
        return periodFilteredProjects.filter((p) => {
            const matchesSearch =
                !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesClient =
                clientFilter === 'all' || p.clientId === clientFilter;

            const matchesSales =
                salesFilter === 'all' ||
                p.salesId === salesFilter ||
                p.salesPIC.toLowerCase() === salesFilter.toLowerCase();

            return matchesSearch && matchesClient && matchesSales;
        });
    }, [periodFilteredProjects, searchQuery, clientFilter, salesFilter]);

    // Counts computed from period & client & sales filtered projects for the status tabs
    const countAll = baseClientSalesFiltered.length;
    const countActive = baseClientSalesFiltered.filter(
        (p) => p.status === 'Active',
    ).length;
    const countDraft = baseClientSalesFiltered.filter(
        (p) => p.status === 'Draft',
    ).length;
    const countCompleted = baseClientSalesFiltered.filter(
        (p) => p.status === 'Completed',
    ).length;
    const countCancelled = baseClientSalesFiltered.filter(
        (p) => p.status === 'Cancelled',
    ).length;
    const countPendingPO = baseClientSalesFiltered.filter((p) =>
        p.locations.some((l) => !l.poIssued),
    ).length;
    const countNoInvoice = baseClientSalesFiltered.filter(
        (p) => !p.invoiceIssued,
    ).length;

    // Pagination
    const totalItems = filteredProjects.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const paginatedProjects = useMemo(() => {
        return filteredProjects.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage,
        );
    }, [filteredProjects, currentPage, itemsPerPage]);

    const monthOptions = [
        { value: 'all', label: 'Semua Bulan' },
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const basisLabels = {
        active_period: 'Masa Tayang Aktif',
        start_date: 'Bulan Mulai (Start Date)',
        created_at: 'Tanggal Dibuat',
    };

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

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsAuditLogModalOpen(true)}
                            className="shadow-xs inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                        >
                            <svg
                                className="h-4 w-4 text-slate-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span>Log Aktivitas Proyek</span>
                        </button>

                        <PrimaryButton onClick={handleOpenCreateProject}>
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
                </div>

                {/* Metric Summary Grid — Di Atas, Nilai Menyesuaikan Filter */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <MetricCard
                        title="Proyek Aktif"
                        value={`${totalActiveProjects} Proyek`}
                        badgeText={
                            filterYear !== 'all' || filterMonth !== 'all'
                                ? `Filter Periode`
                                : `Proyek Berjalan`
                        }
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
                        badgeText={
                            filterBasis === 'active_period'
                                ? 'Masa Tayang'
                                : basisLabels[filterBasis]
                        }
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

                {/* Filter & Fast Status Pills Bar */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4">
                    {/* Top Row: Search Input, Client Filter, Sales Filter, Period Basis & Month Picker */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                        {/* Search Input (Lebih Ringkas) */}
                        <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Cari Proyek
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
                                    placeholder="Cari kode/nama..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="block w-full pl-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* Client Filter Dropdown */}
                        <div className="space-y-1 sm:col-span-1 lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Client
                            </label>
                            <SelectInput
                                value={clientFilter}
                                onChange={(e) => {
                                    setClientFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Client' },
                                    ...clients.map((c) => ({
                                        value: c.id,
                                        label: c.name,
                                    })),
                                ]}
                            />
                        </div>

                        {/* Sales Filter Dropdown */}
                        <div className="space-y-1 sm:col-span-1 lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Sales PIC
                            </label>
                            <SelectInput
                                value={salesFilter}
                                onChange={(e) => {
                                    setSalesFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Sales' },
                                    ...sales.map((s) => ({
                                        value: s.id,
                                        label: s.name,
                                    })),
                                ]}
                            />
                        </div>

                        {/* Filter Basis Selector */}
                        <div className="space-y-1 sm:col-span-1 lg:col-span-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Acuan Periode
                            </label>
                            <SelectInput
                                value={filterBasis}
                                onChange={(e) => {
                                    setFilterBasis(
                                        e.target.value as
                                            | 'active_period'
                                            | 'start_date'
                                            | 'created_at',
                                    );
                                    setCurrentPage(1);
                                }}
                                options={[
                                    {
                                        value: 'created_at',
                                        label: 'Tanggal Dibuat',
                                    },
                                    {
                                        value: 'active_period',
                                        label: 'Masa Tayang',
                                    },
                                    {
                                        value: 'start_date',
                                        label: 'Bulan Mulai',
                                    },
                                ]}
                            />
                        </div>

                        {/* Month & Year Picker Component */}
                        <div className="space-y-1 sm:col-span-1 lg:col-span-3">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Bulan & Tahun
                            </label>
                            <MonthPicker
                                value={
                                    filterYear !== 'all' &&
                                    filterMonth !== 'all'
                                        ? `${filterYear}-${filterMonth.padStart(2, '0')}`
                                        : 'all'
                                }
                                onChange={(val, yr, mo) => {
                                    setFilterYear(yr);
                                    setFilterMonth(
                                        mo === 'all'
                                            ? 'all'
                                            : String(Number(mo)),
                                    );
                                    setCurrentPage(1);
                                }}
                                allowAll={true}
                                allLabel="Semua Periode"
                                className="w-full [&>button]:w-full [&>button]:justify-between"
                            />
                        </div>
                    </div>

                    {/* Bottom Row: Interactive Status Pills Navigation & View Switcher */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {[
                                { key: 'all', label: `Semua (${countAll})` },
                                {
                                    key: 'draft',
                                    label: `Draft (${countDraft})`,
                                },
                                {
                                    key: 'pending_po',
                                    label: `Pending PO (${countPendingPO})`,
                                },
                                {
                                    key: 'no_invoice',
                                    label: `Invoicing (${countNoInvoice})`,
                                },
                                {
                                    key: 'active',
                                    label: `Aktif (${countActive})`,
                                },
                                {
                                    key: 'completed',
                                    label: `Selesai (${countCompleted})`,
                                },
                                {
                                    key: 'cancelled',
                                    label: `Dibatalkan (${countCancelled})`,
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
                                                ? 'shadow-2xs border-primary/30 bg-primary/10 ring-primary/30 font-extrabold text-primary ring-1'
                                                : 'border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {pill.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* View Switcher Segmented Control (Dipindah ke Bawah) */}
                        <div className="flex shrink-0 items-center justify-end">
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
                                    <span>Grid</span>
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
                                                {/* Card Header Badges & Actions */}
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
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <StatusBadge
                                                            status={
                                                                project.status
                                                            }
                                                        />
                                                        <ActionDropdown
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
                                                                {
                                                                    label: 'Edit Proyek',
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
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenEditProject(
                                                                                project,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Batalkan Proyek',
                                                                    variant:
                                                                        'danger',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-rose-500"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            setProjectToCancel(
                                                                                project,
                                                                            ),
                                                                },
                                                            ]}
                                                        />
                                                    </div>
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
                                                        {isPPN
                                                            ? 'NET PPN'
                                                            : 'NET'}
                                                    </span>
                                                    <div className="mt-0.5 flex items-center justify-end gap-1.5">
                                                        <span
                                                            className={`font-mono text-xs font-bold ${
                                                                (isPPN
                                                                    ? fin.ppnNet
                                                                    : fin.netProfit) >=
                                                                0
                                                                    ? 'text-emerald-600'
                                                                    : 'text-rose-600'
                                                            }`}
                                                        >
                                                            {fmt(
                                                                isPPN
                                                                    ? fin.ppnNet
                                                                    : fin.netProfit,
                                                            )}
                                                        </span>
                                                        {!isPPN && (
                                                            <span
                                                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                                                    fin.margin >=
                                                                    30
                                                                        ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                                                                        : 'border border-amber-100 bg-amber-50 text-amber-700'
                                                                }`}
                                                            >
                                                                {fin.margin.toFixed(
                                                                    0,
                                                                )}
                                                                %
                                                            </span>
                                                        )}
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
                                        filteredProjects.filter(
                                            (p) => p.status === 'Draft',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {filteredProjects
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
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <span className="text-[10px] font-semibold text-slate-400">
                                                            {project.period}
                                                        </span>
                                                        <ActionDropdown
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
                                                                {
                                                                    label: 'Edit Proyek',
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
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenEditProject(
                                                                                project,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Batalkan Proyek',
                                                                    variant:
                                                                        'danger',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-rose-500"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            setProjectToCancel(
                                                                                project,
                                                                            ),
                                                                },
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                                <h4 className="text-xs font-bold leading-snug text-slate-800">
                                                    {project.name}
                                                </h4>
                                                <div className="text-[10px] font-semibold text-slate-500">
                                                    {project.clientName}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold">
                                                    <span className="text-slate-400">
                                                        Tagihan:
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
                                        filteredProjects.filter(
                                            (p) => p.status === 'Active',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {filteredProjects
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
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                                            Aktif
                                                        </span>
                                                        <ActionDropdown
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
                                                                {
                                                                    label: 'Edit Proyek',
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
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenEditProject(
                                                                                project,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Batalkan Proyek',
                                                                    variant:
                                                                        'danger',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-rose-500"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            setProjectToCancel(
                                                                                project,
                                                                            ),
                                                                },
                                                            ]}
                                                        />
                                                    </div>
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
                                                        {isPPN
                                                            ? 'NET PPN:'
                                                            : 'NET:'}
                                                    </span>
                                                    <span
                                                        className={`font-mono ${
                                                            (isPPN
                                                                ? fin.ppnNet
                                                                : fin.netProfit) >=
                                                            0
                                                                ? 'text-emerald-600'
                                                                : 'text-rose-600'
                                                        }`}
                                                    >
                                                        {fmt(
                                                            isPPN
                                                                ? fin.ppnNet
                                                                : fin.netProfit,
                                                        )}
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
                                        filteredProjects.filter(
                                            (p) => p.status === 'Completed',
                                        ).length
                                    }
                                </span>
                            </div>

                            <div className="space-y-3">
                                {filteredProjects
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
                                                    <div
                                                        className="flex items-center gap-1.5"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                                            Selesai
                                                        </span>
                                                        <ActionDropdown
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
                                                                {
                                                                    label: 'Edit Proyek',
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
                                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            handleOpenEditProject(
                                                                                project,
                                                                            ),
                                                                },
                                                                {
                                                                    label: 'Batalkan Proyek',
                                                                    variant:
                                                                        'danger',
                                                                    icon: (
                                                                        <svg
                                                                            className="h-3.5 w-3.5 text-rose-500"
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
                                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                            />
                                                                        </svg>
                                                                    ),
                                                                    onClick:
                                                                        () =>
                                                                            setProjectToCancel(
                                                                                project,
                                                                            ),
                                                                },
                                                            ]}
                                                        />
                                                    </div>
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
                                                                        {
                                                                            label: 'Edit Proyek',
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
                                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                                    />
                                                                                </svg>
                                                                            ),
                                                                            onClick:
                                                                                () =>
                                                                                    handleOpenEditProject(
                                                                                        project,
                                                                                    ),
                                                                        },
                                                                        {
                                                                            label: 'Batalkan Proyek',
                                                                            variant:
                                                                                'danger',
                                                                            icon: (
                                                                                <svg
                                                                                    className="h-3.5 w-3.5 text-rose-500"
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
                                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                                    />
                                                                                </svg>
                                                                            ),
                                                                            onClick:
                                                                                () =>
                                                                                    setProjectToCancel(
                                                                                        project,
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

                {/* Create / Edit Project Modal */}
                <Modal
                    show={isCreateOpen}
                    onClose={() => {
                        setIsCreateOpen(false);
                        setProjectToEdit(null);
                    }}
                    maxWidth="lg"
                >
                    <div className="space-y-5 p-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                {projectToEdit
                                    ? `Edit Proyek: ${projectToEdit.name} (${projectToEdit.code})`
                                    : 'Buat Proyek Kampanye Baru'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreateOpen(false);
                                    setProjectToEdit(null);
                                }}
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
                            onSubmit={handleSubmit(onSubmitProject)}
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
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setProjectToEdit(null);
                                    }}
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
                                        : projectToEdit
                                          ? 'Simpan Perubahan'
                                          : 'Simpan Draft Proyek'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Confirm Cancel Project Modal */}
                <Modal
                    show={Boolean(projectToCancel)}
                    onClose={() => setProjectToCancel(null)}
                    maxWidth="md"
                >
                    <div className="space-y-4 p-6">
                        {projectToCancel?.status !== 'Draft' ||
                        projectToCancel?.hasPayments ? (
                            /* State Protected (Bukan Draft / Sudah Ada Pembayaran) */
                            <>
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                        <svg
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Proyek Tidak Dapat Dibatalkan
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Proyek{' '}
                                            <span className="font-bold text-slate-800">
                                                "{projectToCancel?.name}"
                                            </span>{' '}
                                            ({projectToCancel?.code}) tidak
                                            memenuhi syarat pembatalan.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900">
                                    <div className="flex items-center justify-between font-bold">
                                        <span>Status Proyek Saat Ini:</span>
                                        <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                                            {projectToCancel?.status ===
                                            'Active'
                                                ? 'Aktif (Sedang Tayang)'
                                                : projectToCancel?.status ===
                                                    'Completed'
                                                  ? 'Selesai (Completed)'
                                                  : projectToCancel?.status}
                                        </span>
                                    </div>

                                    {Boolean(
                                        projectToCancel?.totalPaid &&
                                        projectToCancel.totalPaid > 0,
                                    ) && (
                                        <div className="flex items-center justify-between border-t border-amber-200/60 pt-1.5 font-bold">
                                            <span>Realisasi Pembayaran:</span>
                                            <span className="font-mono text-amber-800">
                                                {fmt(
                                                    projectToCancel?.totalPaid ||
                                                        0,
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    <p className="border-t border-amber-200/60 pt-1 text-[11px] leading-relaxed text-amber-800/90">
                                        {projectToCancel?.status === 'Active'
                                            ? 'Proyek yang sedang tayang / berjalan memiliki komitmen sewa lokasi dan kewajiban biaya vendor yang sedang berlangsung sehingga tidak dapat dibatalkan secara langsung. Jika ingin berhenti di tengah jalan, gunakan mekanisme Selesai Lebih Awal / Revisi Kontrak.'
                                            : projectToCancel?.status ===
                                                'Completed'
                                              ? 'Proyek telah berstatus Selesai dan seluruh transaksi telah terarsip secara permanen dalam sistem akuntansi.'
                                              : 'Proyek yang telah memiliki mutasi kas atau transaksi jurnal tidak dapat dibatalkan demi menjaga integritas pembukuan dan neraca keuangan.'}
                                    </p>
                                </div>

                                <div className="flex justify-end border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setProjectToCancel(null)}
                                        className="shadow-xs cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                                    >
                                        Mengerti & Tutup
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* State Unprotected (Hanya Berstatus Draft & Belum Ada Pembayaran -> Boleh Dibatalkan) */
                            <>
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                                        <svg
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Batalkan Draft Proyek Billboard?
                                        </h3>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Tindakan ini akan membatalkan draft
                                            proyek{' '}
                                            <span className="font-bold text-slate-800">
                                                "{projectToCancel?.name}"
                                            </span>{' '}
                                            ({projectToCancel?.code}).
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-800">
                                    Proyek masih berstatus{' '}
                                    <strong>Draft</strong> dan belum memiliki
                                    mutasi kas. Membatalkan proyek akan
                                    mengarsipkan draft proyek ini secara aman.
                                </div>

                                <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setProjectToCancel(null)}
                                        disabled={isCancelling}
                                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Tutup
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmCancelProject}
                                        disabled={isCancelling}
                                        className="shadow-xs cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        {isCancelling
                                            ? 'Membatalkan...'
                                            : 'Ya, Batalkan Proyek'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>

                {/* Error / Warning Dialog Modal */}
                <Modal
                    show={errorDialog.show}
                    onClose={() =>
                        setErrorDialog((prev) => ({ ...prev, show: false }))
                    }
                    maxWidth="md"
                >
                    <div className="space-y-4 p-6">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    {errorDialog.title ||
                                        'Pembatalan Proyek Ditolak'}
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Sistem memproteksi penghapusan data ini.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-3.5 text-xs font-semibold leading-relaxed text-rose-900">
                            {errorDialog.message}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setErrorDialog((prev) => ({
                                        ...prev,
                                        show: false,
                                    }))
                                }
                                className="shadow-xs cursor-pointer rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800"
                            >
                                Mengerti & Tutup
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Modal Besar: Riwayat Lengkap Jejak Audit Proyek */}
                <AuditLogModal
                    show={isAuditLogModalOpen}
                    onClose={() => setIsAuditLogModalOpen(false)}
                    title="Jejak Audit Keamanan & Riwayat Aktivitas Proyek"
                    subtitle="Audit trail pembuatan proyek, perubahan nilai kontrak, perubahan masa tayang, dan pembatalan status"
                    logs={auditLogs || []}
                    eventOptions={[
                        { value: 'all', label: 'Semua Jenis Aktivitas' },
                        {
                            value: 'created',
                            label: '🟢 Proyek Dibuat (Created)',
                        },
                        {
                            value: 'updated',
                            label: '🟡 Pembaruan Data (Updated)',
                        },
                        {
                            value: 'status_changed',
                            label: '🔵 Perubahan Status (Status Changed)',
                        },
                        {
                            value: 'cancelled',
                            label: '🔴 Pembatalan Proyek (Cancelled)',
                        },
                    ]}
                />

                {/* Floating Toast Notification */}
                <Toast
                    show={toast.show}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() =>
                        setToast((prev) => ({ ...prev, show: false }))
                    }
                />
            </div>
        </AppLayout>
    );
}
