//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"math"
	"math/rand/v2"
	"syscall/js"

	"github.com/benc-uk/terrain-gen/pkg/generation"
	"github.com/benc-uk/terrain-gen/pkg/gradients"
	"github.com/benc-uk/terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

const AMBIENT = 0.2 // Ambient light component
const DIFFUSE = 3.0 // Diffuse light component multiplier

func main() {
	c := make(chan struct{}, 0)

	// Register functions to be called from JavaScript
	js.Global().Set("generateTerrain", js.FuncOf(generateTerrain))
	js.Global().Set("generateRandomSeed", js.FuncOf(generateRandomSeed))

	<-c
}

func generateTerrain(this js.Value, args []js.Value) any {
	if len(args) < 4 {
		return "Error: Need seed, roughness, power & size parameters"
	}

	// Parse parameters from JavaScript
	seed := uint64(args[0].Float())
	roughness := args[1].Float()
	erosion := args[2].Float()

	// Generate heightmap using DiamondSquare algorithm
	data := generation.DiamondSquare(10, seed, roughness)

	//remove the first row and column to make it square
	if len(data) > 0 {
		data = data[1:]
		for i := range data {
			if len(data[i]) > 0 {
				data[i] = data[i][1:]
			}
		}
	}

	// Three really important post-processing steps to eliminate height spikes
	postprocess.Normalize(data)
	postprocess.Power(data, erosion)
	postprocess.BoxBlur(data, 4)
	postprocess.SeaLevel(data, 0.1)

	// Create gradient
	grad, err := gradients.ClassicTerrain()
	if err != nil {
		return "Error creating gradient: " + err.Error()
	}

	// Render the image
	img := renderImage(data, grad, true)

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return "Error encoding image: " + err.Error()
	}

	// Convert to base64 for display in browser
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
}

func generateRandomSeed(this js.Value, args []js.Value) interface{} {
	return float64(rand.Uint64())
}

// renderImage converts a 2D heightmap to an RGBA image using the provided color gradient.
func renderImage(data [][]float64, grad *colorgrad.Gradient, heightToAlpha bool) *image.RGBA {
	width := len(data)
	height := len(data[0])

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			h := data[x][y]

			// Get pixel color from gradient
			color := grad.At(h)

			// Calculate normal vector
			nx, ny, nz := 0.0, 1.0, 0.0
			// Calculate normal using a Sobel operator with wrapping
			// Get wrapped indices for x-1, x+1, y-1, y+1
			xm1 := (x - 1 + width) % width
			xp1 := (x + 1) % width
			ym1 := (y - 1 + height) % height
			yp1 := (y + 1) % height

			// Sobel operator for gradient with wrapped indices
			dx := (data[xp1][ym1] + 2*data[xp1][y] + data[xp1][yp1]) -
				(data[xm1][ym1] + 2*data[xm1][y] + data[xm1][yp1])
			dy := (data[xm1][yp1] + 2*data[x][yp1] + data[xp1][yp1]) -
				(data[xm1][ym1] + 2*data[x][ym1] + data[xp1][ym1])

			// Normal vector (normalized)
			scale := 10.0 // Controls how pronounced the lighting effect is
			nx, ny = -dx*scale, -dy*scale
			magnitude := math.Sqrt(nx*nx + ny*ny + 1)
			nx, ny, nz = nx/magnitude, ny/magnitude, 1.0/magnitude

			// Light direction (coming from the northwest)
			lightX, lightY, lightZ := -10.0, -6.0, 3.2
			lightMag := math.Sqrt(lightX*lightX + lightY*lightY + lightZ*lightZ)
			lightX, lightY, lightZ = lightX/lightMag, lightY/lightMag, lightZ/lightMag

			// Dot product for diffuse lighting
			dotProduct := nx*lightX + ny*lightY + nz*lightZ
			if dotProduct < 0 {
				dotProduct = 0
			}

			// Light component
			light := AMBIENT + (DIFFUSE * dotProduct)

			// Apply lighting to color
			color.R *= light
			color.G *= light
			color.B *= light

			// Encode the height as alpha if required
			if heightToAlpha {
				color.A = h
			}

			// Clamp RGB values to [0, 1] range
			color.R, color.G, color.B = clampRGB(color.R, color.G, color.B)

			// Debug: highlight edges
			// if x <= 1 || y <= 1 {
			// 	color.R, color.G, color.B = 1, 0, 0 // Red border for debugging
			// }

			img.Set(x, y, color)
		}
	}

	return img
}

func clampRGB(r, g, b float64) (float64, float64, float64) {
	if r < 0 {
		r = 0
	} else if r > 1 {
		r = 1
	}
	if g < 0 {
		g = 0
	} else if g > 1 {
		g = 1
	}
	if b < 0 {
		b = 0
	} else if b > 1 {
		b = 1
	}
	return r, g, b
}
