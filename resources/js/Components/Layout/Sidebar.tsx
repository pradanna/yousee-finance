import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import Modal from '@/Components/UI/Modal';

interface SidebarProps {
    activePage: 'overview' | 'vendors' | 'clients' | 'sales' | 'projects' | 'debt-receivable' | 'invoice-po' | 'purchases' | 'sales-transactions' | 'journal' | 'ppn' | 'cashflow';
    fiscalMode: 'ppn' | 'non-ppn';
    onFiscalModeToggle: (mode: 'ppn' | 'non-ppn') => void;
    isCollapsed?: boolean;
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

export default function Sidebar({
    activePage,
    fiscalMode,
    onFiscalModeToggle,
    isCollapsed = false,
}: SidebarProps) {
    const [targetMode, setTargetMode] = useState<'ppn' | 'non-ppn' | null>(null);

    const handleModeClick = (newMode: 'ppn' | 'non-ppn') => {
        if (newMode === fiscalMode) return;
        setTargetMode(newMode);
    };

    const confirmModeChange = () => {
        if (!targetMode) return;
        onFiscalModeToggle(targetMode);
        setTargetMode(null);
        router.visit('/overview');
    };
    const sections: NavSection[] = [
        {
            items: [
                {
                    id: 'overview',
                    label: 'Overview',
                    href: '/overview',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                        </svg>
                    )
                }
            ]
        },
        {
            sectionTitle: 'DATA MASTER',
            items: [
                {
                    id: 'vendors',
                    label: 'Data Vendor',
                    href: '/vendors',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    id: 'clients',
                    label: 'Data Client',
                    href: '/clients',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )
                },
                {
                    id: 'sales',
                    label: 'Data Sales',
                    href: '/sales',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                    href: '/projects',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                },
                {
                    id: 'purchases',
                    label: 'Pembelian (PO)',
                    href: '/purchases',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    )
                },
                {
                    id: 'sales-transactions',
                    label: 'Penjualan (Invoice)',
                    href: '/sales-transactions',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    id: 'debt-receivable',
                    label: 'Hutang Piutang',
                    href: '/debt-receivable',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                    href: '/journal',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    )
                },
                {
                    id: 'ppn',
                    label: 'Laporan PPN',
                    href: '/ppn',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                    )
                },
                {
                    id: 'cashflow',
                    label: 'Laporan Cashflow',
                    href: '/cashflow',
                    icon: (
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    )
                }
            ]
        }
    ];

    return (
        <aside
            className={`bg-white text-slate-700 min-h-screen flex flex-col justify-between border-r border-slate-200/80 z-40 fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 shadow-xs ${
                isCollapsed ? 'w-20' : 'w-72'
            }`}
        >
            {/* Top Logo Container - Completely Undisturbed */}
            <div>
                <div className="h-16 flex items-center justify-center px-4 border-b border-slate-100 sticky top-0 bg-white z-20">
                    <Link href="/overview" className="flex items-center justify-center gap-3 overflow-hidden w-full">
                        {isCollapsed ? (
                            <img
                                src="/images/yousee.png"
                                alt="Yousee Icon"
                                className="h-9 w-auto object-contain"
                                title="Yousee Indonesia"
                            />
                        ) : (
                            <img
                                src="/images/logo-yousee-panjang.png"
                                alt="Yousee Indonesia Logo"
                                className="h-9 w-auto object-contain"
                            />
                        )}
                    </Link>
                </div>

                {/* Fiscal Mode Toggle */}
                <div className={`border-b border-slate-100 bg-slate-50/50 ${isCollapsed ? 'p-2' : 'px-4 py-3.5'}`}>
                    {!isCollapsed && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            SILO MODE FISKAL
                        </div>
                    )}

                    <div className="bg-slate-200/60 p-1 rounded-xl flex gap-1 border border-slate-200/80">
                        <button
                            id="toggle-mode-ppn"
                            onClick={() => handleModeClick('ppn')}
                            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                                fiscalMode === 'ppn'
                                    ? 'bg-primary text-white shadow-neon-primary shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mode PPN (PKP)"
                        >
                            {isCollapsed ? 'PPN' : 'Mode PPN'}
                        </button>
                        <button
                            id="toggle-mode-non-ppn"
                            onClick={() => handleModeClick('non-ppn')}
                            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                                fiscalMode === 'non-ppn'
                                    ? 'bg-primary text-white shadow-neon-primary shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Mode Non-PPN"
                        >
                            {isCollapsed ? 'NON' : 'Non-PPN'}
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className={`py-3 space-y-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-1">
                            {section.sectionTitle && !isCollapsed && (
                                <div className="px-4 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                    {section.sectionTitle}
                                </div>
                            )}
                            <nav className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = activePage === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            id={`sidebar-link-${item.id}`}
                                            href={item.href}
                                            title={isCollapsed ? item.label : undefined}
                                            className={`flex items-center gap-3 rounded-xl font-bold transition-all ${
                                                isCollapsed
                                                    ? 'justify-center p-3 w-11 h-11 mx-auto'
                                                    : 'px-4 py-2.5 text-xs'
                                            } ${
                                                isActive
                                                    ? 'bg-primary text-white shadow-neon-primary shadow-xs'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            {item.icon}
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Profile Card */}
            <div className={`border-t border-slate-100 bg-slate-50/60 sticky bottom-0 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                {isCollapsed ? (
                    <div
                        className="w-10 h-10 mx-auto rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center font-bold text-blue-600 text-xs cursor-pointer"
                        title="Pradana Mahendra (Pimpinan)"
                    >
                        PM
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                            PM
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">Pradana Mahendra</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                Pimpinan
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Ganti Mode Fiskal */}
            <Modal show={targetMode !== null} onClose={() => setTargetMode(null)} maxWidth="md">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Konfirmasi Beralih Silo Mode Fiskal</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Mode Fiskal akan diubah ke <strong className="text-slate-800 uppercase">{targetMode === 'ppn' ? 'Mode PPN (PKP)' : 'Mode Non-PPN'}</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed font-medium space-y-1">
                        <p>
                            ⚠️ <strong>Perhatian:</strong> Data transaksi, proyek, dan invoice pada <strong>{targetMode === 'ppn' ? 'Mode PPN' : 'Mode Non-PPN'}</strong> terisolasi secara terpisah.
                        </p>
                        <p>
                            Anda akan diarahkan kembali ke <strong>Dashboard Overview</strong> setelah beralih mode.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setTargetMode(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={confirmModeChange}
                            className="px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-neon-primary transition-all cursor-pointer"
                        >
                            Ya, Ganti Mode &amp; Buka Dashboard
                        </button>
                    </div>
                </div>
            </Modal>
        </aside>
    );
}
