export class Controls {
  move = 0
  turn = 0
  lookAngle = 0
  moveUpDown = 0

  constructor() {
    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'w':
          this.move = 1
          break
        case 's':
          this.move = -1
          break
        case 'a':
          this.turn = -0.06
          break
        case 'd':
          this.turn = 0.06
          break
        case 'r':
          this.moveUpDown = 1
          break
        case 'f':
          this.moveUpDown = -1
          break
      }
    })

    window.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'w':
        case 's':
          this.move = 0
          break
        case 'a':
        case 'd':
          this.turn = 0
          break
        case 'r':
        case 'f':
          this.moveUpDown = 0
          break
      }
    })

    window.addEventListener('blur', () => {
      this.move = 0
      this.turn = 0
      this.lookAngle = 0
    })

    // add mouse capture onclick
    window.addEventListener('click', (event) => {
      if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock()
      }
    })

    // handle mouse lock
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== document.body) {
        this.move = 0
        this.turn = 0
        this.lookAngle = 0
      }
    })

    window.addEventListener('mousedown', (event) => {
      if (document.pointerLockElement === document.body) {
        if (event.button === 0) {
          // Left mouse button
          this.move = 1
        } else if (event.button === 2) {
          // Right mouse button
          this.move = -0.5
        }
      }
    })

    window.addEventListener('mouseup', (event) => {
      if (event.button === 0 || event.button === 2) {
        this.move = 0
      }
    })

    // handle mouse movement
    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement === document.body) {
        // Apply a dead zone to mouse movement
        const deadZone = 6.0 // Dead zone in pixels (increased for better control)
        const sensitivityX = 0.001 // Horizontal sensitivity (reduced for smoother movement)
        const sensitivityY = 0.001 // Vertical sensitivity (reduced for smoother movement)
        const dampening = 0.8 // Dampening factor for smooth movement

        // Get mouse movement deltas
        const dx = event.movementX
        const dy = event.movementY

        // Apply dead zone and accumulate movement for horizontal
        if (Math.abs(dx) > deadZone) {
          // Only apply the portion of movement outside the dead zone
          const effectiveX = (dx * (Math.abs(dx) - deadZone)) / Math.abs(dx)
          this.turn += effectiveX * sensitivityX
        }

        // Apply dead zone and accumulate movement for vertical
        if (Math.abs(dy) > deadZone) {
          // Only apply the portion of movement outside the dead zone
          const effectiveY = (dy * (Math.abs(dy) - deadZone)) / Math.abs(dy)
          this.lookAngle += effectiveY * sensitivityY * 1.2
        }

        // Apply dampening to smooth out the movement
        this.turn *= dampening
        this.lookAngle *= dampening

        if (Math.abs(this.turn) < 0.001) this.turn = 0
        if (Math.abs(this.lookAngle) < 0.001) this.lookAngle = 0

        // Clamp values to reasonable ranges
        this.turn = Math.max(-1, Math.min(1, this.turn))
        this.lookAngle = Math.max(-0.1, Math.min(0.1, this.lookAngle))
      }
    })
  }
}
