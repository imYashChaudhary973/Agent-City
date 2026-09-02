import { useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { lastMatches } from '../lib/agentView';
import { runTool } from '../lib/tools';
import type { Venue } from '../types';

export default function VenuesDistrict() {
	const state = useCityStore();
	const { event } = state;
	// Results come from the action stream, so an agent-run search renders here too.
	const matches = lastMatches<Venue>(state.actions, 'search_venues') ?? [];
	const searched = lastMatches<Venue>(state.actions, 'search_venues') !== null;
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
			await runTool('search_venues', {
				minimumCapacity: event.attendees,
				maximumPrice: event.budgetLimit,
				date: event.date,
			});
		} finally {
			setBusy(false);
		}
	}

	async function reserve(venue: Venue) {
		setBusy(true);
		try {
			await runTool('reserve_venue', { venueId: venue.id, attendees: event.attendees, date: event.date });
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			await runTool('cancel_reservation', {});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-venue">Venues</h2>
				<button onClick={search} disabled={busy} className="btn-primary bg-city-venue/20 text-city-venue hover:bg-city-venue/30">
					{busy ? 'Searching…' : 'Search for venues'}
				</button>
			</div>

			{event.venue && (
				<div className="panel overflow-hidden">
					<div className="flex items-center gap-3 border-b border-city-border bg-city-venue/10 px-5 py-3">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-city-success/15 text-city-success">✓</span>
						<div className="font-medium text-city-ink">{event.venue.name} — Reserved</div>
					</div>
					<div className="flex items-start justify-between gap-4 px-5 py-4">
						<div>
							<div className="text-sm text-city-muted">
								{event.venue.location} · Capacity {event.venue.capacity} · ₹{event.venue.price}
							</div>
							{event.venue.capacity < event.attendees && (
								<div className="mt-3 rounded-lg bg-city-danger/10 px-3 py-2 text-sm text-city-danger">
									Capacity {event.venue.capacity} is less than required {event.attendees}. Search again for a larger venue.
								</div>
							)}
						</div>
						<button onClick={cancel} disabled={busy} className="btn-danger shrink-0">
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="space-y-3">
				{searched && matches.length === 0 && <p className="text-city-muted">No venues match your constraints.</p>}
				{!searched && !event.venue && (
					<div className="panel p-8 text-center text-sm text-city-muted">
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
									<div className="flex items-center gap-2 text-base font-semibold text-city-ink">
										{selected && <span className="text-city-success">✓</span>}
										{venue.name}
									</div>
									<div className="text-sm text-city-muted">
										{venue.location} · Capacity {venue.capacity} · ₹{venue.price}
									</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{venue.features.map((f) => (
											<span key={f} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">
												{f}
											</span>
										))}
									</div>
								</div>
								<button
									onClick={() => reserve(venue)}
									disabled={selected || tooSmall || busy}
									className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
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
