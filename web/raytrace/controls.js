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
          this.turn = -1
          break
        case 'd':
          this.turn = 1
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
        const deadZone = 1.0 // Dead zone in pixels
        const sensitivityX = 0.2 // Horizontal sensitivity
        const sensitivityY = 0.2 // Vertical sensitivity

        // Get mouse movement deltas
        const dx = event.movementX
        const dy = event.movementY

        // Apply dead zone to horizontal movement
        if (Math.abs(dx) > deadZone) {
          // Only apply the portion of movement outside the dead zone
          const effectiveX = (dx * (Math.abs(dx) - deadZone)) / Math.abs(dx)
          this.turn = effectiveX * sensitivityX
        } else {
          this.turn = 0
        }

        // Apply dead zone to vertical movement
        if (Math.abs(dy) > deadZone) {
          // Only apply the portion of movement outside the dead zone
          const effectiveY = (dy * (Math.abs(dy) - deadZone)) / Math.abs(dy)
          this.lookAngle = effectiveY * sensitivityY
        } else {
          this.lookAngle = 0
        }
      }
    })
  }
}
