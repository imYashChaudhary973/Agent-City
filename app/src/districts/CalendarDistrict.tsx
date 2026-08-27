import { useState } from 'react';
import { useCityStore, updateEvent } from '../store/cityStore';
import { apiFetch } from '../lib/api';
import type { CalendarSlot, Budget } from '../types';

interface SlotsResponse {
	matches: CalendarSlot[];
	count: number;
}

interface EventUpdateResponse {
	event: Partial<EventPlan>;
	budget?: Budget;
}

export default function CalendarDistrict() {
	const { event } = useCityStore();
	const [matches, setMatches] = useState<CalendarSlot[]>([]);
	const [searched, setSearched] = useState(false);
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
			const res = await apiFetch<SlotsResponse>('/calendar/slots', {
				method: 'POST',
				body: JSON.stringify({ date: event.date, after: event.startTime }),
			});
			setMatches(res.matches);
			setSearched(true);
		} finally {
			setBusy(false);
		}
	}

	async function schedule(slot: CalendarSlot) {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/calendar/schedule', {
				method: 'POST',
				body: JSON.stringify({ slotId: slot.id }),
			});
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/calendar/cancel', { method: 'POST' });
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-calendar">Calendar</h2>
				<button
					onClick={search}
					disabled={busy}
					className="rounded-md bg-city-calendar/20 px-4 py-2 text-sm font-medium text-city-calendar transition hover:bg-city-calendar/30 disabled:opacity-50"
>
					{busy && !searched ? 'Finding…' : 'Find slots'}
				</button>
			</div>

			{event.calendarSlot && (
				<div className="panel border-l-4 border-l-city-calendar p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2 text-lg font-semibold">
								<span className="text-city-success">✓</span>
								{event.calendarSlot.date} {event.calendarSlot.startTime} — Scheduled
							</div>
							<div className="text-sm text-city-muted">until {event.calendarSlot.endTime}</div>
						</div>
						<button
							onClick={cancel}
							disabled={busy}
							className="rounded-md border border-city-danger/50 px-3 py-1.5 text-sm text-city-danger hover:bg-city-danger/10 disabled:opacity-50"
>
								Cancel
							</button>
						</div>
					</div>
				)}

			<div className="space-y-3">
				{searched && matches.length === 0 && <p className="text-city-muted">No available slots.</p>}
				{!searched && !event.calendarSlot && (
					<div className="panel p-6 text-center text-sm text-city-muted">
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
									<div className="flex items-center gap-2 text-base font-semibold">
										{selected && <span className="text-city-success">✓</span>}
										{slot.startTime}
									</div>
									<div className="text-xs text-city-muted">{slot.date} · {slot.endTime} end</div>
								</div>
								<button
									onClick={() => schedule(slot)}
									disabled={selected || busy}
									className="mt-3 w-full rounded-md bg-city-calendar px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
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
