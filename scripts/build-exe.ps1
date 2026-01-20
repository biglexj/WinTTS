# Script para generar ejecutable portable de WinTTS
# Autor: biglexj
# Fecha: 2026-01-20

param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64",
    [switch]$SelfContained = $true,
    [switch]$SingleFile = $true
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ProjectName = "WinTTS"
$OutputDir = Join-Path $ProjectRoot "publish\exe"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS - Generador de Ejecutable Portable" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que dotnet esté disponible
Write-Host "[1/3] Verificando herramientas..." -ForegroundColor Yellow

try {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET SDK encontrado: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ No se encontró .NET SDK" -ForegroundColor Red
    Write-Host "   Descárgalo desde: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    exit 1
}

# Limpiar compilaciones anteriores
Write-Host ""
Write-Host "[2/3] Limpiando compilaciones anteriores..." -ForegroundColor Yellow

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

# Compilar y publicar
Write-Host ""
Write-Host "[3/3] Compilando y generando ejecutable portable..." -ForegroundColor Yellow
Write-Host ""

$projectFile = Join-Path $ProjectRoot "$ProjectName.csproj"

# Construir el comando de publicación
$publishArgs = @(
    "publish"
    $projectFile
    "-c", $Configuration
    "-r", $Runtime
    "--output", $OutputDir
)

if ($SelfContained) {
    $publishArgs += "--self-contained", "true"
    Write-Host "  ℹ️  Modo: Self-contained (incluye .NET runtime)" -ForegroundColor Cyan
} else {
    $publishArgs += "--self-contained", "false"
    Write-Host "  ℹ️  Modo: Framework-dependent (requiere .NET instalado)" -ForegroundColor Cyan
}

if ($SingleFile) {
    $publishArgs += "-p:PublishSingleFile=true"
    $publishArgs += "-p:IncludeNativeLibrariesForSelfExtract=true"
    $publishArgs += "-p:PublishReadyToRun=true"
    Write-Host "  ℹ️  Empaquetado: Archivo único (.exe)" -ForegroundColor Cyan
}

Write-Host ""

# Ejecutar dotnet publish
& dotnet @publishArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
    exit 1
}

# Verificar el resultado
$exePath = Join-Path $OutputDir "$ProjectName.exe"

if (-not (Test-Path $exePath)) {
    Write-Host ""
    Write-Host "❌ No se generó el ejecutable" -ForegroundColor Red
    exit 1
}

# Obtener información del archivo
$exeInfo = Get-Item $exePath
$sizeInMB = [math]::Round($exeInfo.Length / 1MB, 2)

# Resumen
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Ejecutable generado exitosamente" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Ejecutable: $exePath" -ForegroundColor White
Write-Host "📁 Tamaño: $sizeInMB MB" -ForegroundColor White
Write-Host "🖥️  Runtime: $Runtime" -ForegroundColor White
Write-Host "⚙️  Configuración: $Configuration" -ForegroundColor White
Write-Host ""

if ($SelfContained) {
    Write-Host "✅ Este ejecutable incluye .NET runtime" -ForegroundColor Green
    Write-Host "   Los usuarios NO necesitan tener .NET instalado" -ForegroundColor White
} else {
    Write-Host "⚠️  Este ejecutable requiere .NET runtime instalado" -ForegroundColor Yellow
    Write-Host "   Los usuarios deben tener .NET 10.0 o superior" -ForegroundColor White
}

Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Probar el ejecutable: & '$exePath'" -ForegroundColor White
Write-Host "  2. Compartir el archivo con usuarios" -ForegroundColor White
Write-Host "  3. O crear un instalador con Inno Setup" -ForegroundColor White
Write-Host ""

# Listar todos los archivos generados
Write-Host "Archivos generados:" -ForegroundColor Yellow
Get-ChildItem $OutputDir | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize
