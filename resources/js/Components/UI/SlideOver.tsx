import React, { useState, useEffect } from 'react';

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export default function SlideOver({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-md"
}: SlideOverProps) {
    const [render, setRender] = useState(isOpen);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            const timer = setTimeout(() => setActive(true), 20);
            return () => clearTimeout(timer);
        } else {
            setActive(false);
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
                    active ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Slide Panel from Right */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div
                    className={`w-screen ${maxWidth} bg-white shadow-2xl border-l border-slate-100 flex flex-col justify-between h-full overflow-hidden transform transition-transform duration-300 ease-out ${
                        active ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
                        <h2 className="text-base font-bold text-slate-800 tracking-tight">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
