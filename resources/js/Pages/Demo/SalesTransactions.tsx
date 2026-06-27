import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
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
    contractValue: number; // DPP
    status: "Draft" | "Active" | "Completed" | "Cancelled";
    locations: BillboardLocation[];
    invoiceIssued: boolean;
    invoiceNumber: string;
    targetQty: number;
    paymentTerms?: VendorPaymentTerm;
}

type FiscalMode = "ppn" | "non-ppn";

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

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────
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
        paymentTerms: {
            type: "full",
            fullDueDays: 30,
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
        Draft:     { bg: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400", text: "Draft" },
        Active:    { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500", text: "Active" },
        Completed: { bg: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500", text: "Selesai" },
        Cancelled: { bg: "bg-red-50 text-red-700 border-red-100", dot: "bg-red-500", text: "Dibatalkan" },
    };
    const s = map[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.text}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Modal Syarat Pembayaran (Client Invoice)
// ─────────────────────────────────────────────────────────────────────────────
interface InvoicePaymentTermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    totalAmount: number;
    onSubmit: (terms: VendorPaymentTerm) => void;
    title?: string;
    amountLabel?: string;
}

function InvoicePaymentTermsModal({
    isOpen,
    onClose,
    clientName,
    totalAmount,
    onSubmit,
    title = "Konfigurasi Syarat Pembayaran Invoice",
    amountLabel = "Total Nilai Tagihan Client"
}: InvoicePaymentTermsModalProps) {
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
            const dueStr = fullDueDate ? ` pada tanggal ${formatDate(fullDueDate)}` : ` dalam ${fullDueDays} hari setelah invoice diterima`;
            terms.notes = notes || `Pembayaran 100%${dueStr}`;
        } else if (paymentType === "dp") {
            const dpVal = Math.round(totalAmount * (dpPercent / 100));
            terms.dpPercent = dpPercent;
            terms.dpAmount = dpVal;
            terms.dpDueDays = dpDueDays;
            terms.dpDueDate = dpDueDate || undefined;
            terms.pelunasanDueDays = pelunasanDueDays;
            terms.pelunasanDueDate = pelunasanDueDate || undefined;
            
            const dpDueStr = dpDueDate ? `s.d. ${formatDate(dpDueDate)}` : `${dpDueDays} hari setelah invoice`;
            const pelunasanDueStr = pelunasanDueDate ? `s.d. ${formatDate(pelunasanDueDate)}` : `${pelunasanDueDays} hari setelah serah terima pekerjaan`;
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
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{clientName}</p>
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
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Hari setelah invoice diterbitkan</span>
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
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Hari setelah serah terima pekerjaan</span>
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

                            <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Catatan Pembayaran Tambahan (Opsional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Contoh: DP 30% di muka, Pelunasan setelah penandatanganan Berita Acara..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    {paymentType === "termin" && (
                        <div className="space-y-3 animate-fade-in bg-violet-50/20 border border-violet-100/40 p-4 rounded-2xl">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Jumlah Termin</label>
                                <select
                                    value={terminCount}
                                    onChange={e => handleTerminCountChange(parseInt(e.target.value) || 2)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                    {[2, 3, 4].map(c => (
                                        <option key={c} value={c}>{c} Termin</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3.5 pt-2 border-t border-slate-100/50">
                                {terminDetails.map((detail, idx) => (
                                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs space-y-2.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-700">Milestone Termin {idx + 1}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-500">Nilai: {fmt(Math.round(totalAmount * (detail.percent / 100)))}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Persentase (%)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={detail.percent}
                                                    onChange={e => handleDetailPercentChange(idx, Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Batas Hari</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={detail.dueDays || 0}
                                                    onChange={e => handleDetailDueDaysChange(idx, Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tanggal Spesifik (Opsional)</label>
                                                <input
                                                    type="date"
                                                    value={detail.dueDate || ""}
                                                    onChange={e => handleDetailDueDateChange(idx, e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Deskripsi / Syarat</label>
                                                <input
                                                    type="text"
                                                    value={detail.note}
                                                    onChange={e => handleDetailNoteChange(idx, e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                                                    placeholder="Deskripsi pencapaian..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Catatan Pembayaran Tambahan (Opsional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Contoh: Termin ditagihkan sesuai progress lapangan..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                            Terbitkan Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function SalesTransactions() {
    const fiscalMode = useDemoFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [projectsPPN, setProjectsPPN] = useState<Project[]>(initialProjectsPPN);
    const [projectsNonPPN, setProjectsNonPPN] = useState<Project[]>(initialProjectsNonPPN);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);

    const projects = isPPN ? projectsPPN : projectsNonPPN;

    const handleUpdateProject = (updatedProject: Project) => {
        if (isPPN) {
            setProjectsPPN(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        } else {
            setProjectsNonPPN(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        }
    };

    const activeProject = projects.find(p => p.id === selectedProjectId);

    const filteredProjects = projects.filter(p => 
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats calculations
    const totalProjectsCount = projects.length;
    const issuedCount = projects.filter(p => p.invoiceIssued).length;
    const pendingCount = projects.filter(p => !p.invoiceIssued).length;
    const totalRevenueSum = projects.reduce((s, p) => {
        const dpp = p.contractValue;
        const ppn = isPPN ? dpp * PPN_RATE : 0;
        return s + (dpp + ppn);
    }, 0);

    const handleConfirmIssueInvoice = (terms: VendorPaymentTerm) => {
        if (!activeProject) return;
        const nextInvNum = `INV-2026-${isPPN ? "PPN" : "NON"}-${String(Math.floor(Math.random() * 900) + 100)}`;
        const updated: Project = {
            ...activeProject,
            invoiceIssued: true,
            invoiceNumber: nextInvNum,
            paymentTerms: terms
        };
        handleUpdateProject(updated);
        setShowInvoiceForm(false);
    };

    const handleCancelInvoice = () => {
        if (!activeProject) return;
        if (confirm("Apakah Anda yakin ingin membatalkan penerbitan invoice ini? Status transaksi akan dikembalikan ke Draft.")) {
            const updated: Project = {
                ...activeProject,
                invoiceIssued: false,
                invoiceNumber: "",
                paymentTerms: undefined
            };
            handleUpdateProject(updated);
        }
    };

    return (
        <DemoLayout
            activePage="sales-transactions"
            title="Penjualan (Invoices)"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Penjualan (Invoice)' }]}
        >
            <div className="space-y-6">
                
                {/* VIEW A: LIST VIEW OF PROJECTS FOR INVOICING */}
                {!selectedProjectId ? (
                    <div className="space-y-6">
                        {/* Header Area */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 tracking-tight">Daftar Penerbitan Invoice Client</h2>
                                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                                    Kelola seluruh tagihan penjualan sewa media iklan luar ruang ke client &middot; {isPPN ? "Mode PPN Aktif" : "Mode Non-PPN Aktif"}
                                </p>
                            </div>
                            
                            {/* Search bar input */}
                            <div className="relative w-full md:w-72">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kode proyek, nama atau client..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Top Widgets Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Proyek</span>
                                    <span className="text-lg font-black font-mono text-slate-800 block">{totalProjectsCount}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold block">Tercatat di sistem</span>
                                </div>
                                <span className="text-2xl p-2 bg-slate-50 rounded-xl">📋</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Terbit</span>
                                    <span className="text-lg font-black font-mono text-emerald-600 block">{issuedCount}</span>
                                    <span className="text-[9px] text-emerald-600/80 font-bold block">{((issuedCount / (totalProjectsCount || 1)) * 100).toFixed(0)}% selesai ditagih</span>
                                </div>
                                <span className="text-2xl p-2 bg-emerald-50 rounded-xl">💰</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Menunggu Terbit</span>
                                    <span className="text-lg font-black font-mono text-amber-500 block">{pendingCount}</span>
                                    <span className="text-[9px] text-amber-500/80 font-bold block">{pendingCount} proyek belum ditagih</span>
                                </div>
                                <span className="text-2xl p-2 bg-amber-50 rounded-xl">⏳</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Nilai Kontrak</span>
                                    <span className="text-lg font-black font-mono text-blue-600 block">{fmt(totalRevenueSum)}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold block">{isPPN ? "Termasuk PPN 11%" : "Tanpa PPN"}</span>
                                </div>
                                <span className="text-2xl p-2 bg-blue-50 rounded-xl">📈</span>
                            </div>
                        </div>

                        {/* Project Invoicing Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(proj => {
                                const dpp = proj.contractValue;
                                const ppn = isPPN ? dpp * PPN_RATE : 0;
                                const totalVal = dpp + ppn;

                                return (
                                    <div
                                        key={proj.id}
                                        onClick={() => setSelectedProjectId(proj.id)}
                                        className="bg-white border border-slate-100 rounded-3xl p-5 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded tracking-widest">{proj.code}</span>
                                                {proj.invoiceIssued ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Invoice Terbit
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                        Belum Terbit
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{proj.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold">{proj.clientName} &middot; PIC: {proj.salesPIC}</p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nilai Tagihan</span>
                                                <span className="font-mono text-xs font-black text-slate-800">{fmt(totalVal)}</span>
                                            </div>
                                            <button
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-2xs transition-all ${
                                                    proj.invoiceIssued
                                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                            >
                                                {proj.invoiceIssued ? "Lihat Invoice" : "Proses Penerbitan"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredProjects.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-xs text-slate-400 font-semibold">Tidak ditemukan proyek yang cocok dengan filter pencarian.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : !activeProject ? (
                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400 font-semibold">Proyek tidak ditemukan.</p>
                        <button 
                            onClick={() => setSelectedProjectId(null)} 
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
                        >
                            Kembali ke Daftar Proyek
                        </button>
                    </div>
                ) : (
                    // VIEW B: INVOICE MANAGEMENT AND DETAILED DIGITAL INVOICE PREVIEW
                    <div className="space-y-6">
                        {/* Top back button toolbar */}
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                            <button
                                onClick={() => setSelectedProjectId(null)}
                                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Kembali ke Daftar Proyek
                            </button>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded tracking-widest uppercase">{activeProject.code}</span>
                                <span className="text-xs font-bold text-slate-500 ml-2">{activeProject.period}</span>
                            </div>
                        </div>

                        {/* Two Columns Grid for document preview and controls */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* Detailed Digital Invoice preview */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 font-sans text-slate-800 relative overflow-hidden">
                                    {/* Status Watermark */}
                                    <div className="absolute top-8 right-8 border-4 border-emerald-500/20 text-emerald-500/20 font-black text-xl px-4 py-2 rounded-xl rotate-12 tracking-widest uppercase pointer-events-none select-none">
                                        {activeProject.invoiceIssued ? "ISSUED" : "DRAFT"}
                                    </div>

                                    {/* Invoice Corporate Header */}
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
                                                <span className="text-slate-400 font-semibold">Nomor Invoice:</span>
                                                <span className="font-mono font-bold text-slate-800">{activeProject.invoiceIssued ? activeProject.invoiceNumber : "Belum Diterbitkan"}</span>
                                                <span className="text-slate-400 font-semibold">Tanggal Terbit:</span>
                                                <span className="font-bold text-slate-800">{activeProject.invoiceIssued ? "26 Juni 2026" : "-"}</span>
                                                <span className="text-slate-400 font-semibold">Jatuh Tempo:</span>
                                                <span className="font-bold text-slate-800">{activeProject.invoiceIssued ? "26 Juli 2026" : "-"}</span>
                                                <span className="text-slate-400 font-semibold">Metode:</span>
                                                <span className="font-bold text-slate-800">Transfer Bank</span>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Client & Project Details */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">DITAGIHKAN KEPADA:</div>
                                            <div className="font-bold text-slate-900 text-sm">{activeProject.clientName}</div>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                                NPWP: 01.234.567.8-901.000<br />
                                                Gedung Capital Place, Lantai 15<br />
                                                Jl. Jend. Gatot Subroto Kav. 18, Jakarta Selatan
                                            </p>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PROYEK / KAMPANYE:</div>
                                            <div className="font-bold text-slate-900 text-sm">{activeProject.name}</div>
                                            <div className="grid grid-cols-2 gap-x-2 mt-2 text-[11px] text-slate-500">
                                                <span className="font-semibold">PIC Sales:</span>
                                                <span>{activeProject.salesPIC}</span>
                                                <span className="font-semibold">Periode Sewa:</span>
                                                <span>{activeProject.period}</span>
                                                <span className="font-semibold">Titik Lokasi:</span>
                                                <span>{activeProject.locations.length} titik</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Locations/Billboard Items Table */}
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
                                                {activeProject.locations.map((loc, idx) => {
                                                    const unitCost = loc.vendorCost;
                                                    const qty = loc.qty || 1;
                                                    const rowTotal = unitCost * qty;
                                                    return (
                                                        <tr key={loc.id}>
                                                            <td className="px-4 py-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                            <td className="px-4 py-3.5">
                                                                <div className="font-bold text-slate-800">{loc.description}</div>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">{loc.code} &middot; {loc.size}</div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-slate-900 font-semibold">{qty} Unit</td>
                                                            <td className="px-4 py-3.5 text-right font-mono text-slate-600">{fmt(unitCost)}</td>
                                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{fmt(rowTotal)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Bottom Info Section: Terms & Payment Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                        
                                        {/* Dynamic payment schedule terms */}
                                        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKEMA PEMBAYARAN CLIENT:</div>
                                            
                                            {!activeProject.invoiceIssued ? (
                                                <div className="text-xs text-slate-400 py-2 leading-relaxed">
                                                    Syarat pembayaran belum ditentukan. Silakan klik tombol <strong>'Terbitkan Invoice'</strong> di panel samping untuk menetapkan skema pembayaran.
                                                </div>
                                            ) : (
                                                <>
                                                    {activeProject.paymentTerms?.type === "full" && (
                                                        <div className="text-xs space-y-1 text-slate-700">
                                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Full Payment (100% setelah penagihan)
                                                            </div>
                                                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                <div>
                                                                    <span className="text-slate-400">Jatuh Tempo:</span>
                                                                    <span className="font-bold text-slate-800 ml-1">
                                                                        {activeProject.paymentTerms.fullDueDate 
                                                                            ? formatDate(activeProject.paymentTerms.fullDueDate) 
                                                                            : `${activeProject.paymentTerms.fullDueDays || 30} hari setelah invoice diterima`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{activeProject.paymentTerms.notes}"</p>
                                                        </div>
                                                    )}

                                                    {activeProject.paymentTerms?.type === "dp" && (
                                                        <div className="text-xs space-y-2 text-slate-700">
                                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                DP & Pelunasan
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-400">Uang Muka ({activeProject.paymentTerms.dpPercent}%):</span>
                                                                        <span className="font-bold text-slate-800 font-mono">{fmt(activeProject.paymentTerms.dpAmount || 0)}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500">
                                                                        Jatuh Tempo DP: <span className="font-semibold text-slate-700">
                                                                            {activeProject.paymentTerms.dpDueDate 
                                                                                ? formatDate(activeProject.paymentTerms.dpDueDate) 
                                                                                : `${activeProject.paymentTerms.dpDueDays || 7} hari setelah invoice`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-400">Sisa Pelunasan:</span>
                                                                        <span className="font-bold text-slate-800 font-mono">
                                                                            {fmt((activeProject.contractValue + (isPPN ? activeProject.contractValue * PPN_RATE : 0)) - (activeProject.paymentTerms.dpAmount || 0))}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500">
                                                                        Jatuh Tempo Pelunasan: <span className="font-semibold text-slate-700">
                                                                            {activeProject.paymentTerms.pelunasanDueDate 
                                                                                ? formatDate(activeProject.paymentTerms.pelunasanDueDate) 
                                                                                : `${activeProject.paymentTerms.pelunasanDueDays || 30} hari setelah serah terima`}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 italic font-semibold mt-1">"{activeProject.paymentTerms.notes}"</p>
                                                        </div>
                                                    )}

                                                    {activeProject.paymentTerms?.type === "termin" && activeProject.paymentTerms.installments && (
                                                        <div className="text-xs space-y-2 text-slate-700">
                                                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Pembayaran Bertahap (Termin)
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {activeProject.paymentTerms.installments.map((inst, idx) => (
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
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-between">
                                            <div className="space-y-2 text-xs font-semibold text-slate-700">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Subtotal DPP</span>
                                                    <span className="font-mono text-slate-900 font-bold">{fmt(activeProject.contractValue)}</span>
                                                </div>
                                                {isPPN && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">PPN (11%)</span>
                                                        <span className="font-mono text-violet-600 font-bold">{fmt(activeProject.contractValue * PPN_RATE)}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                                                    <span className="font-black text-slate-900">Total Tagihan</span>
                                                    <span className="font-mono font-black text-emerald-600">{fmt(activeProject.contractValue + (isPPN ? activeProject.contractValue * PPN_RATE : 0))}</span>
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

                                    {/* Stamp & signatures */}
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

                            {/* Sidebar Invoice Action Panel */}
                            <div className="space-y-6">
                                {/* Summary calculations */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                                    <div className="border-b border-slate-100 pb-3">
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan Nilai Tagihan</h3>
                                    </div>

                                    <div className="space-y-3 text-xs font-semibold text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Subtotal DPP</span>
                                            <span className="font-mono font-bold text-slate-800">{fmt(activeProject.contractValue)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PPN (11%)</span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {isPPN ? fmt(activeProject.contractValue * PPN_RATE) : <span className="text-slate-300 font-sans text-[10px] font-bold uppercase">Disabled</span>}
                                            </span>
                                        </div>
                                        <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-bold">
                                            <span className="text-slate-800">Total Nilai Tagihan</span>
                                            <span className="font-mono text-blue-600">{fmt(activeProject.contractValue + (isPPN ? activeProject.contractValue * PPN_RATE : 0))}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        {!activeProject.invoiceIssued ? (
                                            <button
                                                onClick={() => setShowInvoiceForm(true)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Terbitkan Invoice & Faktur
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => window.print()}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                    Cetak Dokumen PDF
                                                </button>
                                                <button
                                                    onClick={handleCancelInvoice}
                                                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 rounded-xl text-xs font-bold border border-rose-200 transition-all text-center"
                                                >
                                                    Batalkan Penerbitan
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Information Card about accounting entries */}
                                <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 text-xs text-blue-800 leading-relaxed space-y-2">
                                    <div className="font-bold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Posting Akuntansi Otomatis
                                    </div>
                                    <p className="text-[11px] font-medium leading-relaxed">
                                        Menerbitkan invoice secara resmi akan mencatat piutang usaha (debet) dan pendapatan reklame (kredit) secara realtime pada modul penjurnalan Yousee Finance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Terms customizer modal */}
            {showInvoiceForm && activeProject && (
                <InvoicePaymentTermsModal
                    isOpen={showInvoiceForm}
                    onClose={() => setShowInvoiceForm(false)}
                    clientName={activeProject.clientName}
                    totalAmount={activeProject.contractValue + (isPPN ? activeProject.contractValue * PPN_RATE : 0)}
                    onSubmit={handleConfirmIssueInvoice}
                />
            )}
        </DemoLayout>
    );
}
