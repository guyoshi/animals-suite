use base64::{engine::general_purpose::STANDARD, Engine};
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{collections::{HashMap, HashSet}, fs, io::Write, path::{Path, PathBuf}, process::Command, sync::Mutex};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_updater::{Update, UpdaterExt};


#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateCheckResult {
    enabled: bool,
    current_version: String,
    available: bool,
    version: Option<String>,
    message: Option<String>,
}

struct PendingUpdate(Mutex<Option<Update>>);

#[tauri::command]
async fn check_for_update(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<UpdateCheckResult, String> {
    let endpoint = option_env!("ANIMALS_UPDATE_ENDPOINT").unwrap_or("").trim();
    let pubkey = option_env!("ANIMALS_UPDATE_PUBKEY").unwrap_or("").trim();
    let current_version = app.package_info().version.to_string();
    if endpoint.is_empty() || pubkey.is_empty() {
        return Ok(UpdateCheckResult { enabled: false, current_version, available: false, version: None, message: Some("Este build ainda não possui endpoint e chave pública de atualização.".into()) });
    }
    let url = endpoint.parse::<url::Url>().map_err(|error| format!("Endpoint de atualização inválido: {error}"))?;
    let update = app.updater_builder().endpoints(vec![url]).map_err(|error| error.to_string())?.pubkey(pubkey).build().map_err(|error| error.to_string())?.check().await.map_err(|error| error.to_string())?;
    let version = update.as_ref().map(|value| value.version.clone());
    let available = update.is_some();
    *pending.0.lock().map_err(|_| "Não foi possível guardar a atualização pendente.".to_string())? = update;
    Ok(UpdateCheckResult { enabled: true, current_version, available, version, message: None })
}

#[tauri::command]
async fn install_pending_update(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let update = pending.0.lock().map_err(|_| "Não foi possível abrir a atualização pendente.".to_string())?.take().ok_or_else(|| "Nenhuma atualização pendente. Verifique novamente.".to_string())?;
    update.download_and_install(|_, _| {}, || {}).await.map_err(|error| error.to_string())?;
    app.restart();
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SnapshotInfo {
    id: i64,
    kind: String,
    name: Option<String>,
    hash: String,
    created_at: String,
    size_bytes: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CollectionDiff {
    key: String,
    current: i64,
    snapshot: i64,
    delta: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SnapshotComparison {
    equal: bool,
    current_hash: String,
    snapshot_hash: String,
    changed_collections: Vec<CollectionDiff>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PortableMedia {
    token: String,
    name: String,
    data_base64: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PortableBundle {
    format: String,
    version: u32,
    exported_at: String,
    project: Value,
    media: Vec<PortableMedia>,
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn backups_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = data_dir(app)?.join("backups");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("animals-planner.db"))
}

fn open_db(app: &AppHandle) -> Result<Connection, String> {
    let conn = Connection::open(db_path(app)?).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;
         PRAGMA busy_timeout=5000;
         PRAGMA foreign_keys=ON;
         CREATE TABLE IF NOT EXISTS project_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            json TEXT NOT NULL,
            hash TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            name TEXT,
            json TEXT NOT NULL,
            hash TEXT NOT NULL,
            created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS error_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            context TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS executor_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            json TEXT NOT NULL,
            hash TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS content_manifest (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            json TEXT NOT NULL,
            hash TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS executor_progress (
            item_id TEXT PRIMARY KEY,
            item_type TEXT NOT NULL,
            status TEXT NOT NULL,
            completed_at TEXT,
            updated_at TEXT NOT NULL,
            metadata_json TEXT NOT NULL DEFAULT '{}'
         );
         CREATE TABLE IF NOT EXISTS executor_notes (
            id TEXT PRIMARY KEY,
            owner_type TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            text TEXT NOT NULL,
            tags_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS idx_executor_notes_owner ON executor_notes(owner_type, owner_id);
         CREATE TABLE IF NOT EXISTS focus_sessions (
            id TEXT PRIMARY KEY,
            session_date TEXT NOT NULL,
            title TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS focus_items (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            owner_type TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            sort_order INTEGER NOT NULL,
            added_at TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE
         );
         CREATE TABLE IF NOT EXISTS executor_issues (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS executor_bookmarks (
            owner_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS executor_entity_links (
            id TEXT PRIMARY KEY,
            entity_key TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );
         CREATE UNIQUE INDEX IF NOT EXISTS idx_executor_entity_links_key ON executor_entity_links(entity_key);
         CREATE TABLE IF NOT EXISTS executor_entity_states (
            entity_key TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS executor_test_runs (
            run_key TEXT PRIMARY KEY,
            recipe_id TEXT NOT NULL,
            owner_id TEXT,
            status TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS recent_locations (
            route TEXT PRIMARY KEY,
            data_json TEXT NOT NULL,
            visited_at TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS suite_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
         );"
    ).map_err(|e| e.to_string())?;

    let has_name = {
        let mut stmt = conn.prepare("PRAGMA table_info(snapshots)").map_err(|e| e.to_string())?;
        let columns = stmt.query_map([], |row| row.get::<_, String>(1)).map_err(|e| e.to_string())?;
        let has_name = columns.filter_map(Result::ok).any(|name| name == "name");
        has_name
    };
    if !has_name {
        conn.execute("ALTER TABLE snapshots ADD COLUMN name TEXT", []).map_err(|e| e.to_string())?;
    }
    Ok(conn)
}

fn hash_text(text: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(text.as_bytes());
    hex::encode(hasher.finalize())
}

#[tauri::command]
fn load_project_state(app: AppHandle) -> Result<Option<String>, String> {
    let conn = open_db(&app)?;
    let mut stmt = conn.prepare("SELECT json FROM project_state WHERE id=1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    Ok(rows.next().map_err(|e| e.to_string())?.map(|row| row.get::<_, String>(0).unwrap_or_default()))
}

#[tauri::command]
fn save_project_state(app: AppHandle, json: String) -> Result<String, String> {
    serde_json::from_str::<Value>(&json).map_err(|e| format!("JSON inválido: {e}"))?;
    let hash = hash_text(&json);
    let now = Utc::now().to_rfc3339();
    let mut conn = open_db(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO project_state(id,json,hash,updated_at) VALUES(1,?1,?2,?3)
         ON CONFLICT(id) DO UPDATE SET json=excluded.json,hash=excluded.hash,updated_at=excluded.updated_at",
        params![json, hash, now]
    ).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    let verify_conn = open_db(&app)?;
    let saved: String = verify_conn.query_row("SELECT json FROM project_state WHERE id=1", [], |r| r.get(0)).map_err(|e| e.to_string())?;
    if hash_text(&saved) != hash { return Err("A verificação do salvamento falhou.".into()); }
    Ok(hash)
}

#[tauri::command]
fn load_executor_state(app: AppHandle) -> Result<Option<String>, String> {
    let conn = open_db(&app)?;
    let mut stmt = conn.prepare("SELECT json FROM executor_state WHERE id=1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    Ok(rows.next().map_err(|e| e.to_string())?.map(|row| row.get::<_, String>(0).unwrap_or_default()))
}

#[tauri::command]
fn save_executor_state(app: AppHandle, json: String) -> Result<String, String> {
    serde_json::from_str::<Value>(&json).map_err(|e| format!("JSON do Executor inválido: {e}"))?;
    let hash = hash_text(&json);
    let now = Utc::now().to_rfc3339();
    let mut conn = open_db(&app)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO executor_state(id,json,hash,updated_at) VALUES(1,?1,?2,?3)
         ON CONFLICT(id) DO UPDATE SET json=excluded.json,hash=excluded.hash,updated_at=excluded.updated_at",
        params![json, hash, now]
    ).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(hash)
}

#[tauri::command]
fn save_content_manifest(app: AppHandle, json: String) -> Result<String, String> {
    serde_json::from_str::<Value>(&json).map_err(|e| format!("Manifesto inválido: {e}"))?;
    let hash = hash_text(&json);
    let now = Utc::now().to_rfc3339();
    let conn = open_db(&app)?;
    conn.execute(
        "INSERT INTO content_manifest(id,json,hash,updated_at) VALUES(1,?1,?2,?3)
         ON CONFLICT(id) DO UPDATE SET json=excluded.json,hash=excluded.hash,updated_at=excluded.updated_at",
        params![json, hash, now]
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO suite_meta(key,value,updated_at) VALUES('database_schema','4',?1)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at",
        params![now]
    ).map_err(|e| e.to_string())?;
    Ok(hash)
}

#[tauri::command]
fn get_launch_mode() -> String {
    for argument in std::env::args() {
        if argument == "--executor" || argument == "--mode=executor" { return "executor".into(); }
        if argument == "--planner" || argument == "--mode=planner" { return "planner".into(); }
        if let Some(mode) = argument.strip_prefix("--mode=") {
            if mode == "executor" || mode == "planner" { return mode.into(); }
        }
    }
    "auto".into()
}

#[tauri::command]
fn create_snapshot(app: AppHandle, json: String, kind: String, name: Option<String>, max_auto_backups: Option<i64>) -> Result<(), String> {
    let hash = hash_text(&json);
    let now = Utc::now().to_rfc3339();
    let conn = open_db(&app)?;
    conn.execute(
        "INSERT INTO snapshots(kind,name,json,hash,created_at) VALUES(?1,?2,?3,?4,?5)",
        params![kind, name, json, hash, now]
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    let mirror_name = format!("{}-{}-{}.animalsplan.snapshot.json", id, sanitize(&kind), Utc::now().format("%Y%m%d-%H%M%S"));
    fs::write(backups_dir(&app)?.join(mirror_name), &json).map_err(|e| e.to_string())?;

    let limit = max_auto_backups.unwrap_or(30).clamp(1, 500);
    conn.execute(
        "DELETE FROM snapshots WHERE kind='auto' AND id NOT IN (SELECT id FROM snapshots WHERE kind='auto' ORDER BY id DESC LIMIT ?1)",
        params![limit]
    ).map_err(|e| e.to_string())?;
    cleanup_backup_mirrors(&app, &conn)?;
    Ok(())
}

#[tauri::command]
fn list_snapshots(app: AppHandle) -> Result<Vec<SnapshotInfo>, String> {
    let conn = open_db(&app)?;
    let mut stmt = conn.prepare("SELECT id,kind,name,hash,created_at,LENGTH(json) FROM snapshots ORDER BY id DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok(SnapshotInfo {
        id: row.get(0)?, kind: row.get(1)?, name: row.get(2)?, hash: row.get(3)?, created_at: row.get(4)?, size_bytes: row.get(5)?,
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>,_>>().map_err(|e| e.to_string())
}

#[tauri::command]
fn load_snapshot(app: AppHandle, id: i64) -> Result<String, String> {
    let conn = open_db(&app)?;
    conn.query_row("SELECT json FROM snapshots WHERE id=?1", params![id], |row| row.get(0)).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_snapshot(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = open_db(&app)?;
    conn.execute("DELETE FROM snapshots WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    cleanup_backup_mirrors(&app, &conn)?;
    Ok(())
}

#[tauri::command]
fn rename_snapshot(app: AppHandle, id: i64, name: String) -> Result<(), String> {
    let conn = open_db(&app)?;
    conn.execute("UPDATE snapshots SET name=?1 WHERE id=?2", params![name.trim(), id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn compare_snapshot(app: AppHandle, id: i64, current_json: String) -> Result<SnapshotComparison, String> {
    let snapshot_json = load_snapshot(app, id)?;
    let current: Value = serde_json::from_str(&current_json).map_err(|e| e.to_string())?;
    let snapshot: Value = serde_json::from_str(&snapshot_json).map_err(|e| e.to_string())?;
    let keys = ["worlds","areas","animals","enemies","items","mechanics","npcs","missions","rumors","whispers","challenges","bosses","music","ideas","areaResources","galleryImages","relations","trash"];
    let mut changed = Vec::new();
    for key in keys {
        let a = current.get(key).and_then(Value::as_array).map(|v| v.len() as i64).unwrap_or(0);
        let b = snapshot.get(key).and_then(Value::as_array).map(|v| v.len() as i64).unwrap_or(0);
        if a != b { changed.push(CollectionDiff { key: key.into(), current: a, snapshot: b, delta: a - b }); }
    }
    let current_hash = hash_text(&current_json);
    let snapshot_hash = hash_text(&snapshot_json);
    Ok(SnapshotComparison { equal: current_hash == snapshot_hash, current_hash, snapshot_hash, changed_collections: changed })
}

#[tauri::command]
fn open_backups_folder(app: AppHandle) -> Result<(), String> {
    open_folder(backups_dir(&app)?)
}

#[tauri::command]
fn export_project_file(json: String) -> Result<(), String> {
    let path = rfd::FileDialog::new()
        .set_title("Exportar Animals - Planejador")
        .add_filter("Projeto Animals", &["animalsplan", "json"])
        .set_file_name("Animals-Planejador.animalsplan.json")
        .save_file();
    if let Some(path) = path { fs::write(path, json).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
fn export_portable_project(json: String) -> Result<(), String> {
    let mut project: Value = serde_json::from_str(&json).map_err(|e| format!("Projeto inválido: {e}"))?;
    let mut media = Vec::new();
    let mut known: HashMap<String,String> = HashMap::new();
    collect_portable_media(&mut project, &mut media, &mut known)?;
    let bundle = PortableBundle { format:"animalsplan-portable".into(), version:1, exported_at:Utc::now().to_rfc3339(), project, media };
    let serialized = serde_json::to_string(&bundle).map_err(|e| e.to_string())?;
    let path = rfd::FileDialog::new()
        .set_title("Exportar projeto portátil")
        .add_filter("Projeto portátil Animals", &["animalsplan"])
        .set_file_name("Animals-Projeto.animalsplan")
        .save_file();
    if let Some(path) = path { fs::write(path, serialized).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
fn import_portable_project(app: AppHandle, bundle: String) -> Result<String, String> {
    let mut parsed: PortableBundle = serde_json::from_str(&bundle).map_err(|e| format!("Pacote portátil inválido: {e}"))?;
    if parsed.format != "animalsplan-portable" { return Err("Formato portátil não reconhecido.".into()); }
    let root = data_dir(&app)?.join("imported-media").join(Utc::now().format("%Y%m%d-%H%M%S").to_string());
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    let mut paths = HashMap::new();
    for item in parsed.media {
        let bytes = STANDARD.decode(item.data_base64).map_err(|e| e.to_string())?;
        let relative = item.token.trim_start_matches("media/");
        let path = root.join(sanitize_filename(relative));
        fs::write(&path, bytes).map_err(|e| e.to_string())?;
        paths.insert(item.token, path.to_string_lossy().to_string());
    }
    restore_portable_media(&mut parsed.project, &paths);
    serde_json::to_string(&parsed.project).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_media_data_url(app: AppHandle, data_url: String, suggested_name: String, category: String) -> Result<String, String> {
    let (_, payload) = data_url.split_once(',').ok_or("Data URL inválida")?;
    let bytes = STANDARD.decode(payload).map_err(|e| e.to_string())?;
    let folder = data_dir(&app)?.join("media").join(sanitize(&category));
    fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
    let filename = unique_filename(&folder, &sanitize_filename(&suggested_name));
    let path = folder.join(filename);
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn media_file_exists(path: String) -> bool {
    if path.starts_with("data:") || path.starts_with("http:") || path.starts_with("https:") || path.starts_with("asset:") { return true; }
    Path::new(&path).is_file()
}

#[tauri::command]
fn write_error_log(app: AppHandle, context: String, message: String) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let conn = open_db(&app)?;
    conn.execute("INSERT INTO error_logs(context,message,created_at) VALUES(?1,?2,?3)", params![context, message, now]).map_err(|e| e.to_string())?;
    let log_dir = data_dir(&app)?.join("logs");
    fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    let log_path = log_dir.join("animals-planejador.log");
    let line = format!("[{now}] {context}\n{message}\n\n");
    let mut file = fs::OpenOptions::new().create(true).append(true).open(log_path).map_err(|e| e.to_string())?;
    file.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn export_support_report(app: AppHandle) -> Result<(), String> {
    let conn = open_db(&app)?;
    let state_info: Option<(String, String)> = conn
        .query_row("SELECT hash, updated_at FROM project_state WHERE id=1", [], |r| Ok((r.get(0)?, r.get(1)?)))
        .ok();
    let mut stmt = conn.prepare("SELECT created_at, context, message FROM error_logs ORDER BY id DESC LIMIT 200").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))).map_err(|e| e.to_string())?;
    let mut report = String::from("ANIMALS - PLANEJADOR | RELATÓRIO DE SUPORTE\n\n");
    report.push_str(&format!("Gerado em: {}\n", Utc::now().to_rfc3339()));
    report.push_str(&format!("Versão: {}\n", env!("CARGO_PKG_VERSION")));
    if let Some((hash, updated)) = state_info { report.push_str(&format!("Último save: {updated}\nHash: {hash}\n")); }
    report.push_str(&format!("Pasta de dados: {}\n\nERROS RECENTES\n", data_dir(&app)?.display()));
    for row in rows { let (at, context, message) = row.map_err(|e| e.to_string())?; report.push_str(&format!("\n[{at}] {context}\n{message}\n")); }
    let path = rfd::FileDialog::new().set_title("Exportar relatório de suporte").add_filter("Texto", &["txt"]).set_file_name("Animals-Planejador-Relatorio-Suporte.txt").save_file();
    if let Some(path) = path { fs::write(path, report).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
fn get_support_paths(app: AppHandle) -> Result<Value, String> {
    let dir = data_dir(&app)?;
    Ok(serde_json::json!({
        "dataDir": dir,
        "database": db_path(&app)?,
        "backups": backups_dir(&app)?,
        "log": data_dir(&app)?.join("logs").join("animals-planejador.log")
    }))
}

fn collect_portable_media(value: &mut Value, media: &mut Vec<PortableMedia>, known: &mut HashMap<String,String>) -> Result<(), String> {
    match value {
        Value::Object(map) => {
            for (key, child) in map.iter_mut() {
                let media_key = matches!(key.as_str(), "filePath" | "image" | "conceptArt" | "backgroundImage");
                if media_key {
                    if let Some(path) = child.as_str().map(str::to_string) {
                        if !path.is_empty() && !path.starts_with("data:") && !path.starts_with("http:") && !path.starts_with("https:") && !path.starts_with("asset:") && Path::new(&path).is_file() {
                            let token = if let Some(existing) = known.get(&path) { existing.clone() } else {
                                let file_name = Path::new(&path).file_name().and_then(|v| v.to_str()).unwrap_or("media.bin");
                                let token = format!("media/{}-{}", &hash_text(&path)[..12], sanitize_filename(file_name));
                                let bytes = fs::read(&path).map_err(|e| format!("Falha ao ler mídia {path}: {e}"))?;
                                media.push(PortableMedia { token: token.clone(), name:file_name.into(), data_base64:STANDARD.encode(bytes) });
                                known.insert(path.clone(), token.clone());
                                token
                            };
                            *child = Value::String(format!("portable://{token}"));
                            continue;
                        }
                    }
                }
                collect_portable_media(child, media, known)?;
            }
        }
        Value::Array(items) => for child in items { collect_portable_media(child, media, known)?; },
        _ => {}
    }
    Ok(())
}

fn restore_portable_media(value: &mut Value, paths: &HashMap<String,String>) {
    match value {
        Value::String(text) if text.starts_with("portable://") => {
            let token = text.trim_start_matches("portable://");
            if let Some(path) = paths.get(token) { *text = path.clone(); }
        }
        Value::Object(map) => for child in map.values_mut() { restore_portable_media(child, paths); },
        Value::Array(items) => for child in items { restore_portable_media(child, paths); },
        _ => {}
    }
}

fn cleanup_backup_mirrors(app: &AppHandle, conn: &Connection) -> Result<(), String> {
    let mut stmt = conn.prepare("SELECT id FROM snapshots").map_err(|e| e.to_string())?;
    let ids: HashSet<i64> = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();
    for entry in fs::read_dir(backups_dir(app)?).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        let id = name.split('-').next().and_then(|v| v.parse::<i64>().ok());
        if id.is_some_and(|value| !ids.contains(&value)) { let _ = fs::remove_file(entry.path()); }
    }
    Ok(())
}

fn open_folder(path: PathBuf) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    { Command::new("explorer").arg(path).spawn().map_err(|e| e.to_string())?; }
    #[cfg(target_os = "macos")]
    { Command::new("open").arg(path).spawn().map_err(|e| e.to_string())?; }
    #[cfg(all(unix, not(target_os = "macos")))]
    { Command::new("xdg-open").arg(path).spawn().map_err(|e| e.to_string())?; }
    Ok(())
}

fn sanitize(value: &str) -> String {
    let clean: String = value.chars().filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_').collect();
    if clean.is_empty() { "files".into() } else { clean }
}
fn sanitize_filename(value: &str) -> String {
    let clean: String = value.chars().map(|c| if c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_' | ' ') { c } else { '_' }).collect();
    if clean.trim().is_empty() { "arquivo.bin".into() } else { clean }
}
fn unique_filename(folder: &Path, name: &str) -> String {
    let candidate = folder.join(name);
    if !candidate.exists() { return name.to_string(); }
    let path = Path::new(name);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("arquivo");
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    for i in 2..10_000 {
        let candidate_name = if ext.is_empty() { format!("{stem}-{i}") } else { format!("{stem}-{i}.{ext}") };
        if !folder.join(&candidate_name).exists() { return candidate_name; }
    }
    format!("{}-{}", stem, Utc::now().timestamp())
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            open_db(&handle).map_err(std::io::Error::other)?;
            app.handle().plugin(tauri_plugin_updater::Builder::new().build()).map_err(|error| std::io::Error::other(error.to_string()))?;
            app.manage(PendingUpdate(Mutex::new(None)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_project_state, save_project_state, load_executor_state, save_executor_state,
            save_content_manifest, get_launch_mode, check_for_update, install_pending_update, create_snapshot, list_snapshots, load_snapshot,
            delete_snapshot, rename_snapshot, compare_snapshot, open_backups_folder,
            export_project_file, export_portable_project, import_portable_project,
            save_media_data_url, media_file_exists, write_error_log, export_support_report, get_support_paths
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar Animals Suite");
}
