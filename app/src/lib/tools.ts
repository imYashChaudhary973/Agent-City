import type { EventPlan } from '../types';
import type { CityState } from '../store/cityStore';
import type { Tool, JSONSchema, ToolAnnotations } from '../types/webmcp';
import type {
	VenuesSearchParams,
	CateringSearchParams,
	SlotsSearchParams,
	ReserveVenueBody,
	PlaceCateringBody,
	ScheduleEventBody,
	UpdateRequirementsBody,
} from './api';
import { apiFetch } from './api';
import { addPendingApproval, getApprovalOutcome, setApprovalOutcome, updateEvent } from '../store/cityStore';

function readString(obj: unknown, key: string): string | undefined {
	if (obj && typeof obj === 'object' && key in obj) {
		const v = (obj as Record<string, unknown>)[key];
		return typeof v === 'string' ? v : undefined;
	}
	return undefined;
}

function readNumber(obj: unknown, key: string): number | undefined {
	if (obj && typeof obj === 'object' && key in obj) {
		const v = (obj as Record<string, unknown>)[key];
		return typeof v === 'number' ? v : undefined;
	}
	return undefined;
}

function needsApproval(toolName: string): boolean {
	const writeTools = ['reserve_venue', 'place_catering_order', 'schedule_event'];
	const destructiveTools = ['cancel_reservation', 'cancel_catering_order', 'cancel_event'];
	return writeTools.includes(toolName) || destructiveTools.includes(toolName);
}

function describeAction(toolName: string, input: unknown): string {
	switch (toolName) {
		case 'reserve_venue':
			return `Reserve venue ${readString(input, 'venueId') ?? ''} for ${readNumber(input, 'attendees') ?? ''} people`;
		case 'place_catering_order':
			return `Order catering package ${readString(input, 'packageId') ?? ''} for ${readNumber(input, 'people') ?? ''} people`;
		case 'schedule_event':
			return `Schedule event in slot ${readString(input, 'slotId') ?? ''}`;
		case 'cancel_reservation':
			return 'Cancel current venue reservation';
		case 'cancel_catering_order':
			return 'Cancel current catering order';
		case 'cancel_event':
			return 'Cancel the scheduled event';
		default:
			return toolName;
	}
}

async function requestApproval(toolName: string, input: unknown, signal: AbortSignal): Promise<void> {
	const approvalId = crypto.randomUUID();
	addPendingApproval({ id: approvalId, tool: toolName, input, description: describeAction(toolName, input) });
	const { promise, resolve, reject } = Promise.withResolvers<void>();
	const check = setInterval(() => {
		if (signal.aborted) {
			clearInterval(check);
			reject(signal.reason ?? new Error('Tool execution aborted'));
			return;
		}
		const outcome = getApprovalOutcome(approvalId);
		if (!outcome) return;
		clearInterval(check);
		if (outcome === 'approved') resolve();
		else reject(new Error('User rejected the action'));
	}, 300);
	return promise;
}

function mutateFromResult(result: unknown) {
	if (result && typeof result === 'object' && 'event' in result) {
		updateEvent(result.event as Partial<EventPlan>);
	}
}

function tool(
	name: string,
	title: string,
	description: string,
	schema: JSONSchema,
	annotations: ToolAnnotations | undefined,
	execute: (input: unknown, signal: AbortSignal) => Promise<unknown>
): Tool {
	return { name, title, description, inputSchema: schema, annotations, execute: (input, options) => execute(input, options.signal) };
}

function venueSearchSchema(): JSONSchema {
	return {
		type: 'object',
		properties: {
			minimumCapacity: { type: 'integer', description: 'Minimum guest capacity required' },
			maximumPrice: { type: 'number', description: 'Maximum venue price in INR' },
			date: { type: 'string', description: 'Desired date (YYYY-MM-DD)' },
		},
		required: ['minimumCapacity'],
	};
}

function cateringSearchSchema(): JSONSchema {
	return {
		type: 'object',
		properties: {
			people: { type: 'integer', description: 'Number of people to feed' },
			dietaryPreference: { type: 'string', enum: ['vegetarian', 'vegan', 'mixed', 'jain'], description: 'Required dietary category' },
			maximumPricePerPerson: { type: 'number', description: 'Max price per person in INR' },
		},
		required: ['people', 'dietaryPreference'],
	};
}

function calculateCateringSchema(): JSONSchema {
	return { type: 'object', properties: { packageId: { type: 'string' }, people: { type: 'integer' } }, required: ['packageId', 'people'] };
}

function slotsSchema(): JSONSchema {
	return {
		type: 'object',
		properties: {
			date: { type: 'string', description: 'Date (YYYY-MM-DD). Defaults to event date.' },
			after: { type: 'string', description: 'Earliest start time (HH:MM)' },
			before: { type: 'string', description: 'Latest end time (HH:MM)' },
			durationMinutes: { type: 'integer', description: 'Minimum slot duration' },
		},
	};
}

function budgetCalculateSchema(): JSONSchema {
	return { type: 'object', properties: { venueId: { type: 'string' }, packageId: { type: 'string' }, people: { type: 'integer' } } };
}

function updateRequirementsSchema(): JSONSchema {
	return {
		type: 'object',
		properties: {
			attendees: { type: 'integer' },
			date: { type: 'string', description: 'YYYY-MM-DD' },
			startTime: { type: 'string', description: 'HH:MM' },
			dietaryPreference: { type: 'string', enum: ['vegetarian', 'vegan', 'mixed', 'jain'] },
			budgetLimit: { type: 'number' },
		},
	};
}

function reserveVenueSchema(): JSONSchema {
	return { type: 'object', properties: { venueId: { type: 'string' }, attendees: { type: 'integer' }, date: { type: 'string', description: 'YYYY-MM-DD' } }, required: ['venueId', 'attendees'] };
}

function orderCateringSchema(): JSONSchema {
	return { type: 'object', properties: { packageId: { type: 'string' }, people: { type: 'integer' } }, required: ['packageId', 'people'] };
}

function scheduleSchema(): JSONSchema {
	return { type: 'object', properties: { slotId: { type: 'string' } }, required: ['slotId'] };
}

function idSchema(): JSONSchema {
	return { type: 'object', properties: { venueId: { type: 'string' } }, required: ['venueId'] };
}

function modifyReservationSchema(): JSONSchema {
	return { type: 'object', properties: { venueId: { type: 'string' }, attendees: { type: 'integer' }, date: { type: 'string' } }, required: ['venueId'] };
}

function modifyCateringSchema(): JSONSchema {
	return { type: 'object', properties: { packageId: { type: 'string' }, people: { type: 'integer' } }, required: ['packageId'] };
}

function readOnly(): ToolAnnotations {
	return { readOnlyHint: true };
}

export function availableTools(state: CityState): Tool[] {
	const tools: Tool[] = [];

	tools.push(
		tool('search_venues', 'Search Venues', 'Search Agent City venues by capacity, price, and date. Returns matching venues with capacity, price, location, and features.', venueSearchSchema(), readOnly(), async (input) => {
			const params: VenuesSearchParams = { minimumCapacity: readNumber(input, 'minimumCapacity'), maximumPrice: readNumber(input, 'maximumPrice'), date: readString(input, 'date') };
			return apiFetch('/venues/search', { method: 'POST', body: JSON.stringify(params) });
		}),

		tool('get_venue_details', 'Venue Details', 'Get full details for a specific venue by ID.', idSchema(), readOnly(), async (input) =>
			apiFetch(`/venues/${readString(input, 'venueId') ?? ''}`)
		),

		tool('search_catering', 'Search Catering', 'Search catering packages by people count and dietary preference. Returns packages that match the diet and minimum order size.', cateringSearchSchema(), readOnly(), async (input) => {
			const params: CateringSearchParams = { people: readNumber(input, 'people') ?? 1, dietaryPreference: readString(input, 'dietaryPreference') ?? 'vegetarian', maximumPricePerPerson: readNumber(input, 'maximumPricePerPerson') };
			return apiFetch('/catering/search', { method: 'POST', body: JSON.stringify(params) });
		}),

		tool('calculate_catering', 'Calculate Catering', 'Calculate the total price for a catering package at a given people count.', calculateCateringSchema(), readOnly(), async (input) =>
			apiFetch(`/catering/${readString(input, 'packageId') ?? ''}/calculate?people=${readNumber(input, 'people') ?? 1}`)
		),

		tool('find_available_slots', 'Find Slots', 'Find available calendar slots for a given date and time range.', slotsSchema(), readOnly(), async (input) => {
			const params: SlotsSearchParams = { date: readString(input, 'date'), after: readString(input, 'after'), before: readString(input, 'before'), durationMinutes: readNumber(input, 'durationMinutes') };
			return apiFetch('/calendar/slots', { method: 'POST', body: JSON.stringify(params) });
		}),

		tool('get_event_plan', 'Event Plan', 'Return the current event plan including attendees, budget, chosen venue, catering, and calendar slot.', { type: 'object', properties: {} }, readOnly(), async () => ({ event: state.event })),

		tool('get_budget_status', 'Budget Status', 'Get the current budget status: limit, reserved, spent, remaining.', { type: 'object', properties: {} }, readOnly(), async () =>
			apiFetch('/budget/status')
		),

		tool('calculate_event_cost', 'Calculate Cost', 'Calculate the total estimated cost for the current event plan with optional venue and catering overrides.', budgetCalculateSchema(), readOnly(), async (input) => {
			const body = { venueId: readString(input, 'venueId'), packageId: readString(input, 'packageId'), people: readNumber(input, 'people') };
			return apiFetch('/budget/calculate', { method: 'POST', body: JSON.stringify(body) });
		}),

		tool('update_event_requirements', 'Update Requirements', 'Update the high-level event requirements such as attendees, date, dietary preference, or budget limit.', updateRequirementsSchema(), undefined, async (input) => {
			const body: UpdateRequirementsBody = {
				attendees: readNumber(input, 'attendees'),
				date: readString(input, 'date'),
				startTime: readString(input, 'startTime'),
				dietaryPreference: readString(input, 'dietaryPreference') as EventPlan['dietaryPreference'] | undefined,
				budgetLimit: readNumber(input, 'budgetLimit'),
			};
			const res = await apiFetch('/plan/requirements', { method: 'POST', body: JSON.stringify(body) });
			mutateFromResult(res);
			return res;
		})
	);

	tools.push(
		tool('reserve_venue', 'Reserve Venue', 'Reserve a venue for the event. Requires human approval.', reserveVenueSchema(), undefined, async (input, signal) => {
			if (needsApproval('reserve_venue')) await requestApproval('reserve_venue', input, signal);
			const body: ReserveVenueBody = { venueId: readString(input, 'venueId') ?? '', attendees: readNumber(input, 'attendees') ?? state.event.attendees, date: readString(input, 'date') ?? state.event.date };
			const res = await apiFetch('/venues/reserve', { method: 'POST', body: JSON.stringify(body) });
			mutateFromResult(res);
			return res;
		}),

		tool('place_catering_order', 'Order Catering', 'Place a catering order for the event. Requires human approval.', orderCateringSchema(), undefined, async (input, signal) => {
			if (needsApproval('place_catering_order')) await requestApproval('place_catering_order', input, signal);
			const body: PlaceCateringBody = { packageId: readString(input, 'packageId') ?? '', people: readNumber(input, 'people') ?? state.event.attendees };
			const res = await apiFetch('/catering/order', { method: 'POST', body: JSON.stringify(body) });
			mutateFromResult(res);
			return res;
		}),

		tool('schedule_event', 'Schedule Event', 'Schedule the event in a calendar slot. Requires human approval.', scheduleSchema(), undefined, async (input, signal) => {
			if (needsApproval('schedule_event')) await requestApproval('schedule_event', input, signal);
			const body: ScheduleEventBody = { slotId: readString(input, 'slotId') ?? '' };
			const res = await apiFetch('/calendar/schedule', { method: 'POST', body: JSON.stringify(body) });
			mutateFromResult(res);
			return res;
		})
	);

	if (state.event.venue) {
		tools.push(
			tool('modify_reservation', 'Modify Reservation', 'Change the reserved venue to another venue. Useful when constraints change.', modifyReservationSchema(), undefined, async (input) => {
				const body: ReserveVenueBody = { venueId: readString(input, 'venueId') ?? '', attendees: readNumber(input, 'attendees') ?? state.event.attendees, date: readString(input, 'date') ?? state.event.date };
				const res = await apiFetch('/venues/reserve', { method: 'POST', body: JSON.stringify(body) });
				mutateFromResult(res);
				return res;
			}),

			tool('cancel_reservation', 'Cancel Reservation', 'Cancel the current venue reservation. Requires human approval.', { type: 'object', properties: {} }, undefined, async (_input, signal) => {
				if (needsApproval('cancel_reservation')) await requestApproval('cancel_reservation', {}, signal);
				const res = await apiFetch('/venues/cancel', { method: 'POST' });
				mutateFromResult(res);
				return res;
			})
		);
	}

	if (state.event.catering) {
		tools.push(
			tool('modify_catering_order', 'Modify Catering', 'Change the catering order to another package or people count.', modifyCateringSchema(), undefined, async (input) => {
				const body: PlaceCateringBody = { packageId: readString(input, 'packageId') ?? '', people: readNumber(input, 'people') ?? state.event.attendees };
				const res = await apiFetch('/catering/order', { method: 'POST', body: JSON.stringify(body) });
				mutateFromResult(res);
				return res;
			}),

			tool('cancel_catering_order', 'Cancel Catering', 'Cancel the current catering order. Requires human approval.', { type: 'object', properties: {} }, undefined, async (_input, signal) => {
				if (needsApproval('cancel_catering_order')) await requestApproval('cancel_catering_order', {}, signal);
				const res = await apiFetch('/catering/cancel', { method: 'POST' });
				mutateFromResult(res);
				return res;
			})
		);
	}

	if (state.event.calendarSlot) {
		tools.push(
			tool('reschedule_event', 'Reschedule Event', 'Move the event to a different calendar slot.', scheduleSchema(), undefined, async (input) => {
				const body: ScheduleEventBody = { slotId: readString(input, 'slotId') ?? '' };
				const res = await apiFetch('/calendar/reschedule', { method: 'POST', body: JSON.stringify(body) });
				mutateFromResult(res);
				return res;
			}),

			tool('cancel_event', 'Cancel Event', 'Cancel the scheduled event. Requires human approval.', { type: 'object', properties: {} }, undefined, async (_input, signal) => {
				if (needsApproval('cancel_event')) await requestApproval('cancel_event', {}, signal);
				const res = await apiFetch('/calendar/cancel', { method: 'POST' });
				mutateFromResult(res);
				return res;
			})
		);
	}

	return tools;
}
