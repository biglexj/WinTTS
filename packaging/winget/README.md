# Manifiestos WinGet de WinTTS (preparados, no publicados)

Estos tres archivos sustituyen el empaquetado **portable** que WinTTS usaba
hasta ahora (`archivado/manifests-exe/`, `InstallerType: portable`) por el
instalador propio de Windows con Inno Setup.

| Archivo | Contenido |
| --- | --- |
| `biglexj.WinTTS.yaml` | Manifiesto de versión. |
| `biglexj.WinTTS.installer.yaml` | Manifiesto del instalador: `InstallerType: inno`, `Scope: user`. |
| `biglexj.WinTTS.locale.es-PE.yaml` | Metadatos y notas de instalación en español. |

## Estado

**Preparado, sin publicar.** No se ha creado ningun pull request en
`microsoft/winget-pkgs` ni se ha publicado ninguna release de GitHub.

Para que el manifiesto sea publicable hacen falta dos cosas:

1. La release de GitHub con el artefacto `WinTTS-Setup-<version>.exe`.
2. Que `InstallerUrl` apunte a ese artefacto y que `InstallerSha256` sea el
   hash de ese mismo fichero.

`scripts/packaging/Build-Installer.ps1` ya reescribe `InstallerSha256` con el
hash del instalador recien compilado. Ese hash es el del artefacto **local**;
al publicar hay que confirmar que el binario subido a GitHub es identico
byte a byte.

## Comprobacion antes de publicar

```powershell
winget build --manifest packaging\winget --architecture x64 --output .\winget-out
winget validate --manifest .\winget-out\2.0.0\biglexj.WinTTS.yaml
```

`winget build` falla si el hash no coincide con el binario local que se le
indique, de modo que sirve como control previo.

## Nota sobre el cambio de tipo

Cambiar de `portable` a `inno` no es un cambio cosmetico:

- `portable` no instala nada: es el ejecutable suelto.
- `inno` instala en `%LOCALAPPDATA%\Programs\WinTTS`, crea accesos directos y
  registra la entrada de desinstalacion.

Un usuario que ya tenga WinTTS instalado desde la Tienda (MSIX) o desde el
NSIS de Tauri tiene una copia en otra carpeta: ver
`packaging/windows/MIGRATION.md` para el procedimiento de desinstalacion sin
perder datos.
