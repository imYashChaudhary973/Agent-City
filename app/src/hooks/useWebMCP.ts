import { useEffect } from 'react';
import type { Tool } from '../types/webmcp';
import { registerTools, unregisterTools } from '../lib/webmcp';
import { availableTools } from '../lib/tools';
import { useCityStore } from '../store/cityStore';

export function useWebMCP() {
	const state = useCityStore();

	useEffect(() => {
		const tools: Tool[] = availableTools(state);
		registerTools(tools);
		return () => unregisterTools(tools.map((t) => t.name));
	}, [state]);
}
