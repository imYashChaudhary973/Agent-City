import { useState } from 'react';
import { useCityStore } from './store/cityStore';
import { useWebMCP } from './hooks/useWebMCP';
import CityGraph from './components/CityGraph';
import Inspector from './components/Inspector';
import ApprovalModal from './components/ApprovalModal';
import DistrictNav from './components/DistrictNav';
import VenuesDistrict from './districts/VenuesDistrict';
import CateringDistrict from './districts/CateringDistrict';
import CalendarDistrict from './districts/CalendarDistrict';
import BudgetDistrict from './districts/BudgetDistrict';
import OverviewDistrict from './districts/OverviewDistrict';
import Landing from './components/Landing';
import type { District } from './types';

export default function App() {
	const [entered, setEntered] = useState(false);
	const [district, setDistrict] = useState<District>('overview');
	const state = useCityStore();
	useWebMCP();

	if (!entered) return <Landing onEnter={() => setEntered(true)} />;

	return (
		<div className="min-h-screen city-grid text-sm">
			<header className="flex items-center justify-between border-b border-city-border bg-city-panel/60 px-6 py-3 backdrop-blur">
				<div className="flex items-center gap-3">
					<div className="flex h-8 w-8 items-center justify-center rounded bg-city-accent font-mono font-bold text-white">
						A
					</div>
					<h1 className="text-base font-semibold tracking-tight">Agent City</h1>
				</div>
				<div className="flex items-center gap-4">
					<span className={`flex items-center gap-1.5 font-mono text-xs ${state.pendingApprovals.length > 0 ? 'text-city-warning' : 'text-city-muted'}`}>
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
						{state.pendingApprovals.length > 0 ? `${state.pendingApprovals.length} pending` : 'live'}
					</span>
					<div className="flex items-center gap-1.5 font-mono text-xs text-city-success">
						<span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
						WebMCP
					</div>
				</div>
			</header>

			<main className="grid h-[calc(100vh-56px)] grid-cols-[220px_1fr_360px]">
				<DistrictNav active={district} onSelect={setDistrict} />

				<section className="flex flex-col overflow-hidden">
					<div className="flex-1 overflow-auto p-6">
						{district === 'overview' && <OverviewDistrict />}
						{district === 'venues' && <VenuesDistrict />}
						{district === 'catering' && <CateringDistrict />}
						{district === 'calendar' && <CalendarDistrict />}
						{district === 'budget' && <BudgetDistrict />}
					</div>

					<div className="h-80 border-t border-city-border bg-city-panel/40 p-4">
						<CityGraph />
					</div>
				</section>

				<aside className="border-l border-city-border bg-city-panel/30">
					<Inspector />
				</aside>
			</main>

			<ApprovalModal />
		</div>
	);
}
