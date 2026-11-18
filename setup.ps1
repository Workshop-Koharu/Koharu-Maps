Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Koharu Maps - Environment Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Python installation
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Python 3.9+ is required but not found in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[INFO] Detected $pythonVersion" -ForegroundColor Green

# Install dependencies
Write-Host "[INFO] Installing required dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

# Create .env if not exists
if (!(Test-Path ".env")) {
    Write-Host "[INFO] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "[SUCCESS] Koharu Maps setup completed successfully!" -ForegroundColor Green
Write-Host "Run '.\start.ps1' to launch the standalone GIS engine & web interface." -ForegroundColor Cyan
