import { useMemo, useState, useCallback } from 'react'
import { Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { getCharactersByIdOrder } from '../data'
import { urlOriginal, urlsVariantes } from '../data/images'
import CharactersGrid from '../components/GrillePersonnages'
import PageLoader from '../components/PageLoader'
import './CombattantsPage.css'

const { Text, Title } = Typography

export default function CombattantsPage() {
  const characters = useMemo(getCharactersByIdOrder, [])
  const [selected, setSelected] = useState(null)

  const detail = useMemo(() => {
    if (!selected) return null
    return {
      character: selected,
      src: urlOriginal(selected.filename),
      variantUrls: urlsVariantes(selected.filename),
    }
  }, [selected])

  const fermer = useCallback(() => setSelected(null), [])

  if (!characters.length) {
    return <PageLoader message="Chargement des combattants..." />
  }

  return (
    <div className="combattants-page">
      <div className={`combattants-grille-section ${detail ? 'combattants-grille-section--with-detail' : ''}`}>
        {detail && (
          <div className="combattants-detail-panel">
            <button
              type="button"
              className="combattants-detail-close"
              onClick={fermer}
              aria-label="Fermer"
            >
              <CloseOutlined />
            </button>
            <div className="grille-personnage-popover grille-personnage-detail-panel-content">
              <div className="grille-personnage-popover-header">
                <Text strong className="grille-personnage-popover-nom">{detail.character.name}</Text>
                {detail.character.number != null && <Text type="secondary">N°{detail.character.number}</Text>}
              </div>
              {detail.character.series != null && (
                <Text type="secondary" className="grille-personnage-popover-serie">{detail.character.series}</Text>
              )}
              {detail.src && (
                <div className="grille-personnage-popover-original">
                  <div
                    className="grille-personnage-popover-img-original"
                    style={{ backgroundImage: `url("${detail.src}")` }}
                  />
                </div>
              )}
              <div className="grille-personnage-popover-couleurs">
                <Text type="secondary" className="grille-personnage-popover-couleurs-label">Couleurs / variantes</Text>
                {detail.variantUrls.length > 0 ? (
                  <div className="grille-personnage-popover-couleurs-grid">
                    {detail.variantUrls.map((url) => (
                      <div key={url} className="grille-personnage-popover-couleurs-item" style={{ backgroundImage: `url("${url}")` }} />
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" className="grille-personnage-popover-couleurs-empty">Aucune image dans le dossier couleurs.</Text>
                )}
              </div>
            </div>
          </div>
        )}
        {/* L'en-tête vit dans le même conteneur que la grille pour rester aligné
            avec elle quand le panneau de détail réduit la zone disponible. */}
        <div className="combattants-grille-wrapper">
          <div className="combattants-entete">
            <Title level={2}>Combattants</Title>
            <Text className="combattants-compteur">{characters.length}</Text>
          </div>
          <CharactersGrid characters={characters} onCharacterClick={setSelected} />
          {!detail && (
            <Text type="secondary" className="combattants-astuce">
              Clique sur un combattant pour voir sa fiche et ses couleurs.
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}
