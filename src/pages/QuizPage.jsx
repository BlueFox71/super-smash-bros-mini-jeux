import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Space, Radio, Progress, message } from 'antd'
import {
  QuestionCircleOutlined,
  CheckSquareOutlined,
  OrderedListOutlined,
  HistoryOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { getRandomQuizQuestions, getCharactersByNumberOrder } from '../data'
import { getAnsweredIds, addAnsweredId, resetAnsweredIds } from '../utils/quizStorage'
import { getJoueurActuel } from '../utils/joueursStorage'
import ChoixPseudo from '../components/ChoixPseudo'
import GameIntroCard from '../components/GameIntroCard'
import GameResultCard from '../components/GameResultCard'
import PageLoader from '../components/PageLoader'
import '../components/GrillePersonnages.css'
import './QuizPage.css'
import { DIFFICULTY_CONFIG, TYPE_CONFIG } from './QuizHistoriquePage'

const { Title, Text } = Typography

const NB_QUESTIONS_OPTIONS = [5, 10, 15]

function getTypeConfig(type) {
  return TYPE_CONFIG[type] ?? { label: type, icon: <QuestionCircleOutlined /> }
}

function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] ?? { label: difficulty, icon: <StarOutlined />, className: '' }
}

export default function QuizPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('intro') // intro | jeu | fin
  const [player, setPlayer] = useState(getJoueurActuel)
  const [nbQuestions, setNbQuestions] = useState(10)
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null) // index ou null
  const [score, setScore] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false)

  const startGame = useCallback(() => {
    const answeredIds = getAnsweredIds(player)
    let list = getRandomQuizQuestions(nbQuestions, answeredIds)
    if (list.length < nbQuestions && answeredIds.length > 0) {
      resetAnsweredIds(player)
      list = getRandomQuizQuestions(nbQuestions, [])
    }
    if (!list.length) {
      message.warning('Aucune question disponible pour le quiz.')
      return
    }
    setQuestions(list)
    setQuestionIndex(0)
    setSelectedOption(null)
    setScore(0)
    setRevealed(false)
    setAnswerIsCorrect(false)
    setStep('jeu')
  }, [nbQuestions, player])

  const submitAnswer = useCallback(() => {
    if (selectedOption === null || revealed) return
    const q = questions[questionIndex]
    const correctIndex = q.correct_option
    const correct = selectedOption === correctIndex
    setAnswerIsCorrect(correct)
    if (correct) setScore((s) => s + 1)
    setRevealed(true)
    addAnsweredId(player, q.id)
  }, [questions, questionIndex, selectedOption, revealed, player])

  const goNext = useCallback(() => {
    if (questionIndex + 1 >= questions.length) {
      setStep('fin')
    } else {
      setQuestionIndex((i) => i + 1)
      setSelectedOption(null)
      setRevealed(false)
      setAnswerIsCorrect(false)
    }
  }, [questionIndex, questions.length])

  if (step === 'intro') {
    const characters = getCharactersByNumberOrder()
    return (
      <div className="quiz-page quiz-page-intro">
        <div className="quiz-intro-card-wrap">
          <GameIntroCard
            title="Quiz"
            description="Réponds aux questions sur Super Smash Bros. Choisis ton pseudo et le nombre de questions."
            primaryLabel="Démarrer"
            onPrimaryClick={startGame}
            cardClassName="quiz-card"
          >
            <ChoixPseudo value={player} onChange={setPlayer} style={{ marginBottom: 24 }} />
            <Text strong block style={{ marginBottom: 8 }}>
              Nombre de questions :
            </Text>
            <Radio.Group
              className="quiz-radio-nb"
              optionType="button"
              value={nbQuestions}
              onChange={(e) => setNbQuestions(e.target.value)}
            >
              {NB_QUESTIONS_OPTIONS.map((n) => (
                <Radio.Button key={n} value={n}>
                  {n}
                </Radio.Button>
              ))}
            </Radio.Group>
          </GameIntroCard>
          <Button
            type="link"
            className="quiz-intro-historique-btn"
            onClick={() => navigate('/quiz/historique')}
            icon={<HistoryOutlined />}
          >
            Historique
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'fin') {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0
    const strokeColors = { '0%': '#e60012', '100%': '#87d068' }
    return (
      <div className="quiz-page">
        <GameResultCard title="Résultat" onReplay={startGame} cardClassName="quiz-card">
          <div className="quiz-score">
            <Text strong style={{ fontSize: 18, marginBottom: 8, display: 'block' }}>
              {player} : {score} / {questions.length} bonnes réponses
            </Text>
            <Progress type="circle" percent={pct} strokeColor={strokeColors} className="quiz-progress-circle" />
          </div>
        </GameResultCard>
      </div>
    )
  }

  if (!questions.length) {
    return <PageLoader message="Chargement des questions..." />
  }

  const question = questions[questionIndex]
  const typeCfg = getTypeConfig(question.type)
  const difficultyCfg = getDifficultyConfig(question.difficulty)
  const progress = ((questionIndex + 1) / questions.length) * 100
  const strokeColors = { '0%': '#e60012', '100%': '#87d068' }
  const correctAnswerText =
    question.options && typeof question.correct_option === 'number'
      ? question.options[question.correct_option]
      : ''
  const explanationText = question.answer != null ? String(question.answer).trim() : ''
  const showExplanation = explanationText && explanationText !== correctAnswerText

  return (
    <div className="quiz-page">
      <Progress
        percent={Math.round(progress)}
        strokeColor={strokeColors}
        className="quiz-progress-bar"
        style={{ marginBottom: 24 }}
      />
      <Card className="quiz-card">
        <Title level={4} type="secondary">
          Question {questionIndex + 1} / {questions.length}
        </Title>

        <div className="quiz-meta">
          <span className={`quiz-meta-badge ${difficultyCfg.className}`}>
            {difficultyCfg.icon}
            <span>{difficultyCfg.label}</span>
          </span>
          <span className="quiz-meta-badge quiz-meta-type">
            {typeCfg.icon}
            <span>{typeCfg.label}</span>
          </span>
        </div>

        <div className="quiz-question-text">
          <Text strong>{question.question}</Text>
        </div>

        {!revealed ? (
          <>
            <div className="quiz-options">
              {(question.options || []).map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quiz-option-btn ${selectedOption === idx ? 'quiz-option-btn-selected' : ''}`}
                  onClick={() => setSelectedOption(idx)}
                >
                  <span className="quiz-option-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className="quiz-option-text">{opt}</span>
                </button>
              ))}
            </div>
            <div className="quiz-actions">
              <Button
                type="primary"
                size="large"
                onClick={submitAnswer}
                disabled={selectedOption === null}
              >
                Valider
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="quiz-feedback">
              <div className={`quiz-feedback-result ${answerIsCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong'}`}>
                {answerIsCorrect ? <CheckOutlined /> : <CloseOutlined />}
                <span>{answerIsCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}</span>
              </div>
              <div className="quiz-answer-detail">
                <Text type="secondary">Réponse :</Text>
                <Text strong className="quiz-answer-text">{correctAnswerText}</Text>
                {showExplanation && (
                  <Text className="quiz-answer-detail-extra">{question.answer}</Text>
                )}
              </div>
            </div>
            <div className="quiz-actions">
              <Button type="primary" size="large" onClick={goNext}>
                Suivante
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
