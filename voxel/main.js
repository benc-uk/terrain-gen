//@ts-check
import { CanvasBlitter } from './lib/canvas-blitter.js'
import { loadImageData } from './lib/images.js'

/** @type {ImageData} */
let terrainMap

/** @type {CanvasBlitter} */
let blitter

// Player position and angle
let posX = 128
let posY = 128
let angle = -1.8
let horizon = 256 // Height of the horizon line in pixels

const MAX_DIST = 300
const HEIGHT_SCALE = 500

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
      horizon += 20
    } else if (key === 'F') {
      horizon -= 20
    }
  })

  posX = terrainMap.width / 2
  posY = terrainMap.height / 2

  renderLoop(performance.now())
}

function drawTerrain() {
  blitter.fill(100, 180, 235) // Darker sky blue

  const fov = Math.PI / 2.5
  const leftAngle = angle - fov / 2
  const rightAngle = angle + fov / 2

  const heightBuffer = new Array(blitter.width).fill(blitter.height)

  // Place the camera at the terrain height
  const terrainIndexPos = (Math.floor(posY) * terrainMap.width + Math.floor(posX)) * 4
  const terrainDataPos = terrainMap.data.slice(terrainIndexPos, terrainIndexPos + 4)
  const camHeight = terrainDataPos[3] + 20 // Adjust camera height based on terrain data

  for (let z = 1; z < MAX_DIST; z++) {
    const plLeft = {
      x: posX + Math.cos(leftAngle) * z,
      y: posY + Math.sin(leftAngle) * z,
    }
    const plRight = {
      x: posX + Math.cos(rightAngle) * z,
      y: posY + Math.sin(rightAngle) * z,
    }

    let dx = (plRight.x - plLeft.x) / blitter.width
    let dy = (plRight.y - plLeft.y) / blitter.width

    const invz = (1 / z) * HEIGHT_SCALE
    const lightDistance = Math.min(1 / (z * 0.01), 1) // Adjust light distance based on z

    for (let i = 0; i < blitter.width; i++) {
      let worldX = plLeft.x + dx * i
      let worldY = plLeft.y + dy * i

      const terrainIndex = (Math.floor(worldY) * terrainMap.width + Math.floor(worldX)) * 4
      const colour = terrainMap.data.slice(terrainIndex, terrainIndex + 4)
      if (!colour[3]) continue

      // The floor function here is VERY important
      const height = Math.floor((camHeight - colour[3]) * invz + horizon)

      // Draw vertical column
      blitter.drawVLine(i, height, heightBuffer[i], colour[0] * lightDistance, colour[1] * lightDistance, colour[2] * lightDistance)

      if (height < heightBuffer[i]) heightBuffer[i] = height
    }
  }
}

function renderLoop(ts) {
  drawTerrain()

  blitter.draw(ts)

  requestAnimationFrame(renderLoop)
}

// Entry point for the app
await init()
