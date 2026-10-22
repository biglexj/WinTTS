; Biglex Modern UI 2.0. Copiar junto al setup.iss; sin dependencias externas.
; Requiere MyAppName y MyAppIcon definidos por el instalador.
; Coordenadas lógicas a 96 DPI. ScaleX/ScaleY se aplican UNA vez a todo.
;
; ---------------------------------------------------------------------------
; AJUSTES DE TECLADO VERIFICADOS FISICAMENTE (21-10-2026, LyraFlow)
; ---------------------------------------------------------------------------
; 1) WinSetFocus: WizardForm.ActiveControl no mueve el foco a controles que
;    viven dentro de un panel, asi que se usa la API de Windows.
; 2) ModernPathKeyDown: el motor de Inno no enruta al formulario las teclas
;    que consume el control de edicion, de modo que el campo de ruta gestiona
;    su propio Tab y su propia Enter.
; 3) ModernKeyUp atiende Enter y Espacio sobre los botones: el motor de Inno
;    tampoco enruta al formulario esas teclas sobre los botones de la plantilla.
; 4) Los botones nativos Siguiente y Cancelar salen del recorrido del tab
;    (quedan tapados por el panel opaco) y Siguiente deja de ser el boton por
;    defecto, para que Enter no avance el asistente por su cuenta. Siguen
;    visibles: el motor los necesita en modo silencioso.
; ---------------------------------------------------------------------------
[Code]
const
  ModernWidth = 560;
  ModernHeight = 444;
  ModernMargin = 20;
  ModernControlRadius = 10;
  ModernLogoRadius = 14;
  ModernAccent = $B8BE00;  // #00BEB8 (BGR)
var
  ModernPage: TWizardPage;
  ModernHost: TPanel;
  ModernPath: TEdit;
  ModernInstall, ModernFolder: TBitmapButton;
  ModernInstallFocus, ModernFolderFocus: TBitmapImage;
  ModernBackground, ModernSurface, ModernText, ModernMuted, ModernLine,
    ModernLogoSurface: TColor;
  ModernFocusSet: Boolean;

{ Foco real de un control. WizardForm.ActiveControl solo admite controles
  directos del formulario y los de esta plantilla viven en un panel, asi que
  se usa la API de Windows. }
function WinSetFocus(hWnd: Longint): Longint;
  external 'SetFocus@user32.dll stdcall';

procedure ModernLabel(const Text: String; X, Y, W, H, Size: Integer;
  Color: TColor; Bold, Centered: Boolean);
var L: TNewStaticText;
begin
  L := TNewStaticText.Create(WizardForm);
  L.Parent := ModernHost;
  L.AutoSize := False;
  L.SetBounds(ScaleX(X), ScaleY(Y), ScaleX(W), ScaleY(H));
  L.Caption := Text;
  L.Font.Name := 'Segoe UI';
  L.Font.Size := Size;
  L.Font.Color := Color;
  L.Color := ModernBackground;
  L.StyleElements := [];
  L.ShowAccelChar := False;
  if Bold then L.Font.Style := [fsBold];
  if Centered then L.Alignment := taCenter;
end;

procedure ModernRound(Bitmap: TBitmap; W, H, Radius: Integer;
  Outside, Inside: TColor);
var Bounds: TRect;
begin
  Bitmap.Width := ScaleX(W);
  Bitmap.Height := ScaleY(H);
  Bitmap.Canvas.Brush.Color := Outside;
  Bounds.Left := 0;
  Bounds.Top := 0;
  Bounds.Right := Bitmap.Width;
  Bounds.Bottom := Bitmap.Height;
  Bitmap.Canvas.FillRect(Bounds);
  Bitmap.Canvas.Brush.Color := Inside;
  Bitmap.Canvas.Pen.Color := Inside;
  Bitmap.Canvas.RoundRect(0, 0, Bitmap.Width, Bitmap.Height,
    ScaleX(Radius * 2), ScaleY(Radius * 2));
end;

procedure ModernTile(X, Y, W, H, Radius: Integer; Color: TColor);
var Image: TBitmapImage;
begin
  Image := TBitmapImage.Create(WizardForm);
  Image.Parent := ModernHost;
  Image.SetBounds(ScaleX(X), ScaleY(Y), ScaleX(W), ScaleY(H));
  ModernRound(Image.Bitmap, W, H, Radius, ModernBackground, Color);
end;

procedure ModernLogo(X, Y, Size: Integer; Background: TColor);
var Image: TBitmapImage;
begin
  Image := TBitmapImage.Create(WizardForm);
  Image.Parent := ModernHost;
  Image.SetBounds(ScaleX(X), ScaleY(Y), ScaleX(Size), ScaleY(Size));
  InitializeBitmapImageFromIcon(Image, ExpandConstant('{tmp}\{#MyAppIcon}'),
    Background, [16, 24, 32, 48, 64, 128, 256]);
  Image.Stretch := True;
  { InitializeBitmapImageFromIcon REDIMENSIONA el control al tamano del icono
    cargado (por ejemplo 32 en una caja de 40), de modo que el grafico se
    quedaba pegado a la esquina superior izquierda del recuadro. Se restauran
    los limites para que el icono quede centrado en su caja. }
  Image.SetBounds(ScaleX(X), ScaleY(Y), ScaleX(Size), ScaleY(Size));
end;

procedure ModernBrowse(Sender: TObject);
var Chosen: String;
begin
  Chosen := ModernPath.Text;
  if BrowseForFolder('Selecciona la ubicación de instalación', Chosen, True) then
    ModernPath.Text := Chosen;
end;

procedure ModernStartInstall(Sender: TObject);
begin
  // Mantener la navegación, validaciones y motor originales de Inno.
  WizardForm.NextButton.OnClick(WizardForm.NextButton);
end;

procedure ModernKeyUp(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  if WizardForm.CurPageID <> ModernPage.ID then Exit;
  ModernInstallFocus.Visible := ModernInstall.Focused;
  ModernFolderFocus.Visible := ModernFolder.Focused;
  { El motor de Inno no enruta al formulario la pulsacion de Enter y Espacio
    sobre los botones de la plantilla, asi que se atienden aqui. El boton
    Siguiente nativo no es el boton por defecto, de modo que Enter no avanza
    el asistente por su cuenta. }
  if (Key = 13) or (Key = 32) then
  begin
    if ModernFolder.Focused then
    begin
      Key := 0;
      ModernBrowse(Sender);
    end
    else if ModernInstall.Focused then
    begin
      Key := 0;
      ModernStartInstall(Sender);
    end;
  end;
end;

{ El campo de ruta tiene su propio manejador de teclado: el motor de Inno no
  enruta al formulario las teclas que consume el control de edicion. }
procedure ModernPathKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  if not ModernPath.Focused then Exit;
  if Key = 9 then
  begin
    Key := 0;
    if ssShift in Shift then
      WinSetFocus(ModernInstall.Handle)
    else
      WinSetFocus(ModernFolder.Handle);
  end
  else if Key = 13 then
  begin
    Key := 0;
    ModernStartInstall(Sender);
  end;
end;

procedure ModernKeyDown(Sender: TObject; var Key: Word; Shift: TShiftState);
begin
  if WizardForm.CurPageID <> ModernPage.ID then Exit;
  { El campo de ruta gestiona su propio teclado (ModernPathKeyDown). }
  if ModernPath.Focused then Exit;
  if Key = 9 then
  begin
    // Mantener Tab dentro de los tres controles visibles del panel inicial.
    Key := 0;
    if ssShift in Shift then
    begin
      if ModernPath.Focused then WinSetFocus(ModernInstall.Handle)
      else if ModernInstall.Focused then WinSetFocus(ModernFolder.Handle)
      else WinSetFocus(ModernPath.Handle);
    end
    else
    begin
      if ModernPath.Focused then WinSetFocus(ModernFolder.Handle)
      else if ModernFolder.Focused then WinSetFocus(ModernInstall.Handle)
      else WinSetFocus(ModernPath.Handle);
    end;
  end
  else if ((Key = 13) or (Key = 32)) and ModernFolder.Focused then
  begin
    Key := 0;
    ModernBrowse(Sender);
  end
  else if (Key = 13) or ((Key = 32) and ModernInstall.Focused) then
  begin
    Key := 0;
    ModernStartInstall(Sender);
  end;
end;

procedure ModernInitialize();
var Caption: String; C: TCanvas;
begin
  if IsDarkInstallMode then
  begin
    ModernBackground := $1C1915; // #15191C
    ModernSurface := $302B22;    // #222B30
    ModernText := $F1F0EE;
    ModernMuted := $BDB7AF;
    ModernLine := $37312B;
    ModernLogoSurface := $32361E;
  end
  else
  begin
    ModernBackground := $FAF9F7;
    ModernSurface := $F0EBE5;
    ModernText := $211C18;
    ModernMuted := $6F6358;
    ModernLine := $DED6CE;
    ModernLogoSurface := $E9EFE0;
  end;
  WizardForm.ClientWidth := ScaleX(ModernWidth);
  WizardForm.ClientHeight := ScaleY(ModernHeight);
  WizardForm.Caption := 'Instalar {#MyAppName}';
  ModernPage := CreateCustomPage(wpWelcome, '', '');
  ModernHost := TPanel.Create(WizardForm);
  ModernHost.Parent := WizardForm;
  ModernHost.SetBounds(0, 0, WizardForm.ClientWidth, WizardForm.ClientHeight);
  ModernHost.BevelOuter := bvNone;
  ModernHost.StyleElements := [];
  ModernHost.Color := ModernBackground;
  ModernHost.Visible := False;
  ExtractTemporaryFile('{#MyAppIcon}');
  ModernLogo(ModernMargin, 19, 20, ModernBackground);
  ModernLabel('{#MyAppName}', 48, 21, 310, 23, 10, ModernText, True, False);
  ModernLabel('INSTALADOR', 422, 22, 118, 20, 9, ModernMuted, False, True);
  ModernTile(ModernMargin, 60, 520, 1, 0, ModernLine);
  ModernTile(248, 96, 64, 64, ModernLogoRadius, ModernLogoSurface);
  ModernLogo(260, 108, 40, ModernLogoSurface);
  ModernLabel('Todo listo para comenzar', ModernMargin, 174, 520, 38,
    20, ModernText, True, True);
  ModernLabel('Instala {#MyAppName} en tu equipo con una configuración sencilla.',
    ModernMargin, 218, 520, 40, 10, ModernMuted, False, True);
  ModernTile(ModernMargin, 262, 520, 70, ModernControlRadius, ModernSurface);
  ModernLabel('Ubicación de instalación', 32, 274, 464, 20,
    9, ModernMuted, False, False);
  // La etiqueta tiene el mismo fondo que la tarjeta.
  TNewStaticText(ModernHost.Controls[ModernHost.ControlCount - 1]).Color := ModernSurface;
  ModernPath := TEdit.Create(WizardForm);
  ModernPath.Parent := ModernHost;
  ModernPath.StyleElements := [];
  ModernPath.BorderStyle := bsNone;
  ModernPath.Color := ModernSurface;
  ModernPath.Font.Name := 'Segoe UI';
  ModernPath.Font.Size := 9;
  ModernPath.Font.Color := ModernText;
  ModernPath.SetBounds(ScaleX(32), ScaleY(302), ScaleX(452), ScaleY(22));
  ModernPath.Text := WizardForm.DirEdit.Text;
  ModernPath.TabOrder := 0;
  ModernPath.OnKeyDown := @ModernPathKeyDown;
  ModernFolderFocus := TBitmapImage.Create(WizardForm);
  ModernFolderFocus.Parent := ModernHost;
  ModernFolderFocus.SetBounds(ScaleX(494), ScaleY(290), ScaleX(36), ScaleY(36));
  ModernRound(ModernFolderFocus.Bitmap, 36, 36, 6, ModernSurface, ModernText);
  ModernFolderFocus.Visible := False;
  ModernFolder := TBitmapButton.Create(WizardForm);
  ModernFolder.Parent := ModernHost;
  ModernFolder.SetBounds(ScaleX(496), ScaleY(292), ScaleX(32), ScaleY(32));
  ModernFolder.Caption := 'Elegir carpeta de instalación';
  ModernFolder.Hint := ModernFolder.Caption;
  ModernFolder.ShowHint := True;
  ModernFolder.TabStop := True;
  ModernFolder.TabOrder := 1;
  ModernFolder.Cursor := crHand;
  ModernFolder.BackColor := ModernSurface;
  ModernRound(ModernFolder.Bitmap, 32, 32, 4, ModernSurface, ModernSurface);
  C := ModernFolder.Bitmap.Canvas;
  C.Pen.Color := ModernAccent;
  C.Pen.Width := ScaleX(1);
  C.MoveTo(ScaleX(9), ScaleY(12));
  C.LineTo(ScaleX(9), ScaleY(10));
  C.LineTo(ScaleX(15), ScaleY(10));
  C.LineTo(ScaleX(18), ScaleY(12));
  C.LineTo(ScaleX(23), ScaleY(12));
  C.LineTo(ScaleX(23), ScaleY(22));
  C.LineTo(ScaleX(9), ScaleY(22));
  C.LineTo(ScaleX(9), ScaleY(12));
  C.LineTo(ScaleX(23), ScaleY(12));
  ModernFolder.OnClick := @ModernBrowse;
  ModernLabel('✓', 20, 350, 20, 24, 12, ModernAccent, True, False);
  ModernLabel('Instalación para el usuario actual', 44, 352, 496, 24,
    9, ModernMuted, False, False);
  ModernInstallFocus := TBitmapImage.Create(WizardForm);
  ModernInstallFocus.Parent := ModernHost;
  ModernInstallFocus.SetBounds(ScaleX(18), ScaleY(386), ScaleX(524), ScaleY(50));
  ModernRound(ModernInstallFocus.Bitmap, 524, 50, 12, ModernBackground, ModernText);
  ModernInstallFocus.Visible := False;
  ModernInstall := TBitmapButton.Create(WizardForm);
  ModernInstall.Parent := ModernHost;
  ModernInstall.SetBounds(ScaleX(ModernMargin), ScaleY(388), ScaleX(520), ScaleY(46));
  ModernInstall.Caption := 'Instalar {#MyAppName}';
  ModernInstall.TabStop := True;
  ModernInstall.TabOrder := 2;
  ModernInstall.Cursor := crHand;
  ModernInstall.BackColor := ModernBackground;
  ModernRound(ModernInstall.Bitmap, 520, 46, ModernControlRadius,
    ModernBackground, ModernAccent);
  C := ModernInstall.Bitmap.Canvas;
  C.Font.Name := 'Segoe UI';
  C.Font.Height := -ScaleY(14);
  C.Font.Color := $211C18;
  C.Font.Style := [fsBold];
  Caption := ModernInstall.Caption;
  { Con nombres largos el texto puede no caber en el boton: se reduce el cuerpo
    de la fuente hasta que quepa, con un minimo legible. }
  while (C.TextWidth(Caption) > ModernInstall.Width - ScaleX(28)) and
        (C.Font.Height < -ScaleY(9)) do
    C.Font.Height := C.Font.Height + 1;
  C.TextOut((ModernInstall.Width - C.TextWidth(Caption)) div 2,
    (ModernInstall.Height - C.TextHeight(Caption)) div 2, Caption);
  ModernInstall.OnClick := @ModernStartInstall;
  WizardForm.KeyPreview := True;
  WizardForm.OnKeyDown := @ModernKeyDown;
  WizardForm.OnKeyUp := @ModernKeyUp;
  WizardForm.WizardSmallBitmapImage.Visible := False;
  // Ajuste verificado en LyraFlow: los botones nativos Siguiente y Cancelar
  // quedan tapados por el panel opaco, asi que el foco no debe quedarse en
  // ellos. Se retiran del recorrido del tab SOLO en la pantalla de entrada;
  // el motor los sigue usando (modo silencioso y navegacion interna). Con esto
  // el recorrido queda exactamente ruta -> carpeta -> instalar.
  WizardForm.NextButton.TabStop := False;
  WizardForm.CancelButton.TabStop := False;
  // Siguiente deja de ser el boton por defecto en la entrada: Enter y Espacio
  // se atienden desde el panel y no deben avanzar el asistente por su cuenta.
  // ModernPageChanged lo restaura en progreso y exito, donde Enter debe poder
  // cerrar el instalador con "Finalizar".
  WizardForm.NextButton.Default := False;
end;

procedure ModernPageChanged(CurPageID: Integer);
begin
  ModernHost.Visible := CurPageID = ModernPage.ID;
  if ModernHost.Visible then
  begin
    ModernHost.BringToFront;
    { El foco inicial caia en el boton nativo "Siguiente", que esta tapado por
      el panel: no se veia indicador de foco hasta pulsar Tab. Se lleva al
      campo de ruta, que es lo primero que el usuario debe ver. }
    if not ModernFocusSet then
    begin
      ModernFocusSet := True;
      WinSetFocus(ModernPath.Handle);
    end;
  end;
  WizardForm.BackButton.Visible := False;
  // El motor necesita Siguiente visible para avanzar también en modo silencioso.
  // El panel opaco lo cubre en la entrada y expone un solo botón visual.
  WizardForm.NextButton.Visible := True;
  WizardForm.CancelButton.Visible := True;
  // Fuera de la entrada, los botones nativos vuelven al recorrido del tab y
  // "Siguiente" (Finalizar) vuelve a ser el botón por defecto: con la
  // correction anterior, Enter no cerraba el instalador en la pantalla de
  // éxito (verificado en NubeSync).
  WizardForm.NextButton.TabStop := CurPageID <> ModernPage.ID;
  WizardForm.CancelButton.TabStop := CurPageID <> ModernPage.ID;
  WizardForm.NextButton.Default := CurPageID <> ModernPage.ID;
  { En la pantalla de exito el foco caia en la casilla "Ejecutar <App>", que se
    traga el Enter y deja al usuario sin poder cerrar el instalador con el
    teclado. Se lleva a "Finalizar". }
  if CurPageID = wpFinished then
    WinSetFocus(WizardForm.NextButton.Handle);
end;

function ModernNextButtonClick(CurPageID: Integer): Boolean;
var Path: String;
begin
  Result := True;
  if CurPageID <> ModernPage.ID then Exit;
  Path := Trim(ModernPath.Text);
  if (Path = '') or (Pos(':\', Path) <> 2) or (Length(Path) <= 3) then
  begin
    MsgBox('Indica una carpeta de instalación con ruta absoluta, por ejemplo C:\Apps\{#MyAppName}.', mbError, MB_OK);
    Result := False;
    Exit;
  end;
  WizardForm.DirEdit.Text := Path;
end;

