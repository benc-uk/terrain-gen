# Web Terrain Generator

This is a web-based version of the terrain generator that runs in your browser using WebAssembly (WASM).

## Features

- **Interactive Controls**: Adjust smoothness, erosion, and seed values in real-time
- **Random Seed Generation**: Click "🎲 Random" to generate new terrain variations
- **Auto-generation**: Terrain updates automatically when you adjust any control
- **Loading Indicators**: Visual feedback with spinner during terrain generation
- **High-Quality Rendering**: Uses the same Diamond-Square algorithm as the CLI version
- **Responsive Design**: Clean, modern interface that works on different screen sizes

## Usage

### Building and Running

1. **Build the WASM binary:**

   ```bash
   cd /path/to/terrain-gen
   ./scripts/build-web.sh
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

- **Smoothness Slider (1.2 - 2.3)**: Controls terrain roughness/smoothness
  - Lower values = smoother, more rolling terrain
  - Higher values = more jagged, mountainous terrain
- **Erosion Slider (0.5 - 3.0)**: Controls elevation distribution and terrain character
  - Lower values = flatter, more uniform elevation
  - Higher values = more dramatic height variations and valleys
- **Seed Input**: Numeric seed for reproducible terrain
  - Enter any number for consistent results
  - Click "🎲 Random" to generate a new random seed
- **🚀 Generate Button**: Manually trigger terrain generation
  - Terrain also updates automatically when you change any control
  - Button shows loading spinner and is disabled during generation

## Technical Details

- Built with Go compiled to WebAssembly
- Uses the same Diamond-Square algorithm as the CLI version
- Terrain size is fixed at 2^10 + 1 = 1025x1025 pixels
- Applies normalization and power curve post-processing for realistic elevation distribution
- Renders with a classic terrain color gradient
- Asynchronous generation prevents UI blocking during computation
- Automatic terrain generation on control changes for seamless interaction

## Files

- `main.go` - WASM-compatible Go code with JavaScript bindings
- `index.html` - Web interface with controls, styling, and JavaScript logic
- `../scripts/build-web.sh` - Build script for WASM compilation
- `main.wasm` - Compiled WebAssembly binary (generated)
- `wasm_exec.js` - Go WASM runtime helper (copied from Go installation)

## Browser Compatibility

Works in all modern browsers that support WebAssembly:

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+
