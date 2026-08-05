import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface ActionDropdownProps {
    items: ActionMenuItem[];
    align?: 'left' | 'right';
    direction?: 'down' | 'up';
    className?: string;
}

export default function ActionDropdown({
    items,
    align = 'right',
    direction,
    className = '',
}: ActionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const updateCoords = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 192; // 12rem (w-48)
        const estimatedHeight = items.length * 40 + 16;

        const spaceBelow = window.innerHeight - rect.bottom;
        const renderUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        let left = align === 'right' ? rect.right - menuWidth : rect.left;
        left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

        let top = renderUpward
            ? rect.top - estimatedHeight - 4
            : rect.bottom + 4;

        setCoords({
            top: top + window.scrollY,
            left: left + window.scrollX,
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
    }, [isOpen, items.length]);

    return (
        <div className={`inline-block text-left ${className}`}>
            {/* 3 Dots Trigger Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    if (!isOpen) updateCoords();
                    setIsOpen(!isOpen);
                }}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                title="Aksi Tambahan"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
            </button>

            {/* Unclipped Floating Dropdown Menu (via React Portal) */}
            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        style={{
                            position: 'absolute',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                        }}
                        className="w-48 bg-white rounded-2xl border border-slate-100 shadow-2xl p-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150"
                    >
                        {items.map((item, idx) => {
                            const isDanger = item.variant === 'danger';
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        item.onClick();
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition-all text-left cursor-pointer ${
                                        isDanger
                                            ? 'text-rose-600 hover:bg-rose-50'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </div>
    );
}
