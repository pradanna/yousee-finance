import React, { useState, useMemo } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import AppLayout, { useFiscalMode } from "@/Layouts/AppLayout";
import SlideOver from "@/Components/UI/SlideOver";
import PrimaryButton from "@/Components/Button/PrimaryButton";
import TextInput from "@/Components/Form/TextInput";
import SelectInput from "@/Components/Form/SelectInput";
import MetricCard from "@/Components/Card/MetricCard";
import Pagination from "@/Components/Table/Pagination";
import EmptyState from "@/Components/Table/EmptyState";
import ActionDropdown from "@/Components/UI/ActionDropdown";

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
type ViewMode = "grid" | "kanban" | "table";

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

function calcFinancials(project: Project, locations: BillboardLocation[], fiscalMode: FiscalMode) {
    const isPPN = fiscalMode === "ppn";
    const dpp = project.contractValue;
    const ppnKeluaran = isPPN ? dpp * PPN_RATE : 0;
    const totalInvoice = dpp + ppnKeluaran;

    const totalDppVendor = locations.reduce((s, l) => s + (l.vendorCost * (l.qty || 1)), 0);
    const ppnMasukan = isPPN ? totalDppVendor * PPN_RATE : 0;
    const totalPO = totalDppVendor + ppnMasukan;

    const netProfit = dpp - totalDppVendor;
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
        Active:    { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", text: "Aktif" },
        Completed: { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", text: "Selesai" },
        Cancelled: { bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500", text: "Dibatalkan" },
    };
    const s = map[status] || map.Draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Project Detail Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function ProjectDetailModal({ project, isOpen, onClose, fiscalMode, onUpdateProject }: { project: Project | null; isOpen: boolean; onClose: () => void; fiscalMode: FiscalMode; onUpdateProject: (updated: Project) => void }) {
    const [render, setRender] = useState(false);
    const [active, setActive] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("info");
    const [displayedProject, setDisplayedProject] = useState<Project | null>(project);
    const [locations, setLocations] = useState<BillboardLocation[]>(project ? project.locations : []);

    React.useEffect(() => {
        if (isOpen && project) {
            setDisplayedProject(project);
            setLocations(project.locations);
            setActiveTab("info");
            setRender(true);
            const timer = setTimeout(() => setActive(true), 20);
            return () => clearTimeout(timer);
        } else {
            setActive(false);
            const timer = setTimeout(() => setRender(false), 350);
            return () => clearTimeout(timer);
        }
    }, [isOpen, project]);

    if (!render || !displayedProject) return null;
    const prj = displayedProject;

    const isPPN = fiscalMode === "ppn";
    const fin = calcFinancials(prj, locations, fiscalMode);

    const tabs = [
        { id: "info" as ActiveTab, label: "Info Proyek" },
        { id: "locations" as ActiveTab, label: `Titik Lokasi (${locations.length})` },
        { id: "vendors" as ActiveTab, label: "Vendor & PO" },
        { id: "invoice" as ActiveTab, label: "Invoice Client" },
    ];

    const poCount = locations.filter(l => l.poIssued).length;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Fade */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
                    active ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Slide Panel from Right */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
                <div
                    className={`pointer-events-auto relative w-[1050px] max-w-[95vw] h-screen bg-white shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${
                        active ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                                    {/* HEADER */}
                                    <div className="bg-slate-900 px-6 py-5 flex-shrink-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded tracking-wider uppercase border border-blue-500/20">{prj.code}</span>
                                                    <StatusBadge status={prj.status} />
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isPPN ? "bg-violet-500/20 text-violet-300 border-violet-500/30" : "bg-slate-800 text-slate-300 border-slate-700"}`}>
                                                        {isPPN ? "Mode PPN" : "Mode Non-PPN"}
                                                    </span>
                                                </div>
                                                <h2 className="text-lg font-bold text-white tracking-tight">{prj.name}</h2>
                                                <p className="text-xs text-slate-400 mt-0.5">{prj.clientName} &middot; {prj.period}</p>
                                            </div>
                                            <button onClick={onClose} className="flex-shrink-0 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>

                                        {/* Quick Stats Grid */}
                                        <div className="grid grid-cols-4 gap-3 mt-4">
                                            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nilai DPP Kontrak</div>
                                                <div className="text-xs font-bold font-mono text-emerald-400">{fmt(fin.dpp)}</div>
                                            </div>
                                            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Tagihan</div>
                                                <div className="text-xs font-bold font-mono text-white">{fmt(fin.totalInvoice)}</div>
                                            </div>
                                            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estimasi Laba Bersih</div>
                                                <div className={`text-xs font-bold font-mono ${fin.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(fin.netProfit)}</div>
                                            </div>
                                            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Margin Keuntungan</div>
                                                <div className={`text-xs font-bold font-mono ${fin.margin >= 30 ? "text-emerald-400" : "text-amber-400"}`}>{fin.margin.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TABS */}
                                    <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
                                        {tabs.map(tab => (
                                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                className={`relative px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
                                                    activeTab === tab.id
                                                        ? "text-primary bg-white"
                                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                                                }`}>
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* CONTENT */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* INFO TAB */}
                                        {activeTab === "info" && (
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { label: "Kode Proyek", value: prj.code },
                                                        { label: "Status", value: <StatusBadge status={prj.status} /> },
                                                        { label: "Client / Pengiklan", value: prj.clientName },
                                                        { label: "Sales PIC", value: prj.salesPIC },
                                                        { label: "Periode Kampanye", value: prj.period },
                                                        { label: "Total Titik Lokasi", value: `${locations.length} titik` },
                                                        { label: "DPP Kontrak", value: <span className="font-mono font-bold text-emerald-600">{fmt(prj.contractValue)}</span> },
                                                        { label: isPPN ? "Total Invoice (DPP + PPN)" : "Total Invoice", value: <span className="font-mono font-bold text-slate-900">{fmt(fin.totalInvoice)}</span> },
                                                    ].map((row, i) => (
                                                        <div key={i} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{row.label}</div>
                                                            <div className="text-xs font-bold text-slate-800">{row.value}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-2">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-slate-600">Progress PO Terbit</span>
                                                        <span className="text-slate-800">{poCount} / {locations.length} titik</span>
                                                    </div>
                                                    <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: locations.length > 0 ? `${(poCount / locations.length) * 100}%` : "0%" }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* LOCATIONS TAB */}
                                        {activeTab === "locations" && (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-800">Titik Lokasi Billboard</h3>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{locations.length} titik lokasi terdaftar dalam kampanye ini</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {locations.map((loc, idx) => (
                                                        <div key={loc.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-slate-800">{loc.description}</span>
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{loc.type}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                                        Vendor: {loc.vendorName} &middot; Ukuran: {loc.size} &middot; Area: {loc.area}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* VENDORS & INVOICE TABS */}
                                        {(activeTab === "vendors" || activeTab === "invoice") && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-2">
                                                <h4 className="text-xs font-bold text-slate-800">Dokumen PO & Invoice Client</h4>
                                                <p className="text-[11px] text-slate-500">Seluruh penerbitan Purchase Order dan Invoice Client dikelola secara otomatis sesuai skema pajak yang aktif.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
    );
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
        period: "",
        totalLocations: "1",
        contractValue: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};
        if (!form.name.trim()) errs.name = "Nama proyek wajib diisi.";
        if (!form.clientName) errs.clientName = "Client wajib dipilih.";
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
            period: form.period || "Bulan Ini",
            contractValue: parseInt(form.contractValue.replace(/[^0-9]/g, "")) || 0,
            status: "Draft",
            invoiceIssued: false,
            invoiceNumber: "",
            targetQty: parseInt(form.totalLocations) || 1,
            locations: [],
        };

        setProjects([newPrj, ...projects]);
        setIsCreateOpen(false);
        setForm({ name: "", clientName: "", salesPIC: "", period: "", totalLocations: "1", contractValue: "" });
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

    // Filtering
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        title="Total Nilai Kontrak (DPP)"
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
                                                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                                        PIC: {project.salesPIC} &middot; Periode: {project.period}
                                                    </div>
                                                </div>

                                                {/* Milestone Stage Tracker Mini Bar */}
                                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <span className="text-slate-500">Progress PO Vendor</span>
                                                        <span className="text-slate-800 font-mono">{poCount} / {locCount} PO Terbit</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.round(poProgress * 100)}%` }}
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

                                            {/* Progress PO */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                                    <span>PO Terbit</span>
                                                    <span>{poCount}/{locCount} Titik</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.round(poProgress * 100)}%` }} />
                                                </div>
                                            </div>

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

                {/* Create Project Drawer */}
                <SlideOver isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Proyek Kampanye Baru">
                    <form onSubmit={handleCreate} className="space-y-5">
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
                                <option value="PT. Walt Disney Pictures Indonesia">PT. Walt Disney Pictures Indonesia</option>
                                <option value="Shopee Indonesia">Shopee Indonesia</option>
                                <option value="PT. Gojek Tokopedia">PT. Gojek Tokopedia</option>
                                <option value="CV. Soto Bangkong Lestari">CV. Soto Bangkong Lestari</option>
                                <option value="Samsung Electronics Indonesia">Samsung Electronics Indonesia</option>
                                <option value="Sari Laundry Express">Sari Laundry Express</option>
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
                                <option value="Budi Santoso">Budi Santoso</option>
                                <option value="Rina Widayanti">Rina Widayanti</option>
                                <option value="Andi Prasetyo">Andi Prasetyo</option>
                                <option value="Eko Prasetyo">Eko Prasetyo</option>
                                <option value="Rian Hidayat">Rian Hidayat</option>
                                <option value="Siti Aminah">Siti Aminah</option>
                            </SelectInput>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Periode Kampanye</label>
                            <input
                                type="text"
                                value={form.period}
                                onChange={e => setForm({ ...form, period: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Jul - Sep 2026"
                            />
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

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Nilai Kontrak / DPP (IDR) <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                value={form.contractValue}
                                onChange={e => setForm({ ...form, contractValue: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                placeholder="Masukkan nilai DPP (sebelum PPN)..."
                            />
                            {errors.contractValue && <span className="text-[10px] text-rose-500 font-bold uppercase block mt-1">{errors.contractValue}</span>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200">
                                Batal
                            </button>
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all">
                                Simpan Draft Proyek
                            </button>
                        </div>
                    </form>
                </SlideOver>

                {/* Project Detail Modal Drawer — always rendered for smooth exit animation */}
                <ProjectDetailModal
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
