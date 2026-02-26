import { useState } from 'react'
import { Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { getCharactersByIdOrder } from '../data'
import CharactersGrid from '../components/GrillePersonnages'
import PageLoader from '../components/PageLoader'
import './CombattantsPage.css'

const { Text } = Typography

export default function CombattantsPage() {
  const characters = getCharactersByIdOrder()
  const [selectedDetail, setSelectedDetail] = useState(null)

  if (!characters?.length) {
    return <PageLoader message="Chargement des combattants..." />
  }

  return (
    <div className="combattants-page">
      <div className={`combattants-grille-section ${selectedDetail ? 'combattants-grille-section--with-detail' : ''}`}>
        {selectedDetail && (
          <div className="combattants-detail-panel">
            <button
              type="button"
              className="combattants-detail-close"
              onClick={() => setSelectedDetail(null)}
              aria-label="Fermer"
            >
              <CloseOutlined />
            </button>
            <div className="grille-personnage-popover grille-personnage-detail-panel-content">
              <div className="grille-personnage-popover-header">
                <Text strong className="grille-personnage-popover-nom">{selectedDetail.character.name}</Text>
                {selectedDetail.character.number != null && <Text type="secondary">N°{selectedDetail.character.number}</Text>}
              </div>
              {selectedDetail.character.series != null && (
                <Text type="secondary" className="grille-personnage-popover-serie">{selectedDetail.character.series}</Text>
              )}
              {selectedDetail.src && (
                <div className="grille-personnage-popover-original">
                  <div
                    className="grille-personnage-popover-img-original"
                    style={{
                      backgroundImage: `url(${selectedDetail.src})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                </div>
              )}
              <div className="grille-personnage-popover-couleurs">
                <Text type="secondary" className="grille-personnage-popover-couleurs-label">Couleurs / variantes</Text>
                {selectedDetail.variantUrls.length > 0 ? (
                  <div className="grille-personnage-popover-couleurs-grid">
                    {selectedDetail.variantUrls.map((url, i) => (
                      <div key={i} className="grille-personnage-popover-couleurs-item" style={{ backgroundImage: `url("${url}")` }} />
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" className="grille-personnage-popover-couleurs-empty">Aucune image dans le dossier couleurs.</Text>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="combattants-grille-wrapper">
          <CharactersGrid
            characters={characters}
            showDetailPopover
            onCharacterClick={setSelectedDetail}
          />
        </div>
      </div>
    </div>
  )
}
