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

	async function search() {
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
	}

	async function order(pkg: CateringPackage) {
		const res = await apiFetch<EventUpdateResponse>('/catering/order', {
			method: 'POST',
			body: JSON.stringify({ packageId: pkg.id, people: event.attendees }),
		});
		updateEvent(res.event);
	}

	async function cancel() {
		const res = await apiFetch<EventUpdateResponse>('/catering/cancel', { method: 'POST' });
		updateEvent(res.event);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-catering">Catering</h2>
				<button
					onClick={search}
					className="rounded-md bg-city-catering/20 px-4 py-2 text-sm font-medium text-city-catering transition hover:bg-city-catering/30"
>
					Search catering
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
							<div className="text-lg font-semibold">{event.catering.name} ✓ Ordered</div>
							<div className="text-sm text-city-muted">₹{event.catering.pricePerPerson}/person · {event.attendees} people = ₹{event.catering.pricePerPerson * event.attendees}</div>
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

			<div className="grid gap-4">
				{searched && matches.length === 0 && <p className="text-city-muted">No catering packages match.</p>}
				{matches.map((pkg) => (
					<div key={pkg.id} className="panel p-4">
						<div className="flex items-start justify-between">
							<div>
								<div className="text-base font-semibold">{pkg.name}</div>
								<div className="text-sm text-city-muted">{pkg.diet} · ₹{pkg.pricePerPerson}/person · min {pkg.minimumOrder} · ⭐ {pkg.rating}</div>
								<div className="mt-1 flex flex-wrap gap-2">
									{pkg.items.map((item) => (
										<span key={item} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-city-muted">{item}</span>
									))}
								</div>
							</div>
							<button
								onClick={() => order(pkg)}
								disabled={event.catering?.id === pkg.id}
								className="rounded-md bg-city-catering px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
							>
								{event.catering?.id === pkg.id ? 'Ordered' : 'Order'}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
