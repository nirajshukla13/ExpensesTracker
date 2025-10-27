# Start the backend server
$venvPath = Join-Path $PSScriptRoot "..\venv"
$pythonExe = Join-Path $venvPath "Scripts\python.exe"

Write-Host "Starting backend server..." -ForegroundColor Cyan
Write-Host "Python: $pythonExe" -ForegroundColor Gray
Write-Host "Working Dir: $PSScriptRoot" -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot
& $pythonExe -m uvicorn server:app --port 8000 --reload
