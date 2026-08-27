import { useState } from 'react';
import { useCityStore, updateEvent } from '../store/cityStore';
import { apiFetch } from '../lib/api';
import type { CateringPackage, Budget } from '../types';

interface CateringSearchResponse {
	matches: CateringPackage[];
	count: number;
}

interface EventUpdateResponse {
	event: Partial<EventPlan>;
	budget?: Budget;
}

export default function CateringDistrict() {
	const { event } = useCityStore();
	const [matches, setMatches] = useState<CateringPackage[]>([]);
	const [searched, setSearched] = useState(false);
	const [busy, setBusy] = useState(false);

	async function search() {
		setBusy(true);
		try {
			const res = await apiFetch<CateringSearchResponse>('/catering/search', {
				method: 'POST',
				body: JSON.stringify({
					people: event.attendees,
					dietaryPreference: event.dietaryPreference,
					maximumPricePerPerson: Math.floor(event.budgetLimit / event.attendees),
				}),
			});
			setMatches(res.matches);
			setSearched(true);
		} finally {
			setBusy(false);
		}
	}

	async function order(pkg: CateringPackage) {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/catering/order', {
				method: 'POST',
				body: JSON.stringify({ packageId: pkg.id, people: event.attendees }),
			});
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	async function cancel() {
		setBusy(true);
		try {
			const res = await apiFetch<EventUpdateResponse>('/catering/cancel', { method: 'POST' });
			updateEvent(res.event);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-catering">Catering</h2>
				<button
					onClick={search}
					disabled={busy}
					className="rounded-md bg-city-catering/20 px-4 py-2 text-sm font-medium text-city-catering transition hover:bg-city-catering/30 disabled:opacity-50"
>
					{busy && !searched ? 'Searching…' : 'Search catering'}
				</button>
			</div>

			<div className="panel p-4">
				<div className="mb-2 font-mono text-xs text-city-muted">REQUIREMENTS</div>
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div>
						<div className="text-city-muted">People</div>
						<div className="font-semibold">{event.attendees}</div>
					</div>
					<div>
						<div className="text-city-muted">Diet</div>
						<div className="font-semibold capitalize">{event.dietaryPreference}</div>
					</div>
					<div>
						<div className="text-city-muted">Max per person</div>
						<div className="font-semibold">₹{Math.floor(event.budgetLimit / event.attendees)}</div>
					</div>
				</div>
			</div>

			{event.catering && (
				<div className="panel border-l-4 border-l-city-catering p-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-2 text-lg font-semibold">
								<span className="text-city-success">✓</span>
								{event.catering.name} — Ordered
							</div>
							<div className="text-sm text-city-muted">
								{event.catering.diet} · ₹{event.catering.pricePerPerson}/person · {event.attendees} people = ₹{event.catering.pricePerPerson * event.attendees}
							</div>
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
				{searched && matches.length === 0 && <p className="text-city-muted">No catering packages match.</p>}
				{!searched && !event.catering && (
					<div className="panel p-6 text-center text-sm text-city-muted">
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
									<div className="flex items-center gap-2 text-base font-semibold">
										{selected && <span className="text-city-success">✓</span>}
										{pkg.name}
									</div>
									<div className="text-sm text-city-muted">{pkg.diet} · ₹{pkg.pricePerPerson}/person · min {pkg.minimumOrder} · ⭐ {pkg.rating}</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{pkg.items.map((item) => (
											<span key={item} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">{item}</span>
										))}
									</div>
									{wrongDiet && (
										<div className="mt-2 text-xs text-city-warning">⚠ Diet mismatch for your requirements.</div>
									)}
								</div>
								<button
									onClick={() => order(pkg)}
									disabled={selected || busy}
									className="shrink-0 rounded-md bg-city-catering px-4 py-2 text-sm font-medium text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-40"
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
