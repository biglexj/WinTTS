# Script para descargar el paquete MSIX firmado desde Microsoft Store
# Este paquete ya está firmado por Microsoft y será aceptado por WinGet

param(
    [string]$StoreId = "9NS5MH65JBJ3",
    [string]$OutputDir = ".\publish\store-signed"
)

Write-Host "=== Descargando MSIX firmado desde Microsoft Store ===" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "📦 Store ID: $StoreId" -ForegroundColor Yellow
Write-Host "📁 Directorio de salida: $OutputDir" -ForegroundColor Yellow
Write-Host ""

# Opción 1: Usar la herramienta store-package-downloader
Write-Host "=== Método 1: Usando store-package-downloader ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Visita: https://store.rg-adguard.net/" -ForegroundColor Green
Write-Host "2. Pega esta URL:" -ForegroundColor Green
Write-Host "   https://apps.microsoft.com/detail/$StoreId" -ForegroundColor White
Write-Host "3. Selecciona 'ProductId' en el dropdown" -ForegroundColor Green
Write-Host "4. Haz clic en el botón de búsqueda (✓)" -ForegroundColor Green
Write-Host "5. Descarga el archivo .msixbundle o .msix más grande (x64)" -ForegroundColor Green
Write-Host "6. Guárdalo en: $OutputDir" -ForegroundColor Green
Write-Host ""

# Opción 2: Desde Partner Center
Write-Host "=== Método 2: Desde Microsoft Partner Center ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: https://partner.microsoft.com/dashboard" -ForegroundColor Green
Write-Host "2. Navega a tu app WinTTS" -ForegroundColor Green
Write-Host "3. Ve a 'Package management' o 'Administración de paquetes'" -ForegroundColor Green
Write-Host "4. Descarga el paquete firmado (.msix o .msixbundle)" -ForegroundColor Green
Write-Host "5. Guárdalo en: $OutputDir" -ForegroundColor Green
Write-Host ""

# Opción 3: Instrucciones para PowerShell avanzado
Write-Host "=== Método 3: Usando PowerShell (Avanzado) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si ya tienes la app instalada desde la Store:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre PowerShell como Administrador" -ForegroundColor Green
Write-Host "2. Ejecuta:" -ForegroundColor Green
Write-Host '   Get-AppxPackage -Name "biglexj.WinTTS"' -ForegroundColor White
Write-Host "3. Copia la ruta de 'InstallLocation'" -ForegroundColor Green
Write-Host "4. El paquete original estará en esa ubicación" -ForegroundColor Green
Write-Host ""

Write-Host "=== Siguiente Paso ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Una vez descargado el MSIX firmado:" -ForegroundColor Yellow
Write-Host "1. Renómbralo a 'WinTTS-Store-Signed.msix'" -ForegroundColor Green
Write-Host "2. Súbelo a GitHub Releases (v1.0.0)" -ForegroundColor Green
Write-Host "3. Ejecuta: .\scripts\update-winget-manifest.ps1" -ForegroundColor Green
Write-Host ""
