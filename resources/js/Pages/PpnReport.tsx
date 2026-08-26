import AuditLogModal from '@/Components/UI/AuditLogModal';
import ExcelButton from '@/Components/Button/ExcelButton';
import PrintButton from '@/Components/Button/PrintButton';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import DetailFakturModal from './PpnReport/Components/DetailFakturModal';
import NsfpEditModal from './PpnReport/Components/NsfpEditModal';
import NtpnSettlementModal from './PpnReport/Components/NtpnSettlementModal';
import PpnInfoModal from './PpnReport/Components/PpnInfoModal';
import PpnMetricsCards from './PpnReport/Components/PpnMetricsCards';
import {
    DetailModalState,
    NsfpModalState,
    PpnKeluaranItem,
    PpnMasukanItem,
    PpnReportProps,
    TaxSettlementRecord,
} from './PpnReport/ppnTypes';
import PpnKeluaranTab from './PpnReport/Tabs/PpnKeluaranTab';
import PpnMasukanTab from './PpnReport/Tabs/PpnMasukanTab';
import PpnSptTab from './PpnReport/Tabs/PpnSptTab';

const ITEMS_PER_PAGE = 10;

export default function PpnReport({
    initialPpnKeluaran = [],
    initialPpnMasukan = [],
    initialTaxSettlements = [],
    lockedPeriods = [],
    auditLogs = [],
}: PpnReportProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeTab, setActiveTab] = useState<'keluaran' | 'masukan' | 'spt'>(
        'spt',
    );

    // Data PPN Keluaran & Masukan
    const [ppnKeluaran, setPpnKeluaran] = useState<PpnKeluaranItem[]>(
        () => initialPpnKeluaran || [],
    );
    const [ppnMasukan, setPpnMasukan] = useState<PpnMasukanItem[]>(
        () => initialPpnMasukan || [],
    );
    const [taxSettlements, setTaxSettlements] = useState<TaxSettlementRecord[]>(
        () => initialTaxSettlements || [],
    );

    useEffect(() => {
        if (initialTaxSettlements) {
            setTaxSettlements(initialTaxSettlements);
        }
    }, [initialTaxSettlements]);

    // Filter states
    const now = new Date();
    const currentYearStr = now.getFullYear().toString();
    const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');

    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
    const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
    const [keluaranPage, setKeluaranPage] = useState(1);
    const [masukanPage, setMasukanPage] = useState(1);

    // Lock status per selected period (Closing Period)
    const isPeriodLocked = useMemo(() => {
        if (selectedYear === 'all' || selectedMonth === 'all') return false;
        const mo = parseInt(selectedMonth, 10);
        const yr = parseInt(selectedYear, 10);
        return lockedPeriods.some((p) => p.month === mo && p.year === yr);
    }, [lockedPeriods, selectedMonth, selectedYear]);

    // Modal states
    const [detailModal, setDetailModal] = useState<DetailModalState | null>(
        null,
    );
    const [nsfpModal, setNsfpModal] = useState<NsfpModalState | null>(null);
    const [ntpnModal, setNtpnModal] = useState(false);
    const [isSavingNtpn, setIsSavingNtpn] = useState(false);
    const [inputNsfp, setInputNsfp] = useState('');
    const [inputNtpn, setInputNtpn] = useState('');
    const [inputPaidDate, setInputPaidDate] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [inputBank, setInputBank] = useState('Bank Mandiri Solo Baru');
    const [successAlert, setSuccessAlert] = useState<string | null>(null);

    const periodFilterLabel =
        selectedYear !== 'all' && selectedMonth !== 'all'
            ? `Masa ${selectedMonth}-${selectedYear}`
            : 'Semua Periode';

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
                        .includes(searchQuery.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' || k.efakturStatus === statusFilter;

            let matchesPeriod = true;
            if (selectedYear !== 'all' && selectedMonth !== 'all') {
                const [itemYear, itemMonth] = k.date.split('-');
                matchesPeriod =
                    itemYear === selectedYear && itemMonth === selectedMonth;
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
                        .includes(searchQuery.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all' ||
                m.efakturStatus === statusFilter ||
                (statusFilter === 'creditable' &&
                    m.creditableStatus === 'creditable');

            let matchesPeriod = true;
            if (selectedYear !== 'all' && selectedMonth !== 'all') {
                const [itemYear, itemMonth] = m.date.split('-');
                matchesPeriod =
                    itemYear === selectedYear && itemMonth === selectedMonth;
            }

            return matchesSearch && matchesStatus && matchesPeriod;
        });
    }, [ppnMasukan, searchQuery, statusFilter, selectedMonth, selectedYear]);

    // Financial Computations
    const totalKeluaranDpp = useMemo(
        () => filteredKeluaran.reduce((sum, item) => sum + item.dpp, 0),
        [filteredKeluaran],
    );
    const totalKeluaranPpn = useMemo(
        () => filteredKeluaran.reduce((sum, item) => sum + item.ppn, 0),
        [filteredKeluaran],
    );

    const totalMasukanDpp = useMemo(
        () => filteredMasukan.reduce((sum, item) => sum + item.dpp, 0),
        [filteredMasukan],
    );
    const totalMasukanPpnCreditable = useMemo(
        () =>
            filteredMasukan
                .filter((item) => item.creditableStatus === 'creditable')
                .reduce((sum, item) => sum + item.ppn, 0),
        [filteredMasukan],
    );

    const netPpnAmount = totalKeluaranPpn - totalMasukanPpnCreditable;
    const isKurangBayar = netPpnAmount >= 0;

    // Active Tax Settlement (NTPN Record for selected period from database)
    const activeTaxSettlement = useMemo<TaxSettlementRecord>(() => {
        if (selectedYear !== 'all' && selectedMonth !== 'all') {
            const mo = parseInt(selectedMonth, 10);
            const yr = parseInt(selectedYear, 10);
            const found = taxSettlements.find(
                (s) => s.month === mo && s.year === yr,
            );
            if (found) {
                return {
                    ...found,
                    ppnKeluaranTotal: totalKeluaranPpn,
                    ppnMasukanTotal: totalMasukanPpnCreditable,
                    netAmount: netPpnAmount,
                };
            }
        }
        return {
            taxPeriod: periodFilterLabel,
            ppnKeluaranTotal: totalKeluaranPpn,
            ppnMasukanTotal: totalMasukanPpnCreditable,
            netAmount: netPpnAmount,
            status: 'unpaid',
            ntpn: '',
            paidDate: '',
            bankName: 'Bank Mandiri Solo Baru',
        };
    }, [
        taxSettlements,
        selectedYear,
        selectedMonth,
        periodFilterLabel,
        totalKeluaranPpn,
        totalMasukanPpnCreditable,
        netPpnAmount,
    ]);

    // Pagination Slices
    const paginatedKeluaran = useMemo(() => {
        const start = (keluaranPage - 1) * ITEMS_PER_PAGE;
        return filteredKeluaran.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredKeluaran, keluaranPage]);

    const paginatedMasukan = useMemo(() => {
        const start = (masukanPage - 1) * ITEMS_PER_PAGE;
        return filteredMasukan.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredMasukan, masukanPage]);

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
        csvContent += `Status Penyetoran Kas Negara,${activeTaxSettlement.status === 'paid' ? 'LUNAS DISETOR' : 'BELUM DISETOR'}\n`;
        csvContent += `Nomor Transaksi Penerimaan Negara (NTPN),${activeTaxSettlement.ntpn || '-'}\n`;
        csvContent += `Tanggal Setor NTPN,${activeTaxSettlement.paidDate || '-'}\n`;
        csvContent += `Bank Penyetor,${activeTaxSettlement.bankName || '-'}\n\n`;

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
        if (activeTab === 'masukan') {
            let content = `FM,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,IS_CREDITABLE\n`;
            filteredMasukan.forEach((m) => {
                const [yyyy, mm, dd] = m.date.split('-');
                const cleanNsfp = m.nsfp.replace(/[^0-9]/g, '');
                const cleanNpwp = m.npwp
                    ? m.npwp.replace(/[^0-9]/g, '')
                    : '000000000000000';
                const formattedDate = `${dd}/${mm}/${yyyy}`;
                const safeVendor = (m.vendor || 'Vendor Umum').replace(
                    /"/g,
                    '""',
                );
                const isCreditable =
                    m.creditableStatus === 'creditable' ? '1' : '0';

                content += `FM,01,0,="${cleanNsfp}",${parseInt(mm, 10)},${yyyy},="${formattedDate}",="${cleanNpwp}","${safeVendor}","Indonesia",${Math.round(m.dpp)},${Math.round(m.ppn)},0,${isCreditable}\n`;
            });

            const blob = new Blob(['\uFEFF' + content], {
                type: 'text/csv;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `eFaktur_FM_Pembelian_${selectedMonth}-${selectedYear}.csv`,
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        let content = `FK,KD_JENIS_TRANSAKSI,FG_PENGGANTI,NOMOR_FAKTUR,MASA_PAJAK,TAHUN_PAJAK,TANGGAL_FAKTUR,NPWP,NAMA,ALAMAT_LENGKAP,JUMLAH_DPP,JUMLAH_PPN,JUMLAH_PPNBM,ID_KETERANGAN_TAMBAHAN,FG_UANG_MUKA,UANG_MUKA_DPP,UANG_MUKA_PPN,UANG_MUKA_PPNBM,REFERENSI\n`;
        filteredKeluaran.forEach((k) => {
            const [yyyy, mm, dd] = k.date.split('-');
            const cleanNsfp = k.nsfp.replace(/[^0-9]/g, '');
            const cleanNpwp = k.npwp
                ? k.npwp.replace(/[^0-9]/g, '')
                : '000000000000000';
            const formattedDate = `${dd}/${mm}/${yyyy}`;
            const safeClient = (k.client || 'Client Umum').replace(/"/g, '""');
            const safeDocNo = (k.docNo || '').replace(/"/g, '""');

            content += `FK,01,0,="${cleanNsfp}",${parseInt(mm, 10)},${yyyy},="${formattedDate}",="${cleanNpwp}","${safeClient}","Indonesia",${Math.round(k.dpp)},${Math.round(k.ppn)},0,,,0,0,0,"${safeDocNo}"\n`;
        });

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

        appendInput('taxSettlement[taxPeriod]', activeTaxSettlement.taxPeriod);
        appendInput('taxSettlement[ppnKeluaranTotal]', totalKeluaranPpn);
        appendInput(
            'taxSettlement[ppnMasukanTotal]',
            totalMasukanPpnCreditable,
        );
        appendInput('taxSettlement[netAmount]', netPpnAmount);
        appendInput('taxSettlement[status]', activeTaxSettlement.status);
        appendInput('taxSettlement[ntpn]', activeTaxSettlement.ntpn || '-');
        appendInput(
            'taxSettlement[paidDate]',
            activeTaxSettlement.paidDate || '-',
        );
        appendInput(
            'taxSettlement[bankName]',
            activeTaxSettlement.bankName || '-',
        );

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

    // Save NSFP Modal
    const handleSaveNsfp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nsfpModal) return;

        if (isPeriodLocked) {
            alert(
                'Masa pajak ini telah ditutup dan dikunci oleh Pimpinan/Owner (Closing Period). Data tidak dapat diubah.',
            );
            return;
        }

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

    // Open NTPN Modal with current active settlement data
    const handleOpenNtpnModal = () => {
        if (isPeriodLocked) {
            alert(
                'Masa pajak ini telah ditutup dan dikunci oleh Pimpinan/Owner (Closing Period). Data penyetoran NTPN tidak dapat diubah.',
            );
            return;
        }

        setInputNtpn(activeTaxSettlement.ntpn || '');
        setInputPaidDate(
            activeTaxSettlement.paidDate ||
                new Date().toISOString().split('T')[0],
        );
        setInputBank(activeTaxSettlement.bankName || 'Bank Mandiri Solo Baru');
        setNtpnModal(true);
    };

    // Save NTPN Settlement Modal (Persisted to Database via Inertia)
    const handleSaveNtpn = (e: React.FormEvent) => {
        e.preventDefault();
        if (isPeriodLocked) {
            alert(
                'Masa pajak ini telah ditutup dan dikunci oleh Pimpinan/Owner (Closing Period). Transaksi tidak dapat disimpan.',
            );
            return;
        }

        const targetMonth =
            selectedMonth !== 'all'
                ? parseInt(selectedMonth, 10)
                : now.getMonth() + 1;
        const targetYear =
            selectedYear !== 'all'
                ? parseInt(selectedYear, 10)
                : now.getFullYear();

        setIsSavingNtpn(true);
        router.post(
            '/ppn/settle',
            {
                month: targetMonth,
                year: targetYear,
                fiscal_mode: 'ppn',
                ntpn: inputNtpn,
                paid_date: inputPaidDate,
                bank_name: inputBank,
                ppn_keluaran_total: totalKeluaranPpn,
                ppn_masukan_total: totalMasukanPpnCreditable,
                net_amount: netPpnAmount,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNtpnModal(false);
                    setIsSavingNtpn(false);
                    setSuccessAlert(
                        `Penyetoran Kas Negara NTPN: ${inputNtpn} (${inputBank}) berhasil disimpan ke database & LUNAS.`,
                    );
                    setTimeout(() => setSuccessAlert(null), 5000);
                },
                onError: (errors) => {
                    setIsSavingNtpn(false);
                    const firstError = Object.values(errors)[0] as string;
                    alert(
                        `Gagal menyimpan NTPN: ${firstError || 'Periksa kembali data Anda.'}`,
                    );
                },
            },
        );
    };

    // Toggle Upload Status (Manual Confirmation for DJP Upload)
    const handleToggleStatus = (
        item: PpnKeluaranItem | PpnMasukanItem,
        type: 'keluaran' | 'masukan',
    ) => {
        if (isPeriodLocked) {
            alert(
                'Masa pajak ini telah ditutup dan dikunci oleh Pimpinan/Owner (Closing Period). Status e-Faktur tidak dapat diubah.',
            );
            return;
        }

        const newStatus =
            item.efakturStatus === 'approved' ? 'ready' : 'approved';
        if (type === 'keluaran') {
            setPpnKeluaran((prev) =>
                prev.map((k) =>
                    k.id === item.id ? { ...k, efakturStatus: newStatus } : k,
                ),
            );
        } else {
            setPpnMasukan((prev) =>
                prev.map((m) =>
                    m.id === item.id ? { ...m, efakturStatus: newStatus } : m,
                ),
            );
        }

        setSuccessAlert(
            newStatus === 'approved'
                ? `Faktur ${item.nsfp || item.docNo} berhasil ditandai: Sukses Upload DJP.`
                : `Faktur ${item.nsfp || item.docNo} dikembalikan ke status: Siap Upload DJP.`,
        );
        setTimeout(() => setSuccessAlert(null), 4000);
    };

    return (
        <AppLayout
            activePage="ppn"
            title="Laporan PPN & Pajak"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Accounting' },
                { label: 'Laporan PPN & e-Faktur' },
            ]}
        >
            {isPPN ? (
                <div className="space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                                    Rekapitulasi PPN & e-Faktur DJP
                                </h1>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                                    Mode PPN Aktif
                                </span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                                Rekonsiliasi Pajak Pertambahan Nilai (PPN
                                Keluaran vs Masukan), Penomoran NSFP, dan
                                Penyetoran NTPN.
                            </p>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
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

                            <ExcelButton
                                onClick={handleExportExcel}
                                title="Unduh Rekapitulasi Laporan PPN Internal (Format Excel / CSV)"
                            />

                            <PrintButton
                                onClick={handleExportPdf}
                                title="Cetak / Unduh Dokumen PDF Resmi SPT Masa PPN 1111"
                            />

                            <button
                                onClick={handleExportCsvEfaktur}
                                className="shadow-2xs flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-800 transition-all hover:bg-blue-100"
                                title={
                                    activeTab === 'masukan'
                                        ? 'Unduh Skema Impor CSV e-Faktur FM (Faktur Pajak Masukan / Pembelian Vendor) untuk Diunggah ke DJP Online'
                                        : 'Unduh Skema Impor CSV e-Faktur FK (Faktur Pajak Keluaran / Penjualan Client) untuk Diunggah ke DJP Online'
                                }
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
                                <span>
                                    {activeTab === 'masukan'
                                        ? 'CSV e-Faktur (Masukan)'
                                        : 'CSV e-Faktur (Keluaran)'}
                                </span>
                            </button>

                            {isPeriodLocked ? (
                                <button
                                    disabled
                                    className="shadow-2xs flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 opacity-90"
                                    title="Periode ini telah dikunci (Closing Period) oleh Pimpinan/Owner"
                                >
                                    <svg
                                        className="h-4 w-4 text-slate-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                    <span>🔒 Terkunci (Closing Period)</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleOpenNtpnModal}
                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                        activeTaxSettlement.status === 'paid'
                                            ? 'border border-emerald-300 bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:bg-emerald-800'
                                            : 'bg-primary text-white shadow-neon-primary hover:bg-primary-700 hover:shadow-neon-primary-lg active:bg-primary-800'
                                    }`}
                                    title={
                                        activeTaxSettlement.status === 'paid'
                                            ? `Periode ini telah lunas disetor ke Kas Negara (NTPN: ${activeTaxSettlement.ntpn}). Klik untuk melihat detail atau koreksi.`
                                            : 'Catat Penyetoran PPN Kurang Bayar ke Kas Negara (DJP)'
                                    }
                                >
                                    {activeTaxSettlement.status === 'paid' ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 text-white"
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
                                            <span>
                                                ✓ Disetor (Koreksi NTPN)
                                            </span>
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                            <span>Pembayaran PPN (NTPN)</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Locked Period Warning Banner */}
                    {isPeriodLocked && (
                        <div className="shadow-2xs flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-xs text-amber-900">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/80 text-amber-800">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-950">
                                    Periode Masa Pajak Telah Dikunci (Closing
                                    Period)
                                </h4>
                                <p className="mt-0.5 text-amber-800">
                                    Masa Pajak{' '}
                                    <strong>{periodFilterLabel}</strong> telah
                                    ditutup dan dikunci oleh Pimpinan/Owner.
                                    Seluruh data transaksi faktur, penomoran
                                    NSFP, dan bukti setor (NTPN) bersifat{' '}
                                    <em>Read-Only</em> dan tidak dapat diubah
                                    lagi.
                                </p>
                            </div>
                        </div>
                    )}

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
                    <PpnMetricsCards
                        totalKeluaranPpn={totalKeluaranPpn}
                        totalKeluaranDpp={totalKeluaranDpp}
                        totalMasukanPpnCreditable={totalMasukanPpnCreditable}
                        totalMasukanDpp={totalMasukanDpp}
                        netPpnAmount={netPpnAmount}
                        isKurangBayar={isKurangBayar}
                        taxSettlement={activeTaxSettlement}
                    />

                    {/* Main Tab Navigation & Container */}
                    <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                        <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
                            <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
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
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {activeTab === 'keluaran'
                                        ? 'Faktur Pajak Penjualan (Faktur Keluaran)'
                                        : activeTab === 'masukan'
                                          ? 'Faktur Pajak Pembelian (Faktur Masukan)'
                                          : 'Form SPT Masa PPN 1111 & Penyetoran SSE'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsInfoModalOpen(true)}
                                    title="Panduan Alur & Penjelasan Status e-Faktur"
                                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 active:scale-95"
                                >
                                    <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Active Tab View */}
                        {activeTab === 'keluaran' && (
                            <PpnKeluaranTab
                                items={filteredKeluaran}
                                paginatedItems={paginatedKeluaran}
                                currentPage={keluaranPage}
                                onPageChange={setKeluaranPage}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onViewDetail={(item) =>
                                    setDetailModal({ item, type: 'keluaran' })
                                }
                                onEditNsfp={(item) => {
                                    setNsfpModal({
                                        isOpen: true,
                                        item,
                                        type: 'keluaran',
                                    });
                                    setInputNsfp(item.nsfp);
                                }}
                                onToggleStatus={(item) =>
                                    handleToggleStatus(item, 'keluaran')
                                }
                                searchQuery={searchQuery}
                                onSearchQueryChange={(q) => {
                                    setSearchQuery(q);
                                    setKeluaranPage(1);
                                }}
                                statusFilter={statusFilter}
                                onStatusFilterChange={(s) => {
                                    setStatusFilter(s);
                                    setKeluaranPage(1);
                                }}
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                onPeriodChange={(yr, mo) => {
                                    setSelectedYear(yr);
                                    setSelectedMonth(mo);
                                    setKeluaranPage(1);
                                }}
                                isPeriodLocked={isPeriodLocked}
                            />
                        )}

                        {activeTab === 'masukan' && (
                            <PpnMasukanTab
                                items={filteredMasukan}
                                paginatedItems={paginatedMasukan}
                                currentPage={masukanPage}
                                onPageChange={setMasukanPage}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onViewDetail={(item) =>
                                    setDetailModal({ item, type: 'masukan' })
                                }
                                onEditNsfp={(item) => {
                                    setNsfpModal({
                                        isOpen: true,
                                        item,
                                        type: 'masukan',
                                    });
                                    setInputNsfp(item.nsfp);
                                }}
                                onToggleStatus={(item) =>
                                    handleToggleStatus(item, 'masukan')
                                }
                                searchQuery={searchQuery}
                                onSearchQueryChange={(q) => {
                                    setSearchQuery(q);
                                    setMasukanPage(1);
                                }}
                                statusFilter={statusFilter}
                                onStatusFilterChange={(s) => {
                                    setStatusFilter(s);
                                    setMasukanPage(1);
                                }}
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                onPeriodChange={(yr, mo) => {
                                    setSelectedYear(yr);
                                    setSelectedMonth(mo);
                                    setMasukanPage(1);
                                }}
                                isPeriodLocked={isPeriodLocked}
                            />
                        )}

                        {activeTab === 'spt' && (
                            <PpnSptTab
                                periodLabel={periodFilterLabel}
                                totalKeluaranPpn={totalKeluaranPpn}
                                totalKeluaranDpp={totalKeluaranDpp}
                                totalMasukanPpnCreditable={
                                    totalMasukanPpnCreditable
                                }
                                totalMasukanDpp={totalMasukanDpp}
                                netPpnAmount={netPpnAmount}
                                taxSettlement={activeTaxSettlement}
                            />
                        )}
                    </div>
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

            {/* MODAL: PANDUAN ALUR & STATUS E-FAKTUR */}
            <PpnInfoModal
                isOpen={isInfoModalOpen}
                onClose={() => setIsInfoModalOpen(false)}
            />

            {/* MODAL: DETAIL FAKTUR PAJAK */}
            <DetailFakturModal
                modalState={detailModal}
                onClose={() => setDetailModal(null)}
                onEditNsfp={(item, type) => {
                    setNsfpModal({
                        isOpen: true,
                        item,
                        type,
                    });
                    setInputNsfp(item.nsfp);
                }}
            />

            {/* MODAL: UPDATE NSFP */}
            <NsfpEditModal
                nsfpModal={nsfpModal}
                inputNsfp={inputNsfp}
                onInputNsfpChange={setInputNsfp}
                onClose={() => setNsfpModal(null)}
                onSave={handleSaveNsfp}
            />

            {/* MODAL: CATAT SETORAN PPN (NTPN) */}
            <NtpnSettlementModal
                isOpen={ntpnModal}
                onClose={() => setNtpnModal(false)}
                onSave={handleSaveNtpn}
                netPpnAmount={netPpnAmount}
                inputNtpn={inputNtpn}
                onInputNtpnChange={setInputNtpn}
                inputPaidDate={inputPaidDate}
                onInputPaidDateChange={setInputPaidDate}
                inputBank={inputBank}
                onInputBankChange={setInputBank}
                isSubmitting={isSavingNtpn}
                isPaid={activeTaxSettlement.status === 'paid'}
            />

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
