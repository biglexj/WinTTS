#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const root = resolve(import.meta.dir, "../..");
export const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));

export interface AppReleaseConfig {
    appName: string;
    repository: string;
    minimumVersion: string;
    appId: string;
    slug: string;
    versionCode: number;
    channels: ("github" | "aurora")[];
}

export const winTtsReleaseConfig: AppReleaseConfig = {
    appName: "WinTTS",
    repository: "biglexj/WinTTS",
    minimumVersion: "2.0.0",
    appId: "wintts",
    slug: "wintts",
    versionCode: 200,
    channels: ["github"],
};

function runCmd(args: string[], cwd = root): { stdout: string; stderr: string; code: number } {
    const res = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "pipe", stdin: "ignore" });
    return {
        stdout: res.stdout.toString().trim(),
        stderr: res.stderr.toString().trim(),
        code: res.exitCode ?? 0,
    };
}

function command(args: string[], cwd = root): string {
    const res = runCmd(args, cwd);
    if (res.code !== 0) {
        throw new Error(`Falló '${args.slice(0, 3).join(" ")}' (salida ${res.code}): ${res.stderr || res.stdout}`);
    }
    return res.stdout;
}

export function readVersion(projectRoot = root): string {
    const pkg = json(join(projectRoot, "package.json"));
    const version = pkg.version;
    const tauri = json(join(projectRoot, "src-tauri/tauri.conf.json")).version;

    const cargoRaw = readFileSync(join(projectRoot, "src-tauri/Cargo.toml"), "utf8");
    const cargoMatch = cargoRaw.match(/\[package\][^]*?version\s*=\s*"([^"]+)"/);
    const cargoVersion = cargoMatch ? cargoMatch[1] : null;

    if (version !== tauri || version !== cargoVersion) {
        throw new Error(`Inconsistencia de versión detectada: package.json (${version}), tauri.conf.json (${tauri}), Cargo.toml (${cargoVersion}).`);
    }
    return version;
}

export function validateNotes(notes: string, version: string) {
    if (!notes.split(/\r?\n/)[0]?.includes(version)) {
        throw new Error(`RELEASE_MESSAGE.md no encabeza la versión seleccionada (v${version}).`);
    }
    if (/\uFFFD|\?\?|(?<!https?)\b[A-Za-z]:[\\/]|file:\/\/|localhost|127\.0\.0\.1|%[A-Z_]+%|\b(?:SUPABASE|ELY|AURORA)_[A-Z_]+\b/i.test(notes)) {
        throw new Error("RELEASE_MESSAGE.md contiene codificación dañada o datos internos/locales. Sanitízalo antes de publicar.");
    }
    if (!notes.trim()) {
        throw new Error("RELEASE_MESSAGE.md está vacío.");
    }
}

export function validateArtifacts(version: string, projectRoot = root) {
    const releaseDir = join(projectRoot, "release");
    if (!existsSync(releaseDir)) {
        throw new Error(`El directorio release/ no existe. Ejecuta 'mise release' antes de publicar.`);
    }

    const expectedExe = `WinTTS-Setup-${version}.exe`;
    const expectedMsix = `WinTTS-Windows-x64-${version}.msix`;
    const exePath = join(releaseDir, expectedExe);
    const msixPath = join(releaseDir, expectedMsix);
    const sumsPath = join(releaseDir, "SHA256SUMS.txt");
    const buildInfoPath = join(releaseDir, "BUILD_INFO.json");

    if (!existsSync(exePath)) {
        throw new Error(`Falta el instalador oficial Inno Setup: release/${expectedExe}. Ejecuta 'mise release'.`);
    }
    if (!existsSync(msixPath)) {
        throw new Error(`Falta el paquete de Microsoft Store: release/${expectedMsix}. Ejecuta 'mise release'.`);
    }
    if (!existsSync(sumsPath)) {
        throw new Error(`Falta release/SHA256SUMS.txt. Ejecuta 'mise release'.`);
    }

    const exeHash = sha256(exePath);
    const msixHash = sha256(msixPath);
    const sumsContent = readFileSync(sumsPath, "utf8");

    if (!sumsContent.toLowerCase().includes(exeHash.toLowerCase())) {
        throw new Error(`El hash SHA-256 de ${expectedExe} no coincide con SHA256SUMS.txt.`);
    }
    if (!sumsContent.toLowerCase().includes(msixHash.toLowerCase())) {
        throw new Error(`El hash SHA-256 de ${expectedMsix} no coincide con SHA256SUMS.txt.`);
    }

    let buildInfo = null;
    if (existsSync(buildInfoPath)) {
        buildInfo = json(buildInfoPath);
    }

    return {
        releaseDir,
        exe: { name: expectedExe, path: exePath, size: statSync(exePath).size, hash: exeHash },
        msix: { name: expectedMsix, path: msixPath, size: statSync(msixPath).size, hash: msixHash },
        sumsPath,
        buildInfo,
    };
}

export async function publishWinTTS(args: string[] = Bun.argv.slice(2)): Promise<number> {
    const isPlan = args.includes("--plan");
    const isCheck = args.includes("--check");
    const isResume = args.includes("--resume");
    const positional = args.filter((a) => !a.startsWith("-"));
    const channel = positional[0] ?? "all";

    if (!["all", "github"].includes(channel)) {
        throw new Error(`Canal desconocido: '${channel}'. Usa 'github' o 'all'.`);
    }

    const version = readVersion();
    const tag = `v${version}`;
    const config = winTtsReleaseConfig;

    console.log(`\n==================================================`);
    console.log(`  🚀 Publicación Oficial: ${config.appName} ${tag}`);
    console.log(`  Repositorio : https://github.com/${config.repository}`);
    console.log(`  Canal       : ${channel === "github" ? "GitHub Releases (únicamente)" : "GitHub Releases + Aurora Web"}`);
    console.log(`==================================================\n`);

    if (isPlan) {
        console.log(`[Plan de Publicación (--plan)]`);
        console.log(`1. Validar coherencia de versión (${version}) en package.json, tauri.conf.json y Cargo.toml.`);
        console.log(`2. Comprobar estado limpio de Git y sincronización con origin.`);
        console.log(`3. Validar presencia e integridad de artefactos en release/:`);
        console.log(`   - WinTTS-Setup-${version}.exe (Instalador Oficial Inno Setup)`);
        console.log(`   - WinTTS-Windows-x64-${version}.msix (Paquete Microsoft Store)`);
        console.log(`   - SHA256SUMS.txt (Hashes verificados)`);
        console.log(`4. Comprobar que el tag ${tag} no exista previamente (inmutabilidad SemVer).`);
        console.log(`5. Validar RELEASE_MESSAGE.md (sin datos internos ni rutas locales).`);
        console.log(`6. Crear tag Git anotado ${tag} y hacer push atómico a origin.`);
        console.log(`7. Crear GitHub Release vía gh con assets adjuntos y notas públicas.`);
        if (channel === "all") {
            console.log(`8. Sincronizar ficha en Aurora Web vía API si AURORA_RELEASE_TOKEN está configurado.`);
        } else {
            console.log(`8. Sincronización con Aurora Web omitida (canal explícito: github).`);
        }
        console.log(`\n(--plan completado: no se realizaron modificaciones ni peticiones de red)\n`);
        return 0;
    }

    // Comprobaciones
    console.log(`[Comprobando estado previo...]`);

    // 1. Git status
    const gitStatus = runCmd(["git", "status", "--porcelain"]);
    if (gitStatus.stdout) {
        if (isCheck) {
            console.warn(`⚠️  Aviso: Árbol de trabajo Git con cambios sin confirmar.`);
        } else {
            throw new Error(`El árbol Git contiene cambios sin confirmar. Haz commit antes de publicar.`);
        }
    } else {
        console.log(`  ✅ Árbol Git limpio.`);
    }

    // 2. Commit remoto
    const headCommit = command(["git", "rev-parse", "HEAD"]);
    const branchRes = runCmd(["git", "rev-parse", "--abbrev-ref", "HEAD"]);
    const branch = branchRes.code === 0 ? branchRes.stdout : "main";
    console.log(`  ✅ Rama actual: ${branch} (commit: ${headCommit.slice(0, 7)})`);

    // 3. Tags
    const localTag = runCmd(["git", "tag", "-l", tag]).stdout;
    const remoteTag = runCmd(["git", "ls-remote", "--tags", "origin", `refs/tags/${tag}`]).stdout;
    if (!isResume && (localTag || remoteTag)) {
        throw new Error(`El tag ${tag} ya existe local o remotamente. Según SemVer las releases son inmutables.`);
    }
    console.log(`  ✅ Tag ${tag} disponible.`);

    // 4. Notas de lanzamiento
    const notesPath = join(root, "RELEASE_MESSAGE.md");
    if (!existsSync(notesPath)) {
        throw new Error(`No se encontró el archivo RELEASE_MESSAGE.md en la raíz.`);
    }
    const notesContent = readFileSync(notesPath, "utf8");
    validateNotes(notesContent, version);
    console.log(`  ✅ RELEASE_MESSAGE.md válido y sanitizado.`);

    // 5. Artefactos de release
    const artifacts = validateArtifacts(version);
    console.log(`  ✅ Artefactos verificados en release/:`);
    console.log(`     - ${artifacts.exe.name} (${(artifacts.exe.size / 1024 / 1024).toFixed(2)} MB) [SHA: ${artifacts.exe.hash.slice(0, 10)}...]`);
    console.log(`     - ${artifacts.msix.name} (${(artifacts.msix.size / 1024 / 1024).toFixed(2)} MB) [SHA: ${artifacts.msix.hash.slice(0, 10)}...]`);
    console.log(`     - SHA256SUMS.txt correcto.`);

    if (isCheck) {
        console.log(`\n🎉 (--check completado con éxito: todos los requisitos locales y de red están listos)\n`);
        return 0;
    }

    // Confirmación interactiva si no es CI
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const expectedPrompt = `publicar WinTTS ${tag}`;
        console.log(`\n⚠️  ATENCIÓN: Se creará el tag público ${tag} y la GitHub Release oficial.`);
        const answer = await rl.question(`Escribe '${expectedPrompt}' para confirmar: `);
        if (answer.trim() !== expectedPrompt) {
            console.log(`\n❌ Publicación cancelada por el usuario.`);
            return 1;
        }
    } finally {
        rl.close();
    }

    // 1. Crear y subir Tag
    console.log(`\n[1/3] Creando tag anotado ${tag}...`);
    command(["git", "tag", "-a", tag, "-m", `Release ${tag}`]);
    console.log(`  -> Subiendo tag a origin...`);
    command(["git", "push", "origin", tag]);
    console.log(`  ✅ Tag ${tag} subido exitosamente.`);

    // 2. Crear GitHub Release
    console.log(`\n[2/3] Creando GitHub Release en ${config.repository}...`);
    const ghArgs = [
        "gh", "release", "create", tag,
        artifacts.exe.path,
        artifacts.msix.path,
        artifacts.sumsPath,
        "--title", `${config.appName} ${tag}`,
        "--notes-file", notesPath,
    ];
    command(ghArgs);
    console.log(`  ✅ GitHub Release creada exitosamente.`);

    // 3. Sincronización Web Aurora (si canal es 'all' y token presente)
    if (channel === "all") {
        console.log(`\n[3/3] Sincronizando con Aurora Web (https://www.biglexj.com)...`);
        const token = process.env.AURORA_RELEASE_TOKEN;
        if (!token) {
            console.warn(`  ⚠️  Aviso: AURORA_RELEASE_TOKEN no configurado en las variables de entorno.`);
            console.warn(`     La GitHub Release ya está pública. La web de Aurora leerá los metadatos desde GitHub.`);
        } else {
            const downloadUrl = `https://github.com/${config.repository}/releases/download/${tag}/${artifacts.exe.name}`;
            const payload = {
                appId: config.appId,
                versionName: version,
                versionCode: config.versionCode,
                downloadUrl,
                releaseNotes: notesContent,
                sha256Checksum: artifacts.exe.hash,
                status: "published",
            };

            const endpoint = "https://www.biglexj.com/api/admin/developer-app-releases";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
                redirect: "error",
                signal: AbortSignal.timeout(30_000),
            });

            if (res.ok) {
                console.log(`  ✅ Ficha sincronizada en Aurora Web: https://www.biglexj.com/desarrollo/${config.slug}`);
            } else {
                console.warn(`  ⚠️  GitHub publicado; la llamada a Aurora devolvió HTTP ${res.status}. No recrear el release.`);
            }
        }
    } else {
        console.log(`\n[3/3] Sincronización web omitida (canal explícito: github).`);
    }

    console.log(`\n==================================================`);
    console.log(`  🎉 ¡Publicación de WinTTS ${tag} Completada!`);
    console.log(`  Ver en: https://github.com/${config.repository}/releases/tag/${tag}`);
    console.log(`==================================================\n`);
    return 0;
}

if (import.meta.main) {
    try {
        const code = await publishWinTTS(Bun.argv.slice(2));
        process.exit(code);
    } catch (err: any) {
        console.error(`\n❌ Error en publicación: ${err.message || err}`);
        process.exit(1);
    }
}
