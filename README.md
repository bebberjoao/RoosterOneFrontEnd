# Rooster One — Frontend

Frontend do Rooster One, sistema de gestão institucional para instituições de ensino, desenvolvido com TanStack Start,
React e Tailwind CSS, com renderização no servidor.

Documentação: [docs/README.md](docs/README.md) (frontend) e documentação central em
`RoosterOneBackend-main/docs/README.md`.

## Início rápido

```bash
npm install
cp .env.example .env    # VITE_API_URL, padrão http://localhost:3000
npm run dev
npm test                # testes (Vitest)
```

Requer o backend em execução. Para implantação como servidor Node.js, o build deve ser gerado com
`NITRO_PRESET=node-server`; ver `docs/operations/04-deploy.md` no repositório do backend.
