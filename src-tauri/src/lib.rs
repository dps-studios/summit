use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: r#"
                CREATE TABLE IF NOT EXISTS health_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL UNIQUE,
                    body_battery INTEGER,
                    sleep_score INTEGER,
                    sleep_duration_seconds INTEGER,
                    deep_sleep_seconds INTEGER,
                    rem_sleep_seconds INTEGER,
                    stress_avg INTEGER,
                    resting_hr INTEGER,
                    hrv_avg INTEGER,
                    intensity_minutes INTEGER,
                    steps INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS vital_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL UNIQUE,
                    score INTEGER NOT NULL,
                    sleep_component INTEGER,
                    recovery_component INTEGER,
                    strain_component INTEGER,
                    recommendation TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS trends (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric TEXT NOT NULL,
                    timeframe TEXT NOT NULL,
                    baseline REAL,
                    current_avg REAL,
                    percent_change REAL,
                    direction TEXT,
                    detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(metric, timeframe)
                );

                CREATE INDEX idx_health_metrics_date ON health_metrics(date);
                CREATE INDEX idx_vital_scores_date ON vital_scores(date);
                CREATE INDEX idx_trends_metric ON trends(metric, timeframe);
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:summit.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
