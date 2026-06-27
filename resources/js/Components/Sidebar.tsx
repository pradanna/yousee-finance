import React from 'react';
import { Link } from '@inertiajs/react';

interface SidebarProps {
    activePage: 'overview' | 'vendors' | 'clients' | 'sales' | 'projects' | 'debt-receivable' | 'invoice-po' | 'purchases' | 'sales-transactions' | 'journal' | 'ppn' | 'cashflow';
    fiscalMode: 'ppn' | 'non-ppn';
    onFiscalModeToggle: (mode: 'ppn' | 'non-ppn') => void;
}

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface NavSection {
    sectionTitle?: string;
    items: NavItem[];
}

export default function Sidebar({ activePage, fiscalMode, onFiscalModeToggle }: SidebarProps) {
    const sections: NavSection[] = [
        {
            items: [
                {
                    id: 'overview',
                    label: 'Overview',
                    href: '/demo/overview',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                    )
                }
            ]
        },
        {
            sectionTitle: 'MASTER',
            items: [
                {
                    id: 'vendors',
                    label: 'Data Vendor',
                    href: '/demo/vendors',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    id: 'clients',
                    label: 'Data Client',
                    href: '/demo/clients',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )
                },
                {
                    id: 'sales',
                    label: 'Data Sales',
                    href: '/demo/sales',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )
                }
            ]
        },
        {
            sectionTitle: 'TRANSAKSI',
            items: [
                {
                    id: 'projects',
                    label: 'Data Project',
                    href: '/demo/projects',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                },
                {
                    id: 'purchases',
                    label: 'Pembelian (PO)',
                    href: '/demo/purchases',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    )
                },
                {
                    id: 'sales-transactions',
                    label: 'Penjualan (Invoice)',
                    href: '/demo/sales-transactions',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    id: 'debt-receivable',
                    label: 'Hutang Piutang',
                    href: '/demo/debt-receivable',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            sectionTitle: 'LAPORAN',
            items: [
                {
                    id: 'journal',
                    label: 'Laporan Jurnal',
                    href: '/demo/journal',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    )
                },
                {
                    id: 'ppn',
                    label: 'Laporan PPN',
                    href: '/demo/ppn',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                    )
                },
                {
                    id: 'cashflow',
                    label: 'Laporan Cashflow',
                    href: '/demo/cashflow',
                    icon: (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )
                }
            ]
        }
    ];

    return (
        <aside className="w-72 bg-slate-950 text-slate-450 min-h-screen flex flex-col justify-between border-r border-slate-900 z-40 fixed left-0 top-0 bottom-0 overflow-y-auto">
            {/* Top Logo and Navigation */}
            <div>
                <div className="h-16 flex items-center px-6 border-b border-slate-900 sticky top-0 bg-slate-950 z-10">
                    <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-blue-500/20">Y</span>
                        Yousee Indonesia
                    </span>
                </div>

                {/* Fiscal Mode Toggle */}
                <div className="px-4 py-4 border-b border-slate-900 bg-slate-950">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">FISCAL MODE SILO</div>
                    <div className="bg-slate-900/80 p-0.5 rounded-xl flex gap-0.5 border border-slate-800/80">
                        <button
                            id="toggle-mode-ppn"
                            onClick={() => onFiscalModeToggle('ppn')}
                            className={`flex-1 text-center py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${
                                fiscalMode === 'ppn'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Mode PPN
                        </button>
                        <button
                            id="toggle-mode-non-ppn"
                            onClick={() => onFiscalModeToggle('non-ppn')}
                            className={`flex-1 text-center py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${
                                fiscalMode === 'non-ppn'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Non-PPN
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="px-3 py-3 space-y-4">
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            {section.sectionTitle && (
                                <div className="px-4 py-1 text-[9px] font-black text-slate-500 tracking-widest uppercase">
                                    {section.sectionTitle}
                                </div>
                            )}
                            <nav className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = activePage === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            id={`sidebar-link-${item.id}`}
                                            href={item.href}
                                            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-100'
                                            }`}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Profile Card */}
            <div className="p-4 border-t border-slate-900 bg-slate-950 sticky bottom-0">
                <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-900/70 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/25 flex items-center justify-center font-bold text-blue-400 text-xs">
                        PM
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate">Pradana Mahendra</div>
                        <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            Pimpinan
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
