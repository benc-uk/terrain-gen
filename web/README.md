# Web Terrain Generator

This is a web-based version of the terrain generator that runs in your browser using WebAssembly (WASM).

## Features

- **Interactive Controls**: Adjust roughness and seed values in real-time
- **Random Seed Generation**: Click "Random" to generate new terrain variations
- **Real-time Preview**: See terrain changes instantly as you adjust parameters
- **High-Quality Rendering**: Uses the same Diamond-Square algorithm as the CLI version

## Usage

### Building and Running

1. **Build the WASM binary:**

   ```bash
   ./build-web.sh
   ```

   or

   ```bash
   make build-web
   ```

2. **Start the web server:**

   ```bash
   make web
   ```

   or manually:

   ```bash
   cd web && python3 -m http.server 8080
   ```

3. **Open in browser:**
   Navigate to http://localhost:8080

### Controls

- **Roughness Slider (1.1 - 3.0)**: Controls terrain smoothness
  - Lower values = smoother, more rolling terrain
  - Higher values = more jagged, mountainous terrain
- **Seed Input**: Numeric seed for reproducible terrain
  - Enter any number for consistent results
  - Click "Random" to generate a new random seed
- **Generate Button**: Manually trigger terrain generation
  - Terrain also updates automatically when you change controls

## Technical Details

- Built with Go compiled to WebAssembly
- Uses the same Diamond-Square algorithm as the CLI version
- Terrain size is fixed at 2^9 + 1 = 513x513 pixels
- Applies normalization and power curve post-processing
- Renders with a classic terrain color gradient

## Files

- `main.go` - WASM-compatible Go code with JavaScript bindings
- `index.html` - Web interface with controls and styling
- `build-web.sh` - Build script for WASM compilation
- `main.wasm` - Compiled WebAssembly binary (generated)
- `wasm_exec.js` - Go WASM runtime helper (copied from Go installation)

## Browser Compatibility

Works in all modern browsers that support WebAssembly:

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+
