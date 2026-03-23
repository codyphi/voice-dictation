#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // -- System tray --
            let toggle_item = MenuItem::with_id(app, "toggle", "Toggle Dictation", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Voice Dict")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "toggle" => {
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // -- Global shortcut: Ctrl/Cmd+Shift+D --
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            app.global_shortcut().on_shortcut("CmdOrCtrl+Shift+D", |app, _shortcut, _event| {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.emit("toggle-dictation", ());
                }
            })?;

            // -- Attempt to launch Python backend (non-fatal if it fails) --
            use tauri_plugin_shell::ShellExt;
            let shell = app.shell();
            match shell.command("python3").args(["backend/main.py"]).spawn() {
                Ok((_rx, _child)) => eprintln!("Python backend started."),
                Err(e) => eprintln!("Could not auto-start Python backend: {e}. Run it manually."),
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Voice Dict");
}
