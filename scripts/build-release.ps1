# Script Maestro de Publicación y Empaquetado — WinTTS (Rust + Tauri 2.0).
# Genera Instalador Oficial Inno Setup (.exe), Paquete de Microsoft Store (.msix),
# Hashes SHA-256 (SHA256SUMS.txt), Metadatos (BUILD_INFO.json) y Manifiestos WinGet.
# Autor: biglexj (2026)

[CmdletBinding()]
param(
    [string]$Version = "2.0.0",
    [string]$CertificatePath,
    [string]$CertificatePassword,
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot "release"
$buildInstallerScript = Join-Path $PSScriptRoot "packaging\Build-Installer.ps1"
$buildMsixScript = Join-Path $PSScriptRoot "build-msix.ps1"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🚀 WinTTS v$Version — Flujo Completo de Release" -ForegroundColor Cyan
Write-Host "  Plataforma: Rust + Tauri 2.0 / Windows x64" -ForegroundColor Cyan
Write-Host "  Canales: Inno Setup (.exe) + Microsoft Store (.msix)" -ForegroundColor Cyan
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

# 2. Generar Instalador Oficial Inno Setup (.exe)
Write-Host ""
Write-Host "[2/4] Generando Instalador Oficial de Windows (Inno Setup)..." -ForegroundColor Yellow
$installerParams = @{
    Version = $Version
}
if ($SkipBuild) {
    $installerParams["SkipAppBuild"] = $true
}
& $buildInstallerScript @installerParams
if ($LASTEXITCODE -ne 0) {
    throw "Falló la generación del instalador Inno Setup."
}

# 3. Generar Paquete MSIX para Microsoft Store (.msix)
Write-Host ""
Write-Host "[3/4] Generando Paquete MSIX para Microsoft Store..." -ForegroundColor Yellow
$msixParams = @{
    Version = $Version
    SkipBuild = $true # Reutiliza el binario ya compilado en target\release
}
if ($CertificatePath) {
    $msixParams["CertificatePath"] = $CertificatePath
}
if ($CertificatePassword) {
    $msixParams["CertificatePassword"] = $CertificatePassword
}
& $buildMsixScript @msixParams
if ($LASTEXITCODE -ne 0) {
    throw "Falló la generación del paquete MSIX para Microsoft Store."
}

# 4. Generar Metadatos BUILD_INFO.json y verificar SHA256SUMS.txt
Write-Host ""
Write-Host "[4/4] Consolidando metadatos de lanzamiento (BUILD_INFO.json)..." -ForegroundColor Yellow

$gitCommit = ""
$isClean = $false
try {
    $gitCommit = (& git rev-parse HEAD).Trim()
    $gitStatus = (& git status --porcelain).Trim()
    $isClean = [string]::IsNullOrEmpty($gitStatus)
} catch {
    Write-Warning "No se pudo determinar el estado de Git."
}

$exeFile = Join-Path $releaseDir "WinTTS-Setup-$Version.exe"
$msixFile = Join-Path $releaseDir "WinTTS-Windows-x64-$Version.msix"

$files = @()
if (Test-Path -LiteralPath $exeFile) {
    $exeItem = Get-Item $exeFile
    $exeHash = (Get-FileHash -LiteralPath $exeFile -Algorithm SHA256).Hash.ToLowerInvariant()
    $files += @{
        name = $exeItem.Name
        type = "installer_inno"
        sizeBytes = $exeItem.Length
        sha256 = $exeHash
    }
}
if (Test-Path -LiteralPath $msixFile) {
    $msixItem = Get-Item $msixFile
    $msixHash = (Get-FileHash -LiteralPath $msixFile -Algorithm SHA256).Hash.ToLowerInvariant()
    $files += @{
        name = $msixItem.Name
        type = "package_msix"
        sizeBytes = $msixItem.Length
        sha256 = $msixHash
    }
}

$buildInfo = [ordered]@{
    version = $Version
    product = "WinTTS"
    bundleMode = "inno+msix"
    appGitCommit = $gitCommit
    appSourceClean = $isClean
    buildDate = (Get-Date).ToString("o")
    files = $files
}

$buildInfoJson = $buildInfo | ConvertTo-Json -Depth 5
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $releaseDir "BUILD_INFO.json"), ($buildInfoJson + "`n"), $utf8NoBom)
Write-Host "  ✅ BUILD_INFO.json generado exitosamente." -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🎉 ¡Release v$Version Completado Exitosamente!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📁 Directorio de artefactos: $releaseDir" -ForegroundColor White
Get-ChildItem -LiteralPath $releaseDir | Format-Table Name, Length, LastWriteTime
Write-Host ""
