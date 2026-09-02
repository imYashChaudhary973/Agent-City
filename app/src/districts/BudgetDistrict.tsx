import { useEffect, useState } from 'react';
import { useCityStore } from '../store/cityStore';
import { runTool } from '../lib/tools';
import type { Budget } from '../types';

export default function BudgetDistrict() {
	const { event } = useCityStore();
	const [budget, setBudget] = useState<Budget | null>(null);

	async function refresh() {
		const res = (await runTool('get_budget_status', {})) as Budget;
		setBudget(res);
	}

	useEffect(() => {
		refresh();
	}, [event.venue?.id, event.catering?.id, event.attendees, event.budgetLimit]);

	async function updateLimit(limit: number) {
		await runTool('update_event_requirements', { budgetLimit: limit });
	}

	const venueCost = event.venue ? event.venue.price : 0;
	const cateringCost = event.catering ? event.catering.pricePerPerson * event.attendees : 0;
	const total = venueCost + cateringCost;
	const remaining = event.budgetLimit - total;
	const percent = Math.min((total / event.budgetLimit) * 100, 100);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-city-budget">Budget</h2>
				<button onClick={refresh} className="btn-primary bg-city-budget/20 text-city-budget hover:bg-city-budget/30">
					Refresh
				</button>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-muted">LIMIT</div>
					<div className="text-2xl font-bold text-city-ink">₹{event.budgetLimit}</div>
				</div>
				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-muted">RESERVED</div>
					<div className="text-2xl font-bold text-city-warning">₹{total}</div>
				</div>
				<div className="panel p-4">
					<div className="mb-1 font-mono text-[10px] tracking-wider text-city-muted">REMAINING</div>
					<div className={`text-2xl font-bold ${remaining >= 0 ? 'text-city-success' : 'text-city-danger'}`}>
						₹{remaining}
					</div>
				</div>
			</div>

			<div className="panel p-5">
				<div className="mb-4 font-mono text-[10px] tracking-wider text-city-muted">BUDGET BREAKDOWN</div>
				<div className="space-y-3">
					<div className="flex items-center gap-3 text-sm">
						<span className="h-2 w-2 rounded-full bg-city-venue" />
						<span className="flex-1 text-city-muted">Venue</span>
						<span className="font-mono text-city-ink">₹{venueCost}</span>
					</div>
					<div className="flex items-center gap-3 text-sm">
						<span className="h-2 w-2 rounded-full bg-city-catering" />
						<span className="flex-1 text-city-muted">Catering</span>
						<span className="font-mono text-city-ink">₹{cateringCost}</span>
					</div>
					<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-city-border">
						<div className="h-full rounded-full bg-city-budget" style={{ width: `${percent}%` }} />
					</div>
					<div className="text-right text-xs text-city-muted">{percent.toFixed(0)}% of budget used</div>
				</div>
			</div>

			<div className="panel p-5">
				<div className="mb-4 font-mono text-[10px] tracking-wider text-city-muted">ADJUST LIMIT</div>
				<div className="flex flex-wrap gap-2">
					{[8000, 10000, 12000].map((limit) => (
						<button
							key={limit}
							onClick={() => updateLimit(limit)}
							className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
								event.budgetLimit === limit
									? 'border-city-budget bg-city-budget/15 text-city-budget'
									: 'border-city-border text-city-ink hover:bg-white/5'
							}`}
						>
							₹{limit}
						</button>
					))}
				</div>
			</div>

			{budget && (
				<div className="panel p-5">
					<div className="mb-2 font-mono text-[10px] tracking-wider text-city-muted">SERVER BUDGET STATUS</div>
					<pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-city-muted">{JSON.stringify(budget, null, 2)}</pre>
				</div>
			)}
		</div>
	);
}
