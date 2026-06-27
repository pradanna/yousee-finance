import React, { useState } from 'react';
import DemoLayout, { useDemoFiscalMode } from '@/Layouts/DemoLayout';

// ─────────────────────────────────────────────────────────────────────────────
// Types
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

const getNearestMilestoneInfo = (item: ReceivableItem | PayableItem, currentDateStr: string = '2026-06-27'): MilestoneStatus => {
    const milestones = getMilestones(item);
    
    // Find first milestone where paid < cumulativeAmount (accounting for rounding)
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
    const dueDate = new Date(unpaidMilestone.dueDate);
    
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

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function DebtReceivable() {
    const fiscalMode = useDemoFiscalMode();
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
            terms: { type: 'full', notes: 'Pembayaran 100% lunas 30 hari setelah invoice diterima.' }
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
            }
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
            }
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

    const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; type: 'receivable' | 'payable'; item: any } | null>(null);
    const [termsModal, setTermsModal] = useState<{ isOpen: boolean; item: any } | null>(null);
    const [payAmountInput, setPayAmountInput] = useState('');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // Dynamic computations
    const totalReceivable = receivables.reduce((s, r) => s + (r.total - r.paid), 0);
    const totalPayable = payables.reduce((s, p) => s + (p.total - p.paid), 0);
    const netBalance = totalReceivable - totalPayable;

    const overdueReceivables = receivables.filter(r => {
        const info = getNearestMilestoneInfo(r);
        return info.isOverdue;
    });

    const overduePayables = payables.filter(p => {
        const info = getNearestMilestoneInfo(p);
        return info.isOverdue;
    });

    const totalOverdueCount = overdueReceivables.length + overduePayables.length;

    // Filter lists
    const filteredReceivables = receivables.filter(r => 
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.project.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayables = payables.filter(p => 
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open catat pembayaran
    const handleOpenPayment = (type: 'receivable' | 'payable', item: any) => {
        const remaining = item.total - item.paid;
        setPaymentModal({ isOpen: true, type, item });
        setPayAmountInput(String(remaining));
    };

    // Confirm catat pembayaran
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

    return (
        <DemoLayout
            activePage="debt-receivable"
            title="Monitoring Hutang Piutang"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Transaksi' }, { label: 'Hutang Piutang' }]}
        >
            <div className="space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Buku Pembantu Hutang & Piutang</h2>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">
                            Monitoring saldo piutang client dan hutang HPP vendor Yousee Indonesia
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nomor, nama partner, atau proyek..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Overdue Alert Banner */}
                {totalOverdueCount > 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rose-950">Ada Tagihan yang Melewati Jatuh Tempo!</h3>
                                <p className="text-[11px] text-rose-700/80 font-semibold mt-0.5 leading-relaxed">
                                    Terdapat <strong className="text-rose-950 font-black">{overdueReceivables.length} Piutang Client</strong> dan <strong className="text-rose-950 font-black">{overduePayables.length} Hutang Vendor</strong> yang telah melewati batas pembayaran term/termin terdekat. Segera lakukan tindak lanjut penagihan atau pembayaran.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert Banner */}
                {successAlert && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-xs font-bold text-emerald-800 leading-tight">
                            {successAlert}
                        </div>
                    </div>
                )}

                {/* Quick Widget Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL PIUTANG CLIENT (RECEIVABLES)</span>
                        <span className="text-xl font-bold text-blue-600 font-mono block">{fmt(totalReceivable)}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Sisa dana penagihan yang belum diterima dari client</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">TOTAL HUTANG VENDOR (PAYABLES)</span>
                        <span className="text-xl font-bold text-rose-500 font-mono block">{fmt(totalPayable)}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Sisa kewajiban biaya HPP sewa ke vendor billboard</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">NET OUTSTANDING BALANCE</span>
                        <span className={`text-xl font-bold font-mono block ${netBalance >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {fmt(netBalance)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">Selisih piutang client dikurangi hutang vendor</span>
                    </div>
                </div>

                {/* Tab Switcher Toolbar */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('receivable')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'receivable' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Piutang Client</span>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {receivables.filter(r => r.status !== 'paid').length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('payable')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeTab === 'payable' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span>Hutang Vendor</span>
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {payables.filter(p => p.status !== 'paid').length}
                            </span>
                        </button>
                    </div>
                    
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {activeTab === 'receivable' ? 'Daftar Tagihan Penjualan (Invoices)' : 'Daftar Tagihan Pembelian (PO)'}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        {activeTab === 'receivable' ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                        <th className="px-6 py-4">No. Invoice</th>
                                        <th className="px-6 py-4">Client / Pelanggan</th>
                                        <th className="px-6 py-4">Deskripsi Proyek</th>
                                        <th className="px-6 py-4 text-right">Total Invoice</th>
                                        <th className="px-6 py-4 text-right">Telah Terbayar</th>
                                        <th className="px-6 py-4 text-right">Sisa Piutang</th>
                                        <th className="px-6 py-4">Tagihan Terdekat</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                    {filteredReceivables.map((r) => {
                                        const remaining = r.total - r.paid;
                                        const milestoneInfo = getNearestMilestoneInfo(r);
                                        return (
                                            <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800">{r.client}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-500 max-w-[200px] truncate">{r.project}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">{fmt(r.total)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmt(r.paid)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-500 bg-rose-50/10">{fmt(remaining)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-700">{milestoneInfo.nearestMilestone.label}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                                    {formatDateIndo(milestoneInfo.nearestMilestone.dueDate)}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-rose-100 shrink-0">
                                                                        Terlewat {milestoneInfo.overdueDays} hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-slate-50 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-slate-100 shrink-0">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-semibold italic">Lunas / Tidak ada</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        r.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            r.status === 'paid' ? 'bg-emerald-500' :
                                                            r.status === 'partial' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                        }`} />
                                                        {r.status === 'paid' ? 'Lunas' : r.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setTermsModal({ isOpen: true, item: r })}
                                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                                                        >
                                                            Milestone
                                                        </button>
                                                        {remaining > 0 && (
                                                            <button
                                                                onClick={() => handleOpenPayment('receivable', r)}
                                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all"
                                                            >
                                                                Catat Bayar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredReceivables.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                                                Tidak ditemukan piutang client yang cocok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40">
                                        <th className="px-6 py-4">No. PO</th>
                                        <th className="px-6 py-4">Vendor Partner</th>
                                        <th className="px-6 py-4">Deskripsi Proyek</th>
                                        <th className="px-6 py-4 text-right">Total PO</th>
                                        <th className="px-6 py-4 text-right">Telah Terbayar</th>
                                        <th className="px-6 py-4 text-right">Sisa Hutang</th>
                                        <th className="px-6 py-4">Tagihan Terdekat</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                                    {filteredPayables.map((p) => {
                                        const remaining = p.total - p.paid;
                                        const milestoneInfo = getNearestMilestoneInfo(p);
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">{p.id}</td>
                                                <td className="px-6 py-4 font-bold text-slate-800">{p.vendor}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-500 max-w-[200px] truncate">{p.project}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-600">{fmt(p.total)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{fmt(p.paid)}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-500 bg-rose-50/10">{fmt(remaining)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {milestoneInfo.nearestMilestone ? (
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-slate-700">{milestoneInfo.nearestMilestone.label}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                                    {formatDateIndo(milestoneInfo.nearestMilestone.dueDate)}
                                                                </span>
                                                                {milestoneInfo.isOverdue ? (
                                                                    <span className="bg-rose-50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-rose-100 shrink-0">
                                                                        Terlewat {milestoneInfo.overdueDays} hari
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-slate-50 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-slate-100 shrink-0">
                                                                        Menunggu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-semibold italic">Lunas / Tidak ada</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                        p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        p.status === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            p.status === 'paid' ? 'bg-emerald-500' :
                                                            p.status === 'partial' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                        }`} />
                                                        {p.status === 'paid' ? 'Lunas' : p.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setTermsModal({ isOpen: true, item: p })}
                                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                                                        >
                                                            Milestone
                                                        </button>
                                                        {remaining > 0 && (
                                                            <button
                                                                onClick={() => handleOpenPayment('payable', p)}
                                                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all"
                                                            >
                                                                Catat Bayar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredPayables.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                                                Tidak ditemukan hutang vendor yang cocok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: CATAT PEMBAYARAN */}
            {paymentModal && paymentModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setPaymentModal(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Catat Pembayaran Baru</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {paymentModal.type === 'receivable' ? 'Penerimaan Piutang Client' : 'Pembayaran Hutang Vendor'}
                                </p>
                            </div>
                            <button onClick={() => setPaymentModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all">Tutup</button>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Identitas Transaksi</span>
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Nomor Dokumen:</span>
                                        <span className="font-mono font-bold text-slate-900">{paymentModal.item.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Partner terkait:</span>
                                        <span className="font-bold text-slate-800">{paymentModal.type === 'receivable' ? paymentModal.item.client : paymentModal.item.vendor}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Nama Proyek:</span>
                                        <span className="font-bold text-slate-800 truncate max-w-[200px]">{paymentModal.item.project}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 text-center">
                                    <span className="text-[9px] font-bold text-slate-400 block">TOTAL TAGIHAN</span>
                                    <span className="font-mono font-bold text-slate-800 text-[11px]">{fmt(paymentModal.item.total)}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 text-center">
                                    <span className="text-[9px] font-bold text-slate-400 block">TERBAYAR</span>
                                    <span className="font-mono font-bold text-emerald-600 text-[11px]">{fmt(paymentModal.item.paid)}</span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 text-center">
                                    <span className="text-[9px] font-bold text-slate-400 block">SISA SALDO</span>
                                    <span className="font-mono font-bold text-rose-500 text-[11px]">{fmt(paymentModal.item.total - paymentModal.item.paid)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Jumlah Pembayaran yang Diterima/Dibayarkan (IDR)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={paymentModal.item.total - paymentModal.item.paid}
                                    value={payAmountInput}
                                    onChange={(e) => setPayAmountInput(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal(null)}
                                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
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
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Detail Skema & Syarat Pembayaran</h3>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{termsModal.item.id}</p>
                            </div>
                            <button onClick={() => setTermsModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all">Tutup</button>
                        </div>

                        <div className="p-6 space-y-4 text-slate-800">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Metode / Skema:</span>
                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                                    {termsModal.item.terms.type === 'full' ? 'Full Payment 100%' :
                                     termsModal.item.terms.type === 'dp' ? 'DP & Pelunasan' :
                                     'Termin Bertahap'}
                                </div>
                            </div>

                             <div className="space-y-2">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Rincian Milestone Pembayaran:</span>
                                 
                                 <div className="space-y-2.5">
                                     {getMilestones(termsModal.item).map((milestone, idx) => {
                                         const isMilestonePaid = termsModal.item.paid >= milestone.cumulativeAmount - 1;
                                         const dueDate = new Date(milestone.dueDate);
                                         const currentDate = new Date('2026-06-27');
                                         const timeDiff = currentDate.getTime() - dueDate.getTime();
                                         const isOverdue = !isMilestonePaid && timeDiff > 0;
                                         const overdueDays = isOverdue ? Math.ceil(timeDiff / (1000 * 3600 * 24)) : 0;

                                         return (
                                             <div
                                                 key={idx}
                                                 className={`p-3.5 rounded-xl border text-xs font-semibold space-y-1.5 transition-all ${
                                                     isMilestonePaid ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                                                     isOverdue ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                                                     'bg-slate-50 border-slate-100 text-slate-800'
                                                 }`}
                                             >
                                                 <div className="flex justify-between items-center">
                                                     <span className={`${isMilestonePaid ? 'text-emerald-800' : isOverdue ? 'text-rose-800' : 'text-slate-500'}`}>
                                                         {milestone.label}
                                                     </span>
                                                     <span className="font-mono font-bold text-slate-900">{fmt(milestone.amount)}</span>
                                                 </div>
                                                 <div className="flex justify-between items-center text-[10px]">
                                                     <span className={`${isMilestonePaid ? 'text-emerald-600' : isOverdue ? 'text-rose-600' : 'text-slate-400'}`}>
                                                         Jatuh Tempo: {formatDateIndo(milestone.dueDate)}
                                                     </span>
                                                     <span>
                                                         {isMilestonePaid ? (
                                                             <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded-sm">
                                                                 Lunas
                                                             </span>
                                                         ) : isOverdue ? (
                                                             <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded-sm">
                                                                 Terlewat {overdueDays} hari
                                                             </span>
                                                         ) : (
                                                             <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-sm">
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
                                     <div className="text-[10px] text-slate-400 italic mt-2">
                                         Keterangan tambahan: {termsModal.item.terms.notes}
                                     </div>
                                 )}
                             </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setTermsModal(null)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DemoLayout>
    );
}
