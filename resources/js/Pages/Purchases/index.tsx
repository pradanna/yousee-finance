import React, { useState } from "react";
import AppLayout, { useFiscalMode } from "@/Layouts/AppLayout";
import MetricCard from "@/Components/Card/MetricCard";
import { IssuePOModal } from "@/Components/Modal/IssuePOModal";
import type { IssuePOModalSubmitData } from "@/Components/Modal/IssuePOModal";
import { initialProjectsPPN, initialProjectsNonPPN, initialVendorPOs } from "./purchasesData";
import { PPN_RATE, fmt, formatDate } from "./purchasesTypes";
import type { PurchaseProject, VendorPO, VendorPaymentTerm, BillboardLocation } from "./purchasesTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Purchases Page — Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Purchases() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === "ppn";

    const [projects, setProjects] = useState<PurchaseProject[]>(isPPN ? initialProjectsPPN : initialProjectsNonPPN);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [activePoTab, setActivePoTab] = useState<"all_projects" | "pending_queue" | "issued_pos" | "top_schedule">("all_projects");

    const [vendorPOs, setVendorPOs] = useState<Record<string, VendorPO>>(initialVendorPOs);
    const [showPoForm, setShowPoForm] = useState(false);
    const [poFormVendor, setPoFormVendor] = useState<{ id: number; name: string; locs: BillboardLocation[] } | null>(null);


    const activeProject = projects.find((p) => p.id === selectedProjectId);

    const filteredProjects = projects.filter(
        (p) =>
            p.locations.length > 0 &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const activeLocations = activeProject ? activeProject.locations : [];
    const pendingLocations = activeLocations.filter((l) => !l.poIssued && l.vendorId !== null);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleConfirmIssuePO = (data: IssuePOModalSubmitData) => {
        if (!poFormVendor || !selectedProjectId) return;

        const totalCost = poFormVendor.locs.reduce((s, l) => s + l.vendorCost * (l.qty || 1), 0);
        const ppnVal = isPPN ? totalCost * PPN_RATE : 0;
        const finalTotal = totalCost + ppnVal;

        // Convert IssuePOModalSubmitData → VendorPaymentTerm
        let terms: VendorPaymentTerm;
        if (data.scheme === "full" || data.scheme === "installment") {
            terms = { type: "full", notes: data.topNotes, fullDueDate: data.termDates[0] };
        } else if (data.scheme === "dp") {
            const dpPct = data.termPercents[0] ?? 50;
            terms = {
                type: "dp",
                notes: data.topNotes,
                dpPercent: dpPct,
                dpAmount: Math.round(finalTotal * (dpPct / 100)),
                dpDueDate: data.termDates[0],
                pelunasanDueDate: data.termDates[1],
            };
        } else {
            terms = {
                type: "termin",
                notes: data.topNotes,
                installments: data.termPercents.map((pct, i) => ({
                    percent: pct,
                    amount: Math.round(finalTotal * (pct / 100)),
                    note: `Termin ${i + 1}`,
                    dueDate: data.termDates[i],
                })),
            };
        }

        const nextPoNum = `PO-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const newPO: VendorPO = {
            poNumber: nextPoNum,
            vendorId: poFormVendor.id,
            vendorName: poFormVendor.name,
            paymentTerms: terms,
            issuedAt: new Date().toISOString().split("T")[0],
            totalAmount: finalTotal,
            // Save for PDF generation
            lighting: data.lighting,
            topNotes: data.topNotes,
        };

        setVendorPOs((prev) => ({ ...prev, [nextPoNum]: newPO }));

        const updatedLocs = poFormVendor.locs.map((l) => ({ ...l, poIssued: true, poNumber: nextPoNum }));
        setProjects((prevProjects) =>
            prevProjects.map((p) => {
                if (p.id !== selectedProjectId) return p;
                return {
                    ...p,
                    locations: p.locations.map((l) =>
                        l.vendorId === poFormVendor.id && !l.poIssued ? { ...l, poIssued: true, poNumber: nextPoNum } : l
                    ),
                };
            })
        );

        setShowPoForm(false);
        setPoFormVendor(null);
        setSuccessMessage(`Berhasil menerbitkan PO ${nextPoNum} untuk ${poFormVendor.name}!`);
        setTimeout(() => setSuccessMessage(""), 4000);

        // Auto-download PDF after issuance
        const projectData = projects.find((p) => p.id === selectedProjectId);
        handleDownloadPO(
            poFormVendor.name,
            nextPoNum,
            updatedLocs,
            projectData?.name ?? "",
            projectData?.period ?? "",
            data.lighting,
            data.topNotes
        );
    };

    // ─── PDF Download (POST to /po-pdf via hidden form) ───────────────────────
    const handleDownloadPO = (
        vendorName: string,
        poNumber: string,
        items: BillboardLocation[],
        projectName: string,
        projectPeriod: string,
        lighting = "Berlampu",
        topNotes = "Lunas setelah visual terpasang"
    ) => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/po-pdf";
        form.target = "_blank";

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

        const appendInput = (name: string, value: string) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput("_token", csrfToken);
        appendInput("vendorName", vendorName);
        appendInput("poNumber", poNumber);
        appendInput("isPPN", isPPN ? "true" : "false");
        appendInput("stream", "true");
        appendInput("project[name]", projectName);
        appendInput("project[period]", projectPeriod);

        items.forEach((item, index) => {
            appendInput(`locations[${index}][id]`, item.id.toString());
            appendInput(`locations[${index}][description]`, item.description);
            appendInput(`locations[${index}][area]`, item.area);
            appendInput(`locations[${index}][type]`, item.type);
            appendInput(`locations[${index}][size]`, item.size || "4x6");
            appendInput(`locations[${index}][vendorCost]`, item.vendorCost.toString());
            appendInput(`locations[${index}][lighting]`, lighting);
            appendInput(`locations[${index}][topNotes]`, topNotes);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // ─── Derived Data ─────────────────────────────────────────────────────────

    const locationsByVendor = activeLocations.reduce<Record<number, { vendorName: string; locs: BillboardLocation[] }>>(
        (acc, l) => {
            if (l.vendorId === null) return acc;
            if (!acc[l.vendorId]) acc[l.vendorId] = { vendorName: l.vendorName, locs: [] };
            acc[l.vendorId].locs.push(l);
            return acc;
        },
        {}
    );

    const allLocations = projects.flatMap((p) => p.locations);
    const totalIssuedPO = allLocations.filter((l) => l.poIssued).length;
    const totalPendingPO = allLocations.filter((l) => !l.poIssued && l.vendorId !== null).length;
    const totalPurchaseVal = allLocations.reduce((s, l) => s + (l.poIssued ? l.vendorCost * (l.qty || 1) : 0), 0);
    const totalPPNMasukan = isPPN ? totalPurchaseVal * PPN_RATE : 0;
    const totalPOValue = totalPurchaseVal + totalPPNMasukan;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <AppLayout
            activePage="purchases"
            title="Pembelian & PO"
            breadcrumbs={[{ label: "Yousee Indonesia" }, { label: "Transaksi" }, { label: "Pembelian (PO)" }]}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center">
                        {activeProject && (
                            <button
                                onClick={() => setSelectedProjectId(null)}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer mr-3"
                                title="Kembali ke Daftar Proyek"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Penerbitan &amp; Kelola PO Vendor</h2>
                            <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                                {activeProject
                                    ? `Mengelola PO untuk Proyek: ${activeProject.code}`
                                    : `Pusat Pemesanan Pembelian Vendor - ${isPPN ? "Mode PPN Aktif" : "Mode Non-PPN"}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Metric Cards */}
                {!activeProject && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            title="PO Diterbitkan"
                            value={String(totalIssuedPO)}
                            badgeText="Telah Terbit"
                            badgeColorClass="bg-primary/10 text-primary border-primary/20"
                            valueColorClass="text-primary"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                            iconColorClass="bg-primary/10 text-primary border-primary/20"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs hover:border-primary/40"
                        />
                        <MetricCard
                            title="Menunggu PO"
                            value={String(totalPendingPO)}
                            badgeText={totalPendingPO > 0 ? "Pending Task" : "Lengkap"}
                            badgeColorClass={totalPendingPO > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}
                            valueColorClass={totalPendingPO > 0 ? "text-amber-600 font-black" : "text-slate-700"}
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            iconColorClass="bg-amber-50 text-amber-600 border-amber-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs hover:border-amber-200"
                        />
                        <MetricCard
                            title="Total Beban Vendor (DPP)"
                            value={fmt(totalPurchaseVal)}
                            badgeText="Sebelum Pajak"
                            badgeColorClass="bg-slate-100 text-slate-600 border-slate-200"
                            valueColorClass="text-slate-900"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            iconColorClass="bg-slate-50 text-slate-600 border-slate-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs"
                        />
                        <MetricCard
                            title={isPPN ? "Total HPP PO (incl. PPN)" : "Total Nilai PO"}
                            value={fmt(totalPOValue)}
                            badgeText={isPPN ? "Mode PPN 11%" : "Mode Non-PPN"}
                            badgeColorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                            valueColorClass="text-emerald-600"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            iconColorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
                            cardBgClass="bg-white border border-slate-200/90 shadow-2xs"
                        />
                    </div>
                )}

                {/* Success Toast Notification */}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-emerald-800 animate-fade-in-down shadow-2xs">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {successMessage}
                    </div>
                )}

                {/* ─── VIEW A: Project List (No Project Selected) ─── */}
                {!activeProject ? (
                    <div className="space-y-5">
                        {/* Unified Filter & Search Container */}
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                                {/* Tab Filter */}
                                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex-wrap">
                                    {[
                                        {
                                            key: "all_projects" as const,
                                            label: "Semua PO Proyek",
                                            badge: String(projects.length),
                                            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
                                        },
                                        {
                                            key: "issued_pos" as const,
                                            label: "PO Resmi Terbit",
                                            badge: String(Object.keys(vendorPOs).length),
                                            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
                                        },
                                        {
                                            key: "top_schedule" as const,
                                            label: "Jadwal TOP Vendor",
                                            badge: null,
                                            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActivePoTab(tab.key)}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                                activePoTab === tab.key
                                                    ? "bg-primary text-white shadow-neon-primary"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                {tab.icon}
                                            </svg>
                                            <span>{tab.label}</span>
                                            {tab.badge !== null && (
                                                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activePoTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    ))}

                                    {/* Pending Queue (special styling) */}
                                    <button
                                        type="button"
                                        onClick={() => setActivePoTab("pending_queue")}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                            activePoTab === "pending_queue"
                                                ? "bg-amber-600 text-white shadow-2xs"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Antrean Pending PO</span>
                                        {totalPendingPO > 0 && (
                                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-amber-500 text-white font-black animate-pulse">
                                                {totalPendingPO} Titik
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative w-full lg:w-72 flex-shrink-0">
                                    <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari proyek, kode, atau client..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TAB 1: ALL PROJECTS */}
                        {activePoTab === "all_projects" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredProjects.map((proj) => {
                                    const pendingCount = proj.locations.filter((l) => !l.poIssued && l.vendorId !== null).length;
                                    const issuedCount = proj.locations.filter((l) => l.poIssued).length;
                                    const percent = proj.locations.length > 0 ? (issuedCount / proj.locations.length) * 100 : 0;
                                    return (
                                        <div
                                            key={proj.id}
                                            onClick={() => setSelectedProjectId(proj.id)}
                                            className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-primary/50 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded tracking-widest">{proj.code}</span>
                                                    {pendingCount > 0 ? (
                                                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full animate-pulse">{pendingCount} Pending PO</span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">PO Lengkap</span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors line-clamp-1">{proj.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{proj.clientName} &middot; {proj.salesPIC}</p>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex-1">
                                                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 font-mono">{issuedCount}/{proj.locations.length} Titik</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredProjects.length === 0 && (
                                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-semibold">Tidak ditemukan proyek yang cocok dengan kata kunci pencarian.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: PENDING QUEUE */}
                        {activePoTab === "pending_queue" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            Antrean Penerbitan PO Vendor (Pending Task)
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Daftar titik lokasi proyek aktif yang belum diterbitkan PO-nya oleh Keuangan</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">{totalPendingPO} Titik Butuh PO</span>
                                </div>
                                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                                    {projects.flatMap((p) =>
                                        p.locations
                                            .filter((l) => !l.poIssued && l.vendorId !== null)
                                            .map((loc) => ({ project: p, location: loc }))
                                    ).length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                                            Semua PO vendor dari seluruh proyek sudah selesai diterbitkan
                                        </div>
                                    ) : (
                                        projects
                                            .flatMap((p) =>
                                                p.locations
                                                    .filter((l) => !l.poIssued && l.vendorId !== null)
                                                    .map((loc) => ({ project: p, location: loc }))
                                            )
                                            .map(({ project, location }) => {
                                                const itemDpp = location.vendorCost * (location.qty || 1);
                                                const itemTotal = isPPN ? itemDpp * (1 + PPN_RATE) : itemDpp;
                                                return (
                                                    <div key={`${project.id}-${location.id}`} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors flex-wrap">
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono font-bold">{project.code}</span>
                                                                <span className="text-xs font-bold text-slate-900 truncate">{project.name}</span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-2 flex-wrap">
                                                                <span className="text-slate-800 font-bold">{location.description}</span>
                                                                <span>&bull;</span>
                                                                <span>{location.area}</span>
                                                                <span>&bull;</span>
                                                                <span>Vendor: <strong className="text-slate-900">{location.vendorName}</strong></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 flex-shrink-0">
                                                            <div className="text-right">
                                                                <div className="text-xs font-bold font-mono text-slate-900">{fmt(itemTotal)}</div>
                                                                <div className="text-[9px] text-slate-400">{isPPN ? "Inc PPN 11%" : "Non PPN"}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedProjectId(project.id)}
                                                                className="px-3.5 py-1.5 bg-primary hover:bg-primary-700 text-white text-[11px] font-bold rounded-xl shadow-neon-primary transition-all cursor-pointer flex items-center gap-1.5"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                </svg>
                                                                <span>Proses PO Proyek</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: ISSUED POs */}
                        {activePoTab === "issued_pos" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Daftar Dokumen PO Vendor Resmi Terbit
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Dokumen PO resmi yang telah diterbitkan dan dikirim ke pihak vendor</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">{Object.keys(vendorPOs).length} Dokumen PO</span>
                                </div>
                                <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    {Object.values(vendorPOs).map((po) => (
                                        <div key={po.poNumber} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors flex-wrap">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold font-mono">{po.poNumber}</span>
                                                    <span className="text-xs font-bold text-slate-900">{po.vendorName}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                                    <span>Terbit: <strong className="text-slate-700">{formatDate(po.issuedAt)}</strong></span>
                                                    <span>&bull;</span>
                                                    <span>Skema: <strong className="text-slate-700">{po.paymentTerms.notes || po.paymentTerms.type}</strong></span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold font-mono text-slate-900">{fmt(po.totalAmount)}</div>
                                                    <div className="text-[9px] text-slate-400">Dokumen PO Resmi</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // Find all locations belonging to this PO
                                                        const poLocs = projects
                                                            .flatMap((p) => p.locations)
                                                            .filter((l) => l.poNumber === po.poNumber);
                                                        const project = projects.find((p) =>
                                                            p.locations.some((l) => l.poNumber === po.poNumber)
                                                        );
                                                        handleDownloadPO(
                                                            po.vendorName,
                                                            po.poNumber,
                                                            poLocs,
                                                            project?.name ?? "",
                                                            project?.period ?? "",
                                                            po.lighting,
                                                            po.topNotes
                                                        );
                                                    }}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span>Unduh PO PDF</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: TOP SCHEDULE */}
                        {activePoTab === "top_schedule" && (
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Jadwal &amp; Termin Pembayaran TOP Vendor (Cashflow Outflow)
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Monitoring jatuh tempo pelaksanaan pembayaran vendor dari seluruh proyek</p>
                                    </div>
                                </div>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    {Object.values(vendorPOs).map((po) => (
                                        <div key={`top-${po.poNumber}`} className="p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-800">{po.poNumber}</span>
                                                    <span className="text-slate-400">&bull;</span>
                                                    <span className="font-bold text-slate-900">{po.vendorName}</span>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">{fmt(po.totalAmount)}</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2">
                                                <span>Ket. Skema: <strong>{po.paymentTerms.notes || "DP & Pelunasan"}</strong></span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">Jadwal Sesuai Perjanjian PO</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // ─── VIEW B: Manage PO for Selected Project ───────────────────────────
                    <div className="space-y-6">
                        {/* Project Info Header */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="col-span-2">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded tracking-widest uppercase">{activeProject.code}</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight">{activeProject.name}</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">{activeProject.clientName} &middot; Sales: {activeProject.salesPIC}</p>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Titik Lokasi</div>
                                <div className="text-base font-black font-mono text-slate-900">{activeLocations.length} Titik</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{activeLocations.filter((l) => l.poIssued).length} PO Diterbitkan</div>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Nilai PO Tertunda</div>
                                <div className="text-base font-black font-mono text-amber-600">
                                    {fmt(pendingLocations.reduce((s, l) => s + l.vendorCost * (l.qty || 1), 0))}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{pendingLocations.length} titik belum dipesan</div>
                            </div>
                        </div>

                        {/* Vendor Location Groups */}
                        <div className="space-y-5">
                            {Object.entries(locationsByVendor).map(([vIdStr, group]) => {
                                const vId = parseInt(vIdStr);
                                const vendorLocs = group.locs;
                                const pendingVendorLocs = vendorLocs.filter((l) => !l.poIssued);
                                const dppVendor = vendorLocs.reduce((s, l) => s + l.vendorCost * (l.qty || 1), 0);
                                const ppnVendor = isPPN ? dppVendor * PPN_RATE : 0;
                                const totalVendor = dppVendor + ppnVendor;

                                return (
                                    <div key={vId} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                                        {/* Vendor Header */}
                                        <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-900">{group.vendorName}</h4>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        {vendorLocs.length} Titik Lokasi &bull; Total Biaya Vendor Ini:{" "}
                                                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{fmt(dppVendor)}</span>
                                                        {isPPN && " (DPP)"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right mr-2">
                                                    <div className="font-mono font-black text-slate-900 text-xs">{fmt(totalVendor)}</div>
                                                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Nilai HPP</div>
                                                </div>
                                                {pendingVendorLocs.length > 0 ? (
                                                    <button
                                                        onClick={() => {
                                                            setPoFormVendor({ id: vId, name: group.vendorName, locs: pendingVendorLocs });
                                                            setShowPoForm(true);
                                                        }}
                                                        className="bg-primary hover:bg-primary-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-neon-primary transition-all flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span>Terbitkan PO Vendor</span>
                                                    </button>
                                                ) : (
                                                    vendorLocs.length > 0 &&
                                                    vendorLocs[0].poNumber && (
                                                        <button
                                                            onClick={() => {
                                                                const po = vendorPOs[vendorLocs[0].poNumber];
                                                                handleDownloadPO(
                                                                    group.vendorName,
                                                                    vendorLocs[0].poNumber,
                                                                    vendorLocs,
                                                                    activeProject?.name ?? "",
                                                                    activeProject?.period ?? "",
                                                                    po?.lighting,
                                                                    po?.topNotes
                                                                );
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span>Unduh PO PDF</span>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Location Items */}
                                        <div className="p-3 space-y-2.5 bg-slate-50/40">
                                            {vendorLocs.map((loc, idx) => {
                                                const locDpp = loc.vendorCost * (loc.qty || 1);
                                                const locPpn = isPPN ? locDpp * PPN_RATE : 0;
                                                const locTotal = locDpp + locPpn;
                                                return (
                                                    <div key={loc.id} className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-all">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                                        <span className="text-xs font-bold text-slate-800">{loc.description}</span>
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{loc.code}</span>
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">Qty: {loc.qty || 1}</span>
                                                                        {loc.poIssued ? (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">PO Terbit ({loc.poNumber})</span>
                                                                        ) : (
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Belum Terbit</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                                        Area: <span className="text-slate-600 font-semibold">{loc.area}</span> &middot; Ukuran: <span className="text-slate-600 font-semibold">{loc.size}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                {isPPN && <div className="text-[9px] text-slate-400">DPP: {fmt(loc.vendorCost)}/u</div>}
                                                                <div className="font-mono text-xs font-bold text-slate-900">{fmt(locTotal)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Vendor Footer */}
                                        <div className="bg-slate-50/70 px-4 py-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
                                            <span className="text-slate-600 uppercase tracking-wider text-[10px]">Subtotal Biaya Vendor ({group.vendorName})</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400 font-normal">{vendorLocs.length} Titik Lokasi</span>
                                                <span className="font-mono font-black text-sm text-slate-900 px-1 py-1">
                                                    {fmt(totalVendor)} {isPPN && <span className="text-[10px] font-bold text-slate-500">(incl. PPN)</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {Object.keys(locationsByVendor).length === 0 && (
                                <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center">
                                    <p className="text-xs text-slate-400 font-semibold">Tidak ada titik lokasi billboard yang memiliki vendor partner dalam project ini.</p>
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
                        description: l.description,
                        area: l.area,
                        vendorCost: l.vendorCost,
                        qty: l.qty,
                    }))}
                    isPPN={isPPN}
                    onSubmit={handleConfirmIssuePO}
                />
            )}


        </AppLayout>
    );
}
