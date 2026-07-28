import { memo, useCallback } from 'react'
import { urlMiniature } from '../data/images'
import './GrillePersonnages.css'

const COLS = 13

/** Silhouette : on écrase les couleurs pour ne garder que la forme. */
const FILTRE_SILHOUETTE = 'contrast(2000%) brightness(0)'

/**
 * Une case de la grille.
 *
 * Mémoïsée sur des props primitives : pendant « Écris-les tous ! », le parent se
 * réaffiche à chaque frappe et à chaque seconde du chrono. Sans ce `memo`, les
 * 86 cases reconstruisaient leur objet de style et repassaient par le diff à
 * chacun de ces rendus.
 */
const Case = memo(function Case({
  character,
  found,
  silhouette,
  blink,
  next,
  clickable,
  onSelect,
}) {
  const src = urlMiniature(character.filename)
  const zoom = character.zoom ?? 100
  const { top = 0, left = 0 } = character.position || {}
  const visible = found || silhouette

  const handleClick = useCallback(() => {
    if (clickable) onSelect(character)
  }, [clickable, onSelect, character])

  const classes = ['grille-personnages-cell']
  if (!visible) classes.push('grille-personnages-cell-vide')
  if (silhouette) classes.push('grille-personnages-cell-silhouette')
  if (blink) classes.push(`grille-personnages-cell-blink-${blink}`)
  if (next) classes.push('grille-personnages-cell-next')
  if (clickable) classes.push('grille-personnages-cell-clickable')

  let contenu
  if (visible && src) {
    contenu = (
      <div
        className="grille-personnages-img"
        role="img"
        aria-label={found ? character.name : 'Silhouette'}
        title={clickable ? undefined : found ? character.name : "Silhouette d'un personnage"}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${zoom}%`,
          backgroundPosition: `${left}% ${top}%`,
          ...(silhouette ? { filter: FILTRE_SILHOUETTE } : null),
        }}
      />
    )
  } else if (found) {
    contenu = <span className="grille-personnages-nom">{character.name}</span>
  } else {
    contenu = <span className="grille-personnages-placeholder" />
  }

  if (clickable) {
    return (
      <button type="button" className={classes.join(' ')} onClick={handleClick} aria-label={character.name}>
        {contenu}
      </button>
    )
  }
  return <div className={classes.join(' ')}>{contenu}</div>
})

/**
 * Grille des personnages.
 * @param {Object} props
 * @param {Array} props.characters - Liste des personnages, dans l'ordre d'affichage
 * @param {boolean} [props.jeu] - Mode jeu : cases vides pour les non trouvés
 * @param {Set} [props.foundIds] - Set des id trouvés (requis si jeu=true)
 * @param {Set} [props.silhouetteIds] - Set des id dont la silhouette est révélée
 * @param {number|null} [props.blinkGreenId] - id de la case à faire clignoter en vert (trouvé)
 * @param {number|null} [props.blinkOrangeId] - id de la case à faire clignoter en orange (déjà trouvé)
 * @param {number|null} [props.blinkRedSilhouetteId] - id de la case silhouette à faire clignoter en rouge
 * @param {number|null} [props.nextExpectedId] - id de la prochaine case à saisir (mode « Dans l'ordre »)
 * @param {function} [props.onCharacterClick] - appelé au clic avec le personnage ; rend les cases cliquables
 */
export default function GrillePersonnages({
  characters = [],
  jeu = false,
  foundIds,
  silhouetteIds,
  blinkGreenId = null,
  blinkOrangeId = null,
  blinkRedSilhouetteId = null,
  nextExpectedId = null,
  onCharacterClick,
}) {
  return (
    <div className="grille-personnages" style={{ '--cols': COLS }}>
      {characters.map((p) => {
        const found = !jeu || !!foundIds?.has(p.id)
        const silhouette = !found && jeu && !!silhouetteIds?.has(p.id)
        const blink =
          found && p.id === blinkGreenId
            ? 'green'
            : found && p.id === blinkOrangeId
              ? 'orange'
              : silhouette && p.id === blinkRedSilhouetteId
                ? 'red'
                : null
        return (
          <Case
            key={p.id}
            character={p}
            found={found}
            silhouette={silhouette}
            blink={blink}
            next={jeu && nextExpectedId != null && p.id === nextExpectedId && !found}
            clickable={!jeu && found && !!onCharacterClick}
            onSelect={onCharacterClick}
          />
        )
      })}
    </div>
  )
}
