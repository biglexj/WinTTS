# Genera el ejecutable portable de WinTTS en Release (Rust + Tauri 2.0).
# Autor: biglexj (2026)

[CmdletBinding()]
param(
    [string]$Version = "2.0.0",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot "release"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS v$Version — Generador de Ejecutable Portable" -ForegroundColor Cyan
Write-Host "  Plataforma: Rust + Tauri 2.0 (Windows x64)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "[1/3] Compilando Frontend (Vite)..." -ForegroundColor Yellow
    Push-Location $projectRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build falló." }
    } finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "[2/3] Compilando Backend Rust en modo Release..." -ForegroundColor Yellow
    $tauriDir = Join-Path $projectRoot "src-tauri"
    Push-Location $tauriDir
    try {
        cargo build --release
        if ($LASTEXITCODE -ne 0) { throw "cargo build --release falló." }
    } finally {
        Pop-Location
    }
}

$releaseExe = Join-Path $projectRoot "src-tauri\target\release\wintts.exe"
if (-not (Test-Path -LiteralPath $releaseExe)) {
    throw "No se encontró el ejecutable en: $releaseExe"
}

Write-Host ""
Write-Host "[3/3] Copiando ejecutable a release/..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$artifactName = "WinTTS-Windows-x64-$Version.exe"
$destExe = Join-Path $releaseDir $artifactName

Copy-Item -LiteralPath $releaseExe -Destination $destExe -Force

$hash = (Get-FileHash -LiteralPath $destExe -Algorithm SHA256).Hash.ToLowerInvariant()
$hashLine = "$hash  $artifactName"
$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"

# Actualizar o anexar hash
if (Test-Path -LiteralPath $hashPath) {
    $existing = Get-Content -LiteralPath $hashPath | Where-Object { $_ -notmatch [regex]::Escape($artifactName) }
    $updated = @($existing; $hashLine)
    Set-Content -LiteralPath $hashPath -Value $updated -Encoding utf8
} else {
    Set-Content -LiteralPath $hashPath -Value $hashLine -Encoding utf8
}

$fileSizeMB = [math]::Round((Get-Item $destExe).Length / 1MB, 2)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Ejecutable Portable generado con éxito" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📦 Archivo: $artifactName ($fileSizeMB MB)" -ForegroundColor White
Write-Host "📂 Destino: $destExe" -ForegroundColor White
Write-Host "🔑 SHA-256: $hash" -ForegroundColor White
Write-Host ""
