package main

import (
	"image"
	"image/png"
	"log"
	"math/rand/v2"
	"os"
	"terrain-gen/pkg/generation"
	"terrain-gen/pkg/gradients"
	"terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

// convert to a BW png image the data in range [0, 1]
// and save it to a file

func main() {
	//uint64(10669432156977387813)
	//uint64(17288593777797703085)
	//uint64(7431898631184268366)

	seed := rand.Uint64()
	log.Printf("Using seed: %d\n", seed)
	data := generation.DiamondSquare(9, seed, 1.78)

	log.Printf("Heightmap size: %d x %d\n", len(data), len(data[0]))

	// Three really important post-processing steps
	// 1. Normalize the heightmap to [0, 1]
	// 2. Apply a power function to make the terrain more interesting
	// 3. Set a sea level threshold to define water areas
	postprocess.Normalize(data)
	postprocess.Power(data, 1.9)
	postprocess.SeaLevel(data, 0.091)

	grad, err := gradients.ClassicTerrain()
	if err != nil {
		log.Fatal("Failed to create gradient:", err)
	}

	img := mapToImage(data, grad, false)
	err = saveAsPNG(img, "output/map.png")
	if err != nil {
		log.Fatal("Failed to save image:", err)
	}
}

func mapToImage(data [][]float64, grad *colorgrad.Gradient, heightToAlpha bool) *image.RGBA {
	width := len(data)
	height := len(data[0])

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			h := data[x][y]
			color := grad.At(h)

			// Encode the height as alpha if required
			if heightToAlpha {
				color.A = h
			}

			img.Set(x, y, color)
		}
	}

	return img
}

func saveAsPNG(img *image.RGBA, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	err = png.Encode(file, img)
	if err != nil {
		return err
	}

	log.Printf("Image saved to %s\n", filename)
	return nil
}
