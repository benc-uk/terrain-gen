//@ts-check
// ==============================================================================
// CanvasBlitter
// A class for fast rendering to a canvas using an offscreen buffer.
// ==============================================================================

/**
 * @class CanvasBlitter
 * @description A class for fast per pixel rendering to a canvas using an offscreen buffer.
 * @param {string} [selector='canvas'] - The CSS selector for the canvas element.
 * @param {number} [canvasWidth] - Optional width to set the canvas size.
 * @param {number} [canvasHeight] - Optional height to set the canvas size.
 */
export class CanvasBlitter {
  /** @type {boolean} */
  showFPS

  /** @type {CanvasRenderingContext2D} */
  #ctx

  /** @type {Uint8ClampedArray} */
  #buffer

  /** @type {ImageData} */
  #imageData

  /** @type {number} */
  #width

  /** @type {number} */
  #height

  /** @type {number | undefined} */
  #lastFrameTime

  /** @type {number | undefined} */
  #fps

  /**
   * Creates an instance of CanvasBlitter.
   * @param {string} [selector='canvas'] - The CSS selector for the canvas element.
   * @param {number} [canvasWidth] - Optional width to set the canvas size.
   * @param {number} [canvasHeight] - Optional height to set the canvas size.
   */
  constructor(selector = 'canvas', canvasWidth, canvasHeight) {
    const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector(selector))
    if (!canvas) {
      throw new Error(`Canvas not found with selector: ${selector}`)
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error(`Failed to get 2D context for canvas: ${selector}`)
    }

    this.#ctx = ctx

    // Force canvas size if setW and setH are provided
    if (canvasWidth && canvasHeight) {
      this.#ctx.canvas.width = canvasWidth
      this.#ctx.canvas.height = canvasHeight
    }

    this.#ctx.imageSmoothingEnabled = false
    this.#width = this.#ctx.canvas.width
    this.#height = this.#ctx.canvas.height

    this.#ctx.fillStyle = 'white'
    this.#ctx.font = `${Math.min(this.#width, this.#height) / 40}px Arial`

    const arrayBuffer = new ArrayBuffer(this.#width * this.#height * 4)
    this.#buffer = new Uint8ClampedArray(arrayBuffer)
    this.#imageData = new ImageData(this.#buffer, this.#width, this.#height)

    this.showFPS = false

    console.log(`CanvasBlitter created, size: ${this.#width}x${this.#height}`)
  }

  /**
   * Draws the current buffer to the canvas.
   * this should be called every frame in your main render loop.
   * @param {number} [ts] - Optional timestamp for the frame, useful for FPS calculation.
   * @returns {void}
   */
  draw(ts) {
    this.#imageData.data.set(this.#buffer)
    this.#ctx.putImageData(this.#imageData, 0, 0)

    if (this.showFPS) {
      this.#ctx.fillText(`FPS: ${this.#fps}`, 10, 30)
    }
    if (ts) {
      if (!this.#lastFrameTime) {
        this.#lastFrameTime = ts
      } else {
        const delta = ts - this.#lastFrameTime
        this.#fps = Math.round(1000 / delta)
        this.#lastFrameTime = ts
      }
    } else {
      this.#fps = 0
    }
  }

  /**
   * Sets a pixel at (x, y) to the specified RGB color
   * @param {number} x - The x-coordinate of the pixel.
   * @param {number} y - The y-coordinate of the pixel.
   * @param {number} r - The red component (0-255).
   * @param {number} g - The green component (0-255).
   * @param {number} b - The blue component (0-255).
   */
  setRGB(x, y, r, g, b) {
    const index = (y * this.#width + x) * 4
    this.#buffer[index] = r
    this.#buffer[index + 1] = g
    this.#buffer[index + 2] = b
    this.#buffer[index + 3] = 255 // alpha channel
  }

  /**
   * Draws a vertical line from ytop to ybottom at x with the specified RGB color.
   * @param {number} x - The x-coordinate of the vertical line.
   * @param {number} ytop - The top y-coordinate of the line.
   * @param {number} ybottom - The bottom y-coordinate of the line.
   * @param {number} r - The red component (0-255).
   * @param {number} g - The green component (0-255).
   * @param {number} b - The blue component (0-255).
   */
  drawVLine(x, ytop, ybottom, r, g, b) {
    for (let k = ytop; k < ybottom; k++) {
      const index = (k * this.#width + x) * 4
      this.#buffer[index] = r
      this.#buffer[index + 1] = g
      this.#buffer[index + 2] = b
      this.#buffer[index + 3] = 255 // alpha channel
    }
  }

  /**
   * Gets the pixel color at (x, y) as an object with r, g, b, a properties.
   * @param {number} x - The x-coordinate of the pixel.
   * @param {number} y - The y-coordinate of the pixel.
   * @returns {ArrayBuffer} The pixel data as an array of [r, g, b, a].
   */
  getPixel(x, y) {
    const index = (y * this.#width + x) * 4
    return this.#buffer.slice(index, index + 4)
  }

  /**
   * Clears the buffer by filling it with zeros (black).
   */
  clear() {
    this.#buffer.fill(0)
  }

  /**
   * Fills the entire buffer with a single RGB color.
   * @param {number} r - The red component (0-255).
   * @param {number} g - The green component (0-255).
   * @param {number} b - The blue component (0-255).
   */
  fill(r, g, b) {
    for (let i = 0; i < this.#buffer.length; i += 4) {
      this.#buffer[i] = r
      this.#buffer[i + 1] = g
      this.#buffer[i + 2] = b
      this.#buffer[i + 3] = 255 // alpha channel
    }
  }

  fillRect(x, y, width, height, r, g, b) {
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const index = ((y + j) * this.#width + (x + i)) * 4
        this.#buffer[index] = r
        this.#buffer[index + 1] = g
        this.#buffer[index + 2] = b
        this.#buffer[index + 3] = 255 // alpha channel
      }
    }
  }

  get width() {
    return this.#width
  }

  get height() {
    return this.#height
  }

  get context() {
    return this.#ctx
  }

  get buffer() {
    return this.#buffer
  }
}
