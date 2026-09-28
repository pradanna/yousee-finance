import InflowProjectionTable from '@/Features/FinancialProjection/Components/InflowProjectionTable';
import OutflowProjectionTable from '@/Features/FinancialProjection/Components/OutflowProjectionTable';
import PpnMonthEndNotice from '@/Features/FinancialProjection/Components/PpnMonthEndNotice';
import ProjectionSummaryCards from '@/Features/FinancialProjection/Components/ProjectionSummaryCards';
import ProjectionTimelineTable from '@/Features/FinancialProjection/Components/ProjectionTimelineTable';
import { FinancialProjectionPageProps } from '@/Features/FinancialProjection/types';
import AppLayout, { useFiscalMode } from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

export default function FinancialProjection({
    projection,
}: FinancialProjectionPageProps) {
    const currentFiscalMode = useFiscalMode();
    const [activeTab, setActiveTab] = useState<'timeline' | 'inflow' | 'outflow'>(
        'timeline',
    );

    const { filters, summary, timeline, inflow_items, outflow_items } = projection;
    const currentDays = filters.days || 14;

    const handleDaysChange = (newDays: number) => {
        router.get(
            '/projection',
            {
                days: newDays,
                fiscal_mode: currentFiscalMode,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout
            activePage="projection"
            title="Proyeksi Keuangan"
            breadcrumbs={[
                { label: 'Laporan' },
                { label: 'Proyeksi Keuangan' },
            ]}
        >
            <Head title="Proyeksi Keuangan - Yousee Finance" />

            <div className="space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Proyeksi Keuangan & Arus Kas
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Estimasi likuiditas kas berdasarkan piutang invoice jatuh tempo, hutang PO rekanan, dan kewajiban PPN akhir bulan.
                        </p>
                    </div>

                    {/* Timeframe Button Group */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                            Jangka Waktu:
                        </span>
                        <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 shadow-xs">
                            <button
                                type="button"
                                onClick={() => handleDaysChange(7)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentDays === 7
                                        ? 'bg-white text-indigo-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                7 Hari
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDaysChange(14)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentDays === 14
                                        ? 'bg-white text-indigo-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                14 Hari
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDaysChange(30)}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentDays === 30
                                        ? 'bg-white text-indigo-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                30 Hari
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <ProjectionSummaryCards
                    summary={summary}
                    days={currentDays}
                    inflowCount={inflow_items.length}
                    outflowCount={outflow_items.length}
                />

                {/* PPN Month-End Settlement Notice */}
                <PpnMonthEndNotice
                    summary={summary}
                    fiscalMode={projection.fiscal_mode}
                />

                {/* View Tabs */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex w-full flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('timeline')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                activeTab === 'timeline'
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
                            <span>Timeline Arus Kas Harian</span>
                            <span className="rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-700">
                                {timeline.length} Hari
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('inflow')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                activeTab === 'inflow'
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
                            <span>Piutang Cair (Inflow)</span>
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800">
                                {inflow_items.length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('outflow')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all sm:flex-initial ${
                                activeTab === 'outflow'
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
                            <span>Pengeluaran & PPN (Outflow)</span>
                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-800">
                                {outflow_items.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'timeline' && (
                        <ProjectionTimelineTable timeline={timeline} />
                    )}
                    {activeTab === 'inflow' && (
                        <InflowProjectionTable inflowItems={inflow_items} />
                    )}
                    {activeTab === 'outflow' && (
                        <OutflowProjectionTable outflowItems={outflow_items} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
