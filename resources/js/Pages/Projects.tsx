import React, { useState, useMemo } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import AppLayout, { useFiscalMode } from "@/Layouts/AppLayout";
import SlideOver from "@/Components/UI/SlideOver";
import Modal from "@/Components/UI/Modal";
import PrimaryButton from "@/Components/Button/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import SelectInput from "@/Components/Form/SelectInput";
import MetricCard from "@/Components/Card/MetricCard";
import Pagination from "@/Components/Table/Pagination";
import EmptyState from "@/Components/Table/EmptyState";
import ActionDropdown from "@/Components/UI/ActionDropdown";
import ProjectDetailSlide, { StatusBadge } from "./Projects/ProjectDetailSlide";
import {
    BillboardLocation,
    Project,
    FiscalMode,
    ViewMode,
    PPN_RATE,
    mockVendors,
    mockClients,
    mockSalesPICs,
    fmt,
    calcFinancials,
} from "./Projects/projectTypes";
import { initialProjectsPPN, initialProjectsNonPPN } from "./Projects/projectData";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatPeriod(startStr: string, endStr: string): { label: string; duration: string } {
    if (!startStr || !endStr) return { label: "", duration: "" };
    
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return { label: "", duration: "" };
    }

    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    const startDay = String(start.getDate()).padStart(2, "0");
    const startMonth = monthNamesShort[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = String(end.getDate()).padStart(2, "0");
    const endMonth = monthNamesShort[end.getMonth()];
    const endYear = end.getFullYear();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

    let label = "";
    if (startYear === endYear && start.getMonth() === end.getMonth()) {
        label = `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
        label = `${startMonth} - ${endMonth} ${startYear}`;
    } else {
        label = `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }

    const duration = months > 1 
        ? `${months} Bulan (${diffDays} Hari)` 
        : `${diffDays} Hari`;

    return { label, duration };
}

const MONTH_MAP: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

/**
 * Parse period string like "01 Jun - 31 Agu 2026" or "01 Mar - 31 Mei 2026"
 * into { start: Date, end: Date }
 */
function parsePeriod(periodStr: string): { start: Date; end: Date } | null {
    // Format: "DD MMM - DD MMM YYYY" or "DD MMM YYYY - DD MMM YYYY"
    const match = periodStr.match(
        /^(\d{2})\s+(\w+)(?:\s+(\d{4}))?\s*-\s*(\d{2})\s+(\w+)\s+(\d{4})$/
    );
    if (!match) return null;

    const [, startDay, startMonStr, startYearStr, endDay, endMonStr, endYear] = match;
    const startMon = MONTH_MAP[startMonStr];
    const endMon = MONTH_MAP[endMonStr];
    if (startMon === undefined || endMon === undefined) return null;

    const year = parseInt(endYear, 10);
    const startYear = startYearStr ? parseInt(startYearStr, 10) : year;

    const start = new Date(startYear, startMon, parseInt(startDay, 10));
    const end   = new Date(year, endMon, parseInt(endDay, 10));
    return { start, end };
}

function calcPeriodProgress(periodStr: string, status: string): { 
    percent: number; 
    label: string; 
    barClass: string;
    textClass: string;
} {
    // Completed project always shows 100%
    if (status === "Completed") {
        return { 
            percent: 100, 
            label: "Masa Tayang Selesai", 
            barClass: "bg-rose-500", 
            textClass: "text-rose-600 font-bold" 
        };
    }

    const parsed = parsePeriod(periodStr);

    // Fallback if period can't be parsed
    if (!parsed) {
        return { 
            percent: 0, 
            label: "Belum Tayang", 
            barClass: "bg-slate-300", 
            textClass: "text-slate-400 font-medium" 
        };
    }

    const { start, end } = parsed;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Belum mulai
    if (today < start) {
        return { 
            percent: 0, 
            label: "Belum Tayang", 
            barClass: "bg-slate-300", 
            textClass: "text-slate-400 font-medium" 
        };
    }

    // Sudah selesai
    if (today > end) {
        return { 
            percent: 100, 
            label: "Masa Tayang Selesai", 
            barClass: "bg-rose-500", 
            textClass: "text-rose-600 font-bold" 
        };
    }

    // Sedang berjalan
    const daysPassed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysLeft   = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const percent    = Math.min(100, Math.round((daysPassed / totalDays) * 100));

    return { 
        percent, 
        label: `Berjalan ${daysPassed}/${totalDays} Hari (Sisa ${daysLeft} Hari)`, 
        barClass: "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500", 
        textClass: "text-blue-600 font-mono" 
    };
}



// ─────────────────────────────────────────────────────────────────────────────
// Main Projects Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Projects() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === "ppn";

    const [projects, setProjects] = useState<Project[]>(
        isPPN ? initialProjectsPPN : initialProjectsNonPPN
    );
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const [form, setForm] = useState({
        name: "",
        clientName: "",
        salesPIC: "",
        startDate: "",
        endDate: "",
        totalLocations: "1",
        contractValue: "",
        taxMode: "dpp" as "dpp" | "inc", // "dpp" = Belum PPN, "inc" = Sudah PPN
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const periodInfo = useMemo(() => {
        return formatPeriod(form.startDate, form.endDate);
    }, [form.startDate, form.endDate]);

    // Live calculations for Create Project modal
    const parsedRawValue = parseInt(form.contractValue.replace(/[^0-9]/g, "")) || 0;
    const computedFinancials = useMemo(() => {
        if (!parsedRawValue) return { dpp: 0, ppn: 0, total: 0 };
        if (!isPPN) {
            return { dpp: parsedRawValue, ppn: 0, total: parsedRawValue };
        }
        if (form.taxMode === "inc") {
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
    }, [parsedRawValue, form.taxMode, isPPN]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Nama proyek wajib diisi.";
        if (!form.clientName) errs.clientName = "Client wajib dipilih.";
        if (!form.startDate || !form.endDate) {
            errs.period = "Tanggal mulai dan selesai kampanye wajib diisi.";
        } else if (new Date(form.startDate) > new Date(form.endDate)) {
            errs.period = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
        }
        if (!form.contractValue) errs.contractValue = "Nilai kontrak wajib diisi.";

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        const newPrj: Project = {
            id: Date.now(),
            code: `PRJ-2026-${isPPN ? "PPN" : "NON"}${String(projects.length + 1).padStart(2, "0")}`,
            name: form.name,
            clientId: 99,
            clientName: form.clientName,
            salesPIC: form.salesPIC || "Sales Admin",
            period: periodInfo.label || "Bulan Ini",
            contractValue: computedFinancials.dpp, // Always save pure DPP in database
            status: "Draft",
            invoiceIssued: false,
            invoiceNumber: "",
            targetQty: parseInt(form.totalLocations) || 1,
            locations: [],
        };

        setProjects([newPrj, ...projects]);
        setIsCreateOpen(false);
        setForm({ name: "", clientName: "", salesPIC: "", startDate: "", endDate: "", totalLocations: "1", contractValue: "", taxMode: "dpp" });
        setErrors({});
    };

    const handleUpdateProject = (updated: Project) => {
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
        if (selectedProject?.id === updated.id) {
            setSelectedProject(updated);
        }
    };

    // Metrics calculation
    const totalActiveProjects = useMemo(() => {
        return projects.filter(p => p.status === "Active").length;
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
        const filtered = projects.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && p.status === "Active") ||
                (statusFilter === "draft" && p.status === "Draft") ||
                (statusFilter === "completed" && p.status === "Completed") ||
                (statusFilter === "pending_po" && p.locations.some(l => !l.poIssued)) ||
                (statusFilter === "no_invoice" && !p.invoiceIssued);

            return matchesSearch && matchesStatus;
        });

        // Sort priority:
        //   1. Akan datang (belum tayang) — startDate ascending (yang paling dekat muncul duluan)
        //   2. Sedang berjalan (on-air)   — endDate ascending (yang mau habis duluan)
        //   3. Selesai / expired          — startDate descending (paling baru dulu)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getTayangGroup = (p: Project): number => {
            if (p.status === "Completed" || p.status === "Cancelled") return 3;
            const parsed = parsePeriod(p.period);
            if (!parsed) return 2; // fallback ke on-air group
            if (today < parsed.start) return 1; // belum mulai
            if (today > parsed.end) return 3;   // sudah lewat
            return 2;                            // sedang berjalan
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
            currentPage * itemsPerPage
        );
    }, [filteredProjects, currentPage, itemsPerPage]);

    // Counts for filter chips
    const countAll = projects.length;
    const countActive = projects.filter(p => p.status === "Active").length;
    const countDraft = projects.filter(p => p.status === "Draft").length;
    const countPendingPO = projects.filter(p => p.locations.some(l => !l.poIssued)).length;
    const countNoInvoice = projects.filter(p => !p.invoiceIssued).length;

    return (
        <AppLayout
            activePage="projects"
            title="Manajemen Proyek Billboard"
            breadcrumbs={[{ label: "Yousee Indonesia" }, { label: "Transaksi" }, { label: "Data Proyek" }]}
        >
            <div className="space-y-6 w-full">
                {/* Header Title & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Manajemen Proyek Billboard</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Pantau pipeline kampanye iklan, titik lokasi media, PO vendor, dan invoice client</p>
                    </div>

                    <PrimaryButton onClick={() => setIsCreateOpen(true)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Proyek Baru
                    </PrimaryButton>
                </div>

                {/* Metric Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Proyek Aktif"
                        value={`${totalActiveProjects} Proyek`}
                        badgeText="Proyek Berjalan"
                        cardBgClass="bg-blue-50/60 border-blue-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-blue-800 border-blue-200/60"
                        icon={
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        }
                        iconColorClass="bg-white text-blue-600 border-blue-100 shadow-2xs"
                        valueColorClass="text-blue-950"
                    />
                    <MetricCard
                        title={isPPN ? "Total Nilai Kontrak (DPP)" : "Total Nilai Kontrak"}
                        value={fmt(totalContractValue)}
                        badgeText={isPPN ? "Mode PPN 11%" : "Mode Non-PPN"}
                        cardBgClass="bg-emerald-50/60 border-emerald-200/60 shadow-xs"
                        badgeColorClass="bg-white/90 text-emerald-800 border-emerald-200/60"
                        icon={
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                        iconColorClass="bg-white text-slate-600 border-slate-200/60 shadow-2xs"
                        valueColorClass="text-slate-900"
                    />
                </div>

                {/* Search & Fast Filter Chips Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    {/* Top Row: Search Input & View Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        {/* Search Input */}
                        <div className="flex-1 max-w-md space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Proyek</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                                    className="pl-9 text-xs block w-full"
                                />
                            </div>
                        </div>

                        {/* View Switcher Segmented Control */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mode Tampilan</label>
                            <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center cursor-pointer ${
                                        viewMode === "grid"
                                            ? "bg-primary text-white shadow-neon-primary shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                    title="Tampilan Kartu Rich Modular"
                                >
                                    <span>Grid Kartu</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setViewMode("kanban")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center cursor-pointer ${
                                        viewMode === "kanban"
                                            ? "bg-primary text-white shadow-neon-primary shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                    title="Tampilan Kanban Pipeline Board"
                                >
                                    <span>Kanban</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setViewMode("table")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center cursor-pointer ${
                                        viewMode === "table"
                                            ? "bg-primary text-white shadow-neon-primary shadow-xs"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    }`}
                                    title="Tampilan Tabel Detail"
                                >
                                    <span>Tabel</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Interactive Status Pills Navigation */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        {[
                            { key: "all", label: `Semua Proyek (${countAll})` },
                            { key: "active", label: `Aktif (${countActive})` },
                            { key: "draft", label: `Draft (${countDraft})` },
                            { key: "pending_po", label: `Pending PO (${countPendingPO})` },
                            { key: "no_invoice", label: `Invoicing (${countNoInvoice})` },
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
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                            isSelected
                                                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-extrabold"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80"
                                        }`}
                                    >
                                        {pill.label}
                                    </button>
                                );
                            })}
                        </div>
                </div>

                {/* ── VIEW 1: GRID KARTU RICH MODULAR ── */}
                {viewMode === "grid" && (
                    <>
                        {totalItems === 0 ? (
                            <EmptyState
                                title="Proyek Tidak Ditemukan"
                                description="Tidak ada data proyek billboard yang cocok dengan pencarian atau filter Anda."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedProjects.map((project) => {
                                    const fin = calcFinancials(project, project.locations, fiscalMode);
                                    const poCount = project.locations.filter(l => l.poIssued).length;
                                    const locCount = project.locations.length;
                                    const poProgress = locCount > 0 ? poCount / locCount : 0;

                                                    const periodProg = calcPeriodProgress(project.period, project.status);

                                                    return (
                                                        <div
                                                            key={project.id}
                                                            onClick={() => setSelectedProject(project)}
                                                            className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-3xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                                                        >
                                                            {/* Top Accent Line */}
                                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                            <div className="space-y-4">
                                                                {/* Card Header Badges */}
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                                            {project.code}
                                                                        </span>
                                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                                                                            isPPN ? "bg-violet-50 text-violet-700 border-violet-100" : "bg-slate-100 text-slate-600 border-slate-200"
                                                                        }`}>
                                                                            {isPPN ? "PPN 11%" : "Non-PPN"}
                                                                        </span>
                                                                    </div>
                                                                    <StatusBadge status={project.status} />
                                                                </div>

                                                                {/* Project Title & Client info */}
                                                                <div>
                                                                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                                                        {project.name}
                                                                    </h3>
                                                                    <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                                                        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                        </svg>
                                                                        <span className="truncate">{project.clientName}</span>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center justify-between border-t border-slate-100 pt-2">
                                                                        <span>PIC: {project.salesPIC} &middot; {project.period}</span>
                                                                        <span className="font-mono text-slate-700 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            {poCount}/{locCount} PO Terbit
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Milestone Stage Tracker Mini Bar - Progress Masa Tayang */}
                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                                        <span className="text-slate-500">Progress Masa Tayang</span>
                                                                        <span className={`text-[10px] ${periodProg.textClass}`}>{periodProg.label}</span>
                                                                    </div>
                                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                        <div
                                                                            className={`${periodProg.barClass} h-full rounded-full transition-all duration-500`}
                                                                            style={{ width: `${periodProg.percent}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                            {/* Financial Footer Box */}
                                            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 items-end">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nilai Tagihan</span>
                                                    <span className="font-mono text-sm font-bold text-slate-900 block mt-0.5">{fmt(fin.totalInvoice)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Laba</span>
                                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                        <span className={`font-mono text-xs font-bold ${fin.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                            {fmt(fin.netProfit)}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                            fin.margin >= 30 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                                        }`}>
                                                            {fin.margin.toFixed(0)}%
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
                {viewMode === "kanban" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Draft Column */}
                        <div className="bg-slate-100/70 rounded-3xl p-4 border border-slate-200/60 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Draft Proyek</h3>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                                    {projects.filter(p => p.status === "Draft").length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects.filter(p => p.status === "Draft").map(project => {
                                    const fin = calcFinancials(project, project.locations, fiscalMode);
                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{project.code}</span>
                                                <span className="text-[10px] font-semibold text-slate-400">{project.period}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-xs leading-snug">{project.name}</h4>
                                            <div className="text-[10px] text-slate-500 font-semibold">{project.clientName}</div>
                                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-400">Kontrak:</span>
                                                <span className="font-mono text-slate-900">{fmt(fin.totalInvoice)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Column */}
                        <div className="bg-blue-50/40 rounded-3xl p-4 border border-blue-100/60 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Proyek Aktif (Berjalan)</h3>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-700 border border-blue-100">
                                    {projects.filter(p => p.status === "Active").length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects.filter(p => p.status === "Active").map(project => {
                                    const fin = calcFinancials(project, project.locations, fiscalMode);
                                    const poCount = project.locations.filter(l => l.poIssued).length;
                                    const locCount = project.locations.length;
                                    const poProgress = locCount > 0 ? poCount / locCount : 0;

                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{project.code}</span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Aktif</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-xs leading-snug">{project.name}</h4>
                                            <div className="text-[10px] text-slate-500 font-semibold">{project.clientName}</div>

                                            {/* Progress Masa Tayang */}
                                            {(() => {
                                                const prog = calcPeriodProgress(project.period, project.status);
                                                return (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                                            <span>Masa Tayang</span>
                                                            <span className="font-mono text-slate-700">{poCount}/{locCount} PO Terbit</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`${prog.barClass} h-full rounded-full`} style={{ width: `${prog.percent}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-400">Laba Bersih:</span>
                                                <span className="font-mono text-emerald-600">{fmt(fin.netProfit)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Completed Column */}
                        <div className="bg-emerald-50/40 rounded-3xl p-4 border border-emerald-100/60 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Proyek Selesai</h3>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-100">
                                    {projects.filter(p => p.status === "Completed").length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {projects.filter(p => p.status === "Completed").map(project => {
                                    const fin = calcFinancials(project, project.locations, fiscalMode);
                                    return (
                                        <div
                                            key={project.id}
                                            onClick={() => setSelectedProject(project)}
                                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{project.code}</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Selesai</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-xs leading-snug">{project.name}</h4>
                                            <div className="text-[10px] text-slate-500 font-semibold">{project.clientName}</div>
                                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-400">Total Tagihan:</span>
                                                <span className="font-mono text-slate-900">{fmt(fin.totalInvoice)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── VIEW 3: TABEL LIST ── */}
                {viewMode === "table" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                                            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                                <th className="px-6 py-4">Kode & Proyek</th>
                                                <th className="px-6 py-4">Client & Sales</th>
                                                <th className="px-6 py-4">Periode</th>
                                                <th className="px-6 py-4 text-center">Titik Lokasi</th>
                                                <th className="px-6 py-4 text-right">Nilai Kontrak</th>
                                                <th className="px-6 py-4 text-right">Estimasi Laba</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                            {paginatedProjects.map((project, idx) => {
                                                const isNearBottom = idx >= paginatedProjects.length - 2;
                                                const fin = calcFinancials(project, project.locations, fiscalMode);
                                                const poProgress = project.locations.length > 0 ? project.locations.filter(l => l.poIssued).length / project.locations.length : 0;

                                                return (
                                                    <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                                                                    {project.code}
                                                                </span>
                                                            </div>
                                                            <div className="font-bold text-slate-800 mt-1">{project.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-xs font-bold text-slate-800">{project.clientName}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">PIC: {project.salesPIC}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                                                            {project.period}
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <div className="text-xs font-bold text-slate-800">{project.locations.length} Titik</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{Math.round(poProgress * 100)}% PO Terbit</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                                            <div>{fmt(fin.totalInvoice)}</div>
                                                            {isPPN && <div className="text-[10px] text-slate-400 font-semibold">DPP: {fmt(fin.dpp)}</div>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap">
                                                            <div className={fin.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>{fmt(fin.netProfit)}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{fin.margin.toFixed(1)}% margin</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <StatusBadge status={project.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <ActionDropdown
                                                                direction={isNearBottom ? 'up' : 'down'}
                                                                items={[
                                                                    {
                                                                        label: 'Kelola Detail Proyek',
                                                                        icon: (
                                                                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                        ),
                                                                        onClick: () => setSelectedProject(project),
                                                                    },
                                                                ]}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={(page) => setCurrentPage(page)}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* Create Project Modal */}
                <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="lg">
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Buat Proyek Kampanye Baru</h3>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Nama Proyek / Kampanye <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                    placeholder="Kampanye Iklan Film Toystory 5..."
                                />
                                {errors.name && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.name}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Client / Pengiklan <span className="text-rose-500">*</span></label>
                                <SelectInput
                                    value={form.clientName}
                                    onChange={e => setForm({ ...form, clientName: e.target.value })}
                                >
                                    <option value="">-- Pilih Client --</option>
                                    {mockClients.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </SelectInput>
                                {errors.clientName && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.clientName}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Sales PIC</label>
                                <SelectInput
                                    value={form.salesPIC}
                                    onChange={e => setForm({ ...form, salesPIC: e.target.value })}
                                >
                                    <option value="">-- Pilih Sales PIC --</option>
                                    {mockSalesPICs.map(pic => (
                                        <option key={pic} value={pic}>{pic}</option>
                                    ))}
                                </SelectInput>
                            </div>

                            {/* Periode Kampanye (Date Range) */}
                            <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Periode Kampanye <span className="text-rose-500">*</span>
                                    </label>
                                    {periodInfo.duration && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                                            <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {periodInfo.duration}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Mulai</span>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => setForm({ ...form, startDate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tanggal Selesai</span>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={e => setForm({ ...form, endDate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {errors.period && (
                                    <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.period}</span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Jumlah Titik Lokasi <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={form.totalLocations}
                                    onChange={e => setForm({ ...form, totalLocations: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                             {/* Switch Tax Mode & Input Nilai Kontrak */}
                             <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                                 <div className="flex items-center justify-between flex-wrap gap-2">
                                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                         <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                         </svg>
                                         Nilai Kontrak <span className="text-rose-500">*</span>
                                     </label>

                                     {/* Mode Switch Pills (Hanya jika PPN aktif) */}
                                     {isPPN && (
                                         <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl">
                                             <button
                                                 type="button"
                                                 onClick={() => setForm({ ...form, taxMode: "dpp" })}
                                                 className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                                     form.taxMode === "dpp"
                                                         ? "bg-white text-blue-700 shadow-2xs font-black"
                                                         : "text-slate-500 hover:text-slate-800"
                                                 }`}
                                             >
                                                 Belum PPN (DPP)
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => setForm({ ...form, taxMode: "inc" })}
                                                 className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                                     form.taxMode === "inc"
                                                         ? "bg-blue-600 text-white shadow-2xs font-black"
                                                         : "text-slate-500 hover:text-slate-800"
                                                 }`}
                                             >
                                                 Sudah Inc. PPN (11%)
                                             </button>
                                         </div>
                                     )}
                                 </div>

                                 <input
                                     type="text"
                                     value={form.contractValue}
                                     onChange={e => {
                                         const raw = e.target.value.replace(/[^0-9]/g, "");
                                         const formatted = raw ? parseInt(raw, 10).toLocaleString("id-ID") : "";
                                         setForm({ ...form, contractValue: formatted });
                                     }}
                                     className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs font-mono"
                                     placeholder={
                                         isPPN
                                             ? form.taxMode === "inc"
                                                 ? "Masukkan Nilai Total (Sudah Inc PPN 11%)..."
                                                 : "Masukkan Nilai DPP (Sebelum PPN)..."
                                             : "Masukkan Nilai Total Kontrak..."
                                     }
                                 />
                                 {errors.contractValue && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.contractValue}</span>}

                                 {/* Live Calculations Breakdown Card */}
                                 {isPPN && parsedRawValue > 0 && (
                                     <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100/90 space-y-1.5 text-xs">
                                         <div className="flex justify-between items-center text-slate-600">
                                             <span className="font-medium text-[11px]">Nilai DPP (Dasar Pajak)</span>
                                             <span className="font-mono font-bold text-slate-900">{fmt(computedFinancials.dpp)}</span>
                                         </div>
                                         <div className="flex justify-between items-center text-violet-700">
                                             <span className="font-medium text-[11px]">PPN Keluaran (11%)</span>
                                             <span className="font-mono font-bold">{fmt(computedFinancials.ppn)}</span>
                                         </div>
                                         <div className="flex justify-between items-center pt-1 border-t border-blue-200/60 text-slate-900 font-bold">
                                             <span className="text-[11px]">Total Tagihan Client</span>
                                             <span className="font-mono text-blue-700 font-black text-xs">{fmt(computedFinancials.total)}</span>
                                         </div>
                                     </div>
                                 )}
                             </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">
                                    Simpan Draft Proyek
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Project Detail Slide Over Panel — always rendered for smooth exit animation */}
                <ProjectDetailSlide
                    project={selectedProject}
                    isOpen={!!selectedProject}
                    onClose={() => setSelectedProject(null)}
                    fiscalMode={fiscalMode}
                    onUpdateProject={handleUpdateProject}
                />
            </div>
        </AppLayout>
    );
}
