import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Typography, Card, Button, Input, Progress, Table, message } from 'antd'
import { RedoOutlined } from '@ant-design/icons'
import { getCharactersByIdOrder } from '../data'
import { tousLesCriteres } from '../data/ecrisCriteres'
import { isAnswerCorrect } from '../utils/reponseUtils'
import { avancerFile, tirerPartie, requisPour } from '../utils/ecrisCriteresFile'
import { addScore, getRanking, deleteScore, formatScoreDate, parTauxDeReussite } from '../utils/miniJeuxStorage'
import CharactersGrid from './GrillePersonnages'
import GameResultCard from './GameResultCard'

const { Title, Text } = Typography

const JEU = 'ecris-criteres'
/** Clé partagée : les messages se remplacent au lieu de s'empiler devant la consigne. */
const CLE_MESSAGE = 'ecris-variant'
const COULEURS_JAUGE = { '0%': '#e60012', '100%': '#87d068' }

function formatTemps(secondes) {
  const m = Math.floor(secondes / 60)
  const s = Math.floor(secondes % 60)
  return `${m} min ${String(s).padStart(2, '0')} s`
}

/**
 * Variant « Par critère » d'« Écris-les tous ! ».
 *
 * Une consigne, **un** combattant à citer, la consigne suivante. Un critère qu'on
 * ne trouve pas se passe et repart en fin de file : on y revient une fois les
 * autres traités, et c'est seulement dans ce rattrapage que le bouton
 * « Abandonner » apparaît — avant, il n'y a rien à abandonner puisque tout
 * critère passé sera reproposé.
 *
 * Un même combattant ne peut servir qu'une fois : sans cette règle, Mario
 * validerait à lui seul « univers Super Mario », « êtres humains », « tête
 * couverte », « roster de 1999 » et « numéro inférieur à 10 ».
 *
 * @param {string} player - pseudo, pour le classement
 * @param {() => void} onRejouer - retour à l'intro du jeu
 */
export default function EcrisCriteresJeu({ player, onRejouer }) {
  const charactersByIdOrder = useMemo(getCharactersByIdOrder, [])

  const [depart] = useState(() => tirerPartie(tousLesCriteres()))
  const total = depart.length
  /** File de critères. `rattrapage` marque ceux qui ont déjà été passés une fois. */
  const [file, setFile] = useState(depart)
  /**
   * Objectif du critère courant, figé à sa présentation (cf. `requisPour`), et
   * combattants déjà cités pour lui.
   */
  const [requis, setRequis] = useState(() => depart[0]?.aCiter ?? 0)
  const [trouvesDuCritere, setTrouvesDuCritere] = useState(() => new Set())
  const [foundIds, setFoundIds] = useState(() => new Set())
  const [blinkGreenId, setBlinkGreenId] = useState(null)
  const [reponse, setReponse] = useState('')
  const [temps, setTemps] = useState(0)
  const [reussis, setReussis] = useState(0)
  const [epuises, setEpuises] = useState(0)
  const [fin, setFin] = useState(null) // null | 'complet' | 'abandon'

  const [rafraichir, setRafraichir] = useState(0)
  const inputRef = useRef(null)
  const blinkRef = useRef(null)

  const courant = file[0] ?? null
  const enRattrapage = courant?.rattrapage === true

  useEffect(() => {
    if (fin) return
    const t = setInterval(() => setTemps((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [fin])

  useEffect(() => {
    if (!fin) inputRef.current?.focus()
  }, [fin, courant])

  useEffect(() => () => { if (blinkRef.current) clearTimeout(blinkRef.current) }, [])

  const terminer = useCallback((issue, nbReussis) => {
    setFin(issue)
    addScore(JEU, { joueur: player, score: nbReussis, total })
    setRafraichir((k) => k + 1)
  }, [player, total])

  /**
   * Avance dans la file.
   *
   * Tout est calculé ici, de façon synchrone : le double appel des updaters et des
   * effets en mode strict aurait sinon fait sauter deux critères ou enregistré le
   * score deux fois.
   *
   * @param {boolean} renvoyer - remettre le critère courant en fin de file
   * @param {boolean} reussite - le critère vient d'être validé
   * @param {Set<number>} found - combattants déjà cités, après cette réponse
   */
  const avancer = useCallback((renvoyer, reussite, found) => {
    const { file: suivante, ecartes } = avancerFile(file, found, renvoyer)

    const nbReussis = reussis + (reussite ? 1 : 0)
    if (reussite) setReussis(nbReussis)
    if (ecartes > 0) setEpuises((n) => n + ecartes)
    setReponse('')
    setFile(suivante)
    setTrouvesDuCritere(new Set())
    // Objectif du nouveau critère, calculé une seule fois ici.
    setRequis(suivante.length > 0 ? requisPour(suivante[0], found) : 0)
    if (suivante.length === 0) terminer('complet', nbReussis)
  }, [file, reussis, terminer])

  const valider = useCallback(() => {
    const saisie = reponse.trim()
    if (!saisie || !courant || fin) return

    const trouve = courant.critere.acceptes.find(
      (p) => isAnswerCorrect(p.name, saisie, p.acceptedNames)
    )
    if (trouve) {
      if (foundIds.has(trouve.id)) {
        // Distinguer les deux cas : sur un critère qui demande plusieurs
        // combattants, se répéter n'est pas la même erreur que réutiliser un nom
        // déjà servi ailleurs.
        message.warning({
          content: trouvesDuCritere.has(trouve.id)
            ? `${trouve.name} a déjà été cité pour ce critère.`
            : `${trouve.name} a déjà été utilisé pour un autre critère.`,
          key: CLE_MESSAGE,
        })
        setReponse('')
        return
      }
      const found = new Set(foundIds).add(trouve.id)
      setFoundIds(found)
      setBlinkGreenId(trouve.id)
      if (blinkRef.current) clearTimeout(blinkRef.current)
      blinkRef.current = setTimeout(() => setBlinkGreenId(null), 2000)

      const faits = trouvesDuCritere.size + 1
      if (faits >= requis) {
        message.success({ content: `${trouve.name} — critère validé !`, key: CLE_MESSAGE })
        avancer(false, true, found)
      } else {
        setTrouvesDuCritere(new Set(trouvesDuCritere).add(trouve.id))
        setReponse('')
        const reste = requis - faits
        message.success({ content: `${trouve.name} — encore ${reste} combattant${reste > 1 ? 's' : ''}.`, key: CLE_MESSAGE })
      }
      return
    }

    setReponse('')
    const existe = charactersByIdOrder.find((p) => isAnswerCorrect(p.name, saisie, p.acceptedNames))
    if (!existe) {
      message.error({ content: 'Aucun combattant ne correspond à ce nom.', key: CLE_MESSAGE })
    } else if (foundIds.has(existe.id)) {
      message.warning({ content: `${existe.name} a déjà été utilisé pour un autre critère.`, key: CLE_MESSAGE })
    } else {
      message.error({ content: `${existe.name} ne correspond pas à ce critère.`, key: CLE_MESSAGE })
    }
  }, [reponse, courant, fin, foundIds, trouvesDuCritere, requis, charactersByIdOrder, avancer])

  const passer = useCallback(() => {
    if (!courant || fin) return
    message.info({ content: 'Critère mis de côté, il reviendra à la fin.', key: CLE_MESSAGE })
    avancer(true, false, foundIds)
  }, [courant, fin, foundIds, avancer])

  if (fin) {
    const pct = total ? Math.round((reussis / total) * 100) : 0
    return (
      <div className="ecris-page page-centree">
        <GameResultCard
          title={fin === 'complet' ? 'Tous les critères traités !' : 'Partie abandonnée'}
          onReplay={onRejouer}
          cardClassName="ecris-card"
        >
          <div className="ecris-resultat">
            <Progress type="circle" percent={pct} strokeColor={COULEURS_JAUGE} />
            <Text strong style={{ fontSize: 18 }}>
              {player} — {reussis} / {total} critères validés
            </Text>
            <Text type="secondary">
              {foundIds.size} combattants cités — Temps : {formatTemps(temps)}
              {epuises > 0 && ` — ${epuises} critère${epuises > 1 ? 's' : ''} sans réponse disponible`}
            </Text>
          </div>
        </GameResultCard>
        <ClassementCriteres key={rafraichir} onDelete={(d) => { deleteScore(JEU, d); setRafraichir((k) => k + 1) }} />
      </div>
    )
  }

  if (!courant) return null

  const traites = total - file.length
  const exemples = courant.critere.attendus
    .filter((p) => !foundIds.has(p.id))
    .slice(0, 3)
    .map((p) => p.name)

  return (
    <div className="ecris-page page-centree">
      <Card className="ecris-card">
        <div className="ecris-jeu-header">
          <Title level={4} style={{ margin: 0 }}>
            {player} — {reussis} / {total} critères
          </Title>
          <Text className="ecris-chrono">{formatTemps(temps)}</Text>
        </div>

        <Progress
          percent={total ? Math.round((traites / total) * 100) : 0}
          showInfo={false}
          strokeColor={COULEURS_JAUGE}
        />

        <div className={`ecris-criteres-consigne ${enRattrapage ? 'ecris-criteres-consigne-rattrapage' : ''}`}>
          {enRattrapage && (
            <span className="ecris-criteres-badge-rattrapage">
              <RedoOutlined /> Rattrapage
            </span>
          )}
          {/* Les instructions sont au pluriel (« combattants qui … ») : ce préfixe
              évite le « un combattant parmi les combattants ». */}
          <Text strong className="ecris-criteres-instruction">
            {requis === 1 ? 'Cite un des' : `Cite ${requis} des`} {courant.critere.instruction}
          </Text>
          {requis > 1 && (
            <div className="ecris-criteres-pastilles" aria-label={`${trouvesDuCritere.size} sur ${requis}`}>
              {Array.from({ length: requis }, (_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`ecris-criteres-pastille ${i < trouvesDuCritere.size ? 'ecris-criteres-pastille-ok' : ''}`}
                />
              ))}
            </div>
          )}
          <Text type="secondary" className="ecris-criteres-restants">
            {file.length} critère{file.length > 1 ? 's' : ''} restant{file.length > 1 ? 's' : ''}
            {exemples.length > 0 && enRattrapage && ` — au choix : ${exemples.join(', ')}`}
          </Text>
        </div>

        <div className="ecris-grille-wrapper">
          <CharactersGrid
            characters={charactersByIdOrder}
            jeu
            foundIds={foundIds}
            blinkGreenId={blinkGreenId}
          />
        </div>

        <div className="ecris-jeu-input">
          <Input
            ref={inputRef}
            placeholder="Nom du combattant..."
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            onPressEnter={valider}
            size="large"
            className="ecris-input"
          />
          <div className="ecris-jeu-boutons-row">
            <Button type="primary" size="large" onClick={valider} disabled={!reponse.trim()}>
              Valider
            </Button>
            <div className="ecris-criteres-actions">
              <Button size="large" onClick={passer}>
                Passer
              </Button>
              {/* Rien à abandonner avant le rattrapage : tout critère passé revient. */}
              {enRattrapage && (
                <Button size="large" danger onClick={() => terminer('abandon', reussis)}>
                  Abandonner
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

/** Classement du variant, en local. */
function ClassementCriteres({ onDelete }) {
  // Le nombre de critères varie d'une partie à l'autre : c'est le taux de
  // réussite qui les rend comparables, pas le score brut.
  const classement = getRanking(JEU, parTauxDeReussite)
  if (classement.length === 0) return null
  const colonnes = [
    { title: 'Rang', dataIndex: 'rang', width: 64 },
    { title: 'Joueur', dataIndex: 'joueur' },
    { title: 'Critères', dataIndex: 'score', render: (v, r) => `${v} / ${r.total ?? '—'}` },
    {
      title: 'Réussite',
      key: 'taux',
      width: 96,
      render: (_, r) => (r.total ? `${Math.round((r.score / r.total) * 100)} %` : '—'),
    },
    { title: 'Date', dataIndex: 'date', render: formatScoreDate, width: 160 },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, r) => (
        <Button type="text" size="small" danger onClick={() => onDelete(r.date)} aria-label="Supprimer">×</Button>
      ),
    },
  ]
  return (
    <Card className="ecris-card ecris-classement" title="Classement (Par critère)">
      <Table
        dataSource={classement.map((e, i) => ({ ...e, key: e.date, rang: i + 1 }))}
        columns={colonnes}
        pagination={false}
        size="small"
      />
    </Card>
  )
}
