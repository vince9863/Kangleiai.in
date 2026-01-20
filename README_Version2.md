```markdown
# Kangleiai API App (Postgres + TypeScript + Swagger UI + Docker)

This repository is an enhanced version of the Kangleiai demo API:
- Converted to TypeScript
- Persistent store using Postgres
- Swagger UI serving the OpenAPI spec at `/docs`
- Dockerfile + docker-compose (includes Postgres service)
- Same endpoints as the demo: Auto Answers, webhooks, chat, models, embeddings, documents upload, tools, fine-tunes, speech stubs

Quickstart (recommended)
1. Copy `.env.example` to `.env` and edit if needed.
2. Run:
   docker-compose up --build

The app will be available at http://localhost:3000
- Health: GET /
- Swagger UI (OpenAPI): http://localhost:3000/docs
- API token (dev): use Authorization: Bearer testtoken123 by default (from .env.example)

Local development (without Docker)
1. Install dependencies:
   npm install
2. Copy `.env.example` -> `.env`
3. Start a Postgres instance (or use Docker Compose's `db`), then:
   npm run dev

Database
- The app will automatically create tables on startup if they don't exist.
- For production: run proper migrations (this demo runs CREATE TABLE IF NOT EXISTS).

Notes
- File uploads are stored in `uploads/` (host path mapped in docker-compose).
- Webhook delivery is best-effort and not retried in this demo.
- Replace demo model behavior with real model integration for production.
- Secrets & production config: store DB credentials & tokens in a secure secret store.

If you'd like, I can:
- Add proper migration tooling (e.g., Knex, TypeORM, or Flyway) and seed scripts.
- Harden webhook delivery with retries & signing verification.
- Provide a Helm chart for Kubernetes.
```