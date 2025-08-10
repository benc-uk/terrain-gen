//@ts-check

import * as twgl from './twgl.js'

const vertShaderSource = `#version 300 es
precision highp float;

in vec4 position;
out vec2 imgCoord;   // Normalized image coordinates [0, 1]

void main() {
  gl_Position = position;
  imgCoord = position.xy * 0.5 + 0.5; // Convert from [-1, 1] to [0, 1]
}
`

const fragShaderSource = `#version 300 es
precision highp float;

in vec2 imgCoord;
uniform sampler2D image;
out vec4 pixel;

void main() {
  vec4 color = texture(image, vec2(imgCoord.x, -imgCoord.y));
  if(color.r == 0.0 && color.g == 0.0 && color.b == 0.0) discard;
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

    this.#outTex = twgl.createTexture(gl, {
      minMag: gl.LINEAR,
      src: this.#outData,
      width: this.width,
      height: this.height,
    })

    this.#bgTex = twgl.createTexture(gl, {
      minMag: gl.LINEAR,
      src: 'sky.png',
    })

    gl.clearColor(0, 0, 0, 1)
  }

  drawVLine(x, ytop, ybottom, r, g, b) {
    if (ytop > ybottom) {
      return
    }

    for (let y = ytop; y < ybottom; y++) {
      const index = (y * this.width + x) * 4
      this.#outData[index] = r
      this.#outData[index + 1] = g
      this.#outData[index + 2] = b
      this.#outData[index + 3] = 0
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
    twgl.setBuffersAndAttributes(gl, this.#progInfo, this.#quadBuffer)
    twgl.setUniforms(this.#progInfo, {
      image: this.#bgTex,
    })
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
    const gl = this.#gl

    // NOTE: Should we use fill(0) instead?
    this.#outData = new Uint8Array(this.width * this.height * 4)
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT)
  }

  get fps() {
    return this.#fps
  }
}
