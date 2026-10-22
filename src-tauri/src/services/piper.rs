use crate::models::types::PiperModelFile;
use futures_util::StreamExt;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

/// Evento emitido durante la descarga de un modelo neural.
pub const DOWNLOAD_PROGRESS_EVENT: &str = "piper://download-progress";

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub model_id: String,
    pub downloaded: u64,
    pub total: u64,
}

/// Elimina un modelo Piper junto con su configuracion asociada.
pub fn remove_model(model_path: &str) -> Result<(), String> {
    let path = Path::new(model_path);
    if path.extension().and_then(|e| e.to_str()) != Some("onnx") {
        return Err("Solo se pueden eliminar modelos .onnx de Piper.".to_string());
    }

    if path.is_file() {
        fs::remove_file(path).map_err(|e| format!("No se pudo eliminar el modelo: {}", e))?;
    }

    let config_path = format!("{}.json", model_path);
    if Path::new(&config_path).is_file() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("No se pudo eliminar la configuracion del modelo: {}", e))?;
    }

    Ok(())
}

/// Lista los modelos Piper **realmente presentes en disco**.
///
/// Solo se consideran validos los `.onnx` que ademas tienen su `.onnx.json`,
/// porque sin la configuracion asociada `piper.exe` no puede cargarlos.
pub fn list_installed_models(dir: &str) -> Vec<PiperModelFile> {
    let mut models: Vec<PiperModelFile> = Vec::new();

    let entries = match fs::read_dir(Path::new(dir)) {
        Ok(entries) => entries,
        Err(_) => return models,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("onnx") {
            continue;
        }

        let config_path = format!("{}.json", path.to_string_lossy());
        if !Path::new(&config_path).is_file() {
            continue;
        }
        let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
        let id = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .to_string();

        models.push(PiperModelFile {
            id,
            path: path.to_string_lossy().to_string(),
            size_bytes,
        });
    }

    models.sort_by(|a, b| a.id.cmp(&b.id));
    models
}

/// Indica si el ejecutable de Piper esta configurado y existe en disco.
pub fn engine_available(binary_path: &str) -> bool {
    let trimmed = binary_path.trim();
    if trimmed.is_empty() {
        return false;
    }
    Path::new(trimmed).is_file()
}

/// Descarga un peso neural a disco con progreso.
///
/// Se escribe primero en un archivo `.part` y solo se renombra al finalizar,
/// para que una descarga interrumpida no deje un modelo corrupto en disco.
pub async fn download_to_file<F>(url: &str, dest_path: &str, mut on_progress: F) -> Result<u64, String>
where
    F: FnMut(u64, u64),
{
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("No se pudo iniciar la descarga: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "El servidor respondio {} al descargar '{}'.",
            response.status(),
            url
        ));
    }

    let total = response.content_length().unwrap_or(0);

    if let Some(parent) = Path::new(dest_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("No se pudo preparar la carpeta de modelos: {}", e))?;
        }
    }

    let temp_path = format!("{}.part", dest_path);
    let mut file =
        File::create(&temp_path).map_err(|e| format!("No se pudo crear el archivo temporal: {}", e))?;

    let mut stream = response.bytes_stream();
    let mut downloaded: u64 = 0;
    let mut last_reported: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Error de red durante la descarga: {}", e))?;
        file.write_all(&chunk)
            .map_err(|e| format!("Error al escribir el archivo: {}", e))?;
        downloaded += chunk.len() as u64;

        if downloaded - last_reported >= 2_000_000 {
            last_reported = downloaded;
            on_progress(downloaded, total);
        }
    }

    file.flush()
        .map_err(|e| format!("Error al cerrar el archivo: {}", e))?;
    drop(file);

    fs::rename(&temp_path, dest_path)
        .map_err(|e| format!("No se pudo finalizar la descarga: {}", e))?;

    on_progress(downloaded, total);

    Ok(downloaded)
}

/// Descarga un peso neural emitiendo progreso a la interfaz.
pub async fn download_model(
    app: AppHandle,
    model_id: &str,
    url: &str,
    dest_path: &str,
) -> Result<u64, String> {
    let emitter = app.clone();
    let id = model_id.to_string();
    download_to_file(url, dest_path, move |downloaded, total| {
        let _ = emitter.emit(
            DOWNLOAD_PROGRESS_EVENT,
            DownloadProgress {
                model_id: id.clone(),
                downloaded,
                total,
            },
        );
    })
    .await
}

/// Sintetiza texto con `piper.exe` y escribe el WAV resultante.
///
/// El texto viaja por stdin y el audio se escribe en `output_path`.
/// `length_scale` controla la velocidad: menor que 1 habla mas rapido.
pub fn synthesize(
    binary_path: &str,
    model_path: &str,
    text: &str,
    output_path: &str,
    length_scale: Option<f64>,
) -> Result<String, String> {
    if !engine_available(binary_path) {
        return Err(format!(
            "No se encontro el ejecutable de Piper en '{}'. Configura la ruta en Ajustes > Voces neuronales.",
            binary_path
        ));
    }

    if !Path::new(model_path).is_file() {
        return Err(format!("El modelo '{}' no existe en disco.", model_path));
    }

    if text.trim().is_empty() {
        return Err("No hay texto para sintetizar.".to_string());
    }

    if let Some(parent) = Path::new(output_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("No se pudo preparar la carpeta de salida: {}", e))?;
        }
    }

    let mut command = Command::new(binary_path);
    command
        .arg("--model")
        .arg(model_path)
        .arg("--output_file")
        .arg(output_path);

    if let Some(scale) = length_scale {
        command.arg("--length_scale").arg(format!("{:.3}", scale.clamp(0.4, 2.5)));
    }

    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("No se pudo iniciar Piper: {}", e))?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(text.as_bytes())
            .map_err(|e| format!("Error al enviar el texto a Piper: {}", e))?;
    }
    // Cerrar stdin es lo que le indica a Piper que el texto termino.
    drop(child.stdin.take());

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Error al esperar a Piper: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let detail = if stderr.trim().is_empty() {
            output.status.to_string()
        } else {
            stderr.trim().to_string()
        };
        return Err(format!("Piper termino con error: {}", detail));
    }

    if !Path::new(output_path).is_file() {
        return Err("Piper no genero el archivo de audio esperado.".to_string());
    }

    Ok(output_path.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("wintts_piper_test_{}", name));
        let _ = fs::remove_dir_all(&dir);
        let _ = fs::create_dir_all(&dir);
        dir.to_string_lossy().to_string()
    }

    #[test]
    fn list_installed_models_requires_onnx_and_json() {
        let dir = temp_dir("list");
        let dir_path = Path::new(&dir);

        // .onnx con su .onnx.json -> cuenta
        File::create(dir_path.join("es_ES-davefx-medium.onnx")).unwrap();
        fs::write(dir_path.join("es_ES-davefx-medium.onnx.json"), "{}").unwrap();

        // .onnx sin .onnx.json -> no cuenta
        File::create(dir_path.join("es_ES-huerfano-medium.onnx")).unwrap();

        // .onnx.json sin .onnx -> no cuenta
        fs::write(dir_path.join("es_ES-solo-json.onnx.json"), "{}").unwrap();

        let models = list_installed_models(&dir);
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "es_ES-davefx-medium");
        assert!(models[0].path.ends_with("es_ES-davefx-medium.onnx"));
    }

    #[test]
    fn list_installed_models_on_missing_dir_is_empty() {
        assert!(list_installed_models("ruta/que/no/existe/xyz").is_empty());
    }

    #[test]
    fn engine_available_rejects_blank_and_missing() {
        assert!(!engine_available(""));
        assert!(!engine_available("   "));
        assert!(!engine_available("C:/no/existe/piper.exe"));
    }

    #[test]
    fn synthesize_reports_missing_binary() {
        let err = synthesize("C:/no/existe/piper.exe", "modelo.onnx", "hola", "out.wav", None)
            .unwrap_err();
        assert!(err.contains("ejecutable de Piper"));
    }

    #[test]
    fn synthesize_reports_missing_model() {
        let dir = temp_dir("model");
        let fake_binary = Path::new(&dir).join("piper-fake.exe");
        File::create(&fake_binary).unwrap();
        let err = synthesize(
            &fake_binary.to_string_lossy(),
            "C:/no/existe/modelo.onnx",
            "hola",
            "out.wav",
            None,
        )
        .unwrap_err();
        assert!(err.contains("no existe en disco"));
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn synthesize_with_fake_piper_writes_audio() {
        let dir = temp_dir("fake");
        let dir_path = Path::new(&dir);

        // WAV de referencia que el piper falso copia a la salida.
        let reference_wav = dir_path.join("ref.wav");
        {
            let spec = hound::WavSpec {
                channels: 1,
                sample_rate: 22050,
                bits_per_sample: 16,
                sample_format: hound::SampleFormat::Int,
            };
            let mut writer = hound::WavWriter::create(&reference_wav, spec).unwrap();
            for _ in 0..512 {
                writer.write_sample(0i16).unwrap();
            }
            writer.finalize().unwrap();
        }

        // Piper falso: consume stdin y copia el WAV a la ruta de salida (%4).
        let fake_binary = dir_path.join("fake_piper.bat");
        fs::write(
            &fake_binary,
            format!(
                "@echo off\r\nmore >nul\r\ncopy /Y \"{}\" \"%4\" >nul\r\nexit /b 0\r\n",
                reference_wav.to_string_lossy()
            ),
        )
        .unwrap();

        let model_path = dir_path.join("es_ES-davefx-medium.onnx");
        File::create(&model_path).unwrap();
        fs::write(dir_path.join("es_ES-davefx-medium.onnx.json"), "{}").unwrap();

        let output = dir_path.join("out.wav");
        let result = synthesize(
            &fake_binary.to_string_lossy(),
            &model_path.to_string_lossy(),
            "hola mundo",
            &output.to_string_lossy(),
            None,
        );

        assert!(result.is_ok(), "sintesis fallo: {:?}", result.err());
        assert!(output.is_file(), "no se genero el WAV de salida");
        assert!(fs::metadata(&output).unwrap().len() > 44);
    }

    #[tokio::test]
    async fn download_to_file_writes_file_and_reports_progress() {
        let dir = temp_dir("download");
        let dest = Path::new(&dir).join("model.onnx.json");
        let url = "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/davefx/medium/es_ES-davefx-medium.onnx.json";

        let mut reported = 0u64;
        match download_to_file(url, &dest.to_string_lossy(), |_, _| reported += 1).await {
            Ok(size) => {
                assert!(size > 1000, "archivo demasiado pequeno: {}", size);
                assert!(dest.is_file(), "no se escribio el archivo descargado");
                assert!(reported >= 1, "no se reporto progreso");
            }
            Err(err) => {
                // Sin red el test no puede affirmar nada; se avisa y se sigue.
                eprintln!("descarga omitida por falta de red: {}", err);
            }
        }
    }
}
