# defensa-de-obligado

Tower defense web game set at the Vuelta de Obligado (1845). Phaser 3 + Vite.

```sh
npm install
npm run dev
```

- [Architecture](docs/ARCHITECTURE.md)
- [Tutorial: creating maps, enemies, towers and items](docs/TUTORIAL.md)

## Collaborative editing (Supabase + Render)

For now, maps and elements are edited on the deployed site and saved to Supabase. Whatever is saved there overrides the repo files.

1. Run `supabase/migrations/` on the Supabase project, then create the editors' user in Authentication > Users.
2. Create the Render service from `render.yaml` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Editors: `/editor.html` and `/elements.html` (they ask you to log in).

To use Supabase locally, copy `.env.example` to `.env`. Leave it empty to save to the repo files as before.
