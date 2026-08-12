import React, { useEffect, useState } from 'react';

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
    maxWidth = 'max-w-md',
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
                className={`backdrop-blur-xs fixed inset-0 bg-slate-950/60 transition-opacity duration-300 ease-out ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Slide Panel from Right */}
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <div
                    className={`w-screen ${maxWidth} flex h-full transform flex-col justify-between overflow-hidden border-l border-slate-100 bg-white shadow-2xl transition-transform duration-300 ease-out ${
                        active ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    {/* Header */}
                    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                        <h2 className="text-base font-bold tracking-tight text-slate-800">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="cursor-pointer rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
