import { useState, useEffect } from 'react';

interface LandingProps {
	onEnter: () => void;
}

export default function Landing({ onEnter }: LandingProps) {
	const [glow, setGlow] = useState(false);
	useEffect(() => {
		const id = setInterval(() => setGlow((g) => !g), 2000);
		return () => clearInterval(id);
	}, []);

	return (
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden city-grid px-6">
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
				<div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-city-accent to-city-glow blur-3xl" />
			</div>

			<div className="relative z-10 max-w-2xl text-center">
				<div
					className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-city-border bg-city-panel transition-shadow duration-1000 ${
						glow ? 'shadow-[0_0_48px_rgba(99,102,241,0.4)]' : 'shadow-none'
					}`}
				>
					<span className="text-3xl font-bold text-city-accent">A</span>
				</div>

				<h1 className="mb-4 text-5xl font-bold tracking-tight text-white">Agent City</h1>
				<p className="mb-8 text-xl text-city-muted">
					A miniature internet built for humans and AI agents.
				</p>

				<div className="mb-10 grid grid-cols-3 gap-4 text-left">
					<div className="panel p-4">
						<div className="mb-2 text-city-venue font-mono text-xs">HUMAN</div>
						<p className="text-sm text-city-muted">Visual interface with cards, forms, and real-time state.</p>
					</div>
					<div className="panel p-4">
						<div className="mb-2 text-city-catering font-mono text-xs">AGENT</div>
						<p className="text-sm text-city-muted">Typed WebMCP tools discovered and executed directly.</p>
					</div>
					<div className="panel p-4">
						<div className="mb-2 text-city-accent font-mono text-xs">SHARED STATE</div>
						<p className="text-sm text-city-muted">Both users operate the same underlying city plan.</p>
					</div>
				</div>

				<button
					onClick={onEnter}
					className="rounded-lg bg-city-accent px-8 py-3 font-semibold text-white transition hover:bg-city-glow"
				>
					Enter the City
				</button>

				<p className="mt-6 font-mono text-xs text-city-muted">Powered by WebMCP · Chrome · ChatGPT · Cloudflare</p>
			</div>
		</div>
	);
}
