# Film Kimi

## Secure API key (TMDb)

1. Create `.env` from `.env.example`:
   - `cp .env.example .env` (Windows: copy .env.example .env)
2. Set your API key in `.env`:
   - `API_KEY=your-real-api-key`
3. Make sure `.gitignore` contains `.env` (already configured) so your secret is not committed.

## In this project

- `script.js` currently uses `app.API_KEY` placeholder. For proper workflow with a build tool use environment variable injection.

## Git

- `git init`
- `git add .`
- `git commit -m "Add secure API key handling and git ignore"`
