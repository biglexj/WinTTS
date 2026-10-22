use crate::models::types::FileImportResult;
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn read_text_file(file_path: String) -> Result<FileImportResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("El archivo no existe: {}", file_path));
    }

    let content = fs::read_to_string(path)
        .map_err(|e| format!("Error al leer el archivo '{}': {}", file_path, e))?;

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
    fs::write(&file_path, content)
        .map_err(|e| format!("Error al guardar el archivo '{}': {}", file_path, e))
}
