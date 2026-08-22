import MonthPicker from '@/Components/Form/MonthPicker';
import SelectInput from '@/Components/Form/SelectInput';
import EmptyState from '@/Components/Table/EmptyState';
import Pagination from '@/Components/Table/Pagination';
import ActionDropdown, { ActionMenuItem } from '@/Components/UI/ActionDropdown';
import AuditLogModal, { AuditLogItem } from '@/Components/UI/AuditLogModal';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import React, { useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────
interface PpnKeluaranItem {
    id: string;
    docNo: string;
    nsfp: string; // Nomor Seri Faktur Pajak
    client: string;
    npwp: string;
    projectName?: string;
    projectCode?: string;
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
    projectName?: string;
    projectCode?: string;
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

export interface PpnReportProps {
    initialPpnKeluaran?: PpnKeluaranItem[];
    initialPpnMasukan?: PpnMasukanItem[];
    auditLogs?: AuditLogItem[];
}

const fmt = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const ITEMS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function PpnReport({
    initialPpnKeluaran = [],
    initialPpnMasukan = [],
    auditLogs = [],
}: PpnReportProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeTab, setActiveTab] = useState<'keluaran' | 'masukan' | 'spt'>(
        'keluaran',
    );

    // Data PPN Keluaran (Penjualan Client PKP) dari Database
    const [ppnKeluaran, setPpnKeluaran] = useState<PpnKeluaranItem[]>(
        () => initialPpnKeluaran || [],
    );

    // Data PPN Masukan (Pembelian Vendor PKP) dari Database
    const [ppnMasukan, setPpnMasukan] = useState<PpnMasukanItem[]>(
        () => initialPpnMasukan || [],
    );

    // Filter states
    const now = new Date();
    const currentYearStr = now.getFullYear().toString();
    const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

    // Data Setoran Pajak Masa PPN
    const [taxSettlement, setTaxSettlement] = useState<TaxSettlementRecord>({
        taxPeriod: `Masa ${currentMonthStr}-${currentYearStr}`,
        ppnKeluaranTotal: 0,
        ppnMasukanTotal: 0,
        netAmount: 0,
        status: 'unpaid',
        ntpn: '',
        paidDate: '',
        bankName: 'Bank Mandiri Solo Baru',
    });

    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
    const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
    const [keluaranPage, setKeluaranPage] = useState(1);
    const [masukanPage, setMasukanPage] = useState(1);

    // Modal states
    const [nsfpModal, setNsfpModal] = useState<{
        isOpen: boolean;
        item: any;
        type: 'keluaran' | 'masukan';
    } | null>(null);
    const [ntpnModal, setNtpnModal] = useState(false);
    const [inputNsfp, setInputNsfp] = useState('');
    const [inputNtpn, setInputNtpn] = useState(taxSettlement.ntpn || '');
    const [inputPaidDate, setInputPaidDate] = useState(
        taxSettlement.paidDate || new Date().toISOString().split('T')[0],
    );
    const [inputBank, setInputBank] = useState(
        taxSettlement.bankName || 'Bank Mandiri Solo Baru',
    );
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    const periodFilterLabel =
        selectedYear !== 'all' && selectedMonth !== 'all'
            ? `Masa ${selectedMonth}-${selectedYear}`
            : 'Semua Periode';

    // Export Handlers
    const handleExportExcel = () => {
        let csvContent = `data:text/csv;charset=utf-8,\uFEFF`;

        csvContent += `REKAPITULASI LAPORAN PPN & PEMBAYARAN KAS NEGARA (DJP)\n`;
        csvContent += `PERIODE MASA PAJAK: ${periodFilterLabel}\n`;
        csvContent += `TANGGAL DICETAK: ${new Date().toLocaleDateString('id-ID')}\n\n`;

        csvContent += `1. RINGKASAN MASA PAJAK & PENYETORAN NTPN\n`;
        csvContent += `Keterangan,Nilai (IDR)\n`;
        csvContent += `Total DPP PPN Keluaran,${totalKeluaranDpp}\n`;
        csvContent += `Total PPN Keluaran (Penjualan),${totalKeluaranPpn}\n`;
        csvContent += `Total DPP PPN Masukan,${totalMasukanDpp}\n`;
        csvContent += `Total PPN Masukan Terkreditkan (Pembelian),${totalMasukanPpnCreditable}\n`;
        csvContent += `Selisih PPN (${isKurangBayar ? 'Kurang Bayar / Terutang' : 'Lebih Bayar'}),${Math.abs(netPpnAmount)}\n`;
        csvContent += `Status Penyetoran Kas Negara,${taxSettlement.status === 'paid' ? 'LUNAS DISETOR' : 'BELUM DISETOR'}\n`;
        csvContent += `Nomor Transaksi Penerimaan Negara (NTPN),${taxSettlement.ntpn || '-'}\n`;
        csvContent += `Tanggal Setor NTPN,${taxSettlement.paidDate || '-'}\n`;
        csvContent += `Bank Penyetor,${taxSettlement.bankName || '-'}\n\n`;

        csvContent += `2. RINCIAN PPN KELUARAN (FAKTUR PAJAK PENJUALAN PER INVOICE)\n`;
        csvContent += `No. Dokumen Invoice,Nomor Seri Faktur Pajak (NSFP),Tanggal Invoice,Nama Client,NPWP Client,DPP (IDR),PPN 11% (IDR),Total Invoice (IDR),Status e-Faktur\n`;
        filteredKeluaran.forEach((k) => {
            csvContent += `"${k.docNo}","${k.nsfp}","${k.date}","${k.client}","${k.npwp}",${k.dpp},${k.ppn},${k.total},"${k.efakturStatus}"\n`;
        });
        csvContent += `TOTAL KELUARAN,,,,${totalKeluaranDpp},${totalKeluaranPpn},${totalKeluaranDpp + totalKeluaranPpn},\n\n`;

        csvContent += `3. RINCIAN PPN MASUKAN (FAKTUR PAJAK PEMBELIAN PER PO VENDOR)\n`;
        csvContent += `No. Dokumen PO,Nomor Seri Faktur Pajak (NSFP),Tanggal PO,Nama Vendor,NPWP Vendor,DPP (IDR),PPN 11% (IDR),Total PO (IDR),Pengkreditan,Status e-Faktur\n`;
        filteredMasukan.forEach((m) => {
            csvContent += `"${m.docNo}","${m.nsfp}","${m.date}","${m.vendor}","${m.npwp}",${m.dpp},${m.ppn},${m.total},"${m.creditableStatus}","${m.efakturStatus}"\n`;
        });
        csvContent += `TOTAL MASUKAN TERKREDITKAN,,,,${totalMasukanDpp},${totalMasukanPpnCreditable},${totalMasukanDpp + totalMasukanPpnCreditable},\n`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `Laporan_PPN_DJP_${selectedMonth}-${selectedYear}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCsvEfaktur = () => {
        // Format baku skema impor e-Faktur DJP
        // Menggunakan formula text ="..." agar saat dibuka langsung di Microsoft Excel, nomor faktur 16 digit dan NPWP 15 digit tidak diubah paksa oleh Excel menjadi eksponensial (1E+14 / 1.65E+13)
        let content = `FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI\n`;
        filteredKeluaran.forEach((k) => {
            const [yyyy, mm, dd] = k.date.split('-');
            const cleanNsfp = k.nsfp.replace(/[^0-9]/g, '');
            const cleanNpwp = k.npwp
                ? k.npwp.replace(/[^0-9]/g, '')
                : '000000000000000';
            const formattedDate = `${dd}/${mm}/${yyyy}`; // Format DD/MM/YYYY
            const safeClient = (k.client || 'Client Umum').replace(/"/g, '""');
            const safeDocNo = (k.docNo || '').replace(/"/g, '""');

            // Force text formatting di Excel dengan '="010000..."'
            content += `FK,01,0,="${cleanNsfp}",${parseInt(mm, 10)},${yyyy},="${formattedDate}",="${cleanNpwp}","${safeClient}","Indonesia",${Math.round(k.dpp)},${Math.round(k.ppn)},0,,,0,0,0,"${safeDocNo}"\n`;
        });

        // Simpan file CSV dengan UTF-8 BOM
        const blob = new Blob(['\uFEFF' + content], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `eFaktur_FK_Penjualan_${selectedMonth}-${selectedYear}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPdf = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/ppn-pdf';
        form.target = '_blank';

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';

        const appendInput = (name: string, value: unknown) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value =
                typeof value === 'object' && value !== null
                    ? JSON.stringify(value)
                    : String(value ?? '');
            form.appendChild(input);
        };

        appendInput('_token', csrfToken);
        appendInput('period', `${selectedMonth}-${selectedYear}`);
        appendInput('periodLabel', periodFilterLabel);

        appendInput('taxSettlement[taxPeriod]', taxSettlement.taxPeriod);
        appendInput('taxSettlement[ppnKeluaranTotal]', totalKeluaranPpn);
        appendInput(
            'taxSettlement[ppnMasukanTotal]',
            totalMasukanPpnCreditable,
        );
        appendInput('taxSettlement[netAmount]', netPpnAmount);
        appendInput('taxSettlement[status]', taxSettlement.status);
        appendInput('taxSettlement[ntpn]', taxSettlement.ntpn || '-');
        appendInput('taxSettlement[paidDate]', taxSettlement.paidDate || '-');
        appendInput('taxSettlement[bankName]', taxSettlement.bankName || '-');

        filteredKeluaran.forEach((k, idx) => {
            appendInput(`ppnKeluaran[${idx}][docNo]`, k.docNo);
            appendInput(`ppnKeluaran[${idx}][nsfp]`, k.nsfp);
            appendInput(`ppnKeluaran[${idx}][date]`, k.date);
            appendInput(`ppnKeluaran[${idx}][client]`, k.client);
            appendInput(`ppnKeluaran[${idx}][npwp]`, k.npwp);
            appendInput(`ppnKeluaran[${idx}][dpp]`, k.dpp);
            appendInput(`ppnKeluaran[${idx}][ppn]`, k.ppn);
            appendInput(`ppnKeluaran[${idx}][total]`, k.total);
            appendInput(`ppnKeluaran[${idx}][efakturStatus]`, k.efakturStatus);
        });

        filteredMasukan.forEach((m, idx) => {
            appendInput(`ppnMasukan[${idx}][docNo]`, m.docNo);
            appendInput(`ppnMasukan[${idx}][nsfp]`, m.nsfp);
            appendInput(`ppnMasukan[${idx}][date]`, m.date);
            appendInput(`ppnMasukan[${idx}][vendor]`, m.vendor);
            appendInput(`ppnMasukan[${idx}][npwp]`, m.npwp);
            appendInput(`ppnMasukan[${idx}][dpp]`, m.dpp);
            appendInput(`ppnMasukan[${idx}][ppn]`, m.ppn);
            appendInput(`ppnMasukan[${idx}][total]`, m.total);
            appendInput(
                `ppnMasukan[${idx}][creditableStatus]`,
                m.creditableStatus,
            );
            appendInput(`ppnMasukan[${idx}][efakturStatus]`, m.efakturStatus);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // Filtered Lists
    const filteredKeluaran = useMemo(() => {
        return ppnKeluaran.filter((k) => {
            const matchesSearch =
                k.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.nsfp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                k.npwp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (k.projectName &&
                    k.projectName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())) ||
                (k.projectCode &&
                    k.projectCode
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            let matchesStatus = true;
            if (statusFilter === 'approved')
                matchesStatus = k.efakturStatus === 'approved';
            else if (statusFilter === 'ready')
                matchesStatus = k.efakturStatus === 'ready';
            else if (statusFilter === 'draft')
                matchesStatus = k.efakturStatus === 'draft';

            let matchesPeriod = true;
            if (selectedMonth !== 'all') {
                matchesPeriod =
                    matchesPeriod &&
                    k.date.startsWith(`${selectedYear}-${selectedMonth}`);
            } else if (selectedYear !== 'all') {
                matchesPeriod =
                    matchesPeriod && k.date.startsWith(`${selectedYear}-`);
            }

            return matchesSearch && matchesStatus && matchesPeriod;
        });
    }, [ppnKeluaran, searchQuery, statusFilter, selectedMonth, selectedYear]);

    const filteredMasukan = useMemo(() => {
        return ppnMasukan.filter((m) => {
            const matchesSearch =
                m.docNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.nsfp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.npwp.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.projectName &&
                    m.projectName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())) ||
                (m.projectCode &&
                    m.projectCode
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()));

            let matchesStatus = true;
            if (statusFilter === 'approved')
                matchesStatus = m.efakturStatus === 'approved';
            else if (statusFilter === 'ready')
                matchesStatus = m.efakturStatus === 'ready';
            else if (statusFilter === 'draft')
                matchesStatus = m.efakturStatus === 'draft';
            else if (statusFilter === 'creditable')
                matchesStatus = m.creditableStatus === 'creditable';

            let matchesPeriod = true;
            if (selectedMonth !== 'all') {
                matchesPeriod =
                    matchesPeriod &&
                    m.date.startsWith(`${selectedYear}-${selectedMonth}`);
            } else if (selectedYear !== 'all') {
                matchesPeriod =
                    matchesPeriod && m.date.startsWith(`${selectedYear}-`);
            }

            return matchesSearch && matchesStatus && matchesPeriod;
        });
    }, [ppnMasukan, searchQuery, statusFilter, selectedMonth, selectedYear]);

    // Dynamic Calculations based on Filtered datasets
    const totalKeluaranDpp = filteredKeluaran.reduce((s, k) => s + k.dpp, 0);
    const totalKeluaranPpn = filteredKeluaran.reduce((s, k) => s + k.ppn, 0);

    const totalMasukanDpp = filteredMasukan.reduce((s, m) => s + m.dpp, 0);
    const totalMasukanPpnCreditable = filteredMasukan
        .filter((m) => m.creditableStatus === 'creditable')
        .reduce((s, m) => s + m.ppn, 0);

    const netPpnAmount = totalKeluaranPpn - totalMasukanPpnCreditable;
    const isKurangBayar = netPpnAmount >= 0;

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
            setPpnKeluaran((prev) =>
                prev.map((k) =>
                    k.id === nsfpModal.item.id
                        ? { ...k, nsfp: inputNsfp, efakturStatus: 'approved' }
                        : k,
                ),
            );
        } else {
            setPpnMasukan((prev) =>
                prev.map((m) =>
                    m.id === nsfpModal.item.id
                        ? { ...m, nsfp: inputNsfp, efakturStatus: 'approved' }
                        : m,
                ),
            );
        }

        setNsfpModal(null);
        setSuccessAlert(
            `Nomor Seri Faktur Pajak (NSFP) ${inputNsfp} berhasil diperbarui.`,
        );
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Save NTPN Settlement Modal
    const handleSaveNtpn = (e: React.FormEvent) => {
        e.preventDefault();
        setTaxSettlement((prev) => ({
            ...prev,
            status: 'paid',
            ntpn: inputNtpn,
            paidDate: inputPaidDate,
            bankName: inputBank,
        }));
        setNtpnModal(false);
        setSuccessAlert(
            `Sukses! Pembayaran PPN Kurang Bayar ke Kas Negara berhasil dicatat (NTPN: ${inputNtpn}).`,
        );
        setTimeout(() => setSuccessAlert(null), 5000);
    };

    // Status Badge Helpers
    const getEfakturBadge = (status: 'approved' | 'ready' | 'draft') => {
        switch (status) {
            case 'approved':
                return (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        ✓ Approval Sukses
                    </span>
                );
            case 'ready':
                return (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                        Siap Upload DJP
                    </span>
                );
            case 'draft':
                return (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Draft Faktur
                    </span>
                );
        }
    };

    // Action Items for Table Rows
    const getKeluaranActionItems = (k: PpnKeluaranItem): ActionMenuItem[] => {
        return [
            {
                label: 'Edit Nomor Seri (NSFP)',
                icon: (
                    <svg
                        className="h-4 w-4 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                ),
                onClick: () => {
                    setNsfpModal({ isOpen: true, item: k, type: 'keluaran' });
                    setInputNsfp(k.nsfp);
                },
            },
        ];
    };

    const getMasukanActionItems = (m: PpnMasukanItem): ActionMenuItem[] => {
        return [
            {
                label: 'Detail Faktur Masukan',
                icon: (
                    <svg
                        className="h-4 w-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                ),
                onClick: () =>
                    alert(`Faktur Pajak Masukan #${m.nsfp} dari ${m.vendor}`),
            },
            {
                label: 'Edit NSFP Vendor',
                icon: (
                    <svg
                        className="h-4 w-4 text-slate-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                    </svg>
                ),
                onClick: () => {
                    setNsfpModal({ isOpen: true, item: m, type: 'masukan' });
                    setInputNsfp(m.nsfp);
                },
            },
        ];
    };

    return (
        <AppLayout
            activePage="ppn"
            title="Laporan PPN & Pajak"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Accounting' },
                { label: 'Rekapitulasi PPN' },
            ]}
        >
            {isPPN ? (
                <div className="w-full space-y-6">
                    {/* Header Section */}
                    <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <h2 className="text-base font-bold tracking-tight text-slate-900">
                                    Laporan PPN & Rekonsiliasi e-Faktur Pajak
                                </h2>
                                <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-800">
                                    Mode PPN 11% (PKP Active)
                                </span>
                            </div>
                            <p className="text-xs font-medium text-slate-500">
                                Monitoring PPN Keluaran Penjualan, PPN Masukan
                                Pembelian, Rekonsiliasi SPT Masa PPN, dan
                                Penyetoran Kas Negara.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:w-auto">
                            <button
                                type="button"
                                onClick={() => setIsAuditLogModalOpen(true)}
                                title="Riwayat Jejak Audit & Log Aktivitas PPN / e-Faktur"
                                className="shadow-xs inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </button>

                            <button
                                onClick={handleExportExcel}
                                className="shadow-2xs flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                                title="Unduh Rekapitulasi Laporan PPN Internal (Format Excel / CSV untuk Arsip Keuangan & Meeting Manajemen)"
                            >
                                <svg
                                    className="h-4 w-4 text-emerald-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Export Excel</span>
                            </button>

                            <button
                                onClick={handleExportPdf}
                                className="shadow-2xs flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                                title="Cetak / Unduh Dokumen PDF Resmi SPT Masa PPN 1111 Lengkap dengan Rincian Pajak"
                            >
                                <svg
                                    className="h-4 w-4 text-rose-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                </svg>
                                <span>Cetak / PDF</span>
                            </button>

                            <button
                                onClick={handleExportCsvEfaktur}
                                className="shadow-2xs flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-800 transition-all hover:bg-blue-100"
                                title="Unduh Skema Impor CSV e-Faktur Resmi untuk Diunggah (Upload Massal) Langsung ke Aplikasi e-Faktur DJP Online Tanpa Ketik Manual"
                            >
                                <svg
                                    className="h-4 w-4 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                    />
                                </svg>
                                <span>CSV e-Faktur</span>
                            </button>

                            <button
                                onClick={() => setNtpnModal(true)}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-neon-primary transition-all duration-300 hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>Pembayaran PPN (NTPN)</span>
                            </button>
                        </div>
                    </div>

                    {/* Success Alert Banner */}
                    {successAlert && (
                        <div className="animate-fade-in shadow-2xs flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-all">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <div className="text-xs font-bold leading-tight text-emerald-900">
                                {successAlert}
                            </div>
                        </div>
                    )}

                    {/* Executive Metric Cards (4 Grid) */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    TOTAL PPN KELUARAN (SALES)
                                </span>
                                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    Dipungut
                                </span>
                            </div>
                            <span className="block font-mono text-2xl font-bold text-slate-900">
                                {fmt(totalKeluaranPpn)}
                            </span>
                            <span className="block text-[11px] font-medium text-slate-500">
                                Dari total DPP {fmt(totalKeluaranDpp)}
                            </span>
                        </div>

                        <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    TOTAL PPN MASUKAN (PURCHASES)
                                </span>
                                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    Dikreditkan
                                </span>
                            </div>
                            <span className="block font-mono text-2xl font-bold text-emerald-700">
                                {fmt(totalMasukanPpnCreditable)}
                            </span>
                            <span className="block text-[11px] font-medium text-slate-500">
                                Dari total DPP {fmt(totalMasukanDpp)}
                            </span>
                        </div>

                        <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    STATUS PPN NET MASA PAJAK
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${isKurangBayar ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
                                >
                                    {isKurangBayar
                                        ? 'Kurang Bayar'
                                        : 'Lebih Bayar'}
                                </span>
                            </div>
                            <span
                                className={`block font-mono text-2xl font-bold ${isKurangBayar ? 'text-amber-700' : 'text-emerald-700'}`}
                            >
                                {fmt(Math.abs(netPpnAmount))}
                            </span>
                            <span className="block text-[11px] font-medium text-slate-500">
                                {isKurangBayar
                                    ? 'Wajib disetor ke Kas Negara'
                                    : 'Kompensasi ke Masa Berikutnya'}
                            </span>
                        </div>

                        <div className="shadow-xs space-y-2 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    PENYETORAN KAS NEGARA (NTPN)
                                </span>
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${taxSettlement.status === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}
                                >
                                    {taxSettlement.status === 'paid'
                                        ? '✓ Lunas Disetor'
                                        : 'Belum Disetor'}
                                </span>
                            </div>
                            <span className="block truncate font-mono text-sm font-bold text-slate-900">
                                {taxSettlement.ntpn || 'Belum Ada NTPN'}
                            </span>
                            <span className="block text-[11px] font-medium text-slate-500">
                                {taxSettlement.paidDate
                                    ? `Tanggal Setor: ${formatDateIndo(taxSettlement.paidDate)}`
                                    : 'Segera lakukan penyetoran'}
                            </span>
                        </div>
                    </div>

                    {/* Main Tab Navigation & Filter Panel */}
                    <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
                            <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
                                <button
                                    onClick={() => {
                                        setActiveTab('keluaran');
                                        setKeluaranPage(1);
                                    }}
                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                        activeTab === 'keluaran'
                                            ? 'shadow-2xs bg-white text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                    <span>PPN Keluaran (Penjualan PKP)</span>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800">
                                        {ppnKeluaran.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => {
                                        setActiveTab('masukan');
                                        setMasukanPage(1);
                                    }}
                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                        activeTab === 'masukan'
                                            ? 'shadow-2xs bg-white text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4 text-emerald-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v25l-4-2-4 2-4-2-4 2V4z"
                                        />
                                    </svg>
                                    <span>PPN Masukan (Pembelian PKP)</span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                                        {ppnMasukan.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('spt')}
                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                        activeTab === 'spt'
                                            ? 'shadow-2xs bg-white text-slate-900'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <svg
                                        className="h-4 w-4 text-purple-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <span>Rekap SPT Masa & NTPN</span>
                                </button>
                            </div>

                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {activeTab === 'keluaran'
                                    ? 'Faktur Pajak Penjualan (Faktur Keluaran)'
                                    : activeTab === 'masukan'
                                      ? 'Faktur Pajak Pembelian (Faktur Masukan)'
                                      : 'Form SPT Masa PPN 1111 & Penyetoran SSE'}
                            </div>
                        </div>

                        {/* Filter Panel Bar */}
                        {activeTab !== 'spt' && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Pencarian e-Faktur
                                    </label>
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
                                            className="shadow-2xs w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all focus:border-primary focus:outline-none"
                                        />
                                        <svg
                                            className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Status Approval e-Faktur
                                    </label>
                                    <SelectInput
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setKeluaranPage(1);
                                            setMasukanPage(1);
                                        }}
                                        options={[
                                            {
                                                value: 'all',
                                                label: 'Semua Status Approval',
                                            },
                                            {
                                                value: 'approved',
                                                label: '✓ Approval Sukses',
                                            },
                                            {
                                                value: 'ready',
                                                label: 'Siap Upload DJP',
                                            },
                                            {
                                                value: 'draft',
                                                label: 'Draft Faktur',
                                            },
                                            ...(activeTab === 'masukan'
                                                ? [
                                                      {
                                                          value: 'creditable',
                                                          label: 'Dapat Dikreditkan',
                                                      },
                                                  ]
                                                : []),
                                        ]}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Masa Pajak
                                    </label>
                                    <MonthPicker
                                        value={
                                            selectedYear !== 'all' &&
                                            selectedMonth !== 'all'
                                                ? `${selectedYear}-${selectedMonth}`
                                                : 'all'
                                        }
                                        onChange={(_val, yr, mo) => {
                                            setSelectedYear(yr);
                                            setSelectedMonth(mo);
                                            setKeluaranPage(1);
                                            setMasukanPage(1);
                                        }}
                                        allowAll={true}
                                        allLabel="Semua Masa Pajak"
                                        className="w-full [&>button]:w-full [&>button]:justify-between [&>button]:py-2.5"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Data Tables */}
                    {activeTab === 'keluaran' && (
                        <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                No. Seri Faktur Pajak (NSFP)
                                            </th>
                                            <th className="px-6 py-4">
                                                No. Invoice & Tanggal
                                            </th>
                                            <th className="px-6 py-4">
                                                Client & NPWP
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                DPP (IDR)
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                PPN 11% (IDR)
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                Total Faktur
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status e-Faktur
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedKeluaran.map((k) => (
                                            <tr
                                                key={k.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                                    {k.nsfp}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-blue-600">
                                                        {k.docNo}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(k.date)}
                                                    </div>
                                                    {k.projectName &&
                                                        k.projectName !==
                                                            '-' && (
                                                            <div className="mt-0.5 inline-block rounded border border-blue-100 bg-blue-50/60 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700">
                                                                📁{' '}
                                                                {k.projectName}
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {k.client}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-slate-400">
                                                        NPWP: {k.npwp}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                                    {fmt(k.dpp)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-blue-700">
                                                    {fmt(k.ppn)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                                    {fmt(k.total)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    {getEfakturBadge(
                                                        k.efakturStatus,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <ActionDropdown
                                                        items={getKeluaranActionItems(
                                                            k,
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredKeluaran.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="py-12 text-center"
                                                >
                                                    <EmptyState
                                                        title="Belum Ada Faktur Keluaran"
                                                        message="Tidak ditemukan faktur PPN Keluaran yang sesuai dengan pencarian."
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredKeluaran.length > 0 && (
                                <div className="border-t border-slate-100 p-4">
                                    <Pagination
                                        currentPage={keluaranPage}
                                        totalPages={Math.ceil(
                                            filteredKeluaran.length /
                                                ITEMS_PER_PAGE,
                                        )}
                                        totalItems={filteredKeluaran.length}
                                        itemsPerPage={ITEMS_PER_PAGE}
                                        onPageChange={setKeluaranPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'masukan' && (
                        <div className="shadow-xs overflow-hidden rounded-2xl border border-slate-100/80 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40 px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <th className="px-6 py-4">
                                                NSFP Vendor
                                            </th>
                                            <th className="px-6 py-4">
                                                No. PO & Tanggal
                                            </th>
                                            <th className="px-6 py-4">
                                                Vendor Partner & NPWP
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                DPP (IDR)
                                            </th>
                                            <th className="px-6 py-4 text-right">
                                                PPN 11% (IDR)
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status Pengkreditan
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Status e-Faktur
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedMasukan.map((m) => (
                                            <tr
                                                key={m.id}
                                                className="transition-colors hover:bg-slate-50/50"
                                            >
                                                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                                    {m.nsfp}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-mono font-bold text-amber-700">
                                                        {m.docNo}
                                                    </div>
                                                    <div className="text-[10.5px] font-medium text-slate-400">
                                                        {formatDateIndo(m.date)}
                                                    </div>
                                                    {m.projectName &&
                                                        m.projectName !==
                                                            '-' && (
                                                            <div className="mt-0.5 inline-block rounded border border-amber-100 bg-amber-50/60 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800">
                                                                📁{' '}
                                                                {m.projectName}
                                                            </div>
                                                        )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800">
                                                        {m.vendor}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-slate-400">
                                                        NPWP: {m.npwp}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                                                    {fmt(m.dpp)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">
                                                    {fmt(m.ppn)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${m.creditableStatus === 'creditable' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}
                                                    >
                                                        {m.creditableStatus ===
                                                        'creditable'
                                                            ? 'Dapat Dikreditkan'
                                                            : 'Tidak Dikreditkan'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    {getEfakturBadge(
                                                        m.efakturStatus,
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <ActionDropdown
                                                        items={getMasukanActionItems(
                                                            m,
                                                        )}
                                                    />
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredMasukan.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="py-12 text-center"
                                                >
                                                    <EmptyState
                                                        title="Belum Ada Faktur Masukan"
                                                        message="Tidak ditemukan faktur PPN Masukan yang sesuai dengan pencarian."
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMasukan.length > 0 && (
                                <div className="border-t border-slate-100 p-4">
                                    <Pagination
                                        currentPage={masukanPage}
                                        totalPages={Math.ceil(
                                            filteredMasukan.length /
                                                ITEMS_PER_PAGE,
                                        )}
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
                        <div className="shadow-xs space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6">
                            <div>
                                <h3 className="text-sm font-bold tracking-tight text-slate-900">
                                    Form SPT Masa PPN 1111 (Rekapitulasi Masa
                                    Juni 2026)
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    Ikhtisar penghitungan PPN Kurang/Lebih Bayar
                                    sesuai Lampiran Formulir 1111 AB DJP Online.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Section A: PPN Keluaran */}
                                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs font-bold uppercase text-slate-800">
                                            I. PPN Keluaran Dipungut (Penjualan)
                                        </span>
                                        <span className="font-mono text-xs font-bold text-blue-700">
                                            {fmt(totalKeluaranPpn)}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                                        <div className="flex justify-between">
                                            <span>Ekspor BKP / JKP:</span>
                                            <span className="font-mono">
                                                Rp 0
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>
                                                Penyerahan Dalam Negeri (DPP):
                                            </span>
                                            <span className="font-mono">
                                                {fmt(totalKeluaranDpp)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>PPN Keluaran (11%):</span>
                                            <span className="font-mono font-bold text-slate-900">
                                                {fmt(totalKeluaranPpn)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section B: PPN Masukan */}
                                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <span className="text-xs font-bold uppercase text-slate-800">
                                            II. PPN Masukan Dapat Dikreditkan
                                        </span>
                                        <span className="font-mono text-xs font-bold text-emerald-700">
                                            {fmt(totalMasukanPpnCreditable)}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 text-xs font-medium text-slate-600">
                                        <div className="flex justify-between">
                                            <span>
                                                Perolehan BKP / JKP Dalam
                                                Negeri:
                                            </span>
                                            <span className="font-mono">
                                                {fmt(totalMasukanDpp)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>
                                                PPN Masukan Dikreditkan:
                                            </span>
                                            <span className="font-mono font-bold text-slate-900">
                                                {fmt(totalMasukanPpnCreditable)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section C: Net Result */}
                            <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-xs">
                                <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                                    <span>
                                        III. PPN Net (Kurang / Lebih Bayar Masa
                                        Juni 2026):
                                    </span>
                                    <span className="font-mono text-base text-blue-800">
                                        {fmt(netPpnAmount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between font-medium text-slate-600">
                                    <span>
                                        Status Penyetoran Kas Negara (NTPN):
                                    </span>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-bold ${taxSettlement.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                                    >
                                        {taxSettlement.status === 'paid'
                                            ? `Disetor (${taxSettlement.ntpn})`
                                            : 'Belum Disetor'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Non-PPN Mode Active */
                <div className="shadow-xs mx-auto my-12 flex max-w-2xl flex-col items-center justify-center space-y-4 rounded-3xl border border-slate-200/80 bg-white p-12 text-center">
                    <div className="shadow-2xs flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500">
                        <svg
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                        Laporan PPN Dalam Mode Non-PPN
                    </h3>
                    <p className="max-w-md text-xs font-medium leading-relaxed text-slate-500">
                        Aplikasi saat ini berjalan dalam **Mode Non-PPN**. Untuk
                        melakukan rekapitulasi PPN Masukan/Keluaran dan export
                        e-Faktur DJP, silakan aktifkan Mode PPN melalui toggle
                        di bagian atas sidebar.
                    </p>
                </div>
            )}

            {/* MODAL: UPDATE NSFP */}
            {nsfpModal && nsfpModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setNsfpModal(null)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Update Nomor Seri Faktur Pajak (NSFP)
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    {nsfpModal.item.docNo}
                                </p>
                            </div>
                            <button
                                onClick={() => setNsfpModal(null)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveNsfp}
                            className="space-y-4 p-6 text-xs"
                        >
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Nomor Seri Faktur Pajak e-Faktur
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 010.000-26.88219005"
                                    value={inputNsfp}
                                    onChange={(e) =>
                                        setInputNsfp(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setNsfpModal(null)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
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
                    <div
                        className="backdrop-blur-xs absolute inset-0 bg-slate-950/60"
                        onClick={() => setNtpnModal(false)}
                    />
                    <div className="animate-fade-in relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
                        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Pembayaran PPN Kas Negara (NTPN)
                                </h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-400">
                                    Bukti Penerimaan Negara Masa Juni 2026
                                </p>
                            </div>
                            <button
                                onClick={() => setNtpnModal(false)}
                                className="cursor-pointer text-xs font-bold text-slate-400 transition-all hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveNtpn}
                            className="space-y-4 p-6 text-xs"
                        >
                            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 font-bold">
                                <span className="text-slate-500">
                                    Nominal Kurang Bayar:
                                </span>
                                <span className="font-mono text-sm text-amber-700">
                                    {fmt(netPpnAmount)}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Nomor Transaksi Penerimaan Negara (NTPN)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: 2606271109281200"
                                    value={inputNtpn}
                                    onChange={(e) =>
                                        setInputNtpn(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs font-bold text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Tanggal Penyetoran Pajak
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={inputPaidDate}
                                    onChange={(e) =>
                                        setInputPaidDate(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-900 transition-all focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700">
                                    Bank Persepsi Penyetor
                                </label>
                                <SelectInput
                                    value={inputBank}
                                    onChange={(e) =>
                                        setInputBank(e.target.value)
                                    }
                                    options={[
                                        {
                                            value: 'Bank Mandiri Solo Baru',
                                            label: 'Bank Mandiri Solo Baru',
                                        },
                                        {
                                            value: 'Bank BCA Operasional',
                                            label: 'Bank BCA Operasional',
                                        },
                                        {
                                            value: 'Bank BRI Giro',
                                            label: 'Bank BRI Giro',
                                        },
                                        {
                                            value: 'Pos Indonesia',
                                            label: 'Pos Indonesia',
                                        },
                                    ]}
                                />
                            </div>

                            <div className="flex gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setNtpnModal(false)}
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-neon-primary transition-all hover:bg-primary-700"
                                >
                                    Simpan NTPN
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Jejak Audit & Log Aktivitas PPN */}
            <AuditLogModal
                show={isAuditLogModalOpen}
                onClose={() => setIsAuditLogModalOpen(false)}
                title="Jejak Audit & Log Aktivitas PPN / e-Faktur"
                subtitle="Riwayat audit pemungutan PPN penjualan (invoice), PPN masukan (PO), pengisian nomor seri faktur pajak (NSFP), dan pencatatan setor kas negara (NTPN)"
                logs={auditLogs}
                eventOptions={[
                    { value: 'all', label: 'Semua Jenis Aktivitas' },
                    {
                        value: 'created',
                        label: '🟢 Faktur PPN Baru Diterbitkan',
                    },
                    {
                        value: 'updated',
                        label: '🟡 Update Nomor Seri Faktur (NSFP)',
                    },
                    {
                        value: 'payment_settled',
                        label: '🔵 Penyetoran Kas Negara (NTPN)',
                    },
                ]}
            />
        </AppLayout>
    );
}
