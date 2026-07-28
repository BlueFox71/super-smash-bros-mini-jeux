import { useRef, useEffect, useState } from 'react'

/**
 * Cache des images décodées, partagé entre les montages.
 *
 * Le modificateur « guesspixel » réduit `pixelSize` à chaque mauvaise réponse :
 * sans ce cache, chaque essai relançait un téléchargement et un décodage de
 * l'image alors que seul le facteur de pixelisation change.
 */
const cache = new Map()

function chargerImage(src) {
  const enCache = cache.get(src)
  if (enCache) return enCache

  const promesse = new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Image illisible : ${src}`))
    img.src = src
  })
  // Une erreur ne doit pas rester en cache : le prochain montage doit pouvoir réessayer.
  promesse.catch(() => cache.delete(src))
  cache.set(src, promesse)
  return promesse
}

const LARGEUR_DEFAUT = 400
const HAUTEUR_DEFAUT = 280

/**
 * Affiche une image pixelisée (dessin en basse résolution sur un canvas
 * intermédiaire, puis agrandissement sans lissage).
 * @param {string} src - URL de l'image
 * @param {number} pixelSize - Taille des « pixels » (plus grand = plus pixelisé)
 * @param {string} [className] - Classes CSS du canvas
 * @param {Object} [style] - Style inline
 * @param {number} [width] - Largeur d'affichage du canvas
 * @param {number} [height] - Hauteur d'affichage du canvas
 */
export default function PixelatedImage({ src, pixelSize = 32, className = '', style, width, height }) {
  const canvasRef = useRef(null)
  const [image, setImage] = useState(null)

  const largeur = width ?? LARGEUR_DEFAUT
  const hauteur = height ?? HAUTEUR_DEFAUT

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }
    let annule = false
    chargerImage(src).then(
      (img) => { if (!annule) setImage(img) },
      () => { if (!annule) setImage(null) }
    )
    return () => { annule = true }
  }, [src])

  // Le dessin ne dépend que de l'image décodée et des dimensions : changer
  // `pixelSize` redessine sans repasser par le réseau.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = largeur
    canvas.height = hauteur
    ctx.clearRect(0, 0, largeur, hauteur)
    if (!image) return

    const reduit = document.createElement('canvas')
    reduit.width = Math.max(1, Math.floor(largeur / pixelSize))
    reduit.height = Math.max(1, Math.floor(hauteur / pixelSize))
    const rctx = reduit.getContext('2d')
    rctx.imageSmoothingEnabled = false
    rctx.drawImage(image, 0, 0, reduit.width, reduit.height)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(reduit, 0, 0, reduit.width, reduit.height, 0, 0, largeur, hauteur)
  }, [image, pixelSize, largeur, hauteur])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: largeur, height: hauteur, ...style }}
      width={largeur}
      height={hauteur}
      role="img"
      aria-label="Image pixelisée"
    />
  )
}
