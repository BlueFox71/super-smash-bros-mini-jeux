export const MODIFIERS = [
  // =========================
  // Filtres simples (style inline)
  // =========================
  { key: 'blur', name: 'flou', style: { filter: 'blur(15px)' } },

  {
    key: 'blur-zoom',
    name: 'flou + zoom',
    style: {
      filter: 'blur(12px)',
      backgroundSize: '220%',
      backgroundPosition: '60% 40%',
    },
  },

  {
    key: 'silhouette',
    name: 'silhouette',
    style: { filter: 'contrast(2000%) brightness(0)' },
  },

  { key: 'invert', name: 'négatif', style: { filter: 'invert(100%) blur(2px)' } },

  // =========================
  // Zooms statiques
  // =========================
  {
    key: 'zoom-tl',
    name: 'zoom (haut-gauche)',
    style: {
      backgroundSize: '290%',
      backgroundPosition: '20% 20%',
      clipPath: 'polygon(12.5% 12.5%, 87.5% 12.5%, 12.5% 87.5%)',
    },
  },

  {
    key: 'zoom-br',
    name: 'zoom (bas-droite)',
    style: {
      backgroundSize: '280%',
      backgroundPosition: '80% 80%',
      clipPath: 'polygon(12.5% 12.5%, 87.5% 12.5%, 87.5% 87.5%)',
    },
  },

  {
    key: 'zoom-center',
    name: 'zoom (centre)',
    style: {
      backgroundSize: '250%',
      backgroundPosition: '50% 50%',
      clipPath: 'polygon(12.5% 12.5%, 87.5% 12.5%, 12.5% 87.5%, 87.5% 87.5%)',
    },
  },

  // =========================
  // Masques statiques
  // =========================
  {
    key: 'circle-blur',
    name: 'cercle flou',
    style: {
      clipPath: 'circle(70px at 50% 50%)',
      filter: 'blur(8px)',
    },
  },

  {
    key: 'spotlight',
    name: 'spotlight',
    className: 'modifier-spotlight',
    gradientOverlay: 'radial-gradient(circle 90px at var(--spot-x) var(--spot-y), transparent 0%, rgba(0,0,0,1) 22%)',
    style: { '--spot-x': '20%', '--spot-y': '30%' },
  },

  {
    key: 'guesspixel',
    name: 'guesspixel (gros pixels)',
    className: 'modifier-guesspixel',
    pixelLevels: [12, 20, 32, 48],
    style: {
      backgroundSize: '32px 32px',
      backgroundPosition: 'center',
      imageRendering: 'pixelated',
    },
  },

  { key: 'random-zoom',   name: 'zoom erratique', className: 'modifier-random-zoom' },
]

/**
 * Tire un modificateur aléatoire.
 * @param {Array} [modifiersList] - Liste de modificateurs parmi lesquels tirer (défaut : MODIFIERS)
 * @returns {Object} un modificateur
 */
export function pickRandomModifier(modifiersList = MODIFIERS) {
  if (!modifiersList || modifiersList.length === 0) return MODIFIERS[0]
  return modifiersList[Math.floor(Math.random() * modifiersList.length)]
}