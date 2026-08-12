import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 p-4 font-sans text-white sm:p-8">
            {/* Full-Screen Background Billboard Image */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <img
                    src="/images/billboard-hero.png"
                    alt="Yousee Finance Background"
                    className="h-full w-full scale-105 object-cover object-center opacity-30"
                />
                {/* Dark Blue Rich Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-blue-950/60 to-slate-950/70"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] opacity-15 [background-size:32px_32px]"></div>
            </div>

            {/* Glowing Ambient Lights */}
            <div className="pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-32 -right-32 z-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl"></div>

            {/* Top Empty Space for Vertical Centering Balance */}
            <div className="relative z-10 pt-2 sm:pt-4"></div>

            {/* Centered Flying Card Container */}
            <div className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/60 sm:p-10">
                {/* Centered Brand Header Inside Flying Card */}
                <div className="mb-6 text-center">
                    <Link href="/" className="group inline-block">
                        <img
                            src="/images/yousee.png"
                            alt="Yousee Indonesia Logo"
                            className="mx-auto h-14 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link>
                </div>

                {/* Form / Children Content */}
                {children}
            </div>

            {/* Bottom Footer */}
            <div className="relative z-10 pt-6 text-center text-xs font-medium text-slate-400">
                <span>
                    &copy; {new Date().getFullYear()} Yousee Indonesia. All
                    rights reserved.
                </span>
            </div>
        </div>
    );
}
