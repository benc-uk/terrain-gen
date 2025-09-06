//@ts-check

//@ts-ignore
import * as twgl from 'https://esm.sh/twgl.js'

import { initGL } from './lib/gl.js'
import { updateFPSCounter, init as initFPS, averageFPS } from './lib/fps.js'
import { fetchText } from './lib/fileio.js'
import { loadImageFromStorage } from './lib/images.js'
import { Controls } from './lib/controls.js'
import { Camera } from './lib/camera.js'

let gl, progInfo, fullScreenBuffInfo, uniforms, imageData
let controls, camera

const TERRAIN_SCALE = 4000.0 // Size of terrain in world units
const HEIGHT_SCALE = 800.0 // how tall the terrain is in world units

async function init() {
  imageData = await loadImageFromStorage('terrainImageData')

  const vertShader = await fetchText('./shaders/render.vert.glsl')
  const fragShader = await fetchText('./shaders/render.frag.glsl')
  gl = initGL('canvas', {
    width: 1024,
    height: 768,
    fitToContainer: true,
    resizeCanvas: false,
  })

  fullScreenBuffInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  })
  progInfo = twgl.createProgramInfo(gl, [vertShader, fragShader])

  // Initialize controls and camera
  controls = new Controls()
  camera = new Camera(controls, TERRAIN_SCALE, gl.canvas.width / gl.canvas.height)

  uniforms = {
    u_camPos: camera.pos,
    u_viewProjectionMatrix: camera.viewProjectionMatrix,
    u_map: twgl.createTexture(gl, {
      src: imageData,
      min: gl.LINEAR_MIPMAP_LINEAR,
      mag: gl.LINEAR,
      wrap: gl.REPEAT,
    }),
    u_terrainScale: TERRAIN_SCALE,
    u_heightScale: HEIGHT_SCALE,
  }

  gl.useProgram(progInfo.program)
  twgl.setBuffersAndAttributes(gl, progInfo, fullScreenBuffInfo)

  const loadingScreen = document.getElementById('loading')
  if (loadingScreen) {
    loadingScreen.remove()
  }

  render(performance.now())
}

function render(timestamp) {
  // Update FPS counter
  updateFPSCounter(timestamp)
  camera.update(imageData, HEIGHT_SCALE, averageFPS)

  twgl.setUniforms(progInfo, uniforms)
  twgl.drawBufferInfo(gl, fullScreenBuffInfo)

  // Update uniforms with latest camera matrices
  uniforms.u_viewProjectionMatrix = camera.viewProjectionMatrix
  uniforms.u_camPos = camera.pos

  // request the next frame
  requestAnimationFrame(render)
}

// Entry point
initFPS(3000, 1000)
init()
