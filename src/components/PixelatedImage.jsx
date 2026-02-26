import { useRef, useEffect, useState } from 'react'

/**
 * Affiche une image avec effet pixelisé (méthode canvas : dessin en basse résolution puis agrandissement sans lissage).
 * @param {string} src - URL de l'image
 * @param {number} pixelSize - Taille des "pixels" (plus grand = plus flou / plus pixelisé)
 * @param {string} [className] - Classes CSS pour le canvas
 * @param {Object} [style] - Style inline (width, height, etc.)
 * @param {number} [width] - Largeur d'affichage du canvas
 * @param {number} [height] - Hauteur d'affichage du canvas
 */
export default function PixelatedImage({ src, pixelSize = 32, className = '', style = {}, width, height }) {
  const canvasRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!src || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const w = width != null ? width : img.naturalWidth
      const h = height != null ? height : img.naturalHeight
      canvas.width = w
      canvas.height = h

      ctx.imageSmoothingEnabled = false

      const tempCanvas = document.createElement('canvas')
      const tctx = tempCanvas.getContext('2d')
      tempCanvas.width = Math.max(1, Math.floor(w / pixelSize))
      tempCanvas.height = Math.max(1, Math.floor(h / pixelSize))

      tctx.imageSmoothingEnabled = false
      tctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)

      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, w, h)

      setLoaded(true)
    }

    img.onerror = () => setLoaded(false)
    img.src = src

    return () => { img.src = '' }
  }, [src, pixelSize, width, height])

  const displayWidth = width ?? 400
  const displayHeight = height ?? 280

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: displayWidth, height: displayHeight, ...style }}
      width={displayWidth}
      height={displayHeight}
      role="img"
      aria-label="Image pixelisée"
    />
  )
}
