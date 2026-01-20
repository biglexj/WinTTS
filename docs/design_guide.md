# Guía de Diseño: De CSS a XAML (WPF)

Esta guía explica cómo se estructuró visualmente WinTTS, usando comparaciones con CSS para facilitar la comprensión.

## 🎨 Conceptos Clave

### 1. Border vs CSS Box Model
En WPF, el elemento `Border` es el equivalente a un `div` con `border`, `padding` y `border-radius`.
- **CSS**: `border-radius: 8px; background: #000; padding: 20px;`
- **XAML**: `<Border CornerRadius="8" Background="#000" Padding="20">`

### 2. Grid vs CSS Grid
El `Grid` en WPF es muy potente y se comporta de forma similar al `display: grid` de CSS.
- **Filas/Columnas**: Se definen con `RowDefinitions` y `ColumnDefinitions`.
- **Ancho Automático**: Usamos `Width="Auto"` (como `grid-template-columns: auto`).
- **Ancho Proporcional**: Usamos `Width="*"` (como `grid-template-columns: 1fr`).

### 3. StackPanel vs CSS Flexbox (Column)
El `StackPanel` apila elementos uno encima de otro (o al lado), similar a `display: flex; flex-direction: column;`.

### 4. Styles vs CSS Classes
En XAML, definimos `Style` en los recursos (Resources).
- **CSS**: 
  ```css
  .modern-button { background: teal; color: white; }
  .modern-button:hover { background: lightteal; }
  ```
- **XAML**:
  ```xml
  <Style x:Key="ModernButton" TargetType="Button">
      <Setter Property="Background" Value="Teal"/>
      <Style.Triggers>
          <Trigger Property="IsMouseOver" Value="True">
              <Setter Property="Background" Value="LightTeal"/>
          </Trigger>
      </Style.Triggers>
  </Style>
  ```

## 📐 Estructura de WinTTS

El diseño se divide en tres áreas principales:

1. **Title Bar (Custom)**: Un `Grid` con `WindowStyle="None"`. Permite esquinas redondeadas en la aplicación.
2. **Sidebar (Lateral)**: Un `Border` con fondo más oscuro (`SidebarBrush`) que contiene los controles.
3. **Main Content (Centro)**: El área de edición de texto. Hemos alineado el título "ENTRADA DE TEXTO" con el título "WinTTS" del lateral para que la interfaz se sienta equilibrada.

## 🌈 Paleta de Colores
- **Fondo**: `#0f172a` (Sleek Dark)
- **Acento**: `#2dd4bf` (Teal VTuber)
- **Insumos**: `#1e293b` (Slate Dark)
- **Errores/Detener**: `#ef4444` (Coral Red)
