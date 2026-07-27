import { Typography } from 'antd'
import './GrillePersonnages.css'

const { Text } = Typography
const COLS = 13

const characterImageModules = import.meta.glob('../data/characters/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

const variantImageModules = import.meta.glob('../data/characters/couleurs/*.webp', {
  query: '?url',
  import: 'default',
  eager: true,
})

const getImageUrlCharacters = (filename) => {
  if (!filename) return null
  const key = Object.keys(characterImageModules).find((k) => k.endsWith('/' + filename))
  return key ? characterImageModules[key] : null
}

const variantUrlsByBase = (() => {
  const map = {}
  Object.keys(variantImageModules).forEach((key) => {
    const filename = (key.replace(/\\/g, '/').split('/').pop() || '')
    const match = filename.match(/^(.+)_(\d+)\.webp$/i)
    if (match) {
      const base = match[1].toLowerCase()
      if (!map[base]) map[base] = []
      map[base].push(variantImageModules[key])
    }
  })
  return map
})()

const getVariantUrls = (filename) => {
  if (!filename) return []
  const base = filename.replace(/\.webp$/i, '').toLowerCase()
  return variantUrlsByBase[base] || []
}

/**
 * Grille des personnages (ordre numéro).
 * @param {Object} props
 * @param {Array} props.characters - Liste des personnages (triés par numéro)
 * @param {boolean} [props.jeu] - Mode jeu : cellules vides pour les non trouvés
 * @param {Set} [props.foundIds] - Set des id trouvés (requis si jeu=true)
 * @param {Set} [props.silhouetteIds] - Set des id dont la silhouette est révélée (affichée en filtre)
 * @param {number|null} [props.blinkGreenId] - id de la case à faire clignoter en vert (trouvé)
 * @param {number|null} [props.blinkOrangeId] - id de la case à faire clignoter en orange (déjà trouvé)
 * @param {number|null} [props.blinkRedSilhouetteId] - id de la case silhouette à faire clignoter en rouge
 * @param {number|null} [props.nextExpectedId] - id de la prochaine case à saisir (mode "dans l'ordre", contour rouge)
 * @param {boolean} [props.showDetailPopover] - cellules cliquables pour afficher le détail
 * @param {function} [props.onCharacterClick] - appelé au clic avec { character, src, variantUrls }
 */
export default function GrillePersonnages({ characters = [], jeu = false, foundIds = new Set(), silhouetteIds = new Set(), blinkGreenId = null, blinkOrangeId = null, blinkRedSilhouetteId = null, nextExpectedId = null, showDetailPopover = false, onCharacterClick }) {
  const renderCellContent = (p) => {
    const found = !jeu || foundIds.has(p.id)
    const silhouette = !found && jeu && silhouetteIds.has(p.id)
    const src = p.filename ? getImageUrlCharacters(p.filename) : null
    const zoom = p.zoom != null ? p.zoom : 100
    const position = p.position || { top: 0, left: 0 }
    const blinkGreen = found && p.id === blinkGreenId
    const blinkOrange = found && p.id === blinkOrangeId
    const blinkRed = silhouette && p.id === blinkRedSilhouetteId
    const isNextExpected = jeu && nextExpectedId != null && p.id === nextExpectedId && !found
    const blinkClass = blinkGreen ? 'grille-personnages-cell-blink-green' : blinkOrange ? 'grille-personnages-cell-blink-orange' : blinkRed ? 'grille-personnages-cell-blink-red' : ''
    const cell = (
      <div
        className={`grille-personnages-cell ${!found && !silhouette ? 'grille-personnages-cell-vide' : ''} ${silhouette ? 'grille-personnages-cell-silhouette' : ''} ${blinkClass} ${isNextExpected ? 'grille-personnages-cell-next' : ''} ${showDetailPopover && found && src ? 'grille-personnages-cell-clickable' : ''}`}
      >
        {found ? (
          src ? (
            <div
              className="grille-personnages-img"
              role="img"
              aria-label={p.name}
              title={showDetailPopover ? undefined : p.name}
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: `${zoom}%`,
                backgroundPosition: `${position.left}% ${position.top}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          ) : (
            <span className="grille-personnages-nom">{p.name}</span>
          )
        ) : silhouette && src ? (
          <div
            className="grille-personnages-img"
            role="img"
            aria-label="Silhouette"
            title="Silhouette d'un personnage"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: `${zoom}%`,
              backgroundPosition: `${position.left}% ${position.top}%`,
              backgroundRepeat: 'no-repeat',
              filter: 'contrast(2000%) brightness(0)',
            }}
          />
        ) : (
          <span className="grille-personnages-placeholder" />
        )}
      </div>
    )
    if (showDetailPopover && onCharacterClick && !jeu && found && (src || p.name)) {
      const variantUrls = getVariantUrls(p.filename)
      return (
        <div
          className="grille-personnages-cell-wrapper-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onCharacterClick({ character: p, src, variantUrls })}
          onKeyDown={(e) => e.key === 'Enter' && onCharacterClick({ character: p, src, variantUrls })}
        >
          {cell}
        </div>
      )
    }
    return cell
  }

  return (
    <div
      className="grille-personnages"
      style={{ '--cols': COLS }}
    >
      {characters.map((p) => (
        <span key={p.id}>{renderCellContent(p)}</span>
      ))}
    </div>
  )
}
