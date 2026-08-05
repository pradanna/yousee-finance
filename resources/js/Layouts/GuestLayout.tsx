import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 text-white relative flex flex-col justify-between items-center p-4 sm:p-8 overflow-hidden font-sans">
            {/* Full-Screen Background Billboard Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                    src="/images/billboard-hero.png"
                    alt="Yousee Finance Background"
                    className="w-full h-full object-cover object-center opacity-30 scale-105"
                />
                {/* Dark Blue Rich Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-blue-950/60 to-slate-950/70"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:32px_32px] opacity-15"></div>
            </div>

            {/* Glowing Ambient Lights */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none z-0"></div>

            {/* Top Empty Space for Vertical Centering Balance */}
            <div className="relative z-10 pt-2 sm:pt-4"></div>

            {/* Centered Flying Card Container */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-950/60 border border-slate-100 relative z-10 my-auto text-slate-900">
                {/* Centered Brand Header Inside Flying Card */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-block group">
                        <img
                            src="/images/yousee.png"
                            alt="Yousee Indonesia Logo"
                            className="h-14 w-auto mx-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>
                </div>

                {/* Form / Children Content */}
                {children}
            </div>

            {/* Bottom Footer */}
            <div className="relative z-10 text-xs text-slate-400 font-medium text-center pt-6">
                <span>&copy; {new Date().getFullYear()} Yousee Indonesia. All rights reserved.</span>
            </div>
        </div>
    );
}


