const JOUEURS_KEY = 'smash_joueurs'
const JOUEUR_ACTUEL_KEY = 'smash_joueur_actuel'
// Ancienne clé (pseudo du quiz uniquement) : reprise au premier chargement.
const LEGACY_LAST_PLAYER_KEY = 'smash_quiz_last_player'

/** Pseudos toujours proposés si l'utilisateur n'en a jamais ajouté. */
export const JOUEURS_DEFAUT = ['Jules', 'Alexis', 'Invité']
export const PSEUDO_MAX_LENGTH = 20

function readJoueurs() {
  try {
    const raw = localStorage.getItem(JOUEURS_KEY)
    if (!raw) return null
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return null
    const clean = list.filter((n) => typeof n === 'string' && n.trim()).map((n) => n.trim())
    return clean.length ? clean : null
  } catch {
    return null
  }
}

function writeJoueurs(joueurs) {
  try {
    localStorage.setItem(JOUEURS_KEY, JSON.stringify(joueurs))
  } catch {
    // ignore
  }
}

/**
 * Liste des pseudos disponibles, commune à tous les mini-jeux.
 * @returns {string[]}
 */
export function getJoueurs() {
  return readJoueurs() ?? [...JOUEURS_DEFAUT]
}

/**
 * Ajoute un pseudo à la liste commune.
 * @param {string} pseudo - Pseudo saisi
 * @returns {{ ok: boolean, pseudo?: string, error?: string }} `pseudo` est renseigné même
 *   en cas de doublon (le pseudo déjà présent), pour pouvoir le sélectionner directement.
 */
export function addJoueur(pseudo) {
  const trimmed = typeof pseudo === 'string' ? pseudo.trim().replace(/\s+/g, ' ') : ''
  if (!trimmed) {
    return { ok: false, error: 'Le pseudo ne peut pas être vide.' }
  }
  if (trimmed.length > PSEUDO_MAX_LENGTH) {
    return { ok: false, error: `Le pseudo ne doit pas dépasser ${PSEUDO_MAX_LENGTH} caractères.` }
  }
  const joueurs = getJoueurs()
  const existant = joueurs.find((j) => j.toLowerCase() === trimmed.toLowerCase())
  if (existant) {
    return { ok: false, pseudo: existant, error: `« ${existant} » est déjà dans la liste.` }
  }
  writeJoueurs([...joueurs, trimmed])
  return { ok: true, pseudo: trimmed }
}

/**
 * Pseudo sélectionné, partagé par tous les mini-jeux.
 * @returns {string}
 */
export function getJoueurActuel() {
  const joueurs = getJoueurs()
  try {
    const stored =
      localStorage.getItem(JOUEUR_ACTUEL_KEY) || localStorage.getItem(LEGACY_LAST_PLAYER_KEY)
    const name = typeof stored === 'string' ? stored.trim() : ''
    if (name) {
      const match = joueurs.find((j) => j.toLowerCase() === name.toLowerCase())
      if (match) return match
    }
  } catch {
    // ignore
  }
  return joueurs[0] ?? JOUEURS_DEFAUT[0]
}

/**
 * Enregistre le pseudo sélectionné (et l'ajoute à la liste s'il en est absent).
 * @param {string} pseudo
 */
export function setJoueurActuel(pseudo) {
  const trimmed = typeof pseudo === 'string' ? pseudo.trim() : ''
  if (!trimmed) return
  const joueurs = getJoueurs()
  if (!joueurs.some((j) => j.toLowerCase() === trimmed.toLowerCase())) {
    writeJoueurs([...joueurs, trimmed])
  }
  try {
    localStorage.setItem(JOUEUR_ACTUEL_KEY, trimmed)
  } catch {
    // ignore
  }
}
