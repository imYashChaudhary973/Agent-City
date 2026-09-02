import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { demoDates, type CalendarSlot, type CateringPackage, type EventPlan, type Venue } from "../src/data";

const [today, tomorrow] = demoDates();

const plan: EventPlan = {
	attendees: 12,
	date: tomorrow,
	startTime: "14:00",
	dietaryPreference: "vegetarian",
	budgetLimit: 10000,
	status: "planning",
};

interface Search<T> {
	matches: T[];
	count: number;
}
interface PlanResult {
	event: EventPlan;
	budget: { limit: number; reserved: number; spent: number; remaining: number };
}
interface Cost {
	venueCost: number;
	cateringCost: number;
	total: number;
	remaining: number;
	withinBudget: boolean;
}
interface Failure {
	error: string;
}

/** JSON boundary: the Worker's own response shapes, asserted once here. */
async function api<T>(path: string, init?: RequestInit & { plan?: EventPlan }) {
	const response = await SELF.fetch(`http://city.test${path}`, {
		...init,
		headers: {
			"Content-Type": "application/json",
			"x-agent-city-plan": JSON.stringify(init?.plan ?? plan),
		},
	});
	return { status: response.status, body: (await response.json()) as T };
}

describe("venue search", () => {
	it("returns only venues that fit and are open on the requested date", async () => {
		const { body } = await api<Search<Venue>>("/api/venues/search", {
			method: "POST",
			body: JSON.stringify({ minimumCapacity: 12, date: tomorrow }),
		});
		expect(body.count).toBeGreaterThan(0);
		for (const venue of body.matches) {
			expect(venue.capacity).toBeGreaterThanOrEqual(12);
			expect(venue.availability).toContain(tomorrow);
		}
	});

	it("ranks the tightest capacity fit first, then the cheaper room", async () => {
		const { body } = await api<Search<Venue>>("/api/venues/search", {
			method: "POST",
			body: JSON.stringify({ minimumCapacity: 12, date: today }),
		});
		expect(body.matches[0].id).toBe("terminal");
	});

	it("excludes venues above the price ceiling", async () => {
		const { body } = await api<Search<Venue>>("/api/venues/search", {
			method: "POST",
			body: JSON.stringify({ minimumCapacity: 12, maximumPrice: 2000 }),
		});
		expect(body.matches.every((venue) => venue.price <= 2000)).toBe(true);
	});
});

describe("venue reservation", () => {
	it("reserves a venue for tomorrow and moves the plan out of planning", async () => {
		const { status, body } = await api<PlanResult>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "codehouse", attendees: 12, date: tomorrow }),
		});
		expect(status).toBe(200);
		expect(body.event.venue?.id).toBe("codehouse");
		expect(body.event.status).toBe("reserved");
		expect(body.budget.reserved).toBe(4000);
	});

	it("rejects a reservation that exceeds venue capacity", async () => {
		const { status, body } = await api<Failure>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "terminal", attendees: 20, date: tomorrow }),
		});
		expect(status).toBe(400);
		expect(body.error).toMatch(/capacity/i);
	});

	it("rejects a reservation on a date the venue is closed", async () => {
		const { status, body } = await api<Failure>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "codehouse", attendees: 12, date: "1999-01-01" }),
		});
		expect(status).toBe(400);
		expect(body.error).toMatch(/not available/i);
	});

	it("404s on an unknown venue", async () => {
		const response = await SELF.fetch("http://city.test/api/venues/nope");
		expect(response.status).toBe(404);
	});
});

describe("catering", () => {
	it("returns only packages matching diet and minimum order", async () => {
		const { body } = await api<Search<CateringPackage>>("/api/catering/search", {
			method: "POST",
			body: JSON.stringify({ people: 10, dietaryPreference: "vegetarian" }),
		});
		expect(body.count).toBeGreaterThan(0);
		for (const pkg of body.matches) {
			expect(pkg.diet).toBe("vegetarian");
			expect(pkg.minimumOrder).toBeLessThanOrEqual(10);
		}
	});

	it("rejects an order below the package minimum", async () => {
		const { status, body } = await api<Failure>("/api/catering/order", {
			method: "POST",
			body: JSON.stringify({ packageId: "southindian", people: 8 }),
		});
		expect(status).toBe(400);
		expect(body.error).toMatch(/minimum order/i);
	});

	it("multiplies price per person by head count", async () => {
		const { body } = await api<{ total: number }>("/api/catering/basic-veg/calculate?people=12");
		expect(body.total).toBe(280 * 12);
	});
});

describe("calendar", () => {
	it("keeps a slot starting exactly at the requested time", async () => {
		const { body } = await api<Search<CalendarSlot>>("/api/calendar/slots", {
			method: "POST",
			body: JSON.stringify({ date: tomorrow, after: "14:00" }),
		});
		expect(body.matches.some((slot) => slot.startTime === "14:00")).toBe(true);
		for (const slot of body.matches) {
			expect(slot.date).toBe(tomorrow);
			expect(slot.startTime >= "14:00").toBe(true);
		}
	});

	it("refuses to reschedule onto a date the reserved venue is closed", async () => {
		const reserved = await api<PlanResult>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "stackarena", attendees: 20, date: today }),
		});
		const { status, body } = await api<Failure>("/api/calendar/reschedule", {
			method: "POST",
			// Stack Arena is closed on day 1 of the rolling window.
			body: JSON.stringify({ slotId: `${tomorrow}-0` }),
			plan: reserved.body.event,
		});
		expect(status).toBe(400);
		expect(body.error).toMatch(/not available/i);
	});

	it("rejects an unknown slot", async () => {
		const { status } = await api<Failure>("/api/calendar/schedule", {
			method: "POST",
			body: JSON.stringify({ slotId: "not-a-slot" }),
		});
		expect(status).toBe(400);
	});
});

describe("budget", () => {
	it("adds venue price to per-head catering and flags overspend", async () => {
		const { body } = await api<Cost>("/api/budget/calculate", {
			method: "POST",
			body: JSON.stringify({ venueId: "stackarena", packageId: "mixed-feast", people: 20 }),
		});
		expect(body.venueCost).toBe(7000);
		expect(body.cateringCost).toBe(520 * 20);
		expect(body.total).toBe(17400);
		expect(body.withinBudget).toBe(false);
		expect(body.remaining).toBe(10000 - 17400);
	});

	it("reports the reserved total for the plan carried in the header", async () => {
		const reserved = await api<PlanResult>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "devhub", attendees: 12, date: tomorrow }),
		});
		const { body } = await api<PlanResult["budget"]>("/api/budget/status", {
			plan: reserved.body.event,
		});
		expect(body.reserved).toBe(2500);
		expect(body.remaining).toBe(7500);
	});
});

describe("cancellation", () => {
	it("clears the venue off the plan", async () => {
		const reserved = await api<PlanResult>("/api/venues/reserve", {
			method: "POST",
			body: JSON.stringify({ venueId: "codehouse", attendees: 12, date: tomorrow }),
		});
		const { body } = await api<PlanResult>("/api/venues/cancel", {
			method: "POST",
			plan: reserved.body.event,
		});
		expect(body.event.venue).toBeUndefined();
		expect(body.event.status).toBe("planning");
		expect(body.budget.reserved).toBe(0);
	});

	it("clears the catering order and its cost", async () => {
		const ordered = await api<PlanResult>("/api/catering/order", {
			method: "POST",
			body: JSON.stringify({ packageId: "basic-veg", people: 12 }),
		});
		expect(ordered.body.budget.reserved).toBe(280 * 12);
		const { body } = await api<PlanResult>("/api/catering/cancel", {
			method: "POST",
			plan: ordered.body.event,
		});
		expect(body.event.catering).toBeUndefined();
		expect(body.budget.reserved).toBe(0);
	});

	it("clears the calendar slot", async () => {
		const scheduled = await api<PlanResult>("/api/calendar/schedule", {
			method: "POST",
			body: JSON.stringify({ slotId: `${tomorrow}-3` }),
		});
		expect(scheduled.body.event.calendarSlot?.startTime).toBe("14:00");
		const { body } = await api<PlanResult>("/api/calendar/cancel", {
			method: "POST",
			plan: scheduled.body.event,
		});
		expect(body.event.calendarSlot).toBeUndefined();
	});
});

describe("unknown routes", () => {
	it("404s", async () => {
		const response = await SELF.fetch("http://city.test/api/nope");
		expect(response.status).toBe(404);
	});
});
