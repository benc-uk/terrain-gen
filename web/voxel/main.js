//@ts-check
import { CanvasBlitter } from './lib/canvas-blitter.js'
import { loadImageData, loadImageFromStorage } from './lib/images.js'
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

const MAX_DIST = 1000
const LIGHT_ATTEN_FACTOR = 3 / MAX_DIST
const Z_LOD_FACTOR = 7 / MAX_DIST
const HEIGHT_SCALE = 700

async function init() {
  //const mapImageData = await loadImageData('map.png')

  // Special case for Comanche maps
  // const mapImageData = await loadImageData('maps/C7W.png')
  // const heightImageData = await loadImageData('maps/D7.png')
  // // Update mapImageData to use heightmap alpha
  // for (let i = 0; i < mapImageData.data.length; i += 4) {
  //   mapImageData.data[i + 3] = heightImageData.data[i] // Use alpha channel from heightmap
  // }

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

    const invz = (1 / z) * HEIGHT_SCALE
    const lightAtten = Math.min(1 / (z * LIGHT_ATTEN_FACTOR), 1)

    for (let i = 0; i < blitter.width; i++) {
      let worldX = plLeft.x + dx * i
      let worldY = plLeft.y + dy * i

      const colour = terrainMap.getColor(worldX, worldY)
      const h = terrainMap.getHeight(worldX, worldY)

      // The floor function here is VERY important
      const height = Math.floor((camera.z - h) * invz + camera.horizon)

      // Draw vertical column
      blitter.drawVLine(i, height, heightBuffer[i], colour[0] * lightAtten, colour[1] * lightAtten, colour[2] * lightAtten)

      if (height < heightBuffer[i]) heightBuffer[i] = height
    }

    z += dz
    dz += Z_LOD_FACTOR
  }
}

function updateCamera() {
  const MIN_GROUND_HEIGHT = 15

  if (controls.turn !== 0) {
    camera.angle += controls.turn * 0.02
  }

  if (controls.move !== 0) {
    camera.x += Math.cos(camera.angle) * 6 * controls.move
    camera.y += Math.sin(camera.angle) * 6 * controls.move
    // use lookAngle to adjust camera height
    camera.z += camera.vAngle * 6 * controls.move
  }

  if (controls.lookAngle !== 0) {
    camera.horizon -= controls.lookAngle * 5
    camera.vAngle -= controls.lookAngle * 0.01
  }

  if (controls.moveUpDown !== 0) {
    camera.z += controls.moveUpDown * 6
  }

  if (camera.horizon < 0) {
    camera.horizon = 0
  }

  // check collision with terrain
  const terrainHeight = terrainMap.getHeight(camera.x, camera.y)
  if (camera.z < terrainHeight + MIN_GROUND_HEIGHT) {
    camera.z = terrainHeight + MIN_GROUND_HEIGHT
  }
}

function renderLoop(ts) {
  updateCamera()

  blitter.fill(100, 180, 235) // Sky blue
  drawTerrain()

  blitter.draw(ts)

  requestAnimationFrame(renderLoop)
}

// Entry point for the app
await init()
