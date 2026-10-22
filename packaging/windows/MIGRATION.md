# Migración de WinTTS al instalador Inno Setup (Biglex Modern 2.0)

Este documento explica como conviven el instalador nuevo de Inno Setup con
los empaquetados anteriores de WinTTS, y como desinstalar los anteriores
**sin borrar datos del usuario** ni instalaciones previas de otras apps.

> Regla de la ola de modernizacion: este cambio **no borra** ninguna
> instalacion previa ni ningun dato del usuario. Solo prepara el terreno y
> documenta el procedimiento.

---

## 1. Que cambia y que no

| | Antes | Despues |
| --- | --- | --- |
| Motor de empaquetado Windows | NSIS generado por Tauri (`bundle.targets: "all"`) | Inno Setup 6.7.3, plantilla **Biglex Modern 2.0** |
| Artefacto publicado | `WinTTS-Windows-x64-<version>.exe` (portable) y `WinTTS-Windows-x64-<version>.msix` | `WinTTS-Setup-<version>.exe` (instalador) |
| Carpeta de instalacion (por usuario) | `%LOCALAPPDATA%\WinTTS` | `%LOCALAPPDATA%\Programs\WinTTS` |
| Carpeta de instalacion (por maquina) | `%PROGRAMFILES%\WinTTS` | no se usa: el instalador nuevo es **siempre por usuario** |
| Desinstalador | `%LOCALAPPDATA%\WinTTS\uninstall.exe` | `%LOCALAPPDATA%\Programs\WinTTS\unins000.exe` |
| Entrada en "Agregar o quitar programas" | `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\WinTTS` | `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\41B4689A-39EB-4553-8BFA-2BA5FA76EFDD_is1` |
| Clave de producto que escribe el instalador | `HKCU\Software\com.biglexj.wintts` | Inno Setup no escribe clave de producto propia |
| Id de actualizacion (AppId) | `com.biglexj.wintts` | `41B4689A-39EB-4553-8BFA-2BA5FA76EFDD` |
| Acceso directo | Menú Inicio + Escritorio | Menú Inicio + Escritorio (mismos nombres: `WinTTS`) |
| Elevacion | Segun el modo elegido | Ninguna: `PrivilegesRequired=lowest` |

Datos de referencia del NSIS de Tauri tomados de la plantilla NSIS que
embebe el propio CLI de Tauri (`node_modules\@tauri-apps\cli-win32-x64-msvc`):
`WriteUninstaller "$INSTDIR\uninstall.exe"`,
`!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"`
y, en modo `currentUser`, `StrCpy $INSTDIR "$LOCALAPPDATA\${PRODUCTNAME}"`.

### Lo que no se toca

- `src-tauri/tauri.conf.json` sigue con `bundle.targets: "all"`. El build de
  release usa `--no-bundle`, asi que **no** se genera el NSIS de Tauri ni se
  toca el empaquetado de macOS ni de Linux. Si alguien ejecuta
  `npm run build:desktop` a mano, seguira produciendo el NSIS: eso es
  deliberado, el cambio de motor se decide aparte.
- El MSIX (`Package.appxmanifest`, `scripts/build-msix.ps1`) y el ejecutable
  portable (`scripts/build-exe.ps1`) siguen existiendo.
- La plantilla compartida `D:\Proyectos\biglexj\Scripts\tools\inno` es de solo
  lectura: el repo copia sus cuatro archivos y queda autocontenido.

---

## 2. Datos del usuario que ningun paso borra

| Ubicacion | Que contiene | Que hace el instalador nuevo |
| --- | --- | --- |
| `%LOCALAPPDATA%\com.biglexj.wintts` | Perfil de WebView2: cache, `localStorage`, ajustes de la app | No la toca (esta fuera de `{app}`) |
| `%LOCALAPPDATA%\Packages\biglexj.WinTTS_9NS5MH65JBJ3\` | Datos de la app instalada desde Microsoft Store (MSIX) | No la toca |
| `%LOCALAPPDATA%\Programs\WinTTS` | Carpeta de instalacion del Inno Setup | Es lo **unico** que Inno borra al desinstalar |
| Documentos, audios exportados, etc. | Archivos del usuario | No se tocan nunca |

El desinstalador de Inno Setup solo retira los ficheros que el propio
instalador copio en `{app}` y su propia entrada de registro. No hay ninguna
directiva `[UninstallDelete]` que borre datos del usuario.

---

## 3. Desinstalar el NSIS previo conservando los datos

Esto es **manual y opcional**: el instalador nuevo convive con el NSIS
anterior porque tienen carpetas y claves distintas. No se automatiza para no
borrar nada por sorpresa.

1. Cerrar WinTTS si esta abierto (icono en la bandeja o ventana principal).
2. Lanzar el desinstalador del NSIS:

   ```powershell
   Start-Process "$env:LOCALAPPDATA\WinTTS\uninstall.exe"
   ```

   Si no existe ese fichero, usar "Agregar o quitar programas" ->
   "WinTTS" -> "Desinstalar".
3. **Revisar las opciones que ofrezca el desinstalador antes de confirmar.**
   Si aparece una casilla del tipo "eliminar tambien los datos del usuario",
   **dejarla desmarcada**.
4. Comprobar el resultado:

   ```powershell
   Test-Path "$env:LOCALAPPDATA\WinTTS"          # esperado: False (programa)
   Test-Path "$env:LOCALAPPDATA\com.biglexj.wintts"  # esperado: True (datos)
   ```

5. Instalar el instalador nuevo (`WinTTS-Setup-<version>.exe`).

### Si el NSIS estaba instalado por maquina (`%PROGRAMFILES%\WinTTS`)

El desinstalador esta en `%PROGRAMFILES%\WinTTS\uninstall.exe` y **si**
requiere elevacion. La entrada de desinstalacion vive en
`HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\WinTTS`.

### Si lo que hay instalado es el MSIX de la Tienda

`winget list --name WinTTS` lo muestra con origen `msstore`. Se retira con:

```powershell
winget uninstall --id 9NS5MH65JBJ3
```

Eso **no** borra los datos locales de la app, pero es una operacion de la
Tienda: decidela consciously, el instalador nuevo no la ejecuta por ti.

---

## 4. Comprobar que no quedan dos instalaciones

Script de diagnostico (solo lectura). Pegalo en PowerShell:

```powershell
$roots = @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall',
           'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall')
$entradas = foreach ($r in $roots) {
    Get-ChildItem $r -ErrorAction SilentlyContinue | ForEach-Object {
        $p = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue
        if ($p.DisplayName -like '*WinTTS*') {
            [pscustomobject]@{
                Clave = $_.PSChildName
                Nombre = $p.DisplayName
                Version = $p.DisplayVersion
                Ruta = $p.InstallLocation
                Desinstalador = $p.UninstallString
            }
        }
    }
}
$entradas | Format-List

'--- carpetas ---'
foreach ($p in @("$env:LOCALAPPDATA\WinTTS",
                 "$env:PROGRAMFILES\WinTTS",
                 "$env:LOCALAPPDATA\Programs\WinTTS")) {
    '{0,-45} {1}' -f $p, (Test-Path $p)
}
```

Resultado esperado **con una sola instalacion** (la nueva):

- Una sola entrada de desinstalacion: `41B4689A-39EB-4553-8BFA-2BA5FA76EFDD_is1`.
- `%LOCALAPPDATA%\WinTTS` = False y `%PROGRAMFILES%\WinTTS` = False.
- `%LOCALAPPDATA%\Programs\WinTTS` = True.

Si sigue apareciendo la entrada `WinTTS` (NSIS) junto a la del Inno Setup,
hay dos instalaciones: repetir el paso 3.

### Peligro verificado: los accesos directos tienen el mismo nombre

El NSIS de Tauri y el Inno Setup crean los dos un acceso directo llamado
`WinTTS` en el Menú Inicio y otro en el Escritorio. **El desinstalador del
NSIS borra los accesos directos con ese nombre**, incluidos los que creo el
instalador de Inno Setup.

Comprobado en esta maquina: tras instalar NSIS y luego desinstalarlo, los
accesos directos del Menu Inicio y del Escritorio quedaron en cero, aunque la
instalacion de Inno Setup siguiera intacta en disco y en el registro.

Orden recomendado:

1. Desinstalar **NSIS primero**.
2. Instalar el instalador de Inno Setup (crea de nuevo los accesos directos).
3. Si ya se instalaron en el orden contrario, volver a instalar WinTTS con el
   instalador nuevo para recuperar los accesos directos.

Alternativa: renombrar los accesos directos del instalador nuevo (por ejemplo
"WinTTS 2") desde `[Icons]`, si se quiere evitar la colision de nombres.

---

## 5. Actualizacion (Inno Setup contra Inno Setup)

El `AppId` de `packaging\windows\identity.iss` es fijo. Ejecutar un
instalador nuevo sobre una instalacion previa **actualiza** en el sitio: no se
crea una carpeta paralela ni una segunda entrada de desinstalacion.

```powershell
# Reinstalar la misma version (debe salir con codigo 0 y sin instalar dos veces)
& "$env:LOCALAPPDATA\Programs\WinTTS\unins000.exe" /VERYSILENT /SUPPRESSMSGBOXES
```

El instalador nuevo **no** reconoce ni desinstala el NSIS de Tauri: son
motores distintos y no comparten AppId. La transicion se hace a mano con el
apartado 3.

---

## 6. WinGet

El manifiesto portable que vivia en `archivado\manifests-exe\` queda
preparado en `packaging\winget\` con `InstallerType: inno` y `Scope: user`.
**No se ha publicado nada**: falta la release de GitHub con el artefacto
final. Ver `packaging\winget\README.md`.

---

## 7. Requisito previo: Microsoft Edge WebView2 Runtime

WinTTS es una app de Tauri v2 y necesita el **WebView2 Runtime**.

- Windows 11 y Windows 10 actualizado lo traen de serie.
- El instalador NSIS de Tauri incluia el *bootstrapper* de WebView2 y lo
  ofrecia en su propia pagina. El instalador de Inno Setup **no** lo
  incluye: comprueba el runtime antes de instalar.

Comprobacion:

```powershell
$k = 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'
if (Test-Path $k) { (Get-ItemProperty $k).pv } else { 'WebView2 NO detectado' }
```

Pendiente conhecido: decided si el instalador nuevo debe incrustar el
bootstrapper (`MicrosoftEdgeWebview2Setup.exe`) o delegar en el runtime
preinstalado. Hoy delega en el runtime preinstalado y lo documenta.

---

## 8. Defecto conocido: el arranque automatico tras instalar

**Sintoma**: al terminar la instalacion, si "Ejecutar WinTTS" esta marcado, la
app no arranca. Windows muestra el error duro:

> wintts.exe - Error de la aplicacion: La aplicacion no se pudo iniciar
> correctamente (0xc00004bc).

**No es un problema del empaquetado.** Queda caracterizado con evidencia:

| Escenario | Resultado |
| --- | --- |
| Lanzar `wintts.exe` instalado desde una terminal o desde el acceso directo | **Arranca bien** (ventana "WinTTS - Local Speech") |
| Lanzar el ejecutable portable de `release\` desde una terminal | **Arranca bien** |
| Lanzar la app desde un `[Run]` de Inno Setup (instalado o portable) | **Falla con 0xc00004bc** |
| Lanzar la app desde un `[Run]` de un `.iss` minimo y ajeno a este proyecto | **Falla igual** |
| Lanzar la app desde un `[Run]` de Inno, con el instalador arrancado desde Explorador (padre `explorer.exe`) | **Falla igual** |

Se descartaron como causa: el directorio de trabajo, el entorno (completo y
correcto en el hijo del instalador), el objeto de trabajo (job) de Windows,
`ShellExecute` frente a `CreateProcess`, la presencia de `WebView2Loader.dll`
y la ruta de instalacion. La app falla solo cuando su proceso padre es un
instalador que sigue vivo.

**Consecuencia practica**: la casilla "Ejecutar WinTTS" de la pantalla de exito
produce ese error. La app se abre sin problema desde el acceso directo del
Menu Inicio o del Escritorio, o desde `%LOCALAPPDATA%\Programs\WinTTS\wintts.exe`.

Como el defecto esta en la aplicacion (arranque de WebView2 al ser lanzada
desde un instalador) y no en el empaquetado, la decision es de la app:

1. Arreglar el arranque de WinTTS cuando su proceso padre es un instalador
   (es el mismo camino que usaba el NSIS de Tauri), o
2. Quitar la entrada `[Run]` de `setup.iss` mientras tanto.

No se ha aplicado ninguna de las dos: el cambio de este trabajo es solo de
empaquetado.