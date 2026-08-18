import React from 'react';
import { Project, formatIndoDate, fmt } from '../projectTypes';
import { StatusBadge } from '../Show';

import { calcFinancials } from '../projectTypes';
export default function InfoTab({ project, isPPN }: { project: Project; isPPN: boolean; }) {
    
    const locations = project.locations || [];
    const poCount = locations.filter(l => l.poIssued).length;
    const fin = calcFinancials(project, locations, isPPN ? 'ppn' : 'non-ppn');

    return (
                                <div className="space-y-6">
                                    {/* Section 1: Financial Ledger Breakdown & Profit Calculation */}
                                    <div className="shadow-xs overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
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
                                                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                                        Kalkulasi Finansial & Laba Bersih Proyek
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400">
                                                        Rincian pendapatan, beban pokok (HPP), komisi sales, dan estimasi laba
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-600">
                                                {isPPN
                                                    ? 'Mode PPN (11%)'
                                                    : 'Mode Non-PPN'}
                                            </span>
                                        </div>

                                        {/* Ledger Rows */}
                                        <div className="divide-y divide-slate-100 p-6 space-y-4">
                                            {/* 1. Pendapatan Kontrak */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-extrabold text-emerald-800">
                                                            1
                                                        </span>
                                                        <span>Nilai Kontrak Client (DPP)</span>
                                                    </div>
                                                    <span className="font-mono text-sm font-black text-emerald-700">
                                                        {fmt(fin.dpp)}
                                                    </span>
                                                </div>
                                                <div className="ml-7 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3.5 py-2 text-[11px] text-slate-500">
                                                    <div className="flex items-center gap-4">
                                                        <span>
                                                            • PPN Keluaran (11%):{' '}
                                                            <strong className="font-mono text-slate-700">
                                                                {isPPN ? fmt(fin.ppnKeluaran) : '-'}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                    <div className="font-medium text-slate-700">
                                                        Total Tagihan Invoice Client:{' '}
                                                        <strong className="font-mono font-bold text-slate-900">
                                                            {fmt(fin.totalInvoice)}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. Biaya Pokok & Pengurang (HPP + Sales) */}
                                            <div className="pt-4 space-y-3">
                                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    Beban Pokok & Biaya Langsung Proyek
                                                </div>

                                                {/* Baris 2a: Biaya Titik Vendor */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-800">
                                                                -
                                                            </span>
                                                            <span>
                                                                Biaya Sewa Vendor (DPP PO {locations.length} Titik)
                                                            </span>
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-amber-800">
                                                            - {fmt(fin.totalDppVendor)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-7 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/50 px-3.5 py-1.5 text-[11px] text-slate-500">
                                                        <span>
                                                            • PPN Masukan (11%):{' '}
                                                            <strong className="font-mono text-slate-700">
                                                                {isPPN ? fmt(fin.ppnMasukan) : '-'}
                                                            </strong>
                                                        </span>
                                                        <span className="text-slate-700">
                                                            Total Tagihan PO Vendor (+ppn):{' '}
                                                            <strong className="font-mono font-bold text-amber-900">
                                                                {fmt(fin.totalPO)}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Baris 2b: Komisi / Potongan Sales */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-extrabold text-rose-800">
                                                                -
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <span>Komisi Sales PIC</span>
                                                                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                                                                    {project.salesPIC} ({fin.commissionRate}%)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-xs font-bold text-rose-700">
                                                            - {fmt(fin.salesCommission)}
                                                        </span>
                                                    </div>
                                                    <p className="ml-7 text-[10px] text-slate-400">
                                                        Dihitung dari {fin.commissionRate}% × DPP Kontrak ({fmt(fin.dpp)})
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 3. Estimasi Laba Bersih Proyek (Hasil Perhitungan) */}
                                            <div className="pt-4 space-y-3">
                                                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-teal-50/80 p-4">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white">
                                                                    =
                                                                </span>
                                                                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                                                    Estimasi Laba Bersih Proyek
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 ml-7 text-[11px] text-slate-500">
                                                                DPP Kontrak ({fmt(fin.dpp)}) - DPP Vendor ({fmt(fin.totalDppVendor)}) - Komisi Sales ({fmt(fin.salesCommission)})
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono text-lg font-black text-emerald-700">
                                                                {fmt(fin.netProfit)}
                                                            </div>
                                                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                                <span className="rounded-md border border-emerald-300 bg-white px-2 py-0.5 font-mono text-[11px] font-black text-emerald-800">
                                                                    {fin.margin.toFixed(1)}% Margin
                                                                </span>
                                                                <span className={`text-[10px] font-bold ${fin.margin >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                                    ({fin.margin >= 30 ? 'Sehat ≥ 30%' : 'Di bawah 30%'})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar Margin */}
                                                    <div className="mt-3 ml-7 space-y-1">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/60">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(0, fin.margin))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 4. Rekonsiliasi PPN (Mode PPN Aktif) */}
                                            {isPPN && (
                                                <div className="pt-4">
                                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                                        <div className="mb-2.5 flex items-center justify-between">
                                                            <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                                                                Rekonsiliasi PPN Kas Negara (11%)
                                                            </span>
                                                            <span className="text-[10px] font-bold text-blue-700">
                                                                SPT Masa PPN
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                                            <div className="rounded-xl border border-blue-200/70 bg-white p-2.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                    PPN Keluaran (Client)
                                                                </span>
                                                                <div className="font-mono text-xs font-black text-blue-900">
                                                                    {fmt(fin.ppnKeluaran)}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-xl border border-blue-200/70 bg-white p-2.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                    PPN Masukan (Vendor)
                                                                </span>
                                                                <div className="font-mono text-xs font-black text-blue-900">
                                                                    {fmt(fin.ppnMasukan)}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-xl border border-blue-300 bg-blue-100/80 p-2.5">
                                                                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
                                                                    Estimasi Setor PPN Net
                                                                </span>
                                                                <div className="font-mono text-xs font-black text-blue-950">
                                                                    {fmt(fin.ppnNet)}
                                                                </div>
                                                                <span className="text-[8px] font-bold text-blue-700">
                                                                    {fin.ppnNet >= 0 ? 'Kurang Bayar' : 'Lebih Bayar'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 2: General Information Grid */}
                                    <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6">
                                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                            <span className="h-2 w-2 rounded-full bg-indigo-600" />{' '}
                                            Detail Administrasi & Sales
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                {
                                                    label: 'Kode Proyek',
                                                    value: (
                                                        <span className="font-mono font-bold text-slate-900">
                                                            {project.code}
                                                        </span>
                                                    ),
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
                                                                d="M7 7h10M7 12h10m-8 5h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                                {
                                                    label: 'Status Proyek',
                                                    value: (
                                                        <StatusBadge
                                                            status={project.status}
                                                        />
                                                    ),
                                                    icon: (
                                                        <svg
                                                            className="h-4 w-4 text-amber-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                                {
                                                    label: 'Client / Pengiklan',
                                                    value: project.clientName,
                                                    icon: (
                                                        <svg
                                                            className="h-4 w-4 text-indigo-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                                {
                                                    label: 'Sales PIC',
                                                    value: project.salesPIC,
                                                    icon: (
                                                        <svg
                                                            className="h-4 w-4 text-violet-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                                {
                                                    label: 'Periode Kampanye',
                                                    value: project.period,
                                                    icon: (
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
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                                {
                                                    label: 'Total Titik Lokasi',
                                                    value: (
                                                        <span className="font-bold text-slate-800">
                                                            {locations.length}{' '}
                                                            titik terdaftar
                                                        </span>
                                                    ),
                                                    icon: (
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
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                    ),
                                                },
                                            ].map((row, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4"
                                                >
                                                    <div className="shadow-2xs flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white">
                                                        {row.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            {row.label}
                                                        </div>
                                                        <div className="truncate text-xs font-bold text-slate-800">
                                                            {row.value}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: PO Issuance Progress — Clean Modern Card */}
                                    <div className="shadow-xs space-y-3 rounded-3xl border border-slate-200/80 bg-white p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
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
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800">
                                                        Progress Terbit PO
                                                        Vendor
                                                    </h4>
                                                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                                        {poCount} dari{' '}
                                                        {locations.length} titik
                                                        lokasi telah diterbitkan
                                                        PO
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-lg border border-blue-100/80 bg-blue-50 px-2.5 py-1 font-mono text-xs font-extrabold text-blue-600">
                                                {locations.length > 0
                                                    ? Math.round(
                                                          (poCount /
                                                              locations.length) *
                                                              100,
                                                      )
                                                    : 0}
                                                %
                                            </span>
                                        </div>

                                        {/* Subtle Progress Bar */}
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                                style={{
                                                    width:
                                                        locations.length > 0
                                                            ? `${(poCount / locations.length) * 100}%`
                                                            : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

    );
}
