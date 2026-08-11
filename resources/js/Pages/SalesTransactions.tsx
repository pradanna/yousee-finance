import React, { useState } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import Pagination from '@/Components/Table/Pagination';
import { RecordInvoicePaymentModal } from "@/Components/Modal/RecordInvoicePaymentModal";
import type { RecordInvoicePaymentModalSubmitData } from "@/Components/Modal/RecordInvoicePaymentModal";
import { ConfigurePaymentSchemeModal } from "@/Components/Modal/ConfigurePaymentSchemeModal";
import type { InvoiceData, InvoicePaymentRecord, Kwitansi } from "@/Pages/Invoices/invoiceTypes";
import { getInvoicePaymentSummary } from "@/Pages/Invoices/invoiceTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface InvoicePaymentTerm {
    type: "full" | "dp" | "termin" | "installment";
    notes?: string;
    fullDueDays?: number;
    fullDueDate?: string;
    dpPercent?: number;
    dpAmount?: number;
    dpDueDays?: number;
    dpDueDate?: string;
    pelunasanDueDays?: number;
    pelunasanDueDate?: string;
    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
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
    invoiceIssuedAt?: string;
    targetQty: number;
    paymentTerms?: InvoicePaymentTerm;
}

const PPN_RATE = 0.11;
const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    } catch { return dateStr; }
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────
const initialProjectsPPN: Project[] = [
    {
        id: 1, targetQty: 5, code: "PRJ-2026-PPN01",
        name: "Kampanye Iklan Film Toystory 5 - Jawa Tengah",
        clientId: 1, clientName: "PT. Walt Disney Pictures Indonesia",
        salesPIC: "Budi Santoso", period: "Jul - Sep 2026",
        contractValue: 280000000, status: "Active",
        invoiceIssued: false, invoiceNumber: "",
        locations: [
            { id: 1, code: "LOC-001", area: "Semarang", description: "Billboard Jl. Pandanaran KM 3 (Megah)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 8500000, poIssued: true, poNumber: "PO-2026-0041", qty: 1 },
            { id: 2, code: "LOC-002", area: "Semarang", description: "Billboard Simpang Lima (Depan BCA)", type: "Billboard", size: "6x12m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 14000000, poIssued: true, poNumber: "PO-2026-0041", qty: 1 },
            { id: 3, code: "LOC-003", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0042", qty: 1 },
            { id: 4, code: "LOC-004", area: "Yogyakarta", description: "Baliho Jl. Malioboro (Dekat Kraton)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 7500000, poIssued: false, poNumber: "", qty: 1 },
            { id: 5, code: "LOC-005", area: "Yogyakarta", description: "Billboard Ring Road Utara Monjali", type: "Billboard", size: "4x8m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 9000000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 2, targetQty: 2, code: "PRJ-2026-PPN02",
        name: "Brand Awareness Shopee 12.12 - Jakarta",
        clientId: 2, clientName: "Shopee Indonesia",
        salesPIC: "Rina Widayanti", period: "Nov - Des 2026",
        contractValue: 450000000, status: "Draft",
        invoiceIssued: false, invoiceNumber: "",
        locations: [
            { id: 6, code: "LOC-006", area: "Semarang", description: "Billboard Jl. Pemuda (Dekat Paragon Mall)", type: "Billboard", size: "4x8m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 9500000, poIssued: false, poNumber: "", qty: 1 },
            { id: 7, code: "LOC-007", area: "Solo", description: "Videotron Solo Grand Mall", type: "Videotron", size: "3x5m", vendorId: 1, vendorName: "PT. Megah Billboard Jaya", vendorCost: 15000000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 3, targetQty: 2, code: "PRJ-2026-PPN03",
        name: "Samsung Galaxy S27 Launching - Jabodetabek",
        clientId: 5, clientName: "Samsung Electronics Indonesia",
        salesPIC: "Budi Santoso", period: "Okt - Des 2026",
        contractValue: 720000000, status: "Active",
        invoiceIssued: true, invoiceNumber: "INV-2026-PPN-0011",
        invoiceIssuedAt: "2026-07-01",
        paymentTerms: {
            type: "dp",
            dpPercent: 50,
            dpAmount: 399600000,
            dpDueDate: "2026-07-10",
            pelunasanDueDate: "2026-09-01",
            notes: "DP 50% di muka, Pelunasan setelah serah terima"
        },
        locations: [
            { id: 12, code: "LOC-012", area: "Solo", description: "Videotron Jl. Slamet Riyadi Pusat", type: "Videotron", size: "3x5m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 22000000, poIssued: true, poNumber: "PO-2026-0091", qty: 1 },
            { id: 13, code: "LOC-013", area: "Semarang", description: "Videotron Jl. Pahlawan", type: "Videotron", size: "4x8m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 19000000, poIssued: true, poNumber: "PO-2026-0091", qty: 1 },
        ]
    }
];

const initialProjectsNonPPN: Project[] = [
    {
        id: 101, targetQty: 3, code: "PRJ-2026-NON01",
        name: "Promosi Gojek UMKM - Jawa Timur",
        clientId: 3, clientName: "PT. Gojek Tokopedia",
        salesPIC: "Andi Prasetyo", period: "Agu - Okt 2026",
        contractValue: 180000000, status: "Active",
        invoiceIssued: false, invoiceNumber: "",
        locations: [
            { id: 8, code: "LOC-008", area: "Surabaya", description: "Baliho Jl. Darmo (Depan Taman Bungkul)", type: "Baliho", size: "3x6m", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", vendorCost: 5500000, poIssued: true, poNumber: "PO-2026-0055", qty: 1 },
            { id: 9, code: "LOC-009", area: "Malang", description: "Billboard Jl. Kahuripan (Alun-alun Kota)", type: "Billboard", size: "4x8m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 4200000, poIssued: true, poNumber: "PO-2026-0056", qty: 1 },
            { id: 10, code: "LOC-010", area: "Banyuwangi", description: "Neonbox Terminal Blambangan", type: "Neonbox", size: "1.5x2m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 2800000, poIssued: false, poNumber: "", qty: 1 },
        ]
    },
    {
        id: 102, targetQty: 1, code: "PRJ-2026-NON02",
        name: "Baliho Kuliner Lokal Soto Bangkong - Solo",
        clientId: 4, clientName: "CV. Soto Bangkong Lestari",
        salesPIC: "Eko Prasetyo", period: "Sep - Nov 2026",
        contractValue: 45000000, status: "Active",
        invoiceIssued: false, invoiceNumber: "",
        locations: [
            { id: 11, code: "LOC-011", area: "Solo", description: "Baliho Jl. Adi Sucipto KM 5", type: "Baliho", size: "3x6m", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", vendorCost: 3500000, poIssued: true, poNumber: "PO-2026-0060", qty: 1 },
        ]
    },
    {
        id: 103, targetQty: 1, code: "PRJ-2026-NON03",
        name: "Papan Nama Neonbox Laundry Express - Yogya",
        clientId: 6, clientName: "Sari Laundry Express",
        salesPIC: "Andi Prasetyo", period: "Mei 2026",
        contractValue: 12500000, status: "Completed",
        invoiceIssued: true, invoiceNumber: "INV-2026-N001",
        invoiceIssuedAt: "2026-05-01",
        paymentTerms: {
            type: "full",
            fullDueDays: 30,
            fullDueDate: "2026-05-31",
            notes: "Pembayaran 100% dalam 30 hari setelah invoice diterima"
        },
        locations: [
            { id: 14, code: "LOC-014", area: "Yogyakarta", description: "Neonbox Perempatan Tugu Yogyakarta", type: "Neonbox", size: "2x3m", vendorId: 2, vendorName: "CV. Media Ad Perkasa", vendorCost: 4500000, poIssued: true, poNumber: "PO-2026-0099", qty: 1 },
        ]
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────────────────
const ProjectStatusBadge = ({ status }: { status: Project["status"] }) => {
    const map: Record<Project["status"], { bg: string; dot: string; text: string }> = {
        Draft: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400", text: "Draft" },
        Active: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "Active" },
        Completed: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "Selesai" },
        Cancelled: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", text: "Dibatalkan" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

const InvoiceStatusBadge = ({ status }: { status: "draft" | "issued" | "partial" | "paid" }) => {
    const map = {
        draft: { bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", text: "DRAFT" },
        issued: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500 animate-pulse", text: "ISSUED" },
        partial: { bg: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-500 animate-pulse", text: "PARTIAL" },
        paid: { bg: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-600", text: "PAID / LUNAS" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesTransactions() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [projectsPPN, setProjectsPPN] = useState<Project[]>(initialProjectsPPN);
    const [projectsNonPPN, setProjectsNonPPN] = useState<Project[]>(initialProjectsNonPPN);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "issued" | "ar_schedule">("all");
    const [expandedInvoicePayment, setExpandedInvoicePayment] = useState<string | null>(null);
    const [filterSalesPIC, setFilterSalesPIC] = useState<string>("all");

    // Pagination
    const ITEMS_PER_PAGE = 6;
    const [allPage, setAllPage] = useState(1);
    const [pendingPage, setPendingPage] = useState(1);
    const [issuedPage, setIssuedPage] = useState(1);
    const [arPage, setArPage] = useState(1);

    // State for Client Payment Recording & Kwitansi
    const [paymentsByInvoice, setPaymentsByInvoice] = useState<Record<string, InvoicePaymentRecord[]>>({
        "INV-2026-N001": [{
            id: "PAY-INV-001", invoiceNumber: "INV-2026-N001",
            termLabel: "Pelunasan Full", amount: 12500000,
            date: "2026-05-18", method: "Transfer Bank BCA",
            referenceNo: "BKM-2026-0518", notes: "Pelunasan 100% Invoice Sari Laundry"
        }]
    });
    const [kwitansiByInvoice, setKwitansiByInvoice] = useState<Record<string, Kwitansi>>({
        "INV-2026-N001": {
            receiptNumber: "KW-2026-0518-01",
            amount: 12500000,
            paidAt: "2026-05-18",
            receivedFrom: "Sari Laundry Express",
            forPaymentOf: "Pelunasan Sewa Neonbox Perempatan Tugu Yogyakarta"
        }
    });
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Project | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const projects = isPPN ? projectsPPN : projectsNonPPN;
    const setProjects = isPPN ? setProjectsPPN : setProjectsNonPPN;

    const activeProject = projects.find(p => p.id === selectedProjectId);

    // ── Derived data ──────────────────────────────────────────────────────────
    const allSalesPICs = Array.from(new Set(projects.map(p => p.salesPIC))).sort();

    const filteredProjects = projects.filter(p => {
        const matchSearch =
            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.salesPIC.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSales = filterSalesPIC === "all" || p.salesPIC === filterSalesPIC;
        return matchSearch && matchSales;
    });

    const issuedProjects = filteredProjects.filter(p => p.invoiceIssued);
    const pendingProjects = filteredProjects.filter(p => !p.invoiceIssued);

    // Metric summary
    const totalIssued = projects.filter(p => p.invoiceIssued).length;
    const totalPending = projects.filter(p => !p.invoiceIssued).length;
    const totalARValue = issuedProjects.reduce((s, p) => {
        const invNum = p.invoiceNumber;
        const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
        const paid = (paymentsByInvoice[invNum] || []).reduce((sum, pay) => sum + pay.amount, 0);
        return s + Math.max(0, total - paid);
    }, 0);
    const totalRealized = issuedProjects.reduce((s, p) => {
        const invNum = p.invoiceNumber;
        return s + (paymentsByInvoice[invNum] || []).reduce((sum, pay) => sum + pay.amount, 0);
    }, 0);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleConfirmIssueInvoice = (terms: InvoicePaymentTerm) => {
        if (!activeProject) return;
        const nextInvNum = `INV-2026-${isPPN ? "PPN" : "NON"}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        setProjects(prev => prev.map(p => p.id === activeProject.id
            ? { ...p, invoiceIssued: true, invoiceNumber: nextInvNum, invoiceIssuedAt: new Date().toISOString().split("T")[0], paymentTerms: terms }
            : p
        ));
        setShowInvoiceForm(false);
        setSuccessMessage(`Berhasil menerbitkan Invoice ${nextInvNum} untuk ${activeProject.clientName}!`);
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    const handleCancelInvoice = () => {
        if (!activeProject) return;
        const payments = paymentsByInvoice[activeProject.invoiceNumber] || [];
        if (payments.length > 0) {
            alert("Tidak dapat membatalkan invoice yang sudah memiliki catatan penerimaan pembayaran.");
            return;
        }
        if (confirm("Apakah Anda yakin ingin membatalkan invoice ini? Status akan kembali ke Draft.")) {
            setProjects(prev => prev.map(p => p.id === activeProject.id
                ? { ...p, invoiceIssued: false, invoiceNumber: "", invoiceIssuedAt: undefined, paymentTerms: undefined }
                : p
            ));
        }
    };

    const handleSaveInvoicePayment = (data: RecordInvoicePaymentModalSubmitData) => {
        if (!selectedInvoiceForPayment || !selectedInvoiceForPayment.invoiceNumber) return;
        const invNum = selectedInvoiceForPayment.invoiceNumber;
        const totalInvoiceVal = selectedInvoiceForPayment.contractValue * (isPPN ? (1 + PPN_RATE) : 1);

        const newPaymentRecord: InvoicePaymentRecord = {
            id: `PAY-INV-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceNumber: invNum, termLabel: data.termLabel,
            amount: data.amount, date: data.date, method: data.method,
            referenceNo: data.referenceNo, notes: data.notes
        };

        const updatedPayments = [...(paymentsByInvoice[invNum] || []), newPaymentRecord];
        setPaymentsByInvoice(prev => ({ ...prev, [invNum]: updatedPayments }));

        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        if (newTotalPaid >= totalInvoiceVal && !kwitansiByInvoice[invNum]) {
            setKwitansiByInvoice(prev => ({
                ...prev,
                [invNum]: {
                    receiptNumber: `KW-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                    amount: totalInvoiceVal,
                    paidAt: data.date,
                    receivedFrom: selectedInvoiceForPayment.clientName,
                    forPaymentOf: `Pelunasan Sewa Media Iklan - ${selectedInvoiceForPayment.name}`
                }
            }));
        }

        setShowRecordPaymentModal(false);
        setExpandedInvoicePayment(invNum);
        setSuccessMessage(`Berhasil mencatat penerimaan ${fmt(data.amount)} untuk ${invNum}!`);
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    // ── Active project computed values ────────────────────────────────────────
    const activeInvNum = activeProject?.invoiceNumber || "";
    const activeTotalAmount = activeProject ? activeProject.contractValue * (isPPN ? (1 + PPN_RATE) : 1) : 0;
    const activePayments = paymentsByInvoice[activeInvNum] || [];
    const activeKwitansi = kwitansiByInvoice[activeInvNum];
    const activeTotalPaid = activePayments.reduce((s, p) => s + p.amount, 0);
    const activeRemaining = Math.max(0, activeTotalAmount - activeTotalPaid);
    const activeInvoiceStatus: "draft" | "issued" | "partial" | "paid" = !activeProject?.invoiceIssued
        ? "draft" : activeTotalPaid >= activeTotalAmount ? "paid" : activeTotalPaid > 0 ? "partial" : "issued";

    // ── Helper: get invoice status for a project ──────────────────────────────
    const getProjectInvoiceStatus = (p: Project): "draft" | "issued" | "partial" | "paid" => {
        if (!p.invoiceIssued) return "draft";
        const paid = (paymentsByInvoice[p.invoiceNumber] || []).reduce((s, pay) => s + pay.amount, 0);
        const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
        if (paid >= total) return "paid";
        if (paid > 0) return "partial";
        return "issued";
    };

    // ── AR Schedule items ─────────────────────────────────────────────────────
    const arScheduleItems = issuedProjects
        .flatMap(p => {
            const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
            const invStatus = getProjectInvoiceStatus(p);
            const terms = p.paymentTerms;
            if (!terms) return [{
                project: p, label: "Pembayaran Invoice", dueDate: undefined,
                amount: total, invStatus
            }];
            if (terms.type === "full") return [{ project: p, label: "Full Payment", dueDate: terms.fullDueDate, amount: total, invStatus }];
            if (terms.type === "dp") return [
                { project: p, label: `DP ${terms.dpPercent || 50}%`, dueDate: terms.dpDueDate, amount: terms.dpAmount || Math.round(total * 0.5), invStatus },
                { project: p, label: "Pelunasan", dueDate: terms.pelunasanDueDate, amount: total - (terms.dpAmount || Math.round(total * 0.5)), invStatus },
            ];
            if (terms.type === "termin" && terms.installments) return terms.installments.map((inst, i) => ({
                project: p, label: inst.note || `Termin ${i + 1}`, dueDate: inst.dueDate, amount: inst.amount, invStatus
            }));
            if (terms.type === "installment") return [{ project: p, label: "Cicilan Bulanan", dueDate: terms.fullDueDate, amount: total, invStatus }];
            return [{ project: p, label: "Pembayaran Invoice", dueDate: undefined, amount: total, invStatus }];
        })
        .sort((a, b) => {
            const da = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
            const db = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
            return da - db;
        });

    const getDueDateStatus = (dueDate?: string) => {
        if (!dueDate) return { label: "Belum Terjadwal", style: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        if (diff < 0) return { label: `Telah Lewat (${Math.abs(diff)} Hari)`, style: "bg-rose-50 text-rose-700 border-rose-200 font-bold", dot: "bg-rose-500 animate-ping" };
        if (diff === 0) return { label: "Jatuh Tempo Hari Ini!", style: "bg-rose-50 text-rose-700 border-rose-300 font-bold", dot: "bg-rose-500 animate-pulse" };
        if (diff <= 7) return { label: `Segera Jatuh Tempo (H-${diff})`, style: "bg-amber-50 text-amber-800 border-amber-300 font-bold", dot: "bg-amber-500 animate-pulse" };
        return { label: `Belum Jatuh Tempo (H-${diff})`, style: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" };
    };

    // ── Download Invoice PDF ──────────────────────────────────────────────────
    const handleDownloadInvoicePdf = (p: Project) => {
        const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
        const payments = paymentsByInvoice[p.invoiceNumber] || [];
        const paidSoFar = payments.reduce((s, pay) => s + pay.amount, 0);
        const dpAmount = Math.max(0, paidSoFar);

        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/client-invoice-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('clientName', p.clientName);
        appendInput('clientSubName', 'Attn: Finance & Procurement');
        appendInput('invoiceNumber', p.invoiceNumber);
        appendInput('invoiceDate', new Date().toLocaleDateString('id-ID'));
        appendInput('isPPN', isPPN ? 'true' : 'false');
        appendInput('dpAmount', String(dpAmount));
        appendInput('contractTotalDpp', String(p.contractValue));
        appendInput('contractTotalInvoice', String(total));
        appendInput('termLabel', p.paymentTerms?.notes || '');
        appendInput('stream', 'true');

        p.locations.forEach((loc, i) => {
            appendInput(`locations[${i}][type]`, loc.type);
            appendInput(`locations[${i}][size]`, loc.size);
            appendInput(`locations[${i}][description]`, loc.description);
            appendInput(`locations[${i}][area]`, loc.area);
            appendInput(`locations[${i}][qty]`, String(loc.qty ?? 1));
            appendInput(`locations[${i}][clientPrice]`, String(p.contractValue / p.locations.length));
            appendInput(`locations[${i}][vendorCost]`, String(p.contractValue / p.locations.length));
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AppLayout activePage="sales-transactions" title="Penjualan (Invoices)"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Penjualan (Invoice)' }]}>
            <div className="w-full space-y-6">

                {/* Success Toast */}
                {successMessage && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-900 font-black">✕</button>
                    </div>
                )}

                {/* ── VIEW A: LIST / TAB VIEW ── */}
                {!selectedProjectId ? (
                    <div className="space-y-5">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Penerbitan & Kelola Invoice Client</h2>
                                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                                    Pusat Manajemen Tagihan Penjualan Sewa Media Iklan · {isPPN ? "Mode PPN Aktif" : "Mode Non-PPN"}
                                </p>
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { title: "Invoice Diterbitkan", value: String(totalIssued), badge: "Telah Terbit", badgeClass: "bg-primary/10 text-primary border-primary/20", valueClass: "text-primary", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                                { title: "Menunggu Penerbitan", value: String(totalPending), badge: totalPending > 0 ? "Pending Task" : "Lengkap", badgeClass: totalPending > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200", valueClass: totalPending > 0 ? "text-amber-600 font-black" : "text-slate-700", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                                { title: "Piutang Usaha (A/R)", value: fmt(totalARValue), badge: "Belum Diterima", badgeClass: "bg-rose-50 text-rose-700 border-rose-200", valueClass: "text-rose-600 font-black", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
                                { title: "Total Terealisasi", value: fmt(totalRealized), badge: "Sudah Diterima", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", valueClass: "text-emerald-700", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                            ].map((card, i) => (
                                <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1.5 min-w-0 flex-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.title}</span>
                                            <span className={`text-base font-black font-mono block truncate ${card.valueClass}`}>{card.value}</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${card.badgeClass}`}>{card.badge}</span>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{card.icon}</svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tab Filter + Search */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                                <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex-wrap">
                                    {[
                                        { key: "all" as const, label: "Semua Invoice", badge: String(filteredProjects.length), icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />, isSpecial: false },
                                        { key: "issued" as const, label: "Invoice Resmi Terbit", badge: String(issuedProjects.length), icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />, isSpecial: false },
                                        { key: "ar_schedule" as const, label: "Jadwal Penerimaan Kas", badge: null, icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />, isSpecial: false },
                                    ].map(tab => (
                                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setAllPage(1); setPendingPage(1); setIssuedPage(1); setArPage(1); }}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === tab.key ? "bg-primary text-white shadow-neon-primary" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{tab.icon}</svg>
                                            <span>{tab.label}</span>
                                            {tab.badge !== null && <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>{tab.badge}</span>}
                                        </button>
                                    ))}

                                    {/* Antrean Penerbitan (Special Style like pending queue in PO) */}
                                    <button onClick={() => { setActiveTab("pending"); setAllPage(1); setPendingPage(1); setIssuedPage(1); setArPage(1); }}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "pending" ? "bg-amber-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"}`}>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Antrean Penerbitan</span>
                                        {pendingProjects.length > 0 && (
                                            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${activeTab === "pending" ? "bg-amber-500 text-white animate-pulse" : "bg-amber-500 text-white animate-pulse"}`}>
                                                {pendingProjects.length} Proyek
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                    {/* Filter Sales PIC */}
                                    <div className="relative">
                                        <select value={filterSalesPIC} onChange={e => { setFilterSalesPIC(e.target.value); setAllPage(1); setPendingPage(1); setIssuedPage(1); setArPage(1); }}
                                            className="appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all cursor-pointer shadow-2xs">
                                            <option value="all">Semua Sales PIC</option>
                                            {allSalesPICs.map(pic => <option key={pic} value={pic}>{pic}</option>)}
                                        </select>
                                        <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <svg className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    {/* Search bar */}
                                    <div className="relative w-56">
                                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Cari proyek, client, invoice..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder-slate-400" />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── TAB 1: SEMUA INVOICE ── */}
                        {activeTab === "all" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        Semua Invoice Proyek
                                    </h3>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl">{filteredProjects.length} Proyek</span>
                                </div>
                                <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    {filteredProjects.slice((allPage - 1) * ITEMS_PER_PAGE, allPage * ITEMS_PER_PAGE).map(p => {
                                        const invStatus = getProjectInvoiceStatus(p);
                                        const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
                                        const paid = (paymentsByInvoice[p.invoiceNumber] || []).reduce((s, pay) => s + pay.amount, 0);
                                        const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                        return (
                                            <div key={p.id} onClick={() => setSelectedProjectId(p.id)}
                                                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-pointer flex-wrap">
                                                <div className="space-y-1.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-mono font-bold">{p.code}</span>
                                                        <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                                                        <ProjectStatusBadge status={p.status} />
                                                        <InvoiceStatusBadge status={invStatus} />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all ${invStatus === 'paid' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 font-medium">{pct}% terbayar</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                                                        <span>Client: <strong className="text-slate-600">{p.clientName}</strong></span>
                                                        <span>·</span>
                                                        <span>Sales: <strong className="text-slate-600">{p.salesPIC}</strong></span>
                                                        <span>·</span>
                                                        <span>Periode: <strong className="text-slate-600">{p.period}</strong></span>
                                                        {p.invoiceIssued && <><span>·</span><span className="font-mono font-bold text-primary">{p.invoiceNumber}</span></>}
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="text-xs font-bold font-mono text-slate-900">{fmt(total)}</div>
                                                    <div className="text-[9.5px] text-slate-500 font-medium">
                                                        Terbayar: <strong className="text-emerald-700 font-mono">{fmt(paid)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredProjects.length === 0 && (
                                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                                            Tidak ada proyek yang sesuai dengan pencarian.
                                        </div>
                                    )}
                                </div>
                                <Pagination currentPage={allPage} totalPages={Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)}
                                    totalItems={filteredProjects.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setAllPage} />
                            </div>
                        )}

                        {/* ── TAB 2: ANTREAN PENERBITAN ── */}
                        {activeTab === "pending" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            Antrean Penerbitan Invoice (Pending Task)
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Proyek yang belum memiliki invoice resmi</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">{pendingProjects.length} Proyek</span>
                                </div>
                                {pendingProjects.length === 0 ? (
                                    <div className="border border-dashed border-emerald-200 rounded-2xl p-8 text-center bg-emerald-50/40">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-700">Semua proyek sudah memiliki invoice!</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                        {pendingProjects.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE)
                                            .sort((a, b) => b.contractValue - a.contractValue)
                                            .map(p => {
                                                const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
                                                const isDraft = p.status === "Draft";
                                                return (
                                                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/40 transition-colors">
                                                        <div className="space-y-1.5 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-mono font-bold">{p.code}</span>
                                                                <span className="text-xs font-bold text-slate-900 truncate">{p.name}</span>
                                                                <ProjectStatusBadge status={p.status} />
                                                                {isDraft && (
                                                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                                                                        ⚠ Proyek Belum Aktif
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                                                                <span>Client: <strong className="text-slate-600">{p.clientName}</strong></span>
                                                                <span>·</span>
                                                                <span>Sales: <strong className="text-slate-600">{p.salesPIC}</strong></span>
                                                                <span>·</span>
                                                                <span>Periode: <strong className="text-slate-600">{p.period}</strong></span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                DPP: <strong className="text-slate-700 font-mono">{fmt(p.contractValue)}</strong>
                                                                {isPPN && <span> · PPN 11%: <strong className="text-slate-700 font-mono">{fmt(p.contractValue * PPN_RATE)}</strong></span>}
                                                                {' · '}Total: <strong className="text-slate-900 font-mono font-black">{fmt(total)}</strong>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => { setSelectedProjectId(p.id); setShowInvoiceForm(true); }}
                                                            disabled={isDraft}
                                                            title={isDraft ? "Tidak dapat terbitkan invoice untuk proyek Draft" : "Terbitkan Invoice"}
                                                            className={`px-3.5 py-1.5 text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 ${isDraft ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            <span>Terbitkan Invoice</span>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                                <Pagination currentPage={pendingPage} totalPages={Math.ceil(pendingProjects.length / ITEMS_PER_PAGE)}
                                    totalItems={pendingProjects.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPendingPage} />
                            </div>
                        )}

                        {/* ── TAB 3: INVOICE RESMI TERBIT ── */}
                        {activeTab === "issued" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            Invoice Resmi Terbit
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Dokumen invoice resmi beserta status & riwayat penerimaan</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl">{issuedProjects.length} Dokumen Invoice</span>
                                </div>
                                <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    {issuedProjects.slice((issuedPage - 1) * ITEMS_PER_PAGE, issuedPage * ITEMS_PER_PAGE).map(p => {
                                        const invStatus = getProjectInvoiceStatus(p);
                                        const total = p.contractValue * (isPPN ? (1 + PPN_RATE) : 1);
                                        const paid = (paymentsByInvoice[p.invoiceNumber] || []).reduce((s, pay) => s + pay.amount, 0);
                                        const remaining = Math.max(0, total - paid);
                                        const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                        const isExpanded = expandedInvoicePayment === p.invoiceNumber;
                                        const kwitansi = kwitansiByInvoice[p.invoiceNumber];
                                        return (
                                            <div key={p.id} className="divide-y divide-slate-100 bg-white hover:bg-slate-50/40 transition-colors">
                                                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                                                    <div className="space-y-1.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold font-mono">{p.invoiceNumber}</span>
                                                            <span className="text-xs font-bold text-slate-900">{p.clientName}</span>
                                                            <InvoiceStatusBadge status={invStatus} />
                                                            {kwitansi && invStatus === "paid" && (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                                                                    ✓ Kwitansi Terbit
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                                <div className={`h-full transition-all duration-500 ${invStatus === 'paid' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                                                            <span>Terbit: <strong className="text-slate-700">{formatDate(p.invoiceIssuedAt)}</strong></span>
                                                            <span>·</span>
                                                            <span>Proyek: <strong className="text-slate-700 font-mono">{p.code}</strong> {p.name}</span>
                                                            <span>·</span>
                                                            <span>Skema: <strong className="text-slate-700">{p.paymentTerms?.notes || p.paymentTerms?.type || "-"}</strong></span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold font-mono text-slate-900">{fmt(total)}</div>
                                                            <div className="text-[9.5px] text-slate-500 font-medium">
                                                                Terbayar: <strong className="text-emerald-700 font-mono">{fmt(paid)}</strong> · Sisa: <strong className="text-rose-600 font-mono">{fmt(remaining)}</strong>
                                                            </div>
                                                        </div>
                                                        {remaining > 0 && (
                                                            <button type="button" onClick={() => { setSelectedInvoiceForPayment(p); setShowRecordPaymentModal(true); }}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                                <span>Catat Terima Bayar</span>
                                                            </button>
                                                        )}
                                                        <button type="button" onClick={() => setExpandedInvoicePayment(isExpanded ? null : p.invoiceNumber)}
                                                            className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1 ${isExpanded ? "bg-slate-200 text-slate-800 border-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"}`}>
                                                            <span>Riwayat ({(paymentsByInvoice[p.invoiceNumber] || []).length})</span>
                                                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                        </button>
                                                        <button type="button" onClick={() => handleDownloadInvoicePdf(p)}
                                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            <span>PDF</span>
                                                        </button>
                                                        {kwitansi && (
                                                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-200 flex items-center gap-1" title={`Kwitansi: ${kwitansi.receiptNumber}`}>
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                                                Kwitansi
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                                            <span>Riwayat Penerimaan Kas ({p.invoiceNumber})</span>
                                                        </div>
                                                        {(paymentsByInvoice[p.invoiceNumber] || []).length > 0 ? (
                                                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider font-semibold border-b border-slate-200">
                                                                            <th className="py-2 px-3">Tanggal</th>
                                                                            <th className="py-2 px-3">Label / Termin</th>
                                                                            <th className="py-2 px-3">Metode</th>
                                                                            <th className="py-2 px-3">No. Referensi</th>
                                                                            <th className="py-2 px-3 text-right">Nominal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {(paymentsByInvoice[p.invoiceNumber] || []).map(pmt => (
                                                                            <tr key={pmt.id} className="hover:bg-slate-50/70">
                                                                                <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{formatDate(pmt.date)}</td>
                                                                                <td className="py-2 px-3 font-semibold text-slate-900">{pmt.termLabel}</td>
                                                                                <td className="py-2 px-3 text-slate-600">{pmt.method}</td>
                                                                                <td className="py-2 px-3 font-mono text-slate-600">{pmt.referenceNo}</td>
                                                                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{fmt(pmt.amount)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 italic">
                                                                Belum ada catatan penerimaan pembayaran untuk invoice ini.
                                                            </div>
                                                        )}
                                                        {kwitansi && (
                                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                                                                <div className="space-y-0.5">
                                                                    <div className="font-bold text-emerald-800">Kwitansi Diterbitkan: <span className="font-mono">{kwitansi.receiptNumber}</span></div>
                                                                    <div className="text-emerald-700 font-medium">Diterima dari {kwitansi.receivedFrom} · {formatDate(kwitansi.paidAt)}</div>
                                                                </div>
                                                                <span className="font-mono font-black text-emerald-800">{fmt(kwitansi.amount)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {issuedProjects.length === 0 && (
                                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                                            Belum ada invoice yang diterbitkan.
                                        </div>
                                    )}
                                </div>
                                <Pagination currentPage={issuedPage} totalPages={Math.ceil(issuedProjects.length / ITEMS_PER_PAGE)}
                                    totalItems={issuedProjects.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setIssuedPage} />
                            </div>
                        )}

                        {/* ── TAB 4: JADWAL PENERIMAAN KAS (AR SCHEDULE) ── */}
                        {activeTab === "ar_schedule" && (
                            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                            Jadwal Penerimaan Kas (Accounts Receivable Schedule)
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Monitoring jatuh tempo penerimaan pembayaran dari client · Diurutkan dari jatuh tempo terdekat</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl">{arScheduleItems.length} Tagihan Terjadwal</span>
                                </div>
                                <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
                                    {arScheduleItems.slice((arPage - 1) * ITEMS_PER_PAGE, arPage * ITEMS_PER_PAGE).map((item, idx) => {
                                        const dueDateStatus = getDueDateStatus(item.dueDate);
                                        return (
                                            <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors flex-wrap">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dueDateStatus.dot}`} />
                                                    <div className="space-y-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px]">{item.project.invoiceNumber}</span>
                                                            <span className="font-bold text-slate-900 text-xs">{item.project.clientName}</span>
                                                            <InvoiceStatusBadge status={item.invStatus} />
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium flex-wrap">
                                                            <span>Termin: <strong className="text-slate-700">{item.label}</strong></span>
                                                            <span>·</span>
                                                            <span>Proyek: <strong className="text-slate-700 font-mono">{item.project.code}</strong></span>
                                                            <span>·</span>
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                <span>Jatuh Tempo: <strong className="text-slate-700">{item.dueDate ? formatDate(item.dueDate) : "Sesuai Kesepakatan"}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] border ${dueDateStatus.style}`}>{dueDateStatus.label}</span>
                                                    <span className="font-mono font-black text-slate-900 text-xs">{fmt(item.amount)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {arScheduleItems.length === 0 && (
                                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                                            Belum ada jadwal penerimaan kas. Terbitkan invoice terlebih dahulu.
                                        </div>
                                    )}
                                </div>
                                <Pagination currentPage={arPage} totalPages={Math.ceil(arScheduleItems.length / ITEMS_PER_PAGE)}
                                    totalItems={arScheduleItems.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setArPage} />
                            </div>
                        )}
                    </div>

                ) : (
                    // ── VIEW B: Detail Per Proyek ──────────────────────────────────────────
                    <div className="space-y-6">
                        {/* Back button + Header */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => { setSelectedProjectId(null); setShowInvoiceForm(false); }}
                                className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Kelola Invoice: {activeProject?.name}</h2>
                                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                                    {activeProject?.clientName} · {activeProject?.code}
                                </p>
                            </div>
                        </div>

                        {/* Invoice Status Timeline */}
                        {activeProject && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Status Lifecycle Invoice</div>
                                <div className="flex items-center gap-0">
                                    {[
                                        { key: "draft", label: "Draft", desc: "Belum Terbit", active: true },
                                        { key: "issued", label: "Issued", desc: "Diterbitkan", active: activeProject.invoiceIssued },
                                        { key: "paid", label: "Paid / Lunas", desc: "Telah Dilunasi", active: activeInvoiceStatus === "paid" || activeInvoiceStatus === "partial" },
                                    ].map((step, i, arr) => {
                                        const isCurrent = (step.key === activeInvoiceStatus) || (step.key === "draft" && !activeProject.invoiceIssued);
                                        return (
                                            <React.Fragment key={step.key}>
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${step.active ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"} ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                                                        {step.active ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <span>{i + 1}</span>}
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`text-[10px] font-black ${step.active ? "text-primary" : "text-slate-400"}`}>{step.label}</div>
                                                        <div className="text-[9px] text-slate-400 font-medium">{step.desc}</div>
                                                    </div>
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mb-5 mx-1 ${arr[i + 1].active ? "bg-primary" : "bg-slate-200"}`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Project Info */}
                        {activeProject && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded tracking-widest uppercase">{activeProject.code}</span>
                                        <ProjectStatusBadge status={activeProject.status} />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">{activeProject.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{activeProject.clientName} · Sales: {activeProject.salesPIC}</p>
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Nilai Kontrak (DPP)</div>
                                    <div className="text-base font-black font-mono text-slate-900">{fmt(activeProject.contractValue)}</div>
                                    {isPPN && <div className="text-[10px] text-slate-500 mt-0.5">+PPN: {fmt(activeProject.contractValue * PPN_RATE)}</div>}
                                </div>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Tagihan</div>
                                    <div className="text-base font-black font-mono text-primary">{fmt(activeTotalAmount)}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{isPPN ? "incl. PPN 11%" : "Non-PPN"}</div>
                                </div>
                            </div>
                        )}

                        {/* Invoice Action Card */}
                        {activeProject && (
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                                {!activeProject.invoiceIssued ? (
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800">Penerbitan Invoice Belum Dilakukan</h4>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                {activeProject.status === "Draft" ? "⚠ Proyek masih berstatus Draft. Aktifkan proyek dahulu sebelum menerbitkan invoice." : "Terbitkan invoice resmi untuk mulai menagih client."}
                                            </p>
                                        </div>
                                        <button onClick={() => setShowInvoiceForm(true)}
                                            disabled={activeProject.status === "Draft"}
                                            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 ${activeProject.status === "Draft" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-primary hover:bg-primary-700 text-white cursor-pointer shadow-neon-primary"}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Terbitkan Invoice Sekarang
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Invoice Summary */}
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold font-mono">{activeProject.invoiceNumber}</span>
                                                    <InvoiceStatusBadge status={activeInvoiceStatus} />
                                                    {activeKwitansi && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">✓ Kwitansi: {activeKwitansi.receiptNumber}</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-medium">Skema: {activeProject.paymentTerms?.notes || "-"}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeRemaining > 0 && (
                                                    <button onClick={() => { setSelectedInvoiceForPayment(activeProject); setShowRecordPaymentModal(true); }}
                                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                        <span>Catat Terima Bayar</span>
                                                    </button>
                                                )}
                                                <button onClick={() => handleDownloadInvoicePdf(activeProject)}
                                                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <span>Download Invoice PDF</span>
                                                </button>
                                                {activePayments.length === 0 && (
                                                    <button onClick={handleCancelInvoice}
                                                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                                                        Batalkan Invoice
                                                    </button>
                                                )}
                                            </div>

                                        </div>

                                        {/* Payment Summary Bar */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                                                <span>Realisasi Penerimaan</span>
                                                <span>{activeTotalPaid > 0 ? Math.round((activeTotalPaid / activeTotalAmount) * 100) : 0}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-500 rounded-full ${activeInvoiceStatus === "paid" ? "bg-emerald-500" : "bg-primary"}`}
                                                    style={{ width: `${activeTotalAmount > 0 ? Math.min(100, Math.round((activeTotalPaid / activeTotalAmount) * 100)) : 0}%` }} />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-slate-500">
                                                <span>Terbayar: <strong className="text-emerald-700">{fmt(activeTotalPaid)}</strong></span>
                                                <span>Sisa Piutang: <strong className="text-rose-600">{fmt(activeRemaining)}</strong></span>
                                            </div>
                                        </div>

                                        {/* Payment History Table */}
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <div className="bg-slate-100 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                Riwayat Penerimaan Kas
                                            </div>
                                            {activePayments.length > 0 ? (
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 text-slate-600 text-[10px] uppercase tracking-wider font-semibold">
                                                            <th className="py-2 px-4">Tanggal</th>
                                                            <th className="py-2 px-4">Label / Termin</th>
                                                            <th className="py-2 px-4">Metode</th>
                                                            <th className="py-2 px-4">No. Referensi</th>
                                                            <th className="py-2 px-4 text-right">Nominal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {activePayments.map(pmt => (
                                                            <tr key={pmt.id} className="hover:bg-slate-50/70">
                                                                <td className="py-2 px-4 font-mono text-slate-700">{formatDate(pmt.date)}</td>
                                                                <td className="py-2 px-4 font-semibold text-slate-900">{pmt.termLabel}</td>
                                                                <td className="py-2 px-4 text-slate-600">{pmt.method}</td>
                                                                <td className="py-2 px-4 font-mono text-slate-600">{pmt.referenceNo}</td>
                                                                <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">{fmt(pmt.amount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="p-6 text-center text-xs text-slate-500 italic">Belum ada catatan penerimaan pembayaran.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Issue Invoice Modal */}
            {activeProject && (
                <ConfigurePaymentSchemeModal
                    isOpen={showInvoiceForm}
                    onClose={() => setShowInvoiceForm(false)}
                    clientName={activeProject.clientName}
                    totalAmount={activeTotalAmount}
                    isPPN={isPPN}
                    onSubmit={(data) => {
                        // Map the structured modal data back to InvoicePaymentTerm
                        const terms: InvoicePaymentTerm = {
                            type: data.scheme,
                            notes: data.notes,
                        };
                        if (data.scheme === "full") {
                            terms.fullDueDays = 30;
                            terms.fullDueDate = data.termDates[0];
                        } else if (data.scheme === "dp") {
                            terms.dpPercent = data.termPercents[0];
                            terms.dpAmount = Math.round(activeTotalAmount * (data.termPercents[0] / 100));
                            terms.dpDueDate = data.termDates[0];
                            terms.pelunasanDueDate = data.termDates[1];
                        } else if (data.scheme === "termin") {
                            terms.installments = data.termPercents.map((pct, idx) => ({
                                percent: pct,
                                amount: Math.round(activeTotalAmount * (pct / 100)),
                                note: `Termin ${idx + 1}`,
                                dueDate: data.termDates[idx]
                            }));
                        } else if (data.scheme === "installment") {
                            terms.fullDueDays = 30;
                            terms.fullDueDate = data.termDates[0];
                        }
                        handleConfirmIssueInvoice(terms);
                    }}
                />
            )}

            {/* Record Invoice Payment Modal */}
            <RecordInvoicePaymentModal
                isOpen={showRecordPaymentModal}
                invoice={selectedInvoiceForPayment ? {
                    id: selectedInvoiceForPayment.id,
                    invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
                    clientName: selectedInvoiceForPayment.clientName,
                    projectName: selectedInvoiceForPayment.name,
                    totalAmount: selectedInvoiceForPayment.contractValue * (isPPN ? (1 + PPN_RATE) : 1),
                    paymentTerms: selectedInvoiceForPayment.paymentTerms,
                } : null}
                remainingAmount={selectedInvoiceForPayment
                    ? Math.max(0, selectedInvoiceForPayment.contractValue * (isPPN ? (1 + PPN_RATE) : 1) - (paymentsByInvoice[selectedInvoiceForPayment.invoiceNumber] || []).reduce((s, p) => s + p.amount, 0))
                    : 0}
                onClose={() => { setShowRecordPaymentModal(false); setSelectedInvoiceForPayment(null); }}
                onSubmit={handleSaveInvoicePayment}
            />
        </AppLayout>
    );
}
