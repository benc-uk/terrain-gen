/**
 * Fetches a file and returns its contents as text.
 * @param {string} url - The URL of the file to fetch.
 * @param {Object} options - Optional fetch options.
 * @returns {Promise<string>} A promise that resolves to the file contents as text.
 */
async function fetchText(url, options = {}) {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.text()
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

/**
 * Fetches a JSON file and returns its parsed contents.
 * @param {string} url - The URL of the JSON file to fetch.
 * @param {Object} options - Optional fetch options.
 * @returns {Promise<any>} A promise that resolves to the parsed JSON data.
 */
async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error)
    throw error
  }
}

export { fetchText, fetchJSON }
