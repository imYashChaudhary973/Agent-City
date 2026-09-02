import { useEffect, useState } from 'react';

/**
 * Holds a value for `ms` after it clears. Local tool calls resolve in ~30ms,
 * which is too fast to perceive — this keeps the lit state on screen long
 * enough to read without lying about the reported duration.
 */
export function useHold<T>(value: T | null, ms = 700): T | null {
	const [held, setHeld] = useState<T | null>(value);

	useEffect(() => {
		if (value !== null) {
			setHeld(value);
			return;
		}
		const id = setTimeout(() => setHeld(null), ms);
		return () => clearTimeout(id);
	}, [value, ms]);

	return held;
}
