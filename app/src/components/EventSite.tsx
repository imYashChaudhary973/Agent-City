import type { EventPlan } from '../types';

/**
 * The plan, built piece by piece. Empty lot -> hall -> tables -> banner.
 * This is the centrepiece because the plan is what the whole system is about.
 */
export default function EventSite({ event }: { event: EventPlan }) {
	const built = [!!event.venue, !!event.catering, !!event.calendarSlot].filter(Boolean).length;
	const complete = event.status === 'scheduled';

	return (
		<div className="relative flex w-48 flex-col items-center">
			{complete && (
				<div className="absolute -top-6 whitespace-nowrap rounded-sm bg-city-success px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-black">
					EVENT SCHEDULED
				</div>
			)}

			<div
				className={`relative flex w-full flex-col justify-end overflow-hidden border-2 transition-all duration-500 ${
					complete
						? 'border-city-success shadow-[0_0_36px_rgba(16,185,129,0.35)]'
						: built > 0
							? 'border-city-accent shadow-[0_0_24px_rgba(99,102,241,0.25)]'
							: 'border-dashed border-city-border'
				}`}
				style={{ height: 112, background: '#0a0a0f' }}
			>
				{/* banner — calendar slot locked in */}
				{event.calendarSlot && (
					<div className="absolute inset-x-0 top-0 flex items-center justify-center bg-city-calendar/85 py-0.5 font-mono text-[8px] font-bold tracking-wider text-black">
						{event.calendarSlot.startTime}–{event.calendarSlot.endTime}
					</div>
				)}

				{/* tables — catering ordered */}
				{event.catering && (
					<div className="absolute inset-x-0 bottom-6 flex justify-center gap-1.5">
						{Array.from({ length: 4 }).map((_, i) => (
							<span key={i} className="h-1.5 w-1.5 bg-city-catering shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
						))}
					</div>
				)}

				{/* hall — venue reserved */}
				{event.venue ? (
					<div className="h-8 w-full bg-city-venue/25 border-t-2 border-city-venue">
						<div className="flex h-full items-end gap-1 px-2 pb-1">
							{Array.from({ length: 6 }).map((_, i) => (
								<span
									key={i}
									className={`h-1.5 w-1.5 ${complete ? 'bg-city-calendar' : 'bg-city-venue/60'}`}
								/>
							))}
						</div>
					</div>
				) : (
					<div className="flex h-full items-center justify-center font-mono text-[8px] tracking-widest text-city-muted">
						EMPTY LOT
					</div>
				)}
			</div>

			<div className="mt-2 font-mono text-[10px] font-bold tracking-widest text-city-ink">EVENT SITE</div>
			<div className="font-mono text-[8px] text-city-muted">{built}/3 committed</div>
		</div>
	);
}
