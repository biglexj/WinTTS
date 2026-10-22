# Script simplificado para firmar el paquete MSIX (sin permisos de admin)
# Autor: BiglexJ
# Fecha: 2026-01-20

param(
    [string]$Publisher = "CN=biglexj",
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS - Firmar MSIX (Modo Simple)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

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
$certPath = Join-Path $ProjectRoot "WinTTS_Dev_Certificate.pfx"
$msixPath = Join-Path $ProjectRoot "publish\msix\WinTTS.msix"

if (-not (Test-Path $msixPath)) {
    Write-Host "❌ No se encontró el paquete MSIX en: $msixPath" -ForegroundColor Red
    Write-Host "   Ejecuta primero: .\scripts\build-msix.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Paquete MSIX encontrado: $msixPath" -ForegroundColor Green
Write-Host ""

# Paso 1: Crear certificado en el almacén del usuario (no requiere admin)
Write-Host "[1/2] Creando certificado de desarrollo..." -ForegroundColor Yellow

try {
    # Eliminar certificado anterior si existe
    if (Test-Path $certPath) {
        Remove-Item $certPath -Force
        Write-Host "  Certificado anterior eliminado" -ForegroundColor Gray
    }

    # Crear certificado autofirmado en el almacén del usuario
    $cert = New-SelfSignedCertificate `
        -Type Custom `
        -Subject $Publisher `
        -KeyUsage DigitalSignature `
        -FriendlyName "WinTTS Development Certificate" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")

    Write-Host "✅ Certificado creado: $($cert.Thumbprint)" -ForegroundColor Green

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
Write-Host "[2/2] Firmando paquete MSIX..." -ForegroundColor Yellow

try {
    & $signToolPath sign /fd SHA256 /a /f $certPath /p $Password $msixPath 2>&1 | Out-String | Write-Host

    if ($LASTEXITCODE -ne 0) {
        throw "SignTool falló con código de salida: $LASTEXITCODE"
    }

    Write-Host "✅ Paquete firmado exitosamente" -ForegroundColor Green

} catch {
    Write-Host "❌ Error al firmar el paquete: $_" -ForegroundColor Red
    exit 1
}

# Resumen
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Paquete firmado exitosamente" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Paquete: $msixPath" -ForegroundColor White
Write-Host "🔐 Certificado: $certPath" -ForegroundColor White
Write-Host "👤 Publisher: $Publisher" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Para instalar localmente necesitas:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Instalar el certificado (requiere permisos de admin):" -ForegroundColor White
Write-Host "   - Haz doble clic en: $certPath" -ForegroundColor Cyan
Write-Host "   - Click en 'Instalar certificado...'" -ForegroundColor Cyan
Write-Host "   - Selecciona 'Equipo local' (requiere admin)" -ForegroundColor Cyan
Write-Host "   - Selecciona 'Colocar todos los certificados en el siguiente almacén'" -ForegroundColor Cyan
Write-Host "   - Click en 'Examinar' y selecciona 'Entidades de certificación raíz de confianza'" -ForegroundColor Cyan
Write-Host "   - Click en 'Siguiente' y 'Finalizar'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Instalar la aplicación:" -ForegroundColor White
Write-Host "   Add-AppxPackage '$msixPath'" -ForegroundColor Green
Write-Host ""
Write-Host "O MEJOR AÚN: Sube el paquete directamente a Microsoft Store" -ForegroundColor Yellow
Write-Host "(Microsoft lo firmará automáticamente con su certificado oficial)" -ForegroundColor Yellow
Write-Host ""
