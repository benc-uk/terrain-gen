//@ts-check
// ==========================================================================
// Camera class for a 3D terrain viewer using WebGL and TWGL.js
// Handles position, orientation, and movement based on user controls
// ==========================================================================

//@ts-ignore
import * as twgl from 'https://esm.sh/twgl.js'

const MOVE_SPEED = 50.0
const LOOK_SPEED = 0.3

export class Camera {
  constructor(controls, terrainScale, aspectRatio) {
    this.pos = [512, 550, 512]
    this.realX = 0
    this.realZ = 0
    this.target = [512, 250, -1200]
    this.up = [0, 1, 0]
    this.fov = Math.PI / 6
    this.yaw = 0
    this.pitch = 0
    this.controls = controls
    this.terrainScale = terrainScale

    // Matrix properties
    this.viewMatrix = null
    this.projectionMatrix = null
    this.viewProjectionMatrix = null

    // Initialize camera angles based on initial target direction
    const initialForward = [this.target[0] - this.pos[0], this.target[1] - this.pos[1], this.target[2] - this.pos[2]]
    this.yaw = Math.atan2(initialForward[0], -initialForward[2])
    this.pitch = Math.atan2(initialForward[1], Math.sqrt(initialForward[0] * initialForward[0] + initialForward[2] * initialForward[2]))

    // Initialize matrices
    this.updateProjectionMatrix(aspectRatio)
    this.updateViewMatrix()
    this.camPosDisplay = document.getElementById('camPos')

    // hack debug to move x and z with arrow keys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        this.pos[2] -= 10
      } else if (e.key === 'ArrowDown') {
        this.pos[2] += 10
      } else if (e.key === 'ArrowLeft') {
        this.pos[0] -= 10
      } else if (e.key === 'ArrowRight') {
        this.pos[0] += 10
      }
    })
  }

  updateProjectionMatrix(aspectRatio) {
    this.projectionMatrix = twgl.m4.perspective(this.fov, aspectRatio, 0.1, 100)
    this.updateViewProjectionMatrix()
  }

  updateViewMatrix() {
    const cameraMatrix = twgl.m4.lookAt(this.pos, this.target, this.up)
    this.viewMatrix = twgl.m4.inverse(cameraMatrix)
    this.updateViewProjectionMatrix()
  }

  updateViewProjectionMatrix() {
    if (this.projectionMatrix && this.viewMatrix) {
      this.viewProjectionMatrix = twgl.m4.multiply(this.projectionMatrix, this.viewMatrix)
    }
  }

  update(terrainMap, heightScale, averageFPS) {
    const oldPos = [...this.pos]

    // Calculate framerate compensation factor (target 60 FPS)
    const frameTimeMultiplier = averageFPS > 0 ? 60.0 / averageFPS : 1.0

    // Update camera angles based on controls
    if (this.controls.turn !== 0) {
      this.yaw += this.controls.turn * LOOK_SPEED * frameTimeMultiplier
    }

    if (this.controls.lookAngle !== 0) {
      this.pitch -= this.controls.lookAngle * LOOK_SPEED * frameTimeMultiplier
      // Clamp pitch to prevent camera flipping
      const maxPitch = Math.PI / 2 - 0.1
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    }

    // Calculate forward vector from yaw and pitch
    const forward = [Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)]

    // Move forward/backward
    if (this.controls.move !== 0) {
      this.pos[0] += forward[0] * this.controls.move * MOVE_SPEED * frameTimeMultiplier
      this.pos[1] += forward[1] * this.controls.move * MOVE_SPEED * frameTimeMultiplier
      this.pos[2] += forward[2] * this.controls.move * MOVE_SPEED * frameTimeMultiplier
    }

    // Move up/down
    if (this.controls.moveUpDown !== 0) {
      this.pos[1] += this.controls.moveUpDown * 2.0 * frameTimeMultiplier
    }

    // implement wrap around
    this.pos[0] = ((this.pos[0] % this.terrainScale) + this.terrainScale) % this.terrainScale
    this.pos[2] = ((this.pos[2] % this.terrainScale) + this.terrainScale) % this.terrainScale

    // get height from terrain map
    this.realX = Math.floor((this.pos[0] / this.terrainScale) * terrainMap.width)
    this.realZ = Math.floor((this.pos[2] / this.terrainScale) * terrainMap.height)
    const index = (this.realZ * terrainMap.width + this.realX) * 4
    const alpha = terrainMap.data[index + 3] / 255.0 // alpha channel
    const h = alpha * heightScale + 100.0 // add a little offset so we don't clip into the ground

    if (this.pos[1] < h) {
      this.pos[1] = h
    }

    // Update camera target based on position and forward direction
    this.target[0] = this.pos[0] + forward[0]
    this.target[1] = this.pos[1] + forward[1]
    this.target[2] = this.pos[2] + forward[2]

    // Update view matrix after position/target changes
    this.updateViewMatrix()

    this.camPosDisplay.innerText = `${this.realX},  ${Math.floor(this.pos[1])},  ${this.realZ}`
  }
}
