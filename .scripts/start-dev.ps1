# Free port 5173, clear npm cache, and start Vite on port 3000
$port = 5173
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "Killing process on port $port..." -ForegroundColor Red
    $process | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Starting dev server on port 3000..." -ForegroundColor Green
$job = Start-Job -ScriptBlock {
    cd "C:\Users\Fatima Communication\Desktop\saas-pro\tanzify-new"
    npx vite --port 3000 --host
}

Start-Sleep -Seconds 6

Write-Host "Checking server status..." -ForegroundColor Cyan
$listening = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($listening) {
    Write-Host "✅ Server running on port 3000" -ForegroundColor Green
    Write-Host "Open: http://localhost:3000" -ForegroundColor Blue
    Write-Host "Open: http://127.0.0.1:3000" -ForegroundColor Blue
    start "http://localhost:3000"
} else {
    Write-Host "❌ Server failed to start" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
    Write-Host "✅ Server responded with status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not responding: $_" -ForegroundColor Red
}