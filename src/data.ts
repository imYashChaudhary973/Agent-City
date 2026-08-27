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

export const venues: Venue[] = [
	{
		id: 'codehouse',
		name: 'CodeHouse',
		capacity: 25,
		price: 4000,
		location: 'Indiranagar',
		features: ['projector', 'whiteboard', 'wifi', 'parking'],
		availability: ['2026-08-28', '2026-08-29', '2026-08-30'],
	},
	{
		id: 'devhub',
		name: 'DevHub',
		capacity: 15,
		price: 2500,
		location: 'Koramangala',
		features: ['wifi', 'coffee'],
		availability: ['2026-08-28', '2026-08-29', '2026-08-30'],
	},
	{
		id: 'stackarena',
		name: 'Stack Arena',
		capacity: 40,
		price: 7000,
		location: 'HSR Layout',
		features: ['projector', 'stage', 'sound', 'parking'],
		availability: ['2026-08-28', '2026-08-30'],
	},
	{
		id: 'terminal',
		name: 'Terminal 42',
		capacity: 12,
		price: 1800,
		location: 'Whitefield',
		features: ['wifi', 'whiteboard'],
		availability: ['2026-08-28', '2026-08-29', '2026-08-30'],
	},
	{
		id: 'cachecorner',
		name: 'Cache Corner',
		capacity: 20,
		price: 3200,
		location: 'MG Road',
		features: ['projector', 'wifi', 'coffee'],
		availability: ['2026-08-29', '2026-08-30'],
	},
	{
		id: 'pixelpalace',
		name: 'Pixel Palace',
		capacity: 30,
		price: 5500,
		location: 'JP Nagar',
		features: ['projector', 'whiteboard', 'wifi', 'parking', 'coffee'],
		availability: ['2026-08-28', '2026-08-29', '2026-08-30'],
	},
];

export const cateringPackages: CateringPackage[] = [
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

export function generateSlots(): CalendarSlot[] {
	const dates = ['2026-08-28', '2026-08-29', '2026-08-30'];
	const starts = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
	const slots: CalendarSlot[] = [];
	for (const date of dates) {
		for (let i = 0; i < starts.length; i++) {
			slots.push({
				id: `${date}-${i}`,
				date,
				startTime: starts[i],
				endTime: `${parseInt(starts[i].split(':')[0]) + 1}:00`,
				available: Math.random() > 0.35,
			});
		}
	}
	// force the killer demo slots to be available
	for (const s of slots) {
		if ((s.date === '2026-08-28' || s.date === '2026-08-30') && s.startTime === '14:00') {
			s.available = true;
		}
	}
	return slots;
}

export const calendarSlots: CalendarSlot[] = generateSlots();
