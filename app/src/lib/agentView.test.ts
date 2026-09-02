import { describe, it, expect } from 'vitest';
import { phaseOf, toolViews, newlyRegistered, activeDistrict, schemaSummary } from './agentView';
import type { AgentAction, PendingApproval } from '../types';

const act = (p: Partial<AgentAction>): AgentAction => ({
	id: 'a', tool: 'search_venues', origin: 'agent', input: {}, result: null,
	duration: 0, ts: 1, status: 'success', ...p,
});

describe('agentView', () => {
	it('reports idle for a tool that has never been called', () => {
		expect(phaseOf('search_venues', [], [])).toBe('idle');
	});

	it('distinguishes an in-flight call from one held at approval', () => {
		const pending = [act({ tool: 'reserve_venue', status: 'pending' })];
		expect(phaseOf('reserve_venue', pending, [])).toBe('calling');

		const approval: PendingApproval[] = [{ id: 'x', tool: 'reserve_venue', input: {}, description: '' }];
		expect(phaseOf('reserve_venue', pending, approval)).toBe('awaiting');
	});

	it('surfaces errors over successes', () => {
		expect(phaseOf('search_venues', [act({ status: 'error' })], [])).toBe('error');
		expect(phaseOf('search_venues', [act({ status: 'success' })], [])).toBe('ok');
	});

	it('uses the most recent call, since actions arrive newest-first', () => {
		const actions = [act({ id: '2', status: 'pending' }), act({ id: '1', status: 'error' })];
		expect(phaseOf('search_venues', actions, [])).toBe('calling');
	});

	it('carries duration and origin onto the view, but not while in flight', () => {
		const [view] = toolViews(['search_venues'], [act({ duration: 142, origin: 'human' })], []);
		expect(view).toMatchObject({ kind: 'read', district: 'venues', phase: 'ok', lastDuration: 142, lastOrigin: 'human' });

		const [live] = toolViews(['search_venues'], [act({ status: 'pending', duration: 0 })], []);
		expect(live.lastDuration).toBeNull();
	});

	it('detects tools that just registered', () => {
		expect(newlyRegistered(['a', 'b'], ['a', 'b', 'c'])).toEqual(['c']);
		expect(newlyRegistered(['a', 'b'], ['a'])).toEqual([]);
	});

	it('follows the district of the in-flight call only', () => {
		expect(activeDistrict([act({ status: 'success' })])).toBeNull();
		expect(activeDistrict([act({ tool: 'search_catering', status: 'pending' })])).toBe('catering');
	});

	it('ignores non-district actions when following', () => {
		expect(activeDistrict([act({ tool: 'toolchange', status: 'pending' })])).toBeNull();
	});

	it('summarises a schema, marking optional fields and enums', () => {
		expect(
			schemaSummary({
				type: 'object',
				properties: {
					people: { type: 'integer' },
					diet: { enum: ['vegetarian', 'vegan'] },
					maxPrice: { type: 'number' },
				},
				required: ['people', 'diet'],
			})
		).toEqual(['people: integer', 'diet: vegetarian|vegan', 'maxPrice?: number']);
	});

	it('handles tools with no schema', () => {
		expect(schemaSummary(undefined)).toEqual([]);
		expect(schemaSummary({ type: 'object', properties: {} })).toEqual([]);
	});
});
