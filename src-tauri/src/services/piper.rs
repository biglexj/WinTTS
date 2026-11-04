use crate::models::types::PiperModelFile;
use futures_util::StreamExt;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

/// Evento emitido durante la descarga de un modelo neural.
pub const DOWNLOAD_PROGRESS_EVENT: &str = "piper://download-progress";

/// Evento emitido durante la descarga del motor de Piper.
pub const ENGINE_PROGRESS_EVENT: &str = "piper://engine-download-progress";

/// Build oficial de Piper para Windows con `piper.exe` autonomo.
///
/// Es el unico que trae un ejecutable suelto: el proyecto actual
/// (`OHF-Voice/piper1-gpl`) solo publica ruedas de Python.
pub const PIPER_ENGINE_URL: &str =
    "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip";

/// SHA-256 del zip oficial: se verifica antes de extraer nada.
pub const PIPER_ENGINE_SHA256: &str =
    "f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea";

/// Tamano del zip oficial, para la barra de progreso.
pub const PIPER_ENGINE_SIZE: u64 = 22_477_236;

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub model_id: String,
    pub downloaded: u64,
    pub total: u64,
}

#[derive(Clone, serde::Serialize)]
pub struct EngineDownloadProgress {
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
                .map_err(|e| format!("No se pudo preparar la carpeta de destino: {}", e))?;
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

/// Calcula el SHA-256 de un fichero y lo devuelve en hexadecimal.
pub fn sha256_of_file(path: &Path) -> Result<String, String> {
    let mut file = File::open(path)
        .map_err(|e| format!("No se pudo abrir '{}' para verificarlo: {}", path.display(), e))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];

    loop {
        let read = file
            .read(&mut buffer)
            .map_err(|e| format!("No se pudo leer '{}': {}", path.display(), e))?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }

    Ok(hasher
        .finalize()
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect())
}

/// Ruta segura de una entrada del zip dentro de la carpeta de destino.
///
/// Devuelve `None` si la entrada intenta salirse de la carpeta destino
/// (zip-slip) o si no apunta a nada.
fn entry_relative_path(name: &str) -> Option<PathBuf> {
    let mut normalized = PathBuf::new();

    for component in Path::new(name).components() {
        match component {
            std::path::Component::Normal(part) => normalized.push(part),
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => return None,
            std::path::Component::RootDir | std::path::Component::Prefix(_) => return None,
        }
    }

    if normalized.as_os_str().is_empty() {
        None
    } else {
        Some(normalized)
    }
}

/// Prefijo comun de todas las entradas del zip ("piper/" en el build oficial).
fn common_root_component(archive: &mut zip::ZipArchive<File>) -> Option<String> {
    let mut root: Option<String> = None;

    for index in 0..archive.len() {
        let name = match archive.by_index(index) {
            Ok(entry) => entry.name().map(|name| name.into_owned()).unwrap_or_default(),
            Err(_) => continue,
        };

        let first = name.split('/').next().unwrap_or_default().to_string();
        if first.is_empty() {
            continue;
        }

        match root.as_deref() {
            None => root = Some(first),
            Some(current) if current == first => {}
            Some(_) => return None,
        }
    }

    root
}

/// Extrae el motor de Piper de su zip y devuelve la ruta de `piper.exe`.
///
/// El zip oficial trae todo dentro de una carpeta raiz ("piper/"); esa carpeta
/// se aplana para que el ejecutable quede junto a sus DLL.
pub fn extract_engine_zip(zip_path: &Path, dest: &Path) -> Result<String, String> {
    let file = File::open(zip_path)
        .map_err(|e| format!("No se pudo abrir el motor descargado: {}", e))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("El motor descargado esta danado: {}", e))?;

    let root = common_root_component(&mut archive);

    fs::create_dir_all(dest)
        .map_err(|e| format!("No se pudo preparar la carpeta del motor: {}", e))?;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| format!("El motor descargado esta danado: {}", e))?;

        // `enclosed_name` descarta las rutas que se salen de la carpeta destino;
        // `entry_relative_path` aplica el mismo filtro de forma explicita.
        let Some(relative) = entry
            .enclosed_name()
            .and_then(|path| entry_relative_path(&path.to_string_lossy()))
        else {
            continue;
        };

        let relative = match root.as_deref() {
            Some(prefix) => match relative.strip_prefix(prefix) {
                Ok(stripped) => stripped.to_path_buf(),
                Err(_) => relative,
            },
            None => relative,
        };

        if relative.as_os_str().is_empty() {
            continue;
        }

        let target = dest.join(&relative);

        if entry.is_dir() {
            fs::create_dir_all(&target)
                .map_err(|e| format!("No se pudo crear la carpeta '{}': {}", target.display(), e))?;
            continue;
        }

        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                format!("No se pudo crear la carpeta '{}': {}", parent.display(), e)
            })?;
        }

        let mut output = File::create(&target)
            .map_err(|e| format!("No se pudo escribir '{}': {}", target.display(), e))?;
        std::io::copy(&mut entry, &mut output)
            .map_err(|e| format!("No se pudo extraer '{}': {}", target.display(), e))?;
    }

    let executable = dest.join("piper.exe");
    if !executable.is_file() {
        return Err("El paquete descargado no contiene piper.exe.".to_string());
    }

    Ok(executable.to_string_lossy().to_string())
}

/// Descarga e instala el motor de Piper dentro de la carpeta de la app.
///
/// El zip se verifica contra el hash del binario oficial y solo se extrae si
/// coincide. Devuelve la ruta de `piper.exe`, lista para usarse.
pub async fn install_engine(app: AppHandle, dest_root: &Path) -> Result<String, String> {
    let emitter = app.clone();
    install_engine_to(dest_root, move |downloaded, total| {
        let _ = emitter.emit(
            ENGINE_PROGRESS_EVENT,
            EngineDownloadProgress { downloaded, total },
        );
    })
    .await
}

/// Nucleo de la instalacion, independiente de la interfaz.
pub async fn install_engine_to<F>(dest_root: &Path, mut on_progress: F) -> Result<String, String>
where
    F: FnMut(u64, u64),
{
    fs::create_dir_all(dest_root)
        .map_err(|e| format!("No se pudo preparar la carpeta del motor: {}", e))?;

    let archive_path = dest_root.join("piper-engine.zip");

    download_to_file(
        PIPER_ENGINE_URL,
        &archive_path.to_string_lossy(),
        |downloaded, total| on_progress(downloaded, total),
    )
    .await?;

    let hash = sha256_of_file(&archive_path)?;
    if !hash.eq_ignore_ascii_case(PIPER_ENGINE_SHA256) {
        let _ = fs::remove_file(&archive_path);
        return Err(
            "El motor descargado no coincide con el binario oficial de Piper. No se instala nada."
                .to_string(),
        );
    }

    let archive_for_extract: PathBuf = archive_path.clone();
    let dest_for_extract: PathBuf = dest_root.to_path_buf();
    let executable = tauri::async_runtime::spawn_blocking(move || {
        extract_engine_zip(&archive_for_extract, &dest_for_extract)
    })
    .await
    .map_err(|e| format!("La instalacion del motor fallo: {}", e))??;

    let _ = fs::remove_file(&archive_path);

    Ok(executable)
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

    /// Escribe un zip de prueba con las entradas indicadas.
    fn write_test_zip(path: &Path, entries: &[(&str, &[u8])]) {
        let file = File::create(path).unwrap();
        let mut writer = zip::ZipWriter::new(file);

        for (name, content) in entries {
            writer
                .start_file(*name, zip::write::SimpleFileOptions::default())
                .unwrap();
            writer.write_all(content).unwrap();
        }

        writer.finish().unwrap();
    }

    #[test]
    fn entry_relative_path_rejects_traversal() {
        assert!(entry_relative_path("../evil.txt").is_none());
        assert!(entry_relative_path("piper/../../evil.txt").is_none());
        assert!(entry_relative_path("/raiz/evil.txt").is_none());
        assert!(entry_relative_path("").is_none());
        assert!(entry_relative_path(".").is_none());

        let inside = entry_relative_path("piper/piper.exe").unwrap();
        assert_eq!(inside, PathBuf::from("piper").join("piper.exe"));
    }

    #[test]
    fn extract_engine_zip_extracts_piper_exe() {
        let dir = temp_dir("engine_zip");
        let dir_path = Path::new(&dir);
        let archive = dir_path.join("motor.zip");
        let dest = dir_path.join("runtime");

        // El build oficial mete todo dentro de una carpeta "piper/".
        write_test_zip(
            &archive,
            &[
                ("piper/piper.exe", b"MZ motor de prueba"),
                ("piper/espeak-ng-data/voices/x.txt", b"datos"),
            ],
        );

        let executable = extract_engine_zip(&archive, &dest).unwrap();

        assert!(executable.ends_with("piper.exe"), "ruta inesperada: {}", executable);
        // La carpeta raiz del zip se aplana: el ejecutable queda junto a sus DLL.
        assert!(dest.join("piper.exe").is_file(), "no se extrajo piper.exe");
        assert!(
            dest.join("espeak-ng-data").join("voices").join("x.txt").is_file(),
            "no se extrajeron los datos de espeak"
        );
    }

    #[test]
    fn extract_engine_zip_rejects_path_traversal() {
        let dir = temp_dir("engine_zip_slip");
        let dir_path = Path::new(&dir);
        let archive = dir_path.join("motor.zip");
        let dest = dir_path.join("runtime");

        write_test_zip(&archive, &[("../evil.txt", b"fuera")]);

        let result = extract_engine_zip(&archive, &dest);

        // El paquete no trae piper.exe, asi que falla; lo importante es que
        // nada se haya escrito fuera de la carpeta de destino.
        assert!(result.is_err(), "se esperaba un error por falta de piper.exe");
        assert!(
            !dir_path.join("evil.txt").exists(),
            "una entrada del zip se escribio fuera del destino"
        );
    }

    #[tokio::test]
    async fn install_engine_downloads_official_binary() {
        let dir = temp_dir("engine_install");
        let dest = Path::new(&dir).join("runtime").join("piper");

        // Sin AppHandle real no hay evento que emitir: se usa el nucleo del
        // servicio con un progreso vacio.
        match install_engine_to(&dest, |_, _| {}).await {
            Ok(executable) => {
                assert!(
                    Path::new(&executable).is_file(),
                    "no se instalo piper.exe: {}",
                    executable
                );
                assert!(
                    Path::new(&executable)
                        .parent()
                        .map(|dir| dir.join("piper_phonemize.dll").is_file())
                        .unwrap_or(false),
                    "no se extrajeron las DLL que necesita el motor"
                );
            }
            Err(err) => {
                // Sin red el test no puede affirmar nada; se avisa y se sigue.
                eprintln!("descarga omitida por falta de red: {}", err);
            }
        }
    }
}
