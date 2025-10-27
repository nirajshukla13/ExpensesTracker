param(
    # default: repo-root venv when this script is invoked from the `backend` folder
    [string]$venvDir = "..\venv"
)

Write-Host "Creating venv in: $venvDir"
python -m venv $venvDir

$pythonPath = Join-Path $venvDir "Scripts\python.exe"
Write-Host "Upgrading pip using: $pythonPath"
& $pythonPath -m pip install --upgrade pip

Write-Host "Installing backend requirements (this may take a few minutes)..."
& $pythonPath -m pip install -r .\requirements.txt

Write-Host "Done. To activate the venv in PowerShell (from repo root): .\venv\Scripts\Activate.ps1"
