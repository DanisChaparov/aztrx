export interface ImpactLedgerListItem {
  dependencyId: string;
  dependencyName: string;
  totalSimulatedAmount: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ImpactLedgerList({ items }: { items: ImpactLedgerListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="font-inter text-sm text-neutral-500">
        No impact yet — link a GitHub repo on a project and complete a verified session to start funding the
        dependencies it relies on.
      </p>
    );
  }

  const total = items.reduce((sum, item) => sum + item.totalSimulatedAmount, 0);

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="font-inter text-sm text-neutral-400">
        Simulated impact so far: <span className="font-manrope font-semibold text-[#5ed29c]">{formatCents(total)}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.dependencyId} className="flex items-center justify-between font-inter text-sm">
            <span className="text-neutral-300">{item.dependencyName}</span>
            <span className="tabular-nums text-neutral-500">{formatCents(item.totalSimulatedAmount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
