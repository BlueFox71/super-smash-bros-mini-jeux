import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Space } from 'antd'

const { Title } = Typography

/**
 * Carte de résultat commune pour les pages de jeux (titre, contenu score, boutons Rejouer / Retour).
 * @param {string} title - Titre de la carte (ex. "Résultat", "Partie terminée")
 * @param {React.ReactNode} children - Contenu du résultat (Progress, texte score, etc.)
 * @param {() => void} onReplay - Action du bouton Rejouer
 * @param {string} [cardClassName] - Classe CSS de la Card (ex. "jeu-images-card", "quiz-card")
 * @param {() => void} [onBack] - Par défaut : navigation vers /
 */
export default function GameResultCard({
  title,
  children,
  onReplay,
  cardClassName,
  onBack,
}) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate('/'))

  return (
    <Card className={cardClassName}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Title level={2} style={{ textAlign: 'center', width: '100%' }}>{title}</Title>
        {children}
        <Space style={{ marginTop: 24 }}>
          <Button type="primary" size="large" onClick={onReplay}>
            Rejouer
          </Button>
          <Button size="large" onClick={handleBack}>
            Retour à l'accueil
          </Button>
        </Space>
      </div>
    </Card>
  )
}
