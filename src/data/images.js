/**
 * Résolution des URL d'images, mutualisée.
 *
 * Les trois jeux d'images (originaux, miniatures de grille, variantes de
 * couleur) étaient auparavant globés séparément dans GrillePersonnages,
 * JeuImagesPage et EcrisLesTousPage — soit le même millier d'entrées répété
 * dans trois chunks, avec un `Object.keys(...).find(...)` par case de grille.
 * Sur les 86 cases, ça faisait plus de 50 000 comparaisons de chaînes à chaque
 * frappe au clavier. Tout est ici, indexé une seule fois dans des Map.
 */

/** Originaux 800 px : jeu d'images (affichés en 400×280 avec zooms jusqu'à 290 %). */
const modulesOriginaux = import.meta.glob('./characters/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

/** Miniatures produites par `npm run miniatures` : cases de la grille. */
const modulesMiniatures = import.meta.glob('./characters/miniatures/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

/** Variantes de couleur, nommées `<base>_<n>.webp`. */
const modulesVariantes = import.meta.glob('./characters/couleurs/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

/** Nom de fichier en minuscules, sans le chemin. */
const nomDeFichier = (cheminModule) =>
  (cheminModule.replace(/\\/g, '/').split('/').pop() || '').toLowerCase()

/** Construit une Map nom de fichier -> URL. */
function indexerParNom(modules) {
  const index = new Map()
  for (const chemin of Object.keys(modules)) {
    index.set(nomDeFichier(chemin), modules[chemin])
  }
  return index
}

const originauxParNom = indexerParNom(modulesOriginaux)
const miniaturesParNom = indexerParNom(modulesMiniatures)

/** base -> Map(numéro de variante -> URL), triée par numéro croissant. */
const variantesParBase = (() => {
  const index = new Map()
  for (const chemin of Object.keys(modulesVariantes)) {
    const correspondance = nomDeFichier(chemin).match(/^(.+)_(\d+)\.webp$/)
    if (!correspondance) continue
    const base = correspondance[1]
    if (!index.has(base)) index.set(base, new Map())
    index.get(base).set(parseInt(correspondance[2], 10), modulesVariantes[chemin])
  }
  // Le panneau de détail affiche les couleurs dans l'ordre : on trie une fois ici
  // plutôt qu'à chaque rendu.
  for (const [base, variantes] of index) {
    index.set(base, new Map([...variantes].sort((a, b) => a[0] - b[0])))
  }
  return index
})()

/** `mario.webp` -> `mario` */
const baseDepuisFichier = (filename) =>
  (filename || '').replace(/\.webp$/i, '').toLowerCase()

/** URL de l'image originale (800 px). */
export const urlOriginal = (filename) =>
  (filename && originauxParNom.get(filename.toLowerCase())) || null

/**
 * URL de la miniature de grille, avec repli sur l'original si les miniatures
 * n'ont pas encore été générées (`npm run miniatures`).
 */
export const urlMiniature = (filename) => {
  if (!filename) return null
  return miniaturesParNom.get(filename.toLowerCase()) || urlOriginal(filename)
}

/** URL d'une variante de couleur précise, ou null. */
export const urlVariante = (filename, numero) =>
  variantesParBase.get(baseDepuisFichier(filename))?.get(numero) ?? null

/** Toutes les URL de variantes d'un personnage, triées par numéro. */
export const urlsVariantes = (filename) => {
  const variantes = variantesParBase.get(baseDepuisFichier(filename))
  return variantes ? [...variantes.values()] : []
}

/** Numéros de variantes disponibles (1–7), triés. */
export const numerosVariantes = (filename) => {
  const variantes = variantesParBase.get(baseDepuisFichier(filename))
  if (!variantes) return []
  return [...variantes.keys()].filter((n) => n >= 1 && n <= 7)
}

/** true si le personnage possède au moins une variante de couleur. */
export const aDesVariantes = (filename) =>
  (variantesParBase.get(baseDepuisFichier(filename))?.size ?? 0) > 0
