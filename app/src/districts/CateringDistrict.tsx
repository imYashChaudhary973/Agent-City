import { useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { lastMatches } from '../lib/agentView';
import { runTool } from '../lib/tools';
import type { CateringPackage } from '../types';

export default function CateringDistrict() {
	const state = useCityStore();
	const { event } = state;
	// Results come from the action stream, so an agent-run search renders here too.
	const matches = lastMatches<CateringPackage>(state.actions, 'search_catering') ?? [];
	const searched = lastMatches<CateringPackage>(state.actions, 'search_catering') !== null;
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
			await runTool('search_catering', {
				people: event.attendees,
				dietaryPreference: event.dietaryPreference,
				maximumPricePerPerson: Math.floor(event.budgetLimit / event.attendees),
			});
		} finally {
			setBusy(false);
		}
	}

	async function order(pkg: CateringPackage) {
		setBusy(true);
		try {
			await runTool('place_catering_order', { packageId: pkg.id, people: event.attendees });
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			await runTool('cancel_catering_order', {});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-catering">Catering</h2>
				<button onClick={search} disabled={busy} className="btn-primary bg-city-catering/20 text-city-catering hover:bg-city-catering/30">
					{busy ? 'Searching…' : 'Search catering'}
				</button>
			</div>

			<div className="panel p-5">
				<div className="mb-3 font-mono text-[10px] tracking-wider text-city-muted">REQUIREMENTS</div>
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div>
						<div className="text-xs text-city-muted">People</div>
						<div className="font-semibold text-city-ink">{event.attendees}</div>
					</div>
					<div>
						<div className="text-xs text-city-muted">Diet</div>
						<div className="font-semibold capitalize text-city-ink">{event.dietaryPreference}</div>
					</div>
					<div>
						<div className="text-xs text-city-muted">Max per person</div>
						<div className="font-semibold text-city-ink">₹{Math.floor(event.budgetLimit / event.attendees)}</div>
					</div>
				</div>
			</div>

			{event.catering && (
				<div className="panel overflow-hidden">
					<div className="flex items-center gap-3 border-b border-city-border bg-city-catering/10 px-5 py-3">
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-city-success/15 text-city-success">✓</span>
						<div className="font-medium text-city-ink">{event.catering.name} — Ordered</div>
					</div>
					<div className="flex items-start justify-between gap-4 px-5 py-4">
						<div className="text-sm text-city-muted">
							{event.catering.diet} · ₹{event.catering.pricePerPerson}/person · {event.attendees} people = ₹
							{event.catering.pricePerPerson * event.attendees}
						</div>
						<button onClick={cancel} disabled={busy} className="btn-danger shrink-0">
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="space-y-3">
				{searched && matches.length === 0 && <p className="text-city-muted">No catering packages match.</p>}
				{!searched && !event.catering && (
					<div className="panel p-8 text-center text-sm text-city-muted">
						Click “Search catering” to see packages matching your diet and budget.
					</div>
				)}
				{matches.map((pkg) => {
					const selected = event.catering?.id === pkg.id;
					const wrongDiet = pkg.diet !== event.dietaryPreference;
					return (
						<div key={pkg.id} className={`panel p-4 transition ${selected ? 'ring-1 ring-city-catering' : ''}`}>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<div className="flex items-center gap-2 text-base font-semibold text-city-ink">
										{selected && <span className="text-city-success">✓</span>}
										{pkg.name}
									</div>
									<div className="text-sm text-city-muted">
										{pkg.diet} · ₹{pkg.pricePerPerson}/person · min {pkg.minimumOrder} · ⭐ {pkg.rating}
									</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{pkg.items.map((item) => (
											<span key={item} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">
												{item}
											</span>
										))}
									</div>
									{wrongDiet && (
										<div className="mt-2 text-xs text-city-warning">⚠ Diet mismatch for your requirements.</div>
									)}
								</div>
								<button
									onClick={() => order(pkg)}
									disabled={selected || busy}
									className="btn-primary shrink-0 bg-city-catering/20 text-city-catering hover:bg-city-catering/30 disabled:cursor-not-allowed disabled:opacity-40"
								>
									{selected ? 'Ordered' : 'Order'}
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
