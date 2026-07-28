import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Empty } from 'antd'
import {
  QuestionCircleOutlined,
  CheckSquareOutlined,
  OrderedListOutlined,
  HistoryOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  BugOutlined,
  EyeOutlined,
  AudioOutlined,
  BookOutlined,
  CodeOutlined,
  CompassOutlined,
  TrophyOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import { getQuestionById } from '../data'
import { getAnsweredIds } from '../utils/quizStorage'
import { getJoueurActuel } from '../utils/joueursStorage'
import ChoixPseudo from '../components/ChoixPseudo'
import './QuizHistoriquePage.css'

const { Title, Text } = Typography

export const TYPE_CONFIG = {
  multiple_choice: { label: 'QCM', icon: <QuestionCircleOutlined /> },
  true_false: { label: 'Vrai / Faux', icon: <CheckSquareOutlined /> },
  who_comes_first: { label: 'Ordre', icon: <OrderedListOutlined /> },
  history: { label: 'Histoire', icon: <HistoryOutlined /> },
  riddle: { label: 'Énigme', icon: <BulbOutlined /> },
  intruder_logic: { label: 'Logique intrus', icon: <BugOutlined /> },
  visual_logic: { label: 'Logique visuelle', icon: <EyeOutlined /> },
  audio_theme: { label: 'Thème audio', icon: <AudioOutlined /> },
  // Ces cinq types existent dans questions.json mais n'avaient pas de libellé :
  // le badge affichait la clé brute (« universe_lore »), et c'est le type le plus
  // représenté du jeu de questions.
  universe_lore: { label: 'Univers', icon: <BookOutlined /> },
  meta_dev: { label: 'Coulisses', icon: <CodeOutlined /> },
  adventure_mode: { label: 'Mode aventure', icon: <CompassOutlined /> },
  assist_trophy: { label: 'Trophée aide', icon: <TrophyOutlined /> },
  item_master: { label: 'Objets', icon: <GiftOutlined /> },
}

export const DIFFICULTY_CONFIG = {
  easy: { label: 'Facile', icon: <StarOutlined />, className: 'quiz-hist-easy' },
  medium: { label: 'Moyen', icon: <ThunderboltOutlined />, className: 'quiz-hist-medium' },
  hard: { label: 'Difficile', icon: <FireOutlined />, className: 'quiz-hist-hard' },
}

function getTypeLabel(type) {
  return TYPE_CONFIG[type]?.label ?? type
}

function getDifficultyLabel(difficulty) {
  return DIFFICULTY_CONFIG[difficulty]?.label ?? difficulty
}

export default function QuizHistoriquePage() {
  const navigate = useNavigate()
  const [player, setPlayer] = useState(getJoueurActuel)

  const answeredIds = useMemo(() => getAnsweredIds(player), [player])
  const historyItems = useMemo(() => {
    return answeredIds
      .map((id) => getQuestionById(id))
      .filter(Boolean)
      .reverse() // plus récent en premier
  }, [answeredIds])

  return (
    <div className="quiz-historique-page">
      <Card className="quiz-historique-card">
        <div className="quiz-historique-header">
          <Title level={2} className="quiz-historique-title">
            Historique des questions
          </Title>
          <Button onClick={() => navigate('/quiz')}>Retour au Quiz</Button>
        </div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Choisis un joueur pour afficher les questions déjà répondues.
        </Text>
        <div className="quiz-historique-joueur">
          <ChoixPseudo value={player} onChange={setPlayer} label="Joueur :" inline />
        </div>

        {historyItems.length === 0 ? (
          <Empty
            description={`Aucune question répondue pour ${player}.`}
            style={{ marginTop: 32, marginBottom: 32 }}
          />
        ) : (
          <div className="quiz-historique-list">
            <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
              {historyItems.length} question{historyItems.length > 1 ? 's' : ''} répondue{historyItems.length > 1 ? 's' : ''}
            </Text>
            {historyItems.map((q) => {
              const difficultyCfg = DIFFICULTY_CONFIG[q.difficulty]
              const correctOptionText =
                q.options && typeof q.correct_option === 'number'
                  ? q.options[q.correct_option]
                  : null
              return (
                <div key={q.id} className="quiz-historique-item">
                  <div className="quiz-historique-item-meta">
                    <span className={`quiz-historique-badge ${difficultyCfg?.className ?? ''}`}>
                      {difficultyCfg?.icon}
                      <span>{getDifficultyLabel(q.difficulty)}</span>
                    </span>
                    <span className="quiz-historique-badge quiz-historique-type">
                      {TYPE_CONFIG[q.type]?.icon}
                      <span>{getTypeLabel(q.type)}</span>
                    </span>
                  </div>
                  <Text strong className="quiz-historique-question">
                    {q.question}
                  </Text>
                  <div className="quiz-historique-reponse">
                    <Text type="secondary">Réponse : </Text>
                    <Text strong>{correctOptionText ?? q.answer}</Text>
                    {q.answer != null && String(q.answer).trim() && correctOptionText !== q.answer && (
                      <Text type="secondary" className="quiz-historique-detail">
                        — {q.answer}
                      </Text>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
