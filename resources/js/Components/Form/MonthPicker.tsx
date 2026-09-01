import { useEffect, useRef, useState } from 'react';

interface MonthPickerProps {
    value: string; // Format: "YYYY-MM" e.g. "2026-06" or "all" / ""
    onChange: (value: string, year: string, month: string) => void;
    className?: string;
    allowAll?: boolean;
    allLabel?: string;
}

const MONTH_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const MONTH_SHORT_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Ags',
    'Sep',
    'Okt',
    'Nov',
    'Des',
];

export default function MonthPicker({
    value,
    onChange,
    className = '',
    allowAll = false,
    allLabel = 'Semua Periode',
}: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const defaultYear = now.getFullYear();
    const defaultMonthIndex = now.getMonth();

    const isAllSelected = !value || value === 'all';

    // Parse current value
    const [selectedYearStr, selectedMonthStr] = (!isAllSelected && value) ? value.split('-') : [];
    const currentYear = selectedYearStr
        ? parseInt(selectedYearStr, 10) || defaultYear
        : defaultYear;
    const currentMonthIndex = selectedMonthStr
        ? (parseInt(selectedMonthStr, 10) || defaultMonthIndex + 1) - 1
        : defaultMonthIndex;

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
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectMonth = (monthIndex: number) => {
        const monthNumStr = (monthIndex + 1).toString().padStart(2, '0');
        const yearNumStr = viewYear.toString();
        const newVal = `${yearNumStr}-${monthNumStr}`;
        onChange(newVal, yearNumStr, monthNumStr);
        setIsOpen(false);
    };

    const handleSelectAll = () => {
        onChange('all', 'all', 'all');
        setIsOpen(false);
    };

    const displayText = isAllSelected
        ? allLabel
        : `${MONTH_NAMES[currentMonthIndex] || ''} ${currentYear}`;

    return (
        <div
            ref={containerRef}
            className={`relative inline-block ${className}`}
        >
            {/* Clickable Main Box */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="shadow-2xs focus:ring-primary/20 flex cursor-pointer select-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 transition-all hover:border-slate-300 hover:bg-slate-50 focus:border-primary focus:outline-none focus:ring-2"
            >
                <svg
                    className="h-4 w-4 shrink-0 text-primary"
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
                <span>{displayText}</span>
                <svg
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Interactive Popover */}
            {isOpen && (
                <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl duration-150">
                    {/* Header: Year Selector */}
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear - 1)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <span className="text-sm font-bold tracking-tight text-slate-800">
                            {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={() => setViewYear(viewYear + 1)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {MONTH_SHORT_NAMES.map((shortName, idx) => {
                            const isSelected =
                                !isAllSelected &&
                                viewYear === currentYear &&
                                idx === currentMonthIndex;
                            return (
                                <button
                                    key={shortName}
                                    type="button"
                                    onClick={() => handleSelectMonth(idx)}
                                    className={`cursor-pointer rounded-xl px-1 py-2 text-center text-xs font-bold transition-all ${
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

                    {/* Quick Action: Reset to All Periods */}
                    {allowAll && (
                        <div className="mt-3 border-t border-slate-100 pt-2.5">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className={`w-full cursor-pointer rounded-xl py-1.5 text-center text-xs font-bold transition-all ${
                                    isAllSelected
                                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {allLabel}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
