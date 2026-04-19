# Smart Locker System - Clean Project

This is a clean, organized version of the Smart Locker System project.

## Project Structure

- `/frontend`: React + Vite frontend application.
- `/backend`: Express + Socket.io backend server.
- `/api`: Shared API specifications, Zod schemas, and React hooks.
- `/database`: Database schema (Drizzle) and initialization scripts.

## Prerequisites

- Node.js (v18+)
- pnpm (Recommended) or npm
- PostgreSQL database

## Installation

1. **Clone or Extract** the project.
2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (you can use the provided `.env` template) and set your database credentials:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/smart_tourist_db
   PORT=3001
   ```

## Database Setup

1. **Initialize Database**:
   ```bash
   pnpm run db:init
   ```
2. **Push Schema**:
   ```bash
   cd database/core
   pnpm run push
   ```
3. **Seed Data**:
   ```bash
   pnpm run db:seed
   ```

## Running the Application

To run both the frontend and backend in development mode:

```bash
pnpm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## Scripts

- `pnpm run dev`: Start both frontend and backend in parallel.
- `pnpm run build`: Build all workspace packages.
- `pnpm run typecheck`: Run type checks across the workspace.
- `pnpm run db:init`: Run the database initialization script.
- `pnpm run db:seed`: Seed the database with initial data.
- `pnpm run db:sync`: Sync review audits.
