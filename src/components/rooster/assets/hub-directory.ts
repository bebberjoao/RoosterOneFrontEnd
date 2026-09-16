// Diretório de setores e usuários vindos do Rooster Hub — via API real
// (setoresService/usuariosService de @/services/hub), não mais seed
// estático. Usado pelo Rooster Assets para vincular um equipamento a um
// setor e ao usuário responsável.
import { useEffect, useState } from "react";
import { setoresService, usuariosService, usuariosSetoresService } from "@/services/hub";

export type HubSector = { id: string; name: string; description?: string | null };
export type HubUser = { id: string; name: string; email: string; sectorId?: string };

let sectors: HubSector[] = [];
let users: HubUser[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  if (loading) return loading;
  loading = (async () => {
    const [setores, usuarios, vinculos] = await Promise.all([
      setoresService.list(),
      usuariosService.list(),
      usuariosSetoresService.list(),
    ]);
    sectors = setores.filter((s) => s.ativo !== false).map((s) => ({ id: s.id, name: s.nome, description: s.descricao }));
    users = usuarios.filter((u) => u.ativo !== false).map((u) => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      sectorId: vinculos.find((v) => v.usuarioId === u.id)?.setorId,
    }));
    loaded = true;
    emit();
  })().catch(() => {
    loaded = true; // não trava a tela em erro; fica com listas vazias
    emit();
  });
  return loading;
}

function usersOfSector(sectorName?: string): HubUser[] {
  if (!sectorName) return users;
  const sector = sectors.find((s) => s.name === sectorName);
  if (!sector) return users;
  const inSector = users.filter((u) => u.sectorId === sector.id);
  return inSector.length ? inSector : users;
}

/** Carrega (uma vez) e assina o diretório de setores/usuários do Hub. */
export function useHubDirectory() {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!loaded) void load();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { sectors, users, usersOfSector };
}
