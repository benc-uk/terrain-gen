// ===========================================
// FPS Counter Module
// ===========================================

let fpsCounter
let frameTimestamps = []
let lastFpsUpdate = performance.now()
let window = 0
let updateInterval = 0

/** current avergae FPS */
export let averageFPS = 0

const style = `
  position: absolute;
  top: 10px; right: 10px;
  color: #dddddd;
  font-family: monospace;
  font-size: 17px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 5px;
  z-index: 1000;
  user-select: none;
`

/**
 * Add an FPS counter to the page, if not already present.
 * @param {number} timeWindow - Time window in ms to calculate FPS avg over, in ms
 * @param {number} updateTime - How often to update the display in ms
 * @returns
 */
export function init(timeWindow = 3000, updateTime = 1000) {
  if (fpsCounter) return

  frameTimestamps = []
  lastFpsUpdate = performance.now()
  averageFPS = 0

  fpsCounter = document.createElement('div')
  fpsCounter.innerText = 'FPS: --'
  fpsCounter.style.cssText = style
  document.body.appendChild(fpsCounter)

  window = timeWindow
  updateInterval = updateTime
}

/**
 * Update the FPS counter with the current time.
 * Call this function once per frame, passing in the current time.
 * @param {number} currentTime - The current time in ms
 */
export function updateFPSCounter(currentTime) {
  frameTimestamps.push(currentTime)

  const threeSecondsAgo = currentTime - window
  frameTimestamps = frameTimestamps.filter((timestamp) => timestamp > threeSecondsAgo)

  if (currentTime - lastFpsUpdate >= updateInterval) {
    if (frameTimestamps.length > 1 && fpsCounter) {
      const timeSpan = (frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0]) / updateInterval
      averageFPS = (frameTimestamps.length - 1) / timeSpan
      fpsCounter.textContent = `FPS: ${Math.round(averageFPS)}`
    }

    lastFpsUpdate = currentTime
  }
}
