---
trigger: always_on
---

# 📁 Regla de Estructura de Carpetas — WinTTS (Rust + Tauri 2.0)

> [!CAUTION]
> Esta regla es **CRÍTICA y no negociable**. Todo nuevo archivo, carpeta o módulo creado por el agente DEBE seguir esta convención.

## Estructura Raíz del Proyecto (Rust + Tauri 2.0 / React + TypeScript)

```
WinTTS/                              # Raíz del repositorio
├── .agents/rules/                  # Reglas del agente (base.md, folder_structure.md, etc.)
├── src-tauri/                       # Backend en Rust
│   ├── Cargo.toml                  # Dependencias de Rust
│   ├── tauri.conf.json             # Configuración de Tauri 2.0
│   ├── capabilities/               # Permisos y capabilities
│   └── src/
│       ├── main.rs                 # Punto de entrada de la aplicación
│       ├── lib.rs                  # Registro de comandos Tauri e inicialización
│       ├── commands/               # Handlers IPC (speech, export, file_ops)
│       ├── services/               # Lógica de dominio (tts, preprocessor)
│       └── models/                 # Modelos de datos compartidos
├── src/                            # Frontend Web (React + TypeScript + Vite)
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx                     # Orquestador principal
│   ├── styles/                     # Variables semánticas y CSS global
│   ├── components/                 # Componentes modulares (< 400 líneas)
│   │   ├── TitleBar/
│   │   ├── SettingsSidebar/
│   │   ├── NarrationEditor/
│   │   ├── DropZone/
│   │   └── StatusBar/
│   ├── hooks/                      # Hooks (useSpeech, useDocument, useFileDrop)
│   ├── services/                   # Servicios IPC y puentes (tauriBridge)
│   └── types/                      # Interfaces TypeScript
├── archivado/                       # Código legacy C#/WPF archivado
├── docs/                           # Documentación técnica
├── Image/                          # Iconos e imágenes del producto
├── assets/                         # Recursos de branding
├── process/                        # Procesos de trabajo (active/, completed/, archive/)
├── release/                        # Artefactos de compilación y empaquetado (EXE, MSIX, SHA-256)
├── scripts/                        # Scripts centralizados de automatización y empaquetado (.ps1)
├── scratch/                        # Scripts utilitarios de mantenimiento (solo en raíz)
├── test/                           # Scripts de prueba temporales (ignorado en .gitignore)
├── .agents/rules/base.md                        # Instrucciones principales del agente (raíz)
├── ROADMAP.md                      # Plan de trabajo y prioridades
├── RELEASE_NOTES.md                # Historial de cambios por versión
└── README.md                       # Documentación pública del proyecto
```

## Reglas Estructurales Obligatorias
- **Procesos y Trazabilidad (`process/`)**: **Estrictamente prohibido** crear archivos de plan (`implementation_plan.md`), bitácoras (`walkthrough.md`) o tareas (`task.md`) sueltos en la raíz. Toda planificación y ejecución técnica debe residir en `process/active/YYYY-MM-DD_objetivo/` con las 4 fases (`PLAN.md`, `TASKS.md`, `VALIDATION.md`, `APPROVAL.md`) y moverse a `process/completed/YYYY/` al finalizar.
- **Ubicación de Scripts**: **Estrictamente prohibido** colocar scripts ejecutables (`.ps1`, `.bat`, `.sh`, etc.) sueltos en la raíz del repositorio. Todo script de compilación, empaquetado o automatización debe residir en `scripts/` (ej. `scripts/build-release.ps1`).
- **Uso de `scratch/`**: Solo en la raíz del proyecto para scripts utilitarios de mantenimiento o diagnóstico puntual.
- **Uso de `test/`**: Scripts de prueba temporales en `test/` de la raíz (ignorado en `.gitignore`).
- **Límite de líneas**: Archivos de componentes (`.tsx`), módulos (`.ts`) o Rust (`.rs`) de más de **400 líneas** deben desacoplarse en subcomponentes o módulos dedicados.
- **Centro Oficial de Documentación**: Para estándares globales y gobierno, consultar **Documentación Core** en [d:\Proyectos\biglexj\Docs](file:///d:/Proyectos/biglexj/Docs). Para referencias visuales y fullstack, consultar [d:\Proyectos\biglexj\Aurora---Blog](file:///d:/Proyectos/biglexj/Aurora---Blog).
