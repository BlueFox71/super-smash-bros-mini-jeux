import { shuffleArray } from '../data'

/**
 * Composition et parcours de la file de critères du variant « Par critère ».
 *
 * Extrait du composant pour être vérifiable : le tirage est aléatoire et
 * l'élagage d'un critère devenu infaisable est un filet de sécurité qu'une partie
 * normale ne déclenche presque jamais — deux choses impossibles à éprouver en
 * jouant.
 */

/** Bornes du nombre de critères tirés par partie. */
export const NB_CRITERES_MIN = 15
export const NB_CRITERES_MAX = 20
/** Nombre maximum de combattants demandés pour un même critère. */
export const A_CITER_MAX = 3

const entier = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

/** Réponses d'un critère qui n'ont pas encore été citées. */
export const reponsesRestantes = (critere, idsCites) =>
  critere.acceptes.filter((p) => !idsCites.has(p.id)).length

/**
 * Nombre de combattants réellement demandés pour une entrée de file.
 *
 * À n'appeler qu'au moment où le critère devient courant : un combattant ne
 * servant qu'une fois, le nombre de réponses restantes baisse à chaque bonne
 * réponse. Recalculer en cours de critère ferait donc descendre l'objectif sous
 * le nombre déjà cité et le validerait trop tôt.
 */
export const requisPour = (entree, idsCites) =>
  Math.min(entree.aCiter, reponsesRestantes(entree.critere, idsCites))

/**
 * Tire la file d'une partie : un sous-ensemble des critères disponibles, chacun
 * avec son propre nombre de combattants à citer.
 *
 * @param {Array} criteres - catalogue complet
 * @returns {Array<{critere: Object, aCiter: number, rattrapage: boolean}>}
 */
export function tirerPartie(criteres) {
  const nb = Math.min(criteres.length, entier(NB_CRITERES_MIN, NB_CRITERES_MAX))
  return shuffleArray(criteres)
    .slice(0, nb)
    .map((critere) => ({
      critere,
      // Borné par le nombre de réponses connues : demander 3 combattants sur un
      // critère qui n'en compte que 2 serait infaisable d'entrée.
      aCiter: Math.min(entier(1, A_CITER_MAX), critere.acceptes.length),
      rattrapage: false,
    }))
}

/**
 * Avance d'un cran dans la file.
 *
 * @param {Array} file - file courante, tête en premier
 * @param {Set<number>} idsCites - combattants déjà utilisés, après la réponse
 * @param {boolean} renvoyer - remettre le critère courant en fin de file (« Passer »)
 * @returns {{ file: Array, ecartes: number }} nouvelle file, et nombre de critères
 *   écartés faute de réponse disponible
 */
export function avancerFile(file, idsCites, renvoyer) {
  if (file.length === 0) return { file, ecartes: 0 }

  const [tete, ...reste] = file
  let suivante = renvoyer
    ? [...reste, { critere: tete.critere, aCiter: tete.aCiter, rattrapage: true }]
    : reste

  // Laisser un critère sans réponse disponible en tête le reproposerait sans fin :
  // le joueur ne pourrait ni le valider ni s'en débarrasser.
  let ecartes = 0
  while (suivante.length > 0 && reponsesRestantes(suivante[0].critere, idsCites) === 0) {
    suivante = suivante.slice(1)
    ecartes += 1
  }
  return { file: suivante, ecartes }
}
