//@ts-check
import { CanvasBlitter } from './lib/canvas-blitter.js'
import { loadImageData } from './lib/images.js'

/** @type {ImageData} */
let terrainMap

/** @type {CanvasBlitter} */
let blitter

let posX = 128
let posY = 128
let angle = 0.2
let horizonHeight = 256 // Height of the horizon line in pixels
const distance = 760
const scaleHeight = 500

async function init() {
  terrainMap = await loadImageData('map.png')

  blitter = new CanvasBlitter()
  blitter.showFPS = true

  window.addEventListener('keydown', (e) => {
    // W,A,S,D keys control movement
    const key = e.key.toUpperCase()
    if (key === 'A') {
      angle -= 0.1
    } else if (key === 'D') {
      angle += 0.1
    } else if (key === 'W') {
      posX += Math.cos(angle) * 3
      posY += Math.sin(angle) * 3
    } else if (key === 'S') {
      posX -= Math.cos(angle) * 3
      posY -= Math.sin(angle) * 3
    }
    // R,F look up/down
    if (key === 'R') {
      horizonHeight += 20
    } else if (key === 'F') {
      horizonHeight -= 20
    }

    // Remove bounds checking to allow infinite movement
    // The world will wrap around automatically
  })

  window
  renderLoop(performance.now())
}

function drawTerrain() {
  // Clear the canvas with sky color
  blitter.fill(100, 180, 235) // Darker sky blue

  const screenWidth = blitter.width
  const screenHeight = blitter.height

  // Create a height buffer to track the highest rendered point for each column
  const heightBuffer = new Array(screenWidth).fill(screenHeight)

  // Field of view settings 90 degrees
  const fov = Math.PI / 2

  // Render from back to front (far to near)
  for (let z = 1; z < distance; z++) {
    // Calculate the left and right bounds of the view frustum at this distance
    const leftAngle = angle - fov / 2
    const rightAngle = angle + fov / 2

    const plLeft = {
      x: posX + Math.cos(leftAngle) * z,
      y: posY + Math.sin(leftAngle) * z,
    }
    const plRight = {
      x: posX + Math.cos(rightAngle) * z,
      y: posY + Math.sin(rightAngle) * z,
    }

    // Interpolate across the screen width
    const dx = (plRight.x - plLeft.x) / screenWidth
    const dy = (plRight.y - plLeft.y) / screenWidth

    for (let i = 0; i < screenWidth; i++) {
      const worldX = plLeft.x + dx * i
      const worldY = plLeft.y + dy * i

      // Wrap coordinates to make the world repeat
      const mapX = Math.floor(worldX) % terrainMap.width
      const mapY = Math.floor(worldY) % terrainMap.height

      // Handle negative modulo results
      const wrappedX = mapX < 0 ? mapX + terrainMap.width : mapX
      const wrappedY = mapY < 0 ? mapY + terrainMap.height : mapY

      // Get the pixel data from the terrain map
      const mapIndex = (wrappedY * terrainMap.width + wrappedX) * 4
      const r = terrainMap.data[mapIndex]
      const g = terrainMap.data[mapIndex + 1]
      const b = terrainMap.data[mapIndex + 2]
      const height = terrainMap.data[mapIndex + 3] // Height from alpha channel

      // Calculate camera height put it 20 above the ground at posX, posY
      // get height at posX, posY
      // Get height at current position
      const mapPosX = Math.floor(posX) % terrainMap.width
      const mapPosY = Math.floor(posY) % terrainMap.height
      const wrappedPosX = mapPosX < 0 ? mapPosX + terrainMap.width : mapPosX
      const wrappedPosY = mapPosY < 0 ? mapPosY + terrainMap.height : mapPosY
      const posIndex = (wrappedPosY * terrainMap.width + wrappedPosX) * 4
      const terrainHeight = terrainMap.data[posIndex + 3] // Height from alpha channel
      const cameraHeight = terrainHeight + 20 // Camera 20 units above ground

      // Calculate the projected height on screen
      const heightDiff = height - cameraHeight
      const projectedHeight = horizonHeight - (heightDiff * scaleHeight) / z

      // Only draw if the projected height is above what we've already drawn
      const screenY = Math.floor(projectedHeight)
      if (screenY < heightBuffer[i]) {
        // If the projected height is above screen (negative Y), start from 0
        const drawStart = Math.max(0, screenY)
        const drawEnd = heightBuffer[i]

        // Draw from the projected height down to the previous height buffer value
        for (let y = drawStart; y < drawEnd; y++) {
          if (y >= 0 && y < screenHeight) {
            blitter.setRGB(i, y, r, g, b)
          }
        }
        // Update the height buffer to the new top (but not below 0)
        heightBuffer[i] = Math.max(0, screenY)
      }
    }
  }
}

/**
 * Main render loop that draws the terrain and updates the blitter.
 * @param {number} ts - The current timestamp
 */
function renderLoop(ts) {
  drawTerrain()

  blitter.draw(ts)

  requestAnimationFrame(renderLoop)
}

// Entry point for the app
await init()
