import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

// Types
export interface VendorPaymentTerm {
    type: "full" | "dp" | "termin";
    notes?: string;
    
    // For Full Payment
    fullDueDays?: number;
    fullDueDate?: string;

    // For DP + Pelunasan
    dpPercent?: number;
    dpAmount?: number;
    dpDueDays?: number;
    dpDueDate?: string;
    pelunasanDueDays?: number;
    pelunasanDueDate?: string;

    // For Termin
    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
}

export interface VendorPO {
    poNumber: string;
    vendorId: number;
    vendorName: string;
    paymentTerms: VendorPaymentTerm;
    issuedAt: string;
    totalAmount: number;
}

interface BillboardLocation {
    id: number;
    code: string;
    area: string;
    description: string;
    type: "Billboard" | "Videotron" | "Baliho" | "Neonbox";
    size: string;
    vendorId: number | null;
    vendorName: string;
    qty?: number;
    vendorCost: number;
    poIssued: boolean;
    poNumber: string;
}

interface Project {
    id: number;
    code: string;
    name: string;
    clientId: number;
    clientName: string;
    salesPIC: string;
    period: string;
    contractValue: number;
    status: "Draft" | "Active" | "Completed" | "Cancelled";
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    targetQty: number;
}

const PPN_RATE = 0.11;

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return dateStr;
    }
};

// Mock Data consistent with Projects page
const initialProjectsPPN: Project[] = [
    {
        id: 1,
        targetQty: 5,
        code: "PRJ-2026-PPN01",
        name: "Kampanye Iklan Film Toystory 5 - Jawa Tengah",
        clientId: 1,
        clientName: "PT. Walt Disney Pictures Indonesia",
        salesPIC: "Budi Santoso",
        period: "Jul - Sep 2026",
        contractValue: 280000000,
        status: "Active",
        invoiceIssued: false,
        invoiceNumber: "",
        locations: [
            { id: 1, code: "LOC-001", area: "Semarang", description: "Billboard Jl. Pandanaran KM 3 (Megah)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 8500000, poIssued: true, poNumber: "PO-2026-0041", qty: 1 },
            { id: 2, code: "LOC-002", area: "Semarang", description: "Billboard Simpang Lima (Depan BCA)", type: "Billboard", size: "6x12m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 14000000, poIssued: true, poNumber: "PO-2026-0041", qty: 1 },
            { id: 3, code: "LOC-003", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0042", qty: 1 },
            { id: 4, code: "LOC-004", area: "Yogyakarta", description: "Baliho Jl. Malioboro (Dekat Kraton)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 7500000, poIssued: false, poNumber: "", qty: 1 },
            { id: 5, code: "LOC-005", area: "Yogyakarta", description: "Billboard Ring Road Utara Monjali", type: "Billboard", size: "4x8m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 9000000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 2,
        targetQty: 2,
        code: "PRJ-2026-PPN02",
        name: "Brand Awareness Shopee 12.12 - Jakarta",
        clientId: 2,
        clientName: "Shopee Indonesia",
        salesPIC: "Rina Widayanti",
        period: "Nov - Des 2026",
        contractValue: 450000000,
        status: "Draft",
        invoiceIssued: false,
        invoiceNumber: "",
        locations: [
            { id: 6, code: "LOC-006", area: "Semarang", description: "Billboard Jl. Pemuda (Dekat Paragon Mall)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 9500000, poIssued: false, poNumber: "", qty: 1 },
            { id: 7, code: "LOC-007", area: "Solo", description: "Videotron Solo Grand Mall", type: "Videotron", size: "3x5m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 15000000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 3,
        targetQty: 2,
        code: "PRJ-2026-PPN03",
        name: "Samsung Galaxy S27 Launching - Jabodetabek",
        clientId: 5,
        clientName: "Samsung Electronics Indonesia",
        salesPIC: "Budi Santoso",
        period: "Okt - Des 2026",
        contractValue: 720000000,
        status: "Active",
        invoiceIssued: false,
        invoiceNumber: "",
        locations: [
            { id: 12, code: "LOC-012", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0091", qty: 1 },
            { id: 13, code: "LOC-013", area: "Semarang", description: "Videotron Jl. Pahlawan", type: "Videotron", size: "4x8m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 19000000, poIssued: true, poNumber: "PO-2026-0091", qty: 1 },
        ]
    }
];

const initialProjectsNonPPN: Project[] = [
    {
        id: 101,
        targetQty: 3,
        code: "PRJ-2026-NON01",
        name: "Promosi Gojek UMKM - Jawa Timur",
        clientId: 3,
        clientName: "PT. Gojek Tokopedia",
        salesPIC: "Andi Prasetyo",
        period: "Agu - Okt 2026",
        contractValue: 180000000,
        status: "Active",
        invoiceIssued: false,
        invoiceNumber: "",
        locations: [
            { id: 8, code: "LOC-008", area: "Surabaya", description: "Baliho Jl. Darmo (Depan Taman Bungkul)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 5500000, poIssued: true, poNumber: "PO-2026-0055", qty: 1 },
            { id: 9, code: "LOC-009", area: "Malang", description: "Billboard Jl. Kahuripan (Alun-alun Kota)", type: "Billboard", size: "4x8m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 4200000, poIssued: true, poNumber: "PO-2026-0056", qty: 1 },
            { id: 10, code: "LOC-010", area: "Banyuwangi", description: "Neonbox Terminal Blambangan", type: "Neonbox", size: "1.5x2m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 2800000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 102,
        targetQty: 1,
        code: "PRJ-2026-NON02",
        name: "Baliho Kuliner Lokal Soto Bangkong - Solo",
        clientId: 4,
        clientName: "CV. Soto Bangkong Lestari",
        salesPIC: "Eko Prasetyo",
        period: "Sep - Nov 2026",
        contractValue: 45000000,
        status: "Active",
        invoiceIssued: false,
        invoiceNumber: "",
        locations: [
            { id: 11, code: "LOC-011", area: "Solo", description: "Baliho Jl. Adi Sucipto KM 5", type: "Baliho", size: "3x6m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 3500000, poIssued: true, poNumber: "PO-2026-0060", qty: 1 },
        ]
    },
    {
        id: 103,
        targetQty: 1,
        code: "PRJ-2026-NON03",
        name: "Papan Nama Neonbox Laundry Express - Yogya",
        clientId: 6,
        clientName: "Sari Laundry Express",
        salesPIC: "Andi Prasetyo",
        period: "Mei 2026",
        contractValue: 12500000,
        status: "Completed",
        invoiceIssued: true,
        invoiceNumber: "INV-2026-N001",
        locations: [
            { id: 14, code: "LOC-014", area: "Yogyakarta", description: "Neonbox Perempatan Tugu Yogyakarta", type: "Neonbox", size: "2x3m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 4500000, poIssued: true, poNumber: "PO-2026-0099", qty: 1 },
        ]
    }
];

export default function Purchases() {
    const fiscalMode = useDemoFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [projects, setProjects] = useState<Project[]>(isPPN ? initialProjectsPPN : initialProjectsNonPPN);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    // State for PO payment terms configuration & viewing PO documents
    const [vendorPOs, setVendorPOs] = useState<Record<string, VendorPO>>({
        "PO-2026-0041": { poNumber: "PO-2026-0041", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-20", totalAmount: 22500000 },
        "PO-2026-0042": { poNumber: "PO-2026-0042", vendorId: 2, vendorName: "CV. Media Ad Perkasa", paymentTerms: { type: "dp", dpPercent: 50, dpAmount: 11000000, notes: "DP 50% di muka, Pelunasan setelah pemasangan" }, issuedAt: "2026-06-21", totalAmount: 22000000 },
        "PO-2026-0091": { poNumber: "PO-2026-0091", vendorId: 2, vendorName: "CV. Media Ad Perkasa", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-22", totalAmount: 41000000 },
        "PO-2026-0055": { poNumber: "PO-2026-0055", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", paymentTerms: { type: "dp", dpPercent: 30, dpAmount: 1650000, notes: "DP 30%, Pelunasan 70% setelah pemasangan selesai" }, issuedAt: "2026-06-23", totalAmount: 5500000 },
        "PO-2026-0056": { poNumber: "PO-2026-0056", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-24", totalAmount: 4200000 },
        "PO-2026-0060": { poNumber: "PO-2026-0060", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-25", totalAmount: 3500000 },
        "PO-2026-0099": { poNumber: "PO-2026-0099", vendorId: 2, vendorName: "CV. Media Ad Perkasa", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-05-15", totalAmount: 4500000 },
    });

    const [showPoForm, setShowPoForm] = useState(false);
    const [poFormVendor, setPoFormVendor] = useState<{ id: number; name: string; locs: BillboardLocation[] } | null>(null);
    const [viewingPoNumber, setViewingPoNumber] = useState<string | null>(null);

    const activeProject = projects.find(p => p.id === selectedProjectId);

    // Filters projects based on searchQuery (filters projects that have locations)
    const filteredProjects = projects.filter(p => 
        p.locations.length > 0 && (
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    // Calculations for the selected project
    const activeLocations = activeProject ? activeProject.locations : [];
    const pendingLocations = activeLocations.filter(l => !l.poIssued && l.vendorId !== null);

    // Confirm and Issue PO with Terms
    const handleConfirmIssuePO = (terms: VendorPaymentTerm) => {
        if (!poFormVendor || !selectedProjectId) return;

        const totalCost = poFormVendor.locs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
        const ppnVal = isPPN ? totalCost * PPN_RATE : 0;
        const finalTotal = totalCost + ppnVal;

        // Generate PO number
        const nextPoNum = `PO-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;

        const newPO: VendorPO = {
            poNumber: nextPoNum,
            vendorId: poFormVendor.id,
            vendorName: poFormVendor.name,
            paymentTerms: terms,
            issuedAt: new Date().toISOString().split("T")[0],
            totalAmount: finalTotal
        };

        // Save PO details
        setVendorPOs(prev => ({
            ...prev,
            [nextPoNum]: newPO
        }));

        setProjects(prevProjects => prevProjects.map(p => {
            if (p.id !== selectedProjectId) return p;
            return {
                ...p,
                locations: p.locations.map(l => {
                    if (l.vendorId === poFormVendor.id && !l.poIssued) {
                        return {
                            ...l,
                            poIssued: true,
                            poNumber: nextPoNum
                        };
                    }
                    return l;
                })
            };
        }));

        setShowPoForm(false);
        setPoFormVendor(null);
        setSuccessMessage(`Berhasil menerbitkan PO ${nextPoNum} untuk ${poFormVendor.name}!`);
        setTimeout(() => setSuccessMessage(''), 4000);
        
        // Directly display the issued document
        setViewingPoNumber(nextPoNum);
    };

    // Group locations by vendor for the selected project
    const locationsByVendor = activeLocations.reduce<Record<number, { vendorName: string, locs: BillboardLocation[] }>>((acc, l) => {
        if (l.vendorId === null) return acc;
        if (!acc[l.vendorId]) {
            acc[l.vendorId] = { vendorName: l.vendorName, locs: [] };
        }
        acc[l.vendorId].locs.push(l);
        return acc;
    }, {});

    // General Summary Calculations across all projects
    const allLocations = projects.flatMap(p => p.locations);
    const totalIssuedPO = allLocations.filter(l => l.poIssued).length;
    const totalPendingPO = allLocations.filter(l => !l.poIssued && l.vendorId !== null).length;
    const totalPurchaseVal = allLocations.reduce((s, l) => s + (l.poIssued ? (l.vendorCost * (l.qty || 1)) : 0), 0);
    const totalPPNMasukan = isPPN ? totalPurchaseVal * PPN_RATE : 0;
    const totalPOValue = totalPurchaseVal + totalPPNMasukan;

    return (
        <DemoLayout
            activePage="purchases"
            title="Pembelian & PO"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Pembelian (PO)' }]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Penerbitan & Kelola PO Vendor</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                            {activeProject 
                                ? `Mengelola PO untuk Proyek: ${activeProject.code}` 
                                : `Pusat Pemesanan Pembelian Vendor - ${isPPN ? "Mode PPN Aktif" : "Mode Non-PPN"}`}
                        </p>
                    </div>
                    {activeProject && (
                        <button 
                            onClick={() => { setSelectedProjectId(null); }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 shadow-xs"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Kembali ke Daftar Proyek
                        </button>
                    )}
                </div>

                {/* Summary Cards */}
                {!activeProject && (
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: "PO Diterbitkan", value: String(totalIssuedPO), sub: "Telah dikirim ke vendor", color: "text-blue-600", emoji: "📄" },
                            { label: "Menunggu PO", value: String(totalPendingPO), sub: "Lokasi belum dipesan", color: totalPendingPO > 0 ? "text-amber-600 font-black" : "text-slate-500", emoji: "⏳" },
                            { label: "Total Beban Vendor (DPP)", value: fmt(totalPurchaseVal), sub: "Nilai sebelum pajak", color: "text-slate-900", emoji: "💰" },
                            { label: isPPN ? "Total HPP PO (incl. PPN)" : "Total Nilai PO", value: fmt(totalPOValue), sub: isPPN ? `PPN Masukan: ${fmt(totalPPNMasukan)}` : "Tanpa PPN", color: "text-emerald-600", emoji: "💸" }
                        ].map((c, i) => (
                            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
                                    <span className="text-lg">{c.emoji}</span>
                                </div>
                                <div className={`text-base font-black font-mono leading-tight ${c.color}`}>{c.value}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-1">{c.sub}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Notification toast */}
                {successMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold text-emerald-800 animate-fade-in-down shadow-xs">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {successMessage}
                    </div>
                )}

                {/* VIEW A: PROJECT LIST AND FILTER (If no project selected) */}
                {!activeProject ? (
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex gap-3">
                            <div className="relative flex-1">
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari berdasarkan nama proyek, kode, atau nama client..." 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Projects list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.map(proj => {
                                const pendingCount = proj.locations.filter(l => !l.poIssued && l.vendorId !== null).length;
                                const issuedCount = proj.locations.filter(l => l.poIssued).length;
                                const percent = proj.locations.length > 0 ? (issuedCount / proj.locations.length) * 100 : 0;
                                
                                return (
                                    <div 
                                        key={proj.id} 
                                        onClick={() => setSelectedProjectId(proj.id)} 
                                        className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded tracking-widest">{proj.code}</span>
                                                {pendingCount > 0 ? (
                                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded-full animate-pulse">
                                                        {pendingCount} Pending PO
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                                                        PO Lengkap
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{proj.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{proj.clientName} &middot; {proj.salesPIC}</p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                                                <span>Progress PO Proyek</span>
                                                <span>{issuedCount} / {proj.locations.length} Titik</span>
                                            </div>
                                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                                            </div>
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
                    </div>
                ) : (
                    // VIEW B: MANAGE PO FOR SELECTED PROJECT
                    <div className="space-y-6">
                        {/* Project Info Header */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white grid grid-cols-1 md:grid-cols-4 gap-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="col-span-2">
                                <div className="text-[9px] font-black text-blue-400 tracking-widest bg-blue-400/10 px-2 py-0.5 rounded uppercase inline-block mb-2">{activeProject.code}</div>
                                <h3 className="text-base font-bold text-white leading-tight">{activeProject.name}</h3>
                                <p className="text-xs text-slate-400 mt-1">{activeProject.clientName} &middot; Sales: {activeProject.salesPIC}</p>
                            </div>
                            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 text-center">
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Titik Lokasi</div>
                                <div className="text-lg font-black font-mono text-white">{activeLocations.length} Titik</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{activeLocations.filter(l => l.poIssued).length} PO Diterbitkan</div>
                            </div>
                            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 text-center">
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Nilai PO Tertunda</div>
                                <div className="text-lg font-black font-mono text-amber-400">
                                    {fmt(pendingLocations.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0))}
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{pendingLocations.length} titik belum dipesan</div>
                            </div>
                        </div>

                        {/* Grouping by Vendor */}
                        <div className="space-y-6">
                            {Object.entries(locationsByVendor).map(([vIdStr, group]) => {
                                const vId = parseInt(vIdStr);
                                const vendorLocs = group.locs;
                                const pendingVendorLocs = vendorLocs.filter(l => !l.poIssued);

                                // Calculations for this vendor's PO
                                const dppVendor = vendorLocs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
                                const ppnVendor = isPPN ? dppVendor * PPN_RATE : 0;
                                const totalVendor = dppVendor + ppnVendor;

                                return (
                                    <div key={vId} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
                                        {/* Vendor Header */}
                                        <div className="bg-slate-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="text-xs font-black text-slate-800">{group.vendorName}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        {vendorLocs.length} titik &middot; DPP {fmt(dppVendor)}
                                                        {isPPN && ppnVendor > 0 && <span className="text-violet-500 font-bold"> + PPN {fmt(ppnVendor)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <div className="font-mono font-black text-slate-800 text-sm">{fmt(totalVendor)}</div>
                                                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Nilai HPP</div>
                                                </div>
                                                {pendingVendorLocs.length > 0 ? (
                                                    <button 
                                                        onClick={() => {
                                                            setPoFormVendor({ id: vId, name: group.vendorName, locs: pendingVendorLocs });
                                                            setShowPoForm(true);
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1"
                                                    >
                                                        Terbitkan PO Vendor
                                                    </button>
                                                ) : (
                                                    vendorLocs.length > 0 && vendorLocs[0].poNumber && (
                                                        <button 
                                                            onClick={() => setViewingPoNumber(vendorLocs[0].poNumber)}
                                                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            Lihat Dokumen PO
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Locations Item List under Vendor */}
                                        <div className="divide-y divide-slate-50">
                                            {vendorLocs.map(loc => {
                                                const locDpp = loc.vendorCost * (loc.qty || 1);
                                                const locPpn = isPPN ? locDpp * PPN_RATE : 0;
                                                const locTotal = locDpp + locPpn;
                                                return (
                                                    <div key={loc.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50/20 transition-all">
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div className="w-4 h-4 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                                {loc.poIssued ? (
                                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{loc.code}</span>
                                                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">Qty: {loc.qty || 1}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400">{loc.size}</span>
                                                                </div>
                                                                <div className="font-bold text-xs text-slate-700 truncate">{loc.description}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Individual line actions & costs */}
                                                        <div className="flex items-center gap-6 justify-between md:justify-end">
                                                            <div className="text-right">
                                                                {isPPN && <div className="text-[9px] text-slate-400">DPP: {fmt(loc.vendorCost)}/u</div>}
                                                                <div className="font-mono text-xs font-bold text-slate-700">{fmt(locTotal)}</div>
                                                                {loc.poIssued ? (
                                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50 mt-0.5 inline-block">{loc.poNumber}</span>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/30 mt-0.5 inline-block">Belum Terbit</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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

            {/* Vendor PO payment terms form */}
            {poFormVendor && (
                <PoPaymentTermsModal
                    isOpen={showPoForm}
                    onClose={() => {
                        setShowPoForm(false);
                        setPoFormVendor(null);
                    }}
                    vendorName={poFormVendor.name}
                    totalAmount={(() => {
                        const totalCost = poFormVendor.locs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
                        const ppnVal = isPPN ? totalCost * PPN_RATE : 0;
                        return totalCost + ppnVal;
                    })()}
                    onSubmit={handleConfirmIssuePO}
                />
            )}

            {/* Document Viewer Overlay */}
            {viewingPoNumber && activeProject && (
                <PoDocumentModal
                    isOpen={!!viewingPoNumber}
                    onClose={() => setViewingPoNumber(null)}
                    poNumber={viewingPoNumber}
                    projectCode={activeProject.code}
                    projectName={activeProject.name}
                    clientName={activeProject.clientName}
                    locations={activeProject.locations}
                    isPPN={isPPN}
                    vendorPOs={vendorPOs}
                />
            )}
        </DemoLayout>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components for PO Modal & View
// ─────────────────────────────────────────────────────────────────────────────
interface PoPaymentTermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorName: string;
    totalAmount: number;
    onSubmit: (terms: VendorPaymentTerm) => void;
    title?: string;
    amountLabel?: string;
}

function PoPaymentTermsModal({ isOpen, onClose, vendorName, totalAmount, onSubmit, title = "Konfigurasi Syarat Pembayaran PO", amountLabel = "Nilai HPP PO Vendor" }: PoPaymentTermsModalProps) {
    const [paymentType, setPaymentType] = useState<"full" | "dp" | "termin">("full");
    const [dpPercent, setDpPercent] = useState<number>(30);
    const [terminCount, setTerminCount] = useState<number>(2);
    
    // Date/Days state
    const [fullDueDays, setFullDueDays] = useState<number>(30);
    const [fullDueDate, setFullDueDate] = useState<string>("");
    
    const [dpDueDays, setDpDueDays] = useState<number>(7);
    const [dpDueDate, setDpDueDate] = useState<string>("");
    
    const [pelunasanDueDays, setPelunasanDueDays] = useState<number>(30);
    const [pelunasanDueDate, setPelunasanDueDate] = useState<string>("");

    const [terminDetails, setTerminDetails] = useState<Array<{ percent: number; note: string; dueDays?: number; dueDate?: string }>>([
        { percent: 50, note: "Termin 1 (DP)", dueDays: 7, dueDate: "" },
        { percent: 50, note: "Termin 2 (Pelunasan)", dueDays: 30, dueDate: "" }
    ]);
    const [notes, setNotes] = useState<string>("");

    if (!isOpen) return null;

    const handleTerminCountChange = (count: number) => {
        setTerminCount(count);
        const basePercent = Math.floor(100 / count);
        const newDetails = Array.from({ length: count }, (_, i) => {
            const isLast = i === count - 1;
            const percent = isLast ? (100 - basePercent * (count - 1)) : basePercent;
            return {
                percent,
                note: i === 0 ? "Termin 1 (DP / Uang Muka)" : `Termin ${i + 1}`,
                dueDays: (i + 1) * 30,
                dueDate: ""
            };
        });
        setTerminDetails(newDetails);
    };

    const handleDetailPercentChange = (index: number, val: number) => {
        setTerminDetails(prev => prev.map((item, i) => i === index ? { ...item, percent: val } : item));
    };

    const handleDetailNoteChange = (index: number, val: string) => {
        setTerminDetails(prev => prev.map((item, i) => i === index ? { ...item, note: val } : item));
    };

    const handleDetailDueDaysChange = (index: number, val: number) => {
        setTerminDetails(prev => prev.map((item, i) => i === index ? { ...item, dueDays: val } : item));
    };

    const handleDetailDueDateChange = (index: number, val: string) => {
        setTerminDetails(prev => prev.map((item, i) => i === index ? { ...item, dueDate: val } : item));
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
        } catch {
            return dateStr;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const terms: VendorPaymentTerm = { type: paymentType };
        if (paymentType === "full") {
            terms.fullDueDays = fullDueDays;
            terms.fullDueDate = fullDueDate || undefined;
            const dueStr = fullDueDate ? ` pada tanggal ${formatDate(fullDueDate)}` : ` dalam ${fullDueDays} hari setelah invoice/PO`;
            terms.notes = notes || `Pembayaran 100%${dueStr}`;
        } else if (paymentType === "dp") {
            const dpVal = Math.round(totalAmount * (dpPercent / 100));
            terms.dpPercent = dpPercent;
            terms.dpAmount = dpVal;
            terms.dpDueDays = dpDueDays;
            terms.dpDueDate = dpDueDate || undefined;
            terms.pelunasanDueDays = pelunasanDueDays;
            terms.pelunasanDueDate = pelunasanDueDate || undefined;
            
            const dpDueStr = dpDueDate ? `s.d. ${formatDate(dpDueDate)}` : `${dpDueDays} hari setelah PO`;
            const pelunasanDueStr = pelunasanDueDate ? `s.d. ${formatDate(pelunasanDueDate)}` : `${pelunasanDueDays} hari setelah pemasangan selesai`;
            terms.notes = notes || `DP ${dpPercent}% (${fmt(dpVal)}) dibayarkan ${dpDueStr}, Pelunasan dibayarkan ${pelunasanDueStr}.`;
        } else if (paymentType === "termin") {
            const totalPercent = terminDetails.reduce((sum, item) => sum + item.percent, 0);
            if (totalPercent !== 100) {
                alert(`Total persentase termin harus 100%! (Saat ini: ${totalPercent}%)`);
                return;
            }
            terms.installments = terminDetails.map(t => ({
                percent: t.percent,
                amount: Math.round(totalAmount * (t.percent / 100)),
                note: t.note,
                dueDays: t.dueDays,
                dueDate: t.dueDate || undefined
            }));
            
            const scheduleSummary = terminDetails.map((t, idx) => {
                const termDueStr = t.dueDate ? `s.d. ${formatDate(t.dueDate)}` : `${t.dueDays} hari`;
                return `T${idx+1} (${t.percent}%): ${termDueStr}`;
            }).join(", ");
            terms.notes = notes || `Pembayaran dibagi menjadi ${terminCount} termin (${scheduleSummary}).`;
        }
        onSubmit(terms);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={onClose} />
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-sm">{title}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{vendorName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-all text-xs font-bold">Tutup</button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">{amountLabel}:</span>
                        <span className="font-mono text-sm font-black text-slate-800">{fmt(totalAmount)}</span>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Skema Pembayaran</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["full", "dp", "termin"] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setPaymentType(type)}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                                        paymentType === type 
                                            ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    {type === "full" ? "Full Payment" : type === "dp" ? "DP & Pelunasan" : "Termin"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {paymentType === "full" && (
                        <div className="space-y-3 animate-fade-in bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Batas Waktu (Hari)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={fullDueDays}
                                        onChange={e => setFullDueDays(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-[9px] text-slate-400 mt-1 block">Hari setelah invoice diterima</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                                    <input
                                        type="date"
                                        value={fullDueDate}
                                        onChange={e => setFullDueDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Catatan Pembayaran Tambahan (Opsional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Contoh: Pembayaran 100% setelah invoice diterima..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {paymentType === "dp" && (
                        <div className="space-y-3 animate-fade-in bg-blue-50/30 border border-blue-100/50 p-4 rounded-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Persentase DP (%)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={dpPercent}
                                        onChange={e => setDpPercent(Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Nilai DP (IDR)</label>
                                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-600">
                                        {fmt(Math.round(totalAmount * (dpPercent / 100)))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100/50">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Batas Bayar DP (Hari)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={dpDueDays}
                                        onChange={e => setDpDueDays(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Hari setelah PO diterbitkan</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Tanggal DP (Opsional)</label>
                                    <input
                                        type="date"
                                        value={dpDueDate}
                                        onChange={e => setDpDueDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100/50">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Batas Pelunasan (Hari)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={pelunasanDueDays}
                                        onChange={e => setPelunasanDueDays(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Hari setelah pemasangan selesai</span>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Tanggal Pelunasan (Opsional)</label>
                                    <input
                                        type="date"
                                        value={pelunasanDueDate}
                                        onChange={e => setPelunasanDueDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Contoh: DP Awal dibayarkan setelah ttd kontrak. Pelunasan setelah pemasangan."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {paymentType === "termin" && (
                        <div className="space-y-3 animate-fade-in bg-violet-50/30 border border-violet-100/50 p-4 rounded-2xl">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Jumlah Termin</label>
                                <select
                                    value={terminCount}
                                    onChange={e => handleTerminCountChange(parseInt(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                >
                                    <option value={2}>2 Termin</option>
                                    <option value={3}>3 Termin</option>
                                    <option value={4}>4 Termin</option>
                                </select>
                            </div>
                            <div className="space-y-3 pt-2 border-t border-violet-100">
                                {terminDetails.map((td, index) => (
                                    <div key={index} className="space-y-2 bg-white/80 p-3 rounded-xl border border-slate-100/60 shadow-xs">
                                        <div className="grid grid-cols-12 gap-3 items-center">
                                            <div className="col-span-3">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Termin {index + 1} (%)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={td.percent}
                                                    onChange={e => handleDetailPercentChange(index, Math.min(100, Math.max(1, parseInt(e.target.value) || 0)))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="col-span-4 text-xs font-mono font-semibold text-slate-500 pt-3">
                                                {fmt(Math.round(totalAmount * (td.percent / 100)))}
                                            </div>
                                            <div className="col-span-5">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Keterangan Termin</label>
                                                <input
                                                    type="text"
                                                    value={td.note}
                                                    onChange={e => handleDetailNoteChange(index, e.target.value)}
                                                    placeholder="Contoh: DP Awal"
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed border-slate-100">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Batas Bayar (Hari)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={td.dueDays || 0}
                                                    onChange={e => handleDetailDueDaysChange(index, Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tanggal (Opsional)</label>
                                                <input
                                                    type="date"
                                                    value={td.dueDate || ""}
                                                    onChange={e => handleDetailDueDateChange(index, e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-black transition-all"
                        >
                            BATAL
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-500/20"
                        >
                            TERBITKAN PO & CETAK
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface PoDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    poNumber: string;
    projectCode: string;
    projectName: string;
    clientName: string;
    locations: BillboardLocation[];
    isPPN: boolean;
    vendorPOs: Record<string, VendorPO>;
}

function PoDocumentModal({ isOpen, onClose, poNumber, projectCode, projectName, clientName, locations, isPPN, vendorPOs }: PoDocumentModalProps) {
    if (!isOpen || !poNumber) return null;

    const po = vendorPOs[poNumber];
    if (!po) return null;

    // Filter locations belonging to this PO
    const poLocs = locations.filter(l => l.poNumber === poNumber);
    const dppSubtotal = poLocs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
    const ppnAmount = isPPN ? dppSubtotal * PPN_RATE : 0;
    const poTotal = dppSubtotal + ppnAmount;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />
            <div className="bg-slate-100 rounded-3xl w-full max-w-4xl shadow-2xl relative z-10 animate-fade-in-down my-8">
                {/* Modal Toolbar */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center rounded-t-3xl flex-shrink-0 print:hidden">
                    <div>
                        <h3 className="font-bold text-sm">Dokumen Purchase Order (PO)</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nomor: {poNumber}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.print()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Cetak PDF / Print
                        </button>
                        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all">
                            Tutup
                        </button>
                    </div>
                </div>

                {/* Printable Document Area */}
                <div className="p-8 md:p-12 bg-white print:p-0 print:shadow-none shadow-sm rounded-b-3xl print:rounded-none font-sans text-slate-800 space-y-8 relative overflow-hidden">
                    {/* Watermark/Status Badge */}
                    <div className="absolute top-8 right-8 border-4 border-blue-500/25 text-blue-500/25 font-black text-xl px-4 py-2 rounded-xl rotate-12 tracking-widest uppercase pointer-events-none select-none">
                        PO ISSUED
                    </div>

                    {/* PO Header */}
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">Y</div>
                                <span className="font-black text-lg text-slate-900 tracking-tight">YOUSEE MEDIA</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                PT. Yousee Media Indonesia<br />
                                Jl. Pandanaran No. 100, Kel. Pekunden<br />
                                Kec. Semarang Tengah, Kota Semarang 50134<br />
                                info@youseemedia.co.id &middot; (024) 8601234
                            </p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">PURCHASE ORDER</h1>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left text-xs">
                                <span className="text-slate-400 font-semibold">Nomor PO:</span>
                                <span className="font-mono font-bold text-slate-800">{poNumber}</span>
                                <span className="text-slate-400 font-semibold">Tanggal:</span>
                                <span className="font-bold text-slate-800">{po.issuedAt}</span>
                                <span className="text-slate-400 font-semibold">Kode Proyek:</span>
                                <span className="font-bold text-slate-800">{projectCode}</span>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Vendor & Project Details */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">VENDOR / MITRA REKLAME:</div>
                            <div className="font-bold text-slate-900 text-sm">{po.vendorName}</div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                NPWP: 01.999.888.7-654.000<br />
                                Mitra Partner Resmi &middot; Supplier Media Luar Ruang
                            </p>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DESKRIPSI PROYEK KAMPANYE:</div>
                            <div className="font-bold text-slate-900 text-sm">{projectName}</div>
                            <div className="grid grid-cols-2 gap-x-2 mt-2 text-[11px] text-slate-500">
                                <span className="font-semibold">Nama Client:</span>
                                <span>{clientName}</span>
                                <span className="font-semibold">Total Lokasi:</span>
                                <span>{poLocs.length} titik</span>
                            </div>
                        </div>
                    </div>

                    {/* Table of Locations */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-center w-12">NO</th>
                                    <th className="px-4 py-3">DESKRIPSI TITIK LOKASI</th>
                                    <th className="px-4 py-3 text-center w-20">QTY</th>
                                    <th className="px-4 py-3 text-right w-36">BIAYA SATUAN</th>
                                    <th className="px-4 py-3 text-right w-40">TOTAL (DPP)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                {poLocs.map((loc, idx) => {
                                    const unitPrice = loc.vendorCost;
                                    const qty = loc.qty || 1;
                                    const rowTotal = unitPrice * qty;
                                    return (
                                        <tr key={loc.id}>
                                            <td className="px-4 py-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-800">{loc.description}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{loc.code} &middot; {loc.size}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-slate-900 font-semibold">{qty} Unit</td>
                                            <td className="px-4 py-3.5 text-right font-mono text-slate-600">{fmt(unitPrice)}</td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(rowTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary & Payment Terms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKEMA PEMBAYARAN VENDOR PO:</div>
                            
                            {po.paymentTerms.type === "full" && (
                                <div className="text-xs space-y-1 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Full Payment (100% setelah penagihan)
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                        <div>
                                            <span className="text-slate-400">Jatuh Tempo:</span>
                                            <span className="font-bold text-slate-800 ml-1">
                                                {po.paymentTerms.fullDueDate 
                                                    ? formatDate(po.paymentTerms.fullDueDate) 
                                                    : `${po.paymentTerms.fullDueDays || 30} hari setelah invoice diterima`}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{po.paymentTerms.notes}"</p>
                                </div>
                            )}

                            {po.paymentTerms.type === "dp" && (
                                <div className="text-xs space-y-2 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        DP & Pelunasan
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Uang Muka ({po.paymentTerms.dpPercent}%):</span>
                                                <span className="font-bold text-slate-800 font-mono">{fmt(po.paymentTerms.dpAmount || 0)}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo DP: <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms.dpDueDate 
                                                        ? formatDate(po.paymentTerms.dpDueDate) 
                                                        : `${po.paymentTerms.dpDueDays || 7} hari setelah PO`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Sisa Pelunasan:</span>
                                                <span className="font-bold text-slate-800 font-mono">{fmt(poTotal - (po.paymentTerms.dpAmount || 0))}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                Jatuh Tempo Pelunasan: <span className="font-semibold text-slate-700">
                                                    {po.paymentTerms.pelunasanDueDate 
                                                        ? formatDate(po.paymentTerms.pelunasanDueDate) 
                                                        : `${po.paymentTerms.pelunasanDueDays || 30} hari setelah serah terima`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{po.paymentTerms.notes}"</p>
                                </div>
                            )}

                            {po.paymentTerms.type === "termin" && po.paymentTerms.installments && (
                                <div className="text-xs space-y-2 text-slate-700">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Pembayaran Bertahap (Termin)
                                    </div>
                                    <div className="space-y-1.5">
                                        {po.paymentTerms.installments.map((inst, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span>Termin {idx + 1} ({inst.percent}%) - <span className="text-slate-400">{inst.note}</span></span>
                                                    <span className="font-bold font-mono text-slate-800">{fmt(inst.amount)}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 border-t border-slate-50/50 pt-1 mt-1">
                                                    Jatuh Tempo: <span className="font-semibold text-slate-700">
                                                        {inst.dueDate 
                                                            ? formatDate(inst.dueDate) 
                                                            : `${inst.dueDays || 30} hari setelah PO`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end items-start">
                            <div className="w-full space-y-2 text-xs font-semibold text-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Subtotal DPP Vendor</span>
                                    <span className="font-mono text-slate-900 font-bold">{fmt(dppSubtotal)}</span>
                                </div>
                                {isPPN && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">PPN (11%)</span>
                                        <span className="font-mono text-violet-600 font-bold">{fmt(ppnAmount)}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                                    <span className="font-black text-slate-900">Total HPP PO</span>
                                    <span className="font-mono font-black text-blue-600">{fmt(poTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signatures */}
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SYARAT & KETENTUAN PO:</div>
                            <ul className="text-[9px] text-slate-500 list-disc list-inside space-y-1 leading-relaxed">
                                <li>Vendor partner wajib menjamin konstruksi billboard kokoh dan layak tayang.</li>
                                <li>Bukti dokumentasi tayang (siang & malam) wajib disertakan saat penagihan.</li>
                                <li>Keterlambatan tayang akan dikenakan denda keterlambatan.</li>
                            </ul>
                        </div>
                        <div className="text-right flex justify-between">
                            <div className="text-center w-36">
                                <div className="text-[10px] text-slate-400 font-bold mb-10">Diterima oleh, (Vendor Partner)</div>
                                <div className="border-b border-slate-200 mx-4 h-6"></div>
                                <div className="text-[9px] text-slate-400 font-bold mt-1">Direktur / Penanggungjawab</div>
                            </div>
                            <div className="text-center w-36">
                                <div className="text-[10px] text-slate-400 font-bold mb-6">Diterbitkan oleh, (Yousee Media)</div>
                                <div className="w-16 h-8 border border-dashed border-blue-200 text-[8px] text-blue-300 font-bold flex items-center justify-center rounded-lg mx-auto mb-1">
                                    STAMP
                                </div>
                                <div className="border-b border-slate-200 mx-4"></div>
                                <div className="text-[9px] text-slate-400 font-bold mt-1">Procurement & Finance</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
