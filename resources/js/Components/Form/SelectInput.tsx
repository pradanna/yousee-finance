import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 200 });

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
                const childProps = child.props as {
                    value?: string | number;
                    children?: React.ReactNode;
                };
                const val =
                    childProps.value !== undefined
                        ? String(childProps.value)
                        : String(childProps.children || '');
                const lbl = extractLabel(childProps.children) || val;
                opts.push({ value: val, label: lbl });
            }
        });
        return opts;
    }, [options, children]);

    const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const screenPadding = 12;
        const maxWidth = window.innerWidth - screenPadding * 2;
        const width = Math.min(Math.max(rect.width, 180), maxWidth);
        const estimatedHeight = Math.min(parsedOptions.length * 36 + 16, 240);

        const spaceBelow = window.innerHeight - rect.bottom;
        const renderUpward =
            spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        const top = renderUpward
            ? rect.top - estimatedHeight - 4
            : rect.bottom + 4;

        let left = rect.left;
        if (left + width > window.innerWidth - screenPadding) {
            left = window.innerWidth - width - screenPadding;
        }
        if (left < screenPadding) {
            left = screenPadding;
        }

        setCoords({
            top: top + window.scrollY,
            left: left + window.scrollX,
            width,
        });
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScrollOrResize = () => updateCoords();
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                if (
                    buttonRef.current &&
                    !buttonRef.current.contains(event.target as Node) &&
                    menuRef.current &&
                    !menuRef.current.contains(event.target as Node)
                ) {
                    setIsOpen(false);
                }
            };

            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);

            return () => {
                window.removeEventListener(
                    'scroll',
                    handleScrollOrResize,
                    true,
                );
                window.removeEventListener('resize', handleScrollOrResize);
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        }
    }, [isOpen, parsedOptions.length]);

    const stringValue = String(value);
    const selectedOption =
        parsedOptions.find((opt) => opt.value === stringValue) ||
        parsedOptions[0];

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
                className={`focus:ring-primary/20 shadow-2xs flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-8 text-xs font-bold text-slate-800 transition-all hover:bg-slate-100/80 focus:border-primary focus:outline-none focus:ring-2 ${
                    disabled
                        ? 'cursor-not-allowed bg-slate-100 opacity-50'
                        : 'cursor-pointer'
                }`}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : 'Pilih...'}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
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
                        className="animate-in fade-in zoom-in-95 z-[9999] max-h-60 space-y-0.5 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl duration-150"
                    >
                        {parsedOptions.map((option) => {
                            const isSelected = option.value === stringValue;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all ${
                                        isSelected
                                            ? 'bg-blue-50 font-bold text-blue-700'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <span className="truncate">
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <svg
                                            className="ml-2 h-4 w-4 shrink-0 text-blue-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
