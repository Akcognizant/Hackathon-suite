# Hackathon Suite — Architecture Guide

> A monorepo of **two cooperating full-stack apps** that share a single JWT secret so a
> candidate flows straight from a screening assessment into a hackathon portal without
> logging in twice.

| App | Folder | Backend | Frontend | Database | Purpose |
|-----|--------|---------|----------|----------|---------|
| **Assessment** ("PatternIQ") | `assessment/` | Spring Boot `:8082` | Vite/React `:5175` | `pattern_recognition` | Timed cognitive/pattern exam that gates entry |
| **Hackathon portal** | `hackathon/` | Spring Boot `:8080` | Vite/React `:5173` | `hackathondb` | Admin + Judge + Participant management portal |

The two backends are **independent services** (own process, own DB). They integrate only at
runtime via a **shared-secret JWT SSO handoff**: pass the assessment (**≥ 75 %**) and you are
minted a hackathon-format token and dropped into the portal as a `PARTICIPANT`.

---

## 1. Repository Layout

```
Hackathon-suite/
├── README.md                     # Quickstart (ports, prereqs, run commands)
├── start-all.ps1                 # Launches all 4 processes, each in its own window
├── ARCHITECTURE.md               # ← this file
│
├── assessment/                   # ── App 1: the exam gate ──
│   ├── backend/                  # Spring Boot 4.1 / Java 21 / Gradle  (:8082)
│   ├── frontend/                 # React 19 + Vite + @dnd-kit          (:5175)
│   └── database/                 # create_tables.sql + seed_data.sql (pattern_recognition)
│
└── hackathon/                    # ── App 2: the portal ──
    ├── backend/                  # Spring Boot 4.1 / Java 21 / Gradle  (:8080)
    └── frontend/                 # React 19 + Vite + Tailwind          (:5173)
```

### Running everything
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```
Start at **http://localhost:5175** (assessment). Admins/judges can jump straight to
**http://localhost:5173** and log in with `admin@cognizant.com` / `admin123`.

**Prereqs:** JDK 21, Node 18+, PostgreSQL (databases `pattern_recognition` and `hackathondb`).
Gradle is provided via the wrapper. The repo is kept **outside OneDrive** on purpose —
OneDrive dehydrates build outputs and breaks Gradle's resource snapshotting.

---

## 2. The End-to-End Flow (why this repo exists)

```
┌─────────────────────┐   pass ≥75%    ┌──────────────────────────┐
│  Assessment (5175)  │  ───────────►  │  Hackathon portal (5173) │
│  login → exam →     │  shared-JWT    │  /sso → /portal          │
│  score → gate       │  SSO handoff   │  (auto-provisioned)      │
└─────────────────────┘                └──────────────────────────┘
```

1. Candidate registers / logs in on the **assessment** app.
2. Takes a timed exam (2 sections, ~15 questions). Autosaved as they go.
3. On submit, the backend grades server-side and computes an **accuracy %**.
4. The **Hackathon Gate** shows one of three states: *pending* (keep trying), *blocked*
   (all 3 attempts used, never hit 75 %), or *passed* (unlocked).
5. On **passed**, clicking "Proceed to Hackathon" calls `POST /api/sso/hackathon`, which
   mints a **hackathon-format JWT** signed with the *shared* secret and returns
   `{ token, hackathonUrl }`.
6. The browser redirects to `http://localhost:5173/sso#token=<jwt>`.
7. The hackathon SPA's `SsoLanding` reads the token from the URL **hash**, stores it, and
   routes to `/portal`. The hackathon backend validates the signature and, if the email is
   new, **auto-provisions a `PARTICIPANT` account** — no second login.

> **Security note on the handoff:** the token is passed in the URL *hash fragment* (`#token=`),
> not the query string, so it never lands in server access logs. Authenticity is proven purely
> by the shared HMAC signature — both apps must have identical secrets.

---

## 3. The SSO Contract (shared JWT secret)

The linchpin of the whole suite. Both sides must agree on the secret and the claim shape.

| | Assessment backend | Hackathon backend |
|---|---|---|
| Config key | `hackathon.jwt.secret` | `jwt.secret` |
| Dev value | `ThisIsTheCognizant…SigningSecretKey2026!!` | *same string* |
| Env override | `HACKATHON_JWT_SECRET` | `JWT_SECRET` |
| Redirect target | `hackathon.url` = `http://localhost:5173` | serves `/sso` landing |

**Minted SSO token claims** (assessment → hackathon):
- `sub` = candidate **email** (note: assessment's *own* login tokens use candidateId as subject)
- `role` = `"PARTICIPANT"`
- `name` = candidate display name
- HS256, 24 h expiry

Minted by `HackathonSsoService` (assessment) → validated by `JwtAuthenticationFilter`
(hackathon), which calls `loadOrProvision(...)` to auto-create the participant on first hit.

> ⚠️ In production, both secrets **must** be injected via environment variables and never
> committed. The `≥ 75 %` pass threshold is hardcoded in the assessment's `SessionService`.

---

## 4. App 1 — Assessment ("PatternIQ")

### 4.1 Backend  (`com.assessment.backend`, port 8082)

**Stack:** Spring Boot 4.1, Java 21, Spring Data JPA, JJWT 0.12.6, Spring Security Crypto
(BCrypt only — no full filter chain; a custom `JwtAuthFilter` does the work). DB
`pattern_recognition`, `ddl-auto=none` (schema is managed by the SQL scripts, not Hibernate).

**Domain model** (UUID PKs; DB schema in `assessment/database/create_tables.sql`):

| Entity | Key fields | Notes |
|--------|-----------|-------|
| `Candidate` | username, email (both unique), passwordHash, name | BCrypt password |
| `Question` | section, questionType, questionText, prompt, patternData, options, correctOptionIndex, items, zones, **answerKey**, suffix | One polymorphic table for both sections; `answerKey` is **server-only, never sent to client** |
| `AssessmentSession` | candidate, attemptNumber, startedAt/completedAt, totalTimeSeconds, finalScore, maxScore, accuracyPercentage, status | `maxScore` varies per attempt (sum of item counts) |
| `Response` | session, question, displayOrder, selectedOptionIndex, answer, events, dragAttempts, incorrectPlacements, isCorrect, correctCount, totalCount, timeTaken | Stores both the answer and raw drag **telemetry** |

**Two question sections (one `questions` table, polymorphic by `question_type`):**
- **`pattern`** (MCQ): `number_sequence`, `shape_pattern`, `matrix` — use `patternData` /
  `options` / `correctOptionIndex`. 10 random *unseen* MCQs picked per attempt.
- **`drag`** (activities): `categorize`, `match`, `sequence`, `rank`, `fill-blank` — use
  `prompt` / `items` / `zones` / `answerKey` / `suffix`. A fixed set (one per type).

**REST surface** (all require `Bearer` JWT except `/auth/login` + `/auth/register`):

| Controller | Endpoints |
|-----------|-----------|
| `AuthController` | `POST /api/auth/login`, `POST /api/auth/register`, `PUT /api/candidates/{id}`, `PUT /api/candidates/{id}/password` |
| `QuestionController` | `GET /api/questions?candidateId=` (returns DTOs **without** answer keys) |
| `SessionController` | `POST /api/sessions/start`, `PATCH /api/sessions/{id}/responses` (autosave), `POST /api/sessions/{id}/submit`, `GET /api/sessions/{id}/result`, `GET /api/sessions/{id}/analytics`, `GET /api/sessions?candidateId=` (history) |
| `HackathonGateController` | `GET /api/gate/status`, `POST /api/sso/hackathon` (403 if < 75 %) |

**Key business rules** (`SessionService`): `MAX_ATTEMPTS = 3`, `TIME_LIMIT = 1200s` (20 min),
`PASS_THRESHOLD = 75 %`. Grading is done **server-side** by `ActivityScoring.score()`:
- *mapping* activities (categorize/match/fill-blank): compare `answer.placements` to `answerKey`.
- *order* activities (sequence/rank): compare `answer.order` to `answerKey`.
- 1 point per correctly placed item; misplacements are counted from the event log for analytics.

**Security:** `JwtService` (issue/verify, subject = candidateId), `JwtAuthFilter`
(OncePerRequest, sets `candidateId`/`username` request attributes, 401 JSON on failure),
`HackathonSsoService` (mints the cross-app token — see §3). On first startup
`PasswordHashMigration` re-hashes any plaintext seed passwords to BCrypt.

### 4.2 Frontend  (`assessment/frontend`, port 5175)

**Stack:** React 19, React Router 7, Vite 8, **@dnd-kit** (core/sortable/utilities) for drag &
drop, **framer-motion** for drag animation, **recharts** for analytics, Tailwind 4, axios.
`.env`: `VITE_API_BASE_URL=http://localhost:8082/api`.

**Routes** (`src/App.jsx`; most wrapped in `ProtectedRoute`):

| Path | Page | Purpose |
|------|------|---------|
| `/login`, `/register` | LoginPage / RegisterPage | Public auth |
| `/dashboard` | Dashboard | Hub; hosts the **HackathonGate** |
| `/instructions` | InstructionPage | Rules, scoring, attempt limits |
| `/assessment` | AssessmentPage | The timed exam (palette, timer, per-Q telemetry) |
| `/results/:sessionId` | ResultPage | Score ring + per-question review |
| `/analytics/:sessionId` | AnalyticsPage | Timing / accuracy / cognitive breakdown |
| `/history` | HistoryPage | Past attempts |
| `/profile` | ProfilePage | Edit name/email, change password |

**Auth state** lives in `AuthContext` backed by **sessionStorage** (`candidate` + `token`).
`axiosInstance` attaches the bearer token and, on a 401 from a non-auth endpoint, clears the
session and bounces to `/login`.

**Activity components** (`src/components/activities/`) all funnel through `ActivityRenderer`,
which switches on `activity.type`:
- `CategorizeActivity` / `MatchActivity` / `FillBlankActivity` → `{kind:'mapping', placements:{}}`
- `SequenceActivity` / `RankActivity` → `{kind:'order', order:[]}`
- `dndKit.jsx` centralizes sensors (pointer/touch/keyboard), a11y announcements, and the
  framer-motion drag overlay.

**Telemetry:** `useAssessmentTelemetry` records the ordered event log, drag-attempt count, and
elapsed time on the client — **but never correctness** (scoring is backend-only). The snapshot
is sent with each answer and graded server-side.

**The handoff, frontend side** (`HackathonGate.jsx`): on mount it calls `GET /api/gate/status`
and renders passed / blocked / pending. On "Proceed to Hackathon" it calls
`POST /api/sso/hackathon` and does
`window.location.href = \`${hackathonUrl}/sso#token=${token}\``.

---

## 5. App 2 — Hackathon Portal

### 5.1 Backend  (`com.cognizant.hackathon`, port 8080)

**Stack:** Spring Boot 4.1, Java 21, Spring Data JPA (`ddl-auto=update`), **Spring Security +
JWT** (JJWT 0.12.6), PostgreSQL `hackathondb`, springdoc/OpenAPI (Swagger UI), **WebFlux
`WebClient`** (used only for Anthropic API calls — the app itself stays servlet/MVC),
`@EnableAsync`, OpenCSV 5.9 (bulk import), Lombok.

**Domain model** (`entity/`):

| Entity | Notes |
|--------|-------|
| `Hackathon` | title, dates, status, `submissionSecret` (**write-only**, per-hackathon intake secret), min/maxTeamSize. Owns teams, criteria, submissions |
| `Team` | name, `status` (TeamStatus), belongs to a Hackathon, owns Participants |
| `Participant` | name, email, `role` (FRONTEND/BACKEND/AI), `technicalScore` (1–5), `contributionType`, `evaluationStatus` — the **talent roster + individual eval** |
| `Submission` | projectTitle, description, repositoryUrl, `status`, human `score` (0–100), `gradedBy`, `aiScore` (0–10), `aiFeedback`, `scoreBreakdown` (per-criterion map) |
| `Score` | 1:1 with Submission — persisted human rubric value + `gradedBy` audit |
| `RubricCriterion` | name + maxPoints, per Hackathon (evaluation template) |
| `Leaderboard` | denormalized precomputed rankings per event (rebuilt on score change) |
| `Message` / `TeamMessage` | admin↔judge direct/announcement messaging / one-way admin→team notices |
| `Activity` | audit-feed rows for the dashboard "Recent Activity" timeline |
| `AdminUser` | portal accounts (email, BCrypt password, `role`) — JWT principals |

**Enums:** `AdminRole` (ADMIN/JUDGE/PARTICIPANT), `ParticipantRole` (FRONTEND/BACKEND/AI),
`SubmissionStatus` & `TeamStatus` (PENDING/APPROVED/REJECTED), `ContributionType`, `MessageType`
(DIRECT/ANNOUNCEMENT).

**REST surface** (grouped by audience):

*Public:* `POST /api/auth/login` · `POST /api/auth/logout` · `GET /submissions/hackathons` ·
`POST /submissions` (guarded by `X-Team-Secret` header, **not** JWT) · SPA forwarding routes.

*Admin / Judge* (JUDGE mostly read-only; ADMIN writes):
- Events: `GET/POST/PUT/DELETE /admin/events`, `GET /admin/events/export` (CSV)
- Criteria: `GET/POST /admin/hackathons/{id}/criteria`
- Teams: `GET /admin/teams/page`, `/{id}/scout`, `/{id}/members`, `GET/POST /{id}/messages`
- Submissions: `GET /admin/submissions[/page]`, `PUT /{id}/status`, `POST /{id}/ai-evaluate`, `POST /{id}/evaluate`
- Scores: `GET /admin/scores/page`, `POST /admin/scores` (assign + rebuild leaderboard + eval members)
- Participants: `GET /admin/participants[/page]`, `POST /{id}/evaluate`, `POST /import` (CSV)
- Dashboard/Activity/Messaging: `GET /admin/dashboard`, `GET/DELETE /admin/activities`, `/admin/messages/*`
- AI Navigator: `POST /api/ai/query`

*Participant portal* (`role = PARTICIPANT`, the SSO arrivals):
`GET /participant/events` · `teams/mine` · `teams/joinable` · `POST /participant/teams` ·
`POST /participant/teams/{id}/join` · `GET /participant/submissions/me` ·
`POST /participant/submissions` · `GET /participant/history`.

**Scoring & leaderboard** (`ScoreService` → `LeaderboardService`, `@Transactional`): assign a
score → upsert the `Score` row → mirror onto `Submission` → apply member evaluations → recompute
the event leaderboard (clear rows, sort by score DESC, re-rank) → emit `SubmissionScoredEvent`.
`TeamRankingService` computes global standings (best score per team, dense ranking).

**Event system** (Spring `ApplicationEventPublisher`): domain events —
`SubmissionCreated/Scored/StatusChanged`, `HackathonCreated/Updated/Deleted`, `TeamRegistered`,
`ParticipantsImported` — are handled by `ActivityEventListener` / `SubmissionEventListener` with
`@TransactionalEventListener(AFTER_COMMIT)`, each writing an audit-feed row in a fresh
`REQUIRES_NEW` transaction (best-effort; failures never affect the originating operation). Team
messaging is `@Async` (returns a `CompletableFuture`).

**Security** (`SecurityConfig`): JWT filter (`JwtAuthenticationFilter`) validates the bearer
token and **auto-provisions** unknown `PARTICIPANT` emails (this is where SSO arrivals land).
Route rules gate `/admin/**` to ADMIN/JUDGE (writes ADMIN-only), `/participant/**` to
PARTICIPANT. The public `POST /submissions` is guarded by a **constant-time** comparison of the
per-hackathon `submissionSecret` (`TeamSecretValidator`), not by JWT. Passwords are BCrypt.

**Seed data** (`DataInitializer`, `CommandLineRunner`): demo domain seeding is **disabled** (the
portal starts empty). It only bootstraps admin accounts when the `admins` table is empty:

| Email | Password | Role |
|-------|----------|------|
| deon.jose@cognizant.com | Password@123 | ADMIN |
| admin@cognizant.com | admin123 | ADMIN |
| judge@cognizant.com | judge123 | JUDGE |

### 5.2 AI / LLM Integration (Anthropic Claude)

Three distinct AI paths, all defaulting to **mock/disabled** so demos need no key or network:

1. **Submission auto-evaluation** — `SubmissionAiService`, model **`claude-opus-4-8`** via the
   Anthropic Messages API (`WebClient`). Mock mode (`anthropic.mock-enabled=true`, default)
   returns a canned score; live mode needs `ANTHROPIC_API_KEY`. Stores `aiScore` (0–10) +
   `aiFeedback` on the submission.
2. **AI Navigator chat** — `AiService`, invokes the **Claude Code CLI** natively via
   `ProcessBuilder` (path `ai.claude-bin`, default model `haiku` + effort `low`), grounded with a
   live snapshot of dashboard stats + submissions. Currently gated off by an `AI_ENABLED` flag.
3. **AI Grading Assistant** — `SubmissionGradingService` uses the CLI with **WebFetch enabled**
   and the stronger `sonnet` model to inspect a public GitHub repo and return per-criterion
   scores + feedback (clamped to each criterion's max). Rejects private/404 repos.

Config lives in `hackathon/backend/src/main/resources/application.properties`
(`anthropic.*`, `ai.*`).

### 5.3 Frontend  (`hackathon/frontend`, port 5173)

**Stack:** React 19, React Router 7, Vite 8, Tailwind 4, axios, recharts, react-markdown (AI
responses). `vite.config.js` **proxies** `/api`, `/admin`, `/participant`, `/submissions`, `/v3`,
`/swagger-ui` to `:8080`, and **builds directly into** `../backend/src/main/resources/static`
for consolidated single-jar deployment. `.env`: `VITE_API_BASE_URL=http://localhost:8080`.

**Auth & roles:** a single JWT (in **localStorage**) backs all three roles; `currentRole()` reads
`adminRole`. `axiosClient` attaches the token and redirects to `/login` on 401. **`SsoLanding`**
(`/sso`) is the SSO entry point — it parses `#token=`, decodes the JWT client-side, persists
token/email/role, and routes to `/portal`. Route protection is via the `RequireRole` wrapper +
`usePermissions` hook (UX-only gating; the backend enforces real authorization).

**Admin/Judge console** (`AdminLayout` shell): `AdminDashboard` (stats + Recharts + activity
feed), `HackathonList`/`HackathonForm` + inline `CriteriaManager`, `ParticipantManagement`,
`SubmissionTracking` (approve/reject), `ScoreManagement` (grading modal with AI-assist +
per-member star ratings), `Leaderboard` (CSV export), `TeamsList`, `MessagesInbox`, and an
"Ask AI" drawer wired to `POST /api/ai/query`.

**Participant portal** (`ParticipantLayout` shell, `src/pages/participant/`): `Dashboard`,
`Events`, `Teams` (create/join), `MyTeams`, `SubmitProject` (upsert), `Submissions`, `History`
(rankings/medals), `Help`.

**Shared UI kit** (`src/components/ui/`): `Button`, `Input`, `DataTable` (server-side
pagination/sort/expandable rows), `StatCard`, `CustomDropdown`, `StarRating`, `RankBadge`.
Tables drive pagination/search/filter **server-side** for scale. Logout uses
`logoutToAssessment()` — the assessment app is the single front door.

---

## 6. Cross-Cutting Notes

- **Two databases, two processes.** No shared tables; the only coupling is the shared JWT secret.
- **Ports:** assessment 8082 (api) / 5175 (web); hackathon 8080 (api) / 5173 (web). Assessment
  was deliberately moved off 8080 so both backends can run together.
- **Grading is always server-side.** Answer keys never leave the assessment backend; the
  hackathon's human/AI scores are authoritative on its side.
- **Production checklist:** override `JWT_SECRET` / `HACKATHON_JWT_SECRET` (must match),
  `ANTHROPIC_API_KEY` (+ set `anthropic.mock-enabled=false`) for live AI, real DB credentials,
  and per-hackathon `submissionSecret`s. Don't commit real secrets.

---

## 7. File Path Quick-Reference

| Concern | Path |
|---------|------|
| Root run script | `start-all.ps1` |
| Assessment schema / seed | `assessment/database/create_tables.sql`, `seed_data.sql` |
| Assessment SSO minting | `assessment/backend/.../security/HackathonSsoService.java` |
| Assessment gate API | `assessment/backend/.../controller/HackathonGateController.java` |
| Assessment scoring | `assessment/backend/.../service/{SessionService,ActivityScoring}.java` |
| Assessment gate UI | `assessment/frontend/src/components/HackathonGate.jsx` |
| Assessment activities | `assessment/frontend/src/components/activities/` |
| Hackathon SSO consume | `hackathon/backend/.../security/JwtAuthenticationFilter.java` |
| Hackathon SSO landing UI | `hackathon/frontend/src/pages/SsoLanding.jsx` |
| Hackathon scoring/leaderboard | `hackathon/backend/.../service/{ScoreService,LeaderboardService}.java` |
| Hackathon AI | `hackathon/backend/.../service/{SubmissionAiService,AiService,SubmissionGradingService}.java` |
| Hackathon security rules | `hackathon/backend/.../config/SecurityConfig.java` |
| Hackathon seed/admins | `hackathon/backend/.../config/DataInitializer.java` |
| Config (secrets/ports) | `*/backend/src/main/resources/application.properties`, `*/frontend/.env` |
