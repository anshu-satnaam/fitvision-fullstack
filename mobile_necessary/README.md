# FitVision Mobile

A mobile-responsive frontend for the FitVision fitness platform.  
This connects to the existing FitVision backend deployed on Render.

## Getting Started

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Serve the `dist/` folder as a static site (e.g. on Render, Vercel, or Netlify).

## Environment

The app reads these env variables at build time:

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Full URL of the backend API (e.g. `https://fitvision-fullstack.onrender.com/api`) |
| `VITE_WS_BASE` | WebSocket base URL (e.g. `wss://fitvision-fullstack.onrender.com`) |

For local development, these are left blank in `.env` and Vite proxies `/api` to the Render backend automatically.

## Deploy on Render (Static Site)

- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
