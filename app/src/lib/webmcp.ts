import type { JSONSchema, RegisteredToolInfo, Tool } from '../types/webmcp';
import { addAction, updateAction } from '../store/cityStore';

let registered = new Set<string>();

function wrapExecute(name: string, execute: (input: unknown) => Promise<unknown>): (input: unknown) => Promise<unknown> {
	return async (input: unknown) => {
		const id = crypto.randomUUID();
		const start = performance.now();
		addAction({ id, tool: name, input, result: null, duration: 0, ts: Date.now(), status: 'pending' });
		try {
			const result = await execute(input);
			const duration = Math.round(performance.now() - start);
			updateAction(id, { result, duration, status: 'success' });
			return result;
		} catch (err) {
			const duration = Math.round(performance.now() - start);
			const message = err instanceof Error ? err.message : String(err);
			updateAction(id, { result: { error: message }, duration, status: 'error' });
			throw err;
		}
	};
}

export async function registerTools(tools: Tool[]) {
	if (typeof document === 'undefined' || !document.modelContext) return;

	for (const tool of tools) {
		if (registered.has(tool.name)) continue;
		try {
			await document.modelContext!.registerTool({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
				execute: wrapExecute(tool.name, tool.execute),
			});
			registered.add(tool.name);
		} catch {
			// ignore concurrent registration races
		}
	}

	for (const name of registered) {
		if (!tools.some((t) => t.name === name)) {
			try {
				await document.modelContext!.unregisterTool(name);
			} catch {
				// ignore
			}
			registered.delete(name);
		}
	}
}

export async function unregisterTools(names: string[]) {
	if (typeof document === 'undefined' || !document.modelContext) return;
	for (const name of names) {
		if (!registered.has(name)) continue;
		try {
			await document.modelContext!.unregisterTool(name);
		} catch {
			// ignore
		}
		registered.delete(name);
	}
}

export function isWebMCPAvailable(): boolean {
	return typeof document !== 'undefined' && !!document.modelContext;
}

export function getRegisteredToolInfos(tools: Tool[]): RegisteredToolInfo[] {
	return tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
