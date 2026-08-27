import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { apiFetch } from './lib/api';
import { getCityState, resetCity, updateEvent } from './store/cityStore';

function DemoAPI() {
	useEffect(() => {
		const w = window as unknown as Record<string, unknown>;
		w['__agentCity'] = {
			reset: () => resetCity(),
			reserveVenue: async (venueId: string) => {
				const plan = getCityState().event;
				const res = await apiFetch('/venues/reserve', {
					method: 'POST',
					body: JSON.stringify({ venueId, attendees: plan.attendees, date: plan.date }),
				});
				updateEvent(res.event);
			},
			orderCatering: async (packageId: string) => {
				const plan = getCityState().event;
				const res = await apiFetch('/catering/order', {
					method: 'POST',
					body: JSON.stringify({ packageId, people: plan.attendees }),
				});
				updateEvent(res.event);
			},
			scheduleSlot: async (slotId: string) => {
				const res = await apiFetch('/calendar/schedule', {
					method: 'POST',
					body: JSON.stringify({ slotId }),
				});
				updateEvent(res.event);
			},
			setAttendees: (n: number) => updateEvent({ attendees: n }),
			getState: () => getCityState(),
		};
		console.log('Agent City demo API exposed at window.__agentCity');
	}, []);
	return null;
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DemoAPI />
		<App />
	</StrictMode>,
);
