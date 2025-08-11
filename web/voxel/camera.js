export class Camera {
  /** @type {number} */
  x = 0
  /** @type {number} */
  y = 0
  /** @type {number} */
  z = 0

  /** @type {number} */
  angle = 0

  /** @type {number} */
  vAngle = 0 // Vertical angle for looking up/down

  /** @type {number} */
  horizon = 0

  fov = Math.PI / 2 // Field of view in radians

  constructor(x = 0, y = 0, z = 0, angle = 0, horizon = 0) {
    this.x = x
    this.y = y
    this.z = z
    this.angle = angle
    this.horizon = horizon

    console.log(`Camera initialized at (${this.x}, ${this.y}, ${this.z}) with angle ${this.angle} and horizon ${this.horizon}`)
  }

  update(terrainMap, controls, dt) {
    const MIN_GROUND_HEIGHT = 15

    if (controls.turn !== 0) {
      this.angle += controls.turn * 0.6 * dt
    }

    if (controls.move !== 0) {
      this.x += Math.cos(this.angle) * 400 * controls.move * dt
      this.y += Math.sin(this.angle) * 400 * controls.move * dt
      // use lookAngle to adjust this.z height using trigonometry
      // Only adjust z if user is moving and looking up/down

      this.z += Math.sin(this.vAngle) * 400 * controls.move * dt
    }

    if (controls.lookAngle !== 0) {
      this.horizon -= controls.lookAngle * 60 * dt
      this.vAngle -= controls.lookAngle * 0.01
    }

    if (controls.moveUpDown !== 0) {
      this.z += controls.moveUpDown * 188 * dt
    }

    if (this.horizon < 0) {
      this.horizon = 0
    }

    // check collision with terrain
    const data = terrainMap.getData(this.x, this.y)
    if (this.z < data[3] + MIN_GROUND_HEIGHT) {
      this.z = data[3] + MIN_GROUND_HEIGHT
    }
  }
}
