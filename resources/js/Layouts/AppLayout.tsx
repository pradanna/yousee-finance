import React, { useState, useEffect, createContext } from 'react';
import Sidebar from '@/Components/Layout/Sidebar';
import Header from '@/Components/Layout/Header';

export const FiscalContext = createContext<{ fiscalMode: 'ppn' | 'non-ppn' }>({ fiscalMode: 'ppn' });

// Backwards compatibility alias
export const DemoContext = FiscalContext;

export function useFiscalMode() {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>(() => {
        if (typeof window === 'undefined') return 'ppn';
        const saved = localStorage.getItem('app_fiscal_mode');
        return (saved === 'ppn' || saved === 'non-ppn') ? saved : 'ppn';
    });

    useEffect(() => {
        const handleModeChange = () => {
            const saved = localStorage.getItem('app_fiscal_mode');
            if (saved === 'ppn' || saved === 'non-ppn') {
                setFiscalMode(saved);
            }
        };
        window.addEventListener('storage_fiscal_mode_changed', handleModeChange);
        return () => window.removeEventListener('storage_fiscal_mode_changed', handleModeChange);
    }, []);

    return fiscalMode;
}

// Backwards compatibility alias
export const useDemoFiscalMode = useFiscalMode;

interface AppLayoutProps {
    children: React.ReactNode;
    activePage: 'overview' | 'vendors' | 'clients' | 'sales' | 'projects' | 'debt-receivable' | 'invoice-po' | 'purchases' | 'sales-transactions' | 'journal' | 'ppn' | 'cashflow';
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ children, activePage, title, breadcrumbs }: AppLayoutProps) {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>('ppn');
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    // Load from localStorage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('app_fiscal_mode');
        if (savedMode === 'ppn' || savedMode === 'non-ppn') {
            setFiscalMode(savedMode);
        }
    }, []);

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

    return (
        <FiscalContext.Provider value={{ fiscalMode }}>
            <div className="min-h-screen bg-slate-100 flex font-sans">
                {/* Left Sidebar */}
                <Sidebar
                    activePage={activePage}
                    fiscalMode={fiscalMode}
                    onFiscalModeToggle={handleFiscalModeToggle}
                    isCollapsed={isCollapsed}
                />

                {/* Main Content Area */}
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
                    <Header
                        title={title}
                        breadcrumbs={breadcrumbs}
                        fiscalMode={fiscalMode}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={handleToggleCollapse}
                    />

                    <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
                        {children}
                    </main>
                </div>
            </div>
        </FiscalContext.Provider>
    );
}
