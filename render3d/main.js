import { Context, Material, ModelBuilder, Model } from 'https://cdn.jsdelivr.net/gh/benc-uk/gsots3d@main/dist-single/gsots3d.min.js'

const MAP = 'map.png'
const HSCALE = 190 // Height scale factor
const MAP_SCALE = 1.5
const CHUNK_SIZE = 64 // Process terrain in 32x32 chunks

// Simple function to load heightmap and extract grayscale values
async function loadHeightmap(imagePath) {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const data = imageData.data

      // Extract height values from alpha channel
      const heights = []
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255.0 // Alpha channel as height
        heights.push(alpha)
      }

      resolve({
        width: img.width,
        height: img.height,
        heights: heights,
      })
    }

    img.onerror = reject
    img.src = imagePath
  })
}

// Function to create the terrain model
function makeModel(width, height, heights, name = 'terrain') {
  for (let chunkY = 0; chunkY < height; chunkY++) {
    for (let chunkX = 0; chunkX < width; chunkX++) {
      // Create a separate part for each chunk
      const part = builder.newPart(`terrain_${chunkX}_${chunkY}`, terrainMap)

      // Process this chunk
      const startRow = chunkY * CHUNK_SIZE
      const endRow = Math.min(startRow + CHUNK_SIZE, height - 1)
      const startCol = chunkX * CHUNK_SIZE
      const endCol = Math.min(startCol + CHUNK_SIZE, width - 1)

      console.log(`Processing chunk [${chunkX},${chunkY}]: rows ${startRow}-${endRow}, cols ${startCol}-${endCol}`)

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          // Get heights for the 4 corners of this quad
          const h1 = heights[row * width + col] * HSCALE
          const h2 = heights[row * width + (col + 1)] * HSCALE
          const h3 = heights[(row + 1) * width + col] * HSCALE
          const h4 = heights[(row + 1) * width + (col + 1)] * HSCALE

          // Calculate world positions
          const x1 = col
          const x2 = col + 1
          const z1 = row
          const z2 = row + 1

          // Define the 4 vertices
          const v1 = [x1 * MAP_SCALE, h1, z1 * MAP_SCALE]
          const v2 = [x2 * MAP_SCALE, h2, z1 * MAP_SCALE]
          const v3 = [x1 * MAP_SCALE, h3, z2 * MAP_SCALE]
          const v4 = [x2 * MAP_SCALE, h4, z2 * MAP_SCALE]

          // Texture coordinates for the quad
          const u1 = col / width
          const u2 = (col + 1) / width
          const v1Tex = row / height
          const v2Tex = (row + 1) / height

          // Add two triangles to form the quad
          part.addTriangle(v1, v3, v2, [u1, v1Tex], [u1, v2Tex], [u2, v1Tex])
          part.addTriangle(v2, v3, v4, [u2, v1Tex], [u1, v2Tex], [u2, v2Tex])
        }
      }
    }
  }

  gsots.buildCustomModel(builder, name)
}

// Initialize GSOTS3D
const gsots = await Context.init('canvas')

// Load the heightmap
const heightmap = await loadHeightmap(MAP)
console.log(`Loaded heightmap: ${heightmap.width}x${heightmap.height}`)

// Create terrain mesh using MULTIPLE PARTS
const builder = new ModelBuilder()
const terrainMap = Material.createBasicTexture(MAP)

const { width, height, heights } = heightmap
makeModel(width, height, heights, 'terrain')
gsots.createModelInstance('terrain')

// Set up camera and lighting - position camera based on terrain size
const size = Math.max(width, height)
gsots.camera.position = [size / 2, 40, size / 2]
gsots.camera.enableFPControls(3.2, 0, 0.0005, 4, true)
gsots.camera.far = size * 8

const sunRadius = 1500
let timeOfDay = 2
let direction = 1 // 1 for day, -1 for night
gsots.globalLight.ambient = [0.2, 0.2, 0.2]
gsots.globalLight.colour = [1.2, 1.2, 1.2] // Brighter sun
gsots.globalLight.enableShadows({
  distance: 18000,
  zoom: 300,
})

const sunMat = Material.createSolidColour(1, 1, 1)
sunMat.emissive = [1.2, 1.2, 1.2] // Bright sun color
const sun = gsots.createSphereInstance(sunMat, 40, 32, 32)
sun.castShadow = false

window.addEventListener('keydown', (event) => {
  if (event.key === '1') {
    timeOfDay -= 0.05
  }
  if (event.key === '2') {
    timeOfDay += 0.05
  }

  console.log(`Time of day: ${timeOfDay.toFixed(2)}`)
})

gsots.update = () => {
  // Position sun in a circular orbit based on timeOfDay
  timeOfDay += 0.0003 * direction // Slowly rotate sun position over time
  if (timeOfDay > Math.PI * 2) direction = -1 // Reverse direction at end of day
  if (timeOfDay < 0) direction = 1 // Reverse direction at start

  // Calculate sun position with an arch over the sky
  const sunX = Math.cos(timeOfDay) * sunRadius
  const sunY = Math.abs(Math.sin(timeOfDay)) * sunRadius * 0.8 // abs to create an arch
  const sunZ = Math.sin(timeOfDay) * sunRadius

  gsots.globalLight.setAsPosition(sunX, sunY, sunZ)
  sun.position = [sunX, sunY, sunZ]

  // Adjust light color based on time of day (redder at sunset/sunrise)
  const dayProgress = Math.sin(timeOfDay)
  const sunsetFactor = Math.pow(Math.abs(Math.sin(timeOfDay + Math.PI / 2)), 8)

  if (dayProgress > 0) {
    // Daytime - full brightness
    gsots.globalLight.colour = [1.2 - sunsetFactor * 0.4, 1.2 - sunsetFactor * 0.8, 1.2 - sunsetFactor * 0.9]
    gsots.globalLight.ambient = [0.2 + 0.1 * dayProgress, 0.2 + 0.1 * dayProgress, 0.2 + 0.1 * dayProgress]
  } else {
    // Night time - dimmer light
    gsots.globalLight.colour = [0.3, 0.3, 0.4]
    gsots.globalLight.ambient = [0.05, 0.05, 0.1]
  }
}

// Add a skybox
gsots.setEnvmap(true, 'skybox/right.png', 'skybox/left.png', 'skybox/top.png', 'skybox/bottom.png', 'skybox/front.png', 'skybox/back.png')

gsots.start()
