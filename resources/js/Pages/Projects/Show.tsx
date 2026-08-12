import AppLayout from '@/Layouts/AppLayout';
import { useState } from 'react';
import { initialProjectsNonPPN, initialProjectsPPN } from './projectData';
import {
    ActiveTab,
    BillboardLocation,
    calcFinancials,
    ClientPaymentPlan,
    FiscalMode,
    fmt,
    formatIndoDate,
    PaymentScheme,
    PaymentTerm,
    PaymentTermStatus,
    Project,
} from './projectTypes';

// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: Project['status'] }) => {
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
};

// ─────────────────────────────────────────────────────────────────────────────
// LocationsTab
import InfoTab from './Tabs/InfoTab';
import InvoiceTab from './Tabs/InvoiceTab';
import LocationsTab from './Tabs/LocationsTab';
import VendorPOTab from './Tabs/VendorPOTab';

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Show Project Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Show({ projectId }: { projectId?: number }) {
    // In a real app, this would come from Inertia props.
    // For prototype, we resolve from mock data.
    const urlId =
        projectId ??
        parseInt(window.location.pathname.split('/').filter(Boolean)[1] ?? '1');
    const allProjects = [...initialProjectsPPN, ...initialProjectsNonPPN];
    const initialProject =
        allProjects.find((p) => p.id === urlId) ?? allProjects[0];

    const [fiscalMode] = useState<FiscalMode>(
        initialProject.id >= 100 ? 'non-ppn' : 'ppn',
    );
    const [displayedProject, setDisplayedProject] =
        useState<Project>(initialProject);
    const [locations, setLocations] = useState<BillboardLocation[]>(
        initialProject.locations || [],
    );

    // Mock update function for the prototype
    const onUpdateProject = (updated: Project) => {
        setDisplayedProject(updated);
    };

    const [activeTab, setActiveTab] = useState<ActiveTab>('info');

    // Issue Invoice Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [modalScheme, setModalScheme] = useState<PaymentScheme>('termin');
    const [modalDpPercent, setModalDpPercent] = useState<number>(30);
    const [modalTerminCount, setModalTerminCount] = useState<number>(3);
    const [modalTerminPercents, setModalTerminPercents] = useState<number[]>([
        30, 40, 30,
    ]);
    const [modalDueDates, setModalDueDates] = useState<Record<number, string>>(
        {},
    );
    const [modalPercentError, setModalPercentError] = useState<string | null>(
        null,
    );

    // Receive Payment Modal State
    const [selectedPayTerm, setSelectedPayTerm] = useState<PaymentTerm | null>(
        null,
    );
    const [payType, setPayType] = useState<'full' | 'partial'>('full');
    const [payAmountInput, setPayAmountInput] = useState<number>(0);
    const [payDateInput, setPayDateInput] = useState<string>(
        new Date().toISOString().split('T')[0],
    );
    const [payMethodInput, setPayMethodInput] =
        useState<string>('Transfer Bank BCA');
    const [payRefInput, setPayRefInput] = useState<string>('');

    const prj = displayedProject;
    const isPPN = fiscalMode === 'ppn';
    const fin = calcFinancials(prj, locations, fiscalMode);

    // Filter unpaid terms approaching due date (within 7 days or overdue)
    const dueAlerts = prj.clientPaymentPlan
        ? prj.clientPaymentPlan.terms.filter((t) => {
              if (t.status === 'paid') return false;
              const today = new Date();
              const due = new Date(t.dueDate);
              const diffDays = Math.ceil(
                  (due.getTime() - today.getTime()) / (1000 * 3600 * 24),
              );
              return diffDays <= 7;
          })
        : [];

    const hasPaidTerm = prj.clientPaymentPlan
        ? prj.clientPaymentPlan.terms.some((t) => t.status === 'paid')
        : false;

    const tabs = [
        {
            id: 'info' as ActiveTab,
            label: 'Info Proyek',
            icon: (
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            id: 'locations' as ActiveTab,
            label: 'Titik Lokasi',
            badge: locations.length,
            icon: (
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
        },
        {
            id: 'vendors' as ActiveTab,
            label: 'Vendor & PO',
            badge:
                locations.filter((l) => l.poIssued).length > 0
                    ? `${locations.filter((l) => l.poIssued).length}/${locations.length}`
                    : undefined,
            icon: (
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
            ),
        },
        {
            id: 'invoice' as ActiveTab,
            label: 'Invoice Client',
            icon: (
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
            ),
        },
    ];

    const poCount = locations.filter((l) => l.poIssued).length;

    const triggerInvoicePdf = (term?: PaymentTerm) => {
        const now = new Date();
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const yearStr = String(now.getFullYear()).slice(-2);
        const seqStr = String(Math.floor(Math.random() * 899) + 100).padStart(
            3,
            '0',
        );
        const newInvNumber =
            prj.invoiceNumber ||
            (isPPN
                ? `INV-${monthStr}/${yearStr}/${seqStr}`
                : `INV-NP-${monthStr}/${yearStr}/${seqStr}`);

        if (!prj.invoiceIssued) {
            onUpdateProject({
                ...prj,
                invoiceIssued: true,
                invoiceNumber: newInvNumber,
            });
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/client-invoice-pdf';
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

        const ratio = term ? term.percent / 100 : 1;
        const termTitle = term
            ? `${term.label} (${term.percent}%)`
            : 'Lunas Sekaligus (100%)';

        appendInput('_token', csrfToken);
        appendInput('clientName', prj.clientName || 'PT. Pakuwon Jati Tbk');
        appendInput(
            'clientSubName',
            prj.salesPIC ? `Attn: ${prj.salesPIC}` : '',
        );
        appendInput('invoiceNumber', newInvNumber);
        appendInput(
            'invoiceDate',
            now.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }),
        );
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('stream', 'true');
        appendInput('termLabel', termTitle);

        const sumVendorCost = locations.reduce(
            (s, l) => s + (l.vendorCost || 0),
            0,
        );
        const itemsToExport =
            locations.length > 0
                ? locations.map((loc) => {
                      const clientItemDpp =
                          (sumVendorCost > 0
                              ? (loc.vendorCost / sumVendorCost) *
                                prj.contractValue
                              : prj.contractValue / locations.length) * ratio;
                      return {
                          type: loc.type || 'Billboard',
                          size: loc.size || '4x6m',
                          orientation: loc.orientation || 'V',
                          description: term
                              ? `${term.label} – ${loc.description || prj.name}`
                              : loc.description || prj.name,
                          area: loc.area || '',
                          qty: loc.qty || 1,
                          clientPrice: clientItemDpp,
                          vendorCost: clientItemDpp,
                      };
                  })
                : [
                      {
                          type: 'Sewa Media Iklan',
                          size: '-',
                          orientation: 'V',
                          description: term
                              ? `${term.label} – ${prj.name}`
                              : prj.name || 'Kontrak Kampanye Iklan',
                          area: '',
                          qty: 1,
                          clientPrice: prj.contractValue * ratio,
                          vendorCost: prj.contractValue * ratio,
                      },
                  ];

        itemsToExport.forEach((loc, idx) => {
            appendInput(`locations[${idx}][type]`, loc.type);
            appendInput(`locations[${idx}][size]`, loc.size);
            appendInput(`locations[${idx}][orientation]`, loc.orientation);
            appendInput(`locations[${idx}][description]`, loc.description);
            appendInput(`locations[${idx}][area]`, loc.area);
            appendInput(`locations[${idx}][qty]`, loc.qty.toString());
            appendInput(
                `locations[${idx}][clientPrice]`,
                loc.clientPrice.toString(),
            );
            appendInput(
                `locations[${idx}][vendorCost]`,
                loc.vendorCost.toString(),
            );
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <AppLayout
            title="Detail Proyek"
            activePage="projects"
            breadcrumbs={[
                { label: 'Proyek', href: '/projects' },
                { label: prj.name, href: `/projects/${prj.id}` },
            ]}
        >
            <div className="w-full">
                <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-4 flex">
                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center gap-2 rounded-lg py-2 pr-4 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
                        >
                            <svg
                                className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600"
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
                            Kembali ke Daftar Proyek
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
                        {/* HEADER — Clean Modern Executive Header */}
                        <div className="border-b border-slate-200 bg-white px-8 py-6">
                            <div className="mb-5 flex items-start justify-between gap-6">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                                            {prj.code}
                                        </span>
                                        <StatusBadge status={prj.status} />
                                        <span className="rounded-md border border-slate-200/80 bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                                            {isPPN
                                                ? 'Mode PPN (11%)'
                                                : 'Mode Non-PPN'}
                                        </span>
                                    </div>
                                    <h2 className="pt-0.5 text-xl font-black leading-snug tracking-tight text-slate-900">
                                        {prj.name}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <span className="font-semibold text-slate-800">
                                            {prj.clientName}
                                        </span>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1 text-slate-500">
                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
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
                                            {prj.period}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Executive Financial Metrics - Clean Grid */}
                            <div className="grid grid-cols-4 gap-3.5 border-t border-slate-100 pt-4">
                                {/* Card 1: Nilai DPP / Kontrak */}
                                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5">
                                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        {isPPN
                                            ? 'Nilai DPP Kontrak'
                                            : 'Nilai Kontrak'}
                                    </div>
                                    <div className="text-sm font-black tabular-nums tracking-tight text-slate-900">
                                        {fmt(fin.dpp)}
                                    </div>
                                </div>

                                {/* Card 2: Total Tagihan */}
                                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3.5">
                                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                        Total Tagihan Client{' '}
                                        {isPPN && (
                                            <span className="text-[9px] font-black lowercase text-blue-600">
                                                (+ppn)
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm font-black tabular-nums tracking-tight text-slate-900">
                                        {fmt(fin.totalInvoice)}
                                    </div>
                                </div>

                                {/* Card 3: Estimasi Laba Bersih */}
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700/70">
                                        Estimasi Laba Bersih
                                    </div>
                                    <div
                                        className={`text-sm font-black tabular-nums tracking-tight ${fin.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                                    >
                                        {fmt(fin.netProfit)}
                                    </div>
                                </div>

                                {/* Card 4: Margin Keuntungan */}
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                                    <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700/70">
                                        Margin Keuntungan
                                    </div>
                                    <div
                                        className={`text-sm font-black tabular-nums tracking-tight ${fin.margin >= 30 ? 'text-indigo-700' : 'text-amber-700'}`}
                                    >
                                        {fin.margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TABS NAVIGATION — Clean Modern Border Tabs */}
                        <div className="flex flex-shrink-0 border-b border-slate-200 bg-white px-8">
                            <div className="flex gap-6">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex cursor-pointer items-center gap-2 border-b-2 py-3.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'border-blue-600 text-blue-600'
                                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                                            }`}
                                        >
                                            <span
                                                className={
                                                    isActive
                                                        ? 'text-blue-600'
                                                        : 'text-slate-400'
                                                }
                                            >
                                                {tab.icon}
                                            </span>
                                            <span>{tab.label}</span>
                                            {tab.badge !== undefined && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                                                        isActive
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CONTENT BODY */}
                        <div className="flex-1 space-y-6 overflow-y-auto p-7">
                            {/* INFO TAB — Styled Visual Cards & Clean Hierarchy */}
                            {activeTab === 'info' && (
                                <InfoTab
                                    project={displayedProject}
                                    isPPN={isPPN}
                                />
                            )}

                            {/* LOCATIONS TAB */}
                            {activeTab === 'locations' && (
                                <LocationsTab
                                    locations={locations}
                                    isPPN={isPPN}
                                    onAddLocation={(newLoc) => {
                                        const updated = [...locations, newLoc];
                                        setLocations(updated);
                                        onUpdateProject({
                                            ...prj,
                                            locations: updated,
                                        });
                                    }}
                                    onDeleteLocation={(locId) => {
                                        const updated = locations.filter(
                                            (l) => l.id !== locId,
                                        );
                                        setLocations(updated);
                                        onUpdateProject({
                                            ...prj,
                                            locations: updated,
                                        });
                                    }}
                                />
                            )}

                            {/* VENDOR & PO TAB */}
                            {activeTab === 'vendors' && (
                                <VendorPOTab
                                    locations={locations}
                                    isPPN={isPPN}
                                    projectCode={prj.code}
                                    project={prj}
                                    onIssuePO={(
                                        locId,
                                        poNumber,
                                        lighting,
                                        topNotes,
                                        vendorTermScheme,
                                        vendorTermPercents,
                                        vendorTermDates,
                                    ) => {
                                        const updated = locations.map((l) =>
                                            l.id === locId
                                                ? {
                                                      ...l,
                                                      poIssued: true,
                                                      poNumber,
                                                      lighting,
                                                      topNotes,
                                                      vendorTermScheme,
                                                      vendorTermPercents,
                                                      vendorTermDates,
                                                  }
                                                : l,
                                        );
                                        setLocations(updated);
                                        onUpdateProject({
                                            ...prj,
                                            locations: updated,
                                        });
                                    }}
                                    onUpdateProject={onUpdateProject}
                                />
                            )}

                            {/* INVOICE TAB */}
                            {activeTab === 'invoice' && (
                                <InvoiceTab
                                    project={displayedProject}
                                    isPPN={isPPN}
                                    onOpenInvoiceModal={() =>
                                        setShowInvoiceModal(true)
                                    }
                                    onUpdateProject={setDisplayedProject}
                                    onOpenPaymentModal={(term, targetAmt) => {
                                        setSelectedPayTerm(term);
                                        setPayType('full');
                                        setPayAmountInput(targetAmt);
                                        setPayDateInput(
                                            new Date()
                                                .toISOString()
                                                .split('T')[0],
                                        );
                                        setPayMethodInput('Transfer Bank');
                                        setPayRefInput('');
                                        setShowPaymentModal?.(true);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Catat Pembayaran Client (Full vs Partial) */}
                {selectedPayTerm && (
                    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
                        <div className="animate-in fade-in zoom-in w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                                        Terima Pembayaran Client
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {selectedPayTerm.label}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPayTerm(null)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Summary Box */}
                            {(() => {
                                const targetAmt = isPPN
                                    ? Math.round(selectedPayTerm.amount * 1.11)
                                    : selectedPayTerm.amount;
                                return (
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                                        <div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Target Tagihan Termin
                                            </div>
                                            <div className="font-mono text-sm font-black text-slate-900">
                                                {fmt(targetAmt)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Porsi Proyek
                                            </div>
                                            <div className="text-xs font-bold text-blue-600">
                                                {selectedPayTerm.percent}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Opsi Jenis Pembayaran: Full vs Partial */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Opsi Pembayaran
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPayType('full');
                                            const targetAmt = isPPN
                                                ? Math.round(
                                                      selectedPayTerm.amount *
                                                          1.11,
                                                  )
                                                : selectedPayTerm.amount;
                                            setPayAmountInput(targetAmt);
                                        }}
                                        className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                            payType === 'full'
                                                ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900 ring-2 ring-emerald-600/20'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="text-xs font-bold">
                                            Lunas Sekaligus
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-slate-500">
                                            100% nominal termin
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPayType('partial');
                                        }}
                                        className={`cursor-pointer rounded-2xl border p-3 text-left transition-all ${
                                            payType === 'partial'
                                                ? 'border-blue-600 bg-blue-50 font-bold text-blue-900 ring-2 ring-blue-600/20'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="text-xs font-bold">
                                            Cicil / Parsial
                                        </div>
                                        <div className="mt-0.5 text-[10px] text-slate-500">
                                            Sebagian nominal
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Nominal Input */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Nominal Diterima (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={payAmountInput || ''}
                                    readOnly={payType === 'full'}
                                    onChange={(e) =>
                                        setPayAmountInput(
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder="Masukkan nominal pembayaran..."
                                    className={`w-full rounded-xl border px-3.5 py-2.5 font-mono text-sm font-bold focus:outline-none ${
                                        payType === 'full'
                                            ? 'border-slate-300 bg-slate-100 text-slate-700'
                                            : 'border-blue-400 bg-white text-blue-950 focus:border-blue-600'
                                    }`}
                                />
                                {payType === 'partial' && (
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>Sisa tagihan termin ini:</span>
                                        <span className="font-mono font-bold text-slate-700">
                                            {fmt(
                                                Math.max(
                                                    0,
                                                    (isPPN
                                                        ? Math.round(
                                                              selectedPayTerm.amount *
                                                                  1.11,
                                                          )
                                                        : selectedPayTerm.amount) -
                                                        payAmountInput,
                                                ),
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Tanggal Pembayaran & Metode Pembayaran */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Tanggal Bayar
                                    </label>
                                    <div className="relative flex items-center">
                                        <div className="shadow-2xs flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-800 hover:border-blue-600">
                                            <span>
                                                {formatIndoDate(payDateInput)}
                                            </span>
                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
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
                                        </div>
                                        <input
                                            type="date"
                                            value={payDateInput}
                                            onChange={(e) =>
                                                setPayDateInput(e.target.value)
                                            }
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Metode Bayar
                                    </label>
                                    <select
                                        value={payMethodInput}
                                        onChange={(e) =>
                                            setPayMethodInput(e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                                    >
                                        <option value="Transfer Bank BCA">
                                            Transfer BCA
                                        </option>
                                        <option value="Transfer Bank Mandiri">
                                            Transfer Mandiri
                                        </option>
                                        <option value="Transfer Bank BRI">
                                            Transfer BRI
                                        </option>
                                        <option value="Kas / Tunai">
                                            Kas / Tunai
                                        </option>
                                        <option value="QRIS / E-Wallet">
                                            QRIS / E-Wallet
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Ref / Catatan */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    No. Ref / Bukti Transfer (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={payRefInput}
                                    onChange={(e) =>
                                        setPayRefInput(e.target.value)
                                    }
                                    placeholder="Contoh: TRX-884920 / BCA a/n Client"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPayTerm(null)}
                                    className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const targetAmt = isPPN
                                            ? Math.round(
                                                  selectedPayTerm.amount * 1.11,
                                              )
                                            : selectedPayTerm.amount;
                                        const isFull =
                                            payAmountInput >= targetAmt;
                                        const dppPaidAmt = isPPN
                                            ? Math.round(payAmountInput / 1.11)
                                            : payAmountInput;

                                        const updatedTerms =
                                            prj.clientPaymentPlan!.terms.map(
                                                (t) => {
                                                    if (
                                                        t.id ===
                                                        selectedPayTerm.id
                                                    ) {
                                                        return {
                                                            ...t,
                                                            status: (isFull
                                                                ? 'paid'
                                                                : 'unpaid') as PaymentTermStatus,
                                                            paidAmount:
                                                                dppPaidAmt,
                                                            paidAt:
                                                                payDateInput ||
                                                                new Date().toISOString(),
                                                            paymentMethod:
                                                                payMethodInput,
                                                            paymentRef:
                                                                payRefInput ||
                                                                undefined,
                                                        };
                                                    }
                                                    return t;
                                                },
                                            );

                                        const updatedPlan = {
                                            ...prj.clientPaymentPlan!,
                                            terms: updatedTerms,
                                        };
                                        const updatedPrj = {
                                            ...prj,
                                            clientPaymentPlan: updatedPlan,
                                        };
                                        setDisplayedProject(updatedPrj);
                                        onUpdateProject(updatedPrj);
                                        setSelectedPayTerm(null);
                                    }}
                                    className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
                                >
                                    Simpan Pembayaran
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Terbitkan Invoice & Skema Penagihan */}
                {showInvoiceModal && (
                    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4">
                        <div className="animate-in fade-in zoom-in w-full max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                        {!prj.clientPaymentPlan
                                            ? 'Atur Skema Pembayaran Client'
                                            : !prj.invoiceIssued
                                              ? 'Atur Skema & Terbitkan Invoice'
                                              : 'Ubah Skema Penagihan Client'}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Tentukan metode pembayaran dan tanggal
                                        jatuh tempo per termin
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Step 1: Pilih Scheme */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Pilih Skema Pembayaran
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        {
                                            id: 'full',
                                            label: 'Lunas Sekaligus',
                                            desc: 'Cash 100% saat terbit',
                                            defaultPercents: [100],
                                        },
                                        {
                                            id: 'dp',
                                            label: 'DP + Pelunasan',
                                            desc: 'DP 30% & Pelunasan 70%',
                                            defaultPercents: [30, 70],
                                        },
                                        {
                                            id: 'termin',
                                            label: 'Termin 3 Tahap',
                                            desc: 'Milestone progres 30-40-30%',
                                            defaultPercents: [30, 40, 30],
                                        },
                                        {
                                            id: 'installment',
                                            label: 'Cicilan Bulanan',
                                            desc: 'Angsuran berkala per bulan',
                                            defaultPercents: [33, 33, 34],
                                        },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setModalScheme(
                                                    s.id as PaymentScheme,
                                                );
                                                setModalTerminPercents(
                                                    s.defaultPercents,
                                                );
                                            }}
                                            className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                                                modalScheme === s.id
                                                    ? 'border-blue-600 bg-blue-50/90 text-blue-900 ring-2 ring-blue-600/20'
                                                    : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="text-xs font-bold text-slate-900">
                                                {s.label}
                                            </div>
                                            <div className="mt-1 text-[10px] font-medium text-slate-500">
                                                {s.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Tanggal Jatuh Tempo & Persentase Manual */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                        Rincian Termin, Persentase & Jatuh Tempo
                                    </label>
                                    {(() => {
                                        const sumPct =
                                            modalTerminPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );
                                        return (
                                            <span
                                                className={`rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                                                    sumPct === 100
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'animate-pulse border-rose-200 bg-rose-50 font-extrabold text-rose-700'
                                                }`}
                                            >
                                                Total: {sumPct}% (
                                                {fmt(fin.totalInvoice)})
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Additional Duration Controller for Installment Scheme */}
                                {modalScheme === 'installment' && (
                                    <div className="flex items-center justify-between rounded-2xl border border-blue-100/90 bg-blue-50/70 p-3">
                                        <div>
                                            <div className="text-xs font-bold text-blue-900">
                                                Durasi Angsuran Bulanan
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-medium text-blue-700">
                                                Ubah jumlah bulan cicilan yang
                                                diinginkan
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {(() => {
                                                const calcInstallmentPercents =
                                                    (
                                                        count: number,
                                                    ): number[] => {
                                                        const per = Math.round(
                                                            100 / count,
                                                        );
                                                        const res =
                                                            Array(count).fill(
                                                                per,
                                                            );
                                                        const sumExceptLast =
                                                            per * (count - 1);
                                                        res[count - 1] =
                                                            100 - sumExceptLast;
                                                        return res;
                                                    };

                                                return (
                                                    <>
                                                        {[3, 6, 12].map(
                                                            (monthsCount) => (
                                                                <button
                                                                    key={
                                                                        monthsCount
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setModalTerminPercents(
                                                                            calcInstallmentPercents(
                                                                                monthsCount,
                                                                            ),
                                                                        )
                                                                    }
                                                                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                                                                        modalTerminPercents.length ===
                                                                        monthsCount
                                                                            ? 'shadow-2xs border-blue-600 bg-blue-600 text-white'
                                                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {
                                                                        monthsCount
                                                                    }{' '}
                                                                    Bulan
                                                                </button>
                                                            ),
                                                        )}
                                                        <div className="mx-1 h-4 w-px bg-blue-200" />
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                modalTerminPercents.length <=
                                                                2
                                                            }
                                                            onClick={() => {
                                                                const newCount =
                                                                    Math.max(
                                                                        2,
                                                                        modalTerminPercents.length -
                                                                            1,
                                                                    );
                                                                setModalTerminPercents(
                                                                    calcInstallmentPercents(
                                                                        newCount,
                                                                    ),
                                                                );
                                                            }}
                                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-5 text-center font-mono text-xs font-bold text-blue-950">
                                                            {
                                                                modalTerminPercents.length
                                                            }
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                modalTerminPercents.length >=
                                                                24
                                                            }
                                                            onClick={() => {
                                                                const newCount =
                                                                    Math.min(
                                                                        24,
                                                                        modalTerminPercents.length +
                                                                            1,
                                                                    );
                                                                setModalTerminPercents(
                                                                    calcInstallmentPercents(
                                                                        newCount,
                                                                    ),
                                                                );
                                                            }}
                                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                        >
                                                            +
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div className="max-h-64 divide-y divide-slate-100 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200">
                                    {(() => {
                                        const now = new Date();
                                        const addDays = (
                                            d: Date,
                                            days: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setDate(res.getDate() + days);
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };
                                        const addMonths = (
                                            d: Date,
                                            months: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setMonth(
                                                res.getMonth() + months,
                                            );
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };

                                        let defaultLabels: string[] = [];
                                        if (modalScheme === 'full') {
                                            defaultLabels = [
                                                'Lunas Sekaligus (100%)',
                                            ];
                                        } else if (modalScheme === 'dp') {
                                            defaultLabels = [
                                                'Termin 1 – Uang Muka (DP)',
                                                'Termin 2 – Pelunasan',
                                            ];
                                        } else if (modalScheme === 'termin') {
                                            defaultLabels = [
                                                'Termin 1 – Uang Muka',
                                                'Termin 2 – Progress',
                                                'Termin 3 – Pelunasan',
                                            ];
                                        } else {
                                            const count =
                                                modalTerminPercents.length;
                                            defaultLabels = Array.from(
                                                { length: count },
                                                (_, i) =>
                                                    `Cicilan ${i + 1} dari ${count}`,
                                            );
                                        }

                                        return defaultLabels.map(
                                            (label, idx) => {
                                                const pct =
                                                    modalTerminPercents[idx] ??
                                                    (modalScheme === 'full'
                                                        ? 100
                                                        : modalScheme === 'dp'
                                                          ? idx === 0
                                                              ? 30
                                                              : 70
                                                          : 30);
                                                const termAmt = Math.round(
                                                    (prj.contractValue * pct) /
                                                        100,
                                                );
                                                const termAmtWithPpn = isPPN
                                                    ? Math.round(termAmt * 1.11)
                                                    : termAmt;
                                                const defaultDue =
                                                    modalScheme ===
                                                    'installment'
                                                        ? addMonths(
                                                              now,
                                                              idx + 1,
                                                          )
                                                        : addDays(
                                                              now,
                                                              (idx + 1) * 7,
                                                          );
                                                const currentDate =
                                                    modalDueDates[idx] ||
                                                    defaultDue;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3 text-xs"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate font-bold text-slate-800">
                                                                {label}
                                                            </div>
                                                            <div className="font-mono text-[10px] font-semibold text-slate-500">
                                                                {fmt(
                                                                    termAmtWithPpn,
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-shrink-0 items-center gap-3">
                                                            {/* Percentage Input */}
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Porsi:
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={100}
                                                                    value={pct}
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const val =
                                                                            Math.max(
                                                                                0,
                                                                                Math.min(
                                                                                    100,
                                                                                    parseFloat(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                ),
                                                                            );
                                                                        const updated =
                                                                            [
                                                                                ...modalTerminPercents,
                                                                            ];
                                                                        updated[
                                                                            idx
                                                                        ] = val;
                                                                        setModalTerminPercents(
                                                                            updated,
                                                                        );
                                                                        setModalPercentError(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-mono text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                                                                />
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    %
                                                                </span>
                                                            </div>

                                                            {/* Due Date Picker (Indonesian Format) */}
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    Jatuh Tempo:
                                                                </span>
                                                                <div className="relative flex items-center">
                                                                    <div className="shadow-2xs flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 transition-colors hover:border-blue-600">
                                                                        <span>
                                                                            {formatIndoDate(
                                                                                currentDate,
                                                                            )}
                                                                        </span>
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
                                                                    </div>
                                                                    <input
                                                                        type="date"
                                                                        value={
                                                                            currentDate
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setModalDueDates(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [idx]: e
                                                                                        .target
                                                                                        .value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Error Banner when sum != 100% */}
                            {modalPercentError && (
                                <div className="shadow-2xs flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
                                    <span>{modalPercentError}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setModalPercentError(null)
                                        }
                                        className="ml-2 cursor-pointer text-sm font-extrabold text-rose-500 hover:text-rose-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Footer Action */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalPercentError(null);
                                        setShowInvoiceModal(false);
                                    }}
                                    className="cursor-pointer px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const sumPct =
                                            modalTerminPercents.reduce(
                                                (a, b) => a + (Number(b) || 0),
                                                0,
                                            );
                                        if (sumPct !== 100) {
                                            setModalPercentError(
                                                `Total persentase termin harus tepat 100% (saat ini ${sumPct}%). Silakan sesuaikan persentase termin.`,
                                            );
                                            return;
                                        }
                                        setModalPercentError(null);

                                        const now = new Date();
                                        const monthStr = String(
                                            now.getMonth() + 1,
                                        ).padStart(2, '0');
                                        const yearStr = String(
                                            now.getFullYear(),
                                        ).slice(-2);
                                        const seqStr = String(
                                            Math.floor(Math.random() * 899) +
                                                100,
                                        ).padStart(3, '0');
                                        const invNo =
                                            prj.invoiceNumber ||
                                            (isPPN
                                                ? `INV-${monthStr}/${yearStr}/${seqStr}`
                                                : `INV-NP-${monthStr}/${yearStr}/${seqStr}`);

                                        const addDays = (
                                            d: Date,
                                            days: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setDate(res.getDate() + days);
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };

                                        const addMonths = (
                                            d: Date,
                                            months: number,
                                        ) => {
                                            const res = new Date(d);
                                            res.setMonth(
                                                res.getMonth() + months,
                                            );
                                            return res
                                                .toISOString()
                                                .split('T')[0];
                                        };

                                        const totalDpp = prj.contractValue;
                                        let generatedTerms: PaymentTerm[] = [];

                                        if (modalScheme === 'full') {
                                            const pct =
                                                modalTerminPercents[0] ?? 100;
                                            generatedTerms = [
                                                {
                                                    id: `term-full-${Date.now()}`,
                                                    label: `Lunas Sekaligus (${pct}%)`,
                                                    amount: Math.round(
                                                        (totalDpp * pct) / 100,
                                                    ),
                                                    percent: pct,
                                                    dueDate:
                                                        modalDueDates[0] ||
                                                        addDays(now, 7),
                                                    status: 'unpaid',
                                                },
                                            ];
                                        } else if (modalScheme === 'dp') {
                                            const dpPct =
                                                modalTerminPercents[0] ?? 30;
                                            const pelPct =
                                                modalTerminPercents[1] ??
                                                100 - dpPct;
                                            const dpAmt = Math.round(
                                                (totalDpp * dpPct) / 100,
                                            );
                                            const pelAmt = Math.round(
                                                (totalDpp * pelPct) / 100,
                                            );
                                            generatedTerms = [
                                                {
                                                    id: `term-dp-${Date.now()}`,
                                                    label: `Termin 1 – Uang Muka (${dpPct}%)`,
                                                    amount: dpAmt,
                                                    percent: dpPct,
                                                    dueDate:
                                                        modalDueDates[0] ||
                                                        addDays(now, 7),
                                                    status: 'unpaid',
                                                },
                                                {
                                                    id: `term-pel-${Date.now()}`,
                                                    label: `Termin 2 – Pelunasan (${pelPct}%)`,
                                                    amount: pelAmt,
                                                    percent: pelPct,
                                                    dueDate:
                                                        modalDueDates[1] ||
                                                        addDays(now, 14),
                                                    status: 'unpaid',
                                                },
                                            ];
                                        } else if (modalScheme === 'termin') {
                                            const percents =
                                                modalTerminPercents.length === 3
                                                    ? modalTerminPercents
                                                    : [30, 40, 30];
                                            generatedTerms = percents.map(
                                                (pct, i) => {
                                                    const amount = Math.round(
                                                        (totalDpp * pct) / 100,
                                                    );
                                                    return {
                                                        id: `term-t${i + 1}-${Date.now() + i}`,
                                                        label:
                                                            i === 0
                                                                ? `Termin 1 – Uang Muka (${pct}%)`
                                                                : i ===
                                                                    percents.length -
                                                                        1
                                                                  ? `Termin ${i + 1} – Pelunasan (${pct}%)`
                                                                  : `Termin ${i + 1} (${pct}%)`,
                                                        amount,
                                                        percent: pct,
                                                        dueDate:
                                                            modalDueDates[i] ||
                                                            addDays(
                                                                now,
                                                                (i + 1) * 7,
                                                            ),
                                                        status: 'unpaid',
                                                    };
                                                },
                                            );
                                        } else {
                                            const percents =
                                                modalTerminPercents;
                                            generatedTerms = percents.map(
                                                (pct, i) => {
                                                    const amount = Math.round(
                                                        (totalDpp * pct) / 100,
                                                    );
                                                    return {
                                                        id: `term-ci${i + 1}-${Date.now() + i}`,
                                                        label: `Cicilan ${i + 1} dari ${percents.length} (${pct}%)`,
                                                        amount,
                                                        percent: pct,
                                                        dueDate:
                                                            modalDueDates[i] ||
                                                            addMonths(
                                                                now,
                                                                i + 1,
                                                            ),
                                                        status: 'unpaid',
                                                    };
                                                },
                                            );
                                        }

                                        const newPlan: ClientPaymentPlan = {
                                            scheme: modalScheme,
                                            totalAmount: fin.totalInvoice,
                                            terms: generatedTerms,
                                            createdAt: now.toISOString(),
                                        };

                                        const updated = {
                                            ...prj,
                                            invoiceIssued: true,
                                            invoiceNumber: invNo,
                                            clientPaymentPlan: newPlan,
                                        };

                                        setDisplayedProject(updated);
                                        onUpdateProject(updated);
                                        setShowInvoiceModal(false);
                                    }}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-700"
                                >
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
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {!prj.clientPaymentPlan
                                        ? 'Simpan Skema Pembayaran'
                                        : !prj.invoiceIssued
                                          ? 'Simpan Skema & Terbitkan Invoice'
                                          : 'Simpan Perubahan Skema'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
