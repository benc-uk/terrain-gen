//@ts-check
// ===============================================================================
// Heightmap
// A class for managing a heightmap from an ImageData object.
// This class provides methods to get height and color at specific coordinates.
// This assumes the height is stored in the alpha channel of the image data.
// ===============================================================================

export class HeightmapAlpha {
  /** @type {number} */
  #width
  /** @type {number} */
  #height
  /** @type {Uint8ClampedArray} */
  #data

  /**
   * Creates an instance of Heightmap.
   * @param {ImageData} imageData - The ImageData object containing heightmap data.
   */
  constructor(imageData) {
    this.#width = imageData.width
    this.#height = imageData.height
    this.#data = imageData.data

    console.log(`Heightmap created with dimensions: ${this.#width}x${this.#height}`)
  }

  /**
   * Gets the height at the specified coordinates with wrapping.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @returns {number} The height at the specified coordinates in range 0-255.
   */
  getHeight(x, y) {
    // Floor the coordinates first, then wrap to stay within bounds
    x = Math.floor(x)
    y = Math.floor(y)
    x = ((x % this.#width) + this.#width) % this.#width
    y = ((y % this.#height) + this.#height) % this.#height

    const index = (y * this.#width + x) * 4
    return this.#data[index + 3] // Return the alpha channel as height
  }

  /**
   * Gets the color at the specified coordinates as an RGB array with wrapping.
   * @param {number} x - The x coordinate.
   * @param {number} y - The y coordinate.
   * @returns {Array<number>} An array containing the RGB values.
   */
  getColor(x, y) {
    // Floor the coordinates first, then wrap to stay within bounds
    x = Math.floor(x)
    y = Math.floor(y)
    x = ((x % this.#width) + this.#width) % this.#width
    y = ((y % this.#height) + this.#height) % this.#height

    const index = (y * this.#width + x) * 4
    return [
      this.#data[index], // Red
      this.#data[index + 1], // Green
      this.#data[index + 2], // Blue
    ]
  }

  get width() {
    return this.#width
  }

  get height() {
    return this.#height
  }
}
