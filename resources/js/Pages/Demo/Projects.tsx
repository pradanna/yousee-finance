import React, { useState } from "react";
import DemoLayout, { useDemoFiscalMode } from "@/Layouts/DemoLayout";
import SlideOver from "@/Components/SlideOver";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface VendorPaymentTerm {
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

interface VendorPO {
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
    vendorCost: number; // always DPP
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
    contractValue: number; // DPP
    status: "Draft" | "Active" | "Completed" | "Cancelled";
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    targetQty: number;
    paymentTerms?: VendorPaymentTerm;
}

type ActiveTab = "info" | "locations" | "vendors" | "invoice";
type FiscalMode = "ppn" | "non-ppn";

const PPN_RATE = 0.11;

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────
const mockVendors = [
    { id: 1, name: "PT. Megah Billboard Jaya" },
    { id: 2, name: "CV. Media Ad Perkasa" },
    { id: 3, name: "PT. Promosi Outdoor Kreasindo" },
    { id: 4, name: "UD. Spanduk & Baliho Makmur" },
];

const mockVendorItems: Record<number, { id: number; area: string; description: string; type: BillboardLocation["type"]; size: string; cost: number }[]> = {
    1: [
        { id: 101, area: "Semarang", description: "Billboard Jl. Pandanaran KM 3 (Megah)", type: "Billboard", size: "4x8m", cost: 8500000 },
        { id: 102, area: "Semarang", description: "Billboard Simpang Lima (Depan BCA)", type: "Billboard", size: "6x12m", cost: 14000000 },
        { id: 103, area: "Solo", description: "Videotron Solo Grand Mall", type: "Videotron", size: "3x5m", cost: 15000000 },
        { id: 104, area: "Yogyakarta", description: "Billboard Ring Road Utara Monjali", type: "Billboard", size: "4x8m", cost: 9000000 },
    ],
    2: [
        { id: 201, area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", cost: 22000000 },
        { id: 202, area: "Semarang", description: "Videotron Jl. Pahlawan", type: "Videotron", size: "4x8m", cost: 19000000 },
        { id: 203, area: "Yogyakarta", description: "Billboard Tugu Yogya Selatan", type: "Billboard", size: "4x8m", cost: 8800000 },
    ],
    3: [
        { id: 301, area: "Yogyakarta", description: "Baliho Jl. Malioboro (Dekat Kraton)", type: "Baliho", size: "3x6m", cost: 7500000 },
        { id: 302, area: "Yogyakarta", description: "Billboard Ring Road Utara Monjali", type: "Billboard", size: "4x8m", cost: 9000000 },
        { id: 303, area: "Surabaya", description: "Baliho Jl. Darmo (Depan Taman Bungkul)", type: "Baliho", size: "3x6m", cost: 5500000 },
    ],
    4: [
        { id: 401, area: "Malang", description: "Billboard Jl. Kahuripan (Alun-alun Kota)", type: "Billboard", size: "4x8m", cost: 4200000 },
        { id: 402, area: "Banyuwangi", description: "Neonbox Terminal Blambangan", type: "Neonbox", size: "1.5x2m", cost: 2800000 },
        { id: 403, area: "Solo", description: "Baliho Jl. Adi Sucipto KM 5", type: "Baliho", size: "3x6m", cost: 3500000 },
    ]
};

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
            { id: 1, code: "LOC-001", area: "Semarang", description: "Billboard Jl. Pandanaran KM 3 (Megah)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 8500000, poIssued: true, poNumber: "PO-2026-0041" },
            { id: 2, code: "LOC-002", area: "Semarang", description: "Billboard Simpang Lima (Depan BCA)", type: "Billboard", size: "6x12m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 14000000, poIssued: true, poNumber: "PO-2026-0041" },
            { id: 3, code: "LOC-003", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0042" },
            { id: 4, code: "LOC-004", area: "Yogyakarta", description: "Baliho Jl. Malioboro (Dekat Kraton)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 7500000, poIssued: false, poNumber: "" },
            { id: 5, code: "LOC-005", area: "Yogyakarta", description: "Billboard Ring Road Utara Monjali", type: "Billboard", size: "4x8m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 9000000, poIssued: false, poNumber: "" },
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
            { id: 6, code: "LOC-006", area: "Semarang", description: "Billboard Jl. Pemuda (Dekat Paragon Mall)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 9500000, poIssued: false, poNumber: "" },
            { id: 7, code: "LOC-007", area: "Solo", description: "Videotron Solo Grand Mall", type: "Videotron", size: "3x5m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 15000000, poIssued: false, poNumber: "" },
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
            { id: 12, code: "LOC-012", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0091" },
            { id: 13, code: "LOC-013", area: "Semarang", description: "Videotron Jl. Pahlawan", type: "Videotron", size: "4x8m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 19000000, poIssued: true, poNumber: "PO-2026-0091" },
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
            { id: 8, code: "LOC-008", area: "Surabaya", description: "Baliho Jl. Darmo (Depan Taman Bungkul)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 5500000, poIssued: true, poNumber: "PO-2026-0055" },
            { id: 9, code: "LOC-009", area: "Malang", description: "Billboard Jl. Kahuripan (Alun-alun Kota)", type: "Billboard", size: "4x8m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 4200000, poIssued: true, poNumber: "PO-2026-0056" },
            { id: 10, code: "LOC-010", area: "Banyuwangi", description: "Neonbox Terminal Blambangan", type: "Neonbox", size: "1.5x2m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 2800000, poIssued: false, poNumber: "" },
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
            { id: 11, code: "LOC-011", area: "Solo", description: "Baliho Jl. Adi Sucipto KM 5", type: "Baliho", size: "3x6m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 3500000, poIssued: true, poNumber: "PO-2026-0060" },
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
        paymentTerms: {
            type: "full",
            fullDueDays: 30,
            notes: "Pembayaran 100% dalam 30 hari setelah invoice diterima"
        },
        locations: [
            { id: 14, code: "LOC-014", area: "Yogyakarta", description: "Neonbox Perempatan Tugu Yogyakarta", type: "Neonbox", size: "2x3m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 4500000, poIssued: true, poNumber: "PO-2026-0099" },
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

function calcFinancials(project: Project, locations: BillboardLocation[], fiscalMode: FiscalMode) {
    const isPPN = fiscalMode === "ppn";
    const dpp = project.contractValue;
    const ppnKeluaran = isPPN ? dpp * PPN_RATE : 0;
    const totalInvoice = dpp + ppnKeluaran;

    const totalDppVendor = locations.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
    const ppnMasukan = isPPN ? totalDppVendor * PPN_RATE : 0;
    const totalPO = totalDppVendor + ppnMasukan;

    // In PPN mode: profit = DPP income - DPP vendor (PPN nets out)
    // In non-PPN: profit = invoice - total PO (no PPN at all)
    const netProfit = isPPN ? dpp - totalDppVendor : dpp - totalDppVendor;
    const ppnNet = ppnKeluaran - ppnMasukan;
    const margin = dpp > 0 ? (netProfit / dpp) * 100 : 0;

    return { dpp, ppnKeluaran, totalInvoice, totalDppVendor, ppnMasukan, totalPO, netProfit, ppnNet, margin };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Project["status"] }) => {
    const map: Record<Project["status"], { bg: string; dot: string; text: string }> = {
        Draft:     { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400", text: "Draft" },
        Active:    { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", text: "Active" },
        Completed: { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", text: "Selesai" },
        Cancelled: { bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500", text: "Dibatalkan" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────────────────────────
function ProjectDetailModal({ project, onClose, fiscalMode, onUpdateProject }: { project: Project; onClose: () => void; fiscalMode: FiscalMode; onUpdateProject: (updated: Project) => void }) {
    const [activeTab, setActiveTab] = useState<ActiveTab>("info");
    const [locations, setLocations] = useState<BillboardLocation[]>(project.locations);
    const [showAddLoc, setShowAddLoc] = useState(false);
    const [locForm, setLocForm] = useState({ area: "", description: "", type: "Billboard" as BillboardLocation["type"], size: "", vendorId: "", vendorCost: "", qty: "1" });
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
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [poFormVendor, setPoFormVendor] = useState<{ id: number; name: string; locs: BillboardLocation[] } | null>(null);
    const [viewingPoNumber, setViewingPoNumber] = useState<string | null>(null);
    const [poSuccess, setPoSuccess] = useState(false);
    const [editingLocId, setEditingLocId] = useState<number | null>(null);

    const isPPN = fiscalMode === "ppn";
    const fin = calcFinancials(project, locations, fiscalMode);

    const tabs = [
        { id: "info" as ActiveTab, label: "Info Proyek" },
        { id: "locations" as ActiveTab, label: `Titik Lokasi (${locations.length})` },
        { id: "vendors" as ActiveTab, label: "Vendor & PO" },
        { id: "invoice" as ActiveTab, label: "Invoice Client" },
    ];

    const handleConfirmIssuePO = (terms: VendorPaymentTerm) => {
        if (!poFormVendor) return;

        const totalCost = poFormVendor.locs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
        const ppnVal = isPPN ? totalCost * PPN_RATE : 0;
        const finalTotal = totalCost + ppnVal;

        const nextPoNum = `PO-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;

        const newPO: VendorPO = {
            poNumber: nextPoNum,
            vendorId: poFormVendor.id,
            vendorName: poFormVendor.name,
            paymentTerms: terms,
            issuedAt: new Date().toISOString().split("T")[0],
            totalAmount: finalTotal
        };

        setVendorPOs(prev => ({
            ...prev,
            [nextPoNum]: newPO
        }));

        const nextLocs = locations.map(l => {
            if (l.vendorId === poFormVendor.id && !l.poIssued) {
                return {
                    ...l,
                    poIssued: true,
                    poNumber: nextPoNum
                };
            }
            return l;
        });

        setLocations(nextLocs);
        onUpdateProject({ ...project, locations: nextLocs });
        
        setShowPoForm(false);
        setPoFormVendor(null);
        setPoSuccess(true);
        setTimeout(() => setPoSuccess(false), 3000);

        setViewingPoNumber(nextPoNum);
    };

    const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vId = e.target.value;
        setLocForm({
            vendorId: vId,
            area: "",
            description: "",
            type: "Billboard",
            size: "",
            vendorCost: "",
            qty: "1"
        });
    };



    const handleConfigureLocation = (loc: BillboardLocation) => {
        setEditingLocId(loc.id);
        setLocForm({
            area: loc.area || "",
            description: loc.description.includes("(Belum Dikonfigurasi)") ? "" : loc.description,
            type: loc.type || "Billboard",
            size: loc.size || "-",
            vendorId: loc.vendorId ? String(loc.vendorId) : "",
            vendorCost: loc.vendorCost ? String(loc.vendorCost) : "",
            qty: String(loc.qty || 1),
        });
        setShowAddLoc(true);
    };

    const handleAddLocation = () => {
        if (!locForm.description || !locForm.vendorId) return;
        const vendor = mockVendors.find(v => v.id === parseInt(locForm.vendorId));
        
        let nextLocs;
        if (editingLocId !== null) {
            nextLocs = locations.map(l => l.id === editingLocId ? {
                ...l,
                area: locForm.area || "-",
                description: locForm.description,
                type: locForm.type || "Billboard",
                size: locForm.size || "-",
                vendorId: vendor?.id || null,
                vendorName: vendor?.name || "-",
                qty: parseInt(locForm.qty) || 1,
                vendorCost: parseInt(locForm.vendorCost.replace(/[^0-9]/g, "")) || 0,
            } : l);
        } else {
            const newLoc: BillboardLocation = {
                id: Date.now(),
                code: `LOC-${String(locations.length + 1).padStart(3, "0")}`,
                area: locForm.area || "-",
                description: locForm.description,
                type: locForm.type || "Billboard",
                size: locForm.size || "-",
                vendorId: vendor?.id || null,
                vendorName: vendor?.name || "-",
                qty: parseInt(locForm.qty) || 1,
                vendorCost: parseInt(locForm.vendorCost.replace(/[^0-9]/g, "")) || 0,
                poIssued: false,
                poNumber: "",
            };
            nextLocs = [...locations, newLoc];
        }

        setLocations(nextLocs);
        onUpdateProject({ ...project, locations: nextLocs });
        setLocForm({ area: "", description: "", type: "Billboard", size: "", vendorId: "", vendorCost: "", qty: "1" });
        setShowAddLoc(false);
        setEditingLocId(null);
    };



    const handleIssueInvoiceClick = () => {
        setShowInvoiceForm(true);
    };

    const handleConfirmIssueInvoice = (terms: VendorPaymentTerm) => {
        const nextInvNum = `INV-2026-${isPPN ? "PPN" : "NON"}-${String(Math.floor(Math.random() * 900) + 100)}`;
        onUpdateProject({
            ...project,
            invoiceIssued: true,
            invoiceNumber: nextInvNum,
            paymentTerms: terms,
        });
        setShowInvoiceForm(false);
    };

    const poCount = locations.filter(l => l.poIssued).length;
    const pendingPO = locations.filter(l => !l.poIssued && l.vendorId !== null);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-[1050px] max-w-[95vw] h-screen bg-white shadow-2xl flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="bg-slate-950 px-6 py-5 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded tracking-widest uppercase">{project.code}</span>
                                <StatusBadge status={project.status} />
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${isPPN ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-slate-700 text-slate-300 border-slate-600"}`}>
                                    {isPPN ? "Mode PPN" : "Mode Non-PPN"}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-white leading-tight">{project.name}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{project.clientName} &middot; {project.period}</p>
                        </div>
                        <button onClick={onClose} className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Quick Stats — different layout for PPN vs Non-PPN */}
                    {isPPN ? (
                        <div className="grid grid-cols-5 gap-2 mt-4">
                            {[
                                { label: "DPP Kontrak", value: fmt(fin.dpp), note: "Sebelum PPN", color: "text-emerald-400" },
                                { label: "PPN Keluaran", value: fmt(fin.ppnKeluaran), note: "11% dari DPP", color: "text-violet-400" },
                                { label: "Total Invoice", value: fmt(fin.totalInvoice), note: "Tagihan ke client", color: "text-white" },
                                { label: "PPN Masukan", value: fmt(fin.ppnMasukan), note: "Dari vendor", color: "text-violet-300" },
                                { label: "PPN Net", value: fmt(Math.abs(fin.ppnNet)), note: fin.ppnNet >= 0 ? "Kurang bayar" : "Lebih bayar", color: fin.ppnNet > 0 ? "text-rose-400" : "text-emerald-400" },
                            ].map((s, i) => (
                                <div key={i} className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
                                    <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{s.label}</div>
                                    <div className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</div>
                                    <div className="text-[9px] text-slate-600 mt-0.5">{s.note}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {[
                                { label: "Nilai Kontrak", value: fmt(fin.dpp), note: "Tanpa PPN", color: "text-emerald-400" },
                                { label: "Beban Vendor", value: fmt(fin.totalDppVendor), note: "Total DPP vendor", color: "text-amber-400" },
                                { label: "Laba Bersih", value: fmt(fin.netProfit), note: "Setelah biaya vendor", color: fin.netProfit >= 0 ? "text-emerald-400" : "text-rose-400" },
                                { label: "Margin", value: `${fin.margin.toFixed(1)}%`, note: "Dari nilai kontrak", color: fin.margin >= 30 ? "text-emerald-400" : "text-amber-400" },
                            ].map((s, i) => (
                                <div key={i} className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
                                    <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{s.label}</div>
                                    <div className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</div>
                                    <div className="text-[9px] text-slate-600 mt-0.5">{s.note}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-100 bg-slate-50 flex-shrink-0">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === tab.id ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── INFO TAB ── */}
                    {activeTab === "info" && (
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Kode Proyek", value: project.code },
                                    { label: "Status", value: <StatusBadge status={project.status} /> },
                                    { label: "Client / Pengiklan", value: project.clientName },
                                    { label: "Sales PIC", value: project.salesPIC },
                                    { label: "Periode Kampanye", value: project.period },
                                    { label: "Total Titik Lokasi", value: `${locations.length} titik` },
                                    { label: "DPP Kontrak", value: <span className="font-mono font-bold text-emerald-600">{fmt(project.contractValue)}</span> },
                                    { label: isPPN ? "Total Invoice (DPP + PPN)" : "Total Invoice", value: <span className="font-mono font-bold text-slate-900">{fmt(fin.totalInvoice)}</span> },
                                ].map((row, i) => (
                                    <div key={i} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{row.label}</div>
                                        <div className="text-sm font-semibold text-slate-800">{row.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* PPN breakdown info when in PPN mode */}
                            {isPPN && (
                                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
                                    <div className="text-xs font-bold text-violet-800 mb-2">Rincian PPN</div>
                                    {[
                                        { label: "PPN Keluaran (dari client)", value: fmt(fin.ppnKeluaran), color: "text-violet-700" },
                                        { label: "PPN Masukan (dari vendor)", value: fmt(fin.ppnMasukan), color: "text-violet-500" },
                                        { label: fin.ppnNet >= 0 ? "PPN Kurang Bayar" : "PPN Lebih Bayar", value: fmt(Math.abs(fin.ppnNet)), color: fin.ppnNet > 0 ? "text-rose-600 font-black" : "text-emerald-600 font-black" },
                                    ].map((r, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-violet-700 font-semibold">{r.label}</span>
                                            <span className={`font-mono font-bold ${r.color}`}>{r.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-600">Progress PO Terbit</span>
                                    <span className="text-xs font-bold text-slate-800">{poCount} / {locations.length} titik</span>
                                </div>
                                <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: locations.length > 0 ? `${(poCount / locations.length) * 100}%` : "0%" }} />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-semibold">
                                    <span>{poCount} PO diterbitkan</span>
                                    <span>{locations.length - poCount} belum ada PO</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── LOCATIONS TAB ── */}
                    {activeTab === "locations" && (
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Titik Lokasi Billboard</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{locations.length} titik terdaftar</p>
                                </div>
                                <button onClick={() => setShowAddLoc(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Tambah Titik
                                </button>
                            </div>

                            {/* Progress Pemenuhan Titik Lokasi */}
                            {(() => {
                                const target = project.targetQty || project.locations.length;
                                const configuredQty = locations.reduce((sum, l) => sum + (l.vendorId !== null ? (l.qty || 1) : 0), 0);
                                const diff = target - configuredQty;
                                const pct = Math.min(100, Math.max(0, (configuredQty / target) * 100));

                                let barColor = "bg-blue-500";
                                let bgColor = "bg-blue-50/50 border-blue-100 text-blue-800";
                                let statusText = "";

                                if (diff > 0) {
                                    barColor = "bg-amber-500";
                                    bgColor = "bg-amber-50/50 border-amber-100 text-amber-800";
                                    statusText = `Kurang ${diff} unit untuk memenuhi target proyek`;
                                } else if (diff === 0) {
                                    barColor = "bg-emerald-500";
                                    bgColor = "bg-emerald-50/50 border-emerald-100 text-emerald-800";
                                    statusText = "Target jumlah titik lokasi proyek telah terpenuhi";
                                } else {
                                    barColor = "bg-indigo-500";
                                    bgColor = "bg-indigo-50/50 border-indigo-100 text-indigo-800";
                                    statusText = `Melebihi target proyek sebesar ${Math.abs(diff)} unit`;
                                }

                                return (
                                    <div className={`border rounded-2xl p-4 space-y-2.5 ${bgColor}`}>
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span>Progress Pemenuhan Titik</span>
                                            <span className="font-mono">{configuredQty} / {target} Unit</span>
                                        </div>
                                        <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-semibold opacity-90">
                                            <span>{statusText}</span>
                                            <span>Target: {target} unit</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {showAddLoc && (
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-4">
                                    <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        {editingLocId !== null ? `Konfigurasi Titik ${locations.find(l => l.id === editingLocId)?.code || ""}` : "Tambah Titik Lokasi Baru"}
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {/* Step 1: Select Vendor */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Pilih Vendor Terlebih Dahulu <span className="text-rose-500">*</span></label>
                                            <select 
                                                value={locForm.vendorId} 
                                                onChange={handleVendorChange} 
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400"
                                            >
                                                <option value="">-- Pilih Vendor --</option>
                                                {mockVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Step 2: Show items and fields once vendor is selected */}
                                        {locForm.vendorId ? (
                                            <div className="space-y-3 border-t border-blue-100 pt-3">
                                                <div className="grid grid-cols-1 gap-3 bg-white/60 p-3 rounded-xl border border-blue-100/50">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Detail / Deskripsi Billboard <span className="text-rose-500">*</span></label>
                                                        <input 
                                                            value={locForm.description} 
                                                            onChange={e => setLocForm({ ...locForm, description: e.target.value })} 
                                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400" 
                                                            placeholder="Masukkan detail billboard secara lengkap (tipe, ukuran, area, jalan)..." 
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="col-span-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Qty <span className="text-rose-500">*</span></label>
                                                            <input 
                                                                type="number"
                                                                min="1"
                                                                value={locForm.qty} 
                                                                onChange={e => setLocForm({ ...locForm, qty: e.target.value })} 
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400" 
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Biaya Vendor / DPP (IDR) <span className="text-rose-500">*</span></label>
                                                            <input 
                                                                value={locForm.vendorCost} 
                                                                onChange={e => setLocForm({ ...locForm, vendorCost: e.target.value })} 
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-400" 
                                                                placeholder="Biaya per unit..." 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-4 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                                <p className="text-xs text-slate-500 font-medium">Pilih vendor terlebih dahulu untuk menampilkan daftar titik lokasi media vendor tersebut.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-blue-100">
                                        <button 
                                            onClick={() => {
                                                setShowAddLoc(false);
                                                setLocForm({ area: "", description: "", type: "Billboard", size: "", vendorId: "", vendorCost: "", qty: "1" });
                                                setEditingLocId(null);
                                            }}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-semibold"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleAddLocation}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold"
                                        >
                                            {editingLocId !== null ? "Simpan Konfigurasi" : "Tambah"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {locations.map((loc, idx) => {
                                    const locDpp = loc.vendorCost * (loc.qty || 1);
                                    const ppn = isPPN ? locDpp * PPN_RATE : 0;
                                    const totalLoc = locDpp + ppn;
                                    return (
                                        <div key={loc.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 hover:border-slate-200 transition-all">
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0">{idx + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{loc.code}</span>
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">Qty: {loc.qty || 1}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">{loc.size}</span>
                                                </div>
                                                <div className="font-bold text-sm text-slate-800 truncate">{loc.description}</div>
                                                <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                                    {loc.vendorName} &middot; {loc.qty || 1} unit x {fmt(loc.vendorCost)}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                {isPPN && (
                                                    <div className="text-[10px] text-slate-400 font-semibold">DPP: {fmt(locDpp)}</div>
                                                )}
                                                {isPPN && ppn > 0 && (
                                                    <div className="text-[10px] text-violet-500 font-semibold">PPN: {fmt(ppn)}</div>
                                                )}
                                                <div className="font-mono font-bold text-slate-800 text-sm">{fmt(totalLoc)}</div>
                                                {loc.poIssued
                                                    ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{loc.poNumber}</span>
                                                    : (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Belum ada PO</span>
                                                            <button 
                                                                onClick={() => handleConfigureLocation(loc)} 
                                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-all mt-0.5"
                                                            >
                                                                Konfigurasi
                                                            </button>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── VENDORS & PO TAB ── */}
                    {activeTab === "vendors" && (
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Penerbitan Purchase Order (PO)</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {isPPN
                                        ? "Mode PPN aktif — nilai PO sudah termasuk PPN 11% yang dapat dikreditkan."
                                        : "Mode Non-PPN — nilai PO sesuai DPP tanpa PPN."}
                                </p>
                            </div>

                            {isPPN && fin.ppnMasukan > 0 && (
                                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3.5 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-violet-800">Total PPN Masukan (Dapat Dikreditkan)</div>
                                        <div className="text-[10px] text-violet-600 mt-0.5">Offset terhadap PPN Keluaran {fmt(fin.ppnKeluaran)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-violet-700 text-sm">{fmt(fin.ppnMasukan)}</div>
                                        <div className="text-[10px] text-violet-500">PPN Masukan</div>
                                    </div>
                                </div>
                            )}

                            {poSuccess && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    PO berhasil diterbitkan!
                                </div>
                            )}

                            {mockVendors.map(vendor => {
                                const vendorLocs = locations.filter(l => l.vendorId === vendor.id);
                                if (vendorLocs.length === 0) return null;
                                const pendingVendorLocs = vendorLocs.filter(l => !l.poIssued);

                                const dppTotal = vendorLocs.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
                                const ppnTotal = isPPN ? dppTotal * PPN_RATE : 0;
                                const poTotal = dppTotal + ppnTotal;
                                return (
                                    <div key={vendor.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">{vendor.name}</div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {vendorLocs.length} titik &middot; DPP {fmt(dppTotal)}
                                                        {isPPN && ppnTotal > 0 && <span className="text-violet-500 font-bold"> + PPN {fmt(ppnTotal)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-slate-800 text-sm">{fmt(poTotal)}</div>
                                                    <div className="text-[10px] text-slate-400">Total nilai PO</div>
                                                </div>
                                                {pendingVendorLocs.length > 0 ? (
                                                    <button 
                                                        onClick={() => {
                                                            setPoFormVendor({ id: vendor.id, name: vendor.name, locs: pendingVendorLocs });
                                                            setShowPoForm(true);
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1"
                                                    >
                                                        Terbitkan PO
                                                    </button>
                                                ) : (
                                                    vendorLocs.length > 0 && vendorLocs[0].poNumber && (
                                                        <button 
                                                            onClick={() => setViewingPoNumber(vendorLocs[0].poNumber)}
                                                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            Lihat PO
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {vendorLocs.map(loc => {
                                                const locDpp = loc.vendorCost * (loc.qty || 1);
                                                const locPPN = isPPN ? locDpp * PPN_RATE : 0;
                                                const locTotal = locDpp + locPPN;
                                                return (
                                                    <div key={loc.id} className="flex items-center gap-3 px-4 py-3">
                                                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                                            {loc.poIssued ? (
                                                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-slate-800 truncate">{loc.description}</div>
                                                            <div className="text-[10px] text-slate-400">Qty: {loc.qty || 1} &middot; {loc.type} {loc.size} &middot; {fmt(loc.vendorCost)}/unit</div>
                                                        </div>
                                                        <div className="text-right">
                                                            {isPPN && <div className="text-[10px] text-slate-400">DPP: {fmt(loc.vendorCost)}</div>}
                                                            {isPPN && locPPN > 0 && <div className="text-[10px] text-violet-500">PPN: {fmt(locPPN)}</div>}
                                                            <div className="font-mono text-xs font-bold text-slate-700">{fmt(locTotal)}</div>
                                                            {loc.poIssued
                                                                ? <span className="text-[10px] text-emerald-600 font-bold">{loc.poNumber}</span>
                                                                : <span className="text-[10px] text-amber-500 font-semibold">Belum diterbitkan</span>
                                                            }
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {locations.filter(l => l.vendorId === null).length > 0 && (
                                <div className="border border-dashed border-rose-200 rounded-2xl overflow-hidden bg-rose-50/40">
                                    <div className="px-4 py-3 border-b border-rose-100/60">
                                        <div className="text-xs font-bold text-rose-600">Titik Tanpa Vendor</div>
                                        <div className="text-[10px] text-rose-400">Assign vendor di tab Titik Lokasi terlebih dahulu</div>
                                    </div>
                                    {locations.filter(l => l.vendorId === null).map(loc => (
                                        <div key={loc.id} className="px-4 py-3 flex items-center gap-3 border-b border-rose-50">
                                            <div className="flex-1">
                                                <div className="text-xs font-semibold text-slate-700">{loc.description}</div>
                                                <div className="text-[10px] text-slate-400">{loc.area} &middot; {loc.type}</div>
                                            </div>
                                            <span className="text-[10px] text-rose-500 font-bold">Vendor belum diisi</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── INVOICE CLIENT TAB ── */}
                    {activeTab === "invoice" && (
                        <div className="p-6 space-y-6">
                            {project.invoiceIssued ? (
                                <div className="space-y-6">
                                    {/* Success Banner */}
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-emerald-800">Invoice Telah Diterbitkan</div>
                                                <div className="text-[10px] text-emerald-600 font-semibold">Nomor Invoice: {project.invoiceNumber}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    alert("Mencetak Invoice...");
                                                }}
                                                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                Cetak PDF
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    onUpdateProject({ ...project, invoiceIssued: false, invoiceNumber: "" });
                                                }}
                                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-100/50"
                                            >
                                                Batalkan Penerbitan
                                            </button>
                                        </div>
                                    </div>

                                    {/* Real Digital Invoice Sheet */}
                                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 font-sans text-slate-800 relative overflow-hidden">
                                        {/* Watermark/Status Badge background */}
                                        <div className="absolute top-8 right-8 border-4 border-emerald-500/20 text-emerald-500/20 font-black text-xl px-4 py-2 rounded-xl rotate-12 tracking-widest uppercase pointer-events-none select-none">
                                            PAID
                                        </div>

                                        {/* Invoice Header */}
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
                                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">INVOICE</h1>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-left text-xs">
                                                    <span className="text-slate-400 font-semibold">Nomor:</span>
                                                    <span className="font-mono font-bold text-slate-800">{project.invoiceNumber}</span>
                                                    <span className="text-slate-400 font-semibold">Tanggal:</span>
                                                    <span className="font-bold text-slate-800">26 Juni 2026</span>
                                                    <span className="text-slate-400 font-semibold">Jatuh Tempo:</span>
                                                    <span className="font-bold text-slate-800">26 Juli 2026</span>
                                                    <span className="text-slate-400 font-semibold">Metode:</span>
                                                    <span className="font-bold text-slate-800">Transfer Bank</span>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100" />

                                        {/* Bill To & Project Info */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DITAGIHKAN KEPADA:</div>
                                                <div className="font-bold text-slate-900 text-sm">{project.clientName}</div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                                    NPWP: 01.234.567.8-901.000<br />
                                                    Gedung Capital Place, Lantai 15<br />
                                                    Jl. Jend. Gatot Subroto Kav. 18, Jakarta Selatan
                                                </p>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DETAIL PROYEK / KAMPANYE:</div>
                                                <div className="font-bold text-slate-900 text-sm">{project.name}</div>
                                                <div className="grid grid-cols-2 gap-x-2 mt-2 text-[11px] text-slate-500">
                                                    <span className="font-semibold">Sales PIC:</span>
                                                    <span>{project.salesPIC}</span>
                                                    <span className="font-semibold">Periode Kampanye:</span>
                                                    <span>{project.period}</span>
                                                    <span className="font-semibold">Total Lokasi:</span>
                                                    <span>{locations.length} titik</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table of Items */}
                                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <th className="px-4 py-3 text-center w-12">NO</th>
                                                        <th className="px-4 py-3">DESKRIPSI TITIK LOKASI</th>
                                                        <th className="px-4 py-3 text-center w-20">QTY</th>
                                                        <th className="px-4 py-3 text-right w-36">HARGA SATUAN</th>
                                                        <th className="px-4 py-3 text-right w-40">TOTAL (DPP)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                                                    {locations.map((loc, idx) => {
                                                        const locDpp = loc.vendorCost; // unit price
                                                        const qty = loc.qty || 1;
                                                        const rowTotal = locDpp * qty;
                                                        return (
                                                            <tr key={loc.id}>
                                                                <td className="px-4 py-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                                <td className="px-4 py-3.5">
                                                                    <div className="font-bold text-slate-800">{loc.description}</div>
                                                                    <div className="text-[10px] text-slate-400 mt-0.5">{loc.code} &middot; {loc.size}</div>
                                                                </td>
                                                                <td className="px-4 py-3.5 text-center text-slate-900 font-semibold">{qty} Unit</td>
                                                                <td className="px-4 py-3.5 text-right font-mono text-slate-600">{fmt(locDpp)}</td>
                                                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(rowTotal)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Financial Summary & Payment Terms */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                            <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKEMA PEMBAYARAN CLIENT:</div>
                                                
                                                {project.paymentTerms?.type === "full" && (
                                                    <div className="text-xs space-y-1 text-slate-700">
                                                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Full Payment (100% setelah penagihan)
                                                        </div>
                                                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                            <div>
                                                                <span className="text-slate-400">Jatuh Tempo:</span>
                                                                <span className="font-bold text-slate-800 ml-1">
                                                                    {project.paymentTerms.fullDueDate 
                                                                        ? formatDate(project.paymentTerms.fullDueDate) 
                                                                        : `${project.paymentTerms.fullDueDays || 30} hari setelah invoice diterima`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{project.paymentTerms.notes}"</p>
                                                    </div>
                                                )}

                                                {project.paymentTerms?.type === "dp" && (
                                                    <div className="text-xs space-y-2 text-slate-700">
                                                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            DP & Pelunasan
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-400">Uang Muka ({project.paymentTerms.dpPercent}%):</span>
                                                                    <span className="font-bold text-slate-800 font-mono">{fmt(project.paymentTerms.dpAmount || 0)}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500">
                                                                    Jatuh Tempo DP: <span className="font-semibold text-slate-700">
                                                                        {project.paymentTerms.dpDueDate 
                                                                            ? formatDate(project.paymentTerms.dpDueDate) 
                                                                            : `${project.paymentTerms.dpDueDays || 7} hari setelah invoice`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-400">Sisa Pelunasan:</span>
                                                                    <span className="font-bold text-slate-800 font-mono">{fmt(fin.totalInvoice - (project.paymentTerms.dpAmount || 0))}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500">
                                                                    Jatuh Tempo Pelunasan: <span className="font-semibold text-slate-700">
                                                                        {project.paymentTerms.pelunasanDueDate 
                                                                            ? formatDate(project.paymentTerms.pelunasanDueDate) 
                                                                            : `${project.paymentTerms.pelunasanDueDays || 30} hari setelah serah terima`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{project.paymentTerms.notes}"</p>
                                                    </div>
                                                )}

                                                {project.paymentTerms?.type === "termin" && project.paymentTerms.installments && (
                                                    <div className="text-xs space-y-2 text-slate-700">
                                                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Pembayaran Bertahap (Termin)
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {project.paymentTerms.installments.map((inst, idx) => (
                                                                <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                    <div className="flex justify-between items-center">
                                                                        <span>Termin {idx + 1} ({inst.percent}%) - <span className="text-slate-400">{inst.note}</span></span>
                                                                        <span className="font-bold font-mono text-slate-800">{fmt(inst.amount)}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 border-t border-slate-50/50 pt-1 mt-1">
                                                                        Jatuh Tempo: <span className="font-semibold text-slate-700">
                                                                            {inst.dueDate 
                                                                                ? formatDate(inst.dueDate) 
                                                                                : `${inst.dueDays || 30} hari setelah invoice`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col justify-between">
                                                <div className="space-y-2 text-xs font-semibold text-slate-700">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Subtotal DPP</span>
                                                        <span className="font-mono text-slate-900 font-bold">{fmt(fin.dpp)}</span>
                                                    </div>
                                                    {isPPN && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">PPN (11%)</span>
                                                            <span className="font-mono text-violet-600 font-bold">{fmt(fin.ppnKeluaran)}</span>
                                                        </div>
                                                    )}
                                                    <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                                                        <span className="font-black text-slate-900">Total Tagihan</span>
                                                        <span className="font-mono font-black text-emerald-600">{fmt(fin.totalInvoice)}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-slate-100">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">INSTRUKSI PEMBAYARAN:</div>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                                        Transfer wajib ditujukan ke rekening resmi perusahaan:<br />
                                                        <strong>Bank Mandiri Cabang Semarang Pandanaran</strong><br />
                                                        Nomor Rekening: <strong>135-00-9876543-2</strong><br />
                                                        Atas Nama: <strong>PT. Yousee Media Indonesia</strong>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Signature block */}
                                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SYARAT & KETENTUAN INVOICE:</div>
                                                <ul className="text-[9px] text-slate-500 list-disc list-inside space-y-1 leading-relaxed">
                                                    <li>Invoice ini sah dan diakui sebagai alat bukti penagihan resmi.</li>
                                                    <li>Keterlambatan pembayaran dapat dikenakan denda sesuai kontrak kerjasama.</li>
                                                    <li>Kuitansi resmi akan diterbitkan setelah dana masuk ke rekening PT. Yousee Media Indonesia.</li>
                                                </ul>
                                            </div>
                                            <div className="text-right flex flex-col items-end justify-between">
                                                <div className="text-[11px] text-slate-400 font-semibold">
                                                    Semarang, 26 Juni 2026<br />
                                                    <strong>PT. Yousee Media Indonesia</strong>
                                                </div>
                                                <div className="mt-8 flex flex-col items-center">
                                                    <div className="w-24 h-12 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300 font-black tracking-widest rounded-xl select-none">
                                                        STAMP HERE
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-bold mt-1.5">Finance & Tax Division</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                                        <h3 className="text-sm font-bold text-slate-800">Pratinjau Tagihan Client ({isPPN ? "Mode PPN" : "Mode Non-PPN"})</h3>
                                        
                                        <div className="divide-y divide-slate-100">
                                            <div className="py-2.5 flex justify-between text-xs font-semibold">
                                                <span className="text-slate-500">Nilai DPP Kontrak</span>
                                                <span className="font-mono text-slate-800">{fmt(fin.dpp)}</span>
                                            </div>
                                            {isPPN && (
                                                <div className="py-2.5 flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-500">PPN Jasa (11%)</span>
                                                    <span className="font-mono text-violet-600">{fmt(fin.ppnKeluaran)}</span>
                                                </div>
                                            )}
                                            <div className="py-3 flex justify-between text-sm font-bold border-t border-slate-200">
                                                <span className="text-slate-800">Total Nilai Tagihan</span>
                                                <span className="font-mono text-emerald-600">{fmt(fin.totalInvoice)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* P&L Block */}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Estimasi Laba Jual Proyek</h3>
                                        <div className="space-y-2 text-xs font-semibold text-slate-700">
                                            <div className="flex justify-between">
                                                <span>Pendapatan Proyek (DPP)</span>
                                                <span className="font-mono text-emerald-600">{fmt(fin.dpp)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Beban HPP Vendor (DPP)</span>
                                                <span className="font-mono text-rose-500">-{fmt(fin.totalDppVendor)}</span>
                                            </div>
                                            <div className="border-t border-slate-50 pt-2 flex justify-between text-sm font-bold text-slate-800">
                                                <span>Estimasi Laba Bersih</span>
                                                <span className={`font-mono ${fin.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(fin.netProfit)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>Margin Laba</span>
                                                <span className={`font-black ${fin.margin >= 30 ? "text-emerald-600" : "text-amber-500"}`}>{fin.margin.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alert / Notice */}
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
                                        <strong>Penting:</strong> Setelah invoice diterbitkan, sistem akan secara otomatis memposting jurnal piutang usaha & pendapatan reklame ke dalam pembukuan Yousee Finance.
                                    </div>

                                    <button 
                                        onClick={handleIssueInvoiceClick}
                                        className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all text-white ${isPPN ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700"}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        TERBITKAN INVOICE & FAKTUR PAJAK
                                    </button>
                                </div>
                            )}
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
            {/* Client Invoice payment terms form */}
            {showInvoiceForm && (
                <PoPaymentTermsModal
                    isOpen={showInvoiceForm}
                    onClose={() => setShowInvoiceForm(false)}
                    title="Konfigurasi Syarat Pembayaran Invoice"
                    amountLabel="Total Nilai Tagihan Client"
                    vendorName={project.clientName}
                    totalAmount={fin.totalInvoice}
                    onSubmit={handleConfirmIssueInvoice}
                />
            )}

            {/* Document Viewer Overlay */}
            {viewingPoNumber && (
                <PoDocumentModal
                    isOpen={!!viewingPoNumber}
                    onClose={() => setViewingPoNumber(null)}
                    poNumber={viewingPoNumber}
                    projectCode={project.code}
                    projectName={project.name}
                    clientName={project.clientName}
                    locations={locations}
                    isPPN={isPPN}
                    vendorPOs={vendorPOs}
                />
            )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Projects() {
    const fiscalMode = useDemoFiscalMode();
    const isPPN = fiscalMode === "ppn";

    const [projectsPPN, setProjectsPPN] = useState<Project[]>(initialProjectsPPN);
    const [projectsNonPPN, setProjectsNonPPN] = useState<Project[]>(initialProjectsNonPPN);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [form, setForm] = useState({ name: "", clientName: "", salesPIC: "", period: "", contractValue: "", totalLocations: "1" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const projects = isPPN ? projectsPPN : projectsNonPPN;

    const handleUpdateProject = (updatedProject: Project) => {
        if (isPPN) {
            setProjectsPPN(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } else {
            setProjectsNonPPN(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        }
        setSelectedProject(updatedProject);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Nama proyek wajib diisi.";
        if (!form.clientName.trim()) newErrors.clientName = "Nama client wajib diisi.";
        if (!form.contractValue.trim()) newErrors.contractValue = "Nilai kontrak wajib diisi.";
        if (!form.totalLocations || parseInt(form.totalLocations) < 1) newErrors.totalLocations = "Jumlah titik harus minimal 1.";
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        const newId = Date.now();
        const nextIdIndex = projects.length + 1;

        const clientIds: Record<string, number> = {
            "PT. Walt Disney Pictures Indonesia": 1,
            "Shopee Indonesia": 2,
            "PT. Gojek Tokopedia": 3,
            "CV. Soto Bangkong Lestari": 4,
            "Samsung Electronics Indonesia": 5,
            "Sari Laundry Express": 6
        };
        const resolvedClientId = clientIds[form.clientName] || 0;

        const locationCount = parseInt(form.totalLocations) || 1;
        const generatedLocations: BillboardLocation[] = Array.from({ length: locationCount }, (_, i) => ({
            id: Date.now() + i,
            code: `LOC-${String(i + 1).padStart(3, "0")}`,
            area: "Belum ditentukan",
            description: `Titik Lokasi ${i + 1} (Belum Dikonfigurasi)`,
            type: "Billboard",
            size: "-",
            vendorId: null,
            vendorName: "Belum ditentukan",
            vendorCost: 0,
            qty: 1,
            poIssued: false,
            poNumber: "",
        }));

        const newProject: Project = {
            id: newId,
            code: `PRJ-2026-${isPPN ? "PPN" : "NON"}-${String(nextIdIndex).padStart(3, "0")}`,
            name: form.name,
            clientId: resolvedClientId,
            clientName: form.clientName,
            salesPIC: form.salesPIC || "-",
            period: form.period || "-",
            contractValue: parseInt(form.contractValue.replace(/[^0-9]/g, "")) || 0,
            status: "Draft",
            locations: generatedLocations,
            invoiceIssued: false,
            invoiceNumber: "",
            targetQty: locationCount,
        };

        if (isPPN) {
            setProjectsPPN([...projectsPPN, newProject]);
        } else {
            setProjectsNonPPN([...projectsNonPPN, newProject]);
        }

        setForm({ name: "", clientName: "", salesPIC: "", period: "", contractValue: "", totalLocations: "1" });
        setErrors({});
        setIsCreateOpen(false);
    };

    return (
        <DemoLayout activePage="projects" title="Data Project" breadcrumbs={[{ label: "Yousee Indonesia" }, { label: "Transaksi" }, { label: "Data Project" }]}>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Manajemen Proyek Billboard</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                            Tracking proyek per client &middot; Multi-titik &middot; Multi-vendor &middot; {isPPN ? "Mode PPN Aktif" : "Mode Non-PPN Aktif"}
                        </p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Buat Proyek Baru
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {(() => {
                        const totalDpp = projects.reduce((s, p) => s + p.contractValue, 0);
                        const totalPPN = isPPN ? totalDpp * PPN_RATE : 0;
                        const totalInvoice = totalDpp + totalPPN;
                        const totalVendorDpp = projects.reduce((s, p) => s + p.locations.reduce((ls, l) => ls + l.vendorCost, 0), 0);
                        const totalProfit = totalDpp - totalVendorDpp;
                        const totalPO = projects.reduce((s, p) => s + p.locations.filter(l => l.poIssued).length, 0);
                        const totalLoc = projects.reduce((s, p) => s + p.locations.length, 0);
                        return [
                            { label: "Total Proyek", value: String(projects.length), sub: `${projects.filter(p => p.status === "Active").length} aktif`, color: "text-blue-600", emoji: "📋" },
                            { label: isPPN ? "Total Invoice (incl. PPN)" : "Total Invoice", value: `Rp ${Math.round(totalInvoice).toLocaleString("id-ID")}`, sub: isPPN ? `DPP: Rp ${Math.round(totalDpp).toLocaleString("id-ID")}` : "Tanpa PPN", color: "text-emerald-600", emoji: "💰" },
                            { label: "Laba Bersih", value: `Rp ${Math.round(totalProfit).toLocaleString("id-ID")}`, sub: `${totalDpp > 0 ? ((totalProfit / totalDpp) * 100).toFixed(1) : "0"}% margin`, color: totalProfit >= 0 ? "text-emerald-600" : "text-rose-600", emoji: "📈" },
                            { label: "PO Diterbitkan", value: String(totalPO), sub: `dari ${totalLoc} titik lokasi`, color: "text-amber-600", emoji: "📄" },
                        ];
                    })().map((card, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</div>
                                <span className="text-lg">{card.emoji}</span>
                            </div>
                            <div className={`text-base font-black font-mono ${card.color} leading-tight`}>{card.value}</div>
                            <div className="text-[10px] text-slate-400 font-semibold mt-1">{card.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Project List */}
                <div className="space-y-3">
                    {projects.map(project => {
                        const fin = calcFinancials(project, project.locations, fiscalMode);
                        const poProgress = project.locations.length > 0 ? project.locations.filter(l => l.poIssued).length / project.locations.length : 0;
                        return (
                            <div key={project.id} onClick={() => setSelectedProject(project)} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded tracking-widest">{project.code}</span>
                                            <StatusBadge status={project.status} />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{project.name}</h3>
                                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{project.clientName} &middot; {project.salesPIC} &middot; {project.period}</p>
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${poProgress * 100}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{project.locations.filter(l => l.poIssued).length}/{project.locations.length} PO</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 space-y-1 min-w-[130px]">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice</div>
                                            <div className="font-mono font-bold text-slate-900 text-sm">{fmt(fin.totalInvoice)}</div>
                                            {isPPN && <div className="text-[9px] text-violet-500 font-semibold">DPP {fmt(fin.dpp)}</div>}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Laba</div>
                                            <div className={`font-mono font-bold text-sm ${fin.netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{fmt(fin.netProfit)}</div>
                                        </div>
                                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded ${fin.margin >= 30 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{fin.margin.toFixed(1)}%</span>
                                    </div>
                                    <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-all">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedProject && <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} fiscalMode={fiscalMode} onUpdateProject={handleUpdateProject} />}

            <SlideOver isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Proyek Baru">
                <form onSubmit={handleCreate} className="space-y-5">
                    {/* Nama Proyek */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Nama Proyek / Kampanye <span className="text-rose-500">*</span></label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Kampanye Iklan Film Toystory 5..." />
                        {errors.name && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.name}</span>}
                    </div>

                    {/* Client / Pengiklan Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Client / Pengiklan <span className="text-rose-500">*</span></label>
                        <select value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                            <option value="">-- Pilih Client --</option>
                            <option value="PT. Walt Disney Pictures Indonesia">PT. Walt Disney Pictures Indonesia</option>
                            <option value="Shopee Indonesia">Shopee Indonesia</option>
                            <option value="PT. Gojek Tokopedia">PT. Gojek Tokopedia</option>
                            <option value="CV. Soto Bangkong Lestari">CV. Soto Bangkong Lestari</option>
                            <option value="Samsung Electronics Indonesia">Samsung Electronics Indonesia</option>
                            <option value="Sari Laundry Express">Sari Laundry Express</option>
                        </select>
                        {errors.clientName && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.clientName}</span>}
                    </div>

                    {/* Sales PIC Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Sales PIC</label>
                        <select value={form.salesPIC} onChange={e => setForm({ ...form, salesPIC: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer">
                            <option value="">-- Pilih Sales PIC --</option>
                            <option value="Budi Santoso">Budi Santoso</option>
                            <option value="Rina Widayanti">Rina Widayanti</option>
                            <option value="Andi Prasetyo">Andi Prasetyo</option>
                            <option value="Eko Prasetyo">Eko Prasetyo</option>
                            <option value="Rian Hidayat">Rian Hidayat</option>
                            <option value="Siti Aminah">Siti Aminah</option>
                        </select>
                        {errors.salesPIC && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.salesPIC}</span>}
                    </div>

                    {/* Periode Kampanye */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Periode Kampanye</label>
                        <input type="text" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Jul - Sep 2026" />
                        {errors.period && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.period}</span>}
                    </div>

                    {/* Jumlah Titik Lokasi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Jumlah Titik Lokasi <span className="text-rose-500">*</span></label>
                        <input type="number" min="1" max="20" value={form.totalLocations} onChange={e => setForm({ ...form, totalLocations: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" />
                        {errors.totalLocations && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.totalLocations}</span>}
                    </div>

                    {/* Nilai Kontrak */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Nilai Kontrak / DPP (IDR) <span className="text-rose-500">*</span></label>
                        <input type="text" value={form.contractValue} onChange={e => setForm({ ...form, contractValue: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Masukkan nilai DPP (sebelum PPN)..." />
                        {errors.contractValue && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.contractValue}</span>}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200">Batal</button>
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">Simpan Draft Proyek</button>
                    </div>
                </form>
            </SlideOver>
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
