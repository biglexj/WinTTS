# Script para instalar el certificado de desarrollo (requiere admin)
# Autor: biglexj
# Fecha: 2026-01-20

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot | Split-Path

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Instalar Certificado de Desarrollo" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script requiere permisos de administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Ejecuta PowerShell como Administrador y ejecuta:" -ForegroundColor Yellow
    Write-Host "  cd D:\Proyectos\biglexj\WinTTS" -ForegroundColor White
    Write-Host "  .\scripts\install-dev-cert.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "O con sudo:" -ForegroundColor Yellow
    Write-Host "  sudo pwsh -File .\scripts\install-dev-cert.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

$certPath = Join-Path $ProjectRoot "WinTTS_Dev_Certificate.pfx"

if (-not (Test-Path $certPath)) {
    Write-Host "❌ No se encontró el certificado: $certPath" -ForegroundColor Red
    Write-Host "   Ejecuta primero: .\scripts\sign-package.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📜 Certificado encontrado: $certPath" -ForegroundColor Green
Write-Host ""

try {
    # Importar el certificado al almacén Trusted Root
    Write-Host "Instalando certificado en 'Entidades de certificación raíz de confianza'..." -ForegroundColor Yellow
    
    $securePassword = New-Object System.Security.SecureString
    
    Import-PfxCertificate `
        -FilePath $certPath `
        -CertStoreLocation Cert:\LocalMachine\Root `
        -Password $securePassword `
        -Exportable | Out-Null
    
    Write-Host "✅ Certificado instalado exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes instalar la aplicación:" -ForegroundColor Yellow
    Write-Host "  Add-AppxPackage '.\publish\msix\WinTTS.msix'" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Error al instalar el certificado: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta instalarlo manualmente:" -ForegroundColor Yellow
    Write-Host "  1. Haz doble clic en: $certPath" -ForegroundColor White
    Write-Host "  2. Selecciona 'Equipo local'" -ForegroundColor White
    Write-Host "  3. Deja la contraseña en blanco" -ForegroundColor White
    Write-Host "  4. Selecciona 'Entidades de certificación raíz de confianza'" -ForegroundColor White
    Write-Host ""
    exit 1
}
