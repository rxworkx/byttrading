import { useMemo, useState } from "react";

// Shared checkbox-selection state for bulk-action tables (Users, Ledger,
// Tradings). Selection is keyed by id and cleared whenever the underlying
// id list changes shape (e.g. a reload drops a deleted row) so stale ids
// never linger selected.
export function useRowSelection(ids: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const idSet = useMemo(() => new Set(ids), [ids]);

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === idSet.size ? new Set() : new Set(idSet)));
  }

  function clear() {
    setSelectedIds(new Set());
  }

  const isAllSelected = idSet.size > 0 && selectedIds.size === idSet.size;

  return { selectedIds, toggleOne, toggleAll, isAllSelected, clear };
}
