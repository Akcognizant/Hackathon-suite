export default function AuthBrandPanel() {
    return (
        <aside
            className="hidden md:flex w-[46%] flex-col justify-between px-14 py-16
                 relative overflow-hidden flex-shrink-0"
            style={{ backgroundColor: '#26215C' }}
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
            <div className="relative z-10 flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
                        <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                        <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
                        <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: '#EEEDFE' }}>PatternIQ</p>
                    <p className="text-xs" style={{ color: '#7F77DD' }}>Assessment platform</p>
                </div>
            </div>

            {/* Middle — hero */}
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>
                        Cognitive assessment
                    </p>
                    <h1 className="text-3xl font-medium leading-snug"
                        style={{ color: '#EEEDFE' }}>
                        Discover your pattern recognition potential
                    </h1>
                    <p className="text-sm leading-relaxed" style={{ color: '#AFA9EC' }}>
                        Challenge yourself with adaptive pattern-based questions and gain
                        deep insights into your logical reasoning skills.
                    </p>
                </div>

            </div>

            {/* Bottom — copyright */}
            <div className="relative z-10">
                <p className="text-xs" style={{ color: '#534AB7' }}>
                    &copy; 2026 PatternIQ. All rights reserved.
                </p>
            </div>
        </aside>
    )
}