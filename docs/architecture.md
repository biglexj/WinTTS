# Arquitectura de WinTTS

- Estado: base
- Última actualización: 2026-11-03
- Alcance: mapa real del repositorio. No sustituye las bases compartidas de Core.

WinTTS es una aplicación de escritorio **100 % local**: backend **Rust + Tauri 2.0**, frontend **React 19 + TypeScript + Vite 6**. No consume servicios en nube ni modelos generativos.

## Árbol del repositorio

```text
WinTTS/
├── src/                     # Frontend React (TypeScript)
│   ├── components/          # UI por responsabilidad: AboutModal, DropZone, NarrationEditor,
│   │                        # SettingsModal, SettingsSidebar, StatusBar, TitleBar, VoiceSelector
│   ├── hooks/               # Puente con el backend: useDocument, useFileDrop, usePiper, useSpeech
│   ├── services/            # tauriBridge.ts (invocaciones IPC tipadas)
│   ├── styles/              # Tokens y estilos globales
│   └── types/               # Tipos compartidos con Rust
├── src-tauri/               # Backend Rust (Tauri 2.0)
│   └── src/
│       ├── commands/        # Comandos IPC: export, file_ops, piper, speech
│       ├── models/          # Tipos y estructuras de dominio
│       └── services/        # piper, preprocessor, tts
├── scripts/                 # Implementación de las tareas
│   ├── mise-task.ts         # Despachador único de Mise
│   ├── build-exe.ps1        # Empaquetado jpackage / WiX
│   ├── build-msix.ps1       # Paquete de Microsoft Store
│   ├── build-release.ps1    # Flujo maestro de release (instalador + msix + hashes + metadatos)
│   ├── packaging/           # Scripts de Inno Setup
│   └── release/             # publish-wintts.ts (publicación y ficha en Aurora)
├── packaging/
│   ├── windows/             # Scripts de Inno Setup (Biglex Modern, identidad, versión)
│   └── winget/              # Manifiestos WinGet preparados y pendientes de publicar
├── docs/                    # Documentación funcional del producto
├── process/                 # Procesos planificados y su trazabilidad
├── assets/                  # Recursos de marca e interfaz
├── release/                 # Artefactos generados (no versionado)
└── archivado/               # Empaquetado .NET/WPF anterior, conservado como referencia
```

## Responsabilidades

- **Frontend**: presentación y estado de la interfaz. Toda llamada al sistema operativo pasa por `src/services/tauriBridge.ts`; los componentes no invocan Tauri directamente.
- **Backend**: síntesis de voz, lectura de archivos y exportación. Los comandos IPC son la única superficie expuesta a la interfaz.
- **Servicios de voz**: `speech.rs` usa las voces del sistema; `piper.rs` gestiona el motor neuronal opcional; `preprocessor.rs` normaliza el texto de entrada.
- **Scripts**: toda la automatización ejecutable vive en `scripts/`. La raíz no contiene lanzadores ni scripts.
- **Artefactos**: `dist/`, `src-tauri/target/` y `release/` son generados y no se versionan.

## Límites

- Ningún archivo `.tsx`, `.ts` o `.rs` supera las **400 líneas**; los módulos grandes se dividen por subcarpeta semántica.
- El motor Piper es opcional: mientras no esté operativo, la sección de voz neural no se muestra en la interfaz.
- Los scripts no contienen rutas absolutas al disco local; la raíz del proyecto se resuelve desde la ubicación del propio script.

## Comandos

Mise es la interfaz de comandos: `mise dev`, `mise build`, `mise check`, `mise test`, `mise release` y `mise publish`. El contrato vive en `Docs/global/architecture/mise-command-standard.md` y el detalle del release en [flujo de release](release-workflow.md).

## Referencias

- [Flujo de release](release-workflow.md)
- [Migración de empaquetados anteriores](../packaging/windows/MIGRATION.md)
- [Documentación Core](../../Docs/README.md)
