# Script para actualizar el PR de WinGet con el nuevo manifiesto (EXE en lugar de MSIX)

Write-Host "=== Actualizando PR de WinGet #331954 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Cambios realizados:" -ForegroundColor Yellow
Write-Host "  ✅ Cambiado de MSIX a EXE portable" -ForegroundColor Green
Write-Host "  ✅ Eliminado requisito de firma digital" -ForegroundColor Green
Write-Host "  ✅ SHA256 calculado: C94C360FB0C00DEC667ADCF87AA8152A65BC715F15DC4389DE90B0F1E72634FE" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Pasos para actualizar el PR:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Navega al fork del repositorio winget-pkgs" -ForegroundColor Yellow
Write-Host "   Si no tienes el fork clonado, primero:" -ForegroundColor Gray
Write-Host "   git clone https://github.com/biglexj/winget-pkgs.git" -ForegroundColor White
Write-Host ""

Write-Host "2. Ve al directorio del fork:" -ForegroundColor Yellow
Write-Host "   cd winget-pkgs" -ForegroundColor White
Write-Host ""

Write-Host "3. Encuentra el branch del PR (probablemente algo como 'biglexj-WinTTS-1.0.0'):" -ForegroundColor Yellow
Write-Host "   git branch -a" -ForegroundColor White
Write-Host "   git checkout <nombre-del-branch>" -ForegroundColor White
Write-Host ""

Write-Host "4. Copia los manifiestos actualizados:" -ForegroundColor Yellow
Write-Host "   Desde: $PWD\manifests-msix\" -ForegroundColor White
Write-Host "   Hacia: winget-pkgs\manifests\b\biglexj\WinTTS\1.0.0\" -ForegroundColor White
Write-Host ""

Write-Host "5. Haz commit y push:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'Update to portable EXE installer (fixes signature error)'" -ForegroundColor White
Write-Host "   git push origin <nombre-del-branch>" -ForegroundColor White
Write-Host ""

Write-Host "=== Alternativa: Actualizar manualmente en GitHub ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si prefieres actualizar directamente en GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve al PR: https://github.com/microsoft/winget-pkgs/pull/331954" -ForegroundColor Green
Write-Host "2. Haz clic en 'Files changed'" -ForegroundColor Green
Write-Host "3. Edita cada archivo YAML con los nuevos contenidos" -ForegroundColor Green
Write-Host "4. Commit directamente al branch del PR" -ForegroundColor Green
Write-Host ""

Write-Host "📄 Archivos a actualizar:" -ForegroundColor Cyan
Write-Host "  - biglexj.WinTTS.installer.yaml" -ForegroundColor White
Write-Host "  - biglexj.WinTTS.locale.es-PE.yaml (sin cambios)" -ForegroundColor Gray
Write-Host "  - biglexj.WinTTS.yaml (sin cambios)" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tip: Solo necesitas actualizar el archivo installer.yaml" -ForegroundColor Yellow
Write-Host ""

# Preguntar si quiere ver el contenido del installer.yaml
$response = Read-Host "¿Quieres ver el contenido actualizado del installer.yaml? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "=== Contenido de biglexj.WinTTS.installer.yaml ===" -ForegroundColor Cyan
    Write-Host ""
    Get-Content ".\manifests-msix\biglexj.WinTTS.installer.yaml" | ForEach-Object { Write-Host $_ -ForegroundColor White }
}

Write-Host ""
Write-Host "✅ Una vez actualizado el PR, la validación debería pasar sin problemas" -ForegroundColor Green
Write-Host ""
