import type { District } from '../types';
import type { Place } from '../lib/cityEvents';

const items: { id: District; label: string; color: string }[] = [
	{ id: 'city', label: 'City', color: 'text-city-accent' },
	{ id: 'overview', label: 'Plan', color: 'text-white' },
	{ id: 'venues', label: 'Venues', color: 'text-city-venue' },
	{ id: 'catering', label: 'Catering', color: 'text-city-catering' },
	{ id: 'calendar', label: 'Calendar', color: 'text-city-calendar' },
	{ id: 'budget', label: 'Budget', color: 'text-city-budget' },
];

interface DistrictNavProps {
	active: District;
	onSelect: (d: District) => void;
	/** District the agent is touching right now. */
	live?: Place | null;
}

export default function DistrictNav({ active, onSelect, live }: DistrictNavProps) {
	return (
		<nav className="flex flex-col border-r border-city-border bg-city-panel/40 p-3">
			<div className="mb-3 px-2 font-mono text-[10px] tracking-wider text-city-muted">CITY DISTRICTS</div>
			<ul className="space-y-1">
				{items.map((item) => {
					const isActive = active === item.id;
					// `activeDistrict` speaks in Places: the plan lives in the Overview entry.
					const isLive = live === item.id || (live === 'plan' && item.id === 'overview');
					return (
						<li key={item.id}>
							<button
								onClick={() => onSelect(item.id)}
								className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
									isActive
										? 'bg-city-accent/15 text-white'
										: 'text-city-muted hover:bg-white/5 hover:text-city-ink'
								} ${isLive ? 'ring-1 ring-current' : ''}`}
							>
								<span
									className={`h-2 w-2 rounded-full ${
										isActive ? 'bg-current' : 'bg-city-border'
									}`}
									style={{ color: isActive ? undefined : 'transparent' }}
								/>
								<span className={isActive ? 'font-medium text-white' : item.color}>{item.label}</span>
								{isLive && (
									<span className="ml-auto h-1.5 w-1.5 animate-ping rounded-full bg-current" />
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
