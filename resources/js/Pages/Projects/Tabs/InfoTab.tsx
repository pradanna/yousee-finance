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
                                    {/* Section 1: Financial Summary Cards */}
                                    <div className="shadow-xs space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                                <span className="h-2 w-2 rounded-full bg-blue-600" />{' '}
                                                Ringkasan Finansial Proyek
                                            </h3>
                                            <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-600">
                                                {isPPN
                                                    ? 'Mode PPN Aktif'
                                                    : 'Mode Non-PPN'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Nilai Kontrak (DPP)
                                                </div>
                                                <div className="font-mono text-base font-black text-emerald-600">
                                                    {fmt(project.contractValue)}
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    Harga murni kesepakatan
                                                    kontrak client
                                                </p>
                                            </div>

                                            <div className="space-y-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Total Tagihan (Invoice
                                                    Client)
                                                </div>
                                                <div className="font-mono text-base font-black text-slate-900">
                                                    {fmt(fin.totalInvoice)}
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    {isPPN
                                                        ? `Termasuk PPN 11% (${fmt(fin.ppnKeluaran)})`
                                                        : 'Tanpa PPN'}
                                                </p>
                                            </div>
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
