import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Space } from 'antd'

const { Title, Text } = Typography

/**
 * Carte d'intro commune pour les pages de jeux (titre, description, boutons Commencer / Retour).
 * @param {string} title - Titre de la carte
 * @param {React.ReactNode} [description] - Texte ou contenu secondaire (souvent <Text type="secondary">)
 * @param {string} primaryLabel - Libellé du bouton principal (ex. "Commencer")
 * @param {() => void} onPrimaryClick - Action du bouton principal
 * @param {string} [secondaryLabel="Retour à l'accueil"]
 * @param {() => void} [onSecondaryClick] - Par défaut : navigation vers /
 * @param {string} [cardClassName] - Classe CSS de la Card (ex. "jeu-images-card", "quiz-card")
 * @param {React.ReactNode} [children] - Contenu optionnel entre la description et les boutons
 */
export default function GameIntroCard({
  title,
  description,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel = "Retour à l'accueil",
  onSecondaryClick,
  cardClassName,
  children,
}) {
  const navigate = useNavigate()
  const handleSecondary = onSecondaryClick ?? (() => navigate('/'))

  return (
    <Card className={cardClassName}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <Title level={2} style={{ textAlign: 'center', width: '100%' }}>{title}</Title>
        {/* `display: 'block'` en style et non la prop `block` : cette dernière
            n'existe pas sur Typography.Text, elle fuyait sur le <span> du DOM et
            déclenchait un avertissement React à chaque page de jeu. */}
        {description != null && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, textAlign: 'center' }}>
            {description}
          </Text>
        )}
        {children != null && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, width: '100%' }}>
            {children}
          </div>
        )}
        <Space>
          <Button type="primary" size="large" onClick={onPrimaryClick}>
            {primaryLabel}
          </Button>
          <Button size="large" onClick={handleSecondary}>
            {secondaryLabel}
          </Button>
        </Space>
      </div>
    </Card>
  )
}
