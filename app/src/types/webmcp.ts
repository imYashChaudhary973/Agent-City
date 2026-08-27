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

export interface Tool {
	name: string;
	description: string;
	inputSchema?: JSONSchema;
	execute: (input: unknown) => Promise<unknown>;
}

export interface RegisteredToolInfo {
	name: string;
	description: string;
	inputSchema?: JSONSchema;
}

declare global {
	interface ModelContext {
		registerTool(tool: {
			name: string;
			description: string;
			inputSchema?: JSONSchema;
			execute: (input: unknown) => Promise<unknown>;
		}): Promise<void>;
		unregisterTool(name: string): Promise<void>;
	}

	interface Document {
		modelContext?: ModelContext;
	}
}
