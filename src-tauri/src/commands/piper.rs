use crate::models::types::PiperModelFile;
use crate::services::piper;
use tauri::AppHandle;

#[tauri::command]
pub fn list_piper_models(models_dir: String) -> Vec<PiperModelFile> {
    piper::list_installed_models(&models_dir)
}

#[tauri::command]
pub fn piper_engine_available(binary_path: String) -> bool {
    piper::engine_available(&binary_path)
}

/// Elimina un modelo Piper ya descargado.
#[tauri::command]
pub fn remove_piper_model(model_path: String) -> Result<(), String> {
    piper::remove_model(&model_path)
}

/// Descarga un peso neural desde Hugging Face, con progreso por evento.
#[tauri::command]
pub async fn download_piper_model(
    app: AppHandle,
    model_id: String,
    url: String,
    dest_path: String,
) -> Result<u64, String> {
    piper::download_model(app, &model_id, &url, &dest_path).await
}

/// Sintetiza texto con Piper. Se ejecuta fuera del hilo de la interfaz para
/// no bloquear el render mientras el modelo procesa la narracion.
#[tauri::command]
pub async fn synthesize_with_piper(
    binary_path: String,
    model_path: String,
    text: String,
    output_path: String,
    length_scale: Option<f64>,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        piper::synthesize(&binary_path, &model_path, &text, &output_path, length_scale)
    })
    .await
    .map_err(|e| format!("La tarea de Piper fallo: {}", e))?
}
