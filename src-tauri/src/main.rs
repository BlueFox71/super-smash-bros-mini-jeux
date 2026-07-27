// Coquille Tauri, sans aucune commande native : les trois mini-jeux tournent
// entièrement dans la page, et leurs scores vivent dans le localStorage du WebView2.
// Rien n'a donc à traverser l'IPC — d'où l'absence d'`invoke_handler`.
//
// `server.cjs`, à la racine du dépôt, expose un classement partagé sur le port 3001 ;
// il n'est PAS embarqué ici, et l'app ne l'appelle pas. Le mode hors ligne est complet.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("échec du lancement de Mini Jeux Smash");
}
