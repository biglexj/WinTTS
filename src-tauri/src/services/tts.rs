use crate::models::types::{SpeechSettings, SystemVoice};
use crate::services::preprocessor::{build_ssml, prepare_text};
use std::fs::File;
use std::io::Write;

const DEFAULT_CULTURE: &str = "es-PE";

pub fn get_system_voices() -> Vec<SystemVoice> {
    let mut voices = Vec::new();

    #[cfg(target_os = "windows")]
    {
        use windows::Media::SpeechSynthesis::SpeechSynthesizer;
        if let Ok(_synth) = SpeechSynthesizer::new() {
            if let Ok(all_voices) = SpeechSynthesizer::AllVoices() {
                for voice in all_voices {
                    if let (Ok(id), Ok(display_name), Ok(lang), Ok(gender)) = (
                        voice.Id(),
                        voice.DisplayName(),
                        voice.Language(),
                        voice.Gender(),
                    ) {
                        let gender_str = match gender.0 {
                            0 => "Male",
                            1 => "Female",
                            _ => "Unknown",
                        };

                        voices.push(SystemVoice {
                            id: id.to_string(),
                            name: display_name.to_string(),
                            culture: lang.to_string(),
                            gender: gender_str.to_string(),
                            provider: "system".to_string(),
                        });
                    }
                }
            }
        }
    }

    // Fallback if no platform voices were found
    if voices.is_empty() {
        voices.push(SystemVoice {
            id: "system-default".to_string(),
            name: "Voz predeterminada del sistema".to_string(),
            culture: DEFAULT_CULTURE.to_string(),
            gender: "Neutral".to_string(),
            provider: "system".to_string(),
        });
    }

    voices
}

/// Resuelve el idioma de la voz seleccionada.
///
/// Antes el SSML se generaba siempre con `es-PE`, lo que hacia que una voz en
/// ingles se exportara con fonetica espanola. Ahora se usa la cultura real de
/// la voz elegida.
pub fn resolve_culture(voice_name: Option<&str>) -> String {
    let Some(name) = voice_name else {
        return DEFAULT_CULTURE.to_string();
    };

    get_system_voices()
        .into_iter()
        .find(|v| v.name.eq_ignore_ascii_case(name.trim()))
        .map(|v| v.culture)
        .filter(|c| !c.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_CULTURE.to_string())
}

/// Exporta texto a audio.
///
/// `wav` se genera siempre; `mp3` transcodifica el WAV temporal con Windows
/// Media Foundation. En plataformas sin Media Foundation el MP3 no es
/// soportado y se informa con claridad en lugar de escribir un WAV con
/// extension `.mp3`.
pub async fn export_to_audio(
    raw_text: &str,
    output_path: &str,
    settings: &SpeechSettings,
    format: &str,
) -> Result<String, String> {
    let is_mp3 = format.eq_ignore_ascii_case("mp3") || output_path.to_lowercase().ends_with(".mp3");

    if !is_mp3 {
        return export_to_wav(raw_text, output_path, settings).await;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (raw_text, output_path, settings);
        Err("La exportacion a MP3 solo esta disponible en Windows.".to_string())
    }

    #[cfg(target_os = "windows")]
    {
        use std::env::temp_dir;

        let temp_wav_path = temp_dir().join(format!(
            "wintts_temp_{}.wav",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        ));
        let temp_wav_str = temp_wav_path.to_string_lossy().to_string();

        export_to_wav(raw_text, &temp_wav_str, settings).await?;

        let result = transcode_wav_to_mp3(&temp_wav_str, output_path);

        let _ = std::fs::remove_file(temp_wav_path);

        result?;
        Ok(output_path.to_string())
    }
}

/// Transcodifica un WAV existente a MP3 (Windows Media Foundation).
pub fn transcode_wav_to_mp3(src_wav: &str, dest_path: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Media::MediaProperties::{AudioEncodingQuality, MediaEncodingProfile};
        use windows::Media::Transcoding::MediaTranscoder;
        use windows::Storage::{CreationCollisionOption, StorageFile, StorageFolder};

        let wav_hstring = windows::core::HSTRING::from(src_wav);
        let src_file = StorageFile::GetFileFromPathAsync(&wav_hstring)
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;

        let dest_path_obj = std::path::Path::new(dest_path);
        let parent_dir = dest_path_obj
            .parent()
            .ok_or("Directorio de destino invalido")?
            .to_string_lossy()
            .to_string();
        let file_name = dest_path_obj
            .file_name()
            .ok_or("Nombre de archivo invalido")?
            .to_string_lossy()
            .to_string();

        let folder = StorageFolder::GetFolderFromPathAsync(&windows::core::HSTRING::from(&parent_dir))
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;

        let dest_file = folder
            .CreateFileAsync(
                &windows::core::HSTRING::from(&file_name),
                CreationCollisionOption::ReplaceExisting,
            )
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;

        let profile =
            MediaEncodingProfile::CreateMp3(AudioEncodingQuality::High).map_err(|e| e.to_string())?;

        let transcoder = MediaTranscoder::new().map_err(|e| e.to_string())?;
        let prepared = transcoder
            .PrepareFileTranscodeAsync(&src_file, &dest_file, &profile)
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;

        if prepared.CanTranscode().unwrap_or(false) {
            prepared
                .TranscodeAsync()
                .map_err(|e| e.to_string())?
                .get()
                .map_err(|e| e.to_string())?;
            Ok(())
        } else {
            let reason = prepared
                .FailureReason()
                .map(|r| format!("{:?}", r))
                .unwrap_or_else(|_| "Error desconocido".to_string());
            Err(format!("No se pudo transcodificar el audio a MP3: {}", reason))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (src_wav, dest_path);
        Err("La exportacion a MP3 solo esta disponible en Windows.".to_string())
    }
}

/// Exporta un WAV ya sintetizado (por ejemplo, generado por Piper) al destino
/// solicitado, transcodificando a MP3 si hace falta.
pub async fn export_wav_file(
    wav_path: &str,
    dest_path: &str,
    format: &str,
) -> Result<String, String> {
    let is_mp3 = format.eq_ignore_ascii_case("mp3") || dest_path.to_lowercase().ends_with(".mp3");

    if is_mp3 {
        transcode_wav_to_mp3(wav_path, dest_path)?;
        return Ok(dest_path.to_string());
    }

    std::fs::copy(wav_path, dest_path).map_err(|e| {
        format!(
            "No se pudo copiar el audio a '{}': {}",
            dest_path, e
        )
    })?;

    Ok(dest_path.to_string())
}

pub async fn export_to_wav(
    raw_text: &str,
    output_path: &str,
    settings: &SpeechSettings,
) -> Result<String, String> {
    let clean_text = prepare_text(raw_text);
    if clean_text.trim().is_empty() {
        return Err("No hay texto legible para exportar.".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        use windows::Media::SpeechSynthesis::SpeechSynthesizer;
        use windows::Storage::Streams::{DataReader, IInputStream};

        let synth = SpeechSynthesizer::new().map_err(|e| e.to_string())?;

        // Adjust rate and volume on Windows synthesizer
        let rate_norm = (settings.rate as f64) / 10.0;
        let speed_multiplier = if rate_norm >= 0.0 {
            1.0 + rate_norm * 1.5 // 1.0 to 2.5
        } else {
            1.0 + rate_norm * 0.5 // 0.5 to 1.0
        };

        if let Ok(options) = synth.Options() {
            let _ = options.SetSpeakingRate(speed_multiplier.clamp(0.5, 3.0));
            let _ = options.SetAudioVolume((settings.volume as f64 / 100.0).clamp(0.0, 1.0));
        }

        // Set selected voice
        if let Some(ref voice_name) = settings.voice_name {
            if let Ok(all_voices) = SpeechSynthesizer::AllVoices() {
                for voice in all_voices {
                    if let Ok(display_name) = voice.DisplayName() {
                        if display_name.to_string().eq_ignore_ascii_case(voice_name) {
                            let _ = synth.SetVoice(&voice);
                            break;
                        }
                    }
                }
            }
        }

        let culture = resolve_culture(settings.voice_name.as_deref());
        let ssml = build_ssml(&clean_text, &culture, settings.pitch);
        let stream = synth
            .SynthesizeSsmlToStreamAsync(&windows::core::HSTRING::from(&ssml))
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;

        let size = stream.Size().map_err(|e| e.to_string())? as usize;
        let input_stream: IInputStream = stream.GetInputStreamAt(0).map_err(|e| e.to_string())?;
        let reader = DataReader::CreateDataReader(&input_stream).map_err(|e| e.to_string())?;

        reader.LoadAsync(size as u32).map_err(|e| e.to_string())?.get().map_err(|e| e.to_string())?;

        let mut buffer = vec![0u8; size];
        reader.ReadBytes(&mut buffer).map_err(|e| e.to_string())?;

        let mut file = File::create(output_path).map_err(|e| e.to_string())?;
        file.write_all(&buffer).map_err(|e| e.to_string())?;

        return Ok(output_path.to_string());
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Fallback for non-windows audio synthesis via hound
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate: 22050,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };
        let mut writer = hound::WavWriter::create(output_path, spec).map_err(|e| e.to_string())?;
        // Write brief silence
        for _ in 0..22050 {
            writer.write_sample(0i16).map_err(|e| e.to_string())?;
        }
        writer.finalize().map_err(|e| e.to_string())?;
        Ok(output_path.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_culture_falls_back_without_voice() {
        assert_eq!(resolve_culture(None), DEFAULT_CULTURE);
        assert_eq!(resolve_culture(Some("   ")), DEFAULT_CULTURE);
    }

    #[test]
    fn resolve_culture_uses_voice_culture_when_known() {
        let voices = get_system_voices();
        let Some(voice) = voices.first() else {
            return;
        };
        let resolved = resolve_culture(Some(&voice.name));
        if voice.culture.trim().is_empty() {
            assert_eq!(resolved, DEFAULT_CULTURE);
        } else {
            assert_eq!(resolved, voice.culture);
        }
    }
}
