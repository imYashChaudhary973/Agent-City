import { useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { lastMatches } from '../lib/agentView';
import { runTool } from '../lib/tools';
import type { CalendarSlot } from '../types';

export default function CalendarDistrict() {
	const state = useCityStore();
	const { event } = state;
	// Results come from the action stream, so an agent-run search renders here too.
	const matches = lastMatches<CalendarSlot>(state.actions, 'find_available_slots') ?? [];
	const searched = lastMatches<CalendarSlot>(state.actions, 'find_available_slots') !== null;
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
			await runTool('find_available_slots', {
				date: event.date,
				after: event.startTime,
			});
		} finally {
			setBusy(false);
		}
	}

	async function schedule(slot: CalendarSlot) {
		setBusy(true);
		try {
			await runTool('schedule_event', { slotId: slot.id });
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			await runTool('cancel_event', {});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-calendar">Calendar</h2>
				<button onClick={search} disabled={busy} className="btn-primary bg-city-calendar/20 text-city-calendar hover:bg-city-calendar/30">
					{busy ? 'Finding…' : 'Find slots'}
				</button>
			</div>

			{event.calendarSlot && (
				<div className="panel overflow-hidden">
					<div className="flex items-center gap-3 border-b border-city-border bg-city-calendar/10 px-5 py-3">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-city-success/15 text-city-success">✓</span>
						<div className="font-medium text-city-ink">
							{event.calendarSlot.date} {event.calendarSlot.startTime} — Scheduled
						</div>
					</div>
					<div className="flex items-center justify-between gap-4 px-5 py-4">
						<div className="text-sm text-city-muted">until {event.calendarSlot.endTime}</div>
						<button onClick={cancel} disabled={busy} className="btn-danger shrink-0">
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="space-y-3">
				{searched && matches.length === 0 && <p className="text-city-muted">No available slots.</p>}
				{!searched && !event.calendarSlot && (
					<div className="panel p-8 text-center text-sm text-city-muted">
						Click “Find slots” to see calendar options for {event.date} after {event.startTime}.
					</div>
				)}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					{matches.map((slot) => {
						const selected = event.calendarSlot?.id === slot.id;
						return (
							<div
								key={slot.id}
								className={`panel flex flex-col justify-between p-4 transition ${selected ? 'ring-1 ring-city-calendar' : ''}`}
							>
								<div>
									<div className="flex items-center gap-2 text-base font-semibold text-city-ink">
										{selected && <span className="text-city-success">✓</span>}
										{slot.startTime}
									</div>
									<div className="text-xs text-city-muted">
										{slot.date} · {slot.endTime} end
									</div>
								</div>
								<button
									onClick={() => schedule(slot)}
									disabled={selected || busy}
									className="btn-primary mt-3 w-full bg-city-calendar/20 text-city-calendar hover:bg-city-calendar/30 disabled:cursor-not-allowed disabled:opacity-40"
								>
									{selected ? 'Scheduled' : 'Schedule'}
								</button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
