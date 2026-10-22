pub mod commands;
pub mod models;
pub mod services;

use commands::export::{export_audio, export_wav};
use commands::file_ops::{read_text_file, save_text_file};
use commands::speech::{get_available_voices, get_document_stats, preprocess_text};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::SIZE
                        | tauri_plugin_window_state::StateFlags::POSITION
                        | tauri_plugin_window_state::StateFlags::MAXIMIZED,
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_available_voices,
            preprocess_text,
            get_document_stats,
            export_wav,
            export_audio,
            read_text_file,
            save_text_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running WinTTS application");
}
