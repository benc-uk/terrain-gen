//@ts-check
import { CanvasBlitter } from './lib/canvas-blitter.js'
import { loadImageFromStorage } from './lib/images.js'
import { HeightmapAlpha } from './heightmap.js'
import { Camera } from './camera.js'
import { Controls } from './controls.js'

/** @type {HeightmapAlpha} */
let terrainMap

/** @type {CanvasBlitter} */
let blitter

/** @type {Camera} */
let camera

/** @type {Controls} */
let controls

const MAX_DIST = 1200
const LIGHT_ATTEN_FACTOR = 3 / MAX_DIST
const Z_LOD_FACTOR = 12 / MAX_DIST
const HEIGHT_SCALE = 700

async function init() {
  //const mapImageData = await loadImageData('map.png')

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

  blitter = new CanvasBlitter()
  blitter.showFPS = true

  camera = new Camera(terrainMap.width / 2, terrainMap.height / 2, 0, 6, blitter.height / 3)
  controls = new Controls()

  // Start the rendering loop
  renderLoop(performance.now())
}

function drawTerrain() {
  const leftAngle = camera.angle - camera.fov / 2
  const rightAngle = camera.angle + camera.fov / 2

  const heightBuffer = new Array(blitter.width).fill(blitter.height)

  let z = 1
  let dz = Z_LOD_FACTOR
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
      blitter.drawVLine(i, height, heightBuffer[i], terrain[0] * lightAtten, terrain[1] * lightAtten, terrain[2] * lightAtten)

      if (height < heightBuffer[i]) heightBuffer[i] = height
    }

    z += dz
    dz += Z_LOD_FACTOR
  }
}

function renderLoop(ts) {
  camera.update(terrainMap, controls)

  blitter.fillGradient(190, 210, 255, 0, 0, 20) // Sky gradient
  drawTerrain()

  blitter.draw(ts)

  requestAnimationFrame(renderLoop)
}

// Entry point for the app
await init()
