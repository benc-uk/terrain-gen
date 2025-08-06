// =======================================================================
// A simple terrain generation tool using the Diamond-Square algorithm
// =======================================================================

package main

import (
	"flag"
	"image"
	"image/png"
	"log"
	"math/rand/v2"
	"os"

	"github.com/benc-uk/terrain-gen/pkg/generation"
	"github.com/benc-uk/terrain-gen/pkg/gradients"
	"github.com/benc-uk/terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

// Some nice looking seeds
//uint64(10669432156977387813)
//uint64(17288593777797703085)
//uint64(7431898631184268366)

func main() {

	size := flag.Int("size", 9, "Size of the terrain map (2^size x 2^size)")
	outFile := flag.String("out", "output/map.png", "Output file for the generated image")
	seed := flag.Uint64("seed", 0, "Random seed for terrain generation (0 for random seed)")
	smooth := flag.Float64("smooth", 1.78, "Smoothing factor for the terrain generation")
	erosion := flag.Float64("erosion", 1.9, "Erosion factor for the terrain generation (not implemented yet)")
	flag.Parse()

	if *size < 1 || *size > 12 {
		log.Fatal("Size must be between 1 and 12")
	}

	if err := os.MkdirAll("output", 0755); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	// Generate a random seed if none is provided
	if *seed == 0 {
		*seed = rand.Uint64()
	}

	log.Printf("Using seed: %d", *seed)
	data := generation.DiamondSquare(*size, *seed, *smooth)

	log.Printf("Heightmap size: %d x %d", len(data), len(data[0]))

	// Three really important post-processing steps
	postprocess.Normalize(data)
	postprocess.Power(data, *erosion)
	postprocess.SeaLevel(data, 0.091)

	grad, err := gradients.ClassicTerrain()
	if err != nil {
		log.Fatal("Failed to create gradient:", err)
	}

	img := mapToImage(data, grad, false)
	err = saveAsPNG(img, *outFile)
	if err != nil {
		log.Fatal("Failed to save image:", err)
	}
}

// mapToImage converts a 2D heightmap to an RGBA image using the provided color gradient.
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

// saveAsPNG saves the given image to a file in PNG format.
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
