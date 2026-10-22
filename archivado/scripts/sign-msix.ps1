# Script para firmar el MSIX de WinTTS
# Ejecutar como Administrador

param(
    [string]$MsixPath = ".\publish\WinTTS.msix",
    [string]$CertPath = ".\WinTTS_Certificate.pfx",
    [string]$Password = "WinTTS2026"
)

Write-Host "=== Firmando MSIX de WinTTS ===" -ForegroundColor Cyan

# Buscar signtool.exe
Write-Host "`nBuscando signtool.exe..." -ForegroundColor Yellow
$signtool = Get-ChildItem "C:\Program Files (x86)\Windows Kits\" -Recurse -Filter "signtool.exe" -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -match "x64" } | 
    Select-Object -First 1 -ExpandProperty FullName

if (-not $signtool) {
    Write-Host "`n❌ ERROR: No se encontró signtool.exe" -ForegroundColor Red
    Write-Host "`nPor favor, instala el Windows SDK desde:" -ForegroundColor Yellow
    Write-Host "https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/" -ForegroundColor Cyan
    Write-Host "`nO usa la opción de subir el MSIX sin firmar a la Microsoft Store." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Encontrado: $signtool" -ForegroundColor Green

# Verificar que existen los archivos
if (-not (Test-Path $MsixPath)) {
    Write-Host "`n❌ ERROR: No se encontró el archivo MSIX: $MsixPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $CertPath)) {
    Write-Host "`n❌ ERROR: No se encontró el certificado: $CertPath" -ForegroundColor Red
    Write-Host "Ejecuta primero el script de creación de certificado." -ForegroundColor Yellow
    exit 1
}

# Firmar el MSIX
Write-Host "`nFirmando el MSIX..." -ForegroundColor Yellow
& $signtool sign /fd SHA256 /a /f $CertPath /p $Password $MsixPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ ¡MSIX firmado exitosamente!" -ForegroundColor Green
    Write-Host "`nAhora puedes instalar el MSIX haciendo doble clic en:" -ForegroundColor Cyan
    Write-Host "  $MsixPath" -ForegroundColor White
    Write-Host "`nNOTA: Si es la primera vez, necesitas instalar el certificado:" -ForegroundColor Yellow
    Write-Host "  .\install-certificate.ps1" -ForegroundColor White
} else {
    Write-Host "`n❌ ERROR al firmar el MSIX" -ForegroundColor Red
    exit 1
}
