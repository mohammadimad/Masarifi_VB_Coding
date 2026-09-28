# AI Workflow Protocol (بروتوكول سير العمل الموحد)

This document outlines the standard operating procedures and workflow rules for AI agents working on this project (or any future project). These are generic, high-level structural rules independent of the specific tech stack.

## 1. Project Initialization & Bulk Asset Import (تهيئة المشروع واستيراد الملفات دفعة واحدة)
- **Unified Import Prompt:** For all future projects, begin by creating an `assets` folder and using a single, comprehensive prompt to pull everything from Stitch MCP at once:
  *"Grab all assets from the project link (projects/[PROJECT_ID]) using Stitch MCP and put them in the `assets` folder. Also download all related files including HTML, CSS, JS, and `design.md`."*
- **Single Source of Truth:** This guarantees that the entire UI architecture is imported identically as designed, preventing fragmentation and saving time compared to fetching screens one by one.

## 2. Branching Strategy (عزل العمل)
- **Never work on `main` directly.** 
- For every new screen, feature, or major modification, create a new isolated Git branch (e.g., `feature/screen-name` or `fix/issue-name`).
- This ensures the main branch remains stable and production-ready at all times.

## 3. UI & Responsiveness First (أولوية الواجهات والتجاوب)
- **Mandatory Responsiveness Step:** Immediately after importing or generating raw HTML/UI code (e.g., from Google Stitch, Figma, etc.), the first step is ALWAYS to fix responsiveness.
- Ensure layouts work flawlessly on mobile and desktop (handling `overflow-x-auto` for tables, `flex-wrap` for cramped elements, and `min-w-0` to prevent Flexbox text overflow).
- Do not write any logical code until the UI is perfectly responsive.

## 4. Frontend Interactivity Phase (التفاعل الأمامي)
- After the UI is structurally sound, implement pure frontend interactivity.
- This includes functional tabs, opening/closing modals, dropdowns, and printing functionality.
- This phase strictly involves manipulating the DOM without backend dependencies.

## 5. Postpone Backend Integration (تأجيل الباك إند)
- **Do not mix frontend scaffolding with backend logic.**
- Connecting to databases (e.g., Supabase, Firebase), implementing real Authentication, and applying Row Level Security (RLS) must be postponed until the UI is fully approved by the user.
- Use mock data or static placeholders during the frontend phase.

## 6. Explicit Approval & Merging (الموافقة والدمج)
- **Checkpoints:** Present the work to the user (via local server preview or screenshots) at key milestones.
- Do not merge the feature branch into `main` without explicit, unambiguous approval from the user.
- Once approved, merge cleanly and prepare for the next isolated task.


## 7. Written Agent Memory (ذاكرة الوكيل المكتوبة)
- **Context Preservation:** Since UI-based context memory might not always be available (e.g., in Antigravity), rely on localized project files for memory.
- **Memory File (\MEMORY.md\):** Always maintain a \MEMORY.md\ file in the root directory. This file must document the current project state, completed milestones, and architectural decisions.
- **Ruleset Integration:** Ensure the agent is explicitly instructed via the project's rules file (e.g., \RULESETS.md\ or \.cursorrules\) to ALWAYS read \MEMORY.md\ before starting tasks and to manually update it upon completing milestones. This guarantees continuous, transparent context across sessions.

## 8. Full-Stack Skill Integration (استغلال مهارة الفل ستاك)
- **Leverage the Full-Stack Developer Skill:** We have globally installed the `fullstack-developer` skill.
- **Workflow Sequence:** When retrieving UI designs via Stitch MCP and transitioning to prepare the backend and logic prompts, we MUST explicitly rely on this skill. This guarantees the production of a highly robust, modern Next.js/TypeScript/Node.js project with enterprise-grade architecture and best practices.

## 9. Supabase Backend Integration & Full Lifecycle Workflow (بروتوكول ربط الباك إند مع Supabase ودورة حياة البيانات)
- **1. Workspace-Specific Project Provisioning:**
  - Create or associate a dedicated Supabase project bearing the exact workspace/project name (e.g., `Masarifi_VB_Coding`).
  - Use Supabase CLI / MCP with an authenticated Personal Access Token (`SUPABASE_ACCESS_TOKEN`), or link an existing dashboard project.
- **2. Schema & RLS Enforcement (`supabase_schema.sql`):**
  - Execute the canonical database schema on the project before exposing the frontend to live queries.
  - Mandatory requirements:
    - Tables: `profiles` (budget tracking) and `expenses` (transactions).
    - Row Level Security (RLS): Active on all public tables with strict policies ensuring `auth.uid() = id` or `auth.uid() = user_id`.
    - Triggers: Automatic profile provisioning via `on_auth_user_created` upon user sign-up.
- **3. Environment Variable Centralization (`.env`):**
  - All connection secrets must reside strictly in `.env`:
    - `SUPABASE_URL`: Public HTTPS endpoint of the project.
    - `SUPABASE_ANON_KEY`: Public anonymous API key.
    - `SUPABASE_ACCESS_TOKEN`: Management token (for CLI/migration operations).
  - The local development server (`server.js`) must automatically inject these variables into the client runtime via `/env.js` and `window.__ENV__` to avoid hardcoding or manual entry.
- **4. Full Lifecycle Verification:**
  - Before declaring any backend integration milestone complete, execute the automated verification suite (`node test_supabase_lifecycle.js`).
  - Verify every state: User SignUp -> Profile Creation -> Budget Upsert -> Expense Insert -> Expense Query & Filtering -> Expense Deletion -> SignOut.

