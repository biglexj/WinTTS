# Genera un paquete MSIX x64 autocontenido para WinTTS.

[CmdletBinding()]
param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release",

    [ValidateSet("win-x64")]
    [string]$Runtime = "win-x64",

    [string]$Version,

    [string]$CertificatePath,

    [string]$CertificatePassword
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $projectRoot "WinTTS.csproj"
$manifestSource = Join-Path $projectRoot "Package.appxmanifest"
$releaseDir = Join-Path $projectRoot "release"
$temporaryRoot = Join-Path $projectRoot "obj\msix"
$packageDir = Join-Path $temporaryRoot "package"
$validationDir = Join-Path $temporaryRoot "validation"

function Get-LatestWindowsSdkTool {
    param([Parameter(Mandatory)][string]$Name)

    $sdkRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
    $candidate = Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction Stop |
        Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
        Sort-Object { [version]$_.Name } -Descending |
        ForEach-Object { Join-Path $_.FullName "x64\$Name" } |
        Where-Object { Test-Path -LiteralPath $_ } |
        Select-Object -First 1

    if (-not $candidate) {
        throw "No se encontro $Name en el Windows SDK."
    }

    return $candidate
}

if (-not (Test-Path -LiteralPath $projectFile)) {
    throw "No se encontro el proyecto: $projectFile"
}

[xml]$manifest = Get-Content -LiteralPath $manifestSource -Raw
$identity = $manifest.Package.Identity
if (-not $Version) {
    $Version = ([version]$identity.Version).ToString(3)
}

$packageVersion = "$Version.0"
$identity.Version = $packageVersion
$artifactName = "WinTTS-Windows-x64-$Version.msix"
$msixPath = Join-Path $releaseDir $artifactName
$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"
$makeAppx = Get-LatestWindowsSdkTool -Name "makeappx.exe"
$signTool = Get-LatestWindowsSdkTool -Name "signtool.exe"

$resolvedTemporaryRoot = [System.IO.Path]::GetFullPath($temporaryRoot).TrimEnd('\') + '\'
foreach ($directory in @($packageDir, $validationDir)) {
    $resolvedDirectory = [System.IO.Path]::GetFullPath($directory)
    if (-not ($resolvedDirectory + '\').StartsWith(
        $resolvedTemporaryRoot,
        [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Directorio temporal fuera de obj\msix: $resolvedDirectory"
    }
    if (Test-Path -LiteralPath $resolvedDirectory) {
        Remove-Item -LiteralPath $resolvedDirectory -Recurse -Force
    }
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
if (Test-Path -LiteralPath $releaseDir) {
    Get-ChildItem -LiteralPath $releaseDir -File -Filter "WinTTS-Windows-x64-*.msix" |
        ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
}

Write-Host "Compilando WinTTS $Version para $Runtime..." -ForegroundColor Cyan
dotnet publish $projectFile `
    --configuration $Configuration `
    --runtime $Runtime `
    --self-contained true `
    --output $packageDir `
    -p:PublishSingleFile=false `
    -p:DebugType=None `
    -p:DebugSymbols=false

if ($LASTEXITCODE -ne 0) {
    throw "dotnet publish fallo con el codigo $LASTEXITCODE."
}

$manifest.Package.Applications.Application.Executable = "WinTTS.exe"
$manifest.Save((Join-Path $packageDir "AppxManifest.xml"))

$imageSource = Join-Path $projectRoot "Image"
if (Test-Path -LiteralPath $imageSource) {
    Copy-Item -LiteralPath $imageSource -Destination $packageDir -Recurse -Force
}

if (Test-Path -LiteralPath $msixPath) {
    Remove-Item -LiteralPath $msixPath -Force
}

& $makeAppx pack /d $packageDir /p $msixPath /o
if ($LASTEXITCODE -ne 0) {
    throw "makeappx fallo con el codigo $LASTEXITCODE."
}

$signed = $false
if ($CertificatePath) {
    $certificate = Get-PfxCertificate -FilePath $CertificatePath
    if ($certificate.Subject -ne [string]$identity.Publisher) {
        throw "El certificado ($($certificate.Subject)) no coincide con el Publisher del manifiesto ($($identity.Publisher))."
    }

    $signArguments = @("sign", "/fd", "SHA256", "/f", $CertificatePath)
    if ($CertificatePassword) {
        $signArguments += @("/p", $CertificatePassword)
    }
    $signArguments += $msixPath
    & $signTool @signArguments
    if ($LASTEXITCODE -ne 0) {
        throw "signtool fallo con el codigo $LASTEXITCODE."
    }
    $signed = $true
}

New-Item -ItemType Directory -Path $validationDir -Force | Out-Null
& $makeAppx unpack /p $msixPath /d $validationDir /o | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "No se pudo volver a abrir el MSIX generado."
}

[xml]$packedManifest = Get-Content -LiteralPath (Join-Path $validationDir "AppxManifest.xml") -Raw
if ([string]$packedManifest.Package.Identity.Version -ne $packageVersion) {
    throw "Version inesperada dentro del MSIX."
}
if (-not (Test-Path -LiteralPath (Join-Path $validationDir "WinTTS.exe"))) {
    throw "El MSIX no contiene WinTTS.exe."
}

$hash = (Get-FileHash -LiteralPath $msixPath -Algorithm SHA256).Hash.ToLowerInvariant()
$sizeMb = [math]::Round((Get-Item -LiteralPath $msixPath).Length / 1MB, 2)

$hashLines = @(Get-ChildItem -LiteralPath $releaseDir -File |
    Where-Object { $_.Name -ne "SHA256SUMS.txt" } |
    Sort-Object Name |
    ForEach-Object {
        $fileHash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        "$fileHash  $($_.Name)"
    })
$hashLines | Set-Content -LiteralPath $hashPath -Encoding UTF8

foreach ($directory in @($packageDir, $validationDir)) {
    if (Test-Path -LiteralPath $directory) {
        Remove-Item -LiteralPath $directory -Recurse -Force
    }
}

Write-Host "MSIX generado y validado: $msixPath" -ForegroundColor Green
Write-Host "Tamano: $sizeMb MB"
Write-Host "SHA256: $hash"
Write-Host "Firmado: $signed"

[pscustomobject]@{
    Path = $msixPath
    Version = $packageVersion
    Publisher = [string]$packedManifest.Package.Identity.Publisher
    Signed = $signed
    Sha256 = $hash
}
