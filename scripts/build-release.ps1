# Script Maestro de Publicación y Empaquetado — WinTTS (Rust + Tauri 2.0).
# Genera Ejecutable Portable (.exe), Paquete de Windows Store (.msix) y Hashes SHA-256.
# Autor: biglexj (2026)

[CmdletBinding()]
param(
    [string]$Version = "2.0.0",
    [string]$CertificatePath,
    [string]$CertificatePassword,
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot "release"
$buildMsixScript = Join-Path $PSScriptRoot "build-msix.ps1"
$buildExeScript = Join-Path $PSScriptRoot "build-exe.ps1"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🚀 WinTTS v$Version — Flujo Completo de Release" -ForegroundColor Cyan
Write-Host "  Plataforma: Rust + Tauri 2.0 / Windows x64" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Pruebas Automatizadas
if (-not $SkipTests) {
    Write-Host "[1/4] Ejecutando pruebas unitarias de Rust..." -ForegroundColor Yellow
    Push-Location (Join-Path $projectRoot "src-tauri")
    try {
        cargo test --lib
        if ($LASTEXITCODE -ne 0) { throw "Las pruebas de Rust fallaron." }
        Write-Host "  ✅ Todas las pruebas unitarias pasaron con éxito." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[1/4] Pruebas omitidas (-SkipTests activo)." -ForegroundColor Gray
}

# 2. Compilar Frontend y Backend Release
Write-Host ""
Write-Host "[2/4] Compilando Frontend y Backend Release..." -ForegroundColor Yellow
Push-Location $projectRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build falló." }
} finally {
    Pop-Location
}

Push-Location (Join-Path $projectRoot "src-tauri")
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) { throw "cargo build --release falló." }
} finally {
    Pop-Location
}

# 3. Generar Ejecutable Portable
Write-Host ""
Write-Host "[3/4] Generando Ejecutable Portable..." -ForegroundColor Yellow
& $buildExeScript -Version $Version -SkipBuild

# 4. Generar Paquete MSIX
Write-Host ""
Write-Host "[4/4] Generando Paquete MSIX para Microsoft Store..." -ForegroundColor Yellow
$msixParams = @{
    Version = $Version
    SkipBuild = $true
}
if ($CertificatePath) {
    $msixParams["CertificatePath"] = $CertificatePath
}
if ($CertificatePassword) {
    $msixParams["CertificatePassword"] = $CertificatePassword
}
& $buildMsixScript @msixParams

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🎉 ¡Release v$Version Completado Exitosamente!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📁 Directorio de artefactos: $releaseDir" -ForegroundColor White
Get-ChildItem -LiteralPath $releaseDir | Format-Table Name, Length, LastWriteTime
Write-Host ""
