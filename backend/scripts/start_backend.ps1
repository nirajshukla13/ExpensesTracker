param(
    [int]$port = 8000,
    # default: repo-root venv when this script is invoked from the `backend` folder
    [string]$venvDir = "..\venv"
)

$pythonPath = Join-Path $venvDir "Scripts\python.exe"
Write-Host "Starting backend using: $pythonPath"
& $pythonPath -m uvicorn server:app --reload --port $port
