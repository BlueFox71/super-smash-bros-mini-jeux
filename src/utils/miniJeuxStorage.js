/**
 * Scores des mini-jeux à score simple (« Trouve l'intrus », « Le plus ancien »).
 *
 * « Écris-les tous ! » garde son propre module : son classement combine un
 * pourcentage, un temps et des malus d'indices, et gère deux classements
 * séparés selon le mode. Ici une entrée tient en trois champs, d'où ce module
 * générique paramétré par une clé de jeu.
 */

const PREFIXE = 'smash_minijeu_'
/** Au-delà, les vieilles parties n'apportent plus rien au classement. */
const MAX_ENTREES = 200

const cle = (jeu) => `${PREFIXE}${jeu}`

/**
 * @typedef {Object} EntreeScore
 * @property {string} joueur
 * @property {number} score - points (bonnes réponses, ou meilleure série)
 * @property {number} [total] - nombre de manches jouées, si le jeu en a un fixe
 * @property {string} date - ISO string, sert aussi d'identifiant
 */

/**
 * @param {string} jeu - identifiant du mini-jeu (ex. 'intrus')
 * @returns {EntreeScore[]}
 */
export function getScores(jeu) {
  try {
    const raw = localStorage.getItem(cle(jeu))
    if (!raw) return []
    const liste = JSON.parse(raw)
    return Array.isArray(liste) ? liste.filter((e) => e && typeof e.score === 'number') : []
  } catch {
    return []
  }
}

/**
 * Enregistre une partie.
 * @param {string} jeu
 * @param {{ joueur: string, score: number, total?: number }} entree
 */
export function addScore(jeu, entree) {
  const scores = getScores(jeu)
  scores.push({
    joueur: entree.joueur,
    score: entree.score,
    ...(entree.total != null ? { total: entree.total } : null),
    date: new Date().toISOString(),
  })
  try {
    localStorage.setItem(cle(jeu), JSON.stringify(scores.slice(-MAX_ENTREES)))
  } catch {
    // Quota dépassé ou stockage indisponible : la partie n'est pas enregistrée,
    // ce qui ne doit pas empêcher d'afficher le résultat.
  }
}

/** Score brut décroissant, puis la partie la plus ancienne d'abord. */
const parScoreBrut = (a, b) => b.score - a.score || new Date(a.date) - new Date(b.date)

/**
 * Taux de réussite décroissant, puis score brut.
 *
 * À utiliser quand le nombre d'épreuves varie d'une partie à l'autre : sur un
 * classement au score brut, un 20/20 parfait tombe derrière un 32/32 alors que
 * les deux valent 100 %. Le score brut départage ensuite, la partie la plus
 * longue passant devant.
 */
export const parTauxDeReussite = (a, b) => {
  const taux = (e) => (e.total ? e.score / e.total : 0)
  return taux(b) - taux(a) || parScoreBrut(a, b)
}

/**
 * Classement des parties enregistrées.
 * @param {string} jeu
 * @param {(a: EntreeScore, b: EntreeScore) => number} [comparateur] - par défaut, le score brut
 * @returns {EntreeScore[]}
 */
export function getRanking(jeu, comparateur = parScoreBrut) {
  return [...getScores(jeu)].sort(comparateur)
}

/**
 * Meilleur score d'un joueur, ou null s'il n'a jamais joué.
 * @param {string} jeu
 * @param {string} joueur
 * @returns {number|null}
 */
export function getBestScore(jeu, joueur) {
  const siens = getScores(jeu).filter((e) => e.joueur === joueur)
  return siens.length ? Math.max(...siens.map((e) => e.score)) : null
}

/**
 * Supprime une entrée par sa date.
 * @param {string} jeu
 * @param {string} date
 */
export function deleteScore(jeu, date) {
  try {
    localStorage.setItem(cle(jeu), JSON.stringify(getScores(jeu).filter((e) => e.date !== date)))
  } catch {
    // ignore
  }
}

/** Formate une date ISO en JJ/MM/AAAA à HH:mm */
export function formatScoreDate(dateIso) {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return ''
  const jj = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${jj}/${mm}/${d.getFullYear()} à ${hh}:${min}`
}
