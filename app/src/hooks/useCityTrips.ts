import { useEffect, useState } from 'react';
import { subscribeCity, getCityState } from '../store/cityStore';
import { districtOf, kindOf, routeFor, gateIndex, needsApproval, type Place, type TripKind } from '../lib/cityEvents';

export const LEG_MS = 260;

export interface Trip {
	id: string;
	tool: string;
	kind: TripKind;
	origin: 'agent' | 'human';
	district: Place;
	route: Place[];
	/** Waypoint the courier is currently heading to. */
	idx: number;
	/** Parked at City Hall waiting on a human decision. */
	gated: boolean;
	status: 'pending' | 'success' | 'error';
	duration: number;
}

/**
 * Drives couriers off the existing action stream. A call that resolves in 20ms
 * still gets a visible trip; a slow one just sits at the building longer.
 */
export function useCityTrips(): Trip[] {
	const [trips, setTrips] = useState<Trip[]>([]);

	// Ingest: new actions become trips, resolved actions update theirs.
	useEffect(() => {
		function sync() {
			const { actions, pendingApprovals } = getCityState();
			setTrips((current) => {
				const byId = new Map(current.map((t) => [t.id, t]));
				let changed = false;

				for (const action of actions) {
					const district = districtOf(action.tool);
					if (!district) continue;

					const existing = byId.get(action.id);
					if (!existing) {
						// Only pick up calls that are still in flight, so a page-load
						// replay of old history doesn't stampede the roads.
						if (action.status !== 'pending') continue;
						const route = routeFor(action.origin, district);
						byId.set(action.id, {
							id: action.id,
							tool: action.tool,
							kind: kindOf(action.tool),
							origin: action.origin,
							district,
							route,
							idx: 0,
							gated: false,
							status: 'pending',
							duration: 0,
						});
						changed = true;
						continue;
					}

					const gated =
						action.status === 'pending' &&
						needsApproval(action.tool) &&
						pendingApprovals.some((a) => a.tool === action.tool);

					if (existing.status !== action.status || existing.gated !== gated) {
						byId.set(action.id, { ...existing, status: action.status, gated, duration: action.duration });
						changed = true;
					}
				}

				return changed ? [...byId.values()] : current;
			});
		}

		sync();
		return subscribeCity(sync);
	}, []);

	// Advance: one timer moves every courier along its route.
	useEffect(() => {
		if (trips.length === 0) return;
		const id = setInterval(() => {
			setTrips((current) =>
				current
					.map((t) => {
						const gate = gateIndex(t.route);
						// Park at City Hall on the outbound leg until approval clears.
						if (t.gated && t.idx >= gate) return t;
						// Don't head home until the call has actually resolved.
						const turnaround = t.route.indexOf(t.district, 1);
						if (t.status === 'pending' && t.idx >= turnaround) return t;
						return t.idx >= t.route.length - 1 ? t : { ...t, idx: t.idx + 1 };
					})
					.filter((t) => t.status === 'pending' || t.idx < t.route.length - 1)
			);
		}, LEG_MS);
		return () => clearInterval(id);
	}, [trips.length]);

	return trips;
}
