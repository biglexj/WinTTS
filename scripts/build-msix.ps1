# Script para compilar y generar el paquete MSIX de WinTTS
# Autor: biglexj
# Fecha: 2026-01-20

param(
    [string]$Configuration = "Release",
    [string]$Platform = "x64",
    [string]$SdkVersion = "10.0.26100.0"
)

# Configuración
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectName = "WinTTS"
$OutputDir = Join-Path $ProjectRoot "publish\msix"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS - Generador de Paquetes MSIX" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existan las herramientas necesarias
Write-Host "[1/6] Verificando herramientas..." -ForegroundColor Yellow

# Buscar MSBuild
$msbuildPath = & "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe" `
    -latest -requires Microsoft.Component.MSBuild -find MSBuild\**\Bin\MSBuild.exe `
    -prerelease | Select-Object -First 1

if (-not $msbuildPath) {
    Write-Host "❌ No se encontró MSBuild. Asegúrate de tener Visual Studio Build Tools instalado." -ForegroundColor Red
    exit 1
}

Write-Host "✅ MSBuild encontrado: $msbuildPath" -ForegroundColor Green

# Buscar MakeAppx
$sdkBinPath = "C:\Program Files (x86)\Windows Kits\10\bin\$SdkVersion\x64"
$makeAppxPath = Join-Path $sdkBinPath "makeappx.exe"
$signToolPath = Join-Path $sdkBinPath "signtool.exe"

if (-not (Test-Path $makeAppxPath)) {
    Write-Host "❌ No se encontró makeappx.exe en: $sdkBinPath" -ForegroundColor Red
    Write-Host "   Versiones de SDK disponibles:" -ForegroundColor Yellow
    Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Directory | Select-Object Name
    exit 1
}

Write-Host "✅ MakeAppx encontrado: $makeAppxPath" -ForegroundColor Green
Write-Host "✅ SignTool encontrado: $signToolPath" -ForegroundColor Green

# Limpiar compilaciones anteriores
Write-Host ""
Write-Host "[2/6] Limpiando compilaciones anteriores..." -ForegroundColor Yellow

$binPath = Join-Path $ProjectRoot "bin"
$objPath = Join-Path $ProjectRoot "obj"

if (Test-Path $binPath) {
    Remove-Item $binPath -Recurse -Force
    Write-Host "✅ Carpeta bin limpiada" -ForegroundColor Green
}

if (Test-Path $objPath) {
    Remove-Item $objPath -Recurse -Force
    Write-Host "✅ Carpeta obj limpiada" -ForegroundColor Green
}

# Crear directorio de salida
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Compilar el proyecto
Write-Host ""
Write-Host "[3/6] Compilando proyecto..." -ForegroundColor Yellow

$projectFile = Join-Path $ProjectRoot "$ProjectName.csproj"

& $msbuildPath $projectFile `
    /p:Configuration=$Configuration `
    /p:Platform=AnyCPU `
    /p:PublishProfile=FolderProfile `
    /t:Restore,Build `
    /v:minimal

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Proyecto compilado exitosamente" -ForegroundColor Green

# Preparar archivos para el paquete
Write-Host ""
Write-Host "[4/6] Preparando archivos para el paquete..." -ForegroundColor Yellow

$publishDir = Join-Path $ProjectRoot "bin\$Configuration\net10.0-windows"
$packageDir = Join-Path $OutputDir "package"

if (Test-Path $packageDir) {
    Remove-Item $packageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $packageDir -Force | Out-Null

# Copiar archivos compilados
Copy-Item -Path "$publishDir\*" -Destination $packageDir -Recurse -Force

# Copiar manifest y actualizar tokens
$manifestSource = Join-Path $ProjectRoot "Package.appxmanifest"
$manifestDest = Join-Path $packageDir "AppxManifest.xml"
$manifestContent = Get-Content $manifestSource -Raw
$manifestContent = $manifestContent -replace '\$targetnametoken\$', $ProjectName
$manifestContent | Set-Content $manifestDest -Encoding UTF8

# Copiar imágenes
$imageSourceDir = Join-Path $ProjectRoot "Image"
$imageDestDir = Join-Path $packageDir "Image"

if (Test-Path $imageSourceDir) {
    Copy-Item -Path $imageSourceDir -Destination $packageDir -Recurse -Force
}

Write-Host "✅ Archivos preparados en: $packageDir" -ForegroundColor Green

# Generar el paquete MSIX
Write-Host ""
Write-Host "[5/6] Generando paquete MSIX..." -ForegroundColor Yellow

$msixPath = Join-Path $OutputDir "$ProjectName.msix"

if (Test-Path $msixPath) {
    Remove-Item $msixPath -Force
}

& $makeAppxPath pack /d $packageDir /p $msixPath /o

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar el paquete MSIX" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Paquete MSIX generado: $msixPath" -ForegroundColor Green

# Firmar el paquete
Write-Host ""
Write-Host "[6/6] Firmando paquete MSIX..." -ForegroundColor Yellow

$certPath = Join-Path $ProjectRoot "WinTTS_Certificate.pfx"

if (-not (Test-Path $certPath)) {
    Write-Host "⚠️  No se encontró el certificado en: $certPath" -ForegroundColor Yellow
    Write-Host "   El paquete MSIX se generó pero no está firmado." -ForegroundColor Yellow
    Write-Host "   Para firmarlo manualmente, ejecuta: .\scripts\sign-msix.ps1" -ForegroundColor Yellow
} else {
    & $signToolPath sign /fd SHA256 /a /f $certPath /p "" $msixPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Error al firmar el paquete" -ForegroundColor Yellow
        Write-Host "   El paquete se generó pero no está firmado." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Paquete firmado exitosamente" -ForegroundColor Green
    }
}

# Resumen
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Proceso completado exitosamente" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Paquete MSIX: $msixPath" -ForegroundColor White
Write-Host "📁 Tamaño: $([math]::Round((Get-Item $msixPath).Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Instalar el certificado: .\scripts\install-certificate.ps1" -ForegroundColor White
Write-Host "  2. Instalar la aplicación: Add-AppxPackage '$msixPath'" -ForegroundColor White
Write-Host "  3. O subir a Microsoft Partner Center para publicar en la Store" -ForegroundColor White
Write-Host ""
