import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Typography, Card, Button, Input, Progress, Table, message } from 'antd'
import { getCharactersByIdOrder } from '../data'
import { isAnswerCorrect } from '../utils/reponseUtils'
import { addScore, getRanking, deleteScore, formatScoreDate } from '../utils/miniJeuxStorage'
import CharactersGrid from './GrillePersonnages'
import GameResultCard from './GameResultCard'

const { Title, Text } = Typography

const JEU = 'ecris-jauge'
/** Clé partagée : les messages se remplacent au lieu de s'empiler devant la consigne. */
const CLE_MESSAGE = 'ecris-variant'
/** Points de départ de la jauge. */
export const JAUGE_DEPART = 100

function formatTemps(secondes) {
  const m = Math.floor(secondes / 60)
  const s = Math.floor(secondes % 60)
  return `${m} min ${String(s).padStart(2, '0')} s`
}

/**
 * Variant « Jauge » d'« Écris-les tous ! ».
 *
 * On cite les combattants dans l'ordre des identifiants. Citer hors de l'ordre
 * n'est pas interdit : le combattant est bien validé, mais la jauge perd l'écart
 * de positions entre l'attendu et le cité. À zéro, la partie est perdue.
 *
 * Contrairement au mode « Dans l'ordre » qui refuse sèchement, ici un trou de
 * mémoire se paie sans bloquer.
 *
 * @param {string} player - pseudo, pour le classement
 * @param {() => void} onRejouer - retour à l'intro du jeu
 */
export default function EcrisJaugeJeu({ player, onRejouer }) {
  const ordre = useMemo(getCharactersByIdOrder, [])
  /** id -> position dans l'ordre, pour calculer l'écart en O(1). */
  const positions = useMemo(() => new Map(ordre.map((p, i) => [p.id, i])), [ordre])

  const [foundIds, setFoundIds] = useState(() => new Set())
  const [jauge, setJauge] = useState(JAUGE_DEPART)
  const [reponse, setReponse] = useState('')
  const [temps, setTemps] = useState(0)
  const [fin, setFin] = useState(null) // null | 'gagne' | 'perdu'
  const [blinkGreenId, setBlinkGreenId] = useState(null)
  const [blinkOrangeId, setBlinkOrangeId] = useState(null)
  const [dernierMalus, setDernierMalus] = useState(null)
  const [rafraichir, setRafraichir] = useState(0)

  const inputRef = useRef(null)
  const blinkRef = useRef(null)

  // Prochain à citer : le premier non trouvé dans l'ordre.
  const attendu = useMemo(() => ordre.find((p) => !foundIds.has(p.id)) ?? null, [ordre, foundIds])

  useEffect(() => {
    if (fin) return
    const t = setInterval(() => setTemps((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [fin])

  useEffect(() => {
    if (!fin) inputRef.current?.focus()
  }, [fin])

  useEffect(() => () => { if (blinkRef.current) clearTimeout(blinkRef.current) }, [])

  const clignoter = useCallback((id, couleur) => {
    if (blinkRef.current) clearTimeout(blinkRef.current)
    if (couleur === 'orange') { setBlinkOrangeId(id); setBlinkGreenId(null) }
    else { setBlinkGreenId(id); setBlinkOrangeId(null) }
    blinkRef.current = setTimeout(() => { setBlinkGreenId(null); setBlinkOrangeId(null) }, 2000)
  }, [])

  const terminer = useCallback((issue, pointsRestants, nbTrouves) => {
    setFin(issue)
    addScore(JEU, { joueur: player, score: pointsRestants, total: nbTrouves })
    setRafraichir((k) => k + 1)
  }, [player])

  const valider = useCallback(() => {
    const saisie = reponse.trim()
    if (!saisie || !attendu || fin) return
    setReponse('')

    const cible = ordre.find((p) => isAnswerCorrect(p.name, saisie, p.acceptedNames))
    if (!cible) {
      message.error({ content: 'Aucun combattant ne correspond à ce nom.', key: CLE_MESSAGE })
      return
    }
    if (foundIds.has(cible.id)) {
      message.warning({ content: `${cible.name} a déjà été cité.`, key: CLE_MESSAGE })
      clignoter(cible.id, 'orange')
      return
    }

    // Le cité est toujours validé : c'est la jauge qui encaisse le désordre.
    const suivants = new Set(foundIds).add(cible.id)
    setFoundIds(suivants)

    const ecart = Math.abs(positions.get(cible.id) - positions.get(attendu.id))
    if (ecart === 0) {
      setDernierMalus(null)
      clignoter(cible.id, 'vert')
      if (suivants.size === ordre.length) terminer('gagne', jauge, suivants.size)
      return
    }

    const restant = jauge - ecart
    setJauge(Math.max(0, restant))
    // Le nom du combattant attendu n'apparaît jamais : l'annoncer donnerait la
    // réponse que le joueur est justement en train de chercher. L'écart, lui, doit
    // rester visible pour que le malus soit compréhensible.
    setDernierMalus({ nom: cible.name, ecart })
    clignoter(cible.id, 'orange')
    message.error({ content: `${cible.name} n'était pas le prochain — ${ecart} point${ecart > 1 ? 's' : ''}.`, key: CLE_MESSAGE })

    if (restant <= 0) terminer('perdu', 0, suivants.size)
    else if (suivants.size === ordre.length) terminer('gagne', restant, suivants.size)
  }, [reponse, attendu, fin, ordre, foundIds, positions, jauge, clignoter, terminer])

  if (fin) {
    const gagne = fin === 'gagne'
    return (
      <div className="ecris-page page-centree">
        <GameResultCard
          title={gagne ? 'Roster complété !' : 'Jauge épuisée'}
          onReplay={onRejouer}
          cardClassName="ecris-card"
        >
          <div className="ecris-resultat">
            <Progress
              type="circle"
              percent={Math.round((jauge / JAUGE_DEPART) * 100)}
              format={() => `${jauge} pts`}
              strokeColor={gagne ? '#87d068' : '#e60012'}
            />
            <Text strong style={{ fontSize: 18 }}>
              {player} — {foundIds.size} / {ordre.length} combattants
            </Text>
            <Text type="secondary">
              Jauge restante : {jauge} / {JAUGE_DEPART} — Temps : {formatTemps(temps)}
            </Text>
          </div>
        </GameResultCard>
        <ClassementJauge key={rafraichir} onDelete={(d) => { deleteScore(JEU, d); setRafraichir((k) => k + 1) }} />
      </div>
    )
  }

  const pctJauge = Math.round((jauge / JAUGE_DEPART) * 100)

  return (
    <div className="ecris-page page-centree">
      <Card className="ecris-card">
        <div className="ecris-jeu-header">
          <Title level={4} style={{ margin: 0 }}>
            {player} — {foundIds.size} / {ordre.length}
          </Title>
          <Text className="ecris-chrono">{formatTemps(temps)}</Text>
        </div>

        <div className="ecris-jauge-bloc">
          <div className="ecris-jauge-ligne">
            <Text strong>Jauge</Text>
            <Text strong className={`ecris-jauge-valeur ${jauge <= 25 ? 'ecris-jauge-valeur-critique' : ''}`}>
              {jauge} pts
            </Text>
          </div>
          <Progress
            percent={pctJauge}
            showInfo={false}
            strokeColor={jauge <= 25 ? '#e60012' : jauge <= 60 ? '#faad14' : '#87d068'}
          />
          {dernierMalus ? (
            <Text type="secondary" className="ecris-jauge-message">
              {dernierMalus.nom} était {dernierMalus.ecart} position{dernierMalus.ecart > 1 ? 's' : ''} trop
              loin. Le combattant attendu n'a pas changé.
            </Text>
          ) : (
            <Text type="secondary" className="ecris-jauge-message">
              Citer hors de l'ordre est accepté, mais coûte l'écart en points.
            </Text>
          )}
        </div>

        <div className="ecris-grille-wrapper">
          <CharactersGrid
            characters={ordre}
            jeu
            foundIds={foundIds}
            blinkGreenId={blinkGreenId}
            blinkOrangeId={blinkOrangeId}
            nextExpectedId={attendu?.id ?? null}
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
            <Button size="large" onClick={() => terminer('perdu', jauge, foundIds.size)}>
              Abandonner
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/** Classement du variant : meilleure jauge restante. */
function ClassementJauge({ onDelete }) {
  const classement = getRanking(JEU)
  if (classement.length === 0) return null
  const colonnes = [
    { title: 'Rang', dataIndex: 'rang', width: 64 },
    { title: 'Joueur', dataIndex: 'joueur' },
    { title: 'Jauge', dataIndex: 'score', render: (v) => `${v} pts` },
    { title: 'Cités', dataIndex: 'total', render: (v) => v ?? '—' },
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
    <Card className="ecris-card ecris-classement" title="Classement (Jauge)">
      <Table
        dataSource={classement.map((e, i) => ({ ...e, key: e.date, rang: i + 1 }))}
        columns={colonnes}
        pagination={false}
        size="small"
      />
    </Card>
  )
}
