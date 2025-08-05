//go:build js && wasm
// +build js,wasm

package main

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/png"
	"math/rand/v2"
	"syscall/js"
	"terrain-gen/pkg/generation"
	"terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

func main() {
	c := make(chan struct{}, 0)

	// Register functions to be called from JavaScript
	js.Global().Set("generateTerrain", js.FuncOf(generateTerrain))
	js.Global().Set("generateRandomSeed", js.FuncOf(generateRandomSeed))

	<-c
}

func generateTerrain(this js.Value, args []js.Value) interface{} {
	if len(args) < 3 {
		return "Error: Need seed, roughness, and power parameters"
	}

	// Parse parameters from JavaScript
	seed := uint64(args[0].Float())
	roughness := args[1].Float()
	power := args[2].Float()

	// Generate heightmap using DiamondSquare algorithm
	data := generation.DiamondSquare(9, seed, roughness)

	// Post-process the data
	postprocess.Normalize(data)
	postprocess.Power(data, power)

	// Create gradient
	grad, err := classicTerrainGrad()
	if err != nil {
		return "Error creating gradient: " + err.Error()
	}

	// Convert to PNG image
	imgData, err := createPNGData(data, grad)
	if err != nil {
		return "Error creating PNG: " + err.Error()
	}

	// Convert to base64 for display in browser
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(imgData)
}

func generateRandomSeed(this js.Value, args []js.Value) interface{} {
	return float64(rand.Uint64())
}

func createPNGData(data [][]float64, grad *colorgrad.Gradient) ([]byte, error) {
	width := len(data)
	height := len(data[0])

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, grad.At(data[x][y]))
		}
	}

	var buf bytes.Buffer
	err := png.Encode(&buf, img)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func classicTerrainGrad() (*colorgrad.Gradient, error) {
	var err error
	grad, err := colorgrad.NewGradient().
		Colors(
			// Dark blue for water
			colorgrad.Rgb8(0, 0, 128, 255),
			// light blue for shallow water
			colorgrad.Rgb8(100, 130, 200, 255),
			// Sand color
			colorgrad.Rgb8(220, 180, 140, 255),
			// light grass
			colorgrad.Rgb8(50, 139, 50, 255),
			// dark grass
			colorgrad.Rgb8(50, 100, 24, 255),
			// stone rock gray
			colorgrad.Rgb8(50, 60, 70, 255),
			// dark rock gray
			colorgrad.Rgb8(110, 95, 110, 255),
			// snow white
			colorgrad.Rgb8(255, 255, 255, 255),
		).
		Domain(0.09, 0.12, 0.125, 0.15, 0.3, 0.55, 0.82, 0.99).
		Build()

	if err != nil {
		return nil, err
	}

	return &grad, nil
}
