import { useState, useCallback, useMemo } from 'react'
import { Typography, Card, Button, Table, message } from 'antd'
import { CheckOutlined, CloseOutlined, FireOutlined } from '@ant-design/icons'
import { urlMiniature } from '../data/images'
import { genererDuel, fourchettePourSerie } from '../utils/plusAncienManches'
import { addScore, getRanking, getBestScore, deleteScore, formatScoreDate } from '../utils/miniJeuxStorage'
import { getJoueurActuel } from '../utils/joueursStorage'
import ChoixPseudo from '../components/ChoixPseudo'
import GameIntroCard from '../components/GameIntroCard'
import GameResultCard from '../components/GameResultCard'
import './PlusAncienPage.css'

const { Title, Text } = Typography

const JEU = 'plus-ancien'

export default function PlusAncienPage() {
  const [step, setStep] = useState('intro') // intro | jeu | fin
  const [player, setPlayer] = useState(getJoueurActuel)
  const [duel, setDuel] = useState(null)
  const [choixId, setChoixId] = useState(null)
  const [serie, setSerie] = useState(0)
  const [recordBattu, setRecordBattu] = useState(false)
  const [rafraichirClassement, setRafraichirClassement] = useState(0)

  const meilleur = useMemo(
    () => getBestScore(JEU, player),
    [player, rafraichirClassement]
  )

  const tirerDuel = useCallback((serieEnCours, idsAEviter) => {
    return genererDuel(fourchettePourSerie(serieEnCours), idsAEviter)
  }, [])

  const startGame = useCallback(() => {
    const premier = tirerDuel(0, [])
    if (!premier) {
      message.warning('Pas assez de dates de sortie pour lancer une partie.')
      return
    }
    setDuel(premier)
    setChoixId(null)
    setSerie(0)
    setStep('jeu')
  }, [tirerDuel])

  const revele = choixId !== null
  const correct = revele && duel && choixId === duel.plusAncienId

  const repondre = useCallback(
    (id) => {
      if (revele || !duel) return
      setChoixId(id)
      if (id === duel.plusAncienId) setSerie((s) => s + 1)
    },
    [revele, duel]
  )

  const terminer = useCallback(() => {
    // Le record se juge avant l'enregistrement : après, `getBestScore` inclut la
    // partie qui vient de finir et toute égalisation passerait pour un record.
    setRecordBattu(serie > 0 && serie > (getBestScore(JEU, player) ?? -1))
    addScore(JEU, { joueur: player, score: serie })
    setRafraichirClassement((k) => k + 1)
    setStep('fin')
  }, [player, serie])

  const continuer = useCallback(() => {
    const suivant = tirerDuel(serie, [duel.gauche.id, duel.droite.id])
    if (!suivant) {
      // Ne devrait pas arriver (l'écart minimum descend jusqu'à 1 an), mais mieux
      // vaut clore proprement la partie que rester bloqué sur un duel vide.
      terminer()
      return
    }
    setDuel(suivant)
    setChoixId(null)
  }, [serie, duel, tirerDuel, terminer])

  const supprimerScore = useCallback((date) => {
    deleteScore(JEU, date)
    setRafraichirClassement((k) => k + 1)
  }, [])

  if (step === 'intro') {
    return (
      <div className="ancien-page page-centree">
        <GameIntroCard
          title="Le plus ancien"
          description="Deux combattants, une question : lequel est apparu en premier dans un jeu vidéo ? La partie s'arrête à la première erreur, et les duels se resserrent à mesure que ta série s'allonge."
          primaryLabel="Commencer"
          onPrimaryClick={startGame}
          cardClassName="ancien-card"
        >
          <ChoixPseudo value={player} onChange={setPlayer} style={{ marginBottom: 16 }} />
          {meilleur != null && (
            <Text type="secondary">
              Ta meilleure série : {meilleur} bonne{meilleur !== 1 ? 's' : ''} réponse{meilleur !== 1 ? 's' : ''}
            </Text>
          )}
        </GameIntroCard>
      </div>
    )
  }

  if (step === 'fin') {
    return (
      <div className="ancien-page page-centree">
        <GameResultCard title="Partie terminée" onReplay={startGame} cardClassName="ancien-card">
          <div className="ancien-resultat">
            <div className="ancien-resultat-serie">
              <FireOutlined />
              <span>{serie}</span>
            </div>
            <Text strong className="ancien-resultat-texte">
              {player} — {serie} bonne{serie !== 1 ? 's' : ''} réponse{serie !== 1 ? 's' : ''} d'affilée
            </Text>
            {recordBattu && (
              <Text className="ancien-resultat-record">Nouveau record personnel !</Text>
            )}
          </div>
        </GameResultCard>
        <ClassementPlusAncien key={rafraichirClassement} onDelete={supprimerScore} />
      </div>
    )
  }

  const { ecartMax } = fourchettePourSerie(serie)

  return (
    <div className="ancien-page page-centree">
      <Card className="ancien-card">
        <div className="ancien-entete">
          <Title level={4} type="secondary" style={{ margin: 0 }}>
            Lequel est apparu en premier ?
          </Title>
          <span className="ancien-serie" title="Bonnes réponses d'affilée">
            <FireOutlined /> {serie}
          </span>
        </div>

        <div className="ancien-duel">
          {[duel.gauche, duel.droite].map((p) => {
            const estPlusAncien = p.id === duel.plusAncienId
            const estChoisi = p.id === choixId
            const classes = ['ancien-choix']
            if (revele) {
              classes.push('ancien-choix-revele')
              if (estPlusAncien) classes.push('ancien-choix-bon')
              else if (estChoisi) classes.push('ancien-choix-mauvais')
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
                  className="ancien-choix-img"
                  style={{ backgroundImage: `url("${urlMiniature(p.filename)}")` }}
                />
                <span className="ancien-choix-nom">{p.name}</span>
                <span className="ancien-choix-serie">{p.series}</span>
                {/* L'année n'apparaît qu'après réponse : c'est la réponse. */}
                <span className="ancien-choix-annee">{revele ? p.annee : '????'}</span>
              </button>
            )
          })}
        </div>

        {revele ? (
          <div className="ancien-retour">
            <div className={`ancien-verdict ${correct ? 'ancien-verdict-bon' : 'ancien-verdict-mauvais'}`}>
              {correct ? <CheckOutlined /> : <CloseOutlined />}
              <span>{correct ? `Bien vu ! Série de ${serie}` : 'Raté — la partie s\'arrête ici'}</span>
            </div>
            {correct ? (
              <Button type="primary" size="large" onClick={continuer}>
                Duel suivant
              </Button>
            ) : (
              <Button type="primary" size="large" onClick={terminer}>
                Voir le résultat
              </Button>
            )}
          </div>
        ) : (
          <Text type="secondary" className="ancien-indice-ecart">
            {ecartMax > 15
              ? 'Duel large : plus de dix ans séparent les deux.'
              : ecartMax > 5
                ? `Ça se resserre : au plus ${ecartMax} ans d'écart.`
                : `Duel serré : ${ecartMax} ans d'écart au maximum.`}
          </Text>
        )}
      </Card>
    </div>
  )
}

/** Classement des meilleures séries enregistrées localement. */
function ClassementPlusAncien({ onDelete }) {
  const classement = getRanking(JEU)
  if (classement.length === 0) return null

  const colonnes = [
    { title: 'Rang', dataIndex: 'rang', width: 64 },
    { title: 'Joueur', dataIndex: 'joueur' },
    { title: 'Série', dataIndex: 'score' },
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
    <Card className="ancien-card ancien-classement" title="Meilleures séries">
      <Table
        dataSource={classement.map((e, i) => ({ ...e, key: e.date, rang: i + 1 }))}
        columns={colonnes}
        pagination={false}
        size="small"
      />
    </Card>
  )
}
