# Script para crear un certificado nuevo y firmar el paquete MSIX
# Autor: BiglexJ
# Fecha: 2026-01-20
# NOTA: Este script requiere permisos de administrador

param(
    [string]$Publisher = "CN=biglexj",
    [string]$Password = "",
    [string]$CertName = "WinTTS_Certificate"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS - Crear Certificado y Firmar MSIX" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script requiere permisos de administrador." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, ejecuta PowerShell como Administrador y vuelve a ejecutar:" -ForegroundColor White
    Write-Host "  .\scripts\create-and-sign.ps1" -ForegroundColor Green
    Write-Host ""
    exit 1
}

# Buscar signtool
$sdkVersions = @("10.0.26100.0", "10.0.22621.0")
$signToolPath = $null

foreach ($version in $sdkVersions) {
    $path = "C:\Program Files (x86)\Windows Kits\10\bin\$version\x64\signtool.exe"
    if (Test-Path $path) {
        $signToolPath = $path
        break
    }
}

if (-not $signToolPath) {
    Write-Host "❌ No se encontró signtool.exe" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SignTool encontrado: $signToolPath" -ForegroundColor Green
Write-Host ""

# Rutas
$certPath = Join-Path $ProjectRoot "$CertName.pfx"
$msixPath = Join-Path $ProjectRoot "publish\msix\WinTTS.msix"

if (-not (Test-Path $msixPath)) {
    Write-Host "❌ No se encontró el paquete MSIX en: $msixPath" -ForegroundColor Red
    Write-Host "   Ejecuta primero: .\scripts\build-msix.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Paquete MSIX encontrado: $msixPath" -ForegroundColor Green
Write-Host ""

# Paso 1: Crear un nuevo certificado
Write-Host "[1/3] Creando nuevo certificado..." -ForegroundColor Yellow

try {
    # Eliminar certificado anterior si existe
    if (Test-Path $certPath) {
        Remove-Item $certPath -Force
        Write-Host "  Certificado anterior eliminado" -ForegroundColor Gray
    }

    # Crear certificado autofirmado
    $cert = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $Publisher `
        -KeyUsage DigitalSignature `
        -FriendlyName "WinTTS Development Certificate" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

    Write-Host "✅ Certificado creado en el almacén del usuario" -ForegroundColor Green

    # Exportar a PFX
    if ($Password -eq "") {
        $securePassword = New-Object System.Security.SecureString
    } else {
        $securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
    }

    Export-PfxCertificate -Cert $cert -FilePath $certPath -Password $securePassword | Out-Null
    Write-Host "✅ Certificado exportado a: $certPath" -ForegroundColor Green

} catch {
    Write-Host "❌ Error al crear el certificado: $_" -ForegroundColor Red
    exit 1
}

# Paso 2: Firmar el paquete MSIX
Write-Host ""
Write-Host "[2/3] Firmando paquete MSIX..." -ForegroundColor Yellow

try {
    & $signToolPath sign /fd SHA256 /a /f $certPath /p $Password $msixPath

    if ($LASTEXITCODE -ne 0) {
        throw "SignTool falló con código de salida: $LASTEXITCODE"
    }

    Write-Host "✅ Paquete firmado exitosamente" -ForegroundColor Green

} catch {
    Write-Host "❌ Error al firmar el paquete: $_" -ForegroundColor Red
    exit 1
}

# Paso 3: Instalar el certificado en Trusted Root
Write-Host ""
Write-Host "[3/3] Instalando certificado en Trusted Root..." -ForegroundColor Yellow

try {
    # Importar el certificado al almacén Trusted Root
    Import-PfxCertificate `
        -FilePath $certPath `
        -CertStoreLocation Cert:\LocalMachine\Root `
        -Password $securePassword | Out-Null

    Write-Host "✅ Certificado instalado en Trusted Root" -ForegroundColor Green

} catch {
    Write-Host "❌ Error al instalar el certificado: $_" -ForegroundColor Red
    Write-Host "   Puedes instalarlo manualmente haciendo doble clic en: $certPath" -ForegroundColor Yellow
    exit 1
}

# Resumen
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Proceso completado exitosamente" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Paquete firmado: $msixPath" -ForegroundColor White
Write-Host "🔐 Certificado: $certPath" -ForegroundColor White
Write-Host "👤 Publisher: $Publisher" -ForegroundColor White
Write-Host ""
Write-Host "Ahora puedes instalar la aplicación:" -ForegroundColor Yellow
Write-Host "  Add-AppxPackage '$msixPath'" -ForegroundColor Green
Write-Host ""
Write-Host "Para desinstalar:" -ForegroundColor Yellow
Write-Host "  Get-AppxPackage *WinTTS* | Remove-AppxPackage" -ForegroundColor Green
Write-Host ""
