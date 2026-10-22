# Procesos de WinTTS

Este directorio centraliza todos los planes, tareas de ejecución técnica, validaciones y aprobaciones de WinTTS, organizados por estado.

## Estructura

```text
process/
├── active/
├── completed/2026/
└── archive/2026/
```

## Flujo de tres fases

Todo trabajo planificado vive dentro de `process/active/YYYY-MM-DD_objetivo/` y contiene:
1. `PLAN.md`: Definición y alcance aprobado antes de ejecutar.
2. `TASKS.md`: Seguimiento de ejecución técnica del sprint.
3. `VALIDATION.md`: Comprobaciones reproducibles (`[x]` validadas).
4. `APPROVAL.md`: Decisión final y cierre de sesión.

- **Completado**: Mover la carpeta del proceso a `process/completed/YYYY/` y reflejar el hito en `ROADMAP.md`.
- **Cancelado o archivado**: Mover a `process/archive/YYYY/` registrando el motivo en `APPROVAL.md`.
- **Pausado**: Conservar en `active` documentando el bloqueo.

No se deben crear archivos de plan (`implementation_plan.md`), bitácoras (`walkthrough.md`) ni listas de tareas (`task.md` / `TASKS.md`) sueltos en la raíz del proyecto.
