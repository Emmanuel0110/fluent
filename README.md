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

Create the file with the following keys:

```env
MONGO_USERNAME=<your Atlas username>
MONGO_PASSWORD=<your Atlas password>
MONGO_CLUSTER=<your Atlas cluster host>
MONGO_DBNAME=<your Atlas DB name>
EMAIL_USER=<your email user>
EMAIL_PASS=<your email pass>
JWT_SECRET=<any long random string>
NODE_ENV=development

# Optional — Social OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/fluent/login?provider=google

FRONTEND_URL=http://localhost:3000
```

### Frontend — `fluent-frontend/.env.development`

Create the file with the following keys:

```env
VITE_API_URL=http://localhost:4001/api/
```

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
