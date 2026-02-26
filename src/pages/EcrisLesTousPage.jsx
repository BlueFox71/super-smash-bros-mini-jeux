import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Button, Space, Input, Radio, message, Table, Popover, Modal, Progress, Switch } from 'antd'
import { EditOutlined, DeleteOutlined, BulbOutlined } from '@ant-design/icons'
import { getCharacters, getCharactersByIdOrder } from '../data'
import { isAnswerCorrect } from '../utils/reponseUtils'
import { addScore, getRanking, scorePercentage, deleteScore, updateScore, formatScoreDate } from '../utils/ecrisLesTousStorage'
import { useHideHeader } from '../context/HideHeaderContext'
import CharactersGrid from '../components/GrillePersonnages'
import GameIntroCard from '../components/GameIntroCard'
import GameResultCard from '../components/GameResultCard'
import PageLoader from '../components/PageLoader'
import './EcrisLesTousPage.css'

const { Title, Text } = Typography

const JOUEURS = ['Jules', 'Alexis', 'Invité']
const TOTAL = getCharacters().length

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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m} min ${s.toString().padStart(2, '0')} s`
}

/** Construit la chaîne d’indice lettres à partir du nom et des indices déjà révélés. */
const DUREE_INDICE_SEC = 20
const INDICE_DELAI_ACTIVATION_SEC = 180
const INDICE_COOLDOWN_SEC = 60
const INDICE_DELAI_ACTIVATION_ORDER_SEC = 30  
const INDICE_COOLDOWN_ORDER_SEC = 15
const ORDER_MODE_STORAGE_KEY = 'ecrisLesTous_orderMode'

function getInitialOrderMode() {
  try {
    return localStorage.getItem(ORDER_MODE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export default function EcrisLesTousPage() {
  const navigate = useNavigate()
  const [hideHeader, setHideHeader] = useHideHeader()
  const [step, setStep] = useState('intro') // intro | countdown | jeu | fin
  const [countdown, setCountdown] = useState(null) // 3 | 2 | 1 | 'smash' | null
  const [player, setPlayer] = useState('Jules')
  const [foundIds, setFoundIds] = useState(new Set())
  const [answer, setAnswer] = useState('')
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [chronoActive, setChronoActive] = useState(false)
  const [blinkGreenId, setBlinkGreenId] = useState(null)
  const [blinkOrangeId, setBlinkOrangeId] = useState(null)
  const [currentHint, setCurrentHint] = useState(null) // { personnage, indiceTexte } ou null
  const [hintsRevealedPerCharacter, setHintsRevealedPerCharacter] = useState({}) // id -> nombre d'indices déjà montrés (0, 1 ou 2)
  const [hintCooldownRemaining, setHintCooldownRemaining] = useState(0) // secondes restantes avant prochain clic
  const [refreshRankingKey, setRefreshRankingKey] = useState(0)
  const [editScoreModal, setEditScoreModal] = useState(null) // { date, joueur } ou null
  const [orderMode, setOrderModeState] = useState(getInitialOrderMode)
  const setOrderMode = useCallback((value) => {
    setOrderModeState(value)
    try {
      localStorage.setItem(ORDER_MODE_STORAGE_KEY, value ? 'true' : 'false')
    } catch (_) {}
  }, [])
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)
  const blinkTimeoutRef = useRef(null)
  const foundIdsRef = useRef(new Set())
  const hintHideTimeoutRef = useRef(null)

  const characters = getCharacters()

  // Chronomètre
  useEffect(() => {
    if (!chronoActive) return
    intervalRef.current = setInterval(() => {
      setTimeSeconds((s) => s + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [chronoActive])

  // Masquer l’en-tête pendant la partie (countdown + jeu)
  useEffect(() => {
    const inGame = step === 'jeu' || countdown !== null
    setHideHeader(inGame)
    return () => setHideHeader(false)
  }, [step, countdown, setHideHeader])

  // Countdown 3, 2, 1, Smash ! puis lancer le jeu
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 'smash') {
      countdownRef.current = setTimeout(() => {
        setCountdown(null)
        setStep('jeu')
        setChronoActive(true)
      }, 600)
      return () => { if (countdownRef.current) clearTimeout(countdownRef.current) }
    }
    const next = countdown === 3 ? 2 : countdown === 2 ? 1 : 'smash'
    countdownRef.current = setTimeout(() => setCountdown(next), 1000)
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current) }
  }, [countdown])

  foundIdsRef.current = foundIds

  // Décrémenter le cooldown du bouton Indices chaque seconde
  useEffect(() => {
    if (hintCooldownRemaining <= 0) return
    const t = setInterval(() => {
      setHintCooldownRemaining((r) => (r <= 1 ? 0 : r - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [hintCooldownRemaining])

  const startGame = useCallback(() => {
    setFoundIds(new Set())
    setAnswer('')
    setTimeSeconds(0)
    setBlinkGreenId(null)
    setBlinkOrangeId(null)
    setCurrentHint(null)
    setHintsRevealedPerCharacter({})
    setHintCooldownRemaining(0)
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
    if (hintHideTimeoutRef.current) clearTimeout(hintHideTimeoutRef.current)
    setStep('countdown')
    setCountdown(3)
  }, [])

  const indiceDelaiActivation = orderMode ? INDICE_DELAI_ACTIVATION_ORDER_SEC : INDICE_DELAI_ACTIVATION_SEC
  const indiceCooldownSec = orderMode ? INDICE_COOLDOWN_ORDER_SEC : INDICE_COOLDOWN_SEC

  const revealHintManually = () => {
    const notFound = characters.filter((p) => !foundIds.has(p.id))
    if (notFound.length === 0) {
      message.info('Tous les personnages sont déjà trouvés !')
      return
    }
    let p
    if (orderMode) {
      const byOrder = getCharactersByIdOrder()
      p = byOrder.find((c) => !foundIds.has(c.id))
      if (!p) return
    } else {
      const indicesDispo = notFound.filter((c) => {
        const hints = c.hints && Array.isArray(c.hints) ? c.hints : []
        const reveles = hintsRevealedPerCharacter[c.id] ?? 0
        return hints.length > reveles
      })
      const candidats = indicesDispo.length > 0 ? indicesDispo : notFound
      p = candidats[Math.floor(Math.random() * candidats.length)]
    }
    const hints = p.hints && Array.isArray(p.hints) ? p.hints : []
    const reveles = hintsRevealedPerCharacter[p.id] ?? 0
    const indiceTexte = hints.length > reveles ? hints[reveles] : (hints[0] ?? 'Aucun indice.')
    setCurrentHint({ personnage: p, indiceTexte })
    setHintsRevealedPerCharacter((prev) => ({ ...prev, [p.id]: reveles + 1 }))
    setHintCooldownRemaining(indiceCooldownSec)
    if (hintHideTimeoutRef.current) clearTimeout(hintHideTimeoutRef.current)
    hintHideTimeoutRef.current = setTimeout(() => {
      setCurrentHint(null)
      hintHideTimeoutRef.current = null
    }, DUREE_INDICE_SEC * 1000)
  }

  const hintAvailable = timeSeconds >= indiceDelaiActivation && hintCooldownRemaining === 0
  const hintWaitSeconds = Math.max(0, indiceDelaiActivation - timeSeconds)

  const findCharacter = (input) => {
    const s = input.trim()
    if (!s) return null
    return characters.find(
      (p) => !foundIds.has(p.id) && isAnswerCorrect(p.name, s, p.acceptedNames)
    )
  }

  const validateAnswer = () => {
    let p
    if (orderMode) {
      const byOrder = getCharactersByIdOrder()
      const nextExpected = byOrder.find((c) => !foundIds.has(c.id))
      if (!nextExpected) return
      if (!isAnswerCorrect(nextExpected.name, answer.trim(), nextExpected.acceptedNames)) {
        const alreadyFound = characters.find(
          (c) => foundIds.has(c.id) && isAnswerCorrect(c.name, answer.trim(), c.acceptedNames)
        )
        if (alreadyFound) message.warning(`${alreadyFound.name} a déjà été trouvé. Saisis dans l'ordre (prochain : N°${nextExpected.number ?? '?'}).`)
        else message.error('Ce n\'est pas le prochain combattant à saisir (ordre des numéros).')
        setAnswer('')
        return
      }
      p = nextExpected
    } else {
      p = findCharacter(answer)
    }
    if (p) {
      const newIds = new Set([...foundIds, p.id])
      setFoundIds(newIds)
      if (!orderMode) {
        if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
        setBlinkGreenId(p.id)
        blinkTimeoutRef.current = setTimeout(() => { setBlinkGreenId(null); blinkTimeoutRef.current = null }, 2000)
      }
      message.success(`${p.name} trouvé !`)
      setAnswer('')
      if (newIds.size >= TOTAL) {
        setChronoActive(false)
        addScore({
          joueur: player,
          nombreDeviné: TOTAL,
          tempsSecondes: timeSeconds,
          indicesLettres: 0,
          indicesLettresAdd: 0,
          indicesSilhouette: 0,
          date: new Date().toISOString(),
        }, orderMode)
        setStep('fin')
      }
    } else {
      setAnswer('')
      const alreadyFound = characters.find(
        (c) => foundIds.has(c.id) && isAnswerCorrect(c.name, answer.trim(), c.acceptedNames)
      )
      if (alreadyFound) {
        if (!orderMode) {
          if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
          setBlinkOrangeId(alreadyFound.id)
          blinkTimeoutRef.current = setTimeout(() => { setBlinkOrangeId(null); blinkTimeoutRef.current = null }, 2000)
        }
        message.warning(`${alreadyFound.name} a déjà été trouvé.${orderMode ? ' Saisis dans l\'ordre des numéros.' : ''}`)
      } else {
        message.error(orderMode ? 'Ce n\'est pas le prochain combattant (ordre des numéros).' : 'Aucun personnage correspondant.')
      }
    }
  }

  const giveUp = () => {
    setChronoActive(false)
    addScore({
      joueur: player,
      nombreDeviné: foundIds.size,
      tempsSecondes: timeSeconds,
      indicesLettres: 0,
      indicesLettresAdd: 0,
      indicesSilhouette: 0,
      date: new Date().toISOString(),
    }, orderMode)
    setStep('fin')
  }

  const ranking = getRanking(TOTAL, orderMode)
  const handleDeleteScore = (date) => {
    Modal.confirm({
      title: 'Supprimer ce score ?',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: () => {
        deleteScore(date, orderMode)
        setRefreshRankingKey((k) => k + 1)
        message.success('Score supprimé.')
      },
    })
  }

  const handleSaveEditScore = () => {
    if (!editScoreModal) return
    const trimmed = editScoreModal.joueur?.trim()
    if (!trimmed) {
      message.warning('Le nom du joueur ne peut pas être vide.')
      return
    }
    updateScore(editScoreModal.date, { joueur: trimmed }, orderMode)
    setRefreshRankingKey((k) => k + 1)
    setEditScoreModal(null)
    message.success('Joueur mis à jour.')
  }

  const columnsIntro = [
    { title: 'Rang', dataIndex: 'rang', width: 56 },
    { title: 'Joueur', dataIndex: 'joueur' },
    { title: 'Score', dataIndex: 'scorePct', render: (v) => `${v} %` },
    { title: 'Devinés', dataIndex: 'nombreDeviné', render: (v) => `${v} / ${TOTAL}` },
    { title: 'Temps', dataIndex: 'tempsSecondes', render: (v) => formatTime(v) },
    { title: 'Date', dataIndex: 'date', render: (d) => formatScoreDate(d), width: 140 },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditScoreModal({ date: record.date, joueur: record.joueur })} aria-label="Modifier" />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteScore(record.date)} aria-label="Supprimer" />
        </Space>
      ),
    },
  ]

  const columnsFin = [
    { title: 'Rang', dataIndex: 'rang', width: 56 },
    { title: 'Joueur', dataIndex: 'joueur' },
    { title: 'Score', dataIndex: 'scorePct', render: (v) => `${v} %` },
    { title: 'Devinés', dataIndex: 'nombreDeviné', render: (v) => `${v} / ${TOTAL}` },
    { title: 'Temps', dataIndex: 'tempsSecondes', render: (v) => formatTime(v) },
    { title: 'Date', dataIndex: 'date', render: (d) => formatScoreDate(d), width: 140 },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditScoreModal({ date: record.date, joueur: record.joueur })} aria-label="Modifier" />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteScore(record.date)} aria-label="Supprimer" />
        </Space>
      ),
    },
  ]

  if (!characters?.length) {
    return <PageLoader message="Chargement des personnages..." />
  }

  if (step === 'countdown' && countdown !== null) {
    return (
      <div className="ecris-page ecris-countdown-wrap">
        <div className="ecris-countdown">
          <span className="ecris-countdown-value">
            {countdown === 'smash' ? 'Smash !' : countdown}
          </span>
        </div>
      </div>
    )
  }

  if (step === 'intro') {
    return (
      <div className="ecris-page">
        <GameIntroCard
          title="Écris-les tous !"
          description={`Saisis le nom de tous les personnages (${TOTAL} au total).`}
          primaryLabel="Commencer"
          onPrimaryClick={startGame}
          cardClassName="ecris-card"
        >
          <Text strong block style={{ marginBottom: 8 }}>
            Choisis ton pseudo :
          </Text>
          <Radio.Group
            className="ecris-radio-joueur"
            optionType="button"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            {JOUEURS.map((j) => (
              <Radio.Button key={j} value={j}>
                {j}
              </Radio.Button>
            ))}
          </Radio.Group>
          <div className="ecris-order-mode-row">
            <Text strong>Dans l'ordre</Text>
            <Switch checked={orderMode} onChange={setOrderMode} aria-label="Mode Dans l'ordre" />
          </div>
          {orderMode && (
            <Text type="secondary" className="ecris-order-mode-hint">
              Saisis les combattants dans l'ordre des numéros. Classement dédié ci-dessous.
            </Text>
          )}
        </GameIntroCard>
        {ranking.length > 0 && (
          <Card className="ecris-card ecris-classement" title={orderMode ? 'Classement (Dans l\'ordre)' : 'Classement'}>
            <Table
              dataSource={[...ranking]
                .map((s) => ({ ...s, scorePct: scorePercentage(s.nombreDeviné, TOTAL, s.indicesLettres ?? 0, s.indicesLettresAdd ?? 0, s.indicesSilhouette ?? 0) }))
                .sort((a, b) => b.scorePct - a.scorePct || a.tempsSecondes - b.tempsSecondes)
                .map((s, i) => ({ ...s, key: s.date + i, rang: i + 1 }))}
              columns={columnsIntro}
              pagination={false}
              size="small"
            />
          </Card>
        )}
        {editScoreModal && (
          <Modal
            title="Modifier le joueur"
            open
            onOk={handleSaveEditScore}
            onCancel={() => setEditScoreModal(null)}
            okText="Enregistrer"
          >
            <Input
              value={editScoreModal.joueur}
              onChange={(e) => setEditScoreModal((m) => ({ ...m, joueur: e.target.value }))}
              placeholder="Nom du joueur"
              onPressEnter={handleSaveEditScore}
            />
          </Modal>
        )}
      </div>
    )
  }

  if (step === 'fin') {
    const lastScore = {
      joueur: player,
      nombreDeviné: foundIds.size,
      tempsSecondes: timeSeconds,
      scorePct: scorePercentage(foundIds.size, TOTAL, 0, 0, 0),
    }
    const manquants = characters.filter((p) => !foundIds.has(p.id))
    const finalRanking = getRanking(TOTAL, orderMode)

    const missingAnswersContent = (
      <div className="ecris-manquants-popover">
        <div className="ecris-manquants-grid" style={{ '--cols': Math.min(8, Math.max(1, manquants.length)) }}>
          {manquants.map((p) => {
            const src = p.filename ? getImageUrlCharacters(p.filename) : null
            const zoom = p.zoom != null ? p.zoom : 100
            const position = p.position || { top: 0, left: 0 }
            return (
              <div key={p.id} className="ecris-manquants-cell" title={p.name}>
                {src ? (
                  <div
                    className="ecris-manquants-img"
                    style={{
                      backgroundImage: `url(${src})`,
                      backgroundSize: `${zoom}%`,
                      backgroundPosition: `${position.left}% ${position.top}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                ) : (
                  <span className="ecris-manquants-nom">{p.name}</span>
                )}
                <span className="ecris-manquants-label">{p.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="ecris-page">
        <GameResultCard title="Partie terminée" onReplay={startGame} cardClassName="ecris-card">
          <div className="ecris-resultat">
            <Text strong style={{ fontSize: 18 }}>
              Score : {lastScore.scorePct} %
            </Text>
            <Text type="secondary">
              {lastScore.nombreDeviné} / {TOTAL} personnages — Temps : {formatTime(lastScore.tempsSecondes)}
              {orderMode && ' — Mode Dans l\'ordre'}
            </Text>
            {manquants.length > 0 && (
              <Popover content={missingAnswersContent} title="Combattants manquants" trigger="click" placement="bottom">
                <Button type="default" size="middle" className="ecris-btn-manquants">
                  Réponses manquantes
                </Button>
              </Popover>
            )}
          </div>
        </GameResultCard>
        <Card className="ecris-card ecris-classement" title={orderMode ? 'Classement (Dans l\'ordre)' : 'Classement'}>
          <Table
            dataSource={[...finalRanking]
              .map((s) => ({ ...s, scorePct: scorePercentage(s.nombreDeviné, TOTAL, s.indicesLettres ?? 0, s.indicesLettresAdd ?? 0, s.indicesSilhouette ?? 0) }))
              .sort((a, b) => b.scorePct - a.scorePct || a.tempsSecondes - b.tempsSecondes)
              .map((s, i) => ({ ...s, key: s.date + i, rang: i + 1 }))}
            columns={columnsFin}
            pagination={false}
            size="small"
          />
        </Card>
        {editScoreModal && (
          <Modal
            title="Modifier le joueur"
            open
            onOk={handleSaveEditScore}
            onCancel={() => setEditScoreModal(null)}
            okText="Enregistrer"
          >
            <Input
              value={editScoreModal.joueur}
              onChange={(e) => setEditScoreModal((m) => ({ ...m, joueur: e.target.value }))}
              placeholder="Nom du joueur"
              onPressEnter={handleSaveEditScore}
            />
          </Modal>
        )}
      </div>
    )
  }

  // Jeu en cours : grille fixe (ordre par numéro — 01 Mario en haut à gauche, etc.)
  const guessedCount = foundIds.size
  const charactersByIdOrder = getCharactersByIdOrder()
  const nextExpected = orderMode ? charactersByIdOrder.find((c) => !foundIds.has(c.id)) : null
  const nextExpectedId = nextExpected?.id ?? null
  const scorePct = scorePercentage(guessedCount, TOTAL, 0, 0, 0)

  return (
    <div className="ecris-page">
      <Card className="ecris-card">
        <div className="ecris-jeu-header">
          <Title level={4} style={{ margin: 0 }}>
            {player} — Score : {scorePct} %{orderMode ? ' (Dans l\'ordre)' : ''}
          </Title>
          <Text className="ecris-chrono">{formatTime(timeSeconds)}</Text>
        </div>
        <div className="ecris-grille-wrapper">
          <CharactersGrid
            characters={charactersByIdOrder}
            jeu
            foundIds={foundIds}
            blinkGreenId={orderMode ? null : blinkGreenId}
            blinkOrangeId={orderMode ? null : blinkOrangeId}
            nextExpectedId={orderMode ? nextExpectedId : null}
          />
        </div>
        <div className="ecris-jeu-input">
          <Input
            placeholder="Nom du personnage..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onPressEnter={validateAnswer}
            size="large"
            className="ecris-input"
          />
          {currentHint && (
            <div className="ecris-indice-affichage">
              <div className="ecris-indice-affichage-titre">
                <BulbOutlined /> Indice
              </div>
              <div className="ecris-indice-affichage-texte">{currentHint.indiceTexte}</div>
            </div>
          )}
          <div className="ecris-jeu-boutons-row">
            <div className="ecris-jeu-boutons-left">
              <Button type="primary" size="large" onClick={validateAnswer} disabled={!answer.trim()}>
                Valider
              </Button>
            </div>
            <div className="ecris-jeu-boutons-right">
              <div className="ecris-indice-bouton-wrap">
                {hintWaitSeconds > 0 ? (
                  <>
                    <Button size="large" disabled className="ecris-indice-btn ecris-indice-btn-disabled" style={{ borderColor: 'rgba(230, 0, 18, 0.5)' }}>
                      <span style={{ color: '#e60012' }}><BulbOutlined /> Indices — disponible dans {Math.floor(hintWaitSeconds / 60)}:{(hintWaitSeconds % 60).toString().padStart(2, '0')}</span>
                    </Button>
                    <Progress percent={Math.round(((indiceDelaiActivation - hintWaitSeconds) / indiceDelaiActivation) * 100)} size="small" showInfo={false} strokeColor="#e60012" className="ecris-indice-progress" />
                  </>
                ) : hintCooldownRemaining > 0 ? (
                  <>
                    <Button size="large" disabled className="ecris-indice-btn ecris-indice-btn-disabled" style={{ borderColor: 'rgba(230, 0, 18, 0.5)' }}>
                      <span style={{ color: '#e60012' }}><BulbOutlined /> Indices — prochain dans 0:{(hintCooldownRemaining).toString().padStart(2, '0')}</span>
                    </Button>
                    <Progress percent={Math.round(((indiceCooldownSec - hintCooldownRemaining) / indiceCooldownSec) * 100)} size="small" showInfo={false} status="active" strokeColor="#e60012" className="ecris-indice-progress" />
                  </>
                ) : (
                  <Button size="large" onClick={revealHintManually} icon={<BulbOutlined />}>
                    Indices
                  </Button>
                )}
              </div>
              <Button size="large" onClick={giveUp}>
                Abandonner
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
