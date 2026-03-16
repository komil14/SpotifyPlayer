# Deployment

## Prerequisites

- A DigitalOcean Droplet with Docker Engine and the Docker Compose plugin installed
- DNS `A` record for `spotify.komill.dev` pointing to the droplet
- A server-wide reverse proxy already running on the droplet
  - Caddy or Nginx can be used
- Port `22` open on the droplet firewall
- Spotify dashboard redirect URI:
  - `https://spotify.komill.dev/api/spotify/callback`

## Required env files

### Root `.env.docker`

```env
WEB_PORT=8081
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
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

This stack will bind only to `127.0.0.1:8081` by default. It does not manage
TLS or public ports directly.

## Reverse proxy

Add this to the existing server-wide Caddy:

```caddy
spotify.komill.dev {
  encode gzip zstd
  reverse_proxy 127.0.0.1:8081
}
```

If you want a different private port, change `WEB_PORT` in `.env.docker`.

## Verify

```bash
docker compose ps
docker compose logs --tail=100 backend
docker compose logs --tail=100 web
```

Expected checks:

- Backend logs show the production env file path
- Backend logs show `MongoDB Connected: .../SpotifyPlayer`
- `curl http://127.0.0.1:8081` returns the frontend HTML locally on the droplet
- `https://spotify.komill.dev` loads the frontend through the shared reverse proxy

## Update after code changes

```bash
git pull
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

## Useful commands

Restart one service:

```bash
docker compose restart backend
docker compose restart web
```

Stop the stack:

```bash
docker compose down
```

Follow live logs:

```bash
docker compose logs -f backend
docker compose logs -f web
```
