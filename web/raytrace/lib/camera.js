//@ts-check
// ==========================================================================
// Camera class for a 3D terrain viewer using WebGL and TWGL.js
// Handles position, orientation, and movement based on user controls
// ==========================================================================

//@ts-ignore
import * as twgl from 'https://esm.sh/twgl.js'

const MOVE_SPEED = 50.0
const LOOK_SPEED = 0.5

export class Camera {
  constructor(controls, terrainScale, aspectRatio) {
    this.pos = [120, 550, 0]
    this.target = [120, 450, -200]
    this.up = [0, 1, 0]
    this.fov = Math.PI / 4
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

    // Calculate terrain position to sample the heightmap
    const terrainPosX = Math.floor((this.pos[0] / this.terrainScale) * terrainMap.width) % terrainMap.width
    const terrainPosZ = Math.floor((this.pos[2] / this.terrainScale) * terrainMap.height) % terrainMap.height

    // Wrap the position around the texture (handle negative values correctly)
    const wrappedX = terrainPosX % terrainMap.width
    const wrappedZ = terrainPosZ % terrainMap.height

    // Get height at the camera position
    // Assuming terrainMap has a data property with the height values
    // Get the index in the data array
    const index = (wrappedZ * terrainMap.width + wrappedX) * 4 // *4 for RGBA
    // Use the red channel as height (common in heightmaps)
    const terrainHeight = (terrainMap.data[index] / 256) * heightScale

    console.log(wrappedX, wrappedZ, terrainHeight, this.pos[1])

    // Ensure camera stays above terrain with a minimum clearance
    const minClearance = 4.0
    if (this.pos[1] < terrainHeight + minClearance) {
      this.pos[1] = terrainHeight + minClearance
    }

    // Move up/down
    if (this.controls.moveUpDown !== 0) {
      this.pos[1] += this.controls.moveUpDown * 2.0 * frameTimeMultiplier
    }

    // Reset the camera to avoid floating point precision issues
    if (Math.abs(this.pos[0] % this.terrainScale)) {
      this.pos[0] = this.pos[0] % this.terrainScale
    }
    if (Math.abs(this.pos[2] % this.terrainScale)) {
      this.pos[2] = this.pos[2] % this.terrainScale
    }

    // Prevent camera from going below terrain height + offset
    // Update camera target based on position and forward direction
    this.target[0] = this.pos[0] + forward[0]
    this.target[1] = this.pos[1] + forward[1]
    this.target[2] = this.pos[2] + forward[2]

    // Update view matrix after position/target changes
    this.updateViewMatrix()
  }
}
