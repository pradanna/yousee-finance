import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import SelectInput from '@/Components/Form/SelectInput';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface PaymentTerms {
    type: 'full' | 'dp' | 'termin';
    notes?: string;
    dpPercent?: number;
    dpAmount?: number;
    dpDueDate?: string;
    pelunasanDueDate?: string;
    installments?: Array<{
        percent: number;
        amount: number;
        note: string;
        dueDays?: number;
        dueDate?: string;
    }>;
}

interface ReceivableItem {
    id: string;
    client: string;
    project: string;
    date: string;
    due: string;
    total: number;
    paid: number;
    status: 'paid' | 'partial' | 'unpaid';
    terms: PaymentTerms;
    salesPIC?: string;
}

interface PayableItem {
    id: string;
    vendor: string;
    project: string;
    date: string;
    due: string;
    total: number;
    paid: number;
    status: 'paid' | 'partial' | 'unpaid';
    terms: PaymentTerms;
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

interface ResolvedMilestone {
    label: string;
    amount: number;
    dueDate: string;
    cumulativeAmount: number;
}

interface MilestoneStatus {
    nearestMilestone: ResolvedMilestone | null;
    isOverdue: boolean;
    overdueDays: number;
    statusText: string;
}

const getMilestones = (item: ReceivableItem | PayableItem): ResolvedMilestone[] => {
    const list: ResolvedMilestone[] = [];
    const t = item.terms;
    if (t.type === 'full') {
        list.push({
            label: 'Pelunasan 100%',
            amount: item.total,
            dueDate: item.due,
            cumulativeAmount: item.total
        });
    } else if (t.type === 'dp') {
        const dpAmt = t.dpAmount || (item.total * (t.dpPercent || 0) / 100);
        list.push({
            label: `Uang Muka (DP ${t.dpPercent || 0}%)`,
            amount: dpAmt,
            dueDate: t.dpDueDate || item.date,
            cumulativeAmount: dpAmt
        });
        list.push({
            label: 'Pelunasan Akhir',
            amount: item.total - dpAmt,
            dueDate: t.pelunasanDueDate || item.due,
            cumulativeAmount: item.total
        });
    } else if (t.type === 'termin' && t.installments) {
        let cum = 0;
        t.installments.forEach((inst, idx) => {
            cum += inst.amount;
            list.push({
                label: inst.note || `Termin ${idx + 1}`,
                amount: inst.amount,
                dueDate: inst.dueDate || item.due,
                cumulativeAmount: cum
            });
        });
    }
    return list;
};

const getNearestMilestoneInfo = (item: ReceivableItem | PayableItem, currentDateStr: string = new Date().toISOString().split('T')[0]): MilestoneStatus => {
    const milestones = getMilestones(item);
    const unpaidMilestone = milestones.find(m => item.paid < m.cumulativeAmount - 1);
    
    if (!unpaidMilestone) {
        return {
            nearestMilestone: null,
            isOverdue: false,
            overdueDays: 0,
            statusText: 'Lunas'
        };
    }
    
    const currentDate = new Date(currentDateStr);
    currentDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(unpaidMilestone.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = currentDate.getTime() - dueDate.getTime();
    const isOverdue = timeDiff > 0;
    const overdueDays = isOverdue ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : 0;
    
    return {
        nearestMilestone: unpaidMilestone,
        isOverdue,
        overdueDays,
        statusText: unpaidMilestone.label
    };
};

const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DebtReceivable() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    // State for Client Receivables (Piutang)
    const [receivables, setReceivables] = useState<ReceivableItem[]>([
        {
            id: isPPN ? 'INV-PPN-001' : 'INV-NP-001',
            client: 'PT. Gojek Tokopedia',
            project: 'Kampanye Ramadhan Baliho Jawa Tengah',
            date: '2026-06-25',
            due: '2026-07-25',
            total: isPPN ? 11100000 : 10000000,
            paid: isPPN ? 11100000 : 10000000,
            status: 'paid',
            terms: { type: 'full', notes: 'Pembayaran 100% lunas 30 hari setelah invoice diterima.' },
            salesPIC: 'Eko Prasetyo'
        },
        {
            id: isPPN ? 'INV-PPN-002' : 'INV-NP-002',
            client: 'Traveloka Corp',
            project: 'Sewa Videotron Simpang Lima Semarang',
            date: '2026-06-22',
            due: '2026-07-22',
            total: isPPN ? 5550000 : 5000000,
            paid: 2000000,
            status: 'partial',
            terms: {
                type: 'dp',
                dpPercent: 30,
                dpAmount: isPPN ? 1665000 : 1500000,
                dpDueDate: '2026-06-25',
                pelunasanDueDate: '2026-07-22',
                notes: 'Uang muka (DP) 30% dibayar di awal, pelunasan 70% setelah pasang.'
            },
            salesPIC: 'Rina Wijaya'
        },
        {
            id: isPPN ? 'INV-PPN-003' : 'INV-NP-003',
            client: 'Shopee Indonesia',
            project: 'Sewa Billboard Ring Road Yogyakarta',
            date: '2026-06-12',
            due: '2026-07-12',
            total: isPPN ? 8880000 : 8000000,
            paid: 0,
            status: 'unpaid',
            terms: {
                type: 'termin',
                installments: [
                    { percent: 50, amount: isPPN ? 4440000 : 4000000, note: 'Termin 1 (DP 50%)', dueDate: '2026-06-18' },
                    { percent: 50, amount: isPPN ? 4440000 : 4000000, note: 'Termin 2 (Pelunasan 50%)', dueDate: '2026-07-12' }
                ],
                notes: 'Pembayaran dibagi 2 termin (Termin 1: 50%, Termin 2: 50%).'
            },
            salesPIC: 'Budi Santoso'
        },
        {
            id: isPPN ? 'INV-PPN-004' : 'INV-NP-004',
            client: 'CV. Soto Bangkong Lestari',
            project: 'Baliho Kuliner Lokal Soto Bangkong - Solo',
            date: '2026-08-01',
            due: '2026-08-11',
            total: isPPN ? 49950000 : 45000000,
            paid: 0,
            status: 'unpaid',
            terms: {
                type: 'termin',
                installments: [
                    { percent: 30, amount: isPPN ? 14985000 : 13500000, note: 'Termin 1', dueDate: '2026-08-11' },
                    { percent: 40, amount: isPPN ? 19980000 : 18000000, note: 'Termin 2', dueDate: '2026-08-25' },
                    { percent: 30, amount: isPPN ? 14985000 : 13500000, note: 'Termin 3', dueDate: '2026-09-10' }
                ],
                notes: 'Angsuran berkala 3 bulan (30-40-30)'
            },
            salesPIC: 'Eko Prasetyo'
        }
    ]);

    // State for Vendor Payables (Hutang)
    const [payables, setPayables] = useState<PayableItem[]>([
        {
            id: isPPN ? 'PO-PPN-001' : 'PO-NP-001',
            vendor: 'PT. Megah Billboard Jaya',
            project: 'Kampanye Ramadhan Baliho Jawa Tengah',
            date: '2026-06-24',
            due: '2026-07-24',
            total: isPPN ? 3330000 : 3000000,
            paid: isPPN ? 3330000 : 3000000,
            status: 'paid',
            terms: { type: 'full', notes: 'Pembayaran 100% setelah penyerahan dokumen penagihan lengkap.' }
        },
        {
            id: isPPN ? 'PO-PPN-002' : 'PO-NP-002',
            vendor: 'PT. Promosi Outdoor Kreasindo',
            project: 'Sewa Videotron Simpang Lima Semarang',
            date: '2026-06-20',
            due: '2026-07-20',
            total: isPPN ? 8880000 : 8000000,
            paid: 4000000,
            status: 'partial',
            terms: {
                type: 'dp',
                dpPercent: 50,
                dpAmount: isPPN ? 4440000 : 4000000,
                dpDueDate: '2026-06-23',
                pelunasanDueDate: '2026-06-26',
                notes: 'DP 50% di muka, Pelunasan 50% setelah pemasangan selesai.'
            }
        },
        {
            id: isPPN ? 'PO-PPN-003' : 'PO-NP-003',
            vendor: 'CV. Media Ad Perkasa',
            project: 'Samsung Galaxy S27 Launching',
            date: '2026-06-15',
            due: '2026-06-20',
            total: isPPN ? 1200000 : 1200000,
            paid: 0,
            status: 'unpaid',
            terms: { type: 'full', notes: 'Pembayaran 100% setelah serah terima pekerjaan.' }
        }
    ]);

    const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('payable');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [partnerFilter, setPartnerFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<string>('due');

    const [receivablesPage, setReceivablesPage] = useState(1);
    const [payablesPage, setPayablesPage] = useState(1);
    
    // Modal states
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; type: 'receivable' | 'payable'; item: any } | null>(null);
    const [termsModal, setTermsModal] = useState<{ isOpen: boolean; item: any } | null>(null);
    const [payAmountInput, setPayAmountInput] = useState('');
    const [payMethodInput, setPayMethodInput] = useState('Transfer BCA');
    const [payRefInput, setPayRefInput] = useState('');
    const [payDateInput, setPayDateInput] = useState(new Date().toISOString().split('T')[0]);
    const [payNotesInput, setPayNotesInput] = useState('');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // Dynamic computations
    const totalReceivable = receivables.reduce((s, r) => s + (r.total - r.paid), 0);
    const totalPayable = payables.reduce((s, p) => s + (p.total - p.paid), 0);
    const netBalance = totalReceivable - totalPayable;

    const overdueReceivables = receivables.filter(r => getNearestMilestoneInfo(r).isOverdue);
    const overduePayables = payables.filter(p => getNearestMilestoneInfo(p).isOverdue);
    const totalOverdueCount = overdueReceivables.length + overduePayables.length;

    // Extract unique partner names
    const clientList = useMemo(() => Array.from(new Set(receivables.map(r => r.client))), [receivables]);
    const vendorList = useMemo(() => Array.from(new Set(payables.map(p => p.vendor))), [payables]);

    // Filter & Sort Receivables
    const filteredReceivables = useMemo(() => {
        return receivables.filter(r => {
            const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.project.toLowerCase().includes(searchQuery.toLowerCase());
            
            const milestoneInfo = getNearestMilestoneInfo(r);
            let matchesStatus = true;
            if (statusFilter === 'overdue') matchesStatus = milestoneInfo.isOverdue;
            else if (statusFilter === 'partial') matchesStatus = r.status === 'partial';
            else if (statusFilter === 'unpaid') matchesStatus = r.status === 'unpaid';
            else if (statusFilter === 'paid') matchesStatus = r.status === 'paid';

            let matchesPartner = partnerFilter === 'all' || r.client === partnerFilter;

            return matchesSearch && matchesStatus && matchesPartner;
        }).sort((a, b) => {
            if (sortOrder === 'amount_desc') return (b.total - b.paid) - (a.total - a.paid);
            if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
            return new Date(a.due).getTime() - new Date(b.due).getTime();
        });
    }, [receivables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Filter & Sort Payables
    const filteredPayables = useMemo(() => {
        return payables.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.project.toLowerCase().includes(searchQuery.toLowerCase());

            const milestoneInfo = getNearestMilestoneInfo(p);
            let matchesStatus = true;
            if (statusFilter === 'overdue') matchesStatus = milestoneInfo.isOverdue;
            else if (statusFilter === 'partial') matchesStatus = p.status === 'partial';
            else if (statusFilter === 'unpaid') matchesStatus = p.status === 'unpaid';
            else if (statusFilter === 'paid') matchesStatus = p.status === 'paid';

            let matchesPartner = partnerFilter === 'all' || p.vendor === partnerFilter;

            return matchesSearch && matchesStatus && matchesPartner;
        }).sort((a, b) => {
            if (sortOrder === 'amount_desc') return (b.total - b.paid) - (a.total - a.paid);
            if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
            return new Date(a.due).getTime() - new Date(b.due).getTime();
        });
    }, [payables, searchQuery, statusFilter, partnerFilter, sortOrder]);

    // Paginated items
    const paginatedReceivables = useMemo(() => {
        const start = (receivablesPage - 1) * ITEMS_PER_PAGE;
        return filteredReceivables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredReceivables, receivablesPage]);

    const paginatedPayables = useMemo(() => {
        const start = (payablesPage - 1) * ITEMS_PER_PAGE;
        return filteredPayables.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPayables, payablesPage]);

    // Open Catat Pembayaran Modal
    const handleOpenPayment = (type: 'receivable' | 'payable', item: any) => {
        const remaining = item.total - item.paid;
        const milestoneInfo = getNearestMilestoneInfo(item);
        const milestoneAmt = milestoneInfo.nearestMilestone ? milestoneInfo.nearestMilestone.amount : remaining;
        
        setPaymentModal({ isOpen: true, type, item });
        setPayAmountInput(String(Math.min(remaining, milestoneAmt)));
        setPayMethodInput('Transfer BCA');
        setPayRefInput(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
        setPayDateInput(new Date().toISOString().split('T')[0]);
        setPayNotesInput(`Pembayaran ${milestoneInfo.nearestMilestone?.label || 'Tagihan'} - ${item.project}`);
    };

    // Confirm Catat Pembayaran
    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModal) return;

        const amount = parseFloat(payAmountInput) || 0;
        if (amount <= 0) {
            alert('Jumlah pembayaran harus lebih dari Rp 0.');
            return;
        }

        const remaining = paymentModal.item.total - paymentModal.item.paid;
        if (amount > remaining) {
            alert(`Jumlah pembayaran melebihi sisa tagihan (${fmt(remaining)}).`);
            return;
        }

        if (paymentModal.type === 'receivable') {
            setReceivables(prev => prev.map(item => {
                if (item.id === paymentModal.item.id) {
                    const newPaid = item.paid + amount;
                    const newStatus = newPaid >= item.total ? 'paid' : 'partial';
                    return { ...item, paid: newPaid, status: newStatus };
                }
                return item;
            }));
            setSuccessAlert(`Sukses! Pembayaran piutang dari ${paymentModal.item.client} sebesar ${fmt(amount)} berhasil dicatat.`);
        } else {
            setPayables(prev => prev.map(item => {
                if (item.id === paymentModal.item.id) {
                    const newPaid = item.paid + amount;
                    const newStatus = newPaid >= item.total ? 'paid' : 'partial';
                    return { ...item, paid: newPaid, status: newStatus };
                }
                return item;
            }));
            setSuccessAlert(`Sukses! Pembayaran hutang ke ${paymentModal.item.vendor} sebesar ${fmt(amount)} berhasil dicatat.`);
        }

        setPaymentModal(null);
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Build Action Menu Items for Table Rows
    const getReceivableActionItems = (r: ReceivableItem): ActionMenuItem[] => {
        const remaining = r.total - r.paid;
        const items: ActionMenuItem[] = [];

        if (remaining > 0) {
            items.push({
                label: 'Catat Terima Bayar',
                icon: (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                ),
                onClick: () => handleOpenPayment('receivable', r)
            });
        }

        if (r.paid > 0) {
            items.push({
                label: 'Cetak Kwitansi PDF',
                icon: (
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                onClick: () => alert(`Membuka dokumen Kwitansi PDF untuk Invoice ${r.id}...`)
            });
        }

        items.push({
            label: 'Download Invoice PDF',
            icon: (
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            onClick: () => alert(`Mengunduh dokumen Invoice ${r.id}...`)
        });

        items.push({
            label: 'Lihat Skema Termin',
            icon: (
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            onClick: () => setTermsModal({ isOpen: true, item: r })
        });

        return items;
    };

    const getPayableActionItems = (p: PayableItem): ActionMenuItem[] => {
        const remaining = p.total - p.paid;
        const items: ActionMenuItem[] = [];

        if (remaining > 0) {
            items.push({
                label: 'Catat Bayar Vendor',
                icon: (
                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                ),
                onClick: () => handleOpenPayment('payable', p)
            });
        }

        items.push({
            label: 'Download PO PDF',
            icon: (
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
            onClick: () => alert(`Mengunduh dokumen Purchase Order ${p.id}...`)
        });

        items.push({
            label: 'Lihat Skema Termin Vendor',
            icon: (
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            onClick: () => setTermsModal({ isOpen: true, item: p })
        });

        return items;
    };

    return (
        <AppLayout
            activePage="debt-receivable"
            title="Hutang & Piutang Usaha"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Hutang Piutang' }]}
        >
            <div className="w-full space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Buku Pembantu Hutang & Piutang Usaha</h2>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isPPN ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                                Mode {isPPN ? "PPN 11%" : "Non-PPN"}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            Monitoring piutang tagihan client (AR), kewajiban biaya vendor (AP), serta kelancaran pencatatan penerimaan & pengeluaran kas.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button onClick={() => alert("Mengunduh Laporan Umur Piutang (Aging AR/AP Report)...")}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Export Rekap AP/AR</span>
                        </button>
                    </div>
                </div>

                {/* Overdue Alert Banner */}
                {totalOverdueCount > 0 && (
                    <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rose-950">Perhatian: Terdapat Tagihan yang Melewati Jatuh Tempo!</h3>
                                <p className="text-xs text-rose-800/90 font-medium mt-0.5 leading-relaxed">
                                    Terdapat <strong className="text-rose-950 font-bold">{overdueReceivables.length} Piutang Client</strong> dan <strong className="text-rose-950 font-bold">{overduePayables.length} Hutang Vendor</strong> yang memerlukan tindak lanjut penagihan/pembayaran segera.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-in shadow-2xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-xs font-bold text-emerald-900 leading-tight">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Executive Summary Metric Cards (4 Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIUTANG CLIENT (ACTIVE AR)</span>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">Client AR</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 font-mono block">{fmt(totalReceivable)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Dari {receivables.filter(r => r.status !== 'paid').length} proyek penagihan aktif</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PIUTANG JATUH TEMPO</span>
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold border border-rose-100">{overdueReceivables.length} Invoice</span>
                        </div>
                        <span className="text-2xl font-bold text-rose-600 font-mono block">
                            {fmt(overdueReceivables.reduce((s, r) => s + (r.total - r.paid), 0))}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block">Memerlukan penagihan intensif</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HUTANG VENDOR (ACTIVE AP)</span>
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-bold border border-amber-100">Vendor AP</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-900 font-mono block">{fmt(totalPayable)}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Kewajiban bayar PO ke vendor billboard</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NET WORKING CAPITAL EXPOSURE</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${netBalance >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100"}`}>
                                {netBalance >= 0 ? "Surplus AR" : "Defisit AP"}
                            </span>
                        </div>
                        <span className={`text-2xl font-bold font-mono block ${netBalance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {fmt(netBalance)}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block">Selisih piutang client dikurangi hutang vendor</span>
                    </div>
                </div>

                {/* Main Tab Navigation & Filter Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                    {/* Tab Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/80 w-full sm:w-auto">
                            <button
                                onClick={() => { setActiveTab('payable'); setPayablesPage(1); }}
                                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'payable' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Hutang Usaha (Vendor AP)</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {payables.filter(p => p.status !== 'paid').length}
                                </span>
                            </button>

                            <button
                                onClick={() => { setActiveTab('receivable'); setReceivablesPage(1); }}
                                className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'receivable' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Piutang Usaha (Client AR)</span>
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {receivables.filter(r => r.status !== 'paid').length}
                                </span>
                            </button>
                        </div>

                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {activeTab === 'receivable' ? 'Daftar Tagihan Penjualan (Invoices)' : 'Daftar Kewajiban Pembelian (PO)'}
                        </div>
                    </div>

                    {/* Filter Panel Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:items-end">
                        {/* Search Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian Data</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setReceivablesPage(1);
                                        setPayablesPage(1);
                                    }}
                                    placeholder="Cari No., Partner, atau Proyek..."
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all placeholder-slate-400 shadow-2xs"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Filter Status */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter Status Tagihan</label>
                            <SelectInput
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setReceivablesPage(1);
                                    setPayablesPage(1);
                                }}
                                options={[
                                    { value: 'all', label: 'Semua Status' },
                                    { value: 'overdue', label: '⚠ Melewati Jatuh Tempo' },
                                    { value: 'unpaid', label: 'Belum Dibayar (Unpaid)' },
                                    { value: 'partial', label: 'Terbayar Sebagian (Partial)' },
                                    { value: 'paid', label: 'Lunas (Paid)' },
                                ]}
                            />
                        </div>

                        {/* Filter Partner */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {activeTab === 'receivable' ? 'Filter Client' : 'Filter Vendor'}
                            </label>
                            <SelectInput
                                value={partnerFilter}
                                onChange={(e) => {
                                    setPartnerFilter(e.target.value);
                                    setReceivablesPage(1);
                                    setPayablesPage(1);
                                }}
                                options={[
                                    { value: 'all', label: activeTab === 'receivable' ? 'Semua Client' : 'Semua Vendor' },
                                    ...(activeTab === 'receivable'
                                        ? clientList.map(c => ({ value: c, label: c }))
                                        : vendorList.map(v => ({ value: v, label: v }))
                                    )
                                ]}
                            />
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Urutkan Berdasarkan</label>
                            <SelectInput
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                options={[
                                    { value: 'due', label: 'Jatuh Tempo Terdekat' },
                                    { value: 'amount_desc', label: 'Nominal Terbesar' },
                                    { value: 'newest', label: 'Tanggal Terbaru' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table Container */}
                <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'receivable' ? (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                        <th className="py-4 px-6">No. Invoice & Tanggal</th>
                                        <th className="py-4 px-6">Client / Pelanggan</th>
                                        <th className="py-4 px-6">Proyek Media</th>
                                        <th className="py-4 px-6 text-right">Total Tagihan</th>
                                        <th className="py-4 px-6 text-right">Telah Terbayar</th>
                                        <th className="py-4 px-6 text-right">Sisa Piutang</th>
                                        <th className="py-4 px-6">Tagihan Terdekat</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedReceivables.map((r) => {
                                        const remaining = r.total - r.paid;
                                        const milestoneInfo = getNearestMilestoneInfo(r);
                                        const percentPaid = r.total > 0 ? Math.min(100, Math.round((r.paid / r.total) * 100)) : 0;
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-mono font-bold text-slate-900">{r.id}</div>
                                                    <div className="text-[10.5px] text-slate-400 font-medium">{formatDateIndo(r.date)}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{r.client}</div>
                                                    {r.salesPIC && <div className="text-[10px] text-slate-400 font-medium">Sales: {r.salesPIC}</div>}
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-600 max-w-[220px] truncate" title={r.project}>
                                                    {r.project}
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                                                    {fmt(r.total)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">{fmt(r.paid)}</div>
                                                    <div className="w-20 bg-slate-100 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentPaid}%` }} />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-rose-600">
                                                    {fmt(remaining)}
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">{milestoneInfo.nearestMilestone.label}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] text-slate-500 font-medium">
                                                                    {formatDateIndo(milestoneInfo.nearestMilestone.dueDate)}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="bg-rose-50 text-rose-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200 shrink-0">
                                                                        Terlewat {milestoneInfo.overdueDays} hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-slate-100 text-slate-600 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium italic">Lunas</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none ${
                                                        r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        r.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-amber-50 text-amber-800 border-amber-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            r.status === 'paid' ? 'bg-emerald-500' :
                                                            r.status === 'partial' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                        }`} />
                                                        {r.status === 'paid' ? 'Lunas' : r.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <ActionDropdown items={getReceivableActionItems(r)} />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredReceivables.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center">
                                                <EmptyState title="Belum Ada Data Piutang" message="Tidak ditemukan catatan piutang client yang sesuai dengan pencarian / filter Anda." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                        <th className="py-4 px-6">No. PO & Tanggal</th>
                                        <th className="py-4 px-6">Vendor / Supplier</th>
                                        <th className="py-4 px-6">Proyek Media</th>
                                        <th className="py-4 px-6 text-right">Total Kewajiban PO</th>
                                        <th className="py-4 px-6 text-right">Telah Terbayar</th>
                                        <th className="py-4 px-6 text-right">Sisa Hutang</th>
                                        <th className="py-4 px-6">Jatuh Tempo Terdekat</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                        <th className="py-4 px-6 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedPayables.map((p) => {
                                        const remaining = p.total - p.paid;
                                        const milestoneInfo = getNearestMilestoneInfo(p);
                                        const percentPaid = p.total > 0 ? Math.min(100, Math.round((p.paid / p.total) * 100)) : 0;
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-mono font-bold text-slate-900">{p.id}</div>
                                                    <div className="text-[10.5px] text-slate-400 font-medium">{formatDateIndo(p.date)}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{p.vendor}</div>
                                                </td>
                                                <td className="py-4 px-6 font-semibold text-slate-600 max-w-[220px] truncate" title={p.project}>
                                                    {p.project}
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                                                    {fmt(p.total)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="font-mono font-bold text-emerald-700">{fmt(p.paid)}</div>
                                                    <div className="w-20 bg-slate-100 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentPaid}%` }} />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-rose-600">
                                                    {fmt(remaining)}
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-800">{milestoneInfo.nearestMilestone.label}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10.5px] text-slate-500 font-medium">
                                                                    {formatDateIndo(milestoneInfo.nearestMilestone.dueDate)}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="bg-rose-50 text-rose-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200 shrink-0">
                                                                        Terlewat {milestoneInfo.overdueDays} hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-slate-100 text-slate-600 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-slate-200 shrink-0">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium italic">Lunas</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border leading-none ${
                                                        p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        p.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-amber-50 text-amber-800 border-amber-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            p.status === 'paid' ? 'bg-emerald-500' :
                                                            p.status === 'partial' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                        }`} />
                                                        {p.status === 'paid' ? 'Lunas' : p.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <ActionDropdown items={getPayableActionItems(p)} />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredPayables.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center">
                                                <EmptyState title="Belum Ada Data Hutang" message="Tidak ditemukan kewajiban hutang vendor yang sesuai dengan pencarian / filter Anda." />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {activeTab === 'receivable' && filteredReceivables.length > 0 && (
                        <div className="p-4 border-t border-slate-100">
                            <Pagination
                                currentPage={receivablesPage}
                                totalPages={Math.ceil(filteredReceivables.length / ITEMS_PER_PAGE)}
                                totalItems={filteredReceivables.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setReceivablesPage}
                            />
                        </div>
                    )}

                    {activeTab === 'payable' && filteredPayables.length > 0 && (
                        <div className="p-4 border-t border-slate-100">
                            <Pagination
                                currentPage={payablesPage}
                                totalPages={Math.ceil(filteredPayables.length / ITEMS_PER_PAGE)}
                                totalItems={filteredPayables.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPayablesPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: CATAT PEMBAYARAN */}
            {paymentModal && paymentModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPaymentModal(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Catat Transaksi Pembayaran</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                    {paymentModal.type === 'receivable' ? 'Penerimaan Kas Piutang Client' : 'Pengeluaran Kas Hutang Vendor'}
                                </p>
                            </div>
                            <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Nomor Dokumen:</span>
                                    <span className="font-mono font-bold text-slate-900">{paymentModal.item.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Mitra Partner:</span>
                                    <span className="font-bold text-slate-900">{paymentModal.type === 'receivable' ? paymentModal.item.client : paymentModal.item.vendor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Nama Proyek:</span>
                                    <span className="font-bold text-slate-900 truncate max-w-[260px]">{paymentModal.item.project}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TOTAL TAGIHAN</span>
                                    <span className="font-mono font-bold text-slate-900 text-xs">{fmt(paymentModal.item.total)}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">TERBAYAR</span>
                                    <span className="font-mono font-bold text-emerald-700 text-xs">{fmt(paymentModal.item.paid)}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-center">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">SISA SALDO</span>
                                    <span className="font-mono font-bold text-rose-600 text-xs">{fmt(paymentModal.item.total - paymentModal.item.paid)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 tracking-tight block">Jumlah Pembayaran (IDR)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={paymentModal.item.total - paymentModal.item.paid}
                                        value={payAmountInput}
                                        onChange={(e) => setPayAmountInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 tracking-tight block">Akun Kas / Bank Destinasi (COA)</label>
                                    <SelectInput
                                        value={payMethodInput}
                                        onChange={(e) => setPayMethodInput(e.target.value)}
                                        options={[
                                            { value: '1111 - Bank Mandiri Solo Baru (138-00-2010633-7)', label: '1111 - Bank Mandiri Solo Baru' },
                                            { value: '1112 - Bank BCA Operasional Utama', label: '1112 - Bank BCA Operasional' },
                                            { value: '1110 - Kas Tunai / Operasional', label: '1110 - Kas Tunai Operasional' },
                                            { value: '1113 - Bank BRI Giro Usaha', label: '1113 - Bank BRI Giro Usaha' },
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 tracking-tight block">Tanggal Transaksi</label>
                                    <input
                                        type="date"
                                        required
                                        value={payDateInput}
                                        onChange={(e) => setPayDateInput(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 tracking-tight block">No. Referensi / Bukti Transfer</label>
                                    <input
                                        type="text"
                                        value={payRefInput}
                                        onChange={(e) => setPayRefInput(e.target.value)}
                                        placeholder="No. Ref Bank..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 tracking-tight block">Catatan / Keterangan Pembayaran</label>
                                <input
                                    type="text"
                                    value={payNotesInput}
                                    onChange={(e) => setPayNotesInput(e.target.value)}
                                    placeholder="Keterangan tambahan..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                                >
                                    Simpan Transaksi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DETAIL TERMIN (MILESTONE) */}
            {termsModal && termsModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setTermsModal(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Detail Skema & Syarat Pembayaran</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{termsModal.item.id} · {termsModal.item.client || termsModal.item.vendor}</p>
                            </div>
                            <button onClick={() => setTermsModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <div className="p-6 space-y-4 text-slate-800">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skema Pembayaran</span>
                                <div className="text-xs font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 inline-block">
                                    {termsModal.item.terms.type === 'full' ? 'Full Payment 100%' :
                                     termsModal.item.terms.type === 'dp' ? 'DP & Pelunasan' :
                                     'Termin Bertahap'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rincian Milestone Pembayaran:</span>
                                
                                <div className="space-y-2">
                                    {getMilestones(termsModal.item).map((milestone, idx) => {
                                        const isMilestonePaid = termsModal.item.paid >= milestone.cumulativeAmount - 1;
                                        const milestoneInfo = getNearestMilestoneInfo(termsModal.item);

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3.5 rounded-xl border text-xs font-semibold space-y-1.5 transition-all ${
                                                    isMilestonePaid ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                                                    'bg-slate-50 border-slate-200/80 text-slate-800'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold">{milestone.label}</span>
                                                    <span className="font-mono font-bold text-slate-900">{fmt(milestone.amount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-slate-500">
                                                        Jatuh Tempo: {formatDateIndo(milestone.dueDate)}
                                                    </span>
                                                    <span>
                                                        {isMilestonePaid ? (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                                ✓ Lunas
                                                            </span>
                                                        ) : (
                                                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-300">
                                                                Menunggu
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {termsModal.item.terms.notes && (
                                    <div className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                        Catatan: {termsModal.item.terms.notes}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setTermsModal(null)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
