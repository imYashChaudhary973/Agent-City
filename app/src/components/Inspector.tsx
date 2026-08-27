import { useState } from 'react';
import { useCityStore, getCityState } from '../store/cityStore';
import { availableTools } from '../lib/tools';
import { isWebMCPAvailable } from '../lib/webmcp';

export default function Inspector() {
	const state = useCityStore();
	const [selected, setSelected] = useState<string | null>(null);
	const tools = availableTools(state);
	const selectedAction = state.actions.find((a) => a.id === selected);

	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-city-border p-4">
				<div className="mb-2 flex items-center justify-between">
					<span className="font-mono text-xs text-city-muted">WEBMCP INSPECTOR</span>
					<span className={`flex items-center gap-1.5 font-mono text-xs ${isWebMCPAvailable() ? 'text-city-success' : 'text-city-muted'}`}>
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
						{isWebMCPAvailable() ? 'LIVE' : 'NOT CONNECTED'}
					</span>
				</div>
				<div className="text-sm">
					<span className="text-city-accent">{tools.length}</span>{' '}
					<span className="text-city-muted">tools available · {state.actions.length} calls logged</span>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4">
				<div className="mb-4">
					<div className="mb-2 font-mono text-xs text-city-muted">AVAILABLE TOOLS</div>
					<ul className="space-y-1">
						{tools.map((t) => {
							const mode = t.annotations?.readOnlyHint
								? 'READ'
								: t.name.startsWith('cancel')
								? 'DESTRUCTIVE'
								: 'WRITE';
							const color = mode === 'READ' ? 'text-city-success' : mode === 'WRITE' ? 'text-city-warning' : 'text-city-danger';
							return (
								<li key={t.name} className="flex items-center justify-between rounded bg-white/5 px-2 py-1.5">
									<span className="font-mono text-xs">{t.name}</span>
									<span className={`font-mono text-[10px] ${color}`}>{mode}</span>
								</li>
							);
						})}
					</ul>
				</div>

				<div className="mb-2 flex items-center justify-between">
					<span className="font-mono text-xs text-city-muted">RECENT CALLS</span>
					<button
						onClick={() => console.log('City state', getCityState())}
						className="font-mono text-[10px] text-city-accent hover:underline"
					>
						log state
					</button>
				</div>
				<ul className="space-y-1">
					{state.actions.slice(0, 15).map((a) => (
						<li key={a.id}>
							<button
								onClick={() => setSelected(a.id)}
								className={`w-full rounded px-2 py-1.5 text-left font-mono text-xs transition ${
									selected === a.id ? 'bg-city-accent/20 text-white' : 'bg-white/5 text-city-muted hover:bg-white/10'
								}`}
							>
								<div className="flex items-center justify-between">
									<span className={a.status === 'error' ? 'text-city-danger' : 'text-city-accent'}>{a.tool}</span>
									<span>{a.duration}ms</span>
								</div>
								<div className="text-[10px] text-city-muted">{new Date(a.ts).toLocaleTimeString()}</div>
							</button>
						</li>
					))}
					{state.actions.length === 0 && (
						<li className="py-2 text-center text-xs text-city-muted">No WebMCP calls yet.</li>
					)}
				</ul>
			</div>

			{selectedAction && (
				<div className="border-t border-city-border p-4">
					<div className="mb-2 font-mono text-xs text-city-muted">CALL DETAIL</div>
					<pre className="mb-2 max-h-32 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] text-city-muted">{JSON.stringify(selectedAction.input, null, 2)}</pre>
					<pre className="max-h-32 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] text-city-success">{JSON.stringify(selectedAction.result, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}
