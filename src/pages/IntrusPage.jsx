import { useState, useCallback, useMemo } from 'react'
import { Typography, Card, Button, Progress, Table, Radio, message } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { urlMiniature } from '../data/images'
import {
  genererPartie,
  enigmesDisponibles,
  TAILLES_PLATEAU,
  TAILLE_PLATEAU_DEFAUT,
} from '../utils/intrusManches'
import { addScore, getRanking, getBestScore, deleteScore, formatScoreDate } from '../utils/miniJeuxStorage'
import { getJoueurActuel } from '../utils/joueursStorage'
import ChoixPseudo from '../components/ChoixPseudo'
import GameIntroCard from '../components/GameIntroCard'
import GameResultCard from '../components/GameResultCard'
import PageLoader from '../components/PageLoader'
import './IntrusPage.css'

const { Title, Text } = Typography

const JEU = 'intrus'
const NB_MANCHES = 10
const COULEURS_JAUGE = { '0%': '#e60012', '100%': '#87d068' }

export default function IntrusPage() {
  const [step, setStep] = useState('intro') // intro | jeu | fin
  const [player, setPlayer] = useState(getJoueurActuel)
  const [manches, setManches] = useState([])
  const [mancheIndex, setMancheIndex] = useState(0)
  const [choixId, setChoixId] = useState(null)
  const [score, setScore] = useState(0)
  const [taillePlateau, setTaillePlateau] = useState(TAILLE_PLATEAU_DEFAUT)
  const [rafraichirClassement, setRafraichirClassement] = useState(0)

  const nbEnigmes = useMemo(() => enigmesDisponibles(taillePlateau), [taillePlateau])
  const meilleur = useMemo(
    () => getBestScore(JEU, player),
    // Le meilleur score change quand une partie est enregistrée ou supprimée.
    [player, rafraichirClassement]
  )

  const startGame = useCallback(() => {
    const partie = genererPartie(NB_MANCHES, taillePlateau)
    if (partie.length === 0) {
      message.warning('Aucune énigme disponible pour ce nombre de cartes.')
      return
    }
    setManches(partie)
    setMancheIndex(0)
    setChoixId(null)
    setScore(0)
    setStep('jeu')
  }, [taillePlateau])

  const manche = manches[mancheIndex]
  const revele = choixId !== null

  const repondre = useCallback(
    (id) => {
      if (revele) return
      setChoixId(id)
      if (id === manche.intrusId) setScore((s) => s + 1)
    },
    [revele, manche]
  )

  const suivante = useCallback(() => {
    if (mancheIndex + 1 >= manches.length) {
      addScore(JEU, { joueur: player, score, total: manches.length })
      setRafraichirClassement((k) => k + 1)
      setStep('fin')
    } else {
      setMancheIndex((i) => i + 1)
      setChoixId(null)
    }
  }, [mancheIndex, manches.length, player, score])

  const supprimerScore = useCallback((date) => {
    deleteScore(JEU, date)
    setRafraichirClassement((k) => k + 1)
  }, [])

  if (nbEnigmes === 0) {
    return <PageLoader message="Chargement des combattants..." />
  }

  if (step === 'intro') {
    return (
      <div className="intrus-page page-centree">
        <GameIntroCard
          title="Trouve l'intrus"
          description={`Tous les combattants d'une manche partagent un trait — arme, pouvoir, corpulence, espèce… — sauf un. La catégorie est annoncée, à toi de trouver lequel dénote. ${NB_MANCHES} manches.`}
          primaryLabel="Commencer"
          onPrimaryClick={startGame}
          cardClassName="intrus-card"
        >
          <ChoixPseudo value={player} onChange={setPlayer} style={{ marginBottom: 20 }} />
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Combattants par manche :
          </Text>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={taillePlateau}
            onChange={(e) => setTaillePlateau(e.target.value)}
          >
            {TAILLES_PLATEAU.map((n) => (
              <Radio.Button key={n} value={n}>
                {n}
              </Radio.Button>
            ))}
          </Radio.Group>
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: '0.85rem' }}>
            {taillePlateau - 1} partagent le trait, 1 dénote — {Math.round(100 / taillePlateau)} % de
            chance au hasard.
            <br />
            {nbEnigmes} critères possibles à cette taille, {NB_MANCHES} tirés par partie.
          </Text>
          {meilleur != null && (
            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              Ton meilleur score : {meilleur} / {NB_MANCHES}
            </Text>
          )}
        </GameIntroCard>
      </div>
    )
  }

  if (step === 'fin') {
    const pct = manches.length ? Math.round((score / manches.length) * 100) : 0
    return (
      <div className="intrus-page page-centree">
        <GameResultCard title="Résultat" onReplay={startGame} cardClassName="intrus-card">
          <div className="intrus-resultat">
            <Progress type="circle" percent={pct} strokeColor={COULEURS_JAUGE} />
            <Text strong className="intrus-resultat-score">
              {player} : {score} / {manches.length} intrus démasqués
            </Text>
          </div>
        </GameResultCard>
        <ClassementIntrus
          key={rafraichirClassement}
          nbManches={NB_MANCHES}
          onDelete={supprimerScore}
        />
      </div>
    )
  }

  const progression = ((mancheIndex + (revele ? 1 : 0)) / manches.length) * 100

  return (
    <div className="intrus-page page-centree">
      <Progress percent={Math.round(progression)} strokeColor={COULEURS_JAUGE} />
      <Card className="intrus-card">
        <div className="intrus-entete">
          <Title level={4} type="secondary" style={{ margin: 0 }}>
            Manche {mancheIndex + 1} / {manches.length}
          </Title>
          <Text className="intrus-score-courant">{score} pt{score !== 1 ? 's' : ''}</Text>
        </div>

        <div className="intrus-consigne">
          <Text strong className="intrus-question">
            Lequel dénote parmi les {manche.cartes.length} ?
          </Text>
          {/* La catégorie oriente l'attention sans donner la réponse : sans elle,
              plusieurs traits pourraient départager 7 combattants contre 1. */}
          <span className="intrus-categorie">{manche.categorie}</span>
        </div>

        {/* 6 cartes se répartissent mieux sur 3 colonnes (2×3) que sur 4 (4+2). */}
        <div className="intrus-cartes" style={{ '--cols': manche.cartes.length === 6 ? 3 : 4 }}>
          {manche.cartes.map((p) => {
            const estIntrus = p.id === manche.intrusId
            const estChoisi = p.id === choixId
            const classes = ['intrus-carte']
            if (revele) {
              classes.push('intrus-carte-revelee')
              if (estIntrus) classes.push('intrus-carte-bonne')
              else if (estChoisi) classes.push('intrus-carte-mauvaise')
            }
            return (
              <button
                key={p.id}
                type="button"
                className={classes.join(' ')}
                onClick={() => repondre(p.id)}
                disabled={revele}
                aria-label={p.name}
              >
                <span
                  className="intrus-carte-img"
                  style={{ backgroundImage: `url("${urlMiniature(p.filename)}")` }}
                />
                <span className="intrus-carte-nom">{p.name}</span>
                {revele && estIntrus && <CheckOutlined className="intrus-carte-marque" />}
                {revele && estChoisi && !estIntrus && <CloseOutlined className="intrus-carte-marque" />}
              </button>
            )
          })}
        </div>

        {revele && (
          <div className="intrus-retour">
            <div
              className={`intrus-verdict ${choixId === manche.intrusId ? 'intrus-verdict-bon' : 'intrus-verdict-mauvais'}`}
            >
              {choixId === manche.intrusId ? <CheckOutlined /> : <CloseOutlined />}
              <span>{choixId === manche.intrusId ? 'Bien vu !' : 'Raté'}</span>
            </div>
            <Text type="secondary">
              Les {manche.cartes.length - 1} autres <Text strong>{manche.critere}</Text>.
            </Text>
          </div>
        )}

        <div className="intrus-actions">
          <Button type="primary" size="large" onClick={suivante} disabled={!revele}>
            {mancheIndex + 1 >= manches.length ? 'Voir le résultat' : 'Manche suivante'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

/** Classement des parties enregistrées localement. */
function ClassementIntrus({ nbManches, onDelete }) {
  const classement = getRanking(JEU)
  if (classement.length === 0) return null

  const colonnes = [
    { title: 'Rang', dataIndex: 'rang', width: 64 },
    { title: 'Joueur', dataIndex: 'joueur' },
    {
      title: 'Score',
      dataIndex: 'score',
      render: (v, record) => `${v} / ${record.total ?? nbManches}`,
    },
    { title: 'Date', dataIndex: 'date', render: formatScoreDate, width: 160 },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          danger
          onClick={() => onDelete(record.date)}
          aria-label="Supprimer"
        >
          ×
        </Button>
      ),
    },
  ]

  return (
    <Card className="intrus-card intrus-classement" title="Classement">
      <Table
        dataSource={classement.map((e, i) => ({ ...e, key: e.date, rang: i + 1 }))}
        columns={colonnes}
        pagination={false}
        size="small"
      />
    </Card>
  )
}
