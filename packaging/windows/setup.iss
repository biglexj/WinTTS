; ============================================================================
; setup.iss - Instalador de Windows (Inno Setup) de WinTTS
; ----------------------------------------------------------------------------
; Basado en la plantilla compartida "Biglex Modern 2.0":
;   Origen: D:\Proyectos\biglexj\Scripts\tools\inno\BiglexModern.iss
;   Copia local: el repositorio queda autocontenido, sin includes a la
;   carpeta compartida.
;
; version.iss lo genera el script de build con la version real:
;   #define MyAppVersion "2.0.0"
;
; Compilar siempre con el script oficial del repo:
;   pwsh -ExecutionPolicy Bypass -File scripts\packaging\Build-Installer.ps1
; ============================================================================

#include "version.iss"
#include "identity.iss"

[Setup]
; --- IDENTIDAD DE ACTUALIZACION: unica y estable por app -------------------
; Mantenerla para que una version nueva actualice la anterior y no cree una
; instalacion paralela. (Migracion desde NSIS/MSIX: ver MIGRATION.md)
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=Biglex
AppPublisherURL=https://biglexj.com
AppSupportURL=https://biglexj.com
DefaultDirName={localappdata}\Programs\{#MyAppDirectory}
DefaultGroupName={#MyAppName}
; --- Pantallas: solo la nuestra + progreso + exito --------------------------
DisableWelcomePage=yes
DisableDirPage=yes
DisableProgramGroupPage=yes
DisableReadyPage=yes
; El instalador se publica en release/, la carpeta de artefactos del repo
; (ver .agents/rules/release.md). release/ no se versiona.
OutputDir=..\..\release
OutputBaseFilename={#MyAppDirectory}-Setup-{#MyAppVersion}
SetupIconFile={#MyAppIconSource}
UninstallDisplayIcon={app}\{#MyAppExe}
UninstallDisplayName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
ShowLanguageDialog=no
MinVersion=10.0
; --- Identidad visual moderna + tema claro/oscuro automatico (IS 6.6+) ---
WizardStyle=modern {#MyAppTheme}
WizardBackColor=#F7F9FA
WizardBackColorDynamicDark=#15191C
WizardImageBackColor=clWhite
WizardImageBackColorDynamicDark=#2B2B2B
; --- Instalacion por usuario (sin privilegios de administrador) -------------
; PrivilegesRequiredOverridesAllowed se deja vacio a proposito: abrir el
; dialogo "Seleccion del Modo de Instalacion" anade una pantalla extra.
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; --- Comportamiento --------------------------------------------------------
CloseApplications=yes
RestartApplications=no
SetupLogging=yes
VersionInfoDescription={#MyAppName} instalador
VersionInfoProductName={#MyAppName}
VersionInfoCompany=Biglex

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Messages]
spanish.FinishedHeadingLabel=Instalación completada
spanish.FinishedLabel={#MyAppName} se instaló correctamente.
spanish.FinishedLabelNoIcons={#MyAppName} se instaló correctamente.
spanish.ClickFinish=Pulsa Finalizar para cerrar el instalador.

[CustomMessages]
spanish.RunApp=Ejecutar {#MyAppName}

[Files]
; Payload preparado por scripts\packaging\Build-Installer.ps1 en el staging
; (src-tauri\target\inno-stage). Solo contiene el ejecutable real y sus DLL.
Source: "..\..\src-tauri\target\inno-stage\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Icono oficial del producto: se extrae a {tmp} para la presentacion y no se
; instala como payload.
Source: "{#MyAppIconSource}"; Flags: dontcopy

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
; Acceso directo de escritorio, igual que lo dejaba el instalador NSIS de Tauri.
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "{cm:RunApp}"; Flags: nowait postinstall skipifsilent

; Si ya hay eventos en la app, integrar estas llamadas sin borrar sus hooks.
#include "BiglexModernUI.iss"

[Code]
procedure InitializeWizard();
begin
  ModernInitialize;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  ModernPageChanged(CurPageID);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := ModernNextButtonClick(CurPageID);
end;
