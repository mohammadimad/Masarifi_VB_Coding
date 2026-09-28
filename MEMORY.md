# Project Memory (Masarifi)

This file acts as the Agent Written Memory for the **Masarifi** project. It is updated periodically to reflect the current project state, architectural decisions, and completed milestones to ensure seamless continuity across AI agent sessions.

## 1. Current State
- **Description:** A web application (dashboard) for personal expenses and budget management.
- **Tech Stack:**
  - UI: Vanilla HTML.
  - Styling: Tailwind CSS (via CDN).
  - Interactivity: Vanilla JavaScript (No frameworks like React or Vue).
  - Backend/Database: Supabase (PostgreSQL + RLS + Supabase Auth).
  - Server: Node.js HTTP server (`server.js`) with dynamic environment variable injection (`/env.js`).
  - Icons: Material Symbols.
- **Completed Pages (UI):**
  - `index.html` (Main Dashboard).
  - `budget.html` (Budget Management).
  - `reports.html` (Reports & Analytics).
  - `settings.html` (User Settings).
  - `login.html` (Authentication).
- **Scripts:**
  - `js/app.js` (Dashboard core logic).
  - `js/auth.js` (Authentication logic with Supabase Auth & fallback).
  - `js/db.js` (Database CRUD & RLS queries with Supabase & fallback).
  - `js/config.js` (Supabase client initialization reading from `window.__ENV__`).
  - `test_supabase_lifecycle.js` (Automated full lifecycle test suite).

## 2. Completed Tasks
- **QA-RULE-2 (Documentation):** Added comprehensive JSDoc comments to all JavaScript functions.
- **FE-RULE-1 (Responsiveness):** Refactored fixed pixel values (`px`) to fluid units (`em`, `%`) across all HTML files.
- **FE-RULE-2 (Accessibility):** Added `alt` tags and `aria-label` attributes.
- **BE-INTEGRATION-1 (Supabase Setup):**
  - Updated `server.js` with `dotenv` and dynamic `/env.js` script injection into all HTML responses.
  - Added Supabase variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_ACCESS_TOKEN`) to `.env`.
  - Built comprehensive lifecycle test script `test_supabase_lifecycle.js`.
  - Added Section 9 to `AGENT_WORKFLOW_PROTOCOL.md` defining the complete Supabase backend protocol.

## 3. Architectural Decisions
- **Dynamic Env Injection (`/env.js`):** Injected directly by `server.js` into `<head>` so client-side vanilla scripts access `.env` variables via `window.__ENV__` with zero build step.
- **Full Fallback Support:** If live Supabase credentials are missing or offline, `auth.js` and `db.js` gracefully fall back to local storage while keeping full API parity.
- **RLS Security:** Row Level Security enforced on `profiles` and `expenses` tables using `auth.uid()`.

## 4. Next Step to Finalize Cloud Link
- Supply either:
  1. `SUPABASE_ACCESS_TOKEN` (starts with `sbp_`) to create/link cloud project and run migrations via CLI/MCP automatically.
  2. OR `SUPABASE_URL` and `SUPABASE_ANON_KEY` of an already created Supabase project.

---
*Last Updated: 2026-09-28*
