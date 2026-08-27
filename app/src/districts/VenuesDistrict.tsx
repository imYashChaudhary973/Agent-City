import { useState } from 'react';
import { useCityStore, updateEvent } from '../store/cityStore';
import { apiFetch } from '../lib/api';
import type { Venue, Budget } from '../types';

interface VenueSearchResponse {
	matches: Venue[];
	count: number;
}

interface EventUpdateResponse {
	event: Partial<EventPlan>;
	budget?: Budget;
}

export default function VenuesDistrict() {
	const { event } = useCityStore();
	const [matches, setMatches] = useState<Venue[]>([]);
	const [searched, setSearched] = useState(false);

	async function search() {
		const res = await apiFetch<VenueSearchResponse>('/venues/search', {
			method: 'POST',
			body: JSON.stringify({
				minimumCapacity: event.attendees,
				maximumPrice: event.budgetLimit,
				date: event.date,
			}),
		});
		setMatches(res.matches);
		setSearched(true);
	}

	async function reserve(venue: Venue) {
		const res = await apiFetch<EventUpdateResponse>('/venues/reserve', {
			method: 'POST',
			body: JSON.stringify({ venueId: venue.id, attendees: event.attendees, date: event.date }),
		});
		updateEvent(res.event);
	}

	async function cancel() {
		const res = await apiFetch<EventUpdateResponse>('/venues/cancel', { method: 'POST' });
		updateEvent(res.event);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-venue">Venues</h2>
				<button
					onClick={search}
					className="rounded-md bg-city-venue/20 px-4 py-2 text-sm font-medium text-city-venue transition hover:bg-city-venue/30"
>
					Search for venues
				</button>
			</div>

			{event.venue && (
				<div className="panel border-l-4 border-l-city-venue p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-lg font-semibold">{event.venue.name} ✓ Reserved</div>
							<div className="text-sm text-city-muted">{event.venue.capacity} capacity · ₹{event.venue.price}</div>
						</div>
						<button
							onClick={cancel}
							className="rounded-md border border-city-danger/50 px-3 py-1.5 text-sm text-city-danger hover:bg-city-danger/10"
>
							Cancel
						</button>
					</div>
					{event.venue.capacity < event.attendees && (
						<div className="mt-3 rounded bg-city-danger/10 p-2 text-sm text-city-danger">
							⚠ Capacity {event.venue.capacity} is less than required {event.attendees}
						</div>
					)}
				</div>
			)}

			<div className="grid gap-4">
				{searched && matches.length === 0 && <p className="text-city-muted">No venues match your constraints.</p>}
				{matches.map((venue) => (
					<div key={venue.id} className="panel p-4">
						<div className="flex items-start justify-between">
							<div>
								<div className="text-base font-semibold">{venue.name}</div>
								<div className="text-sm text-city-muted">{venue.location} · Capacity {venue.capacity} · ₹{venue.price}</div>
								<div className="mt-1 flex gap-2">
									{venue.features.map((f) => (
										<span key={f} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">{f}</span>
									))}
								</div>
							</div>
							<button
								onClick={() => reserve(venue)}
								disabled={event.venue?.id === venue.id}
								className="rounded-md bg-city-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
							>
								{event.venue?.id === venue.id ? 'Reserved' : 'Reserve'}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
