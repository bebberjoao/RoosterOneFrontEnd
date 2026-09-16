// Desk, Rooms e Assets nasceram com tipos em inglês/camelCase (mock), mas o
// backend NestJS usa DTOs em português (ver docs/integracao-backend.md).
// `mapResource` adapta um HubResource<TBack> (o que o backend fala) para a
// forma HubResource<TFront> que as telas já conhecem, traduzindo os campos
// nas duas pontas — sem precisar reescrever a UI.
import { createResource, type HubResource } from "./index";

export function mapResource<TFront extends { id: string }, TBack extends { id: string }>(
  path: string,
  prefix: string,
  initialBack: TBack[],
  toFront: (back: TBack) => TFront,
  toBack: (front: Partial<TFront>) => Partial<TBack>,
): HubResource<TFront> {
  const backResource = createResource<TBack>(path, prefix, initialBack);
  return {
    path,
    list: async () => (await backResource.list()).map(toFront),
    get: async (id) => toFront(await backResource.get(id)),
    create: async (dto) => toFront(await backResource.create(toBack(dto) as Partial<TBack>)),
    update: async (id, dto) => toFront(await backResource.update(id, toBack(dto) as Partial<TBack>)),
    remove: (id) => backResource.remove(id),
  };
}
