import { shuffleArray } from '../data'
import { enigmesResolues } from '../data/intrusEnigmes'

/** Nombres de cartes proposés à l'intro. Une manche = (n − 1) membres + 1 intrus. */
export const TAILLES_PLATEAU = [4, 6, 8]
export const TAILLE_PLATEAU_DEFAUT = 8

/**
 * Nombre de manches jouables sans réutiliser deux fois la même énigme, pour un
 * plateau donné. Les énigmes trop peu fournies pour remplir le plateau sont
 * écartées (à 8 cartes il faut 7 personnages partageant le critère).
 * @param {number} taillePlateau
 * @returns {number}
 */
export function enigmesDisponibles(taillePlateau) {
  try {
    return enigmesResolues(taillePlateau - 1).length
  } catch {
    return 0
  }
}

/**
 * Tire une manche à partir d'une énigme.
 * @param {Object} enigme - énigme résolue (membres/intrus en personnages)
 * @param {number} tailleGroupe - nombre de membres à afficher
 */
function genererManche(enigme, tailleGroupe) {
  const groupe = shuffleArray(enigme.membres).slice(0, tailleGroupe)
  const intrus = shuffleArray(enigme.intrus)[0]
  return {
    enigmeId: enigme.id,
    categorie: enigme.categorie,
    critere: enigme.critere,
    // Mélangé pour que l'intrus ne soit pas toujours à la même place.
    cartes: shuffleArray([...groupe, intrus]),
    intrusId: intrus.id,
  }
}

/**
 * Construit une partie complète.
 *
 * Chaque énigme n'est utilisée qu'une fois tant qu'il en reste : revoir deux fois
 * le même critère dans une partie éventerait la seconde manche.
 *
 * @param {number} nbManches
 * @param {number} taillePlateau - nombre de cartes par manche
 * @returns {Array<{ enigmeId: string, categorie: string, critere: string, cartes: Array, intrusId: number }>}
 */
export function genererPartie(nbManches, taillePlateau = TAILLE_PLATEAU_DEFAUT) {
  const tailleGroupe = taillePlateau - 1
  const enigmes = enigmesResolues(tailleGroupe)
  if (enigmes.length === 0) return []

  const manches = []
  let restantes = shuffleArray(enigmes)
  for (let i = 0; i < nbManches; i++) {
    if (restantes.length === 0) restantes = shuffleArray(enigmes)
    manches.push(genererManche(restantes.shift(), tailleGroupe))
  }
  return manches
}
