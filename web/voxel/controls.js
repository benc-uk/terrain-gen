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
          this.move = -0.5
          break
        case 'a':
          this.turn = -2.3
          break
        case 'd':
          this.turn = 2.3
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
        if (Math.abs(event.movementX) > 5) {
          this.turn = event.movementX / 10
        } else {
          this.turn = 0
        }

        if (Math.abs(event.movementY) > 5) {
          this.lookAngle = event.movementY / 10
        } else {
          this.lookAngle = 0
        }
      }
    })
  }
}
