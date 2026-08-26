import ExcelButton from '@/Components/Button/ExcelButton';
import PrintButton from '@/Components/Button/PrintButton';
import MonthPicker from '@/Components/Form/MonthPicker';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    CashflowEntry,
    CashflowReportProps,
    formatDateIndo,
} from './CashflowReport/cashflowTypes';
import CashflowDetailModal from './CashflowReport/Components/CashflowDetailModal';
import CashflowMetricsCards from './CashflowReport/Components/CashflowMetricsCards';
import CashflowBankAccountsTab from './CashflowReport/Tabs/CashflowBankAccountsTab';
import CashflowPsakTab from './CashflowReport/Tabs/CashflowPsakTab';
import CashflowRegistryTab from './CashflowReport/Tabs/CashflowRegistryTab';

export default function CashflowReport({
    initialCashflowData,
    lockedPeriods = [],
    projects = [],
}: CashflowReportProps) {
    const fiscalMode = useFiscalMode();
    const isPPN = fiscalMode === 'ppn';

    const [activeTab, setActiveTab] = useState<'registry' | 'psak' | 'banks'>(
        'registry',
    );

    const [selectedMonth, setSelectedMonth] = useState<string>(
        initialCashflowData.selectedMonth ||
            (new Date().getMonth() + 1).toString(),
    );
    const [selectedYear, setSelectedYear] = useState<string>(
        initialCashflowData.selectedYear || new Date().getFullYear().toString(),
    );

    // Selected entry for drilldown modal
    const [detailModalEntry, setDetailModalEntry] =
        useState<CashflowEntry | null>(null);

    // Check if period is closed/locked (Closing Period)
    const isPeriodLocked = useMemo(() => {
        if (selectedYear === 'all' || selectedMonth === 'all') return false;
        const mo = parseInt(selectedMonth, 10);
        const yr = parseInt(selectedYear, 10);
        return lockedPeriods.some(
            (p) =>
                p.month === mo &&
                p.year === yr &&
                (p.fiscalMode === 'all' || p.fiscalMode === fiscalMode),
        );
    }, [lockedPeriods, selectedMonth, selectedYear, fiscalMode]);

    // Handle Month/Year Period Change via Inertia
    const handlePeriodChange = (year: string, month: string) => {
        setSelectedYear(year);
        setSelectedMonth(month);

        router.get(
            '/cashflow',
            {
                month: month,
                year: year,
                fiscal_mode: fiscalMode,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Handle PDF Export
    const handleExportPdf = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/cashflow-pdf';
        form.target = '_blank';

        const appendInput = (name: string, value: string) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        };

        const csrfToken =
            (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement
            )?.content || '';

        appendInput('_token', csrfToken);
        appendInput('month', selectedMonth);
        appendInput('year', selectedYear);
        appendInput('fiscal_mode', fiscalMode);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    // Handle CSV Export
    const handleExportCsv = () => {
        const headers = [
            'ID Transaksi',
            'Tanggal',
            'No Referensi',
            'Kode Akun Kas',
            'Nama Akun Kas',
            'Kategori / Akun Lawan',
            'Rincian Keterangan',
            'Penerima / Partner',
            'Proyek Billboard',
            'Kategori PSAK',
            'Jenis Kas',
            'Nominal (Rp)',
            'Saldo Berjalan (Rp)',
        ];

        const rows = initialCashflowData.entries.map((e) => [
            `"${e.id}"`,
            `"${formatDateIndo(e.date)}"`,
            `"${e.refNo}"`,
            `"${e.accountCode}"`,
            `"${e.accountName}"`,
            `"${(e.contraName || e.accountName || '').replace(/"/g, '""')}"`,
            `"${(e.description || '').replace(/"/g, '""')}"`,
            `"${(e.partnerName || '').replace(/"/g, '""')}"`,
            `"${(e.projectName || '').replace(/"/g, '""')}"`,
            `"${e.isInternalTransfer ? 'Transfer Kas Internal' : e.category.toUpperCase()}"`,
            `"${e.type === 'inflow' ? 'KAS MASUK' : 'KAS KELUAR'}"`,
            e.amount,
            e.runningBalance ?? 0,
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,\uFEFF' +
            [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute(
            'download',
            `Laporan_Arus_Kas_${selectedMonth}_${selectedYear}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayout
            activePage="cashflow"
            title="Laporan Arus Kas (Statement of Cash Flows)"
            breadcrumbs={[
                { label: 'Yousee Indonesia' },
                { label: 'Accounting' },
                { label: 'Laporan Arus Kas' },
            ]}
        >
            <div className="w-full space-y-6">
                {/* Header Toolbar */}
                <div className="shadow-xs flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <h2 className="text-base font-bold tracking-tight text-slate-900">
                                Laporan Arus Kas (Statement of Cash Flows)
                            </h2>
                            <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                    isPPN
                                        ? 'border border-blue-200 bg-blue-100 text-blue-800'
                                        : 'border border-slate-200 bg-slate-100 text-slate-700'
                                }`}
                            >
                                Mode {isPPN ? 'PPN 11%' : 'Non-PPN'}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Monitoring realisasi penerimaan uang masuk,
                            pengeluaran kas, saldo berjalan, serta laporan arus
                            kas terstruktur PSAK 2.
                        </p>
                    </div>

                    {/* Filter & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <MonthPicker
                            value={`${selectedYear}-${selectedMonth.padStart(2, '0')}`}
                            onChange={(_val, yr, mo) =>
                                handlePeriodChange(yr, mo)
                            }
                        />

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2">
                            <ExcelButton
                                onClick={handleExportCsv}
                                title="Unduh data arus kas ke format CSV / Excel"
                            >
                                CSV / Excel
                            </ExcelButton>

                            <PrintButton
                                onClick={handleExportPdf}
                                title="Cetak dokumen resmi Laporan Arus Kas PSAK 2 ke PDF"
                            >
                                Cetak PDF
                            </PrintButton>
                        </div>
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
                                Periode Masa Telah Dikunci (Closing Period)
                            </h4>
                            <p className="mt-0.5 text-amber-800">
                                Periode{' '}
                                <strong>
                                    {initialCashflowData.periodLabel}
                                </strong>{' '}
                                telah ditutup dan dikunci oleh Pimpinan/Owner.
                                Seluruh mutasi kas dan pencatatan buku besar
                                berstatus <em>Read-Only</em>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Executive Summary Metrics Cards */}
                <CashflowMetricsCards
                    beginningBalance={initialCashflowData.beginningBalance}
                    totalInflow={initialCashflowData.totalInflow}
                    totalOutflow={initialCashflowData.totalOutflow}
                    endingBalance={initialCashflowData.endingBalance}
                    netMovement={
                        initialCashflowData.totalInflow -
                        initialCashflowData.totalOutflow
                    }
                />

                {/* Main Tab Container */}
                <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                    {/* Tab Navigation */}
                    <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
                        <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
                            <button
                                onClick={() => setActiveTab('registry')}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'registry'
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
                                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                    />
                                </svg>
                                <span>Buku Kas & Mutasi Harian</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('psak')}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'psak'
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
                                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Laporan PSAK 2</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('banks')}
                                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                    activeTab === 'banks'
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
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                </svg>
                                <span>Rekap Rekening Kas & Bank</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Views */}
                    {activeTab === 'registry' && (
                        <CashflowRegistryTab
                            entries={initialCashflowData.entries}
                            bankAccounts={initialCashflowData.bankAccounts}
                            projects={projects}
                            onViewDetail={(entry) => setDetailModalEntry(entry)}
                        />
                    )}

                    {activeTab === 'psak' && (
                        <CashflowPsakTab
                            psak={initialCashflowData.psak}
                            periodLabel={initialCashflowData.periodLabel}
                        />
                    )}

                    {activeTab === 'banks' && (
                        <CashflowBankAccountsTab
                            bankAccounts={initialCashflowData.bankAccounts}
                            totalEndingBalance={
                                initialCashflowData.endingBalance
                            }
                        />
                    )}
                </div>
            </div>

            {/* Drilldown Detail Modal */}
            <CashflowDetailModal
                entry={detailModalEntry}
                onClose={() => setDetailModalEntry(null)}
            />
        </AppLayout>
    );
}
