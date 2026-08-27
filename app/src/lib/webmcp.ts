import type { RegisteredToolInfo, Tool } from '../types/webmcp';
import { addAction, updateAction } from '../store/cityStore';

let registered = new Set<string>();

function isWebMCPAvailable(): boolean {
	return typeof document !== 'undefined' && !!document.modelContext?.registerTool;
}

function wrapExecute(
	name: string,
	execute: (input: unknown, options: { signal: AbortSignal }) => Promise<unknown>
): (input: unknown, options: { signal: AbortSignal }) => Promise<unknown> {
	return async (input: unknown, options: { signal: AbortSignal }) => {
		const id = crypto.randomUUID();
		const start = performance.now();
		addAction({ id, tool: name, input, result: null, duration: 0, ts: Date.now(), status: 'pending' });
		try {
			const result = await execute(input, options);
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
	if (!isWebMCPAvailable()) return;

	const controllers = new Map<string, AbortController>();
	const added: string[] = [];

	for (const tool of tools) {
		if (registered.has(tool.name)) {
			continue;
		}
		const controller = new AbortController();
		controllers.set(tool.name, controller);
		try {
			await document.modelContext!.registerTool(
				{
					name: tool.name,
					title: tool.title ?? tool.name,
					description: tool.description,
					inputSchema: tool.inputSchema,
					execute: wrapExecute(tool.name, tool.execute),
					annotations: tool.annotations,
				},
				{ signal: controller.signal }
			);
			registered.add(tool.name);
			added.push(tool.name);
		} catch {
			// ignore concurrent registration races
		}
	}

	const removed: string[] = [];
	for (const name of registered) {
		if (!tools.some((t) => t.name === name)) {
			const controller = controllers.get(name);
			if (controller) controller.abort();
			try {
				await document.modelContext!.unregisterTool(name);
			} catch {
				// ignore
			}
			registered.delete(name);
			removed.push(name);
		}
	}

	if (added.length || removed.length) {
		addAction({
			id: crypto.randomUUID(),
			tool: 'toolchange',
			input: { available: tools.map((t) => t.name), added, removed },
			result: null,
			duration: 0,
			ts: Date.now(),
			status: 'success',
		});
	}
}

export async function unregisterTools(names: string[]) {
	if (!isWebMCPAvailable()) return;
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

export { isWebMCPAvailable };

export function listenToolChanges(handler: () => void) {
	if (!isWebMCPAvailable()) return;
	document.modelContext!.ontoolchange = handler;
}

export function getRegisteredToolInfos(tools: Tool[]): RegisteredToolInfo[] {
	return tools.map((t) => ({
		name: t.name,
		title: t.title,
		description: t.description,
		inputSchema: t.inputSchema,
		annotations: t.annotations,
	}));
}
