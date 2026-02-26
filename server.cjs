const fs = require('fs')
const path = require('path')
const http = require('http')

const SCORES_FILE = path.join(__dirname, 'data', 'scores.json')
const PORT = 3001

function readScores() {
  try {
    const raw = fs.readFileSync(SCORES_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeScores(scores) {
  fs.mkdirSync(path.dirname(SCORES_FILE), { recursive: true })
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), 'utf8')
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const cors = () => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
  }

  if (req.method === 'GET' && url.pathname === '/api/scores') {
    cors()
    res.end(JSON.stringify(readScores()))
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/scores') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const entry = JSON.parse(body)
        const scores = readScores()
        scores.push({
          joueur: entry.joueur,
          nombreDeviné: entry.nombreDeviné,
          tempsSecondes: entry.tempsSecondes,
          indicesLettres: entry.indicesLettres ?? 0,
          indicesLettresAdd: entry.indicesLettresAdd ?? 0,
          indicesSilhouette: entry.indicesSilhouette ?? 0,
          date: entry.date || new Date().toISOString(),
        })
        writeScores(scores)
        cors()
        res.statusCode = 201
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
    })
    return
  }

  if (req.method === 'PUT' && url.pathname === '/api/scores') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const scores = JSON.parse(body)
        if (!Array.isArray(scores)) throw new Error('Body must be an array')
        writeScores(scores)
        cors()
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e.message) }))
      }
    })
    return
  }

  res.statusCode = 404
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`API scores: http://localhost:${PORT}/api/scores`)
})
