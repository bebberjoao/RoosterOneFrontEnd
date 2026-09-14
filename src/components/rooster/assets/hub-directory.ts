// Diretório de setores e usuários vindos do Rooster Hub.
// Usado pelo Rooster Assets para vincular cada equipamento a um setor
// cadastrado no Hub e ao usuário responsável pelo bem.
import { seedSetores, seedUsuarios, seedUsuariosSetores } from "@/services/hub/seed";

export type HubSector = { id: string; name: string; description?: string | null };
export type HubUser = { id: string; name: string; email: string; sectorId?: string };

export const HUB_SECTORS: HubSector[] = seedSetores
  .filter((s) => s.ativo !== false)
  .map((s) => ({ id: s.id, name: s.nome, description: s.descricao }));

export const HUB_USERS: HubUser[] = seedUsuarios
  .filter((u) => u.ativo !== false)
  .map((u) => ({
    id: u.id,
    name: u.nome,
    email: u.email,
    sectorId: seedUsuariosSetores.find((us) => us.usuarioId === u.id)?.setorId,
  }));

export const hubSectorNames = HUB_SECTORS.map((s) => s.name);

export const hubUsersOfSector = (sectorName?: string) => {
  if (!sectorName) return HUB_USERS;
  const sector = HUB_SECTORS.find((s) => s.name === sectorName);
  if (!sector) return HUB_USERS;
  const inSector = HUB_USERS.filter((u) => u.sectorId === sector.id);
  return inSector.length ? inSector : HUB_USERS;
};
