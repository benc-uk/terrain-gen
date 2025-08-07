//@ts-check
// ==============================================================================
// Image Library
// A collection of functions for loading and manipulating images.
// ==============================================================================

/** Loads an image from a URL and returns it as an ImageData.
 * @param {string} url - The URL of the image to load.
 * @returns {Promise<ImageData>} A promise that resolves to the loaded ImageBitmap.
 */
export async function loadImageData(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load image: ${res.statusText}`)
  }

  const blob = await res.blob()

  const img = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D context for offscreen canvas')
  }
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

/** * Loads an image from a URL and returns it as an ImageBitmap.
 * @param {string} url - The URL of the image to load.
 * @returns {Promise<ImageBitmap>} A promise that resolves to the loaded ImageBitmap.
 */
export async function loadImageBitmap(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load image: ${res.statusText}`)
  }

  const blob = await res.blob()
  return createImageBitmap(blob)
}
