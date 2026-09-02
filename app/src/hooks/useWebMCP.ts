import { useEffect } from 'react';
import { registerTools } from '../lib/webmcp';
import { availableTools } from '../lib/tools';
import { useCityStore } from '../store/cityStore';

/**
 * Keeps `document.modelContext` in sync with the plan. `registerTools` already
 * diffs against what is registered, so this only has to re-run when a selection
 * changes the available surface — no unregister-everything teardown, which used
 * to strip the whole tool set whenever a reservation was modified in place.
 */
export function useWebMCP() {
	const state = useCityStore();

	useEffect(() => {
		registerTools(availableTools(state));
	}, [state.event.venue?.id, state.event.catering?.id, state.event.calendarSlot?.id]);
}
