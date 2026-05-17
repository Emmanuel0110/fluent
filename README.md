# Fluent — Dev Setup

A language learning app with a React/TypeScript frontend and a Node.js/Express backend.

## Prerequisites

- **Node.js** (v18+)
- **npm**
- A **MongoDB Atlas** cluster (connection details go in the backend `.env`) — don't forget to whitelist your IP in Atlas under **Network Access** before connecting
- A **Redis** instance (optional — the backend skips it when started with `--no-redis`)

## 1. Install dependencies

Run this once from the repo root. It installs root-level tooling (concurrently) and the dependencies for both workspaces.

```bash
npm install
cd fluent-backend && npm install
cd ../fluent-frontend && npm install
```

## 2. Configure environment variables

### Backend — `fluent-backend/.env`

Create the file (or edit the existing one) with the following keys:

```env
MONGO_USERNAME=<your Atlas username>
MONGO_PASSWORD=<your Atlas password>
MONGO_CLUSTER=<your Atlas cluster host, e.g. cluster0.xorwi>
MONGO_DBNAME=fluent-app

JWT_SECRET=<any long random string>
NODE_ENV=development

# Optional — AI word generation
OPENAI_API_KEY=<your OpenAI key>

# Optional — Social OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/fluent/login?provider=google

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost:3000/fluent/login?provider=linkedin

FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
FACEBOOK_REDIRECT_URI=http://localhost:3000/fluent/login?provider=facebook

FRONTEND_URL=http://localhost:3000
```

### Frontend — `fluent-frontend/.env.development`

```env
VITE_API_URL=http://localhost:4001/api/
```

This file is already committed with the correct default value for local development.

## 3. Start the dev servers

From the **repo root**, run both servers concurrently:

```bash
npm run dev
```

This runs:
- **Backend** on `http://localhost:4001` (nodemon, hot-reload, Redis skipped via `--no-redis`)
- **Frontend** on `http://localhost:3000/fluent` (Vite)

To run them separately:

```bash
npm run dev:backend   # backend only
npm run dev:frontend  # frontend only
```

## 4. Running tests

```bash
# Backend (Jest + supertest)
cd fluent-backend
npm test
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report

# Frontend (Vitest)
cd fluent-frontend
npm test
npm run test:watch
```
