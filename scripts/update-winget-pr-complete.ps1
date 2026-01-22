# Script completo para actualizar el PR de WinGet con el instalador EXE

Write-Host "=== Actualización del PR de WinGet #331954 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script te guiará para actualizar el PR con el nuevo instalador EXE" -ForegroundColor Yellow
Write-Host ""

# Paso 1: Verificar si existe el fork clonado
Write-Host "📁 Paso 1: Verificando fork de winget-pkgs..." -ForegroundColor Cyan

$forkPath = Read-Host "¿Dónde quieres clonar/ya tienes el fork de winget-pkgs? (ruta completa o presiona Enter para usar .\winget-pkgs)"
if ([string]::IsNullOrWhiteSpace($forkPath)) {
    $forkPath = ".\winget-pkgs"
}

if (-not (Test-Path $forkPath)) {
    Write-Host ""
    Write-Host "❌ El directorio no existe. Clonando el fork..." -ForegroundColor Yellow
    Write-Host ""
    
    $cloneUrl = Read-Host "URL de tu fork (ejemplo: https://github.com/biglexj/winget-pkgs.git)"
    if ([string]::IsNullOrWhiteSpace($cloneUrl)) {
        $cloneUrl = "https://github.com/biglexj/winget-pkgs.git"
    }
    
    git clone $cloneUrl $forkPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al clonar el repositorio" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Fork encontrado en: $forkPath" -ForegroundColor Green
Write-Host ""

# Paso 2: Encontrar el branch del PR
Write-Host "🔍 Paso 2: Buscando el branch del PR..." -ForegroundColor Cyan
Push-Location $forkPath

# Actualizar referencias
git fetch origin

# Listar branches
Write-Host ""
Write-Host "Branches disponibles:" -ForegroundColor Yellow
git branch -a | Select-String "WinTTS" | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

Write-Host ""
$branchName = Read-Host "Nombre del branch del PR (ejemplo: biglexj-WinTTS-1.0.0)"

if ([string]::IsNullOrWhiteSpace($branchName)) {
    # Intentar detectar automáticamente
    $branchName = (git branch -a | Select-String "WinTTS" | Select-Object -First 1).ToString().Trim()
    $branchName = $branchName -replace "remotes/origin/", ""
    $branchName = $branchName -replace "\*", ""
    $branchName = $branchName.Trim()
    Write-Host "Usando branch detectado: $branchName" -ForegroundColor Yellow
}

# Checkout al branch
git checkout $branchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al cambiar al branch" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Branch activo: $branchName" -ForegroundColor Green
Write-Host ""

# Paso 3: Copiar los manifiestos actualizados
Write-Host "📋 Paso 3: Copiando manifiestos actualizados..." -ForegroundColor Cyan

$manifestsSource = Join-Path $PSScriptRoot "..\manifests-msix"
$manifestsTarget = "manifests\b\biglexj\WinTTS\1.0.0"

if (-not (Test-Path $manifestsTarget)) {
    Write-Host "❌ No se encontró el directorio de manifiestos en el fork" -ForegroundColor Red
    Write-Host "Esperado: $manifestsTarget" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Copiar solo los archivos YAML
Copy-Item "$manifestsSource\biglexj.WinTTS.installer.yaml" "$manifestsTarget\" -Force
Copy-Item "$manifestsSource\biglexj.WinTTS.locale.es-PE.yaml" "$manifestsTarget\" -Force
Copy-Item "$manifestsSource\biglexj.WinTTS.yaml" "$manifestsTarget\" -Force

Write-Host "✅ Manifiestos copiados" -ForegroundColor Green
Write-Host ""

# Paso 4: Verificar cambios
Write-Host "🔍 Paso 4: Verificando cambios..." -ForegroundColor Cyan
Write-Host ""
git diff

Write-Host ""
$confirm = Read-Host "¿Los cambios se ven correctos? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Paso 5: Commit y push
Write-Host ""
Write-Host "💾 Paso 5: Haciendo commit y push..." -ForegroundColor Cyan

git add .
git commit -m "Update to portable EXE installer (fixes signature validation error)

- Changed InstallerType from msix to portable
- Updated InstallerUrl to use WinTTS.exe
- Updated InstallerSha256 to match the EXE file
- Removed MSIX-specific fields (Scope, InstallModes, UpgradeBehavior, PackageFamilyName)
- Added Commands field for portable installer

This resolves the TRUST_E_NOSIGNATURE error since EXE files don't require
digital certificate validation like MSIX packages."

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer commit" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Commit realizado" -ForegroundColor Green
Write-Host ""

Write-Host "Haciendo push..." -ForegroundColor Yellow
git push origin $branchName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer push" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "✅ ¡PR actualizado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Ve al PR: https://github.com/microsoft/winget-pkgs/pull/331954" -ForegroundColor White
Write-Host "  2. Verifica que los cambios se reflejen correctamente" -ForegroundColor White
Write-Host "  3. Espera a que la validación automática se ejecute nuevamente" -ForegroundColor White
Write-Host "  4. La validación debería pasar sin el error de firma" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Puedes agregar un comentario en el PR explicando el cambio:" -ForegroundColor Yellow
Write-Host '  "Updated to use portable EXE installer instead of MSIX to resolve signature validation error."' -ForegroundColor Gray
Write-Host ""
