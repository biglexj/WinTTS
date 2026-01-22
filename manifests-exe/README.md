# WinGet Manifest - MSIX Version

Este directorio contiene los manifests de WinGet actualizados para usar el paquete MSIX desde GitHub Releases.

## Pasos para actualizar el PR de WinGet:

### 1. Subir el MSIX a GitHub Releases

Primero, asegúrate de que el archivo `WinTTS.msix` esté disponible en el release v1.0.0:

1. Ve a: https://github.com/biglexj/WinTTS/releases/tag/v1.0.0
2. Haz clic en "Edit release"
3. Arrastra y suelta el archivo `publish/msix/WinTTS.msix` en la sección de assets
4. Guarda los cambios

### 2. Actualizar o crear nuevo PR en WinGet

Tienes dos opciones:

#### Opción A: Actualizar el PR existente (#331954)

Si el PR aún no ha sido aprobado:

1. Clona el fork de winget-pkgs que creaste
2. Reemplaza los archivos en `manifests/b/biglexj/WinTTS/1.0.0/` con los de esta carpeta
3. Haz commit y push de los cambios
4. El PR se actualizará automáticamente

#### Opción B: Crear un nuevo PR

Si prefieres empezar de cero:

1. Cierra el PR actual (#331954)
2. Usa `wingetcreate` para crear un nuevo PR:

```powershell
wingetcreate new --id biglexj.WinTTS --version 1.0.0 --urls https://github.com/biglexj/WinTTS/releases/download/v1.0.0/WinTTS.msix --submit
```

O manualmente:
1. Fork del repositorio microsoft/winget-pkgs
2. Copia estos archivos a `manifests/b/biglexj/WinTTS/1.0.0/`
3. Crea un PR

## Archivos incluidos:

- `biglexj.WinTTS.installer.yaml` - Configuración del instalador MSIX
- `biglexj.WinTTS.locale.es-PE.yaml` - Información localizada en español
- `biglexj.WinTTS.yaml` - Manifest principal

## Información técnica:

- **SHA256 del MSIX**: `A4A86427181C570F282B20F44CF125E004E928865D0A9887F1C20F974CE3103A`
- **PackageFamilyName**: `biglexj.WinTTS_ppytjz2en1wwy`
- **InstallerType**: `msix`
- **Scope**: `user`

## Ventajas de usar MSIX desde GitHub:

✅ WinGet puede verificar el hash SHA256
✅ No depende de la Microsoft Store para instalación vía WinGet
✅ Los usuarios pueden elegir entre WinGet o Microsoft Store
✅ Método estándar usado por la mayoría de aplicaciones en WinGet
