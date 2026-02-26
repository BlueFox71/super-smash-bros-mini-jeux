const STORAGE_KEY = 'ecrisLesTous_scores'
const STORAGE_KEY_ORDER = 'ecrisLesTous_scores_order'

/**
 * @typedef {Object} ScoreEntry
 * @property {string} joueur
 * @property {number} nombreDeviné
 * @property {number} tempsSecondes
 * @property {number} [indicesLettres] - nombre d'indices lettres utilisés (malus 3% chacun)
 * @property {number} [indicesLettresAdd] - lettres ajoutées à l'indice courant (malus 1% chacune)
 * @property {number} [indicesSilhouette] - nombre d'indices silhouette utilisés (malus 5% chacun)
 * @property {string} date - ISO string
 */

/**
 * @param {boolean} [orderMode] - true = mode "Dans l'ordre" (classement dédié)
 * @returns {ScoreEntry[]}
 */
export function getScores(orderMode = false) {
  const key = orderMode ? STORAGE_KEY_ORDER : STORAGE_KEY
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

const normalizedEntry = (entry) => ({
  joueur: entry.joueur,
  nombreDeviné: entry.nombreDeviné,
  tempsSecondes: entry.tempsSecondes,
  indicesLettres: entry.indicesLettres ?? 0,
  indicesLettresAdd: entry.indicesLettresAdd ?? 0,
  indicesSilhouette: entry.indicesSilhouette ?? 0,
  date: entry.date || new Date().toISOString(),
})

/**
 * @param {ScoreEntry} entry
 * @param {boolean} [orderMode] - true = mode "Dans l'ordre"
 */
export function addScore(entry, orderMode = false) {
  const key = orderMode ? STORAGE_KEY_ORDER : STORAGE_KEY
  const scores = getScores(orderMode)
  scores.push(normalizedEntry(entry))
  localStorage.setItem(key, JSON.stringify(scores))
}

/** Score en % : (devinés/total)*100 - 3*indicesLettres - 1*indicesLettresAdd - 5*indicesSilhouette, plafonné [0, 100] */
export function scorePercentage(guessedCount, total, indicesLettres = 0, indicesLettresAdd = 0, indicesSilhouette = 0) {
  const pct = (guessedCount / total) * 100 - indicesLettres * 3 - indicesLettresAdd * 1 - indicesSilhouette * 5
  return Math.max(0, Math.min(100, Math.round(pct)))
}

/**
 * Classement : meilleur = score % (desc), puis temps (asc).
 * @param {number} total - nombre total de personnages (pour calcul du %)
 * @param {boolean} [orderMode] - true = classement du mode "Dans l'ordre"
 * @returns {ScoreEntry[]}
 */
export function getRanking(total, orderMode = false) {
  const scores = getScores(orderMode)
  return [...scores].sort((a, b) => {
    const pctA = scorePercentage(a.nombreDeviné, total, a.indicesLettres ?? 0, a.indicesLettresAdd ?? 0, a.indicesSilhouette ?? 0)
    const pctB = scorePercentage(b.nombreDeviné, total, b.indicesLettres ?? 0, b.indicesLettresAdd ?? 0, b.indicesSilhouette ?? 0)
    if (pctB !== pctA) return pctB - pctA
    return a.tempsSecondes - b.tempsSecondes
  })
}

/**
 * Supprime une entrée par sa date (identifiant unique).
 * @param {string} date - date ISO de l'entrée
 * @param {boolean} [orderMode] - true = mode "Dans l'ordre"
 */
export function deleteScore(date, orderMode = false) {
  const key = orderMode ? STORAGE_KEY_ORDER : STORAGE_KEY
  const scores = getScores(orderMode).filter((s) => s.date !== date)
  localStorage.setItem(key, JSON.stringify(scores))
}

/**
 * Met à jour le joueur d'une entrée.
 * @param {string} date - date ISO de l'entrée
 * @param {{ joueur: string }} patch - champs à mettre à jour
 * @param {boolean} [orderMode] - true = mode "Dans l'ordre"
 */
export function updateScore(date, patch, orderMode = false) {
  const key = orderMode ? STORAGE_KEY_ORDER : STORAGE_KEY
  const scores = getScores(orderMode)
  const i = scores.findIndex((s) => s.date === date)
  if (i === -1) return
  if (patch.joueur != null) scores[i].joueur = patch.joueur
  localStorage.setItem(key, JSON.stringify(scores))
}

/** Formate une date ISO en DD/MM/YYYY HH:mm */
export function formatScoreDate(dateIso) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} à ${hh}:${min}`
}
