# Script para agregar Windows SDK al PATH
# Autor: BiglexJ
# Fecha: 2026-01-20
# NOTA: Este script requiere permisos de administrador

param(
    [string]$SdkVersion = "10.0.26100.0",
    [string]$Architecture = "x64"
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Agregar Windows SDK al PATH del Sistema" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script requiere permisos de administrador." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor White
    Write-Host "  1. Ejecuta PowerShell como Administrador y vuelve a ejecutar este script" -ForegroundColor White
    Write-Host "  2. O agrega manualmente esta ruta al PATH del sistema:" -ForegroundColor White
    Write-Host ""
    Write-Host "     C:\Program Files (x86)\Windows Kits\10\bin\$SdkVersion\$Architecture" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pasos para agregar manualmente:" -ForegroundColor Yellow
    Write-Host "  1. Presiona Win + X y selecciona 'Sistema'" -ForegroundColor White
    Write-Host "  2. Click en 'Configuración avanzada del sistema'" -ForegroundColor White
    Write-Host "  3. Click en 'Variables de entorno'" -ForegroundColor White
    Write-Host "  4. En 'Variables del sistema', selecciona 'Path' y click en 'Editar'" -ForegroundColor White
    Write-Host "  5. Click en 'Nuevo' y pega la ruta de arriba" -ForegroundColor White
    Write-Host "  6. Click en 'Aceptar' en todas las ventanas" -ForegroundColor White
    Write-Host "  7. Reinicia PowerShell para que tome efecto" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Ruta del SDK
$sdkPath = "C:\Program Files (x86)\Windows Kits\10\bin\$SdkVersion\$Architecture"

# Verificar que la ruta existe
if (-not (Test-Path $sdkPath)) {
    Write-Host "❌ Error: No se encontró el SDK en: $sdkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Versiones disponibles:" -ForegroundColor Yellow
    Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Directory | Select-Object Name
    exit 1
}

Write-Host "✅ SDK encontrado en: $sdkPath" -ForegroundColor Green

# Verificar si makeappx.exe existe
$makeAppxPath = Join-Path $sdkPath "makeappx.exe"
if (-not (Test-Path $makeAppxPath)) {
    Write-Host "❌ Error: No se encontró makeappx.exe en el SDK" -ForegroundColor Red
    exit 1
}

Write-Host "✅ makeappx.exe encontrado" -ForegroundColor Green
Write-Host ""

# Obtener el PATH actual del sistema
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Verificar si ya está en el PATH
if ($currentPath -like "*$sdkPath*") {
    Write-Host "ℹ️  La ruta ya está en el PATH del sistema" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para que tome efecto en esta sesión, ejecuta:" -ForegroundColor Yellow
    Write-Host "  `$env:Path += ';$sdkPath'" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Agregar al PATH
Write-Host "Agregando al PATH del sistema..." -ForegroundColor Yellow

try {
    $newPath = "$currentPath;$sdkPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    
    Write-Host "✅ Ruta agregada exitosamente al PATH del sistema" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Debes reiniciar PowerShell para que tome efecto" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O ejecuta este comando en la sesión actual:" -ForegroundColor Yellow
    Write-Host "  `$env:Path += ';$sdkPath'" -ForegroundColor White
    Write-Host ""
    
    # Verificar
    Write-Host "Verificando..." -ForegroundColor Yellow
    $updatedPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    
    if ($updatedPath -like "*$sdkPath*") {
        Write-Host "✅ Verificación exitosa" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se pudo verificar. Reinicia PowerShell e intenta ejecutar 'makeappx'" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error al agregar al PATH: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Proceso completado" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
