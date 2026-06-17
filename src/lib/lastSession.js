const STORAGE_KEY = 'daredrop_last_session'

/**
 * Merkt sich den Code der zuletzt betretenen/erstellten Session, damit
 * die App beim nächsten Öffnen "Spiel fortsetzen?" anbieten kann, falls
 * die Runde versehentlich geschlossen wurde (Brief: "Letztes Spiel
 * fortsetzen" – verhindert Frust auf Partys, wenn z.B. der Bildschirm
 * ausgeht oder jemand die App aus Versehen schließt).
 */
export function rememberLastSession(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // localStorage evtl. nicht verfügbar, dann verzichten wir auf das Feature
  }
}

export function getLastSessionCode() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearLastSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignorieren
  }
}
