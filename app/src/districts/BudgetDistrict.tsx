import { useEffect, useState } from 'react';
import { useCityStore, updateEvent } from '../store/cityStore';
import { apiFetch } from '../lib/api';
import type { Budget, EventPlan } from '../types';

interface EventUpdateResponse {
	event: Partial<EventPlan>;
	budget?: Budget;
}

export default function BudgetDistrict() {
	const { event } = useCityStore();
	const [budget, setBudget] = useState<Budget | null>(null);

	async function refresh() {
		const res = await apiFetch<Budget>('/budget/status');
		setBudget(res);
	}

	useEffect(() => {
		refresh();
	}, [event]);

	async function updateLimit(limit: number) {
		const res = await apiFetch<EventUpdateResponse>('/plan/requirements', {
			method: 'POST',
			body: JSON.stringify({ budgetLimit: limit }),
		});
		updateEvent(res.event);
	}

	const venueCost = event.venue ? event.venue.price : 0;
	const cateringCost = event.catering ? event.catering.pricePerPerson * event.attendees : 0;
	const total = venueCost + cateringCost;
	const remaining = event.budgetLimit - total;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-budget">Budget</h2>
				<button
					onClick={refresh}
					className="rounded-md bg-city-budget/20 px-4 py-2 text-sm font-medium text-city-budget transition hover:bg-city-budget/30"
>
					Refresh
				</button>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="panel p-4">
					<div className="font-mono text-xs text-city-muted">LIMIT</div>
					<div className="text-2xl font-bold text-white">₹{event.budgetLimit}</div>
				</div>
				<div className="panel p-4">
					<div className="font-mono text-xs text-city-muted">RESERVED</div>
					<div className="text-2xl font-bold text-city-warning">₹{total}</div>
				</div>
				<div className="panel p-4">
					<div className="font-mono text-xs text-city-muted">REMAINING</div>
					<div className={`text-2xl font-bold ${remaining >= 0 ? 'text-city-success' : 'text-city-danger'}`}>₹{remaining}</div>
				</div>
			</div>

			<div className="panel p-4">
				<div className="mb-3 font-mono text-xs text-city-muted">BUDGET BREAKDOWN</div>
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<div className="h-2 w-2 rounded-full bg-city-venue" />
						<div className="flex-1 text-sm">Venue</div>
						<div className="font-mono">₹{venueCost}</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="h-2 w-2 rounded-full bg-city-catering" />
						<div className="flex-1 text-sm">Catering</div>
						<div className="font-mono">₹{cateringCost}</div>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-city-border">
						<div
							className="h-full rounded-full bg-city-budget"
							style={{ width: `${Math.min((total / event.budgetLimit) * 100, 100)}%` }}
						/>
					</div>
				</div>
			</div>

			<div className="panel p-4">
				<div className="mb-2 font-mono text-xs text-city-muted">ADJUST LIMIT</div>
				<div className="flex gap-3">
					{[8000, 10000, 12000].map((limit) => (
						<button
							key={limit}
							onClick={() => updateLimit(limit)}
							className={`rounded-md border px-4 py-2 text-sm ${
								event.budgetLimit === limit
									? 'border-city-budget bg-city-budget/20 text-city-budget'
									: 'border-city-border text-white hover:bg-white/5'
							}`}
						>
							₹{limit}
						</button>
					))}
				</div>
			</div>

			{budget && (
				<div className="panel p-4">
					<div className="mb-2 font-mono text-xs text-city-muted">SERVER BUDGET STATUS</div>
					<pre className="rounded bg-black/40 p-2 font-mono text-xs text-city-muted">{JSON.stringify(budget, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}
