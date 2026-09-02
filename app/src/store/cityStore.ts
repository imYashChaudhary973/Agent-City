import { useSyncExternalStore } from 'react';
import type { AgentAction, EventPlan, PendingApproval } from '../types';

export interface CityState {
	event: EventPlan;
	actions: AgentAction[];
	pendingApprovals: PendingApproval[];
	approvalOutcomes: Record<string, 'approved' | 'rejected' >;
}

/** UTC arithmetic, matching the Worker's `demoDates()` so both agree on "tomorrow". */
function tomorrow(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
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

export function subscribeCity(callback: () => void): () => void {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

export function getCityState(): CityState {
	return state;
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

/** Clears the recorded outcome too: it exists only to unblock the waiting tool call. */
export function removePendingApproval(id: string) {
	const { [id]: _resolved, ...approvalOutcomes } = state.approvalOutcomes;
	state = {
		...state,
		pendingApprovals: state.pendingApprovals.filter((a) => a.id !== id),
		approvalOutcomes,
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

