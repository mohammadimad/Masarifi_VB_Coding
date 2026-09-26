# [1] Project Profile & Context
- Project Name: Masarifi (مصاريفي)
- Description: A responsive web application for personal finance management. It allows users to track daily income and expenses, viewing a summary dashboard for the current month's operations.
- Platform: Responsive Web App (Mobile-first approach).

# [2] Tech Stack & Environment Constraints
- Frontend: HTML5, Tailwind CSS (via CDN or standard build).
- Logic: Vanilla JavaScript (ES6+), completely framework-less.
- Backend/Database: Supabase (PostgreSQL + Supabase Auth).
- Environment Constraints: Do not use Node.js frameworks (like React/Vue). Keep it strictly Vanilla JS. Use Supabase JS Client library via CDN or ES modules.

# [3] Directory & File Structure
masarifi/
├── index.html       (Main Dashboard - Protected Route)
├── login.html       (Authentication Page)
├── css/
│   └── style.css    (Custom overrides, if any)
├── js/
│   ├── config.js    (Supabase keys and initialization)
│   ├── auth.js      (Login/Signup/Logout logic & Session check)
│   └── app.js       (Dashboard logic, CRUD operations, Modal logic)
└── assets/
    └── logo.png     (App Logo)

# [4] UI/UX & Visual Identity Rules
- Main Theme Color: Indigo (Tailwind `indigo-600` / `#4F46E5`) matching the logo.
- Backgrounds: Clean White (`bg-white`) and Light Gray (`bg-gray-50`) to make cards pop out.
- Semantic Colors: Green (`text-green-600`) for Income, Red (`text-red-600`) for Expenses.
- Components: Use modern rounded cards (`rounded-xl` or `rounded-2xl`), subtle shadows (`shadow-md`).
- Interactions: Add transactions via a centered Modal (Popup) with a backdrop blur. Inputs must be clear and accessible.
- Responsiveness: Must look perfect on mobile screens (stacked layout) and expand to grid layouts on desktop.
- Mandatory Responsiveness Step: ALWAYS, immediately after fetching a new interface from Stitch (or any source), review and fix all responsiveness issues (add `overflow-x-auto` for tables/tabs, `flex-wrap`, proper widths, etc.) before writing any other logic.
# [5] Coding & Architectural Constraints
- Clean Code: Use descriptive variable names (e.g., `totalIncome`, `transactionModal`).
- State Management: Store the current month's data in memory (JS arrays) after fetching from Supabase, update the UI dynamically without page reload.
- Error Handling: Use `try...catch` blocks for all Supabase API calls. Show user-friendly error messages (Toasts/Alerts).
- Security: Never expose sensitive data. Ensure RLS (Row Level Security) is assumed in Supabase (users can only select/insert/update their own `user_id`).