# Hackathon Suite

Two cooperating apps in one repo:

| App | Folder | Backend | Frontend | Database |
|-----|--------|---------|----------|----------|
| **Assessment** (PatternIQ exam gate) | `assessment/` | Spring Boot `:8082` | Vite/React `:5175` | `pattern_recognition` |
| **Hackathon portal** (admin + judge + participant) | `hackathon/` | Spring Boot `:8080` | Vite/React `:5173` | `hackathondb` |

Each app has its own `backend/` and `frontend/`. They stay independent services
(own process, own database) and integrate at runtime via a **shared-JWT SSO handoff**:
a candidate takes the assessment, and on scoring **≥ 75 %** is handed straight into the
hackathon portal (no second login).

## Prerequisites
- JDK 21, Node 18+, PostgreSQL 18 (databases `hackathondb` and `pattern_recognition`).
- Gradle is provided via the wrapper (points at a local distribution).

## Run everything
```powershell
powershell -ExecutionPolicy Bypass -File .\start-all.ps1
```
Then open **http://localhost:5175** (assessment). Admins/judges can go directly to
**http://localhost:5173** (`admin@cognizant.com` / `admin123`).

## Run one app manually
```powershell
# assessment
cd assessment\backend ; .\gradlew.bat bootRun
cd assessment\frontend ; npm install ; npm run dev
# hackathon
cd hackathon\backend ; .\gradlew.bat bootRun
cd hackathon\frontend ; npm install ; npm run dev
```

## Notes
- Kept outside OneDrive on purpose — OneDrive dehydrates build outputs and breaks
  Gradle's resource snapshotting.
- The hackathon backend serves its SPA from `hackathon/backend/src/main/resources/static`
  when the frontend is built (`npm run build`); during development the Vite dev server
  (`:5173`) is used instead.
