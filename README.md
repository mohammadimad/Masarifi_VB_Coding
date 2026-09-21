**English** | [العربية](README.ar.md)

# Masarifi - Personal Expense & Income Tracker

A responsive, Arabic-first (RTL) personal finance web application built strictly following the **Google Stitch** design system specification and the product rules defined in `Rules.md`.

It allows users to track daily income and expenses, viewing an interactive summary dashboard for the current month's operations, current balance, total income, and total expenses.

---

## Key Features

- **Smart Statistical Dashboard:**
  - Real-time display of Current Balance, Total Income (green accent), and Total Expenses (red accent).
  - Dynamic calculations updating instantly when adding, editing, or deleting any transaction.
- **Transaction Management (CRUD):**
  - Add new transactions (Income or Expense) with title, amount, category, and date.
  - Quick inline actions to Edit or Delete transactions.
  - Multi-category icons (Groceries/Shopping, Food, Transportation, Utilities, Salary, Healthcare, etc.).
- **Interactive Modal Popup:**
  - Centered popup dialog with backdrop blur (`backdrop-blur`) for smooth entry and editing.
- **Authentication System:**
  - Modern authentication view (`login.html`) featuring the official Masarifi logo.
  - Pre-configured for **Supabase Auth** with an automatic local demo fallback for instant zero-config testing.
- **Pixel-Matched to Google Stitch:**
  - Implements the exact brand palette (`#3525cd`, `#4f46e5`, `#fcf8ff`), `Cairo` & `Inter` typography, and Material Symbols Outlined.
  - Fully responsive: Mobile top app bar and desktop fixed side navigation drawer.

---

## Tech Stack

- **HTML5** with Arabic Right-to-Left layout (`dir="rtl"`).
- **Tailwind CSS** configured with Google Stitch design tokens.
- **Vanilla JavaScript (ES6+)** with ES Modules (Zero front-end frameworks).
- **Supabase JavaScript Client** for authentication & database integration.
- **Lightweight Built-in Node.js Server** (Zero external dependencies).

---

## Project Structure

```text
Masarifi_VB_Coding/
├── index.html                           # Main Dashboard & Transaction Management
├── login.html                           # Authentication View
├── assets/
│   └── logo.png                         # Official Masarifi App Logo
├── css/
│   └── style.css                        # Theme tokens, font imports & custom overrides
├── js/
│   ├── app.js                           # Dashboard logic, balance computation & CRUD
│   ├── auth.js                          # Login/signup/logout & session check
│   └── config.js                        # Supabase credentials & configuration
├── server.js                            # Local static-file web server
├── Rules.md                             # Original product specification
└── stitch_masarifi_expense_tracker/     # Reference Google Stitch assets and designs
```

---

## Running Locally

Node.js is required to serve the files, but no external packages need to be installed (`npm install` is not required):

```bash
# Start local server
node server.js
```

Then visit:
- Dashboard: [http://localhost:8081/index.html](http://localhost:8081/index.html)
- Login: [http://localhost:8081/login.html](http://localhost:8081/login.html)

---

## Supabase Setup (Optional)

The application works out of the box using browser local storage. To connect your live Supabase cloud backend:
1. Create a project on [Supabase](https://supabase.com).
2. Open `js/config.js` and add your project URL and public anon key:
   ```javascript
   export const SUPABASE_URL = "https://your-project.supabase.co";
   export const SUPABASE_ANON_KEY = "your-anon-key";
   ```
