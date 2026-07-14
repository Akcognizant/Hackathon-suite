import BrandMark from './BrandMark'

export default function AuthBrandPanel() {
    return (
        <aside
            className="hidden md:flex w-[46%] flex-col justify-between px-14 py-16
                 relative overflow-hidden flex-shrink-0 bg-slate-900"
        >
            {/* Dot grid background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(83,74,183,0.45) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Top — brand */}
            <div className="relative z-10">
                <BrandMark tone="light" size="lg" />
            </div>

            {/* Middle — hero */}
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold tracking-widest uppercase text-teal-400">
                        Cognitive assessment
                    </p>
                    <h1 className="text-3xl font-semibold leading-snug text-white">
                        Discover your pattern recognition potential
                    </h1>
                    <p className="text-sm leading-relaxed text-slate-300">
                        Challenge yourself with adaptive pattern-based questions and gain
                        deep insights into your logical reasoning skills.
                    </p>
                </div>
            </div>

            {/* Bottom — copyright */}
            <div className="relative z-10">
                <p className="text-xs text-slate-500">
                    &copy; 2026 Cognizant, All rights reserved.
                </p>
            </div>
        </aside>
    )
}
