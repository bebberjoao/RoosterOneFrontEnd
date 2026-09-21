import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { assetService } from "@/services/mock-api/asset.service";
import type { Asset, AssetCategory, AssetMovement, AssetSector, MovementType } from "./mock-data";

type NewMovement = {
  assetId: string;
  type: MovementType;
  to: string;
  notes?: string;
  user: string;
  dueDate?: string;
};

type Ctx = {
  assets: Asset[];
  categories: AssetCategory[];
  sectors: AssetSector[];
  movements: AssetMovement[];
  loading: boolean;
  createAsset: (a: Omit<Asset, "id" | "createdAt">) => Promise<Asset>;
  updateAsset: (id: string, patch: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  createCategory: (c: Omit<AssetCategory, "id">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<AssetCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createSector: (s: Omit<AssetSector, "id">) => Promise<void>;
  updateSector: (id: string, patch: Partial<AssetSector>) => Promise<void>;
  deleteSector: (id: string) => Promise<void>;
  registerMovement: (m: NewMovement) => Promise<void>;
  returnLoan: (movementId: string, user: string) => Promise<void>;
  categoryName: (id: string) => string;
  categoryTone: (id: string) => string;
  movementsOf: (assetId: string) => AssetMovement[];
};

const AssetsCtx = createContext<Ctx | null>(null);

export function AssetsProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [sectors, setSectors] = useState<AssetSector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([assetService.getAll(), assetService.getCategories(), assetService.getMovements(), assetService.getSectors()]).then(
      ([a, c, m, s]) => {
        if (!alive) return;
        setAssets(a);
        setCategories(c);
        setMovements(m);
        setSectors(s);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const createAsset = useCallback(async (a: Omit<Asset, "id" | "createdAt">) => {
    const created = await assetService.create(a);
    setAssets((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateAsset = useCallback(async (id: string, patch: Partial<Asset>) => {
    const updated = await assetService.update(id, patch);
    if (updated) setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    await assetService.remove(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setMovements((prev) => prev.filter((m) => m.assetId !== id));
  }, []);

  const createCategory = useCallback(async (c: Omit<AssetCategory, "id">) => {
    const created = await assetService.createCategory(c);
    setCategories((prev) => [...prev, created]);
  }, []);

  const updateCategory = useCallback(async (id: string, patch: Partial<AssetCategory>) => {
    const updated = await assetService.updateCategory(id, patch);
    if (updated) setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await assetService.removeCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const createSector = useCallback(async (s: Omit<AssetSector, "id">) => {
    const created = await assetService.createSector(s);
    setSectors((prev) => [...prev, created]);
  }, []);

  const updateSector = useCallback(async (id: string, patch: Partial<AssetSector>) => {
    const prevSector = await assetService.updateSector(id, patch);
    if (!prevSector) return;
    setSectors((prev) => prev.map((s) => (s.id === id ? prevSector : s)));
  }, []);

  const deleteSector = useCallback(async (id: string) => {
    await assetService.removeSector(id);
    setSectors((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const registerMovement = useCallback(
    async (m: NewMovement) => {
      const asset = assets.find((a) => a.id === m.assetId);
      const from =
        m.type === "setor" ? asset?.sector : m.type === "emprestimo" || m.type === "devolucao" ? asset?.owner : asset?.location;

      const created = await assetService.registerMovement({
        assetId: m.assetId,
        type: m.type,
        from,
        to: m.to,
        user: m.user,
        date: new Date().toISOString(),
        notes: m.notes,
        dueDate: m.dueDate,
      });
      setMovements((prev) => [created, ...prev]);

      const patch: Partial<Asset> =
        m.type === "sala"
          ? { location: m.to }
          : m.type === "setor"
            ? { sector: m.to }
            : m.type === "emprestimo"
              ? { status: "emprestado", owner: m.to }
              : m.type === "devolucao"
                ? { status: "disponivel", location: m.to }
                : m.type === "manutencao"
                  ? { status: "manutencao", location: m.to }
                  : {};
      await updateAsset(m.assetId, patch);
    },
    [assets, updateAsset],
  );

  const returnLoan = useCallback(async (movementId: string, user: string) => {
    const updatedAsset = await assetService.returnLoan(movementId, user);
    setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
    setMovements((prev) => prev.map((m) => (m.id === movementId ? { ...m, returnedAt: new Date().toISOString() } : m)));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      assets,
      categories,
      sectors,
      movements,
      loading,
      createAsset,
      updateAsset,
      deleteAsset,
      createCategory,
      updateCategory,
      deleteCategory,
      createSector,
      updateSector,
      deleteSector,
      registerMovement,
      returnLoan,
      categoryName: (id) => categories.find((c) => c.id === id)?.name ?? "—",
      categoryTone: (id) => categories.find((c) => c.id === id)?.tone ?? "oklch(0.65 0.05 260)",
      movementsOf: (assetId) => movements.filter((m) => m.assetId === assetId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    }),
    [assets, categories, sectors, movements, loading, createSector, updateSector, deleteSector, createAsset, updateAsset, deleteAsset, createCategory, updateCategory, deleteCategory, registerMovement, returnLoan],
  );

  return <AssetsCtx.Provider value={value}>{children}</AssetsCtx.Provider>;
}

export function useAssets() {
  const ctx = useContext(AssetsCtx);
  if (!ctx) throw new Error("useAssets must be used inside AssetsProvider");
  return ctx;
}
