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
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-6">
			<div className="w-full max-w-2xl rounded-xl border border-city-border bg-city-panel p-6 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<span className="font-mono text-xs text-city-warning">AGENT AWAITING APPROVAL</span>
					<span className="font-mono text-xs text-city-muted">{pending.tool}</span>
				</div>
				<p className="mb-6 text-base">{pending.description}</p>
				<pre className="mb-6 max-h-40 overflow-auto rounded bg-black/40 p-3 font-mono text-xs text-city-muted">{JSON.stringify(pending.input, null, 2)}</pre>
				<div className="flex justify-end gap-3">
					<button
						onClick={handleReject}
						className="rounded-md border border-city-border px-5 py-2 text-sm font-medium text-white hover:bg-white/5"
					>
						Reject
					</button>
					<button
						onClick={handleApprove}
						className="rounded-md bg-city-accent px-5 py-2 text-sm font-medium text-white hover:bg-city-glow"
					>
						Approve
					</button>
				</div>
			</div>
		</div>
	);
}
