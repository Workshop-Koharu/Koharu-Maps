Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "  🌸 Koharu Maps — Standalone GIS & Cartographic Engine" -ForegroundColor Magenta
Write-Host "  Zero-Dependency | Offline-First | Free Open API Service" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Magenta

# Check .env
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

# Run FastAPI server via Uvicorn
$HOST_ADDR = "127.0.0.1"
$PORT_NUM = 8000

Write-Host "[INFO] Starting Koharu Maps Server at http://$HOST_ADDR`:$PORT_NUM" -ForegroundColor Cyan
Write-Host "[INFO] Map Viewport UI: http://$HOST_ADDR`:$PORT_NUM/" -ForegroundColor Green
Write-Host "[INFO] Developer Portal: http://$HOST_ADDR`:$PORT_NUM/developer" -ForegroundColor Green
Write-Host "[INFO] Interactive API Docs: http://$HOST_ADDR`:$PORT_NUM/api-docs" -ForegroundColor Green
Write-Host "[INFO] OpenAPI Swagger: http://$HOST_ADDR`:$PORT_NUM/docs" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to terminate the engine." -ForegroundColor Yellow
Write-Host ""

python -m uvicorn server.main:app --host $HOST_ADDR --port $PORT_NUM --reload
