//@ts-check

import * as twgl from 'https://esm.sh/twgl.js'

import { initGL } from './gl.js'
import { updateFPSCounter, averageFPS, init as initFPS } from './fps.js'
import { fetchText } from './fileio.js'
import { loadImageFromStorage } from './images.js'
import { Controls } from './controls.js'

let camera, gl, progInfo, fullScreenBuffInfo, uniforms
let projectionMatrix, viewMatrix, viewProjectionMatrix, controls

const TERRAIN_SCALE = 800.0 // Size of terrain in world units
const HEIGHT_SCALE = 170.0 // how tall the terrain is in world units

async function init() {
  const imageData = await loadImageFromStorage('terrainImageData')

  const vertShader = await fetchText('./shaders/render.vert.glsl')
  const fragShader = await fetchText('./shaders/render.frag.glsl')
  gl = initGL('canvas', {
    width: 640,
    height: 480,
    fitToContainer: true,
    resizeCanvas: false,
  })

  fullScreenBuffInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  })
  progInfo = twgl.createProgramInfo(gl, [vertShader, fragShader])

  camera = {
    pos: [0, 150, 0],
    target: [20, 141, -20],
    up: [0, 1, 0],
    fov: Math.PI / 4,
    yaw: 0,
    pitch: 0,
  }

  // Initialize camera angles based on initial target direction
  const initialForward = [camera.target[0] - camera.pos[0], camera.target[1] - camera.pos[1], camera.target[2] - camera.pos[2]]
  camera.yaw = Math.atan2(initialForward[0], -initialForward[2])
  camera.pitch = Math.atan2(initialForward[1], Math.sqrt(initialForward[0] * initialForward[0] + initialForward[2] * initialForward[2]))

  const cameraMatrix = twgl.m4.lookAt(camera.pos, camera.target, camera.up)
  let viewMatrix = twgl.m4.inverse(cameraMatrix)
  projectionMatrix = twgl.m4.perspective(camera.fov, gl.canvas.width / gl.canvas.height, 0.1, 100)
  let viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix)

  uniforms = {
    u_camPos: camera.pos,
    u_viewProjectionMatrix: viewProjectionMatrix,
    u_map: twgl.createTexture(gl, {
      src: imageData,
      minMag: gl.LINEAR,
      wrap: gl.REPEAT,
    }),
    u_terrainScale: TERRAIN_SCALE,
    u_heightScale: HEIGHT_SCALE,
  }

  gl.useProgram(progInfo.program)
  twgl.setBuffersAndAttributes(gl, progInfo, fullScreenBuffInfo)

  controls = new Controls()
  requestAnimationFrame(render)
}

// Classic WebGL render loop
function render(timestamp) {
  // Update FPS counter
  updateFPSCounter(timestamp)
  updateCamera()

  twgl.setUniforms(progInfo, uniforms)
  twgl.drawBufferInfo(gl, fullScreenBuffInfo)

  // update the view matrix
  const cameraMatrix = twgl.m4.lookAt(camera.pos, camera.target, camera.up)
  viewMatrix = twgl.m4.inverse(cameraMatrix)
  viewProjectionMatrix = twgl.m4.multiply(projectionMatrix, viewMatrix)
  uniforms.u_viewProjectionMatrix = viewProjectionMatrix
  uniforms.u_camPos = camera.pos

  // request the next frame
  requestAnimationFrame(render)
}

function updateCamera() {
  // Update camera angles based on controls
  if (controls.turn !== 0) {
    camera.yaw += controls.turn * 0.02
  }

  if (controls.lookAngle !== 0) {
    camera.pitch -= controls.lookAngle * 0.02
    // Clamp pitch to prevent camera flipping
    const maxPitch = Math.PI / 2 - 0.1
    camera.pitch = Math.max(-maxPitch, Math.min(maxPitch, camera.pitch))
  }

  // Calculate forward vector from yaw and pitch
  const forward = [Math.sin(camera.yaw) * Math.cos(camera.pitch), Math.sin(camera.pitch), -Math.cos(camera.yaw) * Math.cos(camera.pitch)]

  // Calculate right vector (cross product of forward and world up)
  const worldUp = [0, 1, 0]
  const right = [
    forward[1] * worldUp[2] - forward[2] * worldUp[1],
    forward[2] * worldUp[0] - forward[0] * worldUp[2],
    forward[0] * worldUp[1] - forward[1] * worldUp[0],
  ]

  // Normalize right vector
  const rightLen = Math.sqrt(right[0] * right[0] + right[1] * right[1] + right[2] * right[2])
  if (rightLen > 0) {
    right[0] /= rightLen
    right[1] /= rightLen
    right[2] /= rightLen
  }

  // Move forward/backward
  if (controls.move !== 0) {
    const moveSpeed = 9.0
    camera.pos[0] += forward[0] * controls.move * moveSpeed
    camera.pos[1] += forward[1] * controls.move * moveSpeed
    camera.pos[2] += forward[2] * controls.move * moveSpeed
  }

  // Move up/down
  if (controls.moveUpDown !== 0) {
    camera.pos[1] += controls.moveUpDown * 2.0
  }

  // reset the camera to avoid floating point precision issues
  if (Math.abs(camera.pos[0] % TERRAIN_SCALE)) {
    camera.pos[0] = camera.pos[0] % TERRAIN_SCALE
  }
  if (Math.abs(camera.pos[2] % TERRAIN_SCALE)) {
    camera.pos[2] = camera.pos[2] % TERRAIN_SCALE
  }

  // Prevent camera from going below ground level in the heightmap
  // TODO

  // Update camera target based on position and forward direction
  camera.target[0] = camera.pos[0] + forward[0]
  camera.target[1] = camera.pos[1] + forward[1]
  camera.target[2] = camera.pos[2] + forward[2]
}

// Entry point
initFPS(3000, 1000)
init()
