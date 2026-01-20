# Script para instalar el certificado de WinTTS
# Ejecutar como Administrador

param(
    [string]$CertPath = ".\WinTTS_Certificate.pfx",
    [string]$Password = "WinTTS2026"
)

Write-Host "=== Instalando Certificado de WinTTS ===" -ForegroundColor Cyan

if (-not (Test-Path $CertPath)) {
    Write-Host "`n❌ ERROR: No se encontró el certificado: $CertPath" -ForegroundColor Red
    exit 1
}

# Convertir password a SecureString
$securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText

# Instalar certificado en Trusted Root
Write-Host "`nInstalando certificado en Trusted Root..." -ForegroundColor Yellow
Import-PfxCertificate -FilePath $CertPath -CertStoreLocation Cert:\LocalMachine\Root -Password $securePassword

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "`n✅ ¡Certificado instalado exitosamente!" -ForegroundColor Green
    Write-Host "`nAhora puedes instalar WinTTS.msix sin advertencias de seguridad." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ ERROR al instalar el certificado" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script como Administrador." -ForegroundColor Yellow
    exit 1
}
