; ============================================================================
; identity.iss - Configuracion por aplicacion de WinTTS.
; ---------------------------------------------------------------------------
; MyAppId debe permanecer estable entre versiones: es lo que hace que una
; version nueva actualice la anterior en lugar de crear una instalacion
; paralela. El valor es propio de WinTTS y no reutiliza ningun GUID de MSI,
; MSIX ni del instalador NSIS de Tauri.
; ---------------------------------------------------------------------------
#ifndef MyAppName
  #define MyAppName "WinTTS"
#endif
; El GUID va sin llaves: en [Setup] las llaves se interpretan como constante.
; Inno Setup normaliza el valor y registra la entrada de desinstalacion bajo
; {41B4689A-39EB-4553-8BFA-2BA5FA76EFDD}_is1 en HKCU.
#ifndef MyAppId
  #define MyAppId "41B4689A-39EB-4553-8BFA-2BA5FA76EFDD"
#endif
#ifndef MyAppDirectory
  #define MyAppDirectory "WinTTS"
#endif
; Nombre real del binario: el crate Rust se llama "wintts", por lo que el
; ejecutable publicado es wintts.exe (no WinTTS.exe).
#ifndef MyAppExe
  #define MyAppExe "wintts.exe"
#endif
; Nombre con el que el motor extrae el icono a {tmp}. Se mantiene separado de
; MyAppIconSource porque ExtractTemporaryFile solo acepta el nombre, sin ruta.
#ifndef MyAppIcon
  #define MyAppIcon "app_icon.ico"
#endif
; Icono oficial del producto (recurso real del repo, no un PNG renombrado).
#ifndef MyAppIconSource
  #define MyAppIconSource "..\..\Image\app_icon.ico"
#endif
; Tema automatico: oscuro o claro segun la configuracion de Windows.
#ifndef MyAppTheme
  #define MyAppTheme "dynamic"
#endif

#ifndef MyAppSubtitle
  #define MyAppSubtitle "Dale voz a tus textos, en tu equipo."
#endif
