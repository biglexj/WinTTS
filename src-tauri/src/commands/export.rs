use crate::models::types::SpeechSettings;
use crate::services::tts::{export_to_audio, export_to_wav, export_wav_file};

#[tauri::command]
pub async fn export_wav(
    text: String,
    file_path: String,
    settings: SpeechSettings,
) -> Result<String, String> {
    export_to_wav(&text, &file_path, &settings).await
}

#[tauri::command]
pub async fn export_audio(
    text: String,
    file_path: String,
    settings: SpeechSettings,
    format: Option<String>,
) -> Result<String, String> {
    let fmt = format.unwrap_or_else(|| "wav".to_string());
    export_to_audio(&text, &file_path, &settings, &fmt).await
}

/// Reutiliza un WAV ya sintetizado (motor Piper) como archivo de entrega.
#[tauri::command]
pub async fn export_audio_file(
    wav_path: String,
    file_path: String,
    format: Option<String>,
) -> Result<String, String> {
    let fmt = format.unwrap_or_else(|| "wav".to_string());
    export_wav_file(&wav_path, &file_path, &fmt).await
}
