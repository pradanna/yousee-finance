// ─────────────────────────────────────────────────────────────────────────────
// Purchases — Mock Data (will be replaced by API calls)
// ─────────────────────────────────────────────────────────────────────────────
import type { PurchaseProject, VendorPO } from "./purchasesTypes";

export const initialProjectsPPN: PurchaseProject[] = [
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

export const initialProjectsNonPPN: PurchaseProject[] = [
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

export const initialVendorPOs: Record<string, VendorPO> = {
    "PO-2026-0041": { 
        poNumber: "PO-2026-0041", 
        vendorId: 1, 
        vendorName: "PT. Megah Billboard Jaya", 
        paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, 
        issuedAt: "2026-06-20", 
        totalAmount: 22500000,
        payments: [
            {
                id: "PAY-001",
                poNumber: "PO-2026-0041",
                termLabel: "DP 50%",
                amount: 11250000,
                date: "2026-06-22",
                method: "Transfer Bank BCA",
                referenceNo: "BKK-2026-0622",
                notes: "Uang muka pemasangan billboard"
            }
        ]
    },
    "PO-2026-0042": { 
        poNumber: "PO-2026-0042", 
        vendorId: 2, 
        vendorName: "CV. Media Ad Perkasa", 
        paymentTerms: { type: "dp", dpPercent: 50, dpAmount: 11000000, notes: "DP 50% di muka, Pelunasan setelah pemasangan" }, 
        issuedAt: "2026-06-21", 
        totalAmount: 22000000,
        payments: [
            {
                id: "PAY-002",
                poNumber: "PO-2026-0042",
                termLabel: "DP 50%",
                amount: 11000000,
                date: "2026-06-22",
                method: "Transfer Bank Mandiri",
                referenceNo: "BKK-2026-0623",
                notes: "DP 50% Videotron Solo"
            },
            {
                id: "PAY-003",
                poNumber: "PO-2026-0042",
                termLabel: "Pelunasan",
                amount: 11000000,
                date: "2026-07-01",
                method: "Transfer Bank Mandiri",
                referenceNo: "BKK-2026-0701",
                notes: "Pelunasan 100% setelah tayang"
            }
        ]
    },
    "PO-2026-0091": { poNumber: "PO-2026-0091", vendorId: 2, vendorName: "CV. Media Ad Perkasa", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-22", totalAmount: 41000000, payments: [] },
    "PO-2026-0055": { poNumber: "PO-2026-0055", vendorId: 3, vendorName: "PT. Promosi Outdoor Kreasindo", paymentTerms: { type: "dp", dpPercent: 30, dpAmount: 1650000, notes: "DP 30%, Pelunasan 70% setelah pemasangan selesai" }, issuedAt: "2026-06-23", totalAmount: 5500000, payments: [] },
    "PO-2026-0056": { poNumber: "PO-2026-0056", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-24", totalAmount: 4200000, payments: [] },
    "PO-2026-0060": { poNumber: "PO-2026-0060", vendorId: 4, vendorName: "UD. Spanduk & Baliho Makmur", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-06-25", totalAmount: 3500000, payments: [] },
    "PO-2026-0099": { poNumber: "PO-2026-0099", vendorId: 2, vendorName: "CV. Media Ad Perkasa", paymentTerms: { type: "full", notes: "Pembayaran 100% setelah penyerahan dokumen penagihan lengkap" }, issuedAt: "2026-05-15", totalAmount: 4500000, payments: [] },
};
