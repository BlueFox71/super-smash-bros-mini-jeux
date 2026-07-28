import characters from './personnages.json'

/**
 * Énigmes de « Trouve l'intrus », écrites à la main.
 *
 * Pourquoi pas un système d'attributs par personnage : un intrus déduit
 * automatiquement de plusieurs attributs est presque toujours ambigu. Sur
 * Mario + Luigi + Peach + Bowser, Bowser n'est pas humain mais Peach est la
 * seule femme — deux réponses se défendent. D'où ces énigmes curées, où le
 * partage 7–1 est vérifié à la main, et où la `categorie` est annoncée au joueur
 * pour lever l'ambiguïté sans livrer la réponse.
 *
 * Chaque énigme fournit :
 *  - `categorie` : affichée pendant la manche (sur quoi porter son attention) ;
 *  - `critere`   : révélé après la réponse (« Les autres … ») ;
 *  - `membres`   : personnages qui vérifient le critère ;
 *  - `intrus`    : personnages qui ne le vérifient pas, on en tire 1.
 *
 * `membres` et `intrus` acceptent soit une liste de noms, soit un prédicat sur le
 * personnage. Le prédicat sert quand le critère est déjà inscrit dans les données
 * (les numéros de combattant, par exemple) : recopier la liste à la main serait
 * redondant et se désynchroniserait.
 *
 * Un troisième champ facultatif, `douteux`, recense les personnages dont
 * l'appartenance se discute : ni membres (on ne veut pas d'un intrus contestable)
 * ni intrus (ce serait injuste). « Trouve l'intrus » les ignore purement et
 * simplement ; le variant « Par critère » d'« Écris-les tous ! » s'en sert pour
 * accepter une réponse défendable sans l'exiger. Ces listes vivaient jusqu'ici en
 * commentaire, où rien ne les vérifiait.
 *
 * Les deux listes doivent rester disjointes, et `membres` compter au moins autant
 * d'entrées que le plateau demande — `enigmesResolues()` le vérifie au chargement.
 */

/** Numéro de combattant sans son suffixe (« 04ε » → 4, « 79-80 » → 79). */
const numeroBase = (p) => {
  const m = String(p.number ?? '').match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : NaN
}

/** Combattant « écho » (Samus sombre, Daisy, Lucina…), marqué par ε. */
const estEcho = (p) => String(p.number ?? '').includes('ε')
export const ENIGMES = [
  {
    id: 'epee',
    douteux: ['Joker', 'Kirby', 'Steve', 'Wolf', 'Mr. Game & Watch', 'Amphinobi', 'Zelda'],
    categorie: 'Arme',
    critere: 'manient une épée',
    membres: [
      'Link', 'Link enfant', 'Link cartoon', 'Marth', 'Lucina', 'Roy', 'Chrom',
      'Ike', 'Épéiste Mii', 'Shulk', 'Cloud', 'Corrin', 'Byleth', 'Sephiroth',
      'Sora', 'Meta Knight', 'Pyra / Mythra', 'Héros', 'Daraen',
    ],
    intrus: [
      'Donkey Kong', 'Pikachu', 'Wario', 'Little Mac', 'Pac-Man', 'Ryu', 'Ken',
      'Rondoudou', 'Boxeur Mii', 'Entraîneuse Wii Fit', 'Sonic', 'Captain Falcon',
      'Mario', 'Luigi', 'Yoshi', 'Diddy Kong', 'Olimar', 'Bowser', 'Peach',
      'Min Min', 'Terry', 'Kazuya', 'Marie', 'Villageois', 'R.O.B.', 'Mega Man',
      'Snake', 'Fox', 'Falco', 'Samus', 'King K. Rool', 'Bowser Jr.',
      'Duo Duck Hunt', 'Inkling', 'Plante Piranha', 'Pichu', 'Ness', 'Lucas',
      'Lucario', 'Félinferno', 'Ridley', 'Banjo et Kazooie', 'Simon', 'Richter',
      'Bayonetta',
    ],
  },
  {
    id: 'arme-a-feu',
    douteux: ['King K. Rool', 'R.O.B.', 'Duo Duck Hunt', 'Villageois', 'Marie', 'Olimar'],
    categorie: 'Arme',
    critere: 'se battent avec une arme à feu',
    membres: [
      'Samus', 'Samus sombre', 'Samus sans armure', 'Fox', 'Falco', 'Wolf',
      'Snake', 'Bayonetta', 'Tireur Mii', 'Joker', 'Mega Man', 'Inkling',
    ],
    intrus: [
      'Link', 'Marth', 'Kirby', 'Donkey Kong', 'Little Mac', 'Ryu', 'Ike',
      'Bowser', 'Yoshi', 'Pikachu', 'Sonic', 'Meta Knight', 'Cloud', 'Peach',
      'Wario', 'Captain Falcon', 'Simon', 'Richter', 'Terry', 'Kazuya',
      // Marie est passée en douteux : sa fronde est une arme à distance, ce qui
      // se discute face à « arme à feu » — comme pour le Villageois.
      'Min Min', 'Entraîneuse Wii Fit', 'Plante Piranha', 'Rondoudou',
      'Pichu', 'Roi Dadidou', 'Mr. Game & Watch', 'Lucina', 'Chrom', 'Ness',
      'Lucas', 'Shulk', 'Ganondorf', 'Diddy Kong', 'Félinferno',
    ],
  },
  {
    id: 'feu',
    douteux: ['Mr. Game & Watch', 'Ryu', 'Ken', 'Zelda', 'Ike', 'Captain Falcon', 'Snake', 'Steve', 'Dresseur de Pokémon'],
    categorie: 'Pouvoir',
    critere: 'ont une attaque de feu',
    membres: [
      'Mario', 'Luigi', 'Bowser', 'Roy', 'Félinferno',
      'Pyra / Mythra', 'Bowser Jr.', 'Ridley', 'Sephiroth',
    ],
    // Écartés faute de certitude : Mr. Game & Watch (torche), Ryu et Ken
    // (hadoken/shoryuken enflammés), Zelda (Feu de Din), Ike (Éruption),
    // Captain Falcon (Falcon Punch), Snake (explosifs), Steve (seau de lave).
    // Écarté aussi : le Dresseur de Pokémon, dont le portrait ne montre que le
    // dresseur humain — c'est Dracaufeu qui crache le feu, pas lui.
    intrus: [
      'Pikachu', 'Fox', 'Marth', 'Link', 'Kirby', 'Sonic', 'Little Mac',
      'Villageois', 'Marie', 'Olimar', 'R.O.B.', 'Ice Climbers', 'Rondoudou',
      'Min Min', 'Entraîneuse Wii Fit', 'Boxeur Mii', 'Sheik', 'Lucina',
      'Chrom', 'Cloud', 'Pichu', 'Amphinobi', 'Inkling', 'Donkey Kong',
      'Wario', 'Falco', 'Wolf', 'Diddy Kong', 'Mewtwo', 'Lucario',
    ],
  },
  {
    id: 'vol',
    douteux: ['Rondoudou', 'Kirby', 'Harmonie et Luma', 'Mewtwo', 'Bayonetta', 'Roi Dadidou', 'Villageois'],
    categorie: 'Physique',
    critere: 'peuvent voler',
    // Le Dresseur de Pokémon est écarté ici aussi : son portrait est celui d'un
    // garçon, pas de Dracaufeu. Duo Duck Hunt et Banjo et Kazooie restent, leurs
    // portraits montrent bien le canard et Kazooie ailes déployées.
    membres: [
      'Ridley', 'Meta Knight', 'Pit', 'Pit Maléfique', 'Palutena',
      'Banjo et Kazooie', 'Sephiroth', 'Duo Duck Hunt',
    ],
    intrus: [
      'Little Mac', 'Donkey Kong', 'Ryu', 'Ken', 'Kazuya', 'Terry', 'Ike',
      'Marth', 'Link', 'Bowser', 'Wario', 'Steve', 'Min Min', 'Inkling',
      'Entraîneuse Wii Fit', 'Boxeur Mii', 'Simon', 'Richter', 'Cloud', 'Snake',
      'Sonic', 'Captain Falcon', 'Marie', 'Amphinobi', 'Félinferno', 'Lucario',
      'Pichu', 'Pikachu', 'Lucina', 'Chrom', 'Roy', 'Shulk', 'Diddy Kong',
    ],
  },
  {
    id: 'queue',
    douteux: ['Falco', 'Amphinobi', 'Donkey Kong', 'Plante Piranha'],
    categorie: 'Physique',
    critere: 'ont une queue',
    membres: [
      'Bowser', 'Bowser Jr.', 'Pikachu', 'Pichu', 'Yoshi',
      'Fox', 'Wolf', 'Diddy Kong', 'Ridley', 'King K. Rool', 'Lucario',
      'Félinferno', 'Mewtwo', 'Sonic', 'Marie', 'Duo Duck Hunt',
    ],
    intrus: [
      'Mario', 'Link', 'Marth', 'Little Mac', 'Ryu', 'Ken', 'Samus', 'Peach',
      'Zelda', 'Snake', 'Cloud', 'Terry', 'Kazuya', 'Steve', 'Min Min',
      'Inkling', 'Entraîneuse Wii Fit', 'Boxeur Mii', 'Villageois', 'Kirby',
      'Rondoudou', 'Mr. Game & Watch', 'Ness', 'Lucas', 'Pit', 'Palutena',
      'Simon', 'Richter', 'Bayonetta', 'Joker', 'Luigi', 'Daisy', 'Ike',
      'Lucina', 'Chrom', 'Shulk', 'Sora',
    ],
  },
  {
    id: 'poids-lourds',
    categorie: 'Corpulence',
    critere: 'comptent parmi les poids lourds du jeu',
    membres: [
      'Bowser', 'King K. Rool', 'Donkey Kong', 'Roi Dadidou', 'Ganondorf',
      'Ridley', 'Félinferno', 'Kazuya',
    ],
    intrus: [
      'Pichu', 'Rondoudou', 'Mr. Game & Watch', 'Kirby', 'Pikachu', 'Olimar',
      'Sheik', 'Meta Knight', 'Fox', 'Zelda', 'Marie', 'Ness', 'Lucas',
      'Amphinobi', 'Villageois',
    ],
  },
  {
    id: 'mechants',
    douteux: ['Wario', 'Meta Knight', 'Roi Dadidou', 'Mewtwo', 'Kazuya'],
    categorie: 'Rôle',
    critere: 'sont des antagonistes dans leur série',
    membres: [
      'Bowser', 'Ganondorf', 'King K. Rool', 'Ridley', 'Wolf', 'Sephiroth',
      'Bowser Jr.', 'Pit Maléfique', 'Samus sombre',
    ],
    intrus: [
      'Mario', 'Link', 'Samus', 'Kirby', 'Pikachu', 'Fox', 'Marth', 'Ike',
      'Little Mac', 'Sonic', 'Mega Man', 'Pit', 'Cloud', 'Shulk', 'Simon',
      'Banjo et Kazooie', 'Sora', 'Marie', 'Villageois', 'Peach', 'Zelda',
      'Luigi', 'Yoshi', 'Donkey Kong', 'Lucina', 'Chrom', 'Ness', 'Lucas',
    ],
  },
  // L'énigme « appartiennent à une famille royale » a été retirée, remplacée par
  // le critère « lien de parenté » de src/data/ecrisCriteres.js. Elle disparaît
  // donc aussi de « Trouve l'intrus », qui la partageait.
  {
    id: 'corps-a-corps',
    // L'Entraîneuse Wii Fit est bien un intrus ici : Salutation au soleil est un
    // projectile, ça ne se discute pas.
    douteux: ['Wario', 'Min Min', 'Bowser'],
    categorie: 'Style de combat',
    critere: "n'ont aucun projectile",
    membres: [
      'Little Mac', 'Boxeur Mii', 'Ganondorf', 'Kazuya', 'Chrom', 'Ike',
      'Marth', 'Lucina', 'Roy', 'Meta Knight', 'Donkey Kong', 'Captain Falcon',
      'Sonic',
    ],
    intrus: [
      'Mario', 'Link', 'Samus', 'Fox', 'Pikachu', 'Ness', 'Snake', 'Mega Man',
      'Simon', 'Bayonetta', 'Ryu', 'Terry', 'Entraîneuse Wii Fit', 'Inkling',
      'Villageois', 'Marie', 'Olimar', 'Duo Duck Hunt', 'R.O.B.', 'Peach',
      'Luigi', 'Samus sombre', 'Wolf', 'Falco', 'Joker', 'Pac-Man', 'Sephiroth',
      'Cloud', 'Sora', 'Héros', 'Byleth', 'Daraen', 'Tireur Mii',
    ],
  },
  {
    id: 'humains',
    douteux: ['Link', 'Zelda', 'Sheik', 'Bayonetta', 'Shulk', 'Kazuya', 'Samus', 'Pit', 'Palutena', 'Corrin', 'Sephiroth', 'Ice Climbers', 'Harmonie et Luma'],
    categorie: 'Espèce',
    critere: 'sont des êtres humains',
    membres: [
      'Mario', 'Luigi', 'Peach', 'Daisy', 'Marth', 'Lucina', 'Roy', 'Chrom',
      'Ike', 'Little Mac', 'Ryu', 'Ken', 'Cloud', 'Snake', 'Captain Falcon',
      'Terry', 'Ness', 'Lucas', 'Villageois', 'Entraîneuse Wii Fit',
      'Samus sans armure', 'Joker', 'Simon', 'Richter', 'Sora', 'Byleth',
      'Daraen', 'Steve', 'Héros', 'Wario',
    ],
    // C'est l'énigme la plus contestable, donc la plus sévèrement filtrée : sont
    // écartés des deux listes tous ceux dont l'espèce se discute — Link, Zelda et
    // Sheik (Hyliens), Bayonetta (sorcière Umbra), Shulk (Homs), Kazuya (gène du
    // démon), Samus (humaine, mais sous armure), Pit et Palutena
    // (angélique/divin), Corrin (mi-dragon), Sephiroth (mi-extraterrestre),
    // Ice Climbers et Harmonie et Luma, ainsi que le Dresseur de Pokémon.
    intrus: [
      'Donkey Kong', 'Bowser', 'Kirby', 'Pikachu', 'Yoshi', 'Fox', 'Falco',
      'Wolf', 'Rondoudou', 'Pichu', 'Mewtwo', 'Lucario', 'Amphinobi',
      'Félinferno', 'Ridley', 'King K. Rool', 'Roi Dadidou', 'Meta Knight',
      'R.O.B.', 'Mr. Game & Watch', 'Plante Piranha', 'Sonic', 'Diddy Kong',
      'Bowser Jr.', 'Duo Duck Hunt', 'Marie', 'Olimar', 'Pac-Man', 'Inkling',
      'Banjo et Kazooie', 'Mega Man',
    ],
  },
  {
    id: 'explosifs',
    douteux: ['Wario', 'Steve', 'Duo Duck Hunt', 'R.O.B.', 'Simon', 'Richter'],
    categorie: 'Arme',
    critere: 'ont une attaque explosive',
    membres: [
      'Snake', 'Link', 'Link enfant', 'Link cartoon', 'Samus', 'Samus sombre',
      'Bowser Jr.', 'Mega Man', 'Zelda',
    ],
    // Écartés faute de certitude : Wario (Gaz de Wario), Steve (TNT),
    // Duo Duck Hunt (la boîte de conserve), R.O.B., Simon et Richter.
    intrus: [
      'Marth', 'Lucina', 'Ike', 'Chrom', 'Roy', 'Little Mac', 'Ryu', 'Ken',
      'Kazuya', 'Terry', 'Captain Falcon', 'Sonic', 'Donkey Kong', 'Kirby',
      'Rondoudou', 'Pikachu', 'Pichu', 'Meta Knight', 'Marie', 'Villageois',
      'Entraîneuse Wii Fit', 'Boxeur Mii', 'Épéiste Mii', 'Shulk', 'Cloud',
      'Corrin', 'Byleth', 'Sora', 'Palutena', 'Pit', 'Sheik', 'Peach',
      'Daisy', 'Yoshi', 'Mewtwo', 'Lucario', 'Félinferno', 'Amphinobi',
      'Inkling', 'Min Min', 'Ganondorf', 'Fox', 'Falco', 'Wolf', 'Bayonetta',
      'Joker',
    ],
  },
  {
    id: 'tete-couverte',
    // Villageois est tranché côté intrus : tête nue dans sa tenue par défaut.
    douteux: ['Snake', 'Bowser Jr.', 'Inkling', 'Héros', 'R.O.B.', 'Boxeur Mii', 'Épéiste Mii', 'Tireur Mii', 'Ice Climbers', 'Harmonie et Luma'],
    categorie: 'Physique',
    critere: 'ont la tête couverte (casquette, casque, couronne, masque)',
    // Critère qui se juge sur le portrait, contrairement aux critères de
    // connaissance : bienvenu pour varier la façon de chercher.
    membres: [
      'Mario', 'Luigi', 'Wario', 'Ness', 'Diddy Kong', 'Olimar',
      'Captain Falcon', 'Samus', 'Samus sombre', 'King K. Rool', 'Roi Dadidou',
      'Peach', 'Zelda', 'Daisy', 'Terry', 'Meta Knight', 'Sheik',
    ],
    // Écartés faute de certitude : Snake et Bowser Jr. (bandana), Villageois,
    // Inkling, Héros, R.O.B., les Combattants Mii (couvre-chefs variables),
    // Ice Climbers (capuches) et Harmonie et Luma (couronne).
    intrus: [
      'Link', 'Marth', 'Lucina', 'Ike', 'Chrom', 'Roy', 'Cloud', 'Ryu', 'Ken',
      'Little Mac', 'Sonic', 'Kirby', 'Pikachu', 'Rondoudou', 'Yoshi',
      'Donkey Kong', 'Bowser', 'Shulk', 'Corrin', 'Byleth', 'Joker',
      'Sephiroth', 'Mewtwo', 'Lucario', 'Félinferno', 'Amphinobi', 'Kazuya',
      'Min Min', 'Entraîneuse Wii Fit', 'Ridley', 'Plante Piranha', 'Pac-Man',
      'Pit', 'Pit Maléfique', 'Palutena', 'Bayonetta', 'Sora', 'Ganondorf',
      'Fox', 'Falco', 'Wolf', 'Lucas', 'Marie', 'Mr. Game & Watch', 'Steve',
      'Pichu',
    ],
  },
  {
    id: 'poids-plumes',
    categorie: 'Corpulence',
    critere: 'comptent parmi les poids plumes du jeu',
    membres: [
      'Pichu', 'Rondoudou', 'Mr. Game & Watch', 'Kirby', 'Pikachu', 'Olimar',
      'Sheik', 'Meta Knight', 'Fox', 'Zelda', 'Marie',
    ],
    intrus: [
      'Bowser', 'King K. Rool', 'Donkey Kong', 'Roi Dadidou', 'Ganondorf',
      'Ridley', 'Félinferno', 'Kazuya', 'Snake', 'Wario',
    ],
  },
  {
    id: 'tierce-partie',
    categorie: 'Provenance',
    critere: 'ne viennent pas d\'une série Nintendo',
    membres: [
      'Sonic', 'Snake', 'Mega Man', 'Pac-Man', 'Ryu', 'Ken', 'Cloud',
      'Bayonetta', 'Simon', 'Richter', 'Joker', 'Héros', 'Banjo et Kazooie',
      'Terry', 'Steve', 'Sephiroth', 'Kazuya', 'Sora',
    ],
    intrus: [
      'Mario', 'Link', 'Samus', 'Kirby', 'Pikachu', 'Fox', 'Marth',
      'Little Mac', 'Villageois', 'Marie', 'Olimar', 'Captain Falcon', 'Ness',
      'Lucas', 'Yoshi', 'Bowser', 'Peach', 'Zelda', 'Donkey Kong', 'Pit',
      'Palutena', 'Shulk', 'Inkling', 'Min Min', 'Byleth', 'Pyra / Mythra',
      'Wario', 'R.O.B.', 'Ice Climbers', 'Mr. Game & Watch', 'Duo Duck Hunt',
      'Entraîneuse Wii Fit', 'Luigi', 'Daisy', 'Lucina', 'Roy', 'Chrom', 'Ike',
      'Corrin', 'Meta Knight', 'Roi Dadidou', 'Ridley', 'King K. Rool',
      'Diddy Kong', 'Mewtwo', 'Lucario', 'Amphinobi', 'Félinferno', 'Rondoudou',
      'Pichu', 'Ganondorf', 'Sheik', 'Falco', 'Wolf', 'Bowser Jr.',
      'Plante Piranha', 'Harmonie et Luma',
    ],
  },
  {
    id: 'roster-origine',
    categorie: 'Historique',
    critere: 'étaient déjà jouables dans le premier Super Smash Bros.',
    // Dérivé des numéros de combattant : 01 à 12 sont exactement les douze
    // personnages de 1999. Les échos (Samus sombre en 04ε) sont bien plus récents
    // malgré leur petit numéro, d'où l'exclusion.
    membres: (p) => numeroBase(p) <= 12 && !estEcho(p),
    intrus: (p) => numeroBase(p) > 12 || estEcho(p),
  },
  {
    id: 'dlc-ultimate',
    categorie: 'Historique',
    critere: 'sont arrivés en contenu téléchargeable dans Ultimate',
    // Les combattants numérotés 70 et au-delà, de Plante Piranha à Sora.
    membres: (p) => numeroBase(p) >= 70,
    intrus: (p) => numeroBase(p) < 70,
  },
  {
    id: 'electricite',
    // Joker reste un intrus : Arsène lance des sorts de malédiction, pas de foudre.
    douteux: ['R.O.B.', 'Zelda', 'Min Min'],
    // Sora est passé en membre : sa magie cycle sur Brasier, Glacier et Foudre.
    categorie: 'Pouvoir',
    critere: 'manipulent l\'électricité',
    // Cinq membres seulement : cette énigme ne sort pas sur un plateau de 8.
    membres: ['Pikachu', 'Pichu', 'Ness', 'Lucas', 'Daraen', 'Sora'],
    intrus: [
      'Mario', 'Link', 'Bowser', 'Kirby', 'Marth', 'Little Mac', 'Donkey Kong',
      'Peach', 'Yoshi', 'Cloud', 'Terry', 'Inkling', 'Simon', 'Ryu', 'Ken',
      'Snake', 'Sonic', 'Meta Knight', 'Ridley', 'King K. Rool', 'Félinferno',
      'Samus', 'Fox', 'Ike', 'Lucina', 'Chrom', 'Roy', 'Shulk', 'Corrin',
      'Byleth', 'Bayonetta', 'Joker', 'Palutena', 'Pit', 'Wario',
    ],
  },
  {
    id: 'psychique',
    douteux: ['Palutena', 'Rondoudou', 'Joker', 'Harmonie et Luma'],
    categorie: 'Pouvoir',
    critere: 'usent de pouvoirs psychiques',
    // Trois membres : réservée au plateau de 4.
    membres: ['Ness', 'Lucas', 'Mewtwo'],
    intrus: [
      'Mario', 'Link', 'Bowser', 'Kirby', 'Marth', 'Little Mac', 'Donkey Kong',
      'Ryu', 'Ken', 'Snake', 'Sonic', 'Meta Knight', 'Ridley', 'King K. Rool',
      'Samus', 'Fox', 'Ike', 'Cloud', 'Terry', 'Kazuya', 'Inkling', 'Simon',
      'Wario', 'Yoshi', 'Peach', 'Villageois', 'Marie', 'Steve', 'Min Min',
    ],
  },
]

/** name -> personnage, pour résoudre les énigmes écrites en clair. */
const parNom = new Map(characters.map((p) => [p.name, p]))

/**
 * Vérifie la cohérence des énigmes et les résout en personnages.
 *
 * Échoue bruyamment sur une incohérence — nom inconnu, personnage des deux côtés,
 * liste d'intrus vide : ces cas produiraient une énigme sans réponse ou à réponse
 * fausse, ce qui est pire qu'une erreur au chargement.
 *
 * Une énigme simplement trop peu fournie pour le plateau demandé n'est pas une
 * incohérence : elle est écartée en silence. C'est ce qui permet de garder des
 * critères à 3 ou 5 membres, jouables sur un petit plateau seulement.
 *
 * @param {number} tailleGroupe - nombre de personnages à tirer dans `membres`
 * @returns {Array<{ id: string, categorie: string, critere: string, membres: Array, intrus: Array }>}
 */
export function enigmesResolues(tailleGroupe) {
  const problemes = []
  const resolues = []

  for (const enigme of ENIGMES) {
    const resoudre = (source, champ) => {
      if (typeof source === 'function') return characters.filter(source)
      return source
        .map((nom) => {
          const p = parNom.get(nom)
          if (!p) problemes.push(`${enigme.id}.${champ} : « ${nom} » ne correspond à aucun personnage`)
          return p
        })
        .filter(Boolean)
    }

    const membres = resoudre(enigme.membres, 'membres')
    const intrus = resoudre(enigme.intrus, 'intrus')
    const douteux = enigme.douteux ? resoudre(enigme.douteux, 'douteux') : []

    const idsMembres = new Set(membres.map((m) => m.id))
    const idsIntrus = new Set(intrus.map((i) => i.id))
    const communs = intrus.filter((i) => idsMembres.has(i.id))
    if (communs.length > 0) {
      problemes.push(`${enigme.id} : ${communs.map((c) => c.name).join(', ')} à la fois membre et intrus`)
    }
    // Un douteux tranché d'un côté ou de l'autre n'est plus douteux : c'est une
    // contradiction dans les données.
    const trancheS = douteux.filter((d) => idsMembres.has(d.id) || idsIntrus.has(d.id))
    if (trancheS.length > 0) {
      problemes.push(
        `${enigme.id} : ${trancheS.map((c) => c.name).join(', ')} à la fois douteux et tranché`
      )
    }
    if (intrus.length === 0) {
      problemes.push(`${enigme.id} : aucun intrus`)
      continue
    }
    // Trop petite pour ce plateau : écartée, sans que ce soit une erreur.
    if (membres.length < tailleGroupe) continue
    resolues.push({ ...enigme, membres, intrus, douteux })
  }

  if (problemes.length > 0) {
    throw new Error(`Énigmes de « Trouve l'intrus » incohérentes :\n- ${problemes.join('\n- ')}`)
  }
  return resolues
}
