import { getCharactersWithYear, shuffleArray } from '../data'

/**
 * Fourchette d'écart, en années, entre les deux personnages d'un duel, selon la
 * série de bonnes réponses en cours.
 *
 * Le jeu est un choix binaire : sans progression, une partie se résume à une
 * suite de pièces lancées en l'air. D'où ces paliers — mais la difficulté tient
 * au **plafond**, pas au plancher. Ne fixer qu'un minimum ne sert à rien : le
 * vivier va de 1980 à 2019, donc une paire tirée au hasard avec « au moins un an
 * d'écart » en affiche onze en moyenne, soit un duel aussi facile qu'au premier
 * palier. C'est en bornant l'écart par le haut qu'on resserre vraiment.
 */
const PALIERS = [
  { serieMin: 0, ecartMin: 12, ecartMax: 40 },
  { serieMin: 3, ecartMin: 5, ecartMax: 15 },
  { serieMin: 6, ecartMin: 3, ecartMax: 8 },
  { serieMin: 10, ecartMin: 2, ecartMax: 5 },
  { serieMin: 15, ecartMin: 1, ecartMax: 3 },
]

/**
 * Fourchette d'écart attendue pour la manche suivante.
 * @param {number} serieEnCours - nombre de bonnes réponses consécutives
 * @returns {{ ecartMin: number, ecartMax: number }}
 */
export function fourchettePourSerie(serieEnCours) {
  let palier = PALIERS[0]
  for (const p of PALIERS) {
    if (serieEnCours >= p.serieMin) palier = p
  }
  return { ecartMin: palier.ecartMin, ecartMax: palier.ecartMax }
}

/** Toutes les paires dont l'écart tient dans la fourchette. */
function pairesDansFourchette(vivier, ecartMin, ecartMax) {
  const paires = []
  for (let i = 0; i < vivier.length; i++) {
    for (let j = i + 1; j < vivier.length; j++) {
      const ecart = Math.abs(vivier[i].annee - vivier[j].annee)
      if (ecart >= ecartMin && ecart <= ecartMax) paires.push([vivier[i], vivier[j]])
    }
  }
  return paires
}

/**
 * Tire un duel dont l'écart d'années tient dans la fourchette demandée.
 *
 * Si aucune paire ne convient, la contrainte est relâchée par étapes — d'abord le
 * plafond, puis le plancher — plutôt que de renvoyer null et d'interrompre une
 * partie en cours.
 *
 * @param {{ ecartMin: number, ecartMax: number }} fourchette
 * @param {number[]} [idsRecents=[]] - ids à éviter, pour ne pas revoir les mêmes
 *   personnages deux duels de suite
 * @returns {{ gauche: Object, droite: Object, plusAncienId: number }|null}
 */
export function genererDuel({ ecartMin, ecartMax }, idsRecents = []) {
  const tous = getCharactersWithYear()
  if (tous.length < 2) return null

  const recents = new Set(idsRecents)
  const frais = tous.filter((p) => !recents.has(p.id))
  // Avec trop d'exclusions il ne resterait pas de quoi former un duel : dans ce
  // cas on repart de l'ensemble complet.
  const vivier = frais.length >= 2 ? frais : tous

  const tentatives = [
    { ecartMin, ecartMax },
    { ecartMin, ecartMax: ecartMax * 2 },
    { ecartMin: 1, ecartMax: Infinity },
  ]

  for (const t of tentatives) {
    const paires = pairesDansFourchette(vivier, t.ecartMin, t.ecartMax)
    if (paires.length === 0) continue
    const [a, b] = shuffleArray(paires)[0]
    // Mélangé pour que le plus ancien ne soit pas toujours à gauche.
    const [gauche, droite] = shuffleArray([a, b])
    return {
      gauche,
      droite,
      // `ecartMin` valant au moins 1, les deux années diffèrent toujours : la
      // réponse n'est jamais ambiguë.
      plusAncienId: gauche.annee < droite.annee ? gauche.id : droite.id,
    }
  }
  return null
}
