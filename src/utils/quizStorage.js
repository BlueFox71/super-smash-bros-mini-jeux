const STORAGE_KEY = 'smash_quiz_answered'

// Le pseudo est désormais géré globalement dans utils/joueursStorage.js

/**
 * Retourne les IDs des questions déjà répondues pour un joueur.
 * @param {string} playerName - Nom du joueur
 * @returns {number[]}
 */
export function getAnsweredIds(playerName) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    const ids = data[playerName]
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

/**
 * Ajoute un ID de question aux répondues pour un joueur.
 * @param {string} playerName - Nom du joueur
 * @param {number} questionId - ID de la question
 */
export function addAnsweredId(playerName, questionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    if (!data[playerName]) data[playerName] = []
    if (!data[playerName].includes(questionId)) {
      data[playerName].push(questionId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch {
    // ignore
  }
}

/**
 * Réinitialise les questions répondues pour un joueur (ex. banque épuisée).
 * @param {string} playerName - Nom du joueur
 */
export function resetAnsweredIds(playerName) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    data[playerName] = []
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}
