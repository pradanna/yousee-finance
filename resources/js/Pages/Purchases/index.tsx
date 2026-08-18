import MetricCard from '@/Components/Card/MetricCard';
import type { IssuePOModalSubmitData } from '@/Components/Modal/IssuePOModal';
import { IssuePOModal } from '@/Components/Modal/IssuePOModal';
import type { RecordPaymentModalSubmitData } from '@/Components/Modal/RecordPaymentModal';
import { RecordPaymentModal } from '@/Components/Modal/RecordPaymentModal';
import Pagination from '@/Components/Table/Pagination';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import type {
    BillboardLocation,
    PurchaseProject,
    PurchasesPageProps,
    VendorPO,
    VendorPaymentPlanDB,
    VendorPaymentRecord,
    VendorPaymentTerm,
    VendorPaymentTermDB,
} from './purchasesTypes';
import {
    PPN_RATE,
    fmt,
    formatDate,
    formatPeriod,
    getPOPaymentSummary,
} from './purchasesTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Purchases Page — Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Purchases({
    projects: rawProjects = [],
    cashBankAccounts = [],
}: PurchasesPageProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // Normalize rawProjects from DB
    const formattedProjects: PurchaseProject[] = useMemo(() => {
        return rawProjects.map((p) => {
            const periodObj = formatPeriod(p.start_date, p.end_date);
            const periodStr =
                p.period ||
                periodObj.label ||
                (p.start_date && p.end_date
                    ? `${p.start_date} - ${p.end_date}`
                    : '');

            const locs: BillboardLocation[] = (p.locations || []).map(
                (loc) => ({
                    id: loc.id,
                    code: loc.code,
                    area: loc.area,
                    description: loc.description,
                    type: loc.type || 'Billboard',
                    size: loc.size || '',
                    vendorId: loc.vendor_id ?? loc.vendorId ?? null,
                    vendorName:
                        loc.vendor?.name ??
                        loc.vendor_name ??
                        loc.vendorName ??
                        'Vendor',
                    qty: Number(loc.qty) || 1,
                    vendorCost:
                        Number(loc.vendor_cost ?? loc.vendorCost) || 0,
                    poIssued: Boolean(loc.po_issued ?? loc.poIssued),
                    poNumber: loc.po_number || loc.poNumber || '',
                    purchaseOrderId:
                        loc.purchase_order_id ?? loc.purchaseOrderId,
                }),
            );

            return {
                id: p.id,
                code: p.code,
                name: p.name,
                clientId: p.client_id ?? p.clientId,
                clientName:
                    p.client?.name ??
                    p.client_name ??
                    p.clientName ??
                    'Client',
                salesPIC:
                    p.sales?.name ??
                    p.sales_pic ??
                    p.salesPIC ??
                    '-',
                period: periodStr,
                contractValue:
                    Number(p.contract_value ?? p.contractValue) || 0,
                status: p.status || 'Draft',
                locations: locs,
                invoiceIssued: Boolean(p.invoice_issued ?? p.invoiceIssued),
                invoiceNumber: p.invoice_number || p.invoiceNumber || '',
                targetQty: Number(p.target_qty ?? p.targetQty) || 1,
                fiscal_mode: p.fiscal_mode,
                purchase_orders: p.purchase_orders || [],
            };
        });
    }, [rawProjects]);

    // Build real vendorPOs lookup map from project purchase_orders relation
    const vendorPOs: Record<string, VendorPO> = useMemo(() => {
        const map: Record<string, VendorPO> = {};

        formattedProjects.forEach((prj) => {
            (prj.purchase_orders || []).forEach((po) => {
                const plan: VendorPaymentPlanDB | null =
                    po.payment_plan || null;
                const termsList: VendorPaymentTermDB[] = plan?.terms || [];

                let terms: VendorPaymentTerm = {
                    type: 'full',
                    notes: plan?.notes || undefined,
                };

                if (plan?.scheme === 'dp') {
                    terms = {
                        type: 'dp',
                        notes: plan.notes || undefined,
                        dpPercent: termsList[0]?.percent || 50,
                        dpAmount: termsList[0]?.amount,
                        dpDueDate: termsList[0]?.due_date,
                        pelunasanDueDate: termsList[1]?.due_date,
                    };
                } else if (plan?.scheme === 'termin') {
                    terms = {
                        type: 'termin',
                        notes: plan.notes || undefined,
                        installments: termsList.map((t) => ({
                            percent: t.percent,
                            amount: t.amount,
                            note: t.label,
                            dueDate: t.due_date,
                        })),
                    };
                } else {
                    terms = {
                        type: 'full',
                        notes: plan?.notes || undefined,
                        fullDueDate: termsList[0]?.due_date,
                    };
                }

                // Compile payment records from real settlements
                const pmtList: VendorPaymentRecord[] = [];
                termsList.forEach((term) => {
                    (term.settlements || []).forEach((s) => {
                        pmtList.push({
                            id: s.id,
                            poNumber: po.po_number,
                            termLabel: term.label,
                            amount: Number(s.amount),
                            date: s.paid_at,
                            method: s.payment_method,
                            referenceNo: s.payment_ref || '',
                            notes: s.notes || `Pembayaran ${term.label}`,
                        });
                    });
                });

                map[po.po_number] = {
                    id: po.id,
                    projectId: prj.id,
                    poNumber: po.po_number,
                    vendorId: po.vendor_id,
                    vendorName: po.vendor?.name || 'Vendor',
                    paymentTerms: terms,
                    issuedAt: po.issued_at || po.transaction_date || '',
                    totalAmount: Number(po.total || 0),
                    notes: po.notes,
                    payments: pmtList,
                    payment_plan: plan,
                };
            });
        });

        return map;
    }, [formattedProjects]);

    // Read state from URL search params so browser refresh keeps the active view/project
    const getInitialProjectId = (): number | string | null => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const projectParam = params.get('project_id');
        return projectParam ? projectParam : null;
    };

    const getInitialPoTab = ():
        | 'all_projects'
        | 'pending_queue'
        | 'issued_pos'
        | 'top_schedule' => {
        if (typeof window === 'undefined') return 'all_projects';
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (
            tabParam === 'pending_queue' ||
            tabParam === 'issued_pos' ||
            tabParam === 'top_schedule'
        ) {
            return tabParam;
        }
        return 'all_projects';
    };

    // Filter projects based on active fiscal mode
    const projects = useMemo(() => {
        return formattedProjects.filter((p) => {
            if (p.fiscal_mode) {
                return p.fiscal_mode === fiscalMode;
            }
            return true;
        });
    }, [formattedProjects, fiscalMode]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<
        number | string | null
    >(getInitialProjectId);
    const [successMessage, setSuccessMessage] = useState('');
    const [activePoTab, setActivePoTab] = useState<
        'all_projects' | 'pending_queue' | 'issued_pos' | 'top_schedule'
    >(getInitialPoTab);

    // Pagination state for each tab
    const [allProjectsPage, setAllProjectsPage] = useState(1);
    const [pendingQueuePage, setPendingQueuePage] = useState(1);
    const [issuedPosPage, setIssuedPosPage] = useState(1);
    const [topSchedulePage, setTopSchedulePage] = useState(1);
    const itemsPerPage = 6;

    // Sync state with URL params without full page reload
    React.useEffect(() => {
        const url = new URL(window.location.href);
        if (selectedProjectId) {
            url.searchParams.set('project_id', selectedProjectId.toString());
        } else {
            url.searchParams.delete('project_id');
        }
        if (activePoTab && activePoTab !== 'all_projects') {
            url.searchParams.set('tab', activePoTab);
        } else {
            url.searchParams.delete('tab');
        }
        window.history.replaceState({}, '', url.toString());
    }, [selectedProjectId, activePoTab]);

    const [showPoForm, setShowPoForm] = useState(false);
    const [poFormVendor, setPoFormVendor] = useState<{
        id: number | string;
        name: string;
        locs: BillboardLocation[];
    } | null>(null);

    // State for Payment Recording & History Drawer
    const [selectedPoForPayment, setSelectedPoForPayment] =
        useState<VendorPO | null>(null);
    const [selectedPaymentTermDB, setSelectedPaymentTermDB] =
        useState<VendorPaymentTermDB | null>(null);
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [expandedPoPayment, setExpandedPoPayment] = useState<string | null>(
        null,
    );

    const activeProject = projects.find(
        (p) => String(p.id) === String(selectedProjectId),
    );

    const filteredProjects = projects.filter(
        (p) =>
            p.locations.length > 0 &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    const activeLocations = activeProject ? activeProject.locations : [];
    const pendingLocations = activeLocations.filter(
        (l) => !l.poIssued && l.vendorId !== null,
    );

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleConfirmIssuePO = (data: IssuePOModalSubmitData) => {
        if (!poFormVendor || !activeProject) return;

        const locationIds = poFormVendor.locs.map((l) => l.id);

        router.post(
            `/projects/${activeProject.id}/purchase-orders`,
            {
                vendor_id: poFormVendor.id,
                location_ids: locationIds,
                transaction_date: new Date().toISOString().split('T')[0],
                lighting: data.lighting,
                top_notes: data.topNotes,
                term_scheme: data.scheme,
                term_percents: data.termPercents,
                term_due_dates: data.termDates,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPoForm(false);
                    setPoFormVendor(null);
                    setSuccessMessage(
                        `PO vendor untuk ${poFormVendor.name} berhasil diterbitkan dan dicatat dalam database!`,
                    );
                    setTimeout(() => setSuccessMessage(''), 4000);
                },
            },
        );
    };

    // ─── Record Payment Handlers ──────────────────────────────────────────────
    const handleOpenRecordPayment = (
        po: VendorPO,
        term?: VendorPaymentTermDB,
    ) => {
        setSelectedPoForPayment(po);
        setSelectedPaymentTermDB(term || null);
        setShowRecordPaymentModal(true);
    };

    const handleSaveRecordPayment = (data: RecordPaymentModalSubmitData) => {
        if (!selectedPoForPayment) return;

        const targetProjectId =
            selectedPoForPayment.projectId || activeProject?.id;
        const targetPoId = selectedPoForPayment.id;
        const terms = selectedPoForPayment.payment_plan?.terms || [];

        let targetTerm = selectedPaymentTermDB;
        if (!targetTerm) {
            targetTerm =
                terms.find((t) => t.status !== 'paid') || terms[0] || null;
        }

        if (!targetProjectId || !targetPoId || !targetTerm) {
            alert('Data PO atau Termin pembayaran tidak valid.');
            return;
        }

        router.post(
            `/projects/${targetProjectId}/purchase-orders/${targetPoId}/payment-terms/${targetTerm.id}/settle`,
            {
                amount: data.amount,
                paid_at: data.date,
                payment_method: data.method,
                account_id: data.account_id || null,
                payment_ref: data.referenceNo || null,
                notes: data.notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowRecordPaymentModal(false);
                    setSelectedPoForPayment(null);
                    setSelectedPaymentTermDB(null);
                    setExpandedPoPayment(data.poNumber);
                    setSuccessMessage(
                        `Berhasil mencatat pengeluaran kas ${fmt(data.amount)} untuk ${data.poNumber}!`,
                    );
                    setTimeout(() => setSuccessMessage(''), 4000);
                },
            },
        );
    };

    // ─── PDF Download (POST to /po-pdf via hidden form) ───────────────────────
    const handleDownloadPO = (
        vendorName: string,
        poNumber: string,
        items: BillboardLocation[],
        projectName: string,
        projectPeriod: string,
        lighting = 'Berlampu',
        topNotes = 'Lunas setelah visual terpasang',
    ) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/po-pdf';
        form.target = '_blank';

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('vendorName', vendorName);
        appendInput('poNumber', poNumber);
        appendInput('poDate', new Date().toLocaleDateString('id-ID'));
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('stream', 'true');
        appendInput('project[name]', projectName);
        appendInput('project[period]', projectPeriod);

        items.forEach((item, index) => {
            appendInput(`locations[${index}][id]`, item.id.toString());
            appendInput(`locations[${index}][description]`, item.description);
            appendInput(`locations[${index}][area]`, item.area);
            appendInput(`locations[${index}][type]`, item.type);
            appendInput(`locations[${index}][size]`, item.size || '4x6');
            appendInput(
                `locations[${index}][vendorCost]`,
                item.vendorCost.toString(),
            );
            appendInput(`locations[${index}][lighting]`, lighting);
            appendInput(`locations[${index}][topNotes]`, topNotes);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // ─── Derived Data ─────────────────────────────────────────────────────────

    const locationsByVendor = activeLocations.reduce<
        Record<string, { vendorName: string; locs: BillboardLocation[] }>
    >((acc, l) => {
        if (l.vendorId === null) return acc;
        const key = String(l.vendorId);
        if (!acc[key])
            acc[key] = { vendorName: l.vendorName, locs: [] };
        acc[key].locs.push(l);
        return acc;
    }, {});

    const allLocations = projects.flatMap((p) => p.locations);
    const totalIssuedPO = allLocations.filter((l) => l.poIssued).length;
    const totalPendingPO = allLocations.filter(
        (l) => !l.poIssued && l.vendorId !== null,
    ).length;
    const totalPurchaseVal = allLocations.reduce(
        (s, l) => s + (l.poIssued ? l.vendorCost * (l.qty || 1) : 0),
        0,
    );
    const totalPPNMasukan = isPPN ? totalPurchaseVal * PPN_RATE : 0;
    const totalPOValue = totalPurchaseVal + totalPPNMasukan;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <AppLayout
            activePage="purchases"
            title="Pembelian & PO"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Transaksi' },
                { label: 'Pembelian (PO)' },
            ]}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center">
                        {activeProject && (
                            <button
                                onClick={() => setSelectedProjectId(null)}
                                className="shadow-2xs mr-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 transition-all hover:bg-slate-100"
                                title="Kembali ke Daftar Proyek"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-sm font-bold tracking-tight text-slate-800">
                                Penerbitan &amp; Kelola PO Vendor
                            </h2>
                            <p className="mt-0.5 text-[11px] font-semibold uppercase text-slate-400">
                                {activeProject
                                    ? `Mengelola PO untuk Proyek: ${activeProject.code}`
                                    : `Pusat Pemesanan Pembelian Vendor - ${isPPN ? 'Mode PPN Aktif' : 'Mode Non-PPN'}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Metric Cards */}
                {!activeProject && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="PO Diterbitkan"
                            value={String(totalIssuedPO)}
                            badgeText="Telah Terbit"
                            badgeColorClass="bg-primary/10 text-primary border-primary/20"
                            valueColorClass="text-primary"
                            icon={
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            }
                            iconColorClass="bg-primary/10 text-primary border-primary/20"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs hover:border-primary/40"
                        />
                        <MetricCard
                            title="Menunggu PO"
                            value={String(totalPendingPO)}
                            badgeText={
                                totalPendingPO > 0 ? 'Pending Task' : 'Lengkap'
                            }
                            badgeColorClass={
                                totalPendingPO > 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }
                            valueColorClass={
                                totalPendingPO > 0
                                    ? 'text-amber-600 font-black'
                                    : 'text-slate-700'
                            }
                            icon={
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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            }
                            iconColorClass="bg-amber-50 text-amber-600 border-amber-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs hover:border-amber-200"
                        />
                        <MetricCard
                            title="Total Beban Vendor (DPP)"
                            value={fmt(totalPurchaseVal)}
                            badgeText="Sebelum Pajak"
                            badgeColorClass="bg-slate-100 text-slate-600 border-slate-200"
                            valueColorClass="text-slate-900"
                            icon={
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
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            }
                            iconColorClass="bg-slate-50 text-slate-600 border-slate-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs"
                        />
                        <MetricCard
                            title={
                                isPPN
                                    ? 'Total HPP PO (incl. PPN)'
                                    : 'Total Nilai PO'
                            }
                            value={fmt(totalPOValue)}
                            badgeText={isPPN ? 'Mode PPN 11%' : 'Mode Non-PPN'}
                            badgeColorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                            valueColorClass="text-emerald-600"
                            icon={
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
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            }
                            iconColorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs"
                        />
                    </div>
                )}

                {/* Success Toast Notification */}
                {successMessage && (
                    <div className="animate-fade-in-down shadow-2xs flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                        <svg
                            className="h-5 w-5 flex-shrink-0 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        {successMessage}
                    </div>
                )}

                {/* ─── VIEW A: Project List (No Project Selected) ─── */}
                {!activeProject ? (
                    <div className="space-y-5">
                        {/* Unified Filter & Search Container */}
                        <div className="shadow-2xs rounded-2xl border border-slate-200/90 bg-white p-3.5">
                            <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
                                {/* Tab Filter */}
                                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1">
                                    {[
                                        {
                                            key: 'all_projects' as const,
                                            label: 'Semua PO Proyek',
                                            badge: String(projects.length),
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                />
                                            ),
                                        },
                                        {
                                            key: 'issued_pos' as const,
                                            label: 'PO Resmi Terbit',
                                            badge: String(
                                                Object.keys(vendorPOs).length,
                                            ),
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            ),
                                        },
                                        {
                                            key: 'top_schedule' as const,
                                            label: 'Jadwal TOP Vendor',
                                            badge: null,
                                            icon: (
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            ),
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() =>
                                                setActivePoTab(tab.key)
                                            }
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                activePoTab === tab.key
                                                    ? 'bg-primary text-white shadow-neon-primary'
                                                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                                            }`}
                                        >
                                            <svg
                                                className="h-3.5 w-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                {tab.icon}
                                            </svg>
                                            <span>{tab.label}</span>
                                            {tab.badge !== null && (
                                                <span
                                                    className={`py-0.2 rounded-md px-1.5 font-mono text-[10px] ${activePoTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}

                                    {/* Pending Queue (special styling) */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActivePoTab('pending_queue')
                                        }
                                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            activePoTab === 'pending_queue'
                                                ? 'shadow-2xs bg-amber-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                                        }`}
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>Antrean Pending PO</span>
                                        {totalPendingPO > 0 && (
                                            <span className="py-0.2 animate-pulse rounded-md bg-amber-500 px-1.5 font-mono text-[10px] font-black text-white">
                                                {totalPendingPO} Titik
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative w-full flex-shrink-0 lg:w-72">
                                    <svg
                                        className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
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
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        placeholder="Cari proyek, kode, atau client..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TAB 1: ALL PROJECTS */}
                        {activePoTab === 'all_projects' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredProjects
                                        .slice(
                                            (allProjectsPage - 1) *
                                                itemsPerPage,
                                            allProjectsPage * itemsPerPage,
                                        )
                                        .map((proj) => {
                                            const pendingCount =
                                                proj.locations.filter(
                                                    (l) =>
                                                        !l.poIssued &&
                                                        l.vendorId !== null,
                                                ).length;
                                            const issuedCount =
                                                proj.locations.filter(
                                                    (l) => l.poIssued,
                                                ).length;
                                            const percent =
                                                proj.locations.length > 0
                                                    ? (issuedCount /
                                                          proj.locations
                                                              .length) *
                                                      100
                                                    : 0;
                                            return (
                                                <div
                                                    key={proj.id}
                                                    onClick={() =>
                                                        setSelectedProjectId(
                                                            proj.id,
                                                        )
                                                    }
                                                    className="hover:border-primary/50 group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 transition-all hover:shadow-md"
                                                >
                                                    <div>
                                                        <div className="mb-2 flex items-start justify-between">
                                                            <span className="rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-slate-400">
                                                                {proj.code}
                                                            </span>
                                                            {pendingCount >
                                                            0 ? (
                                                                <span className="animate-pulse rounded-full border border-amber-100/50 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                                                    {
                                                                        pendingCount
                                                                    }{' '}
                                                                    Pending PO
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full border border-emerald-100/50 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                                                    PO Lengkap
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="line-clamp-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-primary">
                                                            {proj.name}
                                                        </h3>
                                                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                                            {proj.clientName}{' '}
                                                            &middot;{' '}
                                                            {proj.salesPIC}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                                                        <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-300"
                                                                style={{
                                                                    width: `${percent}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="flex-shrink-0 font-mono text-[10px] font-bold text-slate-400">
                                                            {issuedCount}/
                                                            {
                                                                proj.locations
                                                                    .length
                                                            }{' '}
                                                            Titik
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {filteredProjects.length === 0 && (
                                        <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                                            <p className="text-xs font-semibold text-slate-400">
                                                Tidak ditemukan proyek yang
                                                cocok dengan kata kunci
                                                pencarian.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={allProjectsPage}
                                    totalPages={Math.ceil(
                                        filteredProjects.length / itemsPerPage,
                                    )}
                                    totalItems={filteredProjects.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) =>
                                        setAllProjectsPage(page)
                                    }
                                />
                            </div>
                        )}

                        {/* TAB 2: PENDING QUEUE */}
                        {activePoTab === 'pending_queue' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                                            Antrean Penerbitan PO Vendor
                                            (Pending Task)
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Daftar grup titik lokasi per Proyek
                                            &amp; Vendor yang siap diterbitkan
                                            PO (Per Titik / Gabungan)
                                        </p>
                                    </div>
                                    <span className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                                        {totalPendingPO} Titik Butuh PO
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(() => {
                                        // Group pending locations by project_id + vendor_id
                                        type GroupedPending = {
                                            key: string;
                                            project: PurchaseProject;
                                            vendorId: number | string;
                                            vendorName: string;
                                            locations: BillboardLocation[];
                                        };

                                        const groupedMap: Record<
                                            string,
                                            GroupedPending
                                        > = {};

                                        projects.forEach((p) => {
                                            p.locations.forEach((l) => {
                                                if (
                                                    !l.poIssued &&
                                                    l.vendorId !== null
                                                ) {
                                                    const key = `${p.id}-${l.vendorId}`;
                                                    if (!groupedMap[key]) {
                                                        groupedMap[key] = {
                                                            key,
                                                            project: p,
                                                            vendorId:
                                                                l.vendorId,
                                                            vendorName:
                                                                l.vendorName,
                                                            locations: [],
                                                        };
                                                    }
                                                    groupedMap[
                                                        key
                                                    ].locations.push(l);
                                                }
                                            });
                                        });

                                        const groupsList =
                                            Object.values(groupedMap);

                                        if (groupsList.length === 0) {
                                            return (
                                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-400">
                                                    Semua PO vendor dari seluruh
                                                    proyek sudah selesai
                                                    diterbitkan
                                                </div>
                                            );
                                        }

                                        const paginatedGroups =
                                            groupsList.slice(
                                                (pendingQueuePage - 1) *
                                                    itemsPerPage,
                                                pendingQueuePage * itemsPerPage,
                                            );

                                        return paginatedGroups.map((grp) => {
                                            const groupTotalDpp =
                                                grp.locations.reduce(
                                                    (sum, loc) =>
                                                        sum +
                                                        loc.vendorCost *
                                                            (loc.qty || 1),
                                                    0,
                                                );
                                            const groupTotal = isPPN
                                                ? groupTotalDpp * (1 + PPN_RATE)
                                                : groupTotalDpp;

                                            return (
                                                <div
                                                    key={grp.key}
                                                    className="shadow-2xs space-y-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
                                                >
                                                    {/* Group Header */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50 px-4 py-3">
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                                    {
                                                                        grp
                                                                            .project
                                                                            .code
                                                                    }
                                                                </span>
                                                                <span className="truncate text-xs font-bold text-slate-900">
                                                                    {
                                                                        grp
                                                                            .project
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                                                    {
                                                                        grp
                                                                            .locations
                                                                            .length
                                                                    }{' '}
                                                                    Titik Lokasi
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                                                <span>
                                                                    Vendor:{' '}
                                                                    <strong className="font-bold text-slate-900">
                                                                        {
                                                                            grp.vendorName
                                                                        }
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-shrink-0 items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="font-mono text-xs font-bold text-slate-900">
                                                                    {fmt(
                                                                        groupTotal,
                                                                    )}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400">
                                                                    {isPPN
                                                                        ? 'Inc PPN 11%'
                                                                        : 'Non PPN'}
                                                                </div>
                                                            </div>

                                                            {/* Button to issue combined PO for this project + vendor */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedProjectId(
                                                                        grp
                                                                            .project
                                                                            .id,
                                                                    );
                                                                    setPoFormVendor(
                                                                        {
                                                                            id: grp.vendorId,
                                                                            name: grp.vendorName,
                                                                            locs: grp.locations,
                                                                        },
                                                                    );
                                                                    setShowPoForm(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                title="Terbitkan 1 PO Gabungan untuk semua titik vendor ini"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 4v16m8-8H4"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Terbitkan PO
                                                                    Gabungan (
                                                                    {
                                                                        grp
                                                                            .locations
                                                                            .length
                                                                    }{' '}
                                                                    Titik)
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Group Locations List */}
                                                    <div className="divide-y divide-slate-100 bg-white">
                                                        {grp.locations.map(
                                                            (loc, lIdx) => {
                                                                const locDpp =
                                                                    loc.vendorCost *
                                                                    (loc.qty ||
                                                                        1);
                                                                const locTotal =
                                                                    isPPN
                                                                        ? locDpp *
                                                                          (1 +
                                                                              PPN_RATE)
                                                                        : locDpp;
                                                                return (
                                                                    <div
                                                                        key={
                                                                            loc.id
                                                                        }
                                                                        className="flex items-center justify-between gap-3 p-3 px-4 transition-colors hover:bg-slate-50/50"
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                                                {lIdx +
                                                                                    1}
                                                                            </span>
                                                                            <div className="min-w-0">
                                                                                <div className="truncate text-xs font-bold text-slate-800">
                                                                                    {
                                                                                        loc.description
                                                                                    }
                                                                                </div>
                                                                                <div className="text-[10px] font-medium text-slate-400">
                                                                                    Kode:{' '}
                                                                                    <span className="font-semibold text-slate-600">
                                                                                        {
                                                                                            loc.code
                                                                                        }
                                                                                    </span>{' '}
                                                                                    &middot;
                                                                                    Area:{' '}
                                                                                    <span className="font-semibold text-slate-600">
                                                                                        {
                                                                                            loc.area
                                                                                        }
                                                                                    </span>{' '}
                                                                                    &middot;
                                                                                    Ukuran:{' '}
                                                                                    <span className="font-semibold text-slate-600">
                                                                                        {
                                                                                            loc.size
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-shrink-0 items-center gap-3">
                                                                            <span className="font-mono text-xs font-bold text-slate-900">
                                                                                {fmt(
                                                                                    locTotal,
                                                                                )}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setSelectedProjectId(
                                                                                        grp
                                                                                            .project
                                                                                            .id,
                                                                                    );
                                                                                    setPoFormVendor(
                                                                                        {
                                                                                            id: grp.vendorId,
                                                                                            name: grp.vendorName,
                                                                                            locs: [
                                                                                                loc,
                                                                                            ],
                                                                                        },
                                                                                    );
                                                                                    setShowPoForm(
                                                                                        true,
                                                                                    );
                                                                                }}
                                                                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 transition-all hover:bg-slate-200"
                                                                                title="Terbitkan PO khusus titik ini saja"
                                                                            >
                                                                                <svg
                                                                                    className="h-3 w-3 text-slate-500"
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
                                                                                        d="M12 4v16m8-8H4"
                                                                                    />
                                                                                </svg>
                                                                                <span>
                                                                                    Terbit
                                                                                    PO
                                                                                    Titik
                                                                                </span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                <Pagination
                                    currentPage={pendingQueuePage}
                                    totalPages={Math.ceil(
                                        Object.keys(
                                            projects.reduce<
                                                Record<string, boolean>
                                            >((acc, p) => {
                                                p.locations.forEach((l) => {
                                                    if (
                                                        !l.poIssued &&
                                                        l.vendorId !== null
                                                    )
                                                        acc[
                                                            `${p.id}-${l.vendorId}`
                                                        ] = true;
                                                });
                                                return acc;
                                            }, {}),
                                        ).length / itemsPerPage,
                                    )}
                                    totalItems={
                                        Object.keys(
                                            projects.reduce<
                                                Record<string, boolean>
                                            >((acc, p) => {
                                                p.locations.forEach((l) => {
                                                    if (
                                                        !l.poIssued &&
                                                        l.vendorId !== null
                                                    )
                                                        acc[
                                                            `${p.id}-${l.vendorId}`
                                                        ] = true;
                                                });
                                                return acc;
                                            }, {}),
                                        ).length
                                    }
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) =>
                                        setPendingQueuePage(page)
                                    }
                                />
                            </div>
                        )}

                        {/* TAB 3: ISSUED POs */}
                        {activePoTab === 'issued_pos' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Daftar Dokumen PO Vendor Resmi
                                            Terbit
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Dokumen PO resmi yang telah
                                            diterbitkan beserta status dan
                                            riwayat pembayaran
                                        </p>
                                    </div>
                                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                                        {Object.keys(vendorPOs).length} Dokumen
                                        PO
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                    {(() => {
                                        const allPOs = Object.values(vendorPOs);
                                        const paginatedPOs = allPOs.slice(
                                            (issuedPosPage - 1) * itemsPerPage,
                                            issuedPosPage * itemsPerPage,
                                        );

                                        return paginatedPOs.map((po) => {
                                            const summary =
                                                getPOPaymentSummary(po);
                                            const isExpanded =
                                                expandedPoPayment ===
                                                po.poNumber;

                                            // Find project this PO belongs to
                                            const poProject = projects.find(
                                                (p) =>
                                                    p.locations.some(
                                                        (l) =>
                                                            l.poNumber ===
                                                            po.poNumber,
                                                    ),
                                            );

                                            return (
                                                <div
                                                    key={po.poNumber}
                                                    className="divide-y divide-slate-100 bg-white transition-colors hover:bg-slate-50/40"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                                                        <div className="min-w-0 flex-1 space-y-1.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
                                                                    {
                                                                        po.poNumber
                                                                    }
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900">
                                                                    {
                                                                        po.vendorName
                                                                    }
                                                                </span>

                                                                {/* Payment Status Badge */}
                                                                {summary.status ===
                                                                    'paid' && (
                                                                    <span className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                                        PAID /
                                                                        LUNAS
                                                                    </span>
                                                                )}
                                                                {summary.status ===
                                                                    'partial' && (
                                                                    <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />
                                                                        PARTIALLY
                                                                        PAID (
                                                                        {
                                                                            summary.percentage
                                                                        }
                                                                        %)
                                                                    </span>
                                                                )}
                                                                {summary.status ===
                                                                    'unpaid' && (
                                                                    <span className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                                        BELUM
                                                                        DIBAYAR
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Progress bar realisasi pembayaran */}
                                                            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${summary.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                                    style={{
                                                                        width: `${summary.percentage}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                                                <span>
                                                                    Terbit:{' '}
                                                                    <strong className="text-slate-700">
                                                                        {formatDate(
                                                                            po.issuedAt,
                                                                        )}
                                                                    </strong>
                                                                </span>
                                                                <span>
                                                                    &bull;
                                                                </span>
                                                                <span>
                                                                    Skema:{' '}
                                                                    <strong className="text-slate-700">
                                                                        {po
                                                                            .paymentTerms
                                                                            .notes ||
                                                                            po
                                                                                .paymentTerms
                                                                                .type}
                                                                    </strong>
                                                                </span>
                                                                {poProject && (
                                                                    <>
                                                                        <span>
                                                                            &bull;
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            Proyek:
                                                                            <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                                                                {
                                                                                    poProject.code
                                                                                }
                                                                            </span>
                                                                            <strong className="text-slate-700">
                                                                                {
                                                                                    poProject.name
                                                                                }
                                                                            </strong>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-shrink-0 items-center gap-4">
                                                            <div className="text-right">
                                                                <div className="font-mono text-xs font-bold text-slate-900">
                                                                    {fmt(
                                                                        po.totalAmount,
                                                                    )}
                                                                </div>
                                                                <div className="text-[9.5px] font-medium text-slate-500">
                                                                    Terbayar:{' '}
                                                                    <strong className="font-mono text-emerald-700">
                                                                        {fmt(
                                                                            summary.totalPaid,
                                                                        )}
                                                                    </strong>{' '}
                                                                    &bull; Sisa:{' '}
                                                                    <strong className="font-mono text-amber-700">
                                                                        {fmt(
                                                                            summary.remaining,
                                                                        )}
                                                                    </strong>
                                                                </div>
                                                            </div>

                                                            {/* Record Payment Button */}
                                                            {summary.remaining >
                                                                0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleOpenRecordPayment(
                                                                            po,
                                                                        )
                                                                    }
                                                                    className="shadow-2xs flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-emerald-700"
                                                                >
                                                                    <svg
                                                                        className="h-3.5 w-3.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                        />
                                                                    </svg>
                                                                    <span>
                                                                        Catat
                                                                        Bayar
                                                                    </span>
                                                                </button>
                                                            )}

                                                            {/* Toggle History Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setExpandedPoPayment(
                                                                        isExpanded
                                                                            ? null
                                                                            : po.poNumber,
                                                                    )
                                                                }
                                                                className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                                                                    isExpanded
                                                                        ? 'border-slate-300 bg-slate-200 text-slate-800'
                                                                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                                }`}
                                                            >
                                                                <span>
                                                                    Riwayat (
                                                                    {po.payments
                                                                        ?.length ||
                                                                        0}
                                                                    )
                                                                </span>
                                                                <svg
                                                                    className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M19 9l-7 7-7-7"
                                                                    />
                                                                </svg>
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const poLocs =
                                                                        projects
                                                                            .flatMap(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.locations,
                                                                            )
                                                                            .filter(
                                                                                (
                                                                                    l,
                                                                                ) =>
                                                                                    l.poNumber ===
                                                                                    po.poNumber,
                                                                            );
                                                                    const project =
                                                                        projects.find(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.locations.some(
                                                                                    (
                                                                                        l,
                                                                                    ) =>
                                                                                        l.poNumber ===
                                                                                        po.poNumber,
                                                                                ),
                                                                        );
                                                                    handleDownloadPO(
                                                                        po.vendorName,
                                                                        po.poNumber,
                                                                        poLocs,
                                                                        project?.name ??
                                                                            '',
                                                                        project?.period ??
                                                                            '',
                                                                        po.lighting,
                                                                        po.topNotes,
                                                                    );
                                                                }}
                                                                className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-blue-700"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                <span>PDF</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Payment History Drawer */}
                                                    {isExpanded && (
                                                        <div className="animate-in slide-in-from-top-1 space-y-3 border-t border-slate-100 bg-slate-50/80 p-4 duration-200">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                                                <span>
                                                                    Catatan /
                                                                    Riwayat
                                                                    Pembayaran
                                                                    Kas Keluar
                                                                    PO (
                                                                    {
                                                                        po.poNumber
                                                                    }
                                                                    )
                                                                </span>
                                                                <span className="text-[10px] font-normal text-slate-500">
                                                                    Sistem
                                                                    Akuntansi
                                                                    YouSee
                                                                    Finance
                                                                </span>
                                                            </div>

                                                            {po.payments &&
                                                            po.payments.length >
                                                                0 ? (
                                                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white text-xs">
                                                                    <table className="w-full border-collapse text-left">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                                                                                <th className="px-3 py-2">
                                                                                    Tanggal
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    Peruntukan
                                                                                    /
                                                                                    Label
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    Metode
                                                                                    Kas/Bank
                                                                                </th>
                                                                                <th className="px-3 py-2">
                                                                                    No.
                                                                                    Referensi
                                                                                </th>
                                                                                <th className="px-3 py-2 text-right">
                                                                                    Nominal
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {po.payments.map(
                                                                                (
                                                                                    pmt,
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            pmt.id
                                                                                        }
                                                                                        className="hover:bg-slate-50/70"
                                                                                    >
                                                                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                                                                                            {formatDate(
                                                                                                pmt.date,
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-semibold text-slate-900">
                                                                                            {
                                                                                                pmt.termLabel
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-slate-600">
                                                                                            {
                                                                                                pmt.method
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-mono text-slate-600">
                                                                                            {
                                                                                                pmt.referenceNo
                                                                                            }
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                                                                                            {fmt(
                                                                                                pmt.amount,
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-xs italic text-slate-500">
                                                                    Belum ada
                                                                    catatan
                                                                    transaksi
                                                                    pembayaran
                                                                    untuk PO
                                                                    ini.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                <Pagination
                                    currentPage={issuedPosPage}
                                    totalPages={Math.ceil(
                                        Object.keys(vendorPOs).length /
                                            itemsPerPage,
                                    )}
                                    totalItems={Object.keys(vendorPOs).length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) =>
                                        setIssuedPosPage(page)
                                    }
                                />
                            </div>
                        )}

                        {/* TAB 4: TOP SCHEDULE */}
                        {activePoTab === 'top_schedule' && (
                            <div className="shadow-2xs space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800">
                                            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                                            Jadwal &amp; Termin Pembayaran TOP
                                            Vendor (Cashflow Outflow)
                                        </h3>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                            Monitoring jatuh tempo pelaksanaan
                                            pembayaran vendor dari seluruh
                                            proyek
                                        </p>
                                    </div>
                                    <span className="rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                                        {Object.keys(vendorPOs).length} Dokumen
                                        PO Terjadwal
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
                                    {(() => {
                                        const sortedPOs = Object.values(
                                            vendorPOs,
                                        )
                                            .map((po) => {
                                                const summary =
                                                    getPOPaymentSummary(po);
                                                const scheduleItems: Array<{
                                                    label: string;
                                                    dueDate?: string;
                                                    amount: number;
                                                }> = [];

                                                if (
                                                    po.paymentTerms.type ===
                                                    'full'
                                                ) {
                                                    scheduleItems.push({
                                                        label: 'Pembayaran Penuh (Full Payment)',
                                                        dueDate:
                                                            po.paymentTerms
                                                                .fullDueDate,
                                                        amount: po.totalAmount,
                                                    });
                                                } else if (
                                                    po.paymentTerms.type ===
                                                    'dp'
                                                ) {
                                                    scheduleItems.push({
                                                        label: `DP ${po.paymentTerms.dpPercent || 50}%`,
                                                        dueDate:
                                                            po.paymentTerms
                                                                .dpDueDate,
                                                        amount:
                                                            po.paymentTerms
                                                                .dpAmount ||
                                                            Math.round(
                                                                po.totalAmount *
                                                                    0.5,
                                                            ),
                                                    });
                                                    scheduleItems.push({
                                                        label: 'Pelunasan',
                                                        dueDate:
                                                            po.paymentTerms
                                                                .pelunasanDueDate,
                                                        amount:
                                                            po.totalAmount -
                                                            (po.paymentTerms
                                                                .dpAmount ||
                                                                Math.round(
                                                                    po.totalAmount *
                                                                        0.5,
                                                                )),
                                                    });
                                                } else if (
                                                    po.paymentTerms.type ===
                                                        'termin' &&
                                                    po.paymentTerms.installments
                                                ) {
                                                    po.paymentTerms.installments.forEach(
                                                        (inst, idx) => {
                                                            scheduleItems.push({
                                                                label:
                                                                    inst.note ||
                                                                    `Termin ${idx + 1} (${inst.percent}%)`,
                                                                dueDate:
                                                                    inst.dueDate,
                                                                amount: inst.amount,
                                                            });
                                                        },
                                                    );
                                                } else {
                                                    scheduleItems.push({
                                                        label: 'Jadwal Pembayaran Vendor',
                                                        dueDate: po.issuedAt,
                                                        amount: po.totalAmount,
                                                    });
                                                }

                                                // Find earliest due date for sorting
                                                const validDates = scheduleItems
                                                    .map((item) => item.dueDate)
                                                    .filter((d): d is string =>
                                                        Boolean(d),
                                                    )
                                                    .map((d) =>
                                                        new Date(d).getTime(),
                                                    );

                                                const nearestDueDateMs =
                                                    validDates.length > 0
                                                        ? Math.min(
                                                              ...validDates,
                                                          )
                                                        : 9999999999999;

                                                return {
                                                    po,
                                                    summary,
                                                    scheduleItems,
                                                    nearestDueDateMs,
                                                };
                                            })
                                            .sort(
                                                (a, b) =>
                                                    a.nearestDueDateMs -
                                                    b.nearestDueDateMs,
                                            );

                                        const paginatedPOs = sortedPOs.slice(
                                            (topSchedulePage - 1) *
                                                itemsPerPage,
                                            topSchedulePage * itemsPerPage,
                                        );

                                        return paginatedPOs.map(
                                            ({
                                                po,
                                                summary,
                                                scheduleItems,
                                            }) => {
                                                return (
                                                    <div
                                                        key={`top-${po.poNumber}`}
                                                        className="space-y-3 bg-white p-4 transition-colors hover:bg-slate-50/40"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                                                                    {
                                                                        po.poNumber
                                                                    }
                                                                </span>
                                                                <span className="font-bold text-slate-900">
                                                                    {
                                                                        po.vendorName
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    &bull;
                                                                    Terbit:{' '}
                                                                    {formatDate(
                                                                        po.issuedAt,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-xs font-black text-slate-900">
                                                                    {fmt(
                                                                        po.totalAmount,
                                                                    )}
                                                                </span>
                                                                {summary.status ===
                                                                'paid' ? (
                                                                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                                        LUNAS
                                                                    </span>
                                                                ) : (
                                                                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                                                        SISA{' '}
                                                                        {fmt(
                                                                            summary.remaining,
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Schedule Items Table */}
                                                        <div className="space-y-2 rounded-xl border border-slate-200/60 bg-slate-50/80 p-3">
                                                            <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                <span>
                                                                    Rincian
                                                                    Termin &amp;
                                                                    Tanggal
                                                                    Jatuh Tempo
                                                                </span>
                                                                <span>
                                                                    {po
                                                                        .paymentTerms
                                                                        .notes ||
                                                                        'Sesuai Perjanjian TOP'}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1.5 divide-y divide-slate-200/50">
                                                                {scheduleItems.map(
                                                                    (
                                                                        item,
                                                                        idx,
                                                                    ) => {
                                                                        const today =
                                                                            new Date();
                                                                        today.setHours(
                                                                            0,
                                                                            0,
                                                                            0,
                                                                            0,
                                                                        );

                                                                        let diffDays:
                                                                            | number
                                                                            | null =
                                                                            null;
                                                                        if (
                                                                            item.dueDate
                                                                        ) {
                                                                            const due =
                                                                                new Date(
                                                                                    item.dueDate,
                                                                                );
                                                                            due.setHours(
                                                                                0,
                                                                                0,
                                                                                0,
                                                                                0,
                                                                            );
                                                                            diffDays =
                                                                                Math.ceil(
                                                                                    (due.getTime() -
                                                                                        today.getTime()) /
                                                                                        (1000 *
                                                                                            60 *
                                                                                            60 *
                                                                                            24),
                                                                                );
                                                                        }

                                                                        let statusTag =
                                                                            {
                                                                                label: 'Upcoming',
                                                                                style: 'bg-slate-100 text-slate-700 border-slate-200',
                                                                                dot: 'bg-slate-400',
                                                                            };

                                                                        if (
                                                                            diffDays !==
                                                                            null
                                                                        ) {
                                                                            if (
                                                                                diffDays <
                                                                                0
                                                                            ) {
                                                                                statusTag =
                                                                                    {
                                                                                        label: `Overdue (${Math.abs(diffDays)} Hari)`,
                                                                                        style: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
                                                                                        dot: 'bg-rose-500 animate-ping',
                                                                                    };
                                                                            } else if (
                                                                                diffDays <=
                                                                                7
                                                                            ) {
                                                                                statusTag =
                                                                                    {
                                                                                        label:
                                                                                            diffDays ===
                                                                                            0
                                                                                                ? 'Due Today!'
                                                                                                : `Due Soon (H-${diffDays})`,
                                                                                        style: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
                                                                                        dot: 'bg-amber-500 animate-pulse',
                                                                                    };
                                                                            } else {
                                                                                statusTag =
                                                                                    {
                                                                                        label: `Upcoming (H-${diffDays})`,
                                                                                        style: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
                                                                                        dot: 'bg-blue-500',
                                                                                    };
                                                                            }
                                                                        }

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center justify-between pt-1.5 text-[11px]"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <span
                                                                                        className={`h-2 w-2 rounded-full ${statusTag.dot}`}
                                                                                    />
                                                                                    <span className="font-semibold text-slate-800">
                                                                                        {
                                                                                            item.label
                                                                                        }
                                                                                    </span>
                                                                                    <span
                                                                                        className={`rounded-full border px-2 py-0.5 text-[9.5px] ${statusTag.style}`}
                                                                                    >
                                                                                        {
                                                                                            statusTag.label
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 font-mono">
                                                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                                                                        <svg
                                                                                            className="h-3.5 w-3.5 text-slate-400"
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
                                                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                            />
                                                                                        </svg>
                                                                                        <span>
                                                                                            Jatuh
                                                                                            Tempo:{' '}
                                                                                            <strong className="font-bold text-slate-900">
                                                                                                {item.dueDate
                                                                                                    ? formatDate(
                                                                                                          item.dueDate,
                                                                                                      )
                                                                                                    : 'Sesuai Invoice Vendor'}
                                                                                            </strong>
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="font-bold text-slate-900">
                                                                                        {fmt(
                                                                                            item.amount,
                                                                                        )}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        );
                                    })()}
                                </div>

                                {/* Pagination Component */}
                                <Pagination
                                    currentPage={topSchedulePage}
                                    totalPages={Math.ceil(
                                        Object.keys(vendorPOs).length /
                                            itemsPerPage,
                                    )}
                                    totalItems={Object.keys(vendorPOs).length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) =>
                                        setTopSchedulePage(page)
                                    }
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    // ─── VIEW B: Manage PO for Selected Project ───────────────────────────
                    <div className="space-y-6">
                        {/* Project Info Header */}
                        <div className="shadow-2xs grid grid-cols-1 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 md:grid-cols-4">
                            <div className="col-span-2">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <span className="bg-primary/10 border-primary/20 rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                        {activeProject.code}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold leading-tight text-slate-900">
                                    {activeProject.name}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    {activeProject.clientName} &middot; Sales:{' '}
                                    {activeProject.salesPIC}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-center">
                                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Total Titik Lokasi
                                </div>
                                <div className="font-mono text-base font-black text-slate-900">
                                    {activeLocations.length} Titik
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                                    {
                                        activeLocations.filter(
                                            (l) => l.poIssued,
                                        ).length
                                    }{' '}
                                    PO Diterbitkan
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-center">
                                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Nilai PO Tertunda
                                </div>
                                <div className="font-mono text-base font-black text-amber-600">
                                    {fmt(
                                        pendingLocations.reduce(
                                            (s, l) =>
                                                s + l.vendorCost * (l.qty || 1),
                                            0,
                                        ),
                                    )}
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                                    {pendingLocations.length} titik belum
                                    dipesan
                                </div>
                            </div>
                        </div>

                        {/* Vendor Location Groups */}
                        <div className="space-y-5">
                            {Object.entries(locationsByVendor).map(
                                ([vIdStr, group]) => {
                                    const vId = parseInt(vIdStr);
                                    const vendorLocs = group.locs;
                                    const pendingVendorLocs = vendorLocs.filter(
                                        (l) => !l.poIssued,
                                    );
                                    const dppVendor = vendorLocs.reduce(
                                        (s, l) =>
                                            s + l.vendorCost * (l.qty || 1),
                                        0,
                                    );
                                    const ppnVendor = isPPN
                                        ? dppVendor * PPN_RATE
                                        : 0;
                                    const totalVendor = dppVendor + ppnVendor;

                                    return (
                                        <div
                                            key={vId}
                                            className="shadow-2xs overflow-hidden rounded-2xl border border-slate-200/90 bg-white"
                                        >
                                            {/* Vendor Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-100/80 px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="shadow-2xs flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                                                        <svg
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2.5}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900">
                                                            {group.vendorName}
                                                        </h4>
                                                        <p className="text-[10px] font-medium text-slate-500">
                                                            {vendorLocs.length}{' '}
                                                            Titik Lokasi &bull;
                                                            Total Biaya Vendor
                                                            Ini:{' '}
                                                            <span className="bg-primary/10 border-primary/20 rounded border px-2 py-0.5 font-mono font-bold text-primary">
                                                                {fmt(dppVendor)}
                                                            </span>
                                                            {isPPN && ' (DPP)'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="mr-2 text-right">
                                                        <div className="font-mono text-xs font-black text-slate-900">
                                                            {fmt(totalVendor)}
                                                        </div>
                                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                            Total Nilai HPP
                                                        </div>
                                                    </div>
                                                    {pendingVendorLocs.length >
                                                    0 ? (
                                                        <button
                                                            onClick={() => {
                                                                setPoFormVendor(
                                                                    {
                                                                        id: vId,
                                                                        name: group.vendorName,
                                                                        locs: pendingVendorLocs,
                                                                    },
                                                                );
                                                                setShowPoForm(
                                                                    true,
                                                                );
                                                            }}
                                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-[11px] font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                                                        >
                                                            <svg
                                                                className="h-3.5 w-3.5"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M12 4v16m8-8H4"
                                                                />
                                                            </svg>
                                                            <span>
                                                                Terbitkan PO
                                                                Gabungan (
                                                                {
                                                                    pendingVendorLocs.length
                                                                }{' '}
                                                                Titik)
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        vendorLocs.length > 0 &&
                                                        vendorLocs[0]
                                                            .poNumber && (
                                                            <button
                                                                onClick={() => {
                                                                    const po =
                                                                        vendorPOs[
                                                                            vendorLocs[0]
                                                                                .poNumber
                                                                        ];
                                                                    handleDownloadPO(
                                                                        group.vendorName,
                                                                        vendorLocs[0]
                                                                            .poNumber,
                                                                        vendorLocs,
                                                                        activeProject?.name ??
                                                                            '',
                                                                        activeProject?.period ??
                                                                            '',
                                                                        po?.lighting,
                                                                        po?.topNotes,
                                                                    );
                                                                }}
                                                                className="shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-blue-700"
                                                            >
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={
                                                                        2.5
                                                                    }
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Unduh PO PDF
                                                                </span>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Location Items */}
                                            <div className="space-y-2.5 bg-slate-50/40 p-3">
                                                {vendorLocs.map((loc, idx) => {
                                                    const locDpp =
                                                        loc.vendorCost *
                                                        (loc.qty || 1);
                                                    const locPpn = isPPN
                                                        ? locDpp * PPN_RATE
                                                        : 0;
                                                    const locTotal =
                                                        locDpp + locPpn;
                                                    return (
                                                        <div
                                                            key={loc.id}
                                                            className="rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex min-w-0 items-start gap-3">
                                                                    <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                                                        {idx +
                                                                            1}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                                                            <span className="text-xs font-bold text-slate-800">
                                                                                {
                                                                                    loc.description
                                                                                }
                                                                            </span>
                                                                            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                                                {
                                                                                    loc.code
                                                                                }
                                                                            </span>
                                                                            <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                                                                Qty:{' '}
                                                                                {loc.qty ||
                                                                                    1}
                                                                            </span>
                                                                            {loc.poIssued ? (
                                                                                <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                                    PO
                                                                                    Terbit
                                                                                    (
                                                                                    {
                                                                                        loc.poNumber
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            ) : (
                                                                                <span className="rounded border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                                                                    Belum
                                                                                    Terbit
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                                                            Area:{' '}
                                                                            <span className="font-semibold text-slate-600">
                                                                                {
                                                                                    loc.area
                                                                                }
                                                                            </span>{' '}
                                                                            &middot;
                                                                            Ukuran:{' '}
                                                                            <span className="font-semibold text-slate-600">
                                                                                {
                                                                                    loc.size
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-shrink-0 items-center gap-3">
                                                                    <div className="text-right">
                                                                        {isPPN && (
                                                                            <div className="text-[9px] text-slate-400">
                                                                                DPP:{' '}
                                                                                {fmt(
                                                                                    loc.vendorCost,
                                                                                )}
                                                                                /u
                                                                            </div>
                                                                        )}
                                                                        <div className="font-mono text-xs font-bold text-slate-900">
                                                                            {fmt(
                                                                                locTotal,
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {!loc.poIssued && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setPoFormVendor(
                                                                                    {
                                                                                        id: vId,
                                                                                        name: group.vendorName,
                                                                                        locs: [
                                                                                            loc,
                                                                                        ],
                                                                                    },
                                                                                );
                                                                                setShowPoForm(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                                                                            title="Terbitkan PO khusus untuk titik ini"
                                                                        >
                                                                            <svg
                                                                                className="h-3 w-3"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                                strokeWidth={
                                                                                    2.5
                                                                                }
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M12 4v16m8-8H4"
                                                                                />
                                                                            </svg>
                                                                            <span>
                                                                                Terbit
                                                                                PO
                                                                                Titik
                                                                            </span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Vendor Footer */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs font-bold">
                                                <span className="text-[10px] uppercase tracking-wider text-slate-600">
                                                    Subtotal Biaya Vendor (
                                                    {group.vendorName})
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-normal text-slate-400">
                                                        {vendorLocs.length}{' '}
                                                        Titik Lokasi
                                                    </span>
                                                    <span className="px-1 py-1 font-mono text-sm font-black text-slate-900">
                                                        {fmt(totalVendor)}{' '}
                                                        {isPPN && (
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                (incl. PPN)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                },
                            )}

                            {Object.keys(locationsByVendor).length === 0 && (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                                    <p className="text-xs font-semibold text-slate-400">
                                        Tidak ada titik lokasi billboard yang
                                        memiliki vendor partner dalam project
                                        ini.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* PO Issuance Modal */}
            {poFormVendor && (
                <IssuePOModal
                    isOpen={showPoForm}
                    onClose={() => {
                        setShowPoForm(false);
                        setPoFormVendor(null);
                    }}
                    vendorName={poFormVendor.name}
                    items={poFormVendor.locs.map((l) => ({
                        id: l.id,
                        code: l.code,
                        description: l.description,
                        area: l.area,
                        type: l.type,
                        size: l.size,
                        vendorCost: l.vendorCost,
                        qty: l.qty,
                    }))}
                    isPPN={isPPN}
                    onSubmit={handleConfirmIssuePO}
                />
            )}

            {/* Record Payment Modal */}
            <RecordPaymentModal
                isOpen={showRecordPaymentModal}
                po={selectedPoForPayment}
                cashBankAccounts={cashBankAccounts}
                remainingAmount={
                    selectedPoForPayment
                        ? getPOPaymentSummary(selectedPoForPayment).remaining
                        : 0
                }
                onClose={() => {
                    setShowRecordPaymentModal(false);
                    setSelectedPoForPayment(null);
                    setSelectedPaymentTermDB(null);
                }}
                onSubmit={handleSaveRecordPayment}
            />
        </AppLayout>
    );
}
