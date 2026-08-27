import { useSyncExternalStore } from 'react';
import type { AgentAction, EventPlan, PendingApproval } from '../types';

export interface CityState {
	event: EventPlan;
	actions: AgentAction[];
	pendingApprovals: PendingApproval[];
	approvalOutcomes: Record<string, 'approved' | 'rejected' >;
}

function tomorrow(): string {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	return d.toISOString().split('T')[0];
}

function defaultEvent(): EventPlan {
	return {
		attendees: 12,
		date: tomorrow(),
		startTime: '14:00',
		dietaryPreference: 'vegetarian',
		budgetLimit: 10000,
		status: 'planning',
	};
}

let state: CityState = {
	event: defaultEvent(),
	actions: [],
	pendingApprovals: [],
	approvalOutcomes: {},
};

const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) listener();
}

function snapshot(): CityState {
	return state;
}

export function useCityStore(): CityState {
	return useSyncExternalStore(
		(callback) => {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
		snapshot,
		snapshot
	);
}

export function getCityState(): CityState {
	return state;
}

export function updateEvent(partial: Partial<EventPlan>) {
	state = { ...state, event: { ...state.event, ...partial } };
	emit();
}

export function setEvent(event: EventPlan) {
	state = { ...state, event };
	emit();
}

export function addAction(action: AgentAction) {
	state = { ...state, actions: [action, ...state.actions].slice(0, 50) };
	emit();
}

export function updateAction(id: string, patch: Partial<AgentAction>) {
	state = {
		...state,
		actions: state.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
	};
	emit();
}

export function addPendingApproval(approval: PendingApproval) {
	state = { ...state, pendingApprovals: [...state.pendingApprovals, approval] };
	emit();
}

export function removePendingApproval(id: string) {
	state = {
		...state,
		pendingApprovals: state.pendingApprovals.filter((a) => a.id !== id),
	};
	emit();
}

export function setApprovalOutcome(id: string, outcome: 'approved' | 'rejected') {
	state = { ...state, approvalOutcomes: { ...state.approvalOutcomes, [id]: outcome } };
	emit();
}

export function getApprovalOutcome(id: string): 'approved' | 'rejected' | undefined {
	return state.approvalOutcomes[id];
}

export function resetCity() {
	state = {
		event: defaultEvent(),
		actions: [],
		pendingApprovals: [],
		approvalOutcomes: {},
	};
	emit();
}
