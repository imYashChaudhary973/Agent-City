import { useCityStore } from '../store/cityStore';
import { useCityTrips, LEG_MS, type Trip } from '../hooks/useCityTrips';
import { PLACES, ROADS, type Place } from '../lib/cityEvents';
import EventSite from './EventSite';

const DISTRICTS: { place: Place; label: string; color: string; glow: string }[] = [
	{ place: 'venues', label: 'VENUE', color: 'var(--color-city-venue)', glow: 'rgba(6,182,212,0.45)' },
	{ place: 'catering', label: 'CATERING', color: 'var(--color-city-catering)', glow: 'rgba(34,197,94,0.45)' },
	{ place: 'calendar', label: 'CALENDAR', color: 'var(--color-city-calendar)', glow: 'rgba(245,158,11,0.45)' },
	{ place: 'budget', label: 'BUDGET', color: 'var(--color-city-budget)', glow: 'rgba(236,72,153,0.45)' },
];

function at(place: Place) {
	const { x, y } = PLACES[place];
	return { left: `${x}%`, top: `${y}%` };
}

/** A district building. Lights up while a courier is standing in it. */
function Building({
	label,
	color,
	glow,
	busy,
	place,
}: {
	label: string;
	color: string;
	glow: string;
	busy: boolean;
	place: Place;
}) {
	return (
		<div
			className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
			style={at(place)}
		>
			<div
				className="relative flex h-16 w-28 flex-col justify-end border-2 transition-all duration-300"
				style={{
					borderColor: color,
					background: busy ? `color-mix(in srgb, ${color} 22%, #0a0a0f)` : '#0a0a0f',
					boxShadow: busy ? `0 0 26px ${glow}` : 'none',
				}}
			>
				<div className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
				<div className="grid grid-cols-4 gap-1 p-2.5 pb-3">
					{Array.from({ length: 8 }).map((_, i) => (
						<span
							key={i}
							className="h-1.5 w-full transition-opacity duration-300"
							style={{ background: color, opacity: busy ? 0.9 : 0.22 }}
						/>
					))}
				</div>
			</div>
			<div
				className="mt-2 font-mono text-[10px] font-bold tracking-widest transition-colors"
				style={{ color: busy ? color : 'var(--color-city-muted)' }}
			>
				{label}
			</div>
		</div>
	);
}

/** City Hall. The barrier is the human-in-the-loop, made physical. */
function CityHall({ blocked }: { blocked: boolean }) {
	return (
		<div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={at('hall')}>
			<div
				className="relative flex h-10 w-28 items-center justify-center border-2 transition-all duration-300"
				style={{
					borderColor: blocked ? 'var(--color-city-warning)' : 'var(--color-city-border)',
					background: blocked ? 'color-mix(in srgb, var(--color-city-warning) 16%, #0a0a0f)' : '#0a0a0f',
					boxShadow: blocked ? '0 0 30px rgba(245,158,11,0.4)' : 'none',
				}}
			>
				<span
					className="font-mono text-[8px] font-bold tracking-widest"
					style={{ color: blocked ? 'var(--color-city-warning)' : 'var(--color-city-muted)' }}
				>
					CITY HALL
				</span>
				{/* the barrier */}
				<span
					className="absolute -bottom-1 left-1/2 h-0.5 w-16 origin-left transition-transform duration-500"
					style={{
						background: blocked ? 'var(--color-city-warning)' : 'var(--color-city-success)',
						transform: `translateX(-50%) rotate(${blocked ? 0 : -62}deg)`,
					}}
				/>
			</div>
			<div className="mt-2 font-mono text-[8px] tracking-widest" style={{ color: blocked ? 'var(--color-city-warning)' : 'var(--color-city-muted)' }}>
				{blocked ? 'BARRIER DOWN' : 'CLEAR'}
			</div>
		</div>
	);
}

/** Where an operator dispatches from. Same roads, different vehicle. */
function Origin({ place, label, color, active }: { place: Place; label: string; color: string; active: boolean }) {
	return (
		<div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={at(place)}>
			<div
				className="h-6 w-6 border-2 transition-all duration-300"
				style={{
					borderColor: color,
					background: active ? color : 'transparent',
					boxShadow: active ? `0 0 20px ${color}` : 'none',
				}}
			/>
			<span className="whitespace-nowrap font-mono text-[8px] font-bold tracking-widest" style={{ color }}>
				{label}
			</span>
		</div>
	);
}

function Courier({ trip }: { trip: Trip }) {
	const place = trip.route[trip.idx];
	const { x, y } = PLACES[place];
	const heavy = trip.kind !== 'read';
	const color =
		trip.status === 'error'
			? 'var(--color-city-danger)'
			: trip.gated
				? 'var(--color-city-warning)'
				: trip.origin === 'agent'
					? 'var(--color-city-accent)'
					: 'var(--color-city-venue)';

	// Carrying a result home.
	const returning = trip.idx > trip.route.indexOf(trip.district, 1);

	return (
		<div
			className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
			style={{
				left: `${x}%`,
				top: `${y}%`,
				transition: `left ${LEG_MS}ms linear, top ${LEG_MS}ms linear`,
			}}
		>
			<div className="relative flex flex-col items-center">
				{trip.gated && (
					<span
						className="absolute h-9 w-9 animate-ping rounded-full"
						style={{ background: color, opacity: 0.25 }}
					/>
				)}
				<div
					className="relative"
					style={{
						width: heavy ? 14 : 9,
						height: heavy ? 14 : 9,
						background: color,
						boxShadow: `0 0 18px ${color}, 0 0 4px #000`,
						outline: heavy ? `2px solid ${color}` : 'none',
						outlineOffset: 3,
					}}
				>
					{returning && (
						<span
							className="absolute -right-2.5 -top-2 h-2 w-2.5 border border-black/50"
							style={{ background: 'var(--color-city-success)' }}
						/>
					)}
				</div>
				<span
					className="absolute whitespace-nowrap px-1 font-mono text-[9px] font-bold tracking-wider"
					style={{ color, top: heavy ? 22 : 16, background: 'rgba(10,10,15,0.85)' }}
				>
					{trip.gated ? '⏸ AWAITING APPROVAL' : trip.tool}
				</span>
			</div>
		</div>
	);
}

export default function City() {
	const { event, pendingApprovals, actions } = useCityStore();
	const trips = useCityTrips();

	const blocked = pendingApprovals.length > 0;
	const busy = new Set(trips.map((t) => t.route[t.idx]));
	const last = actions.find((a) => a.tool !== 'toolchange');

	return (
		<div className="relative h-full w-full overflow-hidden">
			{/* roads */}
			<svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				{ROADS.map(([a, b]) => (
					<g key={`${a}-${b}`}>
						<line
							x1={PLACES[a].x} y1={PLACES[a].y} x2={PLACES[b].x} y2={PLACES[b].y}
							stroke="rgba(99,102,241,0.10)" strokeWidth="10" vectorEffect="non-scaling-stroke"
						/>
						<line
							x1={PLACES[a].x} y1={PLACES[a].y} x2={PLACES[b].x} y2={PLACES[b].y}
							stroke="rgba(129,140,248,0.5)" strokeWidth="1.5" strokeDasharray="6 6"
							vectorEffect="non-scaling-stroke"
						/>
					</g>
				))}
			</svg>

			{DISTRICTS.map((d) => (
				<Building key={d.place} {...d} busy={busy.has(d.place)} />
			))}

			<div className="absolute -translate-x-1/2 -translate-y-1/2" style={at('plan')}>
				<EventSite event={event} />
			</div>

			<CityHall blocked={blocked} />

			<Origin
				place="agent"
				label="AGENT"
				color="var(--color-city-accent)"
				active={trips.some((t) => t.origin === 'agent')}
			/>
			<Origin
				place="human"
				label="YOU"
				color="var(--color-city-venue)"
				active={trips.some((t) => t.origin === 'human')}
			/>

			{trips.map((t) => (
				<Courier key={t.id} trip={t} />
			))}

			{/* status strip */}
			<div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-2 font-mono text-[10px]">
				<span className="tracking-widest text-city-muted">AGENT CITY · LIVE</span>
				{last && (
					<span className={last.status === 'error' ? 'text-city-danger' : 'text-city-success'}>
						{last.origin === 'agent' ? 'AGENT' : 'YOU'} → {last.tool}
						{last.status !== 'pending' && ` · ${last.duration}ms`}
					</span>
				)}
			</div>
		</div>
	);
}
