//@ts-check

import * as twgl from './twgl.js'

const vertShaderSource = /*glsl*/ `#version 300 es
precision highp float;

in vec4 position;
out vec2 imgCoord;   // Normalized image coordinates [0, 1]

void main() {
  gl_Position = position;
  imgCoord = position.xy * 0.5 + 0.5; // Convert from [-1, 1] to [0, 1]
}
`

const fragShaderSource = /*glsl*/ `#version 300 es
precision highp float;

in vec2 imgCoord;
uniform sampler2D image;
out vec4 pixel;

void main() {
  vec4 color = texture(image, vec2(imgCoord.x, -imgCoord.y));
  if(color.a == 0.0) discard; // Discard transparent pixels
  pixel = color;
}
`

export class GLBlitter {
  /** @type {WebGL2RenderingContext} */
  #gl
  /** @type {any} */
  #progInfo
  /** @type {twgl.BufferInfo} */
  #quadBuffer
  /** @type {WebGLTexture} */
  #outTex
  /** @type {WebGLTexture} */
  #bgTex
  /** @type {Uint8Array} */
  #outData
  /** @type {Uint32Array} */
  #outData32

  #lastFrameTime = 0
  #frameTimeBucket = []
  #fps = 0

  // Public properties
  showFPS = true
  width = 0
  height = 0

  constructor() {
    const canvas = document.querySelector('canvas')
    if (!canvas) {
      console.error('💥 Canvas element not found!')
      return
    }

    // Note: preserveDrawingBuffer needed for saving the canvas as an image
    const gl = /** @type {WebGL2RenderingContext} */ (canvas.getContext('webgl2', { preserveDrawingBuffer: true }))
    if (this.#gl) {
      console.error('💥 WebGL2 not supported!')
      return
    }

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    console.log('🎨 WebGL2 initialized successfully')

    this.#progInfo = twgl.createProgramInfo(gl, [vertShaderSource, fragShaderSource], null, null)

    // create quad that covers the whole canvas
    this.#quadBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    })

    // create a array to hold texture data
    this.#gl = gl
    this.width = gl.canvas.width
    this.height = gl.canvas.height

    this.#outData = new Uint8Array(this.width * this.height * 4)
    this.#outData32 = new Uint32Array(this.#outData.buffer)

    this.#outTex = twgl.createTexture(gl, {
      minMag: gl.LINEAR,
      src: this.#outData,
      width: this.width,
      height: this.height,
    })

    this.#bgTex = twgl.createTexture(gl, {
      minMag: gl.LINEAR,
      width: this.width,
      height: this.height,
    })

    gl.clearColor(0, 0, 0, 1)
  }

  drawVLine(x, ytop, ybottom, r, g, b) {
    if (ytop > ybottom) return

    // Pack RGBA into 32-bit value (little-endian)
    const packedColor = (255 << 24) | (b << 16) | (g << 8) | r

    for (let y = ytop; y < ybottom; y++) {
      this.#outData32[y * this.width + x] = packedColor
    }
  }

  draw(ts = 0) {
    if (!this.#gl) return
    const gl = this.#gl

    gl.useProgram(this.#progInfo.program)

    // Update the texture with the new data, important to do this before drawing!
    twgl.setTextureFromArray(gl, this.#outTex, this.#outData, {
      width: this.width,
      height: this.height,
      minMag: gl.LINEAR,
    })

    // Draw backgound
    twgl.setUniforms(this.#progInfo, {
      image: this.#bgTex,
    })
    twgl.setBuffersAndAttributes(gl, this.#progInfo, this.#quadBuffer)
    twgl.drawBufferInfo(gl, this.#quadBuffer)

    // Draw output image buffer
    twgl.setUniforms(this.#progInfo, {
      image: this.#outTex,
    })
    twgl.setBuffersAndAttributes(gl, this.#progInfo, this.#quadBuffer)
    twgl.drawBufferInfo(gl, this.#quadBuffer)

    const frameTime = ts - this.#lastFrameTime
    this.#frameTimeBucket.push(frameTime)
    if (this.#frameTimeBucket.length > 60) this.#frameTimeBucket.shift()
    this.#fps = Math.round(1000 / (this.#frameTimeBucket.reduce((a, b) => a + b, 0) / this.#frameTimeBucket.length))
    this.#lastFrameTime = ts
  }

  clear() {
    if (!this.#gl) return

    // NOTE: Should we use fill(0) instead?
    // this.#outData = new Uint8Array(this.width * this.height * 4)
    this.#outData.fill(0)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT)
  }

  backgroundGradient(r1, g1, b1, r2, g2, b2) {
    if (!this.#gl) return
    const gl = this.#gl
    const data = new Uint8Array(this.width * this.height * 4)

    for (let y = 0; y < this.height; y++) {
      const ratio = y / this.height
      const r = Math.floor(r1 + (r2 - r1) * ratio)
      const g = Math.floor(g1 + (g2 - g1) * ratio)
      const b = Math.floor(b1 + (b2 - b1) * ratio)
      for (let x = 0; x < this.width; x++) {
        const index = (y * this.width + x) * 4
        data[index] = r
        data[index + 1] = g
        data[index + 2] = b
        data[index + 3] = 255 // Fully opaque
        // Note: Using 255 for alpha to ensure the background is fully opaque
      }
    }
    twgl.setTextureFromArray(gl, this.#bgTex, data, {
      width: this.width,
      height: this.height,
      minMag: gl.LINEAR,
    })
  }

  get fps() {
    return this.#fps
  }
}
