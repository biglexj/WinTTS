# Script para generar assets de imágenes para el paquete MSIX
# Autor: BiglexJ
# Fecha: 2026-01-20

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ImageDir = Join-Path $ProjectRoot "Image"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WinTTS - Generador de Assets de Imágenes" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Crear directorio de imágenes si no existe
if (-not (Test-Path $ImageDir)) {
    New-Item -ItemType Directory -Path $ImageDir -Force | Out-Null
    Write-Host "✅ Directorio Image creado" -ForegroundColor Green
}

# Cargar ensamblados de .NET para manipular imágenes
Add-Type -AssemblyName System.Drawing

$pngIconPath = Join-Path $ProjectRoot "assets\branding\icons\icon-transparent.png"
$icoIconPath = Join-Path $ProjectRoot "Image\app_icon.ico"

$sourcePath = if (Test-Path $pngIconPath) { $pngIconPath } elseif (Test-Path $icoIconPath) { $icoIconPath } else { $null }

if (-not $sourcePath) {
    Write-Host "❌ No se encontró el ícono en: $pngIconPath ni en $icoIconPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Fuente del ícono encontrada: $sourcePath" -ForegroundColor Green
Write-Host ""

# Función para crear una imagen PNG de un tamaño específico
function Create-PngFromIcon {
    param(
        [string]$SourceIcon,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height,
        [string]$BackgroundColor = "Transparent"
    )
    
    try {
        if ($SourceIcon.EndsWith(".ico", [System.StringComparison]::OrdinalIgnoreCase)) {
            $icon = [System.Drawing.Icon]::new($SourceIcon)
            $sourceBitmap = $icon.ToBitmap()
        } else {
            $sourceBitmap = [System.Drawing.Bitmap]::FromFile($SourceIcon)
        }
        
        # Crear un bitmap del tamaño deseado
        $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        
        # Configurar calidad de renderizado
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Limpiar con color de fondo
        if ($BackgroundColor -eq "Transparent") {
            $graphics.Clear([System.Drawing.Color]::Transparent)
        } else {
            $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($BackgroundColor))
        }
        
        # Dibujar la imagen escalada
        $destRect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
        $graphics.DrawImage($sourceBitmap, $destRect)
        
        # Guardar como PNG
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        # Limpiar recursos
        $graphics.Dispose()
        $bitmap.Dispose()
        $sourceBitmap.Dispose()
        $icon.Dispose()
        
        return $true
    }
    catch {
        Write-Host "⚠️  Error al crear $OutputPath : $_" -ForegroundColor Yellow
        return $false
    }
}

# Generar las imágenes requeridas
Write-Host "Generando assets de imágenes..." -ForegroundColor Yellow
Write-Host ""

$assets = @(
    @{ Name = "Square44x44Logo.png"; Width = 44; Height = 44 },
    @{ Name = "Square150x150Logo.png"; Width = 150; Height = 150 },
    @{ Name = "Wide310x150Logo.png"; Width = 310; Height = 150 },
    @{ Name = "StoreLogo.png"; Width = 50; Height = 50 }
)

$successCount = 0

foreach ($asset in $assets) {
    $outputPath = Join-Path $ImageDir $asset.Name
    Write-Host "  Generando $($asset.Name) ($($asset.Width)x$($asset.Height))..." -NoNewline
    
    $result = Create-PngFromIcon -SourceIcon $iconPath -OutputPath $outputPath -Width $asset.Width -Height $asset.Height
    
    if ($result) {
        Write-Host " ✅" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " ❌" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✅ Proceso completado: $successCount/$($assets.Count) assets generados" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Assets generados en: $ImageDir" -ForegroundColor White
Write-Host ""
