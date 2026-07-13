# Launches all four processes of the Hackathon Suite, each in its own window.
#
#   assessment  : PatternIQ exam gate   -> backend :8082, frontend :5175
#   hackathon   : unified portal (admin/judge/participant) -> backend :8080, frontend :5173
#
# Flow: take the assessment at http://localhost:5175 ; score >= 75% ; "Proceed to
# Hackathon" hands you off (shared-JWT SSO) into http://localhost:5173 — no re-login.
#
# Usage:  powershell -ExecutionPolicy Bypass -File .\start-all.ps1

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

function Start-App($title, $dir, $cmd) {
    Write-Host "Starting $title ..."
    Start-Process powershell -ArgumentList @(
        '-NoExit', '-Command',
        "`$host.UI.RawUI.WindowTitle='$title'; Set-Location '$dir'; $cmd"
    )
}

Start-App 'assessment-backend  (:8082)' "$root\assessment\backend"  '.\gradlew.bat bootRun'
Start-App 'assessment-frontend (:5175)' "$root\assessment\frontend" 'npm run dev'
Start-App 'hackathon-backend   (:8080)' "$root\hackathon\backend"   '.\gradlew.bat bootRun'
Start-App 'hackathon-frontend  (:5173)' "$root\hackathon\frontend"  'npm run dev'

Write-Host ''
Write-Host 'All four processes launched in separate windows.'
Write-Host '  Assessment (start here): http://localhost:5175'
Write-Host '  Hackathon portal        : http://localhost:5173'
Write-Host 'First backend boot compiles via Gradle and may take a minute.'
