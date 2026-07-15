# Hackathon Suite

An end-to-end platform for running a technical hackathon, from candidate screening
through to judging. It is two cooperating web apps in one repository:

| App | Folder | What it does | Backend | Frontend | Database |
|-----|--------|--------------|---------|----------|----------|
| **Assessment** (PatternIQ) | `assessment/` | A timed skills gate candidates must pass before entering the hackathon | Spring Boot `:8082` | Vite + React `:5175` | `pattern_recognition` |
| **Hackathon portal** | `hackathon/` | The main event portal for admins, judges, and participants | Spring Boot `:8080` | Vite + React `:5173` | `hackathondb` |

The two apps run as independent services (own process, own database) and integrate at
runtime through a **shared-JWT single sign-on handoff**: a candidate takes the
assessment, and on scoring **≥ 75 %** is handed straight into the hackathon portal — no
second login.

```
Candidate → Assessment (:5175) → score ≥ 75% → SSO handoff → Hackathon portal (:5173)
```

---

## What each app does

### Assessment (PatternIQ)
A single-sitting, timed aptitude test used as an entry gate.

- **Two sections, 20 items, 20 minutes, up to 3 attempts.**
  - *Section 1 — Pattern (MCQ):* 10 randomly selected pattern-recognition questions
    (number sequences, shape patterns, matrices).
  - *Section 2 — Interactive (drag & drop):* 10 activities drawn at random from a pool
    of 100 core computer-science questions, balanced across five activity types
    (categorize, match, sequence, rank, fill-in-the-blank).
- Free navigation with a question palette, mark-for-review, and autosave.
- One timer runs across the whole attempt; you can close and resume, and the clock keeps
  running.
- Server-side scoring (1 point per correct item, partial credit on activities) with
  per-section analytics on submit.
- Passing (**≥ 75 %**) unlocks the hackathon portal via SSO.

### Hackathon portal
A role-based portal for the event itself:

- **Admin** — create and manage hackathons/events, define evaluation criteria and
  rubrics, manage teams, and handle access requests.
- **Judge** — score submissions against rubrics and view the leaderboard.
- **Participant** — form teams, submit projects, message teammates, and use the
  dashboard and built-in AI navigator.
- **AI-assisted scoring & navigator** — runs in a self-contained **mock mode by default**
  (no API key or network required), so the portal is fully demoable out of the box.

---

## Tech stack

- **Backends:** Java 21, Spring Boot 4, Spring Data JPA / Hibernate, PostgreSQL, JWT auth.
- **Frontends:** React 19, Vite, React Router, Tailwind CSS, Recharts (charts),
  `@dnd-kit` (drag & drop, assessment only).
- **Build:** Gradle (via the included wrapper) for backends; npm for frontends.

---

## Prerequisites

- **JDK 21**
- **Node.js 18+** and npm
- **PostgreSQL 14+** running locally on `:5432`

The backends default to PostgreSQL user `postgres` / password `root`. If your local setup
differs, update `spring.datasource.username` / `password` in each app's
`backend/src/main/resources/application.properties`.

---

## First-time database setup

Create the two databases, then load the assessment schema and seed data. The hackathon
database's schema is created automatically on first backend run.

```bash
# 1. Create both databases
createdb -U postgres pattern_recognition
createdb -U postgres hackathondb

# 2. Assessment: create tables and seed the sample candidate + pattern questions
psql -U postgres -d pattern_recognition -f assessment/database/create_tables.sql
psql -U postgres -d pattern_recognition -f assessment/database/seed_data.sql
```

Notes:
- The assessment's **100-question drag pool is seeded automatically** on backend startup
  (idempotent — it only inserts what's missing), so no manual step is needed for it.
- The hackathon portal seeds its default admin/judge accounts automatically on first run
  against an empty database.

---

## Run everything

From the repository root (Windows PowerShell), launch all four processes, each in its own
window:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```

Then open **http://localhost:5175** (assessment) to start as a candidate, or go directly
to **http://localhost:5173** (hackathon portal) as an admin/judge.

The first backend boot compiles via Gradle and may take a minute.

## Run one app manually

```bash
# Assessment
cd assessment/backend  && ./gradlew bootRun       # → :8082
cd assessment/frontend && npm install && npm run dev   # → :5175

# Hackathon
cd hackathon/backend  && ./gradlew bootRun        # → :8080
cd hackathon/frontend && npm install && npm run dev    # → :5173
```

On Windows, use `.\gradlew.bat bootRun`.

---

## Default logins

**Assessment (candidate):**

| Username | Password |
|----------|----------|
| `candidate1` | `test123` |

**Hackathon portal:**

| Email | Password | Role |
|-------|----------|------|
| `admin@cognizant.com` | `admin123` | Admin |
| `deon.jose@cognizant.com` | `Password@123` | Admin |
| `judge@cognizant.com` | `judge123` | Judge |

Participants normally arrive via the SSO handoff after passing the assessment.

---

## Ports at a glance

| Service | URL |
|---------|-----|
| Assessment frontend | http://localhost:5175 |
| Assessment backend | http://localhost:8082 |
| Hackathon frontend | http://localhost:5173 |
| Hackathon backend | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

---

## Project structure

```
Hackathon-suite/
├── assessment/
│   ├── backend/      Spring Boot API (:8082)
│   ├── frontend/     React + Vite SPA (:5175)
│   └── database/     create_tables.sql, seed_data.sql
├── hackathon/
│   ├── backend/      Spring Boot API (:8080)
│   └── frontend/     React + Vite SPA (:5173)
└── start-all.ps1     Launches all four processes
```

---

## Configuration

Sensible defaults are baked in for local development. For real deployments, override the
following via environment variables rather than editing files:

| Variable | Used by | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | hackathon backend | JWT signing secret (must match `HACKATHON_JWT_SECRET` on the assessment side for SSO) |
| `HACKATHON_JWT_SECRET` | assessment backend | Shared secret used to mint the SSO token |
| `HACKATHON_URL` | assessment backend | Where a passing candidate is handed off (default `http://localhost:5173`) |
| `ANTHROPIC_API_KEY` | hackathon backend | Enables real AI scoring/navigator (set `anthropic.mock-enabled=false` to use it) |

The AI features work without any key in the default mock mode.
