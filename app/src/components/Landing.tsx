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
				<div className="h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-city-accent to-city-glow blur-3xl" />
			</div>

			<div className="relative z-10 max-w-3xl text-center">
				<div
					className={`mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl border border-city-border bg-city-panel transition-shadow duration-1000 ${
						glow ? 'shadow-[0_0_40px_rgba(99,102,241,0.35)]' : 'shadow-none'
					}`}
				>
					<span className="font-display text-4xl text-city-accent">A</span>
				</div>

				<h1 className="font-display mb-5 text-6xl text-white">Agent City</h1>
				<p className="mb-10 text-xl text-city-muted">
					A miniature internet where humans and AI agents operate the same city.
				</p>

				<div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
					<button onClick={onEnter} className="btn-primary px-8 py-3 text-base">
						Enter the City
					</button>
					<span className="text-sm text-city-muted">Open in ChatGPT or Chrome WebMCP for the agent experience</span>
				</div>

				<div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
					<div className="panel p-4">
						<div className="mb-2 font-mono text-xs text-city-venue">HUMAN UI</div>
						<p className="text-sm text-city-muted">Cards, forms, and real-time state for people.</p>
					</div>
					<div className="panel p-4">
						<div className="mb-2 font-mono text-xs text-city-catering">AGENT TOOLS</div>
						<p className="text-sm text-city-muted">Typed WebMCP tools the agent discovers and executes.</p>
					</div>
					<div className="panel p-4">
						<div className="mb-2 font-mono text-xs text-city-accent">SHARED STATE</div>
						<p className="text-sm text-city-muted">Both operators see the same plan update live.</p>
					</div>
				</div>

				<p className="mt-10 font-mono text-xs text-city-muted">
					Built with WebMCP · React · Cloudflare Workers
				</p>
			</div>
		</div>
	);
}
