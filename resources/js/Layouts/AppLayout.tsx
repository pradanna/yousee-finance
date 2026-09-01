import Header from '@/Components/Layout/Header';
import Sidebar from '@/Components/Layout/Sidebar';
import React, { createContext, useEffect, useState } from 'react';

export const FiscalContext = createContext<{ fiscalMode: 'ppn' | 'non-ppn' }>({
    fiscalMode: 'ppn',
});

// Backwards compatibility alias
export const DemoContext = FiscalContext;

export function useFiscalMode() {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>(() => {
        if (typeof window === 'undefined') return 'ppn';
        const saved = localStorage.getItem('app_fiscal_mode');
        return saved === 'ppn' || saved === 'non-ppn' ? saved : 'ppn';
    });

    useEffect(() => {
        const handleModeChange = () => {
            const saved = localStorage.getItem('app_fiscal_mode');
            if (saved === 'ppn' || saved === 'non-ppn') {
                setFiscalMode(saved);
            }
        };
        window.addEventListener(
            'storage_fiscal_mode_changed',
            handleModeChange,
        );
        return () =>
            window.removeEventListener(
                'storage_fiscal_mode_changed',
                handleModeChange,
            );
    }, []);

    return fiscalMode;
}

// Backwards compatibility alias
export const useDemoFiscalMode = useFiscalMode;

interface AppLayoutProps {
    children: React.ReactNode;
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
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
}

export default function AppLayout({
    children,
    activePage,
    title,
    breadcrumbs,
}: AppLayoutProps) {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>(() => {
        if (typeof window === 'undefined') return 'ppn';
        const saved = localStorage.getItem('app_fiscal_mode');
        return saved === 'ppn' || saved === 'non-ppn' ? saved : 'ppn';
    });
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    // Listen to storage/tab/event changes
    useEffect(() => {
        const handleModeChange = () => {
            const savedMode = localStorage.getItem('app_fiscal_mode');
            if (savedMode === 'ppn' || savedMode === 'non-ppn') {
                setFiscalMode(savedMode);
            }
        };

        window.addEventListener(
            'storage_fiscal_mode_changed',
            handleModeChange,
        );
        return () =>
            window.removeEventListener(
                'storage_fiscal_mode_changed',
                handleModeChange,
            );
    }, []);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute(
                'data-fiscal-mode',
                fiscalMode,
            );
        }
    }, [fiscalMode]);

    const handleFiscalModeToggle = (mode: 'ppn' | 'non-ppn') => {
        setFiscalMode(mode);
        localStorage.setItem('app_fiscal_mode', mode);
        // Dispatch event for other listeners
        window.dispatchEvent(new Event('storage_fiscal_mode_changed'));
    };

    const handleToggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    const [mobileOpen, setMobileOpen] = useState<boolean>(false);

    return (
        <FiscalContext.Provider value={{ fiscalMode }}>
            <div className="flex min-h-screen bg-slate-100 font-sans">
                {/* Left Sidebar */}
                <Sidebar
                    activePage={activePage}
                    isCollapsed={isCollapsed}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />

                {/* Main Content Area */}
                <div
                    className={`flex min-w-0 flex-1 flex-col transition-all duration-300 pl-0 ${
                        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
                    }`}
                >
                    <Header
                        title={title}
                        breadcrumbs={breadcrumbs}
                        fiscalMode={fiscalMode}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={handleToggleCollapse}
                        onMobileMenuToggle={() => setMobileOpen(true)}
                        onFiscalModeToggle={handleFiscalModeToggle}
                    />

                    <main className="w-full flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </FiscalContext.Provider>
    );
}
