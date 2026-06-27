import React, { useState, useEffect, createContext } from 'react';
import Sidebar from '@/Components/Sidebar';
import Header from '@/Components/Header';

export const DemoContext = createContext<{ fiscalMode: 'ppn' | 'non-ppn' }>({ fiscalMode: 'ppn' });

export function useDemoFiscalMode() {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>(() => {
        if (typeof window === 'undefined') return 'ppn';
        const saved = localStorage.getItem('demo_fiscal_mode');
        return (saved === 'ppn' || saved === 'non-ppn') ? saved : 'ppn';
    });

    useEffect(() => {
        const handleModeChange = () => {
            const saved = localStorage.getItem('demo_fiscal_mode');
            if (saved === 'ppn' || saved === 'non-ppn') {
                setFiscalMode(saved);
            }
        };
        window.addEventListener('storage_fiscal_mode_changed', handleModeChange);
        return () => window.removeEventListener('storage_fiscal_mode_changed', handleModeChange);
    }, []);

    return fiscalMode;
}

interface DemoLayoutProps {
    children: React.ReactNode;
    activePage: 'overview' | 'vendors' | 'clients' | 'sales' | 'projects' | 'debt-receivable' | 'invoice-po' | 'purchases' | 'sales-transactions' | 'journal' | 'ppn' | 'cashflow';
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
}

export default function DemoLayout({ children, activePage, title, breadcrumbs }: DemoLayoutProps) {
    const [fiscalMode, setFiscalMode] = useState<'ppn' | 'non-ppn'>('ppn');

    // Load from localStorage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('demo_fiscal_mode');
        if (savedMode === 'ppn' || savedMode === 'non-ppn') {
            setFiscalMode(savedMode);
        }
    }, []);

    const handleFiscalModeToggle = (mode: 'ppn' | 'non-ppn') => {
        setFiscalMode(mode);
        localStorage.setItem('demo_fiscal_mode', mode);
        // Dispatch event for other listeners if needed
        window.dispatchEvent(new Event('storage_fiscal_mode_changed'));
    };

    return (
        <DemoContext.Provider value={{ fiscalMode }}>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Left Sidebar */}
                <Sidebar
                    activePage={activePage}
                    fiscalMode={fiscalMode}
                    onFiscalModeToggle={handleFiscalModeToggle}
                />

                {/* Main Content Area */}
                <div className="flex-1 pl-72 flex flex-col min-w-0">
                    <Header
                        title={title}
                        breadcrumbs={breadcrumbs}
                        fiscalMode={fiscalMode}
                    />

                    <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </DemoContext.Provider>
    );
}
