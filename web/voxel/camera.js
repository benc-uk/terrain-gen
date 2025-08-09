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
}
