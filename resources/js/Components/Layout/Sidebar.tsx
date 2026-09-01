import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import React from 'react';

interface SidebarProps {
    activePage:
        | 'overview'
        | 'vendors'
        | 'clients'
        | 'sales'
        | 'projects'
        | 'debt-receivable'
        | 'invoice-po'
        | 'purchases'
        | 'cash-out'
        | 'sales-transactions'
        | 'coa'
        | 'accounting-settings'
        | 'closing-periods'
        | 'journal'
        | 'ppn'
        | 'cashflow';
    isCollapsed?: boolean;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
}

interface NavSection {
    sectionTitle?: string;
    roles?: string[];
    items: NavItem[];
}

export default function Sidebar({
    activePage,
    isCollapsed = false,
    mobileOpen = false,
    onMobileClose,
}: SidebarProps) {
    const { auth } = usePage<PageProps>().props;
    const userRoles = auth?.user?.roles || [];
    const isStaffOnly =
        userRoles.includes('staff') &&
        !userRoles.includes('admin') &&
        !userRoles.includes('pimpinan') &&
        !userRoles.includes('akuntan');
    const sections: NavSection[] = [
        {
            roles: ['admin', 'pimpinan', 'akuntan'],
            items: [
                {
                    id: 'overview',
                    label: 'Overview',
                    href: '/overview',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"
                            />
                        </svg>
                    ),
                },
            ],
        },
        {
            sectionTitle: 'DATA MASTER',
            roles: ['admin', 'pimpinan', 'akuntan'],
            items: [
                {
                    id: 'vendors',
                    label: 'Data Vendor',
                    href: '/vendors',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'clients',
                    label: 'Data Client',
                    href: '/clients',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'sales',
                    label: 'Sales Team',
                    href: '/sales',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                    ),
                },
            ],
        },
        {
            sectionTitle: 'TRANSAKSI',
            items: [
                {
                    id: 'projects',
                    label: 'Data Project',
                    href: '/projects',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'purchases',
                    label: 'Pembelian (PO)',
                    href: '/purchases',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'cash-out',
                    label: 'Pengeluaran Kas',
                    href: '/cash-out',
                    roles: ['admin', 'pimpinan', 'akuntan'],
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'sales-transactions',
                    label: 'Penjualan (Invoice)',
                    href: '/sales-transactions',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'debt-receivable',
                    label: 'Hutang Piutang',
                    href: '/debt-receivable',
                    roles: ['admin', 'pimpinan', 'akuntan'],
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    ),
                },
            ],
        },
        {
            sectionTitle: 'AKUNTANSI',
            roles: ['admin', 'pimpinan', 'akuntan'],
            items: [
                {
                    id: 'coa',
                    label: 'Master COA',
                    href: '/accounting/coa',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'accounting-settings',
                    label: 'Pengaturan Akun',
                    href: '/accounting/settings',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'closing-periods',
                    label: 'Tutup Buku & Kunci',
                    href: '/accounting/closing-periods',
                    roles: ['pimpinan'],
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                        </svg>
                    ),
                },
            ],
        },
        {
            sectionTitle: 'LAPORAN',
            roles: ['admin', 'pimpinan', 'akuntan'],
            items: [
                {
                    id: 'journal',
                    label: 'Laporan Jurnal',
                    href: '/journal',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'ppn',
                    label: 'Laporan PPN',
                    href: '/ppn',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                            />
                        </svg>
                    ),
                },
                {
                    id: 'cashflow',
                    label: 'Laporan Cashflow',
                    href: '/cashflow',
                    icon: (
                        <svg
                            className="h-5 w-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                        </svg>
                    ),
                },
            ],
        },
    ];

    const visibleSections = sections
        .map((section) => {
            if (userRoles.length > 0 && section.roles && !section.roles.some((r) => userRoles.includes(r))) {
                return null;
            }
            const visibleItems = section.items.filter((item) => {
                if (userRoles.length === 0 || !item.roles) return true;
                return item.roles.some((r) => userRoles.includes(r));
            });
            if (visibleItems.length === 0) return null;
            return { ...section, items: visibleItems };
        })
        .filter((s): s is NavSection => s !== null);

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity lg:hidden"
                    onClick={onMobileClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed bottom-0 top-0 z-50 flex min-h-screen flex-col justify-between overflow-y-auto border-r border-slate-200/80 bg-white text-slate-700 shadow-2xl transition-all duration-300 lg:z-40 lg:shadow-xs ${
                    mobileOpen ? 'left-0' : '-left-full lg:left-0'
                } ${isCollapsed ? 'w-72 lg:w-20' : 'w-72'}`}
            >
                {/* Top Logo Container */}
                <div>
                    <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4">
                        <Link
                            href={isStaffOnly ? '/projects' : '/overview'}
                            className="flex w-full items-center justify-center gap-3 overflow-hidden"
                            onClick={() => onMobileClose && onMobileClose()}
                        >
                            {isCollapsed ? (
                                <>
                                    <img
                                        src="/images/yousee.png"
                                        alt="Yousee Icon"
                                        className="hidden h-9 w-auto object-contain lg:block"
                                        title="Yousee Indonesia"
                                    />
                                    <img
                                        src="/images/logo-yousee-panjang.png"
                                        alt="Yousee Indonesia Logo"
                                        className="h-9 w-auto object-contain lg:hidden"
                                    />
                                </>
                            ) : (
                                <img
                                    src="/images/logo-yousee-panjang.png"
                                    alt="Yousee Indonesia Logo"
                                    className="h-9 w-auto object-contain"
                                />
                            )}
                        </Link>

                        {/* Mobile Close Button */}
                        <button
                            type="button"
                            onClick={onMobileClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                            title="Tutup Menu"
                        >
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div
                        className={`space-y-4 py-3 ${isCollapsed ? 'px-3 lg:px-2' : 'px-3'}`}
                    >
                        {visibleSections.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-1">
                                {section.sectionTitle && (
                                    <div
                                        className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                                            isCollapsed ? 'block lg:hidden' : 'block'
                                        }`}
                                    >
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
                                                onClick={() =>
                                                    onMobileClose && onMobileClose()
                                                }
                                                title={
                                                    isCollapsed
                                                        ? item.label
                                                        : undefined
                                                }
                                                className={`flex items-center gap-3 rounded-xl font-bold transition-all ${
                                                    isCollapsed
                                                        ? 'px-4 py-2.5 text-xs lg:mx-auto lg:h-11 lg:w-11 lg:justify-center lg:p-3'
                                                        : 'px-4 py-2.5 text-xs'
                                                } ${
                                                    isActive
                                                        ? 'shadow-xs bg-primary text-white shadow-neon-primary'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                {item.icon}
                                                <span
                                                    className={
                                                        isCollapsed
                                                            ? 'block lg:hidden'
                                                            : 'block'
                                                    }
                                                >
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
