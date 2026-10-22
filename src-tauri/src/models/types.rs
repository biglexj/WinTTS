use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeechSettings {
    #[serde(rename = "voiceName")]
    pub voice_name: Option<String>,
    pub volume: i32,
    pub rate: i32,
    pub pitch: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemVoice {
    pub id: String,
    pub name: String,
    pub culture: String,
    pub gender: String,
    pub provider: String, // "system" | "piper"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileImportResult {
    pub filename: String,
    pub path: Option<String>,
    pub content: String,
    pub word_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentStats {
    pub word_count: usize,
    pub char_count: usize,
    pub estimated_minutes: usize,
}

/// Modelo Piper realmente presente en disco.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PiperModelFile {
    pub id: String,
    pub path: String,
    pub size_bytes: u64,
}
