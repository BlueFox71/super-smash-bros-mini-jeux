import { Typography, Row, Col, Card, Space } from 'antd'
import { PictureOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const { Title, Paragraph } = Typography

const GAMES = [
  {
    key: 'images',
    title: "Jeu d'images",
    description: "Reconnais les personnages à partir de l'image. Réponse sans accent, à une lettre près.",
    icon: <PictureOutlined />,
    available: true,
  },
  {
    key: 'ecris-les-tous',
    title: 'Écris-les tous !',
    description: 'Saisis le nom de tous les personnages. Chrono et classement par joueur (Jules, Alexis, Invité).',
    icon: <EditOutlined />,
    available: true,
  },
  {
    key: 'quiz',
    title: 'Quiz',
    description: 'Réponds à des questions sur Super Smash Bros. Choisis 5, 10 ou 15 questions.',
    icon: <QuestionCircleOutlined />,
    available: true,
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-hero-bg" aria-hidden="true">
          <div className="home-hero-bg-strip">
            <div className="home-hero-bg-tile" />
            <div className="home-hero-bg-tile" />
          </div>
        </div>
        <div className="home-hero-inner">
          <div className="hero-section">
            <Title level={1} className="hero-title">
              Bienvenue sur les Mini Jeux Smash
            </Title>
            <Paragraph className="hero-subtitle">
              Choisis un mini-jeu et prouve que tu es un vrai fan de Super Smash Bros
            </Paragraph>
          </div>
        </div>
      </div>

      <div className="home-games-section">
        <Row gutter={[24, 24]} className="games-grid">
          {GAMES.map((game) => (
            <Col xs={24} sm={24} md={12} lg={8} key={game.key}>
              <Card
                className={`game-card game-card--${game.key}`}
                hoverable
                onClick={() => navigate(`/${game.key}`)}
              >
                <Space direction="vertical" size="middle" align="center" style={{ width: '100%' }} className="game-card-content">
                  <Title level={2} className="game-card-title">{game.title}</Title>
                  <div className="game-icon">{game.icon}</div>
                  <Paragraph type="secondary" className="game-description">
                    {game.description}
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
