export interface JSONSchema {
	type?: string | string[];
	properties?: Record<string, JSONSchema>;
	required?: string[];
	items?: JSONSchema;
	enum?: (string | number)[];
	description?: string;
	minimum?: number;
	maximum?: number;
	default?: unknown;
}

export interface ToolAnnotations {
	readOnlyHint?: boolean;
	untrustedContentHint?: boolean;
}

export interface Tool {
	name: string;
	title?: string;
	description: string;
	inputSchema?: JSONSchema;
	annotations?: ToolAnnotations;
	execute: (input: unknown, options: { signal: AbortSignal }) => Promise<unknown>;
}

export interface RegisteredToolInfo {
	name: string;
	title?: string;
	description: string;
	inputSchema?: JSONSchema;
	annotations?: ToolAnnotations;
}

declare global {
	interface ModelContext {
		registerTool(
			tool: {
				name: string;
				title?: string;
				description: string;
				inputSchema?: JSONSchema;
				execute: (input: unknown, options: { signal: AbortSignal }) => Promise<unknown>;
				annotations?: ToolAnnotations;
			},
			options?: { signal?: AbortSignal }
		): Promise<void>;
		unregisterTool(name: string): Promise<void>;
		getTools(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
		ontoolchange: ((this: ModelContext, ev: Event) => unknown) | null;
	}

	interface Document {
		modelContext?: ModelContext;
	}
}
