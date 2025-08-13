//@ts-check
import { loadImageFromStorage } from './lib/images.js'
import { HeightmapAlpha } from './heightmap.js'
import { Camera } from './camera.js'
import { Controls } from './controls.js'
import { GLBlitter } from './lib/webgl-blitter.js'

/** @type {HeightmapAlpha} */
let terrainMap

/** @type {GLBlitter} */
let blitter

/** @type {Camera} */
let camera

/** @type {Controls} */
let controls

const MAX_DIST = 1600
const LIGHT_ATTEN_FACTOR = 3 / MAX_DIST
const Z_LOD_FACTOR = 18 / MAX_DIST
const HEIGHT_SCALE = 600

let lastTime = 0
let heightBuffer = []

async function init() {
  /** @type {ImageData} */
  let mapImageData
  try {
    mapImageData = await loadImageFromStorage('terrainImageData')
  } catch (error) {
    // Redirect to generate terrain if image data is not found
    location.href = '../generate/'
    return
  }

  terrainMap = new HeightmapAlpha(mapImageData)

  blitter = new GLBlitter()
  blitter.backgroundGradient(10, 0, 70, 255, 50, 10)

  camera = new Camera(terrainMap.width / 2, terrainMap.height / 2, 0, 6, blitter.height / 3)
  controls = new Controls()

  heightBuffer = new Array(blitter.width).fill(blitter.height)

  // Start the rendering loop
  renderLoop(performance.now())
}

function drawTerrain() {
  const leftAngle = camera.angle - camera.fov / 2
  const rightAngle = camera.angle + camera.fov / 2

  // Reset height buffer
  heightBuffer.fill(blitter.height)

  let z = 1
  let dz = 0

  while (z < MAX_DIST) {
    const plLeft = {
      x: camera.x + Math.cos(leftAngle) * z,
      y: camera.y + Math.sin(leftAngle) * z,
    }
    const plRight = {
      x: camera.x + Math.cos(rightAngle) * z,
      y: camera.y + Math.sin(rightAngle) * z,
    }

    let dx = (plRight.x - plLeft.x) / blitter.width
    let dy = (plRight.y - plLeft.y) / blitter.width

    const invZ = (1 / z) * HEIGHT_SCALE
    const lightAtten = Math.min(1 / (z * LIGHT_ATTEN_FACTOR), 1)

    for (let i = 0; i < blitter.width; i++) {
      let worldX = plLeft.x + dx * i
      let worldY = plLeft.y + dy * i

      const terrain = terrainMap.getData(worldX, worldY)

      // The floor function here is VERY important
      const height = Math.floor((camera.z - terrain[3]) * invZ + camera.horizon)

      // Draw vertical column
      if (height > heightBuffer[i]) continue

      if (height >= blitter.height) {
        heightBuffer[i] = blitter.height
        continue
      }

      blitter.drawVLine(i, height, heightBuffer[i], terrain[0] * lightAtten, terrain[1] * lightAtten, terrain[2] * lightAtten)

      if (height < heightBuffer[i]) heightBuffer[i] = height
    }

    z += dz
    dz += Z_LOD_FACTOR
  }
}

function renderLoop(ts) {
  const dt = lastTime === 0 ? 0 : (ts - lastTime) / 1000 // Convert to seconds
  // console.log(`Render loop at ${ts} with dt=${dt}`)

  camera.update(terrainMap, controls, dt)

  blitter.clear()
  drawTerrain()
  blitter.draw(ts)

  // Update FPS display
  const fpsDisplay = document.getElementById('fps')
  if (fpsDisplay) {
    fpsDisplay.textContent = `FPS: ${blitter.fps}`
  }

  lastTime = ts
  requestAnimationFrame(renderLoop)
}

// Entry point for the app
await init()
