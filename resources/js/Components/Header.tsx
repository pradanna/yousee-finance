import React from 'react';

interface Breadcrumb {
    label: string;
    href?: string;
}

interface HeaderProps {
    title: string;
    breadcrumbs: Breadcrumb[];
    fiscalMode?: 'ppn' | 'non-ppn';
}

export default function Header({ title, breadcrumbs, fiscalMode }: HeaderProps) {
    const formattedDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/55 px-6 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {/* Mobile Hamburger (for responsive views) */}
                <button className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Breadcrumbs & Title */}
                <div>
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-slate-300">/</span>}
                                <span className={crumb.href ? 'hover:text-slate-600 cursor-pointer' : 'text-slate-400'}>
                                    {crumb.label}
                                </span>
                            </React.Fragment>
                        ))}
                    </nav>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none flex items-center gap-2">
                        {title}
                        {fiscalMode && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                fiscalMode === 'ppn'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                                {fiscalMode} mode
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            {/* Right Date and Avatar */}
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-500">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formattedDate}
                </div>

                <div className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center font-bold text-slate-700 text-sm cursor-pointer transition-colors">
                    PM
                </div>
            </div>
        </header>
    );
}
