# AI Workflow Protocol (بروتوكول سير العمل الموحد)

This document outlines the standard operating procedures and workflow rules for AI agents working on this project (or any future project). These are generic, high-level structural rules independent of the specific tech stack.

## 1. Branching Strategy (عزل العمل)
- **Never work on `main` directly.** 
- For every new screen, feature, or major modification, create a new isolated Git branch (e.g., `feature/screen-name` or `fix/issue-name`).
- This ensures the main branch remains stable and production-ready at all times.

## 2. UI & Responsiveness First (أولوية الواجهات والتجاوب)
- **Mandatory Responsiveness Step:** Immediately after importing or generating raw HTML/UI code (e.g., from Google Stitch, Figma, etc.), the first step is ALWAYS to fix responsiveness.
- Ensure layouts work flawlessly on mobile and desktop (handling `overflow-x-auto` for tables, `flex-wrap` for cramped elements, and `min-w-0` to prevent Flexbox text overflow).
- Do not write any logical code until the UI is perfectly responsive.

## 3. Frontend Interactivity Phase (التفاعل الأمامي)
- After the UI is structurally sound, implement pure frontend interactivity.
- This includes functional tabs, opening/closing modals, dropdowns, and printing functionality.
- This phase strictly involves manipulating the DOM without backend dependencies.

## 4. Postpone Backend Integration (تأجيل الباك إند)
- **Do not mix frontend scaffolding with backend logic.**
- Connecting to databases (e.g., Supabase, Firebase), implementing real Authentication, and applying Row Level Security (RLS) must be postponed until the UI is fully approved by the user.
- Use mock data or static placeholders during the frontend phase.

## 5. Explicit Approval & Merging (الموافقة والدمج)
- **Checkpoints:** Present the work to the user (via local server preview or screenshots) at key milestones.
- Do not merge the feature branch into `main` without explicit, unambiguous approval from the user.
- Once approved, merge cleanly and prepare for the next isolated task.
