# Script para actualizar el manifiesto de WinGet con el MSIX firmado de la Store
# Ejecutar después de subir el MSIX firmado a GitHub Releases

param(
    [string]$MsixPath = ".\publish\store-signed\WinTTS-Store-Signed.msix",
    [string]$Version = "1.0.0",
    [string]$GithubReleaseUrl = "https://github.com/biglexj/WinTTS/releases/download/v$Version/WinTTS-Store-Signed.msix"
)

Write-Host "=== Actualizando Manifiesto de WinGet ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo MSIX
if (-not (Test-Path $MsixPath)) {
    Write-Host "❌ ERROR: No se encontró el archivo MSIX: $MsixPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Primero ejecuta: .\scripts\download-store-msix.ps1" -ForegroundColor Yellow
    exit 1
}

# Calcular SHA256
Write-Host "📊 Calculando SHA256 del MSIX firmado..." -ForegroundColor Yellow
$hash = (Get-FileHash -Path $MsixPath -Algorithm SHA256).Hash
Write-Host "✅ SHA256: $hash" -ForegroundColor Green
Write-Host ""

# Actualizar el manifiesto
$installerManifest = ".\manifests-msix\biglexj.WinTTS.installer.yaml"

Write-Host "📝 Actualizando manifiesto: $installerManifest" -ForegroundColor Yellow

# Leer el contenido actual
$content = Get-Content $installerManifest -Raw

# Actualizar la URL y el hash
$content = $content -replace 'InstallerUrl:.*', "InstallerUrl: $GithubReleaseUrl"
$content = $content -replace 'InstallerSha256:.*', "InstallerSha256: $hash"

# Guardar el archivo actualizado
$content | Set-Content $installerManifest -NoNewline

Write-Host "✅ Manifiesto actualizado correctamente" -ForegroundColor Green
Write-Host ""

Write-Host "=== Siguiente Paso ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Revisa los cambios en: $installerManifest" -ForegroundColor Green
Write-Host "2. Sube el MSIX firmado a GitHub Releases:" -ForegroundColor Green
Write-Host "   URL: $GithubReleaseUrl" -ForegroundColor White
Write-Host "3. Actualiza el PR de WinGet con los nuevos manifiestos" -ForegroundColor Green
Write-Host ""
Write-Host "Para actualizar el PR, puedes:" -ForegroundColor Yellow
Write-Host "  - Hacer commit de los cambios en los manifiestos" -ForegroundColor White
Write-Host "  - Usar 'wingetcreate update' para actualizar automáticamente" -ForegroundColor White
Write-Host ""
