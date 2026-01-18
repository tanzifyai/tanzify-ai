<#
railway-deploy.ps1
Automates Railway project init, pushing env vars and deploying backend.

Usage (interactive login):
  1. Install Railway CLI: npm i -g @railway/cli
  2. Run: railway login    (complete login in browser)
  3. From repo root run: .\railway-deploy.ps1

Usage (token-based non-interactive):
  1. Obtain Railway token and set env var:
     $env:RAILWAY_TOKEN = 'your_railway_token_here'
  2. Run script: .\railway-deploy.ps1
#>

param()

function Write-Ok($msg){ Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Err($msg){ Write-Host "[ERR] $msg" -ForegroundColor Red }
function Write-Info($msg){ Write-Host "[..] $msg" -ForegroundColor Cyan }

# Ensure script runs from repo root
$root = Get-Location
Write-Info "Running from: $root"

# Ensure railway CLI exists
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Err "Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
}
Write-Ok "Railway CLI found"

# NOTE: The Railway CLI does not accept a `--token` flag for `railway login`.
# Require an interactive `railway login` (browser) before running this script.
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Err "Railway CLI not found. Install with: npm i -g @railway/cli"
    exit 1
}
Write-Info "Ensure you are logged in interactively with: railway login"
Write-Info "If you prefer non-interactive auth, set RAILWAY_TOKEN in your session and use the Railway dashboard to create a service token."

# Initialize Railway project (idempotent)
Write-Info "Initializing Railway project 'tanzify-ai' (if not already initialized)"
railway init --name tanzify-ai
if ($LASTEXITCODE -eq 0) { Write-Ok "Railway project initialized/linked" } else { Write-Info "railway init returned non-zero exit (may already be linked)" }

# Helper: push .env file variables to Railway for a given file
function Push-EnvFileToRailway($envFilePath) {
    if (-not (Test-Path $envFilePath)) { Write-Info "Env file not found: $envFilePath"; return }
    Write-Info "Pushing vars from $envFilePath to Railway"
    $lines = Get-Content $envFilePath | Where-Object { $_ -and -not ($_ -match '^\s*#') }
    foreach ($line in $lines) {
        if ($line -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Skip empty values
            if ($value -eq '') { Write-Info "Skipping empty value for $key"; continue }
            Write-Info "Setting Railway variable: $key"
            # Use KEY=VALUE format
            $cmd = "railway variable set `"$key=$escaped`""
            Invoke-Expression $cmd
            if ($LASTEXITCODE -ne 0) {
                Write-Err "Failed to set $key using railway CLI. Try running 'railway variable set $key=$value' interactively."
            }
        }
    }
    Write-Ok "Finished pushing vars from $envFilePath"
}

# Push backend env
$backendEnv = Join-Path $root 'backend\.env'
Push-EnvFileToRailway $backendEnv

# Push frontend .env (root .env used for Vite variables)
$frontendEnv = Join-Path $root '.env'
Push-EnvFileToRailway $frontendEnv

# Deploy backend using railway up
Write-Info "Deploying backend service (backend folder)"
Set-Location (Join-Path $root 'backend')
railway up --detach
if ($LASTEXITCODE -ne 0) { Write-Err "railway up failed"; exit 1 }
Write-Ok "Backend deployment started"

# Get project status and expose URL
Set-Location $root
Write-Info "Fetching railway status..."
railway status

Write-Ok "Script finished. Please open Railway dashboard to connect domain and configure DNS records."
Write-Info "If you want me to continue (configure DNS/webhooks), provide Railway token and domain registrar access OR run the commands I provide."