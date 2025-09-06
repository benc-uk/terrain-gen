const go = new Go()

// Update roughness value display
document.getElementById('roughness').addEventListener('input', function () {
  document.getElementById('roughnessValue').textContent = this.value
})

// Update power value display
document.getElementById('power').addEventListener('input', function () {
  document.getElementById('powerValue').textContent = this.value
})

// Auto-generate terrain when controls change
document.getElementById('roughness').addEventListener('change', handleGenerateTerrain)
document.getElementById('power').addEventListener('change', handleGenerateTerrain)
document.getElementById('seed').addEventListener('change', handleGenerateTerrain)
document.querySelector('.seed-controls button').addEventListener('click', handleRandomSeed)
document.getElementById('generateBtn').addEventListener('click', handleGenerateTerrain)

async function handleGenerateTerrain() {
  console.log('Generating terrain...')

  const loadingMessage = document.getElementById('loadingMessage')
  const terrainImage = document.getElementById('terrainImage')
  const generateBtn = document.getElementById('generateBtn')
  const randomSeedBtn = document.getElementById('randSeedBtn')

  loadingMessage.style.display = 'inline'
  terrainImage.style.display = 'none'
  generateBtn.disabled = true
  randomSeedBtn.disabled = true

  const seed = parseFloat(document.getElementById('seed').value)
  const roughness = parseFloat(document.getElementById('roughness').value)
  const power = parseFloat(document.getElementById('power').value)

  if (isNaN(seed) || isNaN(roughness) || isNaN(power)) {
    alert('Please enter valid numbers for seed, roughness, and power')
    loadingMessage.style.display = 'none'
    generateBtn.disabled = false
    return
  }

  try {
    // Use setTimeout to allow DOM updates to render before calling WASM
    await new Promise((resolve) => setTimeout(resolve, 30))

    // Call the Go WASM function
    let wide = false
    if (window.innerWidth > 1200) {
      wide = true
    }

    const imageData = window.generateTerrain(seed, roughness, power, wide)
    // save imageData to localStorage for debugging
    localStorage.removeItem('terrainImageData')
    localStorage.setItem('terrainImageData', imageData)

    if (typeof imageData === 'string' && imageData.startsWith('Error')) {
      throw new Error(imageData)
    }

    // Display the image
    const img = document.getElementById('terrainImage')
    img.src = imageData
    img.style.display = 'block'
  } catch (error) {
    console.error('Error generating terrain:', error)
    alert('Error generating terrain: ' + error.message)
  } finally {
    // Hide loading message and re-enable button
    loadingMessage.style.display = 'none'
    terrainImage.style.display = 'block'
    generateBtn.disabled = false
    randomSeedBtn.disabled = false
  }
}

function handleRandomSeed() {
  try {
    // Store reference to avoid recursive call
    const wasmGenerateRandomSeed = window.generateRandomSeed
    const randomSeed = wasmGenerateRandomSeed()
    document.getElementById('seed').value = Math.floor(randomSeed)
    handleGenerateTerrain()
  } catch (error) {
    console.error('Error in generateRandomSeed:', error)
    alert('Error generating random seed: ' + error.message)
  }
}

// Load the WASM module
async function initWasm() {
  try {
    const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), go.importObject)
    go.run(result.instance)

    // Generate initial terrain
    handleGenerateTerrain()
  } catch (error) {
    console.error('Error loading WASM:', error)
    alert('Error loading WASM module. Make sure main.wasm is available.')
  }
}

// Call the initialization function
initWasm()
