import { useEffect } from 'react';
import type { Tool } from '../types/webmcp';
import { registerTools, unregisterTools, listenToolChanges } from '../lib/webmcp';
import { availableTools } from '../lib/tools';
import { useCityStore, addAction } from '../store/cityStore';

export function useWebMCP() {
	const state = useCityStore();

	useEffect(() => {
		const tools: Tool[] = availableTools(state);
		registerTools(tools);
		listenToolChanges(() => {
			addAction({
				id: crypto.randomUUID(),
				tool: 'toolchange',
				input: { available: tools.map((t) => t.name) },
				result: null,
				duration: 0,
				ts: Date.now(),
				status: 'success',
			});
		});
		return () => unregisterTools(tools.map((t) => t.name));
	}, [state]);
}
