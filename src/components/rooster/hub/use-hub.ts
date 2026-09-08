import { useCallback, useEffect, useState } from "react";
import type { HubResource } from "@/services/hub";

export function useResource<T extends { id: string }>(service: HubResource<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await service.list());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (dto: Partial<T>) => {
      const created = await service.create(dto);
      setRows((p) => [created, ...p]);
      return created;
    },
    [service],
  );

  const update = useCallback(
    async (id: string, dto: Partial<T>) => {
      const updated = await service.update(id, dto);
      setRows((p) => p.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      return updated;
    },
    [service],
  );

  const remove = useCallback(
    async (id: string) => {
      await service.remove(id);
      setRows((p) => p.filter((r) => r.id !== id));
    },
    [service],
  );

  return { rows, loading, error, reload, create, update, remove };
}