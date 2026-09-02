import { useCallback, useState } from 'react';
import { useCityStore } from './store/cityStore';
import { useWebMCP } from './hooks/useWebMCP';
import City from './components/City';
import AgentPane from './components/AgentPane';
import ApprovalModal from './components/ApprovalModal';
import DistrictNav from './components/DistrictNav';
import VenuesDistrict from './districts/VenuesDistrict';
import CateringDistrict from './districts/CateringDistrict';
import CalendarDistrict from './districts/CalendarDistrict';
import BudgetDistrict from './districts/BudgetDistrict';
import OverviewDistrict from './districts/OverviewDistrict';
import Landing from './components/Landing';
import type { District } from './types';
import { activeDistrict } from './lib/agentView';
import { useHold } from './hooks/useHold';
import { PLACE_COLOR, type Place } from './lib/cityEvents';

export default function App() {
	const [entered, setEntered] = useState(false);
	const [district, setDistrict] = useState<District>('city');
	const state = useCityStore();
	useWebMCP();

	// The district the agent is touching right now — drives the seam, the nav
	// pulse, and follow-agent mode. Same state, two renderings.
	const live = useHold(activeDistrict(state.actions), 700);

	const follow = useCallback((d: Place) => {
		if (d === 'venues' || d === 'catering' || d === 'calendar' || d === 'budget') setDistrict(d);
	}, []);

	if (!entered) return <Landing onEnter={() => setEntered(true)} />;

	return (
		<div className="min-h-screen city-grid text-sm">
			<header className="flex h-14 items-center justify-between border-b border-city-border bg-city-panel/70 px-5 backdrop-blur">
				<div className="flex items-center gap-3">
					<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-city-accent font-display text-sm text-white">
						A
					</div>
					<h1 className="text-sm font-semibold tracking-tight text-city-ink">Agent City</h1>
				</div>
				<div className="flex items-center gap-4">
					{state.pendingApprovals.length > 0 ? (
						<span className="tag bg-city-warning/15 text-city-warning">
							{state.pendingApprovals.length} pending approval
						</span>
					) : (
						<span className="tag bg-city-success/10 text-city-success">Live</span>
					)}
					<span className="tag bg-city-accent/10 text-city-accent">WebMCP</span>
				</div>
			</header>

			<main className="grid h-[calc(100vh-56px)] grid-cols-[200px_1fr_400px]">
				<DistrictNav active={district} onSelect={setDistrict} live={live} />

				<section className="relative min-w-0 overflow-hidden">
					{/* The city is always the stage; districts open on top of it. */}
					<div
						className={`absolute inset-0 transition-all duration-500 ${
							district === 'city' ? '' : 'opacity-0'
						}`}
					>
						<City />
					</div>

					{district !== 'city' && (
						<div className="absolute inset-0 overflow-auto bg-city-bg p-6">
							{district === 'overview' && <OverviewDistrict />}
							{district === 'venues' && <VenuesDistrict />}
							{district === 'catering' && <CateringDistrict />}
							{district === 'calendar' && <CalendarDistrict />}
							{district === 'budget' && <BudgetDistrict />}
						</div>
					)}
				</section>

				<aside className="relative min-w-0 border-l border-city-border bg-city-panel/30">
					{/* the seam — pulses in the district's colour while a call crosses it */}
					<span
						className="absolute -left-px top-0 h-full w-0.5 transition-all duration-300"
						style={{
							background: live ? PLACE_COLOR[live] : 'transparent',
							boxShadow: live ? `0 0 12px ${PLACE_COLOR[live]}` : 'none',
						}}
					/>
					<AgentPane onFollow={follow} />
				</aside>
			</main>

			<ApprovalModal />
		</div>
	);
}
