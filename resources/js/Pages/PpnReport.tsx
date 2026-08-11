import React, { useState, useMemo } from 'react';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import SelectInput from '@/Components/Form/SelectInput';
import Pagination from '@/Components/Table/Pagination';
import EmptyState from '@/Components/Table/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface PpnKeluaranItem {
    id: string;
    docNo: string;
    nsfp: string; // Nomor Seri Faktur Pajak
    client: string;
    npwp: string;
    date: string;
    dpp: number;
    ppn: number;
    total: number;
    efakturStatus: 'approved' | 'ready' | 'draft';
}

interface PpnMasukanItem {
    id: string;
    docNo: string;
    nsfp: string;
    vendor: string;
    npwp: string;
    date: string;
    dpp: number;
    ppn: number;
    total: number;
    creditableStatus: 'creditable' | 'non_creditable';
    efakturStatus: 'approved' | 'ready' | 'draft';
}

interface TaxSettlementRecord {
    taxPeriod: string; // e.g. "Juni 2026"
    ppnKeluaranTotal: number;
    ppnMasukanTotal: number;
    netAmount: number; // Positive = Kurang Bayar, Negative = Lebih Bayar
    status: 'paid' | 'unpaid' | 'compensated';
    ntpn?: string;
    paidDate?: string;
    bankName?: string;
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

const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PpnReport() {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeTab, setActiveTab] = useState<'keluaran' | 'masukan' | 'spt'>('keluaran');

    // Data PPN Keluaran (Penjualan Client PKP)
    const [ppnKeluaran, setPpnKeluaran] = useState<PpnKeluaranItem[]>([
        {
            id: 'PK-001',
            docNo: 'INV-PPN-001',
            nsfp: '010.000-26.88219001',
            client: 'PT. Gojek Tokopedia',
            npwp: '01.312.456.7-011.000',
            date: '2026-06-25',
            dpp: 10000000,
            ppn: 1100000,
            total: 11100000,
            efakturStatus: 'approved'
        },
        {
            id: 'PK-002',
            docNo: 'INV-PPN-002',
            nsfp: '010.000-26.88219002',
            client: 'Traveloka Corp',
            npwp: '02.441.890.1-015.000',
            date: '2026-06-22',
            dpp: 5000000,
            ppn: 550000,
            total: 5550000,
            efakturStatus: 'approved'
        },
        {
            id: 'PK-003',
            docNo: 'INV-PPN-003',
            nsfp: '010.000-26.88219003',
            client: 'Shopee Indonesia',
            npwp: '03.889.123.4-021.000',
            date: '2026-06-18',
            dpp: 8000000,
            ppn: 880000,
            total: 8880000,
            efakturStatus: 'ready'
        },
        {
            id: 'PK-004',
            docNo: 'INV-PPN-004',
            nsfp: '010.000-26.88219004',
            client: 'CV. Soto Bangkong Lestari',
            npwp: '07.123.990.2-521.000',
            date: '2026-06-10',
            dpp: 45000000,
            ppn: 4950000,
            total: 49950000,
            efakturStatus: 'draft'
        }
    ]);

    // Data PPN Masukan (Pembelian Vendor PKP)
    const [ppnMasukan, setPpnMasukan] = useState<PpnMasukanItem[]>([
        {
            id: 'PM-001',
            docNo: 'PO-PPN-001',
            nsfp: '010.000-26.11029801',
            vendor: 'PT. Megah Billboard Jaya',
            npwp: '01.882.331.0-522.000',
            date: '2026-06-24',
            dpp: 3000000,
            ppn: 330000,
            total: 3330000,
            creditableStatus: 'creditable',
            efakturStatus: 'approved'
        },
        {
            id: 'PM-002',
            docNo: 'PO-PPN-002',
            nsfp: '010.000-26.11029802',
            vendor: 'PT. Promosi Outdoor Kreasindo',
            npwp: '02.991.442.8-511.000',
            date: '2026-06-20',
            dpp: 8000000,
            ppn: 880000,
            total: 8880000,
            creditableStatus: 'creditable',
            efakturStatus: 'approved'
        },
        {
            id: 'PM-003',
            docNo: 'PO-PPN-003',
            nsfp: '010.000-26.11029803',
            vendor: 'CV. Media Ad Perkasa',
            npwp: '03.771.229.4-523.000',
            date: '2026-06-15',
            dpp: 1200000,
            ppn: 132000,
            total: 1332000,
            creditableStatus: 'non_creditable',
            efakturStatus: 'ready'
        }
    ]);

    // Data Setoran Pajak Masa PPN
    const [taxSettlement, setTaxSettlement] = useState<TaxSettlementRecord>({
        taxPeriod: 'Masa Juni 2026',
        ppnKeluaranTotal: 7480000,
        ppnMasukanTotal: 1342000,
        netAmount: 6138000,
        status: 'unpaid',
        ntpn: '2606271109281200',
        paidDate: '2026-07-10',
        bankName: 'Bank Mandiri Solo Baru'
    });

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [periodFilter, setPeriodFilter] = useState('06-2026');
    const [keluaranPage, setKeluaranPage] = useState(1);
    const [masukanPage, setMasukanPage] = useState(1);

    // Modal states
    const [nsfpModal, setNsfpModal] = useState<{ isOpen: boolean; item: any; type: 'keluaran' | 'masukan' } | null>(null);
    const [ntpnModal, setNtpnModal] = useState(false);
    const [inputNsfp, setInputNsfp] = useState('');
    const [inputNtpn, setInputNtpn] = useState(taxSettlement.ntpn || '');
    const [inputPaidDate, setInputPaidDate] = useState(taxSettlement.paidDate || new Date().toISOString().split('T')[0]);
    const [inputBank, setInputBank] = useState(taxSettlement.bankName || 'Bank Mandiri Solo Baru');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    // Dynamic Calculations
    const totalKeluaranDpp = ppnKeluaran.reduce((s, k) => s + k.dpp, 0);
    const totalKeluaranPpn = ppnKeluaran.reduce((s, k) => s + k.ppn, 0);

    const totalMasukanDpp = ppnMasukan.reduce((s, m) => s + m.dpp, 0);
    const totalMasukanPpnCreditable = ppnMasukan.filter(m => m.creditableStatus === 'creditable').reduce((s, m) => s + m.ppn, 0);

    const netPpnAmount = totalKeluaranPpn - totalMasukanPpnCreditable;
    const isKurangBayar = netPpnAmount >= 0;

    // Filtered Lists
    const filteredKeluaran = useMemo(() => {
        return ppnKeluaran.filter(k => {
            const matchesSearch = k.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.nsfp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.npwp.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === 'approved') matchesStatus = k.efakturStatus === 'approved';
            else if (statusFilter === 'ready') matchesStatus = k.efakturStatus === 'ready';
            else if (statusFilter === 'draft') matchesStatus = k.efakturStatus === 'draft';

            return matchesSearch && matchesStatus;
        });
    }, [ppnKeluaran, searchQuery, statusFilter]);

    const filteredMasukan = useMemo(() => {
        return ppnMasukan.filter(m => {
            const matchesSearch = m.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.nsfp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.npwp.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === 'approved') matchesStatus = m.efakturStatus === 'approved';
            else if (statusFilter === 'ready') matchesStatus = m.efakturStatus === 'ready';
            else if (statusFilter === 'draft') matchesStatus = m.efakturStatus === 'draft';
            else if (statusFilter === 'creditable') matchesStatus = m.creditableStatus === 'creditable';

            return matchesSearch && matchesStatus;
        });
    }, [ppnMasukan, searchQuery, statusFilter]);

    // Paginated datasets
    const paginatedKeluaran = useMemo(() => {
        const start = (keluaranPage - 1) * ITEMS_PER_PAGE;
        return filteredKeluaran.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredKeluaran, keluaranPage]);

    const paginatedMasukan = useMemo(() => {
        const start = (masukanPage - 1) * ITEMS_PER_PAGE;
        return filteredMasukan.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMasukan, masukanPage]);

    // Save NSFP Modal
    const handleSaveNsfp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nsfpModal) return;

        if (nsfpModal.type === 'keluaran') {
            setPpnKeluaran(prev => prev.map(k => k.id === nsfpModal.item.id ? { ...k, nsfp: inputNsfp, efakturStatus: 'approved' } : k));
        } else {
            setPpnMasukan(prev => prev.map(m => m.id === nsfpModal.item.id ? { ...m, nsfp: inputNsfp, efakturStatus: 'approved' } : m));
        }

        setNsfpModal(null);
        setSuccessAlert(`Nomor Seri Faktur Pajak (NSFP) ${inputNsfp} berhasil diperbarui.`);
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Save NTPN Settlement Modal
    const handleSaveNtpn = (e: React.FormEvent) => {
        e.preventDefault();
        setTaxSettlement(prev => ({
            ...prev,
            status: 'paid',
            ntpn: inputNtpn,
            paidDate: inputPaidDate,
            bankName: inputBank
        }));
        setNtpnModal(false);
        setSuccessAlert(`Sukses! Pembayaran PPN Kurang Bayar ke Kas Negara berhasil dicatat (NTPN: ${inputNtpn}).`);
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Status Badge Helpers
    const getEfakturBadge = (status: 'approved' | 'ready' | 'draft') => {
        switch (status) {
            case 'approved':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Approval Sukses</span>;
            case 'ready':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Siap Upload DJP</span>;
            case 'draft':
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Draft Faktur</span>;
        }
    };

    // Action Items for Table Rows
    const getKeluaranActionItems = (k: PpnKeluaranItem): ActionMenuItem[] => {
        return [
            {
                label: 'Cetak Cetakan e-Faktur PDF',
                icon: (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                onClick: () => alert(`Mencetak dokumen Cetakan e-Faktur PDF (NSFP: ${k.nsfp})...`)
            },
            {
                label: 'Edit Nomor Seri (NSFP)',
                icon: (
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                ),
                onClick: () => {
                    setNsfpModal({ isOpen: true, item: k, type: 'keluaran' });
                    setInputNsfp(k.nsfp);
                }
            }
        ];
    };

    const getMasukanActionItems = (m: PpnMasukanItem): ActionMenuItem[] => {
        return [
            {
                label: 'Detail Faktur Masukan',
                icon: (
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                ),
                onClick: () => alert(`Faktur Pajak Masukan #${m.nsfp} dari ${m.vendor}`)
            },
            {
                label: 'Edit NSFP Vendor',
                icon: (
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                ),
                onClick: () => {
                    setNsfpModal({ isOpen: true, item: m, type: 'masukan' });
                    setInputNsfp(m.nsfp);
                }
            }
        ];
    };

    return (
        <AppLayout
            activePage="ppn"
            title="Laporan PPN & Pajak"
            breadcrumbs={[{ label: 'Yousee Indonesia' }, { label: 'Accounting' }, { label: 'Rekapitulasi PPN' }]}
        >
            {isPPN ? (
                <div className="w-full space-y-6">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Laporan PPN & Rekonsiliasi e-Faktur Pajak</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                    Mode PPN 11% (PKP Active)
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Monitoring PPN Keluaran Penjualan, PPN Masukan Pembelian, Rekonsiliasi SPT Masa PPN, dan Penyetoran Kas Negara.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => alert("Mengunduh File CSV Import e-Faktur Penjualan DJP Online (Format FK / FAPR)...")}
                                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                            >
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Export CSV e-Faktur DJP</span>
                            </button>

                            <button
                                onClick={() => setNtpnModal(true)}
                                className="bg-primary hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-neon-primary hover:shadow-neon-primary-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Catat Setor PPN (NTPN)</span>
                            </button>
                        </div>
                    </div>

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

                    {/* Executive Metric Cards (4 Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL PPN KELUARAN (SALES)</span>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100">Dipungut</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-900 font-mono block">{fmt(totalKeluaranPpn)}</span>
                            <span className="text-[11px] text-slate-500 font-medium block">Dari total DPP {fmt(totalKeluaranDpp)}</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL PPN MASUKAN (PURCHASES)</span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">Dikreditkan</span>
                            </div>
                            <span className="text-2xl font-bold text-emerald-700 font-mono block">{fmt(totalMasukanPpnCreditable)}</span>
                            <span className="text-[11px] text-slate-500 font-medium block">Dari total DPP {fmt(totalMasukanDpp)}</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STATUS PPN NET MASA PAJAK</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isKurangBayar ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                                    {isKurangBayar ? "Kurang Bayar" : "Lebih Bayar"}
                                </span>
                            </div>
                            <span className={`text-2xl font-bold font-mono block ${isKurangBayar ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {fmt(Math.abs(netPpnAmount))}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block">
                                {isKurangBayar ? "Wajib disetor ke Kas Negara" : "Kompensasi ke Masa Berikutnya"}
                            </span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PENYETORAN KAS NEGARA (NTPN)</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${taxSettlement.status === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                    {taxSettlement.status === 'paid' ? "✓ Lunas Disetor" : "Belum Disetor"}
                                </span>
                            </div>
                            <span className="text-sm font-mono font-bold text-slate-900 block truncate">
                                {taxSettlement.ntpn || 'Belum Ada NTPN'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block">
                                {taxSettlement.paidDate ? `Tanggal Setor: ${formatDateIndo(taxSettlement.paidDate)}` : 'Segera lakukan penyetoran'}
                            </span>
                        </div>
                    </div>

                    {/* Main Tab Navigation & Filter Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/80 w-full sm:w-auto">
                                <button
                                    onClick={() => { setActiveTab('keluaran'); setKeluaranPage(1); }}
                                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        activeTab === 'keluaran' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    <span>PPN Keluaran (Penjualan PKP)</span>
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {ppnKeluaran.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => { setActiveTab('masukan'); setMasukanPage(1); }}
                                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        activeTab === 'masukan' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v25l-4-2-4 2-4-2-4 2V4z" />
                                    </svg>
                                    <span>PPN Masukan (Pembelian PKP)</span>
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {ppnMasukan.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('spt')}
                                    className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                        activeTab === 'spt' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Rekap SPT Masa & NTPN</span>
                                </button>
                            </div>

                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {activeTab === 'keluaran' ? 'Faktur Pajak Penjualan (Faktur Keluaran)' :
                                 activeTab === 'masukan' ? 'Faktur Pajak Pembelian (Faktur Masukan)' :
                                 'Form SPT Masa PPN 1111 & Penyetoran SSE'}
                            </div>
                        </div>

                        {/* Filter Panel Bar */}
                        {activeTab !== 'spt' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:items-end">
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pencarian e-Faktur</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setKeluaranPage(1);
                                                setMasukanPage(1);
                                            }}
                                            placeholder="Cari NSFP, No. Dokumen, Partner, atau NPWP..."
                                            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary transition-all placeholder-slate-400 shadow-2xs"
                                        />
                                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Approval e-Faktur</label>
                                    <SelectInput
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setKeluaranPage(1);
                                            setMasukanPage(1);
                                        }}
                                        options={[
                                            { value: 'all', label: 'Semua Status Approval' },
                                            { value: 'approved', label: '✓ Approval Sukses' },
                                            { value: 'ready', label: 'Siap Upload DJP' },
                                            { value: 'draft', label: 'Draft Faktur' },
                                            ...(activeTab === 'masukan' ? [{ value: 'creditable', label: 'Dapat Dikreditkan' }] : [])
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Masa Pajak</label>
                                    <SelectInput
                                        value={periodFilter}
                                        onChange={(e) => setPeriodFilter(e.target.value)}
                                        options={[
                                            { value: '06-2026', label: 'Masa Juni 2026' },
                                            { value: '05-2026', label: 'Masa Mei 2026' },
                                            { value: '04-2026', label: 'Masa April 2026' },
                                        ]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data Tables */}
                    {activeTab === 'keluaran' && (
                        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                            <th className="py-4 px-6">No. Seri Faktur Pajak (NSFP)</th>
                                            <th className="py-4 px-6">No. Invoice & Tanggal</th>
                                            <th className="py-4 px-6">Client & NPWP</th>
                                            <th className="py-4 px-6 text-right">DPP (IDR)</th>
                                            <th className="py-4 px-6 text-right">PPN 11% (IDR)</th>
                                            <th className="py-4 px-6 text-right">Total Faktur</th>
                                            <th className="py-4 px-6 text-center">Status e-Faktur</th>
                                            <th className="py-4 px-6 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedKeluaran.map((k) => (
                                            <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6 font-mono font-bold text-slate-900">{k.nsfp}</td>
                                                <td className="py-4 px-6">
                                                    <div className="font-mono font-bold text-blue-600">{k.docNo}</div>
                                                    <div className="text-[10.5px] text-slate-400 font-medium">{formatDateIndo(k.date)}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{k.client}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">NPWP: {k.npwp}</div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">{fmt(k.dpp)}</td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-blue-700">{fmt(k.ppn)}</td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">{fmt(k.total)}</td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">{getEfakturBadge(k.efakturStatus)}</td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <ActionDropdown items={getKeluaranActionItems(k)} />
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredKeluaran.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center">
                                                    <EmptyState title="Belum Ada Faktur Keluaran" message="Tidak ditemukan faktur PPN Keluaran yang sesuai dengan pencarian." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredKeluaran.length > 0 && (
                                <div className="p-4 border-t border-slate-100">
                                    <Pagination
                                        currentPage={keluaranPage}
                                        totalPages={Math.ceil(filteredKeluaran.length / ITEMS_PER_PAGE)}
                                        totalItems={filteredKeluaran.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={setKeluaranPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'masukan' && (
                        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left bg-slate-50/40 px-6 py-4">
                                            <th className="py-4 px-6">NSFP Vendor</th>
                                            <th className="py-4 px-6">No. PO & Tanggal</th>
                                            <th className="py-4 px-6">Vendor Partner & NPWP</th>
                                            <th className="py-4 px-6 text-right">DPP (IDR)</th>
                                            <th className="py-4 px-6 text-right">PPN 11% (IDR)</th>
                                            <th className="py-4 px-6 text-center">Status Pengkreditan</th>
                                            <th className="py-4 px-6 text-center">Status e-Faktur</th>
                                            <th className="py-4 px-6 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedMasukan.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6 font-mono font-bold text-slate-900">{m.nsfp}</td>
                                                <td className="py-4 px-6">
                                                    <div className="font-mono font-bold text-amber-700">{m.docNo}</div>
                                                    <div className="text-[10.5px] text-slate-400 font-medium">{formatDateIndo(m.date)}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{m.vendor}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">NPWP: {m.npwp}</div>
                                                </td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">{fmt(m.dpp)}</td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-emerald-700">{fmt(m.ppn)}</td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${m.creditableStatus === 'creditable' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                        {m.creditableStatus === 'creditable' ? "Dapat Dikreditkan" : "Tidak Dikreditkan"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">{getEfakturBadge(m.efakturStatus)}</td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <ActionDropdown items={getMasukanActionItems(m)} />
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredMasukan.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center">
                                                    <EmptyState title="Belum Ada Faktur Masukan" message="Tidak ditemukan faktur PPN Masukan yang sesuai dengan pencarian." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMasukan.length > 0 && (
                                <div className="p-4 border-t border-slate-100">
                                    <Pagination
                                        currentPage={masukanPage}
                                        totalPages={Math.ceil(filteredMasukan.length / ITEMS_PER_PAGE)}
                                        totalItems={filteredMasukan.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={setMasukanPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab SPT Masa PPN */}
                    {activeTab === 'spt' && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Form SPT Masa PPN 1111 (Rekapitulasi Masa Juni 2026)</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Ikhtisar penghitungan PPN Kurang/Lebih Bayar sesuai Lampiran Formulir 1111 AB DJP Online.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Section A: PPN Keluaran */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase">I. PPN Keluaran Dipungut (Penjualan)</span>
                                        <span className="text-xs font-mono font-bold text-blue-700">{fmt(totalKeluaranPpn)}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                                        <div className="flex justify-between">
                                            <span>Ekspor BKP / JKP:</span>
                                            <span className="font-mono">Rp 0</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Penyerahan Dalam Negeri (DPP):</span>
                                            <span className="font-mono">{fmt(totalKeluaranDpp)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PPN Keluaran (11%):</span>
                                            <span className="font-mono font-bold text-slate-900">{fmt(totalKeluaranPpn)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section B: PPN Masukan */}
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase">II. PPN Masukan Dapat Dikreditkan</span>
                                        <span className="text-xs font-mono font-bold text-emerald-700">{fmt(totalMasukanPpnCreditable)}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 space-y-1.5 font-medium">
                                        <div className="flex justify-between">
                                            <span>Perolehan BKP / JKP Dalam Negeri:</span>
                                            <span className="font-mono">{fmt(totalMasukanDpp)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PPN Masukan Dikreditkan:</span>
                                            <span className="font-mono font-bold text-slate-900">{fmt(totalMasukanPpnCreditable)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C: Net Result */}
                            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 space-y-3 text-xs">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                                    <span>III. PPN Net (Kurang / Lebih Bayar Masa Juni 2026):</span>
                                    <span className="font-mono text-base text-blue-800">{fmt(netPpnAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600 font-medium">
                                    <span>Status Penyetoran Kas Negara (NTPN):</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${taxSettlement.status === 'paid' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                        {taxSettlement.status === 'paid' ? `Disetor (${taxSettlement.ntpn})` : 'Belum Disetor'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Non-PPN Mode Active */
                <div className="bg-white p-12 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-4 max-w-2xl mx-auto my-12">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-2xs">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Laporan PPN Dalam Mode Non-PPN</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                        Aplikasi saat ini berjalan dalam **Mode Non-PPN**. Untuk melakukan rekapitulasi PPN Masukan/Keluaran dan export e-Faktur DJP, silakan aktifkan Mode PPN melalui toggle di bagian atas sidebar.
                    </p>
                </div>
            )}

            {/* MODAL: UPDATE NSFP */}
            {nsfpModal && nsfpModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setNsfpModal(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Update Nomor Seri Faktur Pajak (NSFP)</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{nsfpModal.item.docNo}</p>
                            </div>
                            <button onClick={() => setNsfpModal(null)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveNsfp} className="p-6 space-y-4 text-xs">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Nomor Seri Faktur Pajak e-Faktur</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 010.000-26.88219005"
                                    value={inputNsfp}
                                    onChange={(e) => setInputNsfp(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNsfpModal(null)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                                >
                                    Simpan NSFP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CATAT SETORAN PPN (NTPN) */}
            {ntpnModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setNtpnModal(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-fade-in border border-slate-100">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-sm">Catat Setoran PPN Kas Negara (NTPN)</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Bukti Penerimaan Negara Masa Juni 2026</p>
                            </div>
                            <button onClick={() => setNtpnModal(false)} className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveNtpn} className="p-6 space-y-4 text-xs">
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex justify-between items-center font-bold">
                                <span className="text-slate-500">Nominal Kurang Bayar:</span>
                                <span className="font-mono text-sm text-amber-700">{fmt(netPpnAmount)}</span>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Nomor Transaksi Penerimaan Negara (NTPN)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 2606271109281200"
                                    value={inputNtpn}
                                    onChange={(e) => setInputNtpn(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Tanggal Penyetoran Pajak</label>
                                <input
                                    type="date"
                                    required
                                    value={inputPaidDate}
                                    onChange={(e) => setInputPaidDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary transition-all"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Bank Persepsi Penyetor</label>
                                <SelectInput
                                    value={inputBank}
                                    onChange={(e) => setInputBank(e.target.value)}
                                    options={[
                                        { value: 'Bank Mandiri Solo Baru', label: 'Bank Mandiri Solo Baru' },
                                        { value: 'Bank BCA Operasional', label: 'Bank BCA Operasional' },
                                        { value: 'Bank BRI Giro', label: 'Bank BRI Giro' },
                                        { value: 'Pos Indonesia', label: 'Pos Indonesia' },
                                    ]}
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNtpnModal(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                                >
                                    Simpan NTPN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
