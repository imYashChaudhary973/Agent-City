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

/**
 * Demo datasets roll with the calendar: day 0 is today (UTC), so prompts like
 * "tomorrow afternoon" always resolve to real availability.
 */
export function demoDates(): [string, string, string] {
	const now = new Date();
	return [0, 1, 2].map((offset) => {
		const d = new Date(now);
		d.setUTCDate(d.getUTCDate() + offset);
		return d.toISOString().slice(0, 10);
	}) as [string, string, string];
}

/** `openOn` indexes into `demoDates()`, so availability shifts with the day. */
const VENUE_SEED: (Omit<Venue, 'availability'> & { openOn: number[] })[] = [
	{
		id: 'codehouse',
		name: 'CodeHouse',
		capacity: 25,
		price: 4000,
		location: 'Indiranagar',
		features: ['projector', 'whiteboard', 'wifi', 'parking'],
		openOn: [0, 1, 2],
	},
	{
		id: 'devhub',
		name: 'DevHub',
		capacity: 15,
		price: 2500,
		location: 'Koramangala',
		features: ['wifi', 'coffee'],
		openOn: [0, 1, 2],
	},
	{
		id: 'stackarena',
		name: 'Stack Arena',
		capacity: 40,
		price: 7000,
		location: 'HSR Layout',
		features: ['projector', 'stage', 'sound', 'parking'],
		openOn: [0, 2],
	},
	{
		id: 'terminal',
		name: 'Terminal 42',
		capacity: 12,
		price: 1800,
		location: 'Whitefield',
		features: ['wifi', 'whiteboard'],
		openOn: [0, 1, 2],
	},
	{
		id: 'cachecorner',
		name: 'Cache Corner',
		capacity: 20,
		price: 3200,
		location: 'MG Road',
		features: ['projector', 'wifi', 'coffee'],
		openOn: [1, 2],
	},
	{
		id: 'pixelpalace',
		name: 'Pixel Palace',
		capacity: 30,
		price: 5500,
		location: 'JP Nagar',
		features: ['projector', 'whiteboard', 'wifi', 'parking', 'coffee'],
		openOn: [0, 1, 2],
	},
];

export const cateringPackages: CateringPackage[] = [
	{
		id: 'basic-veg',
		name: 'Basic Veg Thali',
		pricePerPerson: 280,
		diet: 'vegetarian',
		minimumOrder: 10,
		rating: 4.2,
		items: ['dal', 'sabzi', 'rice', 'roti', 'raita'],
	},
	{
		id: 'veg-delight',
		name: 'Veg Delight',
		pricePerPerson: 450,
		diet: 'vegetarian',
		minimumOrder: 8,
		rating: 4.6,
		items: ['paneer tikka', 'dal makhani', 'naan', 'rice', 'gulab jamun'],
	},
	{
		id: 'vegan-green',
		name: 'Vegan Green',
		pricePerPerson: 500,
		diet: 'vegan',
		minimumOrder: 10,
		rating: 4.5,
		items: ['hummus bowl', 'quinoa salad', 'stir-fried tofu', 'fruit platter'],
	},
	{
		id: 'jain-thali',
		name: 'Jain Thali',
		pricePerPerson: 480,
		diet: 'jain',
		minimumOrder: 10,
		rating: 4.7,
		items: ['jain paneer', 'dal', 'rice', 'roti', 'kheer'],
	},
	{
		id: 'mixed-feast',
		name: 'Mixed Feast',
		pricePerPerson: 520,
		diet: 'mixed',
		minimumOrder: 10,
		rating: 4.4,
		items: ['chicken tikka', 'paneer butter masala', 'dal', 'naan', 'rice'],
	},
	{
		id: 'southindian',
		name: 'South Indian Combo',
		pricePerPerson: 350,
		diet: 'vegetarian',
		minimumOrder: 12,
		rating: 4.8,
		items: ['idli', 'dosa', 'vada', 'sambar', 'chutney', 'kesari'],
	},
	{
		id: 'pizzaparty',
		name: 'Pizza Party',
		pricePerPerson: 400,
		diet: 'vegetarian',
		minimumOrder: 8,
		rating: 4.3,
		items: ['margherita', 'farmhouse', 'garlic bread', 'brownie'],
	},
];

const SLOT_STARTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

interface Catalog {
	day: string;
	venues: Venue[];
	slots: CalendarSlot[];
}

let cached: Catalog | undefined;

/** Rebuilt only when the UTC day rolls over, so warm isolates never go stale. */
export function catalog(): Catalog {
	const dates = demoDates();
	if (cached?.day === dates[0]) return cached;
	cached = {
		day: dates[0],
		venues: VENUE_SEED.map(({ openOn, ...venue }) => ({
			...venue,
			availability: openOn.map((index) => dates[index]),
		})),
		slots: dates.flatMap((date) =>
			SLOT_STARTS.map((startTime, index) => ({
				id: `${date}-${index}`,
				date,
				startTime,
				endTime: `${String(Number(startTime.slice(0, 2)) + 1).padStart(2, '0')}:00`,
				available: true,
			}))
		),
	};
	return cached;
}
