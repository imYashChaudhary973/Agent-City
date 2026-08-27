import { useEffect, useRef } from 'react';
import type { Tool } from '../types/webmcp';
import { registerTools, unregisterTools, listenToolChanges } from '../lib/webmcp';
import { availableTools } from '../lib/tools';
import { useCityStore } from '../store/cityStore';

function names(tools: Tool[]): string[] {
	return tools.map((t) => t.name).sort();
}

export function useWebMCP() {
	const state = useCityStore();
	const prevNamesRef = useRef<string[]>([]);

	useEffect(() => {
		const tools: Tool[] = availableTools(state);
		const currentNames = names(tools);
		const changed =
			currentNames.length !== prevNamesRef.current.length ||
			currentNames.some((n, i) => n !== prevNamesRef.current[i]);

		if (changed) {
			prevNamesRef.current = currentNames;
			registerTools(tools);
		}

		listenToolChanges(() => {
			// Browser-side notification. Our own registration changes are logged by registerTools.
		});

		return () => unregisterTools(tools.map((t) => t.name));
	}, [state.event.venue?.id, state.event.catering?.id, state.event.calendarSlot?.id]);
}
