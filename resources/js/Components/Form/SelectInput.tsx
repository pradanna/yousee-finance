import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectInputProps {
    value?: string | number;
    onChange?: (e: { target: { value: string } }) => void;
    options?: SelectOption[];
    children?: React.ReactNode;
    className?: string;
    id?: string;
    disabled?: boolean;
}

export default function SelectInput({
    value = '',
    onChange,
    options,
    children,
    className = '',
    disabled = false,
}: SelectInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });

    // Extract options from children if options array is not provided
    const parsedOptions: SelectOption[] = useMemo(() => {
        if (options && options.length > 0) {
            return options;
        }

        const extractLabel = (node: React.ReactNode): string => {
            if (typeof node === 'string' || typeof node === 'number') {
                return String(node);
            }
            if (Array.isArray(node)) {
                return node.map(extractLabel).join('');
            }
            if (React.isValidElement(node)) {
                return extractLabel((node.props as any).children);
            }
            return '';
        };

        const opts: SelectOption[] = [];
        React.Children.forEach(children, (child) => {
            if (React.isValidElement(child)) {
                const childProps = child.props as { value?: string | number; children?: React.ReactNode };
                const val = childProps.value !== undefined ? String(childProps.value) : String(childProps.children || '');
                const lbl = extractLabel(childProps.children) || val;
                opts.push({ value: val, label: lbl });
            }
        });
        return opts;
    }, [options, children]);

    const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const width = Math.max(rect.width, 200);
        const estimatedHeight = Math.min(parsedOptions.length * 36 + 16, 240);

        const spaceBelow = window.innerHeight - rect.bottom;
        const renderUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        let top = renderUpward
            ? rect.top - estimatedHeight - 4
            : rect.bottom + 4;

        setCoords({
            top: top + window.scrollY,
            left: rect.left + window.scrollX,
            width,
        });
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScrollOrResize = () => updateCoords();
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                    menuRef.current && !menuRef.current.contains(event.target as Node)
                ) {
                    setIsOpen(false);
                }
            };

            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                window.removeEventListener('scroll', handleScrollOrResize, true);
                window.removeEventListener('resize', handleScrollOrResize);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, parsedOptions.length]);

    const stringValue = String(value);
    const selectedOption = parsedOptions.find((opt) => opt.value === stringValue) || parsedOptions[0];

    const handleSelect = (val: string) => {
        if (disabled) return;
        if (onChange) {
            onChange({ target: { value: val } });
        }
        setIsOpen(false);
    };

    return (
        <div className={`relative w-full ${className}`}>
            {/* Select Box Trigger */}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        if (!isOpen) updateCoords();
                        setIsOpen(!isOpen);
                    }
                }}
                className={`w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-bold text-slate-800 py-2.5 pl-3.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all flex items-center justify-between shadow-2xs ${
                    disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'
                }`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : 'Pilih...'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Unclipped Options Menu (via React Portal) */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'absolute',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            minWidth: `${coords.width}px`,
                        }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150 space-y-0.5 max-h-60 overflow-y-auto"
                    >
                        {parsedOptions.map((option) => {
                            const isSelected = option.value === stringValue;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-left ${
                                        isSelected
                                            ? 'bg-blue-50 text-blue-700 font-bold'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-blue-600 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
}
