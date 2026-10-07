import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface Select2Option {
    value: string | number;
    label: string;
    sublabel?: string;
    disabled?: boolean;
    badge?: string;
}

export interface Select2ChangeEvent {
    target: {
        value: string;
        name?: string;
    };
}

export interface Select2Props {
    id?: string;
    name?: string;
    value?: string | number | null;
    onChange?: (e: Select2ChangeEvent) => void;
    onValueChange?: (value: string) => void;
    options?: Select2Option[];
    children?: React.ReactNode;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
    allowClear?: boolean;
    emptyText?: string;
}

export default function Select2({
    id,
    name,
    value = '',
    onChange,
    onValueChange,
    options,
    children,
    placeholder = 'Pilih opsi...',
    searchPlaceholder = 'Cari...',
    className = '',
    disabled = false,
    error,
    allowClear = false,
    emptyText = 'Tidak ada opsi ditemukan',
}: Select2Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsContainerRef = useRef<HTMLDivElement>(null);

    const [coords, setCoords] = useState<{
        top: number;
        left: number;
        width: number;
    }>({ top: 0, left: 0, width: 220 });

    // Extract options from props or children
    const parsedOptions: Select2Option[] = useMemo(() => {
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
            if (
                React.isValidElement<{ children?: React.ReactNode }>(node) &&
                node.props.children
            ) {
                return extractLabel(node.props.children);
            }
            return '';
        };

        const opts: Select2Option[] = [];
        React.Children.forEach(children, (child) => {
            if (
                React.isValidElement<{
                    value?: string | number;
                    disabled?: boolean;
                    children?: React.ReactNode;
                }>(child)
            ) {
                const childProps = child.props;
                const val =
                    childProps.value !== undefined
                        ? String(childProps.value)
                        : String(childProps.children ?? '');
                const lbl = extractLabel(childProps.children) || val;
                opts.push({
                    value: val,
                    label: lbl,
                    disabled: Boolean(childProps.disabled),
                });
            }
        });
        return opts;
    }, [options, children]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return parsedOptions;
        return parsedOptions.filter((opt) => {
            const matchLabel = opt.label.toLowerCase().includes(query);
            const matchSublabel = opt.sublabel
                ? opt.sublabel.toLowerCase().includes(query)
                : false;
            const matchValue = String(opt.value).toLowerCase().includes(query);
            const matchBadge = opt.badge
                ? opt.badge.toLowerCase().includes(query)
                : false;
            return matchLabel || matchSublabel || matchValue || matchBadge;
        });
    }, [parsedOptions, search]);

    const stringValue =
        value !== undefined && value !== null ? String(value) : '';
    const selectedOption = parsedOptions.find(
        (opt) => String(opt.value) === stringValue,
    );

    const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const screenPadding = 12;
        const maxWidth = window.innerWidth - screenPadding * 2;
        const width = Math.min(Math.max(rect.width, 220), maxWidth);
        const estimatedHeight = 300;

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

    // Auto-update coords and handle click outside
    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScrollOrResize = () => updateCoords();
            const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                const targetNode = event.target as Node;
                if (
                    buttonRef.current &&
                    !buttonRef.current.contains(targetNode) &&
                    menuRef.current &&
                    !menuRef.current.contains(targetNode)
                ) {
                    setIsOpen(false);
                }
            };

            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);

            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 30);

            return () => {
                clearTimeout(timer);
                window.removeEventListener(
                    'scroll',
                    handleScrollOrResize,
                    true,
                );
                window.removeEventListener('resize', handleScrollOrResize);
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('touchstart', handleClickOutside);
            };
        } else {
            setSearch('');
            setHighlightedIndex(-1);
        }
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        if (disabled) return;
        const strVal = String(val);
        if (onChange) {
            onChange({ target: { value: strVal, name: name || id || '' } });
        }
        if (onValueChange) {
            onValueChange(strVal);
        }
        setIsOpen(false);
        buttonRef.current?.focus();
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        if (onChange) {
            onChange({ target: { value: '', name: name || id || '' } });
        }
        if (onValueChange) {
            onValueChange('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            buttonRef.current?.focus();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
                scrollOptionIntoView(next);
                return next;
            });
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
                scrollOptionIntoView(next);
                return next;
            });
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (
                highlightedIndex >= 0 &&
                highlightedIndex < filteredOptions.length
            ) {
                const opt = filteredOptions[highlightedIndex];
                if (!opt.disabled) {
                    handleSelect(opt.value);
                }
            }
        }
    };

    const scrollOptionIntoView = (index: number) => {
        if (!optionsContainerRef.current) return;
        const items = optionsContainerRef.current.children;
        if (items[index]) {
            (items[index] as HTMLElement).scrollIntoView({
                block: 'nearest',
            });
        }
    };

    // Determine what to display on the trigger button
    const hasValue =
        selectedOption &&
        selectedOption.value !== '' &&
        selectedOption.value !== undefined;
    const displayText = hasValue
        ? selectedOption.label
        : selectedOption && selectedOption.label
          ? selectedOption.label
          : placeholder;

    return (
        <div className={`relative w-full ${className}`}>
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                id={id}
                name={name}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        if (!isOpen) updateCoords();
                        setIsOpen(!isOpen);
                    }
                }}
                onKeyDown={handleKeyDown}
                className={`focus:ring-primary/20 shadow-2xs flex w-full items-center justify-between gap-2 rounded-xl border bg-slate-50 py-2.5 pl-3.5 pr-3 text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                    error
                        ? 'border-rose-400 text-rose-900 focus:border-rose-500'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-100/80 focus:border-primary'
                } ${
                    disabled
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400 opacity-60'
                        : 'cursor-pointer'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span
                    className={`truncate text-left ${
                        hasValue
                            ? 'text-slate-800'
                            : 'font-medium text-slate-400'
                    }`}
                >
                    {displayText}
                </span>

                <div className="flex shrink-0 items-center gap-1.5 text-slate-400">
                    {/* Clear Button */}
                    {allowClear && hasValue && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleClear(
                                        e as unknown as React.MouseEvent,
                                    );
                                }
                            }}
                            className="rounded-full p-0.5 transition-colors hover:bg-slate-200 hover:text-slate-600"
                            title="Hapus pilihan"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </span>
                    )}

                    {/* Chevron Indicator */}
                    <svg
                        className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen
                                ? 'rotate-180 text-primary'
                                : 'text-slate-400'
                        }`}
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
                </div>
            </button>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-[11px] font-bold text-rose-500">
                    {error}
                </p>
            )}

            {/* Unclipped Searchable Options Menu via React Portal */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'absolute',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            width: `${coords.width}px`,
                        }}
                        onKeyDown={handleKeyDown}
                        className="animate-in fade-in zoom-in-95 z-[9999] flex max-h-72 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl duration-150"
                    >
                        {/* Search Input Bar */}
                        <div className="border-b border-slate-100 p-2">
                            <div className="relative flex items-center">
                                <span className="pointer-events-none absolute left-3 text-slate-400">
                                    <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                        />
                                    </svg>
                                </span>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setHighlightedIndex(-1);
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="focus:ring-primary/20 w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            searchInputRef.current?.focus();
                                        }}
                                        className="absolute right-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                    >
                                        <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Options List */}
                        <div
                            ref={optionsContainerRef}
                            className="max-h-56 flex-1 space-y-0.5 overflow-y-auto p-1.5"
                            role="listbox"
                        >
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-xs font-medium text-slate-400">
                                    {emptyText}
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const isSelected =
                                        String(option.value) === stringValue;
                                    const isHighlighted =
                                        highlightedIndex === index;
                                    const isOptDisabled = Boolean(
                                        option.disabled,
                                    );

                                    return (
                                        <button
                                            key={`${option.value}-${index}`}
                                            type="button"
                                            disabled={isOptDisabled}
                                            onClick={() =>
                                                !isOptDisabled &&
                                                handleSelect(option.value)
                                            }
                                            onMouseEnter={() =>
                                                setHighlightedIndex(index)
                                            }
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                                                isOptDisabled
                                                    ? 'cursor-not-allowed bg-slate-50/50 text-slate-400 opacity-60'
                                                    : isSelected
                                                      ? 'bg-blue-50 font-bold text-blue-700'
                                                      : isHighlighted
                                                        ? 'bg-slate-100 font-semibold text-slate-900'
                                                        : 'font-medium text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                                            }`}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">
                                                        {option.label}
                                                    </span>
                                                    {option.badge && (
                                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                            {option.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {option.sublabel && (
                                                    <span className="truncate text-[10px] text-slate-400">
                                                        {option.sublabel}
                                                    </span>
                                                )}
                                            </div>

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
                                })
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
export { Select2 };
