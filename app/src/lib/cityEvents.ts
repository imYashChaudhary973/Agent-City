/**
 * Pure mapping from the WebMCP action stream to the city's physical layout.
 * No React, no DOM, no store — so it stays testable and cheap to reason about.
 */

export type Place =
	| 'venues'
	| 'catering'
	| 'calendar'
	| 'budget'
	| 'plan'
	| 'hall'
	| 'agent'
	| 'human';

export type TripKind = 'read' | 'write' | 'destructive';

/** Normalised stage coordinates (percent). Roads and couriers share these. */
export const PLACES: Record<Place, { x: number; y: number }> = {
	venues: { x: 18, y: 17 },
	catering: { x: 82, y: 17 },
	plan: { x: 50, y: 43 },
	calendar: { x: 18, y: 67 },
	budget: { x: 82, y: 67 },
	hall: { x: 50, y: 80 },
	agent: { x: 15, y: 94 },
	human: { x: 85, y: 94 },
};

/** CSS custom property each place is drawn in. One source for the seam, the nav, and the pane. */
export const PLACE_COLOR: Record<Place, string> = {
	venues: 'var(--color-city-venue)',
	catering: 'var(--color-city-catering)',
	calendar: 'var(--color-city-calendar)',
	budget: 'var(--color-city-budget)',
	plan: 'var(--color-city-accent)',
	hall: 'var(--color-city-accent)',
	agent: 'var(--color-city-accent)',
	human: 'var(--color-city-accent)',
};

/** Roads drawn on the stage. Every trip travels only along these. */
export const ROADS: [Place, Place][] = [
	['agent', 'hall'],
	['human', 'hall'],
	['hall', 'plan'],
	['plan', 'venues'],
	['plan', 'catering'],
	['plan', 'calendar'],
	['plan', 'budget'],
];

const DISTRICT_OF: Record<string, Place> = {
	search_venues: 'venues',
	get_venue_details: 'venues',
	reserve_venue: 'venues',
	modify_reservation: 'venues',
	cancel_reservation: 'venues',

	search_catering: 'catering',
	calculate_catering: 'catering',
	place_catering_order: 'catering',
	modify_catering_order: 'catering',
	cancel_catering_order: 'catering',

	find_available_slots: 'calendar',
	schedule_event: 'calendar',
	reschedule_event: 'calendar',
	cancel_event: 'calendar',

	get_budget_status: 'budget',
	calculate_event_cost: 'budget',

	get_event_plan: 'plan',
	update_event_requirements: 'plan',
};

// Anything that books, rebooks, or moves a real commitment. `update_event_requirements`
// is deliberately absent: it only edits planning parameters, it never spends.
const WRITE_TOOLS = [
	'reserve_venue',
	'place_catering_order',
	'schedule_event',
	'modify_reservation',
	'modify_catering_order',
	'reschedule_event',
];
const DESTRUCTIVE_TOOLS = ['cancel_reservation', 'cancel_catering_order', 'cancel_event'];

/**
 * Single source of truth for the approval gate — `lib/tools.ts` imports this so
 * the modal and the city can never disagree about which calls are gated.
 */
export function needsApproval(tool: string): boolean {
	return WRITE_TOOLS.includes(tool) || DESTRUCTIVE_TOOLS.includes(tool);
}

/** Which building a tool call is bound for. `null` = not a trip (e.g. toolchange). */
export function districtOf(tool: string): Place | null {
	return DISTRICT_OF[tool] ?? null;
}

export function kindOf(tool: string): TripKind {
	if (DESTRUCTIVE_TOOLS.includes(tool)) return 'destructive';
	if (needsApproval(tool) || !isReadTool(tool)) return 'write';
	return 'read';
}

function isReadTool(tool: string): boolean {
	return tool.startsWith('search_') || tool.startsWith('get_') || tool.startsWith('find_') || tool.startsWith('calculate_');
}

/**
 * Waypoints for one round trip. Everything funnels through City Hall and the
 * Event Site, because in this system every call is ultimately about the plan.
 */
export function routeFor(origin: 'agent' | 'human', district: Place): Place[] {
	const outbound: Place[] = [origin, 'hall', 'plan'];
	if (district !== 'plan') outbound.push(district);
	const inbound = [...outbound].reverse().slice(1);
	return [...outbound, ...inbound];
}

/** Index on the route where a gated courier parks. */
export function gateIndex(route: Place[]): number {
	return route.indexOf('hall');
}
