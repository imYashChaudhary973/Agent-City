import { catalog, cateringPackages, demoDates } from './data';
import type { EventPlan } from './data';

interface BudgetStatus {
	limit: number;
	reserved: number;
	spent: number;
	remaining: number;
}

function getEventPlanFromRequest(request: Request): EventPlan {
	const header = request.headers.get('x-agent-city-plan');
	if (header) {
		try {
			return JSON.parse(header) as EventPlan;
		} catch {
			// fall through
		}
	}
	return {
		attendees: 12,
		date: demoDates()[1],
		startTime: '14:00',
		dietaryPreference: 'vegetarian',
		budgetLimit: 10000,
		status: 'planning',
	};
}

function budgetFor(event: EventPlan): BudgetStatus {
	const venueCost = event.venue ? event.venue.price : 0;
	const cateringCost = event.catering ? event.catering.pricePerPerson * event.attendees : 0;
	const reserved = venueCost + cateringCost;
	return {
		limit: event.budgetLimit,
		reserved,
		spent: 0,
		remaining: event.budgetLimit - reserved,
	};
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, x-agent-city-plan' },
	});
}

function notFound(): Response {
	return new Response('Not Found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
}

function badRequest(message: string): Response {
	return jsonResponse({ error: message }, 400);
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		const { venues, slots } = catalog();

		if (method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, x-agent-city-plan',
				},
			});
		}

		// Static assets handled by assets binding; this worker only sees /api and unmatched
		if (path === '/api/venues/search' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const minCapacity = typeof body.minimumCapacity === 'number' ? body.minimumCapacity : 0;
			const maxPrice = typeof body.maximumPrice === 'number' ? body.maximumPrice : Infinity;
			const date = typeof body.date === 'string' ? body.date : undefined;
			const matches = venues
				.filter(
					(v) =>
						v.capacity >= minCapacity &&
						v.price <= maxPrice &&
						(date ? v.availability.includes(date) : true)
				)
				.sort((a, b) => {
					const fitA = a.capacity - minCapacity;
					const fitB = b.capacity - minCapacity;
					if (fitA !== fitB) return fitA - fitB;
					return a.price - b.price;
				});
			return jsonResponse({ matches, count: matches.length });
		}

		if (path.startsWith('/api/venues/') && method === 'GET') {
			const id = path.slice('/api/venues/'.length);
			const venue = venues.find((v) => v.id === id);
			if (!venue) return notFound();
			return jsonResponse(venue);
		}

		if (path === '/api/catering/search' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const people = typeof body.people === 'number' ? body.people : 1;
			const diet = typeof body.dietaryPreference === 'string' ? body.dietaryPreference : 'vegetarian';
			const maxPrice = typeof body.maximumPricePerPerson === 'number' ? body.maximumPricePerPerson : Infinity;
			const matches = cateringPackages
				.filter(
					(p) =>
						p.minimumOrder <= people &&
						p.diet === diet &&
						p.pricePerPerson <= maxPrice
				)
				.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
			return jsonResponse({ matches, count: matches.length });
		}

		if (path.startsWith('/api/catering/') && path.endsWith('/calculate') && method === 'GET') {
			const parts = path.split('/');
			const id = parts[parts.length - 2];
			const people = parseInt(url.searchParams.get('people') || '1', 10);
			const pkg = cateringPackages.find((p) => p.id === id);
			if (!pkg) return notFound();
			return jsonResponse({ package: pkg, people, total: pkg.pricePerPerson * people });
		}

		if (path === '/api/calendar/slots' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const date = typeof body.date === 'string' ? body.date : undefined;
			const after = typeof body.after === 'string' ? body.after : undefined;
			const before = typeof body.before === 'string' ? body.before : undefined;
			const matches = slots.filter((s) => {
				if (date && s.date !== date) return false;
				if (!s.available) return false;
				// Bounds are inclusive: "after 14:00" must keep the 14:00 slot, which is
				// exactly what the demo prompt ("nothing before 2 PM") asks for.
				if (after && s.startTime < after) return false;
				if (before && s.endTime > before) return false;
				return true;
			});
			return jsonResponse({ matches, count: matches.length });
		}

		if (path === '/api/budget/status' && method === 'GET') {
			const plan = getEventPlanFromRequest(request);
			return jsonResponse(budgetFor(plan));
		}

		if (path === '/api/budget/calculate' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			const people = typeof body.people === 'number' ? body.people : plan.attendees;
			const venueId = typeof body.venueId === 'string' ? body.venueId : plan.venue?.id;
			const packageId = typeof body.packageId === 'string' ? body.packageId : plan.catering?.id;
			const venue = venueId ? venues.find((v) => v.id === venueId) : undefined;
			const pkg = packageId ? cateringPackages.find((p) => p.id === packageId) : undefined;
			const venueCost = venue ? venue.price : 0;
			const cateringCost = pkg ? pkg.pricePerPerson * people : 0;
			const total = venueCost + cateringCost;
			return jsonResponse({
				venueCost,
				cateringCost,
				total,
				remaining: plan.budgetLimit - total,
				withinBudget: total <= plan.budgetLimit,
			});
		}

		if (path === '/api/plan/requirements' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			if (typeof body.attendees === 'number') plan.attendees = body.attendees;
			if (typeof body.date === 'string') plan.date = body.date;
			if (typeof body.startTime === 'string') plan.startTime = body.startTime;
			if (typeof body.dietaryPreference === 'string') plan.dietaryPreference = body.dietaryPreference as EventPlan['dietaryPreference'];
			if (typeof body.budgetLimit === 'number') plan.budgetLimit = body.budgetLimit;
			return jsonResponse({ event: plan });
		}

		if (path === '/api/venues/reserve' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			const venueId = typeof body.venueId === 'string' ? body.venueId : undefined;
			const attendees = typeof body.attendees === 'number' ? body.attendees : plan.attendees;
			const date = typeof body.date === 'string' ? body.date : plan.date;
			if (!venueId) return badRequest('venueId required');
			const venue = venues.find((v) => v.id === venueId);
			if (!venue) return notFound();
			if (venue.capacity < attendees) {
				return badRequest(`Venue capacity ${venue.capacity} is less than attendees ${attendees}`);
			}
			if (!venue.availability.includes(date)) {
				return badRequest(`Venue not available on ${date}`);
			}
			plan.venue = venue;
			plan.date = date;
			plan.status = plan.catering && plan.calendarSlot ? 'scheduled' : 'reserved';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/venues/cancel' && method === 'POST') {
			const plan = getEventPlanFromRequest(request);
			plan.venue = undefined;
			plan.status = 'planning';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/catering/order' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			const packageId = typeof body.packageId === 'string' ? body.packageId : undefined;
			const people = typeof body.people === 'number' ? body.people : plan.attendees;
			if (!packageId) return badRequest('packageId required');
			const pkg = cateringPackages.find((p) => p.id === packageId);
			if (!pkg) return notFound();
			if (pkg.minimumOrder > people) {
				return badRequest(`Minimum order ${pkg.minimumOrder} is greater than people ${people}`);
			}
			plan.catering = pkg;
			plan.attendees = people;
			if (pkg.diet !== 'mixed') plan.dietaryPreference = pkg.diet;
			plan.status = plan.venue && plan.calendarSlot ? 'scheduled' : 'reserved';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/catering/cancel' && method === 'POST') {
			const plan = getEventPlanFromRequest(request);
			plan.catering = undefined;
			plan.status = plan.venue ? 'reserved' : 'planning';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/calendar/schedule' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			const slotId = typeof body.slotId === 'string' ? body.slotId : undefined;
			if (!slotId) return badRequest('slotId required');
			const slot = slots.find((s) => s.id === slotId);
			if (!slot || !slot.available) return badRequest('Slot not available');
			plan.calendarSlot = slot;
			plan.date = slot.date;
			plan.startTime = slot.startTime;
			plan.status = plan.venue && plan.catering ? 'scheduled' : 'reserved';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/calendar/reschedule' && method === 'POST') {
			const body = (await request.json()) as Record<string, unknown>;
			const plan = getEventPlanFromRequest(request);
			const slotId = typeof body.slotId === 'string' ? body.slotId : undefined;
			if (!slotId) return badRequest('slotId required');
			const slot = slots.find((s) => s.id === slotId);
			if (!slot || !slot.available) return badRequest('Slot not available');
			if (plan.venue && !plan.venue.availability.includes(slot.date)) {
				return badRequest(`${plan.venue.name} is not available on ${slot.date}`);
			}
			plan.calendarSlot = slot;
			plan.date = slot.date;
			plan.startTime = slot.startTime;
			plan.status = plan.venue && plan.catering ? 'scheduled' : 'reserved';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		if (path === '/api/calendar/cancel' && method === 'POST') {
			const plan = getEventPlanFromRequest(request);
			plan.calendarSlot = undefined;
			plan.status = plan.venue || plan.catering ? 'reserved' : 'planning';
			return jsonResponse({ event: plan, budget: budgetFor(plan) });
		}

		// For SPA routing, serve index.html for non-API, non-asset paths (handled by assets binding usually)
		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
