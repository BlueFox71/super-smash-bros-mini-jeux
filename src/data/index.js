import characters from './personnages.json'
import questions from './questions.json'

/**
 * Base de données des personnages Super Smash Bros.
 * Chaque item : { id, name, series, number?, filename? }
 */

/** Convertit le champ number en clé de tri (01 -> 1, 04ε -> 4.5, 33-35 -> 33, 79-80 -> 79) */
function numberOrderKey(number) {
  if (!number) return 9999
  // Plage type "33-35" ou "79-80" : on prend le premier nombre pour le tri
  const rangeMatch = number.match(/^(\d+)\s*-\s*\d+/)
  if (rangeMatch) return parseInt(rangeMatch[1], 10)
  const match = number.match(/^(\d+)(ε|[a-z])?$/i)
  if (!match) return 9999
  let n = parseInt(match[1], 10)
  if (match[2]) {
    if (match[2].toLowerCase() === 'ε') n += 0.5
    else n += (match[2].toLowerCase().charCodeAt(0) - 96) / 100
  }
  return n
}

/** Retourne les personnages triés par ordre de numéro (01, 02, 04ε, …) */
export const getCharactersByNumberOrder = () =>
  [...characters].sort((a, b) => numberOrderKey(a.number) - numberOrderKey(b.number))

/** Retourne les personnages triés par id */
export const getCharactersByIdOrder = () =>
  [...characters].sort((a, b) => a.id - b.id)

export const getCharacters = () => characters

export const getCharacterById = (id) =>
  characters.find((p) => p.id === id)

export const getCharactersBySeries = (series) =>
  characters.filter((p) => p.series === series)

export const getUniqueSeries = () =>
  [...new Set(characters.map((p) => p.series))].sort()

/** Retourne les personnages qui ont une image (filename non null) */
export const getCharactersWithImage = () =>
  characters.filter((p) => p.filename)

/** Retourne n personnages aléatoires (sans doublon) */
export const getRandomCharacters = (n = 1) => {
  const shuffled = shuffleArray(characters)
  return n === 1 ? shuffled[0] : shuffled.slice(0, n)
}

/** Retourne n personnages avec image aléatoires (ordre aléatoire) */
export const getRandomCharactersWithImage = (n = 1) => {
  const shuffled = shuffleArray(getCharactersWithImage())
  return n === 1 ? shuffled[0] : shuffled.slice(0, n)
}

/** Personnages avec image, triés par numéro */
export const getCharactersWithImageByNumberOrder = () =>
  [...getCharactersWithImage()].sort((a, b) => numberOrderKey(a.number) - numberOrderKey(b.number))

/**
 * Personnages dont l'année de première apparition est exploitable.
 *
 * Une seule fiche en est dépourvue (Entraîneuse Wii Fit, dont `firstAppearance`,
 * `story` et `videoGames` sont vides) : elle est écartée plutôt que de produire
 * un duel sans réponse dans « Le plus ancien ».
 * @returns {Array<Object & { annee: number }>}
 */
export const getCharactersWithYear = () =>
  characters
    .filter((p) => /^\d{4}$/.test(String(p.firstAppearance ?? '')))
    .map((p) => ({ ...p, annee: parseInt(p.firstAppearance, 10) }))

/** Questions du quiz (avec options et correct_option) */
export { questions }

/** Retourne une question par son id */
export const getQuestionById = (id) => questions.find((q) => q.id === id)

/** Questions utilisables pour le quiz (avec correct_option défini et options) */
export const getQuizQuestions = () =>
  questions.filter((q) => Array.isArray(q.options) && q.options.length > 0 && typeof q.correct_option === 'number')

/**
 * Mélange Fisher-Yates.
 *
 * À préférer à `sort(() => Math.random() - 0.5)` : ce dernier n'est pas un
 * mélange uniforme (le comparateur est incohérent, donc le résultat dépend de
 * l'algorithme de tri du moteur et laisse les éléments près de leur position
 * d'origine), ce qui faisait ressortir les mêmes premiers personnages.
 */
export function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Redistribue les options d'une question et réaligne `correct_option`.
 *
 * Sans ça, le quiz est cassable sans rien connaître : dans questions.json la
 * bonne réponse est en première position pour environ deux tiers des questions.
 * Répondre systématiquement « A » suffisait à dépasser 60 % de réussite, très
 * loin des 25 % attendus d'un tirage au hasard.
 */
function melangerOptions(question) {
  // Nouvel ordre exprimé en anciens indices : `ordre[k]` est l'option à placer en k.
  const ordre = shuffleArray(question.options.map((_, i) => i))
  return {
    ...question,
    options: ordre.map((i) => question.options[i]),
    correct_option: ordre.indexOf(question.correct_option),
  }
}

/**
 * Retourne n questions de quiz aléatoires, options redistribuées.
 * @param {number} n - Nombre de questions
 * @param {number[]} [excludeIds=[]] - IDs à exclure (déjà répondues)
 */
export const getRandomQuizQuestions = (n, excludeIds = []) => {
  const excludeSet = new Set(excludeIds)
  const usable = getQuizQuestions().filter((q) => !excludeSet.has(q.id))
  return shuffleArray(usable).slice(0, n).map(melangerOptions)
}

export default characters
