import { useEffect, useRef, useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { availableTools } from '../lib/tools';
import { isWebMCPAvailable } from '../lib/webmcp';
import { toolViews, newlyRegistered, schemaSummary, type ToolPhase } from '../lib/agentView';
import { PLACE_COLOR, type Place } from '../lib/cityEvents';
import type { Tool } from '../types/webmcp';
import { useHold } from '../hooks/useHold';

const KIND_BADGE = {
	read: { label: 'READ', cls: 'bg-city-success/10 text-city-success' },
	write: { label: 'WRITE', cls: 'bg-city-warning/10 text-city-warning' },
	destructive: { label: 'DESTRUCTIVE', cls: 'bg-city-danger/10 text-city-danger' },
} as const;

function phaseLine(phase: ToolPhase, duration: number | null, origin: 'agent' | 'human' | null) {
	switch (phase) {
		case 'calling':
			return { text: `${origin === 'human' ? 'you' : 'agent'} calling…`, cls: 'text-city-accent' };
		case 'awaiting':
			return { text: '⏸ AWAITING HUMAN', cls: 'text-city-warning' };
		case 'ok':
			return { text: `→ returned · ${duration}ms`, cls: 'text-city-success' };
		case 'error':
			return { text: '✕ failed', cls: 'text-city-danger' };
		default:
			return null;
	}
}

export default function AgentPane({ onFollow }: { onFollow: (d: Place) => void }) {
	const state = useCityStore();
	const tools: Tool[] = availableTools(state);
	const names = tools.map((t) => t.name);
	const views = toolViews(names, state.actions, state.pendingApprovals);
	const connected = isWebMCPAvailable();

	const [expanded, setExpanded] = useState<string | null>(null);
	const [flash, setFlash] = useState<Set<string>>(new Set());
	const [follow, setFollow] = useState(false);
	const prevNames = useRef<string[]>(names);

	// Tools that just registered get a ✦NEW flash — dynamic registration made visible.
	useEffect(() => {
		const added = newlyRegistered(prevNames.current, names);
		prevNames.current = names;
		if (added.length === 0) return;
		setFlash((f) => new Set([...f, ...added]));
		const id = setTimeout(() => {
			setFlash((f) => {
				const next = new Set(f);
				for (const n of added) next.delete(n);
				return next;
			});
		}, 4000);
		return () => clearTimeout(id);
	}, [names.join(',')]);

	// Follow-agent: the left pane tracks whatever the agent is touching.
	const live = state.actions.find((a) => a.status === 'pending');
	const liveDistrict = views.find((v) => v.name === live?.tool)?.district ?? null;
	useEffect(() => {
		if (follow && liveDistrict && liveDistrict !== 'plan') onFollow(liveDistrict);
	}, [follow, liveDistrict, onFollow]);

	// Keep in-flight tools lit briefly after they resolve, so a 28ms call is
	// still visible. The duration text always reports the truth.
	const inFlight = views.filter((v) => v.phase === 'calling' || v.phase === 'awaiting').map((v) => v.name);
	const litNames = useHold(inFlight.length ? inFlight.join(',') : null, 700);
	const lit = new Set(litNames ? litNames.split(',') : []);

	const calls = state.actions.filter((a) => a.tool !== 'toolchange').length;

	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-city-border px-4 py-3">
				<div className="mb-2 flex items-center justify-between">
					<span className="font-mono text-[10px] tracking-wider text-city-muted">WHAT THE AGENT SEES</span>
					<span className={`tag ${connected ? 'bg-city-success/10 text-city-success' : 'bg-city-muted/15 text-city-muted'}`}>
						{connected ? 'MODELCONTEXT LIVE' : 'NO AGENT'}
					</span>
				</div>
				<div className="flex items-center justify-between text-sm text-city-muted">
					<span>
						<span className="font-semibold text-white">{tools.length}</span> tools ·{' '}
						<span className="font-semibold text-white">{calls}</span> calls
					</span>
					<label className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-wider">
						<input
							type="checkbox"
							checked={follow}
							onChange={(e) => setFollow(e.target.checked)}
							className="h-3 w-3 accent-[var(--color-city-accent)]"
						/>
						FOLLOW AGENT
					</label>
				</div>
			</div>

			<ul className="flex-1 space-y-1.5 overflow-auto p-3">
				{views.map((v) => {
					const badge = KIND_BADGE[v.kind];
					const color = v.district ? PLACE_COLOR[v.district] : 'var(--color-city-accent)';
					const active = v.phase === 'calling' || v.phase === 'awaiting' || lit.has(v.name);
					const line = phaseLine(v.phase, v.lastDuration, v.lastOrigin);
					const isNew = flash.has(v.name);
					const open = expanded === v.name;
					const schema = tools.find((t) => t.name === v.name)?.inputSchema;
					const fields = schemaSummary(schema);

					return (
						<li key={v.name}>
							<button
								onClick={() => setExpanded(open ? null : v.name)}
								className="relative w-full rounded-lg border px-2.5 py-2 text-left transition-all duration-300"
								style={{
									borderColor: active ? color : 'var(--color-city-border)',
									background: active ? `color-mix(in srgb, ${color} 12%, transparent)` : 'rgba(255,255,255,0.03)',
									boxShadow: active ? `0 0 20px color-mix(in srgb, ${color} 35%, transparent)` : 'none',
								}}
							>
								{/* connector nub — the seam between what you see and what the agent sees */}
								{active && (
									<span
										className="absolute -left-3 top-1/2 h-0.5 w-3 -translate-y-1/2"
										style={{ background: color, boxShadow: `0 0 8px ${color}` }}
									/>
								)}

								<div className="flex items-center justify-between gap-2">
									<span className="truncate font-mono text-xs" style={{ color: active ? '#fff' : 'var(--color-city-ink)' }}>
										{v.name}
									</span>
									<span className="flex shrink-0 items-center gap-1">
										{isNew && <span className="tag bg-city-accent/20 text-city-accent">✦NEW</span>}
										<span className={`tag ${badge.cls}`}>{badge.label}</span>
									</span>
								</div>

								{line && (
									<div className={`mt-1 font-mono text-[10px] ${line.cls} ${v.phase === 'awaiting' ? 'animate-pulse' : ''}`}>
										{line.text}
									</div>
								)}

								{isNew && !line && (
									<div className="mt-1 font-mono text-[10px] text-city-accent">↑ just registered</div>
								)}

								{open && fields.length > 0 && (
									<pre className="mt-2 overflow-auto rounded bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-city-muted">
										{'{\n'}
										{fields.map((f) => `  ${f}\n`).join('')}
										{'}'}
									</pre>
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
