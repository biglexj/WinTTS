# 🚀 Instrucciones de Ejecución para el Agente - WinTTS

> [!IMPORTANT]
> **ORDEN DE EJECUCIÓN INMEDIATA**: Si el usuario ha abierto este archivo o ha indicado *"Lee este archivo"*, debes seguir estrictamente los pasos descritos a continuación sin desviarte del plan.

## 📚 1. Reglas y Documentación a Consultar

Antes de iniciar cualquier modificación en el código:
1. Lee las reglas del proyecto en [.agents/rules/base.md](file:///.agents/rules/base.md) y [.agents/rules/folder_structure.md](file:///.agents/rules/folder_structure.md).
2. Revisa las instrucciones principales en [.agents/rules/base.md](file:///agent.md).
3. **Centro Oficial de Documentación (CRÍTICO)**: Si tienes cualquier duda sobre patrones de diseño, arquitectura, manejo de carpetas o reglas, DEBES consultar obligatoriamente la documentación oficial en:
   - [Documentación Oficial Aurora Blog](file:///d:/Proyectos/biglexj/Aurora---Blog/docs/es)
   - [Guía de Árbol de Carpetas](file:///d:/Proyectos/biglexj/Aurora---Blog/docs/es/guides/Arbol%20de%20Carpetas.md)
   - [Guía de Arquitectura](file:///d:/Proyectos/biglexj/Aurora---Blog/docs/es/guides/Arquitectura%20del%20Proyecto.md)
   - [Lenguaje de Diseño DESIGN.md](file:///d:/Proyectos/biglexj/Aurora---Blog/docs/es/frontend/Lenguaje%20de%20Dise%C3%B1o/DESIGN.md)

---

## 🛠️ 2. Checklist de Refactorización y Estandarización

- `[ ]` **Paso 1**: Reorganizar `Controls/` y `Services/` bajo subcarpetas semánticas de dominio.
- `[ ]` **Paso 2**: Auditar `MainWindow.xaml` y `MainWindow.xaml.cs` (actualmente con más de 300 líneas) para dividirlos en UserControls modularizados si superan las 400 líneas.
- `[ ]` **Paso 3**: Verificar que los estilos e iconos se mantengan centralizados en `Themes/` e `Icon/`.
- `[ ]` **Paso 4**: Mover scripts utilitarios fuera de norma a `scratch/` en la raíz.
- `[ ]` **Paso 5**: Actualizar `ROADMAP.md` y `RELEASE_NOTES.md`.
