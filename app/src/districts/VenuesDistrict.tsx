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
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
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
		} finally {
			setBusy(false);
		}
	}

	async function reserve(venue: Venue) {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/venues/reserve', {
				method: 'POST',
				body: JSON.stringify({ venueId: venue.id, attendees: event.attendees, date: event.date }),
			});
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/venues/cancel', { method: 'POST' });
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-venue">Venues</h2>
				<button
					onClick={search}
					disabled={busy}
					className="rounded-md bg-city-venue/20 px-4 py-2 text-sm font-medium text-city-venue transition hover:bg-city-venue/30 disabled:opacity-50"
>
					{busy && !searched ? 'Searching…' : 'Search for venues'}
				</button>
			</div>

			{event.venue && (
				<div className="panel border-l-4 border-l-city-venue p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2 text-lg font-semibold">
								<span className="text-city-success">✓</span>
								{event.venue.name} — Reserved
							</div>
							<div className="text-sm text-city-muted">{event.venue.capacity} capacity · ₹{event.venue.price} · {event.venue.location}</div>
						</div>
						<button
							onClick={cancel}
							disabled={busy}
							className="rounded-md border border-city-danger/50 px-3 py-1.5 text-sm text-city-danger hover:bg-city-danger/10 disabled:opacity-50"
>
								Cancel
							</button>
						</div>
						{event.venue.capacity < event.attendees && (
							<div className="mt-3 rounded bg-city-danger/10 p-2 text-sm text-city-danger">
								⚠ Capacity {event.venue.capacity} is less than required {event.attendees}. Search again for a larger venue.
							</div>
						)}
					</div>
				)}

			<div className="space-y-3">
				{searched && matches.length === 0 && <p className="text-city-muted">No venues match your constraints.</p>}
				{!searched && !event.venue && (
					<div className="panel p-6 text-center text-sm text-city-muted">
						Click “Search for venues” to see venues that fit your people, date, and budget.
					</div>
				)}
				{matches.map((venue) => {
					const selected = event.venue?.id === venue.id;
					const tooSmall = venue.capacity < event.attendees;
					return (
						<div
							key={venue.id}
							className={`panel p-4 transition ${selected ? 'ring-1 ring-city-venue' : ''} ${tooSmall ? 'opacity-60' : ''}`}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 text-base font-semibold">
										{selected && <span className="text-city-success">✓</span>}
										{venue.name}
									</div>
									<div className="text-sm text-city-muted">{venue.location} · Capacity {venue.capacity} · ₹{venue.price}</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{venue.features.map((f) => (
											<span key={f} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">{f}</span>
										))}
									</div>
								</div>
								<button
									onClick={() => reserve(venue)}
									disabled={selected || tooSmall || busy}
									className="shrink-0 rounded-md bg-city-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-city-glow disabled:cursor-not-allowed disabled:opacity-40"
								>
									{selected ? 'Reserved' : tooSmall ? 'Too small' : 'Reserve'}
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
