import characters from './personnages.json'
import { ENIGMES, enigmesResolues } from './intrusEnigmes'

/**
 * Critères du variant « Par critère » d'« Écris-les tous ! ».
 *
 * Un critère, **un seul combattant à citer**, puis on passe au suivant. D'où deux
 * conséquences sur ces données.
 *
 * 1. **L'exhaustivité des listes n'est pas critique.** Il suffit que le joueur
 *    trouve un nom parmi ceux que la liste connaît ; un oubli de ma part réduit
 *    les réponses possibles sans jamais rendre un critère infaisable.
 *
 * 2. **`attendus` et `toleres` valident tous les deux.** La distinction n'avait
 *    de sens que pour compter plusieurs réponses par critère. `attendus` sert
 *    encore à proposer des exemples quand un critère est passé, et `toleres`
 *    reste alimenté par le champ `douteux` des énigmes de « Trouve l'intrus » —
 *    Rondoudou pour le vol, Ryu pour le feu.
 *
 *    Ce champ `douteux` est renseigné à la main et volontairement court. Tenter
 *    de le déduire — « tout personnage absent des deux listes de l'énigme » —
 *    donne un résultat absurde : les listes d'intrus ne recensent que des cas
 *    nets, si bien que soixante poids moyens auraient été tolérés comme poids
 *    lourds, et Mario accepté comme antagoniste.
 */

/**
 * En dessous de ce nombre de réponses possibles, un critère devient une devinette
 * sur un personnage précis plutôt qu'une question de culture : on l'écarte.
 */
const MIN_REPONSES = 3

const parNom = new Map(characters.map((p) => [p.name, p]))

/**
 * Résout une liste de noms en personnages.
 *
 * Échoue bruyamment sur un nom inconnu : filtrer silencieusement ferait
 * disparaître une faute de frappe dans une liste écrite à la main, et le critère
 * partirait en production avec une réponse en moins sans que rien ne le signale.
 */
const nommer = (noms) =>
  noms.map((n) => {
    const p = parNom.get(n)
    if (!p) throw new Error(`ecrisCriteres : « ${n} » ne correspond à aucun combattant`)
    return p
  })

/** Numéro de combattant sans suffixe. */
const numeroBase = (p) => {
  const m = String(p.number ?? '').match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : NaN
}

/**
 * Construit un critère.
 * @param {Object} def - { id, instruction, attendus, toleres }
 * @returns {{ id, instruction, attendus, acceptes }} `acceptes` regroupe les
 *   réponses valides, `attendus` les seules à servir d'exemples.
 */
function critere({ id, instruction, attendus, toleres = [] }) {
  const vus = new Set(attendus.map((p) => p.id))
  return {
    id,
    instruction,
    attendus,
    acceptes: [...attendus, ...toleres.filter((p) => !vus.has(p.id))],
  }
}

/**
 * Critères repris de « Trouve l'intrus » : `membres` devient la liste des
 * réponses attendues, `douteux` celle des réponses tolérées.
 */
function criteresDepuisEnigmes() {
  // Taille de groupe 1 : aucun filtrage, on veut toutes les énigmes.
  return enigmesResolues(1).map((enigme) =>
    critere({
      id: `enigme-${enigme.id}`,
      instruction: `combattants qui ${enigme.critere}`,
      attendus: enigme.membres,
      toleres: enigme.douteux,
    })
  )
}

/**
 * Séries fusionnées avant d'être transformées en critères.
 *
 * Le regroupement vit ici et non dans `personnages.json` : la série d'origine
 * reste affichée telle quelle sur la fiche de chaque combattant, seul ce jeu
 * regarde les Miis et l'Entraîneuse comme un même univers Wii. Au passage, « Wii
 * Fit » n'avait qu'un combattant et ne produisait donc aucun critère.
 */
const UNIVERS_FUSIONNES = new Map([
  ['Combattants Mii', 'Wii'],
  ['Wii Fit', 'Wii'],
])

/** Un critère par univers suffisamment fourni. */
function criteresParUnivers() {
  const parSerie = new Map()
  for (const p of characters) {
    if (!p.series) continue
    const univers = UNIVERS_FUSIONNES.get(p.series) ?? p.series
    if (!parSerie.has(univers)) parSerie.set(univers, [])
    parSerie.get(univers).push(p)
  }
  return [...parSerie]
    .filter(([, membres]) => membres.length >= MIN_REPONSES)
    .map(([series, membres]) =>
      critere({
        id: `univers-${series}`,
        instruction: `combattants de l'univers ${series}`,
        attendus: membres,
      })
    )
}

/** Critères écrits à la main, absents de « Trouve l'intrus ». */
function criteresPropres() {
  return [
    critere({
      id: 'echos',
      instruction: 'combattants échos (la variante d\'un autre combattant)',
      // Marqués par ε dans leur numéro de combattant : c'est une donnée, pas un
      // jugement.
      attendus: characters.filter((p) => String(p.number ?? '').includes('ε')),
    }),
    critere({
      id: 'duos',
      instruction: 'combattants qui en réalité sont plusieurs',
      attendus: nommer([
        'Ice Climbers', 'Harmonie et Luma', 'Pyra / Mythra', 'Banjo et Kazooie',
        'Duo Duck Hunt',
      ]),
      // Le Dresseur de Pokémon combat par l'intermédiaire de trois Pokémon, mais
      // son portrait ne montre que lui : accepté sans être exigé.
      toleres: nommer(['Dresseur de Pokémon', 'Bowser Jr.', 'Olimar']),
    }),
    critere({
      id: 'enfants',
      instruction: 'combattants qui sont des enfants',
      attendus: nommer(['Ness', 'Lucas', 'Link enfant', 'Link cartoon']),
      toleres: nommer([
        'Pichu', 'Bowser Jr.', 'Villageois', 'Ice Climbers', 'Diddy Kong',
        'Marie', 'Kirby',
      ]),
    }),
    critere({
      id: 'numero-un-chiffre',
      instruction: 'combattants dont le numéro est inférieur à 10',
      attendus: characters.filter((p) => numeroBase(p) < 10),
    }),
    critere({
      id: 'parente',
      instruction: 'combattants qui ont un lien de parenté avec un autre combattant',
      attendus: nommer([
        'Mario', 'Luigi', // frères
        'Peach', 'Harmonie et Luma', 'Daisy', // sœurs et cousine
        'Chrom', 'Lucina', // père et fille
        'Marth', // ancêtre de Lucina
        'Bowser', 'Bowser Jr.', // père et fils
      ]),
      // Parentés variables ou discutées : Daraen peut être un parent de Lucina
      // selon la partie, les Ice Climbers passent pour frère et sœur, Diddy est
      // présenté tantôt comme le neveu tantôt comme l'ami de Donkey Kong.
      toleres: nommer(['Daraen', 'Ice Climbers', 'Diddy Kong', 'Donkey Kong']),
    }),
    critere({
      id: 'changement-en-combat',
      instruction: 'combattants qu\'on peut changer en cours de combat',
      attendus: nommer(['Dresseur de Pokémon', 'Pyra / Mythra']),
      // Zelda/Sheik et Samus/Samus sans armure permutaient dans les Smash
      // précédents, plus dans Ultimate où ce sont des combattants distincts.
      toleres: nommer(['Zelda', 'Sheik', 'Samus', 'Samus sans armure']),
    }),
    critere({
      id: 'plusieurs-versions',
      instruction: 'combattants dont une autre version figure aussi au roster',
      attendus: nommer([
        'Mario', 'Dr. Mario',
        'Samus', 'Samus sans armure',
        'Zelda', 'Sheik',
      ]),
      // Les trois Link sont le même héros à des âges et époques différents ; Samus
      // sombre, Pyra / Mythra et le Dresseur relèvent d'autres mécaniques.
      toleres: nommer([
        'Link', 'Link enfant', 'Link cartoon', 'Samus sombre', 'Pyra / Mythra',
        'Dresseur de Pokémon',
      ]),
    }),
    critere({
      id: 'personnage-alternatif',
      instruction: 'combattants dont les tenues changent le personnage incarné',
      attendus: nommer([
        'Héros', 'Dresseur de Pokémon', 'Entraîneuse Wii Fit', 'Byleth',
        'Daraen', 'Corrin', 'Ike', 'Inkling',
      ]),
      // Le Villageois et les Koopalings de Bowser Jr. changent aussi de personnage,
      // et les Miis sont entièrement configurables.
      toleres: nommer([
        'Villageois', 'Bowser Jr.', 'Boxeur Mii', 'Épéiste Mii', 'Tireur Mii',
      ]),
    }),
    critere({
      id: 'eau',
      instruction: 'combattants qui manipulent l\'eau',
      attendus: nommer(['Dresseur de Pokémon', 'Mario', 'Amphinobi', 'Sora', 'Corrin']),
      // L'encre de l'Inkling et l'arrosoir du Villageois ou de Marie s'en
      // approchent sans être de l'eau à proprement parler.
      toleres: nommer(['Inkling', 'Villageois', 'Marie']),
    }),
  ]
}

/**
 * Tous les critères disponibles.
 * @returns {Array<{ id: string, instruction: string, attendus: Array, acceptes: Array }>}
 */
export function tousLesCriteres() {
  return [...criteresDepuisEnigmes(), ...criteresParUnivers(), ...criteresPropres()].filter(
    (c) => c.acceptes.length >= MIN_REPONSES
  )
}

/** Nombre d'énigmes réutilisées, pour les tests et la documentation. */
export const NB_ENIGMES_REUTILISEES = ENIGMES.length
