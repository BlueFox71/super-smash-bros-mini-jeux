/**
 * Génère les miniatures utilisées par la grille de personnages.
 *
 * La grille affiche 86 cases d'environ 90 px de côté : servir les originaux
 * 800 px revient à télécharger 7 Mo pour peindre 86 vignettes. D'où ce jeu
 * d'images réduites, régénérable par `npm run miniatures`.
 *
 * Chaque case applique son propre `background-size` (le champ `zoom` de
 * personnages.json, de 100 % à 500 %), donc la résolution réellement utile varie
 * d'un personnage à l'autre : Mario (zoom 140) n'a besoin que de ~150 px de
 * source là où un personnage à zoom 500 en réclame plus de 380. Réduire tout le
 * monde à une taille unique gaspille des octets sur les uns et floute les
 * autres — on dimensionne donc au cas par cas.
 *
 * Le jeu d'images continue d'utiliser les originaux : il les affiche en 400×280
 * avec des zooms jusqu'à 290 %, où les 800 px servent vraiment.
 */
import { readdir, mkdir, stat, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = join(root, 'src', 'data', 'characters')
const OUT_DIR = join(SOURCE_DIR, 'miniatures')

/** Côté d'une case de la grille, en pixels CSS (grille de 1240 px max sur 13 colonnes). */
const CASE_PX = 90
/** Marge pour les écrans à forte densité, sans viser le 2× qui doublerait le poids. */
const DENSITE = 1.5
/**
 * Plancher dicté non par la grille mais par « Trouve l'intrus » et « Le plus
 * ancien » : ces deux jeux affichent le portrait entier (`contain`) dans des
 * cadres de 130 à 170 px, sans le recadrage zoomé de la grille. Un personnage à
 * zoom 100 n'aurait besoin que de 135 px pour la grille, mais serait flou dans
 * ces cadres.
 */
const TAILLE_MIN = 224
const TAILLE_MAX = 448
const QUALITE = 80

const octets = (n) => `${(n / 1024).toFixed(0)} Ko`

/** Résolution de source utile pour un zoom donné, bornée. */
function tailleCible(zoom) {
  const utile = Math.ceil((CASE_PX * DENSITE * (zoom ?? 100)) / 100)
  return Math.min(TAILLE_MAX, Math.max(TAILLE_MIN, utile))
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const personnages = JSON.parse(await readFile(join(root, 'src', 'data', 'personnages.json'), 'utf8'))
  const zoomParFichier = new Map(
    personnages.filter((p) => p.filename).map((p) => [p.filename.toLowerCase(), p.zoom])
  )

  const fichiers = (await readdir(SOURCE_DIR, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.webp'))
    .map((e) => e.name)
    .sort()

  if (fichiers.length === 0) {
    console.error(`Aucun .webp trouvé dans ${SOURCE_DIR}`)
    process.exitCode = 1
    return
  }

  let totalAvant = 0
  let totalApres = 0
  const orphelins = []

  for (const nom of fichiers) {
    const cle = nom.toLowerCase()
    if (!zoomParFichier.has(cle)) orphelins.push(nom)

    const taille = tailleCible(zoomParFichier.get(cle))
    const buffer = await sharp(join(SOURCE_DIR, nom))
      .resize({ width: taille, height: taille, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITE, alphaQuality: 90, effort: 6 })
      .toBuffer()

    await writeFile(join(OUT_DIR, nom), buffer)

    totalAvant += (await stat(join(SOURCE_DIR, nom))).size
    totalApres += buffer.length
  }

  console.log(`${fichiers.length} miniatures générées dans src/data/characters/miniatures/`)
  console.log(`${octets(totalAvant)} → ${octets(totalApres)} (${(totalAvant / totalApres).toFixed(1)}× plus léger)`)
  if (orphelins.length > 0) {
    // Une image sans entrée dans personnages.json n'est jamais affichée : elle est
    // réduite à la taille plancher, mais autant le signaler.
    console.warn(`Sans entrée dans personnages.json (zoom inconnu) : ${orphelins.join(', ')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
