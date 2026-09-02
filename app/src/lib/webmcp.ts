import type { Tool } from '../types/webmcp';
import { addAction, updateAction, getCityState } from '../store/cityStore';
import { availableTools } from './tools';

const registered = new Set<string>();
/** Kept at module scope so a tool registered by an earlier call can still be aborted. */
const controllers = new Map<string, AbortController>();

function isWebMCPAvailable(): boolean {
	return typeof document !== 'undefined' && !!document.modelContext?.registerTool;
}

function wrapExecute(
	name: string,
	execute: (input: unknown, options: { signal?: AbortSignal; bypassApproval?: boolean }) => Promise<unknown>
): (input: unknown, options?: { signal?: AbortSignal }) => Promise<unknown> {
	return async (input: unknown, options?: { signal?: AbortSignal }) => {
		const id = crypto.randomUUID();
		const start = performance.now();
		addAction({ id, tool: name, origin: 'agent', input, result: null, duration: 0, ts: Date.now(), status: 'pending' });
		try {
			const result = await execute(input, { signal: options?.signal, bypassApproval: false });
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

// Expose tool executors on window so external agent drivers (ChatGPT browser,
// Cloudflare Browser Run, console scripts) can discover and call them directly.
function exposeAgentHooks(tools: Tool[]) {
	if (typeof window === 'undefined') return;
	// Window is an open bag here on purpose: these are demo/driver hooks, not app API.
	const w = window as unknown as Record<string, unknown>;
	const map: Record<string, Tool> = {};
	// Wrap the same way registerTool does, so a driver calling these directly is
	// logged, approval-gated, and visible in the city — not a silent side channel.
	for (const t of tools) map[t.name] = { ...t, execute: wrapExecute(t.name, t.execute) };
	w.__agentCityTools = tools.map((t) => ({ name: t.name, description: t.description, schema: t.inputSchema }));
	w.__agentCityToolMap = map;
	w.__agentCityState = () => getCityState();
	w.__agentCityRegisterNow = () => registerTools(availableTools(getCityState()));
}

export async function registerTools(tools: Tool[]) {
	exposeAgentHooks(tools);
	if (!isWebMCPAvailable()) return;

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
			controllers.get(name)?.abort();
			controllers.delete(name);
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
			origin: 'agent',
			input: { available: tools.map((t) => t.name), added, removed },
			result: null,
			duration: 0,
			ts: Date.now(),
			status: 'success',
		});
	}
}

export { isWebMCPAvailable };
