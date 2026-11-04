# Genera un paquete MSIX x64 autocontenido para WinTTS (Rust + Tauri 2.0 Edition).
# Autor: biglexj (2026)

[CmdletBinding()]
param(
    [string]$Version = "2.0.0",
    [string]$CertificatePath,
    [string]$CertificatePassword,
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestSource = Join-Path $projectRoot "Package.appxmanifest"
$releaseDir = Join-Path $projectRoot "release"
$temporaryRoot = Join-Path $projectRoot "obj\msix"
$packageDir = Join-Path $temporaryRoot "package"

function Get-LatestWindowsSdkTool {
    param([Parameter(Mandatory)][string]$Name)

    $sdkRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    if (-not (Test-Path -LiteralPath $sdkRoot)) {
        throw "No se encontró el directorio de Windows SDK en: $sdkRoot"
    }

    $candidate = Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction Stop |
        Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
        Sort-Object { [version]$_.Name } -Descending |
        ForEach-Object { Join-Path $_.FullName "x64\$Name" } |
        Where-Object { Test-Path -LiteralPath $_ } |
        Select-Object -First 1

    if (-not $candidate) {
        throw "No se encontró $Name en el Windows SDK."
    }

    return $candidate
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS v$Version — Generador de Paquete MSIX" -ForegroundColor Cyan
Write-Host "  Plataforma: Rust + Tauri 2.0 (Microsoft Store)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Localizar herramientas del SDK de Windows
Write-Host "[1/5] Verificando herramientas del Windows SDK..." -ForegroundColor Yellow
$makeAppx = Get-LatestWindowsSdkTool -Name "makeappx.exe"
$signTool = Get-LatestWindowsSdkTool -Name "signtool.exe"
Write-Host "  ✅ makeappx.exe: $makeAppx" -ForegroundColor Green
Write-Host "  ✅ signtool.exe: $signTool" -ForegroundColor Green

# 2. Compilar Frontend y Backend en Release si no se especificó -SkipBuild
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[2/5] Compilando Frontend (Vite + React) y Backend (Rust Release)..." -ForegroundColor Yellow

    Write-Host "  -> Ejecutando npm run build..." -ForegroundColor Cyan
    Push-Location $projectRoot
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build falló con el código $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    Write-Host "  -> Ejecutando cargo build --release..." -ForegroundColor Cyan
    $tauriDir = Join-Path $projectRoot "src-tauri"
    Push-Location $tauriDir
    try {
        cargo build --release
        if ($LASTEXITCODE -ne 0) {
            throw "cargo build --release falló con el código $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host ""
    Write-Host "[2/5] Omitiendo compilación (-SkipBuild activo)..." -ForegroundColor Yellow
}

$releaseExe = Join-Path $projectRoot "src-tauri\target\release\wintts.exe"
if (-not (Test-Path -LiteralPath $releaseExe)) {
    throw "No se encontró el ejecutable compilado en: $releaseExe"
}

# 3. Preparar staging del paquete MSIX
Write-Host ""
Write-Host "[3/5] Preparando archivos del paquete MSIX..." -ForegroundColor Yellow

if (Test-Path -LiteralPath $packageDir) {
    Remove-Item -LiteralPath $packageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $packageDir -Force | Out-Null

# Copiar binario ejecutable
Copy-Item -LiteralPath $releaseExe -Destination (Join-Path $packageDir "wintts.exe") -Force

# Preparar y guardar AppxManifest.xml
[xml]$manifest = Get-Content -LiteralPath $manifestSource -Raw
$packageVersion = "$Version.0"
$manifest.Package.Identity.Version = $packageVersion
$manifest.Package.Applications.Application.Executable = "wintts.exe"
$manifest.Save((Join-Path $packageDir "AppxManifest.xml"))

# Copiar carpeta Image con logos
$imageSource = Join-Path $projectRoot "Image"
$imageDest = Join-Path $packageDir "Image"
if (Test-Path -LiteralPath $imageSource) {
    Copy-Item -LiteralPath $imageSource -Destination $imageDest -Recurse -Force
}

# Generar archivo resources.pri si makepri está disponible
try {
    $makePri = Get-LatestWindowsSdkTool -Name "makepri.exe"
    $priConfigPath = Join-Path $temporaryRoot "priconfig.xml"
    & $makePri createconfig /cf $priConfigPath /dq es-ES /pv 10.0.0 /o | Out-Null
    & $makePri new /pr $packageDir /cf $priConfigPath /of (Join-Path $packageDir "resources.pri") /o | Out-Null
    Write-Host "  ✅ resources.pri generado con makepri.exe" -ForegroundColor Green
} catch {
    Write-Host "  ℹ️  makepri.exe omitido, empaquetando assets directamente." -ForegroundColor Gray
}

# 4. Crear paquete MSIX con makeappx.exe
Write-Host ""
Write-Host "[4/5] Empaquetando contenedor MSIX..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
$artifactName = "WinTTS-Windows-x64-$Version.msix"
$msixPath = Join-Path $releaseDir $artifactName

if (Test-Path -LiteralPath $msixPath) {
    Remove-Item -LiteralPath $msixPath -Force
}

& $makeAppx pack /d $packageDir /p $msixPath /o
if ($LASTEXITCODE -ne 0) {
    throw "makeappx.exe falló con el código $LASTEXITCODE."
}

Write-Host "  ✅ Paquete MSIX generado: $msixPath" -ForegroundColor Green

# 5. Firmar paquete MSIX si se proporcionó certificado
if ($CertificatePath -and (Test-Path -LiteralPath $CertificatePath)) {
    Write-Host ""
    Write-Host "[5/5] Firmando paquete MSIX..." -ForegroundColor Yellow
    $signArgs = @("sign", "/fd", "SHA256", "/f", $CertificatePath)
    if ($CertificatePassword) {
        $signArgs += @("/p", $CertificatePassword)
    }
    $signArgs += $msixPath

    & $signTool @signArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "No se pudo firmar el paquete MSIX automáticamente."
    } else {
        Write-Host "  ✅ Paquete firmado exitosamente con signtool." -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[5/5] Firma omitida (Paquete listo para Microsoft Store o firma manual)." -ForegroundColor Gray
}

# 6. Generar Checksum SHA-256
# Se actualiza la linea de este artefacto sin borrar las demas: SHA256SUMS.txt
# recoge los artefactos previstos para publicacion y cada script debe
# aportar solo el suyo.
$hash = (Get-FileHash -LiteralPath $msixPath -Algorithm SHA256).Hash.ToLowerInvariant()
$hashLine = "$hash  $artifactName"
$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"
$existing = @()
if (Test-Path -LiteralPath $hashPath) {
    $existing = Get-Content -LiteralPath $hashPath | Where-Object { $_ -notmatch [regex]::Escape($artifactName) }
}
$updated = @($existing; $hashLine)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($hashPath, (($updated -join "`n") + "`n"), $utf8NoBom)

# Sincronizar copia en '12. Releases\WinTTS'
$releasesGlobalDir = 'D:\Proyectos\biglexj\12. Releases'
if (Test-Path -LiteralPath $releasesGlobalDir) {
    $winTtsReleaseDir = Join-Path $releasesGlobalDir "WinTTS"
    if (-not (Test-Path -LiteralPath $winTtsReleaseDir)) {
        New-Item -ItemType Directory -Path $winTtsReleaseDir -Force | Out-Null
    }
    Copy-Item -LiteralPath $msixPath -Destination (Join-Path $winTtsReleaseDir $artifactName) -Force
    if (Test-Path -LiteralPath $hashPath) {
        Copy-Item -LiteralPath $hashPath -Destination (Join-Path $winTtsReleaseDir "SHA256SUMS.txt") -Force
    }
    Write-Host "  ✅ Copia MSIX sincronizada en 12. Releases\WinTTS\$artifactName" -ForegroundColor Green
}

$fileSizeMB = [math]::Round((Get-Item $msixPath).Length / 1MB, 2)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🎉 ¡Compilación MSIX Finalizada con Éxito!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📦 Archivo: $artifactName ($fileSizeMB MB)" -ForegroundColor White
Write-Host "📂 Destino: $msixPath" -ForegroundColor White
Write-Host "🔑 SHA-256: $hash" -ForegroundColor White
Write-Host "📄 Hashes : $hashPath" -ForegroundColor White
Write-Host ""
