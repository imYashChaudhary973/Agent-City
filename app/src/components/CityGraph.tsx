import { useCityStore } from '../store/cityStore';

export default function CityGraph() {
	const { event, actions } = useCityStore();

	const active = {
		venue: !!event.venue || actions.some((a) => a.tool.includes('venue') && a.status === 'pending'),
		catering: !!event.catering || actions.some((a) => a.tool.includes('catering') && a.status === 'pending'),
		calendar: !!event.calendarSlot || actions.some((a) => a.tool.includes('slot') || (a.tool.includes('schedule') && a.status === 'pending')),
		budget: actions.some((a) => a.tool.includes('budget') || a.tool.includes('cost')),
		event: actions.length > 0,
	};

	const last = actions[0];

	function Node({
		label,
		color,
		isActive,
		selected,
	}: {
		label: string;
		color: string;
		isActive: boolean;
		selected?: boolean;
	}) {
		return (
			<div
				className={`flex h-14 w-24 flex-col items-center justify-center rounded-lg border-2 px-1 text-center text-xs font-semibold transition-all duration-300 ${
					isActive ? `border-${color} text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]` : `border-city-border text-city-muted`
				} ${selected ? `bg-${color}/20` : 'bg-city-panel/60'}`}
			>
				{selected && <span className="leading-none text-city-success">✓</span>}
				<span className={selected ? 'text-white' : ''}>{label}</span>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col p-4">
			<div className="mb-2 flex items-center justify-between">
				<span className="font-mono text-xs text-city-muted">CITY ACTIVITY</span>
				{last && (
					<span className="font-mono text-xs text-city-success">
						{last.tool} · {last.status} · {last.duration}ms
					</span>
				)}
			</div>

			<div className="relative flex flex-1 items-center justify-center">
				<div className="grid grid-cols-3 grid-rows-3 items-center gap-3">
					{/* top: venue */}
					<div />
					<div className="flex flex-col items-center gap-1">
						<div className="h-4 w-px bg-city-border" />
						<Node label="VENUE" color="city-venue" isActive={active.venue} selected={!!event.venue} />
					</div>
					<div />

					{/* middle: catering - event - calendar */}
					<div className="flex flex-col items-center gap-1">
						<Node label="CATERING" color="city-catering" isActive={active.catering} selected={!!event.catering} />
						<div className="h-4 w-px bg-city-border" />
					</div>
					<div className="flex flex-col items-center gap-2">
						<div className="flex items-center gap-1">
							<div className="h-px w-6 bg-city-border" />
							<Node label="EVENT" color="city-accent" isActive={active.event} selected={event.status === 'scheduled'} />
							<div className="h-px w-6 bg-city-border" />
						</div>
						<div className="h-4 w-px bg-city-border" />
					</div>
					<div className="flex flex-col items-center gap-1">
						<Node label="CALENDAR" color="city-calendar" isActive={active.calendar} selected={!!event.calendarSlot} />
						<div className="h-4 w-px bg-city-border" />
					</div>

					{/* bottom: budget */}
					<div />
					<div className="flex flex-col items-center gap-1">
						<Node label="BUDGET" color="city-budget" isActive={active.budget} selected={event.venue !== null && event.catering !== null} />
						<div className="h-4 w-px bg-city-border" />
					</div>
					<div />
				</div>
			</div>
		</div>
	);
}
