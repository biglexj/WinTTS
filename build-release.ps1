param(
    [string]$Version,
    [string]$ReleaseNotesFile = "RELEASE_MESSAGE.md",
    [switch]$LocalOnly,
    [switch]$SkipTests,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$projectFile = Join-Path $root "WinTTS.csproj"
$manifestFile = Join-Path $root "Package.appxmanifest"
$releaseNotesPath = Join-Path $root $ReleaseNotesFile
$publishDir = Join-Path $root "publish\exe"
$releaseDir = Join-Path $root "release"

function Invoke-Checked {
    param(
        [Parameter(Mandatory)] [string]$Executable,
        [Parameter(Mandatory)] [string[]]$ArgumentList
    )

    & $Executable @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "El comando '$Executable' terminó con código $LASTEXITCODE."
    }
}

function Set-VersionInFile {
    param(
        [Parameter(Mandatory)] [string]$Path,
        [Parameter(Mandatory)] [string]$Pattern,
        [Parameter(Mandatory)] [string]$Replacement
    )

    $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ($content -notmatch $Pattern) {
        throw "No se encontró el patrón de versión esperado en $Path."
    }

    $updated = [regex]::Replace($content, $Pattern, $Replacement)
    Set-Content -LiteralPath $Path -Value $updated -Encoding UTF8 -NoNewline
}

if (-not (Test-Path -LiteralPath $projectFile) -or
    -not (Test-Path -LiteralPath $manifestFile) -or
    -not (Test-Path -LiteralPath $releaseNotesPath)) {
    throw "Faltan archivos obligatorios del proyecto o del release."
}

$projectContent = Get-Content -LiteralPath $projectFile -Raw -Encoding UTF8
if ($projectContent -notmatch '<Version>(\d+\.\d+\.\d+)</Version>') {
    throw "No se pudo leer la versión activa desde WinTTS.csproj."
}

$currentVersion = $Matches[1]
if (-not $Version) {
    $Version = $currentVersion
}

if ($Version -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    throw "La versión '$Version' no cumple el formato mayor.menor.parche."
}

if ([int]$Matches[3] -gt 9) {
    throw "La regla del .9 impide publicar el parche '$Version'. Incrementa la versión menor."
}

$tag = "v$Version"
$assetName = "WinTTS-Windows-x64-$Version.exe"
$assetPath = Join-Path $releaseDir $assetName
$hashPath = Join-Path $releaseDir "SHA256SUMS.txt"

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  WinTTS — Release $tag" -ForegroundColor Magenta
Write-Host "══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

if (-not $LocalOnly) {
    $branch = (git branch --show-current).Trim()
    if ($branch -ne "main") {
        throw "La publicación debe ejecutarse desde main; rama actual: '$branch'."
    }

    git rev-parse --quiet --verify "refs/tags/$tag" *> $null
    if ($LASTEXITCODE -eq 0) {
        throw "El tag $tag ya existe localmente."
    }

    gh release view $tag --repo "biglexj/WinTTS" *> $null
    if ($LASTEXITCODE -eq 0) {
        throw "El GitHub Release $tag ya existe."
    }

    Invoke-Checked -Executable gh -ArgumentList @("auth", "status")
}

Write-Host "[1/7] Sincronizando versión y documentación..." -ForegroundColor Yellow
Set-VersionInFile $projectFile '<Version>\d+\.\d+\.\d+</Version>' "<Version>$Version</Version>"
Set-VersionInFile $projectFile '<AssemblyVersion>\d+\.\d+\.\d+\.\d+</AssemblyVersion>' "<AssemblyVersion>$Version.0</AssemblyVersion>"
Set-VersionInFile $projectFile '<FileVersion>\d+\.\d+\.\d+\.\d+</FileVersion>' "<FileVersion>$Version.0</FileVersion>"
Set-VersionInFile `
    $manifestFile `
    '(?s)(<Identity\b.*?\bVersion=")\d+\.\d+\.\d+\.\d+(")' `
    ('${1}' + $Version + '.0${2}')

[xml]$manifestDocument = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8
$namespaceManager = [System.Xml.XmlNamespaceManager]::new($manifestDocument.NameTable)
$namespaceManager.AddNamespace("appx", $manifestDocument.DocumentElement.NamespaceURI)
$identityNode = $manifestDocument.SelectSingleNode("/appx:Package/appx:Identity", $namespaceManager)
$deviceFamilyNode = $manifestDocument.SelectSingleNode(
    "/appx:Package/appx:Dependencies/appx:TargetDeviceFamily",
    $namespaceManager)
if ($identityNode.Version -ne "$Version.0") {
    throw "La versión Identity del manifiesto no coincide con $Version.0."
}

if ([version]$deviceFamilyNode.MinVersion -lt [version]"10.0.17763.0") {
    throw "TargetDeviceFamily.MinVersion quedó por debajo de Windows 10 1809."
}

$releaseNotesDocument = Join-Path $root "RELEASE_NOTES.md"
$notesContent = Get-Content -LiteralPath $releaseNotesDocument -Raw -Encoding UTF8
$developmentHeader = "## [$Version] — En desarrollo"
if ($notesContent.Contains($developmentHeader)) {
    $notesContent = $notesContent.Replace(
        $developmentHeader,
        "## [$Version] — $(Get-Date -Format 'yyyy-MM-dd')")
    Set-Content -LiteralPath $releaseNotesDocument -Value $notesContent -Encoding UTF8 -NoNewline
}

if (-not $SkipBuild) {
    Write-Host "[2/7] Restaurando y compilando..." -ForegroundColor Yellow
    Invoke-Checked -Executable dotnet -ArgumentList @(
        "restore", (Join-Path $root "WinTTS.Tests\WinTTS.Tests.csproj"))
    Invoke-Checked -Executable dotnet -ArgumentList @(
        "restore", $projectFile, "-r", "win-x64")
    Invoke-Checked -Executable dotnet -ArgumentList @(
        "build", $projectFile, "-c", "Release", "--no-restore")

    if (-not $SkipTests) {
        Write-Host "[3/7] Ejecutando pruebas..." -ForegroundColor Yellow
        Invoke-Checked -Executable dotnet -ArgumentList @(
            "test",
            (Join-Path $root "WinTTS.Tests\WinTTS.Tests.csproj"),
            "-c", "Release",
            "--no-restore")
    } else {
        Write-Host "[3/7] Pruebas omitidas por parámetro." -ForegroundColor DarkYellow
    }

    Write-Host "[4/7] Generando ejecutable portable..." -ForegroundColor Yellow
    Invoke-Checked -Executable dotnet -ArgumentList @(
        "publish", $projectFile,
        "-c", "Release",
        "-r", "win-x64",
        "--self-contained", "true",
        "--output", $publishDir,
        "--no-restore",
        "-p:PublishSingleFile=true",
        "-p:IncludeNativeLibrariesForSelfExtract=true",
        "-p:PublishReadyToRun=true",
        "-p:DebugType=None",
        "-p:DebugSymbols=false")
} elseif (-not (Test-Path -LiteralPath (Join-Path $publishDir "WinTTS.exe"))) {
    throw "-SkipBuild requiere un ejecutable existente en publish\exe\WinTTS.exe."
}

$resolvedRoot = [System.IO.Path]::GetFullPath($root).TrimEnd('\') + '\'
$resolvedRelease = [System.IO.Path]::GetFullPath($releaseDir).TrimEnd('\') + '\'
if (-not $resolvedRelease.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "La ruta release resuelta quedó fuera del proyecto; se canceló la limpieza."
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
Get-ChildItem -LiteralPath $releaseDir -File -ErrorAction SilentlyContinue |
    Remove-Item -Force
Copy-Item -LiteralPath (Join-Path $publishDir "WinTTS.exe") -Destination $assetPath

$assetHash = (Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash.ToLowerInvariant()
"$assetHash  $assetName" | Set-Content -LiteralPath $hashPath -Encoding UTF8

Write-Host "[5/7] Actualizando manifiestos WinGet..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/biglexj/WinTTS/releases/download/$tag/$assetName"
foreach ($manifestDirectory in @("manifests", "manifests-exe")) {
    $directoryPath = Join-Path $root $manifestDirectory
    foreach ($yaml in Get-ChildItem -LiteralPath $directoryPath -Filter "*.yaml" -File) {
        $yamlContent = Get-Content -LiteralPath $yaml.FullName -Raw -Encoding UTF8
        $yamlContent = [regex]::Replace(
            $yamlContent,
            '(?m)^PackageVersion:\s*.+$',
            "PackageVersion: $Version")
        if ($yaml.Name -like "*.installer.yaml") {
            $yamlContent = [regex]::Replace(
                $yamlContent,
                '(?m)^\s*InstallerUrl:\s*.+$',
                "    InstallerUrl: $downloadUrl")
            $yamlContent = [regex]::Replace(
                $yamlContent,
                '(?m)^\s*InstallerSha256:\s*.+$',
                "    InstallerSha256: $($assetHash.ToUpperInvariant())")
        }

        Set-Content -LiteralPath $yaml.FullName -Value $yamlContent -Encoding UTF8 -NoNewline
    }
}

$wingetCommand = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetCommand) {
    $validationRoot = Join-Path $root "test\release-validation"
    $resolvedValidation = [System.IO.Path]::GetFullPath($validationRoot)
    $resolvedTestRoot = [System.IO.Path]::GetFullPath((Join-Path $root "test")).TrimEnd('\') + '\'
    if (-not ($resolvedValidation + '\').StartsWith(
        $resolvedTestRoot,
        [StringComparison]::OrdinalIgnoreCase)) {
        throw "La carpeta temporal de validación quedó fuera de test/."
    }

    if (Test-Path -LiteralPath $validationRoot) {
        Remove-Item -LiteralPath $validationRoot -Recurse -Force
    }

    foreach ($manifestDirectory in @("manifests", "manifests-exe")) {
        $validationDirectory = Join-Path $validationRoot $manifestDirectory
        New-Item -ItemType Directory -Path $validationDirectory -Force | Out-Null
        Copy-Item -Path (Join-Path $root "$manifestDirectory\*.yaml") `
            -Destination $validationDirectory
        Invoke-Checked -Executable winget -ArgumentList @(
            "validate", "--manifest", $validationDirectory)
    }
}

Write-Host "  Artefactos:" -ForegroundColor Gray
Get-ChildItem -LiteralPath $releaseDir -File | ForEach-Object {
    Write-Host "    $($_.Name) ($([math]::Round($_.Length / 1MB, 2)) MB)" -ForegroundColor Gray
}

if ($LocalOnly) {
    Write-Host ""
    Write-Host "Build local terminado. Git y GitHub fueron omitidos." -ForegroundColor Green
    exit 0
}

Write-Host "[6/7] Creando commit, tag y push atómico..." -ForegroundColor Yellow
Invoke-Checked -Executable git -ArgumentList @("add", "-A")
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    throw "No existen cambios preparados para crear el release."
}

Invoke-Checked -Executable git -ArgumentList @("commit", "-m", "release: WinTTS $tag")
Invoke-Checked -Executable git -ArgumentList @("tag", "-a", $tag, "-m", "WinTTS $tag")
Invoke-Checked -Executable git -ArgumentList @(
    "push", "--atomic", "origin", "HEAD", "refs/tags/$tag")

Write-Host "[7/7] Creando GitHub Release..." -ForegroundColor Yellow
Invoke-Checked -Executable gh -ArgumentList @(
    "release", "create", $tag,
    $assetPath,
    $hashPath,
    "--repo", "biglexj/WinTTS",
    "--verify-tag",
    "--title", "WinTTS $tag",
    "--notes-file", $releaseNotesPath)

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Release $tag publicado correctamente" -ForegroundColor Green
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  https://github.com/biglexj/WinTTS/releases/tag/$tag" -ForegroundColor Cyan
