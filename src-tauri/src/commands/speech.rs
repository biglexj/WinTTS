use crate::models::types::{DocumentStats, SystemVoice};
use crate::services::preprocessor::prepare_text;
use crate::services::tts::get_system_voices;

#[tauri::command]
pub fn get_available_voices() -> Vec<SystemVoice> {
    get_system_voices()
}

#[tauri::command]
pub fn preprocess_text(markdown: String) -> String {
    prepare_text(&markdown)
}

#[tauri::command]
pub fn get_document_stats(text: String) -> DocumentStats {
    let clean = prepare_text(&text);
    let words = clean.split_whitespace().count();
    let chars = clean.chars().count();
    let minutes = if words == 0 {
        0
    } else {
        ((words as f64) / 160.0).ceil() as usize
    };

    DocumentStats {
        word_count: words,
        char_count: chars,
        estimated_minutes: if minutes == 0 && words > 0 { 1 } else { minutes },
    }
}
