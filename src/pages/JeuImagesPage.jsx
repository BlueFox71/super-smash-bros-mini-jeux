import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Space, Input, message, Progress, Checkbox, Switch } from 'antd'
import { getCharacters, getCharactersWithImage, getRandomCharactersWithImage } from '../data'
import { isAnswerCorrect } from '../utils/reponseUtils'
import { MODIFIERS, pickRandomModifier } from '../utils/imageModifiers'
import GameIntroCard from '../components/GameIntroCard'
import GameResultCard from '../components/GameResultCard'
import PixelatedImage from '../components/PixelatedImage'
import PageLoader from '../components/PageLoader'
import './JeuImagesPage.css'

const { Title, Text } = Typography

const NB_QUESTIONS = 10
const NB_ESSAIS = 5
const GUESSPIXEL_DECREMENT = 8
const GUESSPIXEL_MIN = 8

// Images depuis le dossier characters (filename)
const characterImageModules = import.meta.glob('../data/characters/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})
const getImageUrlCharacters = (filename) => {
  if (!filename) return null
  const key = Object.keys(characterImageModules).find((k) => k.endsWith('/' + filename))
  return key ? characterImageModules[key] : null
}

// Images variantes depuis characters/couleurs (ex: "mario_7.png")
const variantImageModules = import.meta.glob('../data/characters/couleurs/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
})
/** base -> { 1: url, 2: url, ... } */
const variantUrlsByBase = (() => {
  const map = {}
  Object.keys(variantImageModules).forEach((key) => {
    const name = (key.replace(/\\/g, '/').split('/').pop() || '')
    const match = name.match(/^(.+)_(\d+)\.png$/i)
    if (match) {
      const base = match[1].toLowerCase()
      const num = parseInt(match[2], 10)
      if (!map[base]) map[base] = {}
      map[base][num] = variantImageModules[key]
    }
  })
  return map
})()
const getVariantImageUrl = (baseFromFilename, variantNum) => {
  if (!baseFromFilename) return null
  const base = baseFromFilename.replace(/\.png$/i, '').toLowerCase()
  const variants = variantUrlsByBase[base]
  return variants?.[variantNum] ?? null
}
/** Personnages qui ont au moins une image dans couleurs */
const getCharactersWithVariants = () => {
  const withImage = getCharactersWithImage()
  return withImage.filter((p) => {
    const base = (p.filename || '').replace(/\.png$/i, '').toLowerCase()
    const v = variantUrlsByBase[base]
    return v && Object.keys(v).length >= 1
  })
}
/** Retourne la liste des numéros de variantes dispo (1–7) pour un base name, triés. */
const getAvailableVariantNums = (baseFromFilename) => {
  const base = baseFromFilename.replace(/\.png$/i, '').toLowerCase()
  const variants = variantUrlsByBase[base]
  if (!variants || Object.keys(variants).length === 0) return []
  return Object.keys(variants)
    .map(Number)
    .filter((n) => n >= 1 && n <= 7)
    .sort((a, b) => a - b)
}
/** Mélange un tableau (Fisher–Yates). */
const shuffleArray = (arr) => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function JeuImagesPage() {
  const navigate = useNavigate()
  const characters = getCharacters()
  const charactersWithImage = getCharactersWithImage()
  const [step, setStep] = useState('intro') // intro | jeu | fin
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(NB_ESSAIS)
  const [enabledModifierKeys, setEnabledModifierKeys] = useState(() => new Set(MODIFIERS.map((m) => m.key)))
  const [variantMode, setVariantMode] = useState(false)
  const autoNextRef = useRef(null)
  const inputRef = useRef(null)
  const enabledModifierKeysRef = useRef(enabledModifierKeys)

  useEffect(() => {
    enabledModifierKeysRef.current = enabledModifierKeys
  }, [enabledModifierKeys])

  const toggleModifier = useCallback((key, checked) => {
    setEnabledModifierKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])

  const selectAllModifiers = useCallback(() => {
    setEnabledModifierKeys(new Set(MODIFIERS.map((m) => m.key)))
  }, [])

  const deselectAllModifiers = useCallback(() => {
    setEnabledModifierKeys(new Set())
  }, [])

  // 3 secondes après révélation, passer à la question suivante (ou fin)
  useEffect(() => {
    if (step !== 'jeu' || !revealed) return
    autoNextRef.current = setTimeout(() => {
      if (questionIndex + 1 >= questions.length) {
        setStep('fin')
      } else {
        setQuestionIndex((i) => i + 1)
        setAnswer('')
        setRevealed(false)
        setAnswerIsCorrect(false)
        setAttemptsLeft(NB_ESSAIS)
      }
    }, 3000)
    return () => {
      if (autoNextRef.current) clearTimeout(autoNextRef.current)
    }
  }, [step, revealed, questionIndex, questions.length])

  // Garder le focus sur l'input en jeu pour enchaîner les réponses sans recliquer
  useEffect(() => {
    if (step === 'jeu' && !revealed) {
      const t = setTimeout(() => inputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [step, revealed, questionIndex])

  const startGame = useCallback(() => {
    const currentEnabled = enabledModifierKeysRef.current
    const allowedModifiers = MODIFIERS.filter((m) => currentEnabled.has(m.key))
    if (allowedModifiers.length === 0) {
      message.warning('Sélectionne au moins un modificateur pour jouer.')
      return
    }
    if (variantMode) {
      const charactersWithVariants = getCharactersWithVariants()
      if (charactersWithVariants.length === 0) {
        message.warning('Aucun personnage avec variantes disponibles.')
        return
      }
      const shuffledCharacters = shuffleArray(charactersWithVariants)
      const charactersForRound = shuffledCharacters.slice(0, NB_QUESTIONS)
      const arr = charactersForRound.map((character) => {
        const mod = pickRandomModifier(allowedModifiers)
        const variantNums = getAvailableVariantNums(character.filename)
        const variantNum = variantNums.length > 0 ? variantNums[Math.floor(Math.random() * variantNums.length)] : null
        const variantUrl = variantNum != null ? getVariantImageUrl(character.filename, variantNum) : null
        const fallbackMainUrl = getImageUrlCharacters(character.filename)
        const variantImageUrl = variantUrl || fallbackMainUrl
        const q = { ...character, imageModifier: mod, variantImageUrl }
        if (mod.pixelLevels?.length) {
          q.guesspixelSize = Math.max(...mod.pixelLevels)
        }
        return q
      })
      setQuestions(arr)
    } else {
      const list = getRandomCharactersWithImage(NB_QUESTIONS)
      const arr = Array.isArray(list) ? list : [list]
      setQuestions(
        arr.map((p) => {
          const mod = pickRandomModifier(allowedModifiers)
          const q = { ...p, imageModifier: mod }
          if (mod.pixelLevels?.length) {
            q.guesspixelSize = Math.max(...mod.pixelLevels)
          }
          return q
        })
      )
    }
    setQuestionIndex(0)
    setScore(0)
    setAnswer('')
    setRevealed(false)
    setAttemptsLeft(NB_ESSAIS)
    setStep('jeu')
  }, [variantMode])

  const validateAnswer = () => {
    const question = questions[questionIndex]
    const correct = isAnswerCorrect(question.name, answer.trim(), question.acceptedNames)
    if (correct) {
      setAnswerIsCorrect(true)
      setRevealed(true)
      setScore((s) => s + 1)
      message.success(`Bien vu ! C'était ${question.name}.`)
    } else {
      const nextAttempts = attemptsLeft - 1
      setAttemptsLeft(nextAttempts)
      setAnswer('')
      if (nextAttempts <= 0) {
        setRevealed(true)
        setAnswerIsCorrect(false)
        message.error(`C'était : ${question.name}.`)
      } else {
        message.error(`Faux. Il te reste ${nextAttempts} essai${nextAttempts > 1 ? 's' : ''}.`)
        if (question.imageModifier?.key === 'guesspixel') {
          setQuestions((prev) =>
            prev.map((q, i) =>
              i === questionIndex
                ? { ...q, guesspixelSize: Math.max(GUESSPIXEL_MIN, (q.guesspixelSize ?? 32) - GUESSPIXEL_DECREMENT) }
                : q
            )
          )
        }
      }
    }
  }

  const skipQuestion = () => {
    const question = questions[questionIndex]
    setAnswerIsCorrect(false)
    setRevealed(true)
    message.info(`C'était : ${question.name}.`)
  }

  const sampleFilename = getCharacters()[0]?.filename || 'mario.png'
  const sampleImageUrl = variantMode
    ? (getVariantImageUrl('mario.png', 7) || getImageUrlCharacters('mario.png'))
    : getImageUrlCharacters(sampleFilename)

  const modifierPreview = (
    <div className="jeu-images-apercu">
      <Title level={4} className="jeu-images-apercu-title">Aperçu des modificateurs</Title>
      <div className="jeu-images-apercu-hint-row">
        <Text className="jeu-images-apercu-hint">Personnalise le quiz en choisissant les modificateurs utilisés.</Text>
        <Space size="small">
          <Button type="link" size="small" onClick={selectAllModifiers} className="jeu-images-apercu-select-btn">
            Tout sélectionner
          </Button>
          <Button type="link" size="small" onClick={deselectAllModifiers} className="jeu-images-apercu-select-btn">
            Tout désélectionner
          </Button>
        </Space>
      </div>
      <div className="jeu-images-apercu-grid">
        {MODIFIERS.map((mod) => {
          const enabled = enabledModifierKeys.has(mod.key)
          const itemClassName = `jeu-images-apercu-item ${!enabled ? 'jeu-images-apercu-item-disabled' : ''}`
          if (mod.key === 'guesspixel') {
            return (
              <div key={mod.key} className={itemClassName}>
                <div className="jeu-images-apercu-img">
                  {sampleImageUrl && (
                    <PixelatedImage
                      src={sampleImageUrl}
                      pixelSize={24}
                      width={140}
                      height={120}
                      className="jeu-images-apercu-pixelated"
                      style={{ maxWidth: '100%', height: 120, borderRadius: 8 }}
                    />
                  )}
                </div>
                <div className="jeu-images-apercu-label">
                  <Checkbox
                    checked={enabled}
                    onChange={(e) => toggleModifier(mod.key, e.target.checked)}
                    className="jeu-images-apercu-checkbox"
                  />
                  <span className="jeu-images-apercu-name">{mod.name}</span>
                </div>
              </div>
            )
          }
          const hasOverlay = mod.gradientOverlay
          const bgImage = sampleImageUrl
            ? (hasOverlay ? `${mod.gradientOverlay}, url(${sampleImageUrl})` : `url(${sampleImageUrl})`)
            : 'none'
          const baseStyle = {
            backgroundRepeat: 'no-repeat',
            backgroundSize: mod.style?.backgroundSize ?? 'contain',
            backgroundPosition: mod.style?.backgroundPosition ?? 'center',
            ...(mod.style ?? {}),
            backgroundImage: bgImage,
          }
          return (
            <div key={mod.key} className={itemClassName}>
              <div
                className={`jeu-images-apercu-img ${mod.className || ''}`}
                style={baseStyle}
              />
              <div className="jeu-images-apercu-label">
                <Checkbox
                  checked={enabled}
                  onChange={(e) => toggleModifier(mod.key, e.target.checked)}
                  className="jeu-images-apercu-checkbox"
                />
                <span className="jeu-images-apercu-name">{mod.name}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (!characters?.length || !charactersWithImage?.length) {
    return <PageLoader message="Chargement des personnages et des images..." />
  }

  if (step === 'intro') {
    return (
      <div className="jeu-images-page">
        <GameIntroCard
          title="Jeu d'images"
          description="Identifie le personnage à partir d'une image modifiée (flou, zoom, pixelisé, etc.). Réponse sans accent, à une lettre près."
          primaryLabel="Commencer"
          onPrimaryClick={startGame}
          cardClassName="jeu-images-card"
        >
          <div className="jeu-images-mode-variantes">
            <Text>Mode variantes</Text>
            <Switch checked={variantMode} onChange={setVariantMode} aria-label="Mode variantes" />
          </div>
        </GameIntroCard>
        {modifierPreview}
      </div>
    )
  }

  const strokeColors = {
    '0%': '#e60012',
    '100%': '#87d068',
  }
  if (step === 'fin') {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0
    return (
      <div className="jeu-images-page">
        <GameResultCard title="Résultat" onReplay={startGame} cardClassName="jeu-images-card">
          <div className="jeu-images-score">
            <Progress type="circle" percent={pct} strokeColor={strokeColors} className="jeu-images-progress-circle" />
            <Text strong style={{ fontSize: 18, marginTop: 16, display: 'block' }}>
              {score} / {questions.length} bonnes réponses
            </Text>
          </div>
        </GameResultCard>
      </div>
    )
  }

  const question = questions[questionIndex]
  const imageUrl = question?.variantImageUrl ?? getImageUrlCharacters(question?.filename)
  const progress = ((questionIndex + 1) / questions.length) * 100
  const isZoomErratique = question?.imageModifier?.key === 'random-zoom' && !revealed

  return (
    <div className="jeu-images-page">
      <Progress percent={Math.round(progress)} strokeColor={strokeColors} className="jeu-images-progress-bar" style={{ marginBottom: 24 }} />
      <Card className="jeu-images-card">
        <Title level={4} type="secondary">
          Question {questionIndex + 1} / {questions.length}
        </Title>
        <div className="jeu-images-figure" key={`q-${questionIndex}`}>
          {isZoomErratique && (
            <div className="jeu-images-recording-dot" aria-hidden title="Zoom erratique" />
          )}
          {imageUrl ? (
            question.imageModifier?.key === 'guesspixel' && !revealed ? (
              <PixelatedImage
                key={`img-${questionIndex}`}
                src={imageUrl}
                pixelSize={question.guesspixelSize ?? 32}
                width={400}
                height={280}
                className="jeu-images-img jeu-images-img-modified jeu-images-pixelated-canvas"
              />
            ) : (
              <div
                key={`bg-${questionIndex}`}
                className={`jeu-images-img jeu-images-img-modified ${!revealed && question.imageModifier?.className ? question.imageModifier.className : ''}`}
                role="img"
                aria-label="Personnage à deviner"
                style={(() => {
                  const mod = question.imageModifier
                  const hasOverlay = !revealed && mod?.gradientOverlay
                  const bgImage = hasOverlay
                    ? `${mod.gradientOverlay}, url(${imageUrl})`
                    : `url(${imageUrl})`
                  return {
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: revealed ? 'contain' : (mod?.style?.backgroundSize ?? 'contain'),
                    backgroundPosition: revealed ? 'center' : (mod?.style?.backgroundPosition ?? 'center'),
                    ...(revealed ? {} : (mod?.style ?? {})),
                    backgroundImage: bgImage,
                  }
                })()}
              />
            )
          ) : (
            <div className="jeu-images-placeholder">Image indisponible</div>
          )}
        </div>
        <div className="jeu-images-reponse">
          {!revealed && (
            <Text type="secondary" className="jeu-images-essais">
              {attemptsLeft} essai{attemptsLeft !== 1 ? 's' : ''} restant{attemptsLeft !== 1 ? 's' : ''}
            </Text>
          )}
          <Input
            ref={inputRef}
            placeholder="Nom du personnage"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onPressEnter={validateAnswer}
            disabled={revealed}
            size="large"
            className="jeu-images-input"
          />
          {!revealed && (
            <Space wrap>
              <Button type="primary" size="large" onClick={validateAnswer} disabled={!answer.trim()}>
                Valider
              </Button>
              <Button size="large" onClick={skipQuestion}>
                Je passe
              </Button>
            </Space>
          )}
        </div>
      </Card>
    </div>
  )
}
