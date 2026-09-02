import { describe, it, expect } from 'vitest';
import { districtOf, kindOf, routeFor, gateIndex, needsApproval, PLACES, ROADS } from './cityEvents';

describe('cityEvents routing', () => {
	it('routes each tool to its district', () => {
		expect(districtOf('search_venues')).toBe('venues');
		expect(districtOf('cancel_catering_order')).toBe('catering');
		expect(districtOf('find_available_slots')).toBe('calendar');
		expect(districtOf('get_budget_status')).toBe('budget');
		expect(districtOf('get_event_plan')).toBe('plan');
	});

	it('ignores non-trip actions', () => {
		expect(districtOf('toolchange')).toBeNull();
	});

	it('classifies reads, writes and destructive calls', () => {
		expect(kindOf('search_venues')).toBe('read');
		expect(kindOf('calculate_event_cost')).toBe('read');
		expect(kindOf('reserve_venue')).toBe('write');
		expect(kindOf('update_event_requirements')).toBe('write');
		expect(kindOf('cancel_event')).toBe('destructive');
	});

	it('gates every tool that books, rebooks or cancels a commitment', () => {
		for (const gated of [
			'reserve_venue',
			'place_catering_order',
			'schedule_event',
			'modify_reservation',
			'modify_catering_order',
			'reschedule_event',
			'cancel_reservation',
			'cancel_catering_order',
			'cancel_event',
		]) {
			expect(needsApproval(gated)).toBe(true);
		}
	});

	it('leaves reads and planning-parameter edits ungated', () => {
		expect(needsApproval('search_venues')).toBe(false);
		expect(needsApproval('get_event_plan')).toBe(false);
		expect(needsApproval('update_event_requirements')).toBe(false);
	});

	it('builds a round trip through City Hall and the Event Site', () => {
		expect(routeFor('agent', 'venues')).toEqual([
			'agent', 'hall', 'plan', 'venues', 'plan', 'hall', 'agent',
		]);
	});

	it('does not double-visit the Event Site when it is the destination', () => {
		expect(routeFor('human', 'plan')).toEqual(['human', 'hall', 'plan', 'hall', 'human']);
	});

	it('parks gated couriers at City Hall before they reach the district', () => {
		const route = routeFor('agent', 'catering');
		const gate = gateIndex(route);
		expect(route[gate]).toBe('hall');
		expect(gate).toBeLessThan(route.indexOf('catering'));
	});

	it('only travels roads that exist', () => {
		const roadSet = new Set(ROADS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
		const origins = ['agent', 'human'] as const;
		const districts = ['venues', 'catering', 'calendar', 'budget', 'plan'] as const;
		for (const origin of origins) {
			for (const district of districts) {
				const route = routeFor(origin, district);
				for (let i = 0; i < route.length - 1; i++) {
					expect(roadSet.has(`${route[i]}|${route[i + 1]}`)).toBe(true);
				}
			}
		}
	});

	it('gives every place a position on the stage', () => {
		for (const [, pos] of Object.entries(PLACES)) {
			expect(pos.x).toBeGreaterThanOrEqual(0);
			expect(pos.x).toBeLessThanOrEqual(100);
			expect(pos.y).toBeGreaterThanOrEqual(0);
			expect(pos.y).toBeLessThanOrEqual(100);
		}
	});
});
