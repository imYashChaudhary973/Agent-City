import { getCityState } from '../store/cityStore';

const API_BASE = '/api';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'x-agent-city-plan': JSON.stringify(getCityState().event),
	};
	if (init?.headers) {
		const provided = init.headers as Record<string, string>;
		for (const [k, v] of Object.entries(provided)) headers[k] = v;
	}
	const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

export interface VenuesSearchParams {
	minimumCapacity?: number;
	maximumPrice?: number;
	date?: string;
}

export interface CateringSearchParams {
	people: number;
	dietaryPreference: string;
	maximumPricePerPerson?: number;
}

export interface SlotsSearchParams {
	date?: string;
	after?: string;
	before?: string;
	durationMinutes?: number;
}

export interface ReserveVenueBody {
	venueId: string;
	attendees: number;
	date: string;
}

export interface PlaceCateringBody {
	packageId: string;
	people: number;
}

export interface ScheduleEventBody {
	slotId: string;
}

export interface UpdateRequirementsBody {
	attendees?: number;
	date?: string;
	startTime?: string;
	dietaryPreference?: string;
	budgetLimit?: number;
}
