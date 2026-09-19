# deployment/

This folder contains all deployment and containerisation configuration for the S.A.G.A.R. / NetraSonar platform.

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Docker Compose config — spins up backend (FastAPI) and frontend (Vite) containers together |
| `vercel.json` | Vercel deployment config — used for hosting the frontend on Vercel |

## Docker Usage

From the **project root**, run:

```bash
docker compose -f deployment/docker-compose.yml up
```

## Vercel

The `vercel.json` tells Vercel to:
- Build using `npm run build`
- Serve from the `dist/` output directory
- Rewrite all routes to `index.html` (SPA support)
