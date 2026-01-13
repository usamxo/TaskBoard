# TaskBoard Web App

A small, complete web app you can push directly to GitHub.

- Backend: Node.js + Express
- Storage: file-based JSON database (LowDB)
- Frontend: vanilla HTML/CSS/JS (served by the same Express server)
- Features: create/update/move/delete tasks across **To Do / In Progress / Done**

## Quick start (local)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

3. Open:
   - http://localhost:3000

## Environment variables (optional)

Copy `.env.example` to `.env` and change if needed:

- `PORT` – server port (default: 3000)
- `ORIGIN` – allowed origin for CORS (default: http://localhost:3000)

## Project structure

```
.
├─ public/            # Frontend files
├─ data/              # JSON database file is created here at runtime
├─ server.js          # Express server + API
└─ db.js              # LowDB helper
```

## API

- `GET /api/tasks`
- `POST /api/tasks` `{ "title": "...", "description": "..." }`
- `PATCH /api/tasks/:id` `{ "title": "...", "description": "...", "status": "todo|in_progress|done" }`
- `DELETE /api/tasks/:id`

## Deploy

This app works on most Node hosting providers (Render, Railway, Fly.io, etc.):

- Build step: `npm install`
- Start command: `npm start`

## License

MIT
