import React, { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
    value: string; // Format: "YYYY-MM" e.g. "2026-06"
    onChange: (value: string, year: string, month: string) => void;
    className?: string;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function MonthPicker({ value, onChange, className = '' }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const defaultYear = now.getFullYear();
    const defaultMonthIndex = now.getMonth();

    // Parse current value
    const [selectedYearStr, selectedMonthStr] = value ? value.split('-') : [];
    const currentYear = selectedYearStr ? (parseInt(selectedYearStr, 10) || defaultYear) : defaultYear;
    const currentMonthIndex = selectedMonthStr ? ((parseInt(selectedMonthStr, 10) || (defaultMonthIndex + 1)) - 1) : defaultMonthIndex;

    // View year state inside picker
    const [viewYear, setViewYear] = useState(currentYear);

    // Sync viewYear when prop value changes
    useEffect(() => {
        if (selectedYearStr) {
            setViewYear(parseInt(selectedYearStr, 10));
        }
    }, [selectedYearStr]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectMonth = (monthIndex: number) => {
        const monthNumStr = (monthIndex + 1).toString().padStart(2, '0');
        const yearNumStr = viewYear.toString();
        const newVal = `${yearNumStr}-${monthNumStr}`;
        onChange(newVal, yearNumStr, monthNumStr);
        setIsOpen(false);
    };

    const displayText = `${MONTH_NAMES[currentMonthIndex] || 'Juni'} ${currentYear}`;

    return (
        <div ref={containerRef} className={`relative inline-block ${className}`}>
            {/* Clickable Main Box */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2 px-3.5 rounded-xl shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer select-none"
            >
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{displayText}</span>
                <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Interactive Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header: Year Selector */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear - 1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-bold text-slate-800 tracking-tight">{viewYear}</span>
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear + 1)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {MONTH_SHORT_NAMES.map((shortName, idx) => {
                            const isSelected = viewYear === currentYear && idx === currentMonthIndex;
                            return (
                                <button
                                    key={shortName}
                                    type="button"
                                    onClick={() => handleSelectMonth(idx)}
                                    className={`py-2 px-1 text-xs font-bold rounded-xl transition-all text-center cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-neon-primary shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {shortName}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
