import { useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { runTool } from '../lib/tools';
import type { Venue, CateringPackage } from '../types';

export default function OverviewDistrict() {
	const { event } = useCityStore();
	const [busy, setBusy] = useState(false);
	const [selectedAttendees, setSelectedAttendees] = useState(event.attendees);
	const venueCost = event.venue ? event.venue.price : 0;
	const cateringCost = event.catering ? event.catering.pricePerPerson * event.attendees : 0;
	const total = venueCost + cateringCost;
	const remaining = event.budgetLimit - total;

	const capacityValid = event.venue ? event.venue.capacity >= event.attendees : true;
	const budgetValid = total <= event.budgetLimit;
	const dietValid = !event.catering || event.catering.diet === event.dietaryPreference;
	const startValid = event.startTime >= '14:00';

	const constraints = [
		{ label: 'People', value: event.attendees, valid: capacityValid },
		{ label: 'Budget', value: `₹${event.budgetLimit}`, valid: budgetValid },
		{ label: 'Diet', value: event.dietaryPreference, valid: dietValid },
		{ label: 'Start', value: event.startTime, valid: startValid },
	];

	async function autoReplan() {
		if (!event.venue) return;
		setBusy(true);
		try {
			const search = (await runTool('search_venues', {
				minimumCapacity: event.attendees,
				maximumPrice: event.budgetLimit,
				date: event.date,
			})) as { matches: Venue[] };

			const candidates = search.matches
				.filter((v) => v.capacity >= event.attendees)
				.sort((a, b) => a.capacity - b.capacity || a.price - b.price);

			const best = candidates[0];
			if (!best || best.id === event.venue.id) return;

			const costAfter = best.price + (event.catering?.pricePerPerson ?? 0) * event.attendees;
			if (costAfter > event.budgetLimit) return;

			await runTool('update_event_requirements', { attendees: event.attendees });
			await runTool('cancel_reservation', {});
			await runTool('reserve_venue', { venueId: best.id, attendees: event.attendees, date: event.date });

			if (event.catering) {
				const current = event.catering;
				const stillAffordable = best.price + current.pricePerPerson * event.attendees <= event.budgetLimit;
				if (!stillAffordable) {
					await runTool('cancel_catering_order', {});
					const catering = (await runTool('search_catering', {
						people: event.attendees,
						dietaryPreference: event.dietaryPreference,
						maximumPricePerPerson: Math.floor((event.budgetLimit - best.price) / event.attendees),
					})) as { matches: CateringPackage[] };
					const fallback = catering.matches[0];
					if (fallback) {
						await runTool('place_catering_order', { packageId: fallback.id, people: event.attendees });
					}
				} else {
					await runTool('modify_catering_order', { packageId: current.id, people: event.attendees });
				}
			}
		} finally {
			setBusy(false);
		}
	}

	async function adjustAttendees(n: number) {
		setSelectedAttendees(n);
		await runTool('update_event_requirements', { attendees: n });
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">City Overview</h2>
				<span className={`rounded-full px-3 py-1 font-mono text-xs ${event.status === 'scheduled' ? 'bg-city-success/20 text-city-success' : 'bg-city-warning/20 text-city-warning'}`}>
					{event.status.toUpperCase()}
				</span>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-venue">VENUE</div>
					<div className="text-lg font-semibold text-city-ink">{event.venue ? event.venue.name : 'Not selected'}</div>
					{event.venue && (
						<div className="mt-1 text-xs text-city-muted">{event.venue.capacity} capacity · ₹{event.venue.price}</div>
					)}
				</div>

				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-catering">CATERING</div>
					<div className="text-lg font-semibold text-city-ink">{event.catering ? event.catering.name : 'Not selected'}</div>
					{event.catering && (
						<div className="mt-1 text-xs text-city-muted">{event.catering.diet} · ₹{event.catering.pricePerPerson}/person · {event.attendees} people</div>
					)}
				</div>

				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-calendar">CALENDAR</div>
					<div className="text-lg font-semibold text-city-ink">{event.calendarSlot ? `${event.calendarSlot.date} ${event.calendarSlot.startTime}` : 'Not scheduled'}</div>
					{event.calendarSlot && (
						<div className="mt-1 text-xs text-city-muted">{event.calendarSlot.endTime} end · slot {event.calendarSlot.id}</div>
					)}
				</div>

				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-budget">BUDGET</div>
					<div className="text-2xl font-bold text-city-ink">₹{total} / ₹{event.budgetLimit}</div>
					<div className={`mt-1 text-xs ${remaining >= 0 ? 'text-city-success' : 'text-city-danger'}`}>
						{remaining >= 0 ? `₹${remaining} remaining` : `₹${Math.abs(remaining)} over budget`}
					</div>
				</div>
			</div>

			<div className="panel p-5">
				<div className="mb-4 font-mono text-[10px] tracking-wider text-city-muted">EVENT CONSTRAINTS</div>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{constraints.map((c) => (
						<div key={c.label} className="rounded-xl bg-white/[0.03] p-3 text-center">
							<div className="text-xs text-city-muted">{c.label}</div>
							<div className="text-lg font-semibold text-city-ink">{c.value}</div>
							<div className={`text-[10px] font-medium ${c.valid ? 'text-city-success' : 'text-city-danger'}`}>
								{c.valid ? '✓ VALID' : '✕ INVALID'}
							</div>
						</div>
					))}
				</div>
			</div>

			{!capacityValid && event.venue && (
				<div className="panel overflow-hidden p-5">
					<div className="mb-3 flex items-start justify-between gap-4">
						<div className="flex items-center gap-2">
							<span className="flex h-5 w-5 items-center justify-center rounded-full bg-city-danger/15 text-city-danger">!</span>
							<div className="font-mono text-[10px] tracking-wider text-city-danger">CONSTRAINT VIOLATION</div>
						</div>
						<button onClick={autoReplan} disabled={busy} className="btn-danger">
							{busy ? 'Replanning…' : 'Auto-replan'}
						</button>
					</div>
					<p className="text-sm text-city-muted">
						Venue {event.venue.name} capacity ({event.venue.capacity}) is less than required attendees ({event.attendees}).
						Auto-replan will find a larger venue that still fits the budget.
					</p>
				</div>
			)}

			<div className="panel p-5">
				<div className="mb-4 font-mono text-[10px] tracking-wider text-city-muted">QUICK ADJUSTMENTS</div>
				<div className="flex flex-wrap items-center gap-3">
					<span className="text-sm text-city-muted">Attendees:</span>
					<div className="flex gap-2">
						{[12, 16, 20, 24].map((n) => (
							<button
								key={n}
								onClick={() => adjustAttendees(n)}
								className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
									selectedAttendees === n
										? 'border-city-accent bg-city-accent/15 text-white'
										: 'border-city-border text-city-muted hover:bg-white/5'
								}`}
							>
								{n}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
