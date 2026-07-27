import { useState } from 'react'
import { Typography, Radio, Button, Modal, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getJoueurs, addJoueur, setJoueurActuel, PSEUDO_MAX_LENGTH } from '../utils/joueursStorage'
import './ChoixPseudo.css'

const { Text } = Typography

/**
 * Sélection du pseudo, commune à tous les mini-jeux : liste partagée + bouton "+"
 * pour saisir un nouveau pseudo. Le pseudo choisi est enregistré globalement.
 * @param {string} value - Pseudo sélectionné
 * @param {(pseudo: string) => void} onChange - Appelé quand le pseudo change (ajout inclus)
 * @param {string} [label="Choisis ton pseudo :"] - Libellé au-dessus (ou à gauche si inline)
 * @param {boolean} [inline=false] - Libellé et boutons sur une même ligne
 * @param {string} [radioClassName] - Classe CSS ajoutée au Radio.Group
 * @param {React.CSSProperties} [style] - Style du conteneur (ex. marges)
 */
export default function ChoixPseudo({
  value,
  onChange,
  label = 'Choisis ton pseudo :',
  inline = false,
  radioClassName,
  style,
}) {
  const [joueurs, setJoueurs] = useState(getJoueurs)
  const [modalOpen, setModalOpen] = useState(false)
  const [nouveauPseudo, setNouveauPseudo] = useState('')

  const selectPseudo = (pseudo) => {
    setJoueurActuel(pseudo)
    onChange?.(pseudo)
  }

  const closeModal = () => {
    setModalOpen(false)
    setNouveauPseudo('')
  }

  const handleAdd = () => {
    const result = addJoueur(nouveauPseudo)
    if (!result.ok) {
      // Pseudo déjà présent : on le sélectionne au lieu de bloquer.
      if (result.pseudo) {
        message.info(result.error)
        selectPseudo(result.pseudo)
        closeModal()
        return
      }
      message.warning(result.error)
      return
    }
    setJoueurs(getJoueurs())
    selectPseudo(result.pseudo)
    closeModal()
  }

  return (
    <div className={`choix-pseudo ${inline ? 'choix-pseudo-inline' : ''}`} style={style}>
      {label != null && (
        <Text strong block={!inline} className="choix-pseudo-label">
          {label}
        </Text>
      )}
      <div className="choix-pseudo-row">
        <Radio.Group
          className={radioClassName}
          optionType="button"
          value={value}
          onChange={(e) => selectPseudo(e.target.value)}
        >
          {joueurs.map((j) => (
            <Radio.Button key={j} value={j}>
              {j}
            </Radio.Button>
          ))}
        </Radio.Group>
        <Button
          shape="circle"
          icon={<PlusOutlined />}
          className="choix-pseudo-add"
          onClick={() => setModalOpen(true)}
          aria-label="Ajouter un pseudo"
          title="Ajouter un pseudo"
        />
      </div>
      <Modal
        title="Nouveau pseudo"
        open={modalOpen}
        onOk={handleAdd}
        onCancel={closeModal}
        okText="Ajouter"
        cancelText="Annuler"
        destroyOnClose
      >
        <Input
          autoFocus
          value={nouveauPseudo}
          onChange={(e) => setNouveauPseudo(e.target.value)}
          onPressEnter={handleAdd}
          placeholder="Ton pseudo"
          maxLength={PSEUDO_MAX_LENGTH}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: '0.85rem' }}>
          Il sera disponible dans tous les mini-jeux.
        </Text>
      </Modal>
    </div>
  )
}
