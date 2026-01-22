# Solución al Error de Firma en WinGet

## Problema

El PR de WinGet (#331954) está fallando con el error:
```
TRUST_E_NOSIGNATURE (0x800B0100): No signature was present in the subject
```

Esto ocurre porque el paquete MSIX subido a GitHub Releases está firmado con un certificado auto-firmado que no es de confianza pública.

## Solución

Necesitas reemplazar el MSIX auto-firmado con el **MSIX firmado por Microsoft** que se genera cuando publicas en Microsoft Store.

### Pasos para Resolver

#### 1. Descargar el MSIX Firmado de la Store

Ejecuta el script de ayuda:
```powershell
.\scripts\download-store-msix.ps1
```

Este script te mostrará 3 métodos para obtener el MSIX firmado:

**Método Recomendado: Usar store.rg-adguard.net**
1. Ve a: https://store.rg-adguard.net/
2. Pega: `https://apps.microsoft.com/detail/9NS5MH65JBJ3`
3. Selecciona "ProductId" en el dropdown
4. Haz clic en el botón de búsqueda (✓)
5. Descarga el archivo `.msixbundle` o `.msix` más grande (x64)
6. Renómbralo a `WinTTS-Store-Signed.msix`

#### 2. Subir el MSIX Firmado a GitHub

1. Ve a: https://github.com/biglexj/WinTTS/releases/tag/v1.0.0
2. Edita el release
3. Sube el archivo `WinTTS-Store-Signed.msix`
4. Guarda los cambios

#### 3. Actualizar el Manifiesto de WinGet

Ejecuta el script de actualización:
```powershell
.\scripts\update-winget-manifest.ps1 -MsixPath ".\publish\store-signed\WinTTS-Store-Signed.msix"
```

Este script:
- Calculará el SHA256 del MSIX firmado
- Actualizará automáticamente el manifiesto con la nueva URL y hash

#### 4. Actualizar el PR de WinGet

Opción A - Usando wingetcreate (Recomendado):
```powershell
wingetcreate update biglexj.WinTTS --version 1.0.0 --urls https://github.com/biglexj/WinTTS/releases/download/v1.0.0/WinTTS-Store-Signed.msix --submit
```

Opción B - Manualmente:
1. Haz commit de los cambios en `manifests-msix/`
2. Haz push al branch del PR
3. El PR se actualizará automáticamente

## ¿Por Qué Esto Funciona?

- ✅ **Microsoft Store firma automáticamente** todos los paquetes con un certificado de confianza
- ✅ **Windows confía en los certificados de Microsoft** por defecto
- ✅ **WinGet puede verificar la firma** sin problemas
- ✅ **Los usuarios pueden instalar sin advertencias** de seguridad

## Información Adicional

- **Store ID**: 9NS5MH65JBJ3
- **Store URL**: https://apps.microsoft.com/detail/9NS5MH65JBJ3
- **Package Family Name**: biglexj.WinTTS_ppytjz2en1wwy
- **PR de WinGet**: #331954

## Notas

- El MSIX auto-firmado (`WinTTS_Certificate.pfx`) solo sirve para desarrollo local
- Para distribución pública, **siempre** usa el paquete firmado por Microsoft Store
- Una vez que el PR sea aprobado, los usuarios podrán instalar con: `winget install biglexj.WinTTS`
