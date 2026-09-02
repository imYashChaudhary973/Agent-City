/**
 * Pure derivation of "what the agent sees right now" from the action stream.
 * The agent pane is a rendering of document.modelContext, so this decides the
 * live phase of every registered tool without touching React or the DOM.
 */
import type { AgentAction, PendingApproval } from '../types';
import { kindOf, districtOf, type TripKind, type Place } from './cityEvents';

export type ToolPhase = 'idle' | 'calling' | 'awaiting' | 'ok' | 'error';

export interface ToolView {
	name: string;
	kind: TripKind;
	district: Place | null;
	phase: ToolPhase;
	/** Duration of the most recent completed call, ms. */
	lastDuration: number | null;
	/** Origin of the in-flight or most recent call. */
	lastOrigin: 'agent' | 'human' | null;
}

/** Most recent action for a tool, or undefined. Actions arrive newest-first. */
function latest(actions: AgentAction[], tool: string): AgentAction | undefined {
	return actions.find((a) => a.tool === tool);
}

export function phaseOf(
	tool: string,
	actions: AgentAction[],
	pendingApprovals: PendingApproval[]
): ToolPhase {
	const action = latest(actions, tool);
	if (!action) return 'idle';
	if (action.status === 'pending') {
		return pendingApprovals.some((a) => a.tool === tool) ? 'awaiting' : 'calling';
	}
	return action.status === 'error' ? 'error' : 'ok';
}

export function toolViews(
	names: string[],
	actions: AgentAction[],
	pendingApprovals: PendingApproval[]
): ToolView[] {
	return names.map((name) => {
		const action = latest(actions, name);
		return {
			name,
			kind: kindOf(name),
			district: districtOf(name),
			phase: phaseOf(name, actions, pendingApprovals),
			lastDuration: action && action.status !== 'pending' ? action.duration : null,
			lastOrigin: action?.origin ?? null,
		};
	});
}

/** Names present in `next` but not `prev` — the tools that just registered. */
export function newlyRegistered(prev: string[], next: string[]): string[] {
	const before = new Set(prev);
	return next.filter((n) => !before.has(n));
}

/** The district the agent is touching right now, for follow-agent mode. */
export function activeDistrict(actions: AgentAction[]): Place | null {
	const live = actions.find((a) => a.status === 'pending' && districtOf(a.tool));
	return live ? districtOf(live.tool) : null;
}

/** Compact one-line rendering of a JSON schema's shape, for the tool card. */
export function schemaSummary(schema: unknown): string[] {
	if (!schema || typeof schema !== 'object') return [];
	const props = (schema as { properties?: Record<string, { type?: string; enum?: unknown[] }> }).properties;
	const required = new Set((schema as { required?: string[] }).required ?? []);
	if (!props) return [];
	return Object.entries(props).map(([key, def]) => {
		const type = def?.enum ? def.enum.join('|') : (def?.type ?? 'any');
		return `${key}${required.has(key) ? '' : '?'}: ${type}`;
	});
}

/**
 * Latest `matches` array a search tool returned, or null if it was never called.
 * Districts read results from here rather than local state, so a search run by
 * the agent shows up in the human's view too — same state, two renderings.
 */
export function lastMatches<T>(actions: AgentAction[], tool: string): T[] | null {
	const hit = actions.find((a) => a.tool === tool && a.status === 'success');
	const result = hit?.result;
	if (!result || typeof result !== 'object') return null;
	const matches = (result as { matches?: unknown }).matches;
	return Array.isArray(matches) ? (matches as T[]) : null;
}
