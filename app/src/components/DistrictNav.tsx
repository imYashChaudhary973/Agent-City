import type { District } from '../types';

const items: { id: District; label: string; color: string }[] = [
	{ id: 'overview', label: 'Overview', color: 'text-white' },
	{ id: 'venues', label: 'Venues', color: 'text-city-venue' },
	{ id: 'catering', label: 'Catering', color: 'text-city-catering' },
	{ id: 'calendar', label: 'Calendar', color: 'text-city-calendar' },
	{ id: 'budget', label: 'Budget', color: 'text-city-budget' },
];

interface DistrictNavProps {
	active: District;
	onSelect: (d: District) => void;
}

export default function DistrictNav({ active, onSelect }: DistrictNavProps) {
	return (
		<nav className="border-r border-city-border bg-city-panel/40 p-4">
			<div className="mb-4 font-mono text-xs text-city-muted">CITY DISTRICTS</div>
			<ul className="space-y-1">
				{items.map((item) => (
					<li key={item.id}>
						<button
							onClick={() => onSelect(item.id)}
							className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${
								active === item.id ? 'bg-city-accent/20 text-white' : 'text-city-muted hover:bg-white/5'
							}`}
						>
							<span className={`h-2 w-2 rounded-full ${active === item.id ? 'bg-city-accent' : 'bg-city-border'}`} />
							<span className={active === item.id ? 'text-white' : item.color}>{item.label}</span>
						</button>
					</li>
				))}
			</ul>
		</nav>
	);
}
