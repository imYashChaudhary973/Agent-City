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

	return (
		<div className="flex h-full flex-col">
			<div className="mb-3 flex items-center justify-between">
				<span className="font-mono text-xs text-city-muted">CITY ACTIVITY</span>
				{last && (
					<span className="font-mono text-xs text-city-success">
						{last.tool} · {last.status} · {last.duration}ms
					</span>
				)}
			</div>

			<div className="relative flex flex-1 items-center justify-center">
				<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
					<div />
					<div className={`node h-16 w-28 border-city-venue bg-city-venue/10 text-city-venue ${active.venue ? 'active !border-city-venue' : ''}`}>
						VENUE
					</div>
					<div />

					<div className={`node h-16 w-28 border-city-catering bg-city-catering/10 text-city-catering ${active.catering ? 'active !border-city-catering' : ''}`}>
						CATERING
					</div>
					<div className="flex flex-col items-center gap-2">
						<div className={`edge w-16 ${active.event ? 'active' : ''}`} />
						<div className={`node h-20 w-32 border-city-accent bg-city-accent/10 text-city-accent ${active.event ? 'active' : ''}`}>
							EVENT
						</div>
						<div className={`edge w-16 ${active.event ? 'active' : ''}`} />
					</div>
					<div className={`node h-16 w-28 border-city-calendar bg-city-calendar/10 text-city-calendar ${active.calendar ? 'active !border-city-calendar' : ''}`}>
						CALENDAR
					</div>

					<div />
					<div className={`node h-16 w-28 border-city-budget bg-city-budget/10 text-city-budget ${active.budget ? 'active !border-city-budget' : ''}`}>
						BUDGET
					</div>
					<div />
				</div>
			</div>
		</div>
	);
}
