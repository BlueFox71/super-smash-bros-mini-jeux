/**
 * Normalise une chaîne pour la comparaison : minuscules, sans accents, sans ponctuation.
 */
export function normalize(text) {
  if (typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Distance de Levenshtein entre deux chaînes (nombre d'éditions : insertion, suppression, substitution).
 */
function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  const d = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      )
    }
  }
  return d[m][n]
}

/**
 * Nombre max de lettres d'écart selon la longueur du nom attendu :
 * - nom ≤ 5 caractères : 0 (exact)
 * - nom > 5 : 1 lettre
 * - nom > 7 : 2 lettres
 */
function letterTolerance(nameLength) {
  if (nameLength <= 5) return 0
  if (nameLength <= 7) return 1
  return 2
}

/**
 * Vérifie si la réponse est acceptée : sans accent, sans ponctuation, tolérance selon la longueur du nom.
 * Si acceptedNames est fourni, la réponse peut aussi correspondre à l'un de ces noms.
 * @param {string} expectedName - Nom officiel du personnage
 * @param {string} typedAnswer - Réponse saisie par le joueur
 * @param {string[]} [acceptedNames] - Noms alternatifs acceptés (ex. ["Pyra", "Mythra"])
 * @returns {boolean}
 */
export function isAnswerCorrect(expectedName, typedAnswer, acceptedNames) {
  const b = normalize(typedAnswer)
  if (!b) return false

  const isAcceptable = (name) => {
    const a = normalize(name)
    const maxDist = letterTolerance(a.length)
    return levenshtein(a, b) <= maxDist
  }
  if (isAcceptable(expectedName)) return true
  if (Array.isArray(acceptedNames) && acceptedNames.length) {
    return acceptedNames.some((name) => isAcceptable(name))
  }
  return false
}
