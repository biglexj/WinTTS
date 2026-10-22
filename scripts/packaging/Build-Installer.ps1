<#
.SYNOPSIS
    Genera el instalador de Windows (Inno Setup) de WinTTS con la plantilla
    compartida "Biglex Modern 2.0".

.DESCRIPTION
    Pasos:
      1. Verifica que los archivos de empaquetado no caen en rutas ignoradas
         por .gitignore (git check-ignore -v).
      2. Regenera packaging\windows\version.iss con la version real.
      3. Compila la app con Tauri en Windows sin bundle (--no-bundle), de modo
         que no se toca el empaquetado de macOS/Linux ni tauri.conf.json.
      4. Prepara el staging con el ejecutable real y sus recursos.
      5. Invoca ISCC.exe y deja el instalador en release\.

    No publica nada, no hace commit y no toca los bundles de otras
    plataformas.

.EXAMPLE
    pwsh -ExecutionPolicy Bypass -File scripts\packaging\Build-Installer.ps1
#>
[CmdletBinding()]
param(
    # Version a empaquetar. Por defecto, la de src-tauri\tauri.conf.json.
    [string]$Version,

    # Ruta a ISCC.exe. Si se omite, se busca en la ruta conocida y luego en PATH.
    [string]$IsccPath,

    # No recompila la app; reutiliza el binario ya existente en target\release.
    [switch]$SkipAppBuild
)

$ErrorActionPreference = "Stop"
# No se activa $PSNativeCommandUseErrorActionPreference: git check-ignore usa
# el codigo 1 para indicar "no ignorado", que no es un error.

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$packagingDir = Join-Path $projectRoot "packaging\windows"
$setupIss = Join-Path $packagingDir "setup.iss"
$versionIss = Join-Path $packagingDir "version.iss"
$identityIss = Join-Path $packagingDir "identity.iss"
$tauriConf = Join-Path $projectRoot "src-tauri\tauri.conf.json"
$targetRelease = Join-Path $projectRoot "src-tauri\target\release"
$stagingDir = Join-Path $projectRoot "src-tauri\target\inno-stage"
$releaseDir = Join-Path $projectRoot "release"
$wingetInstallerManifest = Join-Path $projectRoot "packaging\winget\biglexj.WinTTS.installer.yaml"

function Write-Step([string]$Text) {
    Write-Host ""
    Write-Host "==> $Text" -ForegroundColor Cyan
}

function Write-Ok([string]$Text) {
    Write-Host "    [OK] $Text" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 1. Preflight: los archivos de este trabajo deben quedar versionados.
# ---------------------------------------------------------------------------
function Assert-Versioned {
    param([string[]]$RelativePaths)

    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) {
        Write-Warning "git no esta disponible: no se puede verificar check-ignore."
        return
    }
    foreach ($rel in $RelativePaths) {
        $output = & git -C $projectRoot check-ignore -v -- $rel 2>$null
        if ($LASTEXITCODE -eq 0) {
            throw "Ruta ignorada por .gitignore: '$rel' (regla: $output). " +
                  "Replica la integracion en una ruta versionada; no cambies la politica de ignore."
        }
    }
    Write-Ok "Las rutas de empaquetado no estan ignoradas por .gitignore."
}

Write-Step "WinTTS - Empaquetador Inno Setup (Biglex Modern 2.0)"
Write-Host "    Repositorio: $projectRoot"

Assert-Versioned @(
    "packaging\windows\setup.iss",
    "packaging\windows\BiglexModernUI.iss",
    "packaging\windows\identity.iss",
    "packaging\windows\version.iss",
    "packaging\windows\MIGRATION.md",
    "packaging\winget\biglexj.WinTTS.installer.yaml",
    "scripts\packaging\Build-Installer.ps1"
)

# ---------------------------------------------------------------------------
# 2. Version real (fuente de verdad: tauri.conf.json).
# ---------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $tauriConf)) {
    throw "No se encontro la configuracion de Tauri: $tauriConf"
}
$tauri = Get-Content -LiteralPath $tauriConf -Raw | ConvertFrom-Json
$appVersion = if ($Version) { $Version } else { [string]$tauri.version }
if ([string]::IsNullOrWhiteSpace($appVersion)) {
    throw "No se pudo determinar la version de la aplicacion."
}
Write-Step "Version de la aplicacion: $appVersion"

$pkg = Get-Content -LiteralPath (Join-Path $projectRoot "package.json") -Raw | ConvertFrom-Json
if ([string]$pkg.version -ne $appVersion) {
    Write-Warning "package.json declara '$($pkg.version)' y tauri.conf.json '$appVersion'."
}

# ---------------------------------------------------------------------------
# 3. Regenerar version.iss
# ---------------------------------------------------------------------------
$versionBody = @"
; ---------------------------------------------------------------------------
; version.iss - generada por el script de build con la version real de la app.
; El script de build reescribe este archivo en cada release:
;   #define MyAppVersion "$appVersion"
; No editar a mano: lo regenera scripts\packaging\Build-Installer.ps1
; ---------------------------------------------------------------------------
#define MyAppVersion "$appVersion"
"@
[System.IO.File]::WriteAllText($versionIss, ($versionBody -replace "`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Ok "Regenerado: $versionIss"

# ---------------------------------------------------------------------------
# 4. Compilar la app (Tauri, Windows, sin bundle)
# ---------------------------------------------------------------------------
if (-not $SkipAppBuild) {
    Write-Step "Compilando WinTTS con Tauri (--no-bundle)"
    # Se invoca el CLI de Tauri del propio repo: en esta maquina el shim
    # npm.ps1 no encadena bien los argumentos con "--".
    $tauriCli = Join-Path $projectRoot "node_modules\.bin\tauri.cmd"
    if (-not (Test-Path -LiteralPath $tauriCli)) {
        throw "No se encontro el CLI de Tauri en $tauriCli. Ejecuta 'npm install' en el repo."
    }
    Push-Location $projectRoot
    try {
        & $tauriCli build --ci --no-bundle
        if ($LASTEXITCODE -ne 0) { throw "tauri build --no-bundle fallo (exit $LASTEXITCODE)." }
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Compilacion de la app omitida (-SkipAppBuild)"
}

# ---------------------------------------------------------------------------
# 5. Staging del payload
# ---------------------------------------------------------------------------
Write-Step "Preparando el staging del payload"
if (Test-Path -LiteralPath $stagingDir) {
    # El staging solo contiene ficheros planos: se limpian sin borrado recursivo.
    Get-ChildItem -LiteralPath $stagingDir -File | Remove-Item -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

# Nombre real del binario: el crate Rust se llama "wintts".
$exeCandidates = @("wintts.exe", "WinTTS.exe")
$appExe = $null
foreach ($candidate in $exeCandidates) {
    $probe = Join-Path $targetRelease $candidate
    if (Test-Path -LiteralPath $probe) { $appExe = $probe; break }
}
if (-not $appExe) {
    $fallback = Get-ChildItem -LiteralPath $targetRelease -Filter "*.exe" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^(?i)wintts' } | Select-Object -First 1
    if ($fallback) { $appExe = $fallback.FullName }
}
if (-not $appExe) {
    throw "No se encontro el ejecutable de WinTTS en $targetRelease. Compila la app antes de empaquetar."
}
Copy-Item -LiteralPath $appExe -Destination (Join-Path $stagingDir (Split-Path -Leaf $appExe)) -Force
Write-Ok "Ejecutable: $(Split-Path -Leaf $appExe)"

# WebView2Loader.dll solo se incluye si el build lo produce (vinculacion dinamica).
$webviewLoader = Join-Path $targetRelease "WebView2Loader.dll"
if (Test-Path -LiteralPath $webviewLoader) {
    Copy-Item -LiteralPath $webviewLoader -Destination (Join-Path $stagingDir "WebView2Loader.dll") -Force
    Write-Ok "Recurso: WebView2Loader.dll"
}

$staged = Get-ChildItem -LiteralPath $stagingDir -File | ForEach-Object { "$($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" }
Write-Host "    Staging: $stagingDir -> $($staged -join ', ')"

# ---------------------------------------------------------------------------
# 6. Localizar ISCC.exe
# ---------------------------------------------------------------------------
if (-not $IsccPath) {
    $candidates = @(
        "D:\Proyectos\biglexj\Scripts\tools\InnoSetup\ISCC.exe",
        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        "C:\Program Files\Inno Setup 6\ISCC.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) { $IsccPath = $candidate; break }
    }
}
if (-not $IsccPath) {
    $onPath = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($onPath) { $IsccPath = $onPath.Source }
}
if (-not $IsccPath -or -not (Test-Path -LiteralPath $IsccPath)) {
    throw "No se encontro ISCC.exe (Inno Setup 6). Indica la ruta con -IsccPath."
}
Write-Ok "Compilador Inno Setup: $IsccPath"

# ---------------------------------------------------------------------------
# 7. Compilar el instalador
# ---------------------------------------------------------------------------
Write-Step "Compilando el instalador"
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
& $IsccPath $setupIss
if ($LASTEXITCODE -ne 0) { throw "ISCC fallo (exit $LASTEXITCODE)." }

$installer = Join-Path $releaseDir "WinTTS-Setup-$appVersion.exe"
if (-not (Test-Path -LiteralPath $installer)) {
    $produced = Get-ChildItem -LiteralPath $releaseDir -Filter "WinTTS-Setup-*.exe" -File |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $produced) { throw "ISCC termino sin error pero no hay instalador en $releaseDir." }
    $installer = $produced.FullName
}

$installerHash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToUpperInvariant()
$installerSize = [math]::Round((Get-Item -LiteralPath $installer).Length / 1MB, 2)

# ---------------------------------------------------------------------------
# 8. Manifiesto WinGet preparado (cambio de tipo a inno). No se publica nada.
# ---------------------------------------------------------------------------
if (Test-Path -LiteralPath $wingetInstallerManifest) {
    $manifest = Get-Content -LiteralPath $wingetInstallerManifest -Raw
    $manifest = [regex]::Replace($manifest, '(?m)^(\s*InstallerSha256:).*$', "`$1 $installerHash")
    [System.IO.File]::WriteAllText($wingetInstallerManifest, ($manifest -replace "`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))
    Write-Ok "Hash actualizado en el manifiesto WinGet preparado (sin publicar)."
}

Write-Step "Instalador generado"
Write-Host "    Archivo : $installer ($installerSize MB)"
Write-Host "    SHA-256 : $installerHash"
Write-Host "    Install : por usuario en {localappdata}\Programs\WinTTS (sin elevation)"
Write-Host ""
