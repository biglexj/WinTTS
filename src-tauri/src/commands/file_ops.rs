use crate::models::types::FileImportResult;
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn read_text_file(file_path: String) -> Result<FileImportResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("El archivo no existe: {}", file_path));
    }

    // Se leen bytes y se decodifican de forma tolerante: un documento guardado
    // en Latin-1 no debe impedir abrirlo.
    let bytes = fs::read(path)
        .map_err(|e| format!("Error al leer el archivo '{}': {}", file_path, e))?;
    let content = String::from_utf8_lossy(&bytes).to_string();

    let filename = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("documento")
        .to_string();

    let words = content.split_whitespace().count();

    Ok(FileImportResult {
        filename,
        path: Some(file_path),
        content,
        word_count: words,
    })
}

#[tauri::command]
pub fn save_text_file(file_path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&file_path).parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("No se pudo crear la carpeta '{}': {}", parent.display(), e))?;
        }
    }

    fs::write(&file_path, content)
        .map_err(|e| format!("Error al guardar el archivo '{}': {}", file_path, e))
}
