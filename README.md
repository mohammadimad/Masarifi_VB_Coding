**English** | [العربية](README.ar.md)

# Masarifi Task & Focus Tracker

An Arabic, mobile-first productivity prototype that combines a persistent task list with a focus timer, session statistics, and unlockable achievements. The interface is implemented with vanilla JavaScript and Tailwind CSS.

## Implemented Features

- Add, complete, and delete tasks
- Filter all, active, or completed tasks
- Clear all completed tasks
- Save task data in browser local storage
- Start, pause, and finish timed focus sessions
- Track completed sessions and total elapsed time locally
- Unlock six achievements based on time and session milestones
- Responsive Arabic RTL interface
- Login and sign-up interface prepared for Supabase Auth
- Lightweight Node.js static-file server

## Tech Stack

- HTML5
- Tailwind CSS through CDN
- Vanilla JavaScript with ES modules
- Browser Local Storage
- Supabase JavaScript client for the authentication scaffold
- Node.js built-in HTTP server

## Project Structure

```text
Masarifi_VB_Coding/
├── index.html       # Task-list page
├── timer.html       # Focus timer, statistics, and achievements
├── login.html       # Supabase login and sign-up interface
├── server.js        # Local static-file server
├── css/style.css    # Custom styles
├── js/
│   ├── app.js       # Task CRUD, filters, and local persistence
│   ├── timer.js     # Timer, statistics, and achievements
│   ├── auth.js      # Supabase authentication functions
│   └── config.js    # Supabase configuration placeholders
└── Rules.md         # Original product brief
```

## Run Locally

Node.js is required, but there are no packages to install.

```bash
git clone https://github.com/mohammadimad/Masarifi_VB_Coding.git
cd Masarifi_VB_Coding
node server.js
```

Open `http://localhost:8081/` for the task list or `http://localhost:8081/timer.html` for the timer.

## Authentication Setup

`js/config.js` contains placeholder values. To try the login page, create a Supabase project and replace only the public project URL and anonymous key:

```js
const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";
```

Never expose a Supabase service-role key in client-side code. Configure Row Level Security before connecting user-owned data.

## Verification

The server and JavaScript modules pass Node.js syntax checks. The repository contains placeholder Supabase configuration rather than committed credentials.

## Current Scope

- The current implementation is a task and focus tracker, although `Rules.md` describes an earlier personal-finance concept.
- Tasks, timer statistics, and achievements are stored only in the current browser.
- Supabase authentication requires configuration and is not connected to the task or timer data.
- The task and timer pages currently do not enforce a Supabase session.
- No income or expense tracking is implemented.

## Possible Improvements

- Align the repository name and product brief with the implemented application
- Connect tasks and sessions to authenticated Supabase users
- Add Row Level Security policies and route protection
- Restore an active timer accurately after a refresh
- Add input limits, automated tests, and offline error handling
- Package Tailwind CSS for production instead of relying on the CDN

## Author

[Mohammad Abdelfattah](https://github.com/mohammadimad)
