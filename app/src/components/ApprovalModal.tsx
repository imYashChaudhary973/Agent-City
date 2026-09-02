import { useCityStore, removePendingApproval, setApprovalOutcome } from '../store/cityStore';

export default function ApprovalModal() {
	const state = useCityStore();
	const pending = state.pendingApprovals[0];
	if (!pending) return null;

	function handleApprove() {
		setApprovalOutcome(pending.id, 'approved');
		removePendingApproval(pending.id);
	}

	function handleReject() {
		setApprovalOutcome(pending.id, 'rejected');
		removePendingApproval(pending.id);
	}

	return (
		<div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-6 pt-10">
			<div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-city-warning/50 bg-city-panel/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur">
				<div className="mb-5 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 animate-pulse rounded-full bg-city-warning" />
						<span className="font-mono text-[10px] tracking-wider text-city-warning">AGENT AWAITING APPROVAL</span>
					</div>
					<span className="font-mono text-xs text-city-muted">{pending.tool}</span>
				</div>

				<p className="mb-4 text-base text-city-ink">{pending.description}</p>
				<p className="mb-4 font-mono text-[10px] tracking-wider text-city-muted">COURIER HELD AT CITY HALL — WATCH THE BARRIER BELOW</p>

				<div className="mb-5 rounded-xl border border-city-border bg-black/40 p-4">
					<div className="mb-2 font-mono text-[10px] tracking-wider text-city-muted">TOOL INPUT</div>
					<pre className="max-h-40 overflow-auto font-mono text-xs text-city-muted">{JSON.stringify(pending.input, null, 2)}</pre>
				</div>

				<div className="flex justify-end gap-3">
					<button onClick={handleReject} className="btn-secondary px-5">
						Reject
					</button>
					<button onClick={handleApprove} className="btn-primary px-5">
						Approve
					</button>
				</div>
			</div>
		</div>
	);
}
