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

	async function search() {
		const res = await apiFetch<SlotsResponse>('/calendar/slots', {
			method: 'POST',
			body: JSON.stringify({ date: event.date, after: event.startTime }),
		});
		setMatches(res.matches);
		setSearched(true);
	}

	async function schedule(slot: CalendarSlot) {
		const res = await apiFetch<EventUpdateResponse>('/calendar/schedule', {
			method: 'POST',
			body: JSON.stringify({ slotId: slot.id }),
		});
		updateEvent(res.event);
	}

	async function cancel() {
		const res = await apiFetch<EventUpdateResponse>('/calendar/cancel', { method: 'POST' });
		updateEvent(res.event);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-calendar">Calendar</h2>
				<button
					onClick={search}
					className="rounded-md bg-city-calendar/20 px-4 py-2 text-sm font-medium text-city-calendar transition hover:bg-city-calendar/30"
>
					Find slots
				</button>
			</div>

			{event.calendarSlot && (
				<div className="panel border-l-4 border-l-city-calendar p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-lg font-semibold">{event.calendarSlot.date} {event.calendarSlot.startTime} ✓ Scheduled</div>
							<div className="text-sm text-city-muted">until {event.calendarSlot.endTime}</div>
						</div>
						<button
							onClick={cancel}
							className="rounded-md border border-city-danger/50 px-3 py-1.5 text-sm text-city-danger hover:bg-city-danger/10"
>
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="grid grid-cols-4 gap-3">
				{searched && matches.length === 0 && <p className="col-span-4 text-city-muted">No available slots.</p>}
				{matches.map((slot) => (
					<div key={slot.id} className="panel p-3">
						<div className="text-base font-semibold">{slot.startTime}</div>
						<div className="text-xs text-city-muted">{slot.date} · {slot.endTime} end</div>
						<button
							onClick={() => schedule(slot)}
							disabled={event.calendarSlot?.id === slot.id}
							className="mt-2 w-full rounded-md bg-city-calendar px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
						>
							{event.calendarSlot?.id === slot.id ? 'Scheduled' : 'Schedule'}
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
