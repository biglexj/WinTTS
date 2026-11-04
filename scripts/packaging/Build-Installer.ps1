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

    Antes de invocar ISCC.exe sincroniza la plantilla visual compartida
    (Scripts\tools\inno\BiglexModernUI.iss) y pasa el validador de invariantes
    de empaquetado (Scripts\tools\inno\Check-Packaging.ps1), que aborta la
    compilacion si el arranque post-instalacion vuelve a lanzar la app
    directamente desde el instalador (fallo 0xc00004bc), si el nombre de salida
    lleva el sufijo obsoleto _x64 o si la plantilla visual diverge de la
    compartida. WinTTS arranca a traves del shell del escritorio ({win}\explorer.exe)
    para aislarse del contexto de instalacion.

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
    [switch]$SkipAppBuild,

    # Empaqueta aunque el ejecutable sea mas viejo que las fuentes. Solo para
    # depurar: publicar asi reintroduce el binario obsoleto.
    [switch]$ForceStale
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

function Write-Fail {
    param([string]$Text)
    Write-Host "ERROR: $Text" -ForegroundColor Red
    throw $Text
}

# --- Puerta de calidad de empaquetado (validador compartido) -----------------
# La plantilla visual y el arranque post-instalacion son fuente unica del
# workspace. Un [Run] editado a mano que lance la app directamente desde el
# instalador hace que el proceso herede el contexto del instalador y muera con
# 0xc00004bc (STATUS_REDIRECTION_TRUST_FAILURE), asi que el validador compartido
# aborta la compilacion antes de invocar ISCC.exe.
# WinTTS no auto-arranca a proposito: el validador lo acepta porque la ausencia
# de [Run] esta declarada con packaging\windows\no-autoarranque.txt.
function Resolve-SharedInno {
    $dir = $PSScriptRoot
    for ($i = 0; $i -lt 8; $i++) {
        $candidate = Join-Path $dir 'Scripts\tools\inno'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
        $parent = Split-Path -Parent $dir
        if (-not $parent -or $parent -eq $dir) { break }
        $dir = $parent
    }
    return $null
}

function Sync-SharedTemplate {
    param([string]$SharedDir, [string]$PackagingDir)
    if (-not $SharedDir) { return }
    $src = Join-Path $SharedDir 'BiglexModernUI.iss'
    $dst = Join-Path $PackagingDir 'BiglexModernUI.iss'
    if ((Test-Path -LiteralPath $src) -and (Test-Path -LiteralPath $PackagingDir)) {
        Copy-Item -LiteralPath $src -Destination $dst -Force
        Write-Ok "Plantilla visual sincronizada con la copia compartida del workspace."
    }
}

function Assert-PackagingInvariants {
    param([string]$SharedDir, [string[]]$SetupFiles)
    if (-not $SharedDir) {
        Write-Host 'AVISO: no se encontro la carpeta compartida Scripts\tools\inno.' -ForegroundColor Yellow
        Write-Host '       Se omite la validacion de invariantes de empaquetado.' -ForegroundColor Yellow
        return
    }
    $checker = Join-Path $SharedDir 'Check-Packaging.ps1'
    if (-not (Test-Path -LiteralPath $checker)) {
        Write-Host "AVISO: no se encontro $checker. Se omite la validacion." -ForegroundColor Yellow
        return
    }
    # Get-Command puede devolver varias rutas (alias de Store y MSIX): se toma
    # la primera que exista de verdad.
    $shellExe = $null
    foreach ($name in @('pwsh', 'powershell')) {
        foreach ($candidate in @(Get-Command $name -CommandType Application -ErrorAction SilentlyContinue)) {
            if ($candidate.Source -and (Test-Path -LiteralPath $candidate.Source)) {
                $shellExe = $candidate.Source
                break
            }
        }
        if ($shellExe) { break }
    }
    if (-not $shellExe) {
        Write-Host 'AVISO: no se encontro pwsh ni powershell: se omite la validacion.' -ForegroundColor Yellow
        return
    }
    foreach ($setup in $SetupFiles) {
        & $shellExe -NoProfile -ExecutionPolicy Bypass -File $checker -SetupIss $setup
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: las invariantes de empaquetado fallan para $setup." -ForegroundColor Red
            Write-Host '       No se compila el instalador. Corrige lo anterior.' -ForegroundColor Red
            exit 1
        }
    }
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

# --- Candado anti-binario-obsoleto ------------------------------------------
# Tauri incrusta dist/ DENTRO del ejecutable. Si el .exe es mas viejo que el
# codigo fuente o que dist/, el instalador empaqueta un binario obsoleto aunque
# se compile "recien" y aunque dist/ este al dia. Regla de Core:
# Docs/global/architecture/command-scripts-standard.md, principio 2.
# SHA-256 con la API de .NET en lugar de Get-FileHash: ese cmdlet no esta
# disponible en el modulo Microsoft.PowerShell.Utility cuando `powershell` se
# invoca con -NoProfile, que es como lo llama el pipeline de release.
function Get-Sha256Hex {
    param([Parameter(Mandatory)][string]$LiteralPath)
    $algo = [System.Security.Cryptography.SHA256]::Create()
    $stream = $null
    try {
        $stream = [System.IO.File]::OpenRead($LiteralPath)
        return ([BitConverter]::ToString($algo.ComputeHash($stream))).Replace('-', '')
    }
    finally {
        if ($stream) { $stream.Dispose() }
        $algo.Dispose()
    }
}

function Get-NewestWriteTime {
    param([string[]]$Paths)
    $best = $null
    $bestPath = $null
    foreach ($path in $Paths) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $item = if (Test-Path -LiteralPath $path -PathType Container) {
            Get-ChildItem -LiteralPath $path -Recurse -File -Force -ErrorAction SilentlyContinue |
                Sort-Object LastWriteTime -Descending | Select-Object -First 1
        }
        else {
            Get-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
        }
        if ($item -and (-not $best -or $item.LastWriteTime -gt $best)) {
            $best = $item.LastWriteTime
            $bestPath = $item.FullName
        }
    }
    return [pscustomobject]@{ Time = $best; Path = $bestPath }
}

function Assert-BinaryFresh {
    param([string]$Exe, [string]$AppRoot, [switch]$Force)
    if (-not (Test-Path -LiteralPath $Exe)) {
        Write-Fail "No se encontro el ejecutable compilado: $Exe`n  Compila la app sin el flag de omision."
    }
    $exeItem = Get-Item -LiteralPath $Exe
    $newest = Get-NewestWriteTime -Paths @(
        (Join-Path $AppRoot 'src'),
        (Join-Path $AppRoot 'src-tauri\src'),
        (Join-Path $AppRoot 'dist'),
        (Join-Path $AppRoot 'src-tauri\Cargo.toml'),
        (Join-Path $AppRoot 'src-tauri\tauri.conf.json'),
        (Join-Path $AppRoot 'src-tauri\build.rs'),
        (Join-Path $AppRoot 'src-tauri\capabilities'),
        (Join-Path $AppRoot 'package.json')
    )
    if (-not $newest.Time) { return }
    if ($exeItem.LastWriteTime -ge $newest.Time) {
        Write-Step "Ejecutable al dia: $($exeItem.LastWriteTime.ToString('dd/MM HH:mm:ss'))"
        return
    }
    $rel = if ($newest.Path) { $newest.Path.Substring($AppRoot.Length).TrimStart('\') } else { '(desconocido)' }
    if ($Force) {
        Write-Host "AVISO: se empaqueta un binario OBSOLETO por -ForceStale." -ForegroundColor Yellow
        Write-Host "       exe $($exeItem.LastWriteTime.ToString('dd/MM HH:mm:ss')) < fuente $($newest.Time.ToString('dd/MM HH:mm:ss')) $rel" -ForegroundColor Yellow
        return
    }
    Write-Fail ("El ejecutable es MAS VIEJO que el codigo fuente:`n" +
                "  ejecutable : $($exeItem.LastWriteTime.ToString('dd/MM HH:mm:ss'))  $Exe`n" +
                "  fuente     : $($newest.Time.ToString('dd/MM HH:mm:ss'))  $rel`n`n" +
                "Tauri incrusta dist/ dentro del ejecutable, asi que un .exe viejo publica`n" +
                "tambien un frontend viejo aunque dist/ este al dia. Vuelve a compilar la app" +
                ", o usa -ForceStale solo para depurar.")
}

# Localiza ISCC.exe sin rutas absolutas: primero la copia del workspace,
# subiendo desde este script; despues el PATH del sistema.
function Resolve-Iscc {
    $dir = $PSScriptRoot
    for ($i = 0; $i -lt 8; $i++) {
        $candidate = Join-Path $dir 'Scripts\tools\InnoSetup\ISCC.exe'
        if (Test-Path -LiteralPath $candidate) { return $candidate }
        $parent = Split-Path -Parent $dir
        if (-not $parent -or $parent -eq $dir) { break }
        $dir = $parent
    }
    $onPath = Get-Command ISCC.exe -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    # Instalacion estandar de Inno Setup 6 (el PATH no siempre lo incluye).
    foreach ($candidate in @(
        'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
        'C:\Program Files\Inno Setup 6\ISCC.exe'
    )) {
        if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
    return $null
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
Assert-BinaryFresh -Exe $appExe -AppRoot $projectRoot -Force:$ForceStale
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
if (-not $IsccPath) { $IsccPath = Resolve-Iscc }
if (-not $IsccPath) { Write-Fail 'No se localizo ISCC.exe en Scripts\tools\InnoSetup ni en el PATH.' }
if (-not (Test-Path -LiteralPath $IsccPath)) {
    throw "No se encontro ISCC.exe (Inno Setup 6). Indica la ruta con -IsccPath."
}
Write-Ok "Compilador Inno Setup: $IsccPath"

# ---------------------------------------------------------------------------
# 7. Compilar el instalador
# ---------------------------------------------------------------------------
Write-Step "Compilando el instalador"
New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
# Puerta de calidad: plantilla visual sincronizada + invariantes validadas
# antes de tocar ISCC.exe.
$sharedInno = Resolve-SharedInno
Sync-SharedTemplate -SharedDir $sharedInno -PackagingDir $packagingDir
Assert-PackagingInvariants -SharedDir $sharedInno -SetupFiles @($setupIss)
& $IsccPath $setupIss
if ($LASTEXITCODE -ne 0) { throw "ISCC fallo (exit $LASTEXITCODE)." }

$installer = Join-Path $releaseDir "WinTTS-Setup-$appVersion.exe"
if (-not (Test-Path -LiteralPath $installer)) {
    $produced = Get-ChildItem -LiteralPath $releaseDir -Filter "WinTTS-Setup-*.exe" -File |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $produced) { throw "ISCC termino sin error pero no hay instalador en $releaseDir." }
    $installer = $produced.FullName
}

$installerHash = (Get-Sha256Hex -LiteralPath $installer).ToUpperInvariant()
$installerSize = [math]::Round((Get-Item -LiteralPath $installer).Length / 1MB, 2)
$installerLeafName = Split-Path -Leaf $installer

# El instalador es el artefacto publicado: su hash entra en SHA256SUMS.txt.
# Se actualiza solo su linea, sin borrar las de los demas artefactos, y con
# saltos LF y sin BOM: el formato `sha256sum` usa LF y con CRLF la
# verificacion falla en Linux y macOS.
$sumsPath = Join-Path $releaseDir "SHA256SUMS.txt"
$sumsLine = "$($installerHash.ToLowerInvariant())  $installerLeafName"
$existingSums = @()
if (Test-Path -LiteralPath $sumsPath) {
    $existingSums = Get-Content -LiteralPath $sumsPath | Where-Object { $_ -notmatch [regex]::Escape($installerLeafName) }
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($sumsPath, ((@($existingSums; $sumsLine) -join "`n") + "`n"), $utf8NoBom)
Write-Ok "Hash actualizado en $sumsPath"

# Sincronizar copia en '12. Releases\WinTTS'
$releasesGlobalDir = 'D:\Proyectos\biglexj\12. Releases'
if (Test-Path -LiteralPath $releasesGlobalDir) {
    $winTtsReleaseDir = Join-Path $releasesGlobalDir "WinTTS"
    if (-not (Test-Path -LiteralPath $winTtsReleaseDir)) {
        New-Item -ItemType Directory -Path $winTtsReleaseDir -Force | Out-Null
    }
    $installerLeaf = Split-Path $installer -Leaf
    # Limpiar instaladores antiguos de la carpeta dedicada
    Get-ChildItem -LiteralPath $winTtsReleaseDir -Filter "WinTTS-Setup-*.exe" -File |
        Where-Object { $_.Name -ne $installerLeaf } |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue }
    # Limpiar si quedo alguno suelto en la raiz de 12. Releases
    if (Test-Path -LiteralPath (Join-Path $releasesGlobalDir $installerLeaf)) {
        Remove-Item -LiteralPath (Join-Path $releasesGlobalDir $installerLeaf) -Force -ErrorAction SilentlyContinue
    }
    Copy-Item -LiteralPath $installer -Destination (Join-Path $winTtsReleaseDir $installerLeaf) -Force
    Write-Ok "Copia sincronizada en 12. Releases\WinTTS\$installerLeaf"
}

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
