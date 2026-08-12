import { ChartOfAccount } from '@/Features/Accounting/types';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface CoaSelectInputProps {
    id?: string;
    label?: string;
    value: number | null;
    onChange: (id: number | null) => void;
    options: ChartOfAccount[]; // hanya leaf nodes
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function CoaSelectInput({
    id,
    label,
    value,
    onChange,
    options,
    placeholder = 'Pilih akun...',
    error,
    disabled = false,
}: CoaSelectInputProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const selected = options.find((o) => o.id === value) ?? null;

    const filtered = options.filter((o) =>
        `${o.code} ${o.name}`.toLowerCase().includes(search.toLowerCase()),
    );

    useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }
    }, [open]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={id}
                    className="mb-1.5 block text-xs font-bold tracking-tight text-slate-700"
                >
                    {label}
                </label>
            )}
            <button
                id={id}
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) setOpen((v) => !v);
                    setSearch('');
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-slate-50 px-3.5 py-2.5 text-left text-sm transition-all ${error ? 'border-rose-300 focus:ring-rose-300/20' : 'focus:ring-primary/20 border-slate-200'} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-300 focus:outline-none focus:ring-2'} `}
            >
                {selected ? (
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="flex-shrink-0 font-mono text-xs font-bold text-slate-500">
                            {selected.code}
                        </span>
                        <span className="truncate text-sm text-slate-800">
                            {selected.name}
                        </span>
                    </span>
                ) : (
                    <span className="text-sm text-slate-400">
                        {placeholder}
                    </span>
                )}
                <svg
                    className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                </svg>
            </button>

            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

            {open &&
                createPortal(
                    <div
                        style={dropdownStyle}
                        className="flex max-h-60 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl"
                    >
                        {/* Search */}
                        <div className="p-1.5 pb-1">
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode atau nama akun..."
                                className="focus:ring-primary/20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2"
                            />
                        </div>

                        {/* Options */}
                        <div className="flex-1 overflow-y-auto">
                            {value !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="w-full rounded-xl px-3 py-2 text-left text-xs text-slate-400 transition-colors hover:bg-slate-50"
                                >
                                    — Kosongkan pilihan
                                </button>
                            )}
                            {filtered.length === 0 ? (
                                <div className="py-4 text-center text-xs text-slate-400">
                                    Tidak ada akun ditemukan
                                </div>
                            ) : (
                                filtered.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.id);
                                            setOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors ${opt.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-50'} `}
                                    >
                                        <span className="w-10 flex-shrink-0 font-mono text-[10px] font-bold text-slate-400">
                                            {opt.code}
                                        </span>
                                        <span className="flex-1 truncate text-xs font-medium">
                                            {opt.name}
                                        </span>
                                        {opt.id === value && (
                                            <svg
                                                className="h-3.5 w-3.5 flex-shrink-0 text-blue-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m4.5 12.75 6 6 9-13.5"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
