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

	"github.com/benc-uk/terrain-gen/pkg/generation"
	"github.com/benc-uk/terrain-gen/pkg/gradients"
	"github.com/benc-uk/terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

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
	power := args[2].Float()
	large := args[3].Bool()

	size := 9
	if large {
		size = 10
	}

	// Generate heightmap using DiamondSquare algorithm
	data := generation.DiamondSquare(size, seed, roughness)

	// Post-process the data
	postprocess.Normalize(data)
	postprocess.Power(data, power)

	// Create gradient
	grad, err := gradients.ClassicTerrain()
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
