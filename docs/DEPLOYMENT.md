# Deployment

## Prerequisites

- A DigitalOcean Droplet with Docker Engine and the Docker Compose plugin installed
- DNS `A` record for `spotify.komill.dev` pointing to the droplet
- Ports `80`, `443`, and `22` open on the droplet firewall
- Spotify dashboard redirect URI:
  - `https://spotify.komill.dev/api/spotify/callback`

## Required env files

### Root `.env.docker`

```env
DOMAIN=spotify.komill.dev
ACME_EMAIL=your-real-email@example.com
```

### Backend `backend/.env.production`

Set real values for:

```env
PORT=8888
NODE_ENV=production
MONGO_URL=your-real-mongodb-connection-string
JWT_SECRET=your-strong-jwt-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REDIRECT_URI=https://spotify.komill.dev/api/spotify/callback
FRONTEND_URL=https://spotify.komill.dev
```

### Frontend `frontend/.env.production`

```env
REACT_APP_API_BASE_URL=/api
```

## Deploy

```bash
cd /path/to/Spotify
docker compose build
docker compose --env-file .env.docker up -d
```

## Verify

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 web
docker compose logs --tail=100 caddy
```

Expected checks:

- Backend logs show the production env file path
- Backend logs show `MongoDB Connected: .../SpotifyPlayer`
- `https://spotify.komill.dev` loads the frontend
- `https://spotify.komill.dev/health` returns backend health through the proxy chain

## Update after code changes

```bash
git pull
docker compose build
docker compose --env-file .env.docker up -d
```

## Useful commands

Restart one service:

```bash
docker compose restart backend
docker compose restart web
docker compose restart caddy
```

Stop the stack:

```bash
docker compose down
```

Follow live logs:

```bash
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f caddy
```
