export interface Venue {
	id: string;
	name: string;
	capacity: number;
	price: number;
	location: string;
	features: string[];
	availability: string[];
}

export interface CateringPackage {
	id: string;
	name: string;
	pricePerPerson: number;
	diet: 'vegetarian' | 'vegan' | 'mixed' | 'jain';
	minimumOrder: number;
	rating: number;
	items: string[];
}

export interface CalendarSlot {
	id: string;
	date: string;
	startTime: string;
	endTime: string;
	available: boolean;
}

export interface Budget {
	limit: number;
	reserved: number;
	spent: number;
	remaining: number;
}

export interface EventPlan {
	attendees: number;
	date: string;
	startTime: string;
	dietaryPreference: 'vegetarian' | 'vegan' | 'mixed' | 'jain';
	budgetLimit: number;
	venue?: Venue;
	catering?: CateringPackage;
	calendarSlot?: CalendarSlot;
	status: 'planning' | 'reserved' | 'scheduled' | 'cancelled';
}

export interface AgentAction {
	id: string;
	tool: string;
	/** Which operator dispatched this call: the WebMCP agent, or a human clicking the UI. */
	origin: 'agent' | 'human';
	input: unknown;
	result: unknown;
	duration: number;
	ts: number;
	status: 'success' | 'error' | 'pending';
}

export interface PendingApproval {
	id: string;
	tool: string;
	input: unknown;
	description: string;
}

export type District = 'city' | 'overview' | 'venues' | 'catering' | 'calendar' | 'budget';
