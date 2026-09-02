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
}

export interface ExecuteOptions {
	/** Absent when a driver calls an executor directly instead of through the browser. */
	signal?: AbortSignal;
	bypassApproval?: boolean;
}

export interface Tool {
	name: string;
	title?: string;
	description: string;
	inputSchema?: JSONSchema;
	annotations?: ToolAnnotations;
	execute: (input: unknown, options: ExecuteOptions) => Promise<unknown>;
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
