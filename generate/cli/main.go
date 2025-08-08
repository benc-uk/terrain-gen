// =======================================================================
// A simple terrain generation tool using the Diamond-Square algorithm
// =======================================================================

package main

import (
	"flag"
	"image"
	"image/png"
	"log"
	"math"
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
	erosion := flag.Float64("erosion", 1.9, "Erosion factor for the terrain generation")
	encodeHeightAsAlpha := flag.Bool("heightAlpha", true, "Encode height as alpha in the output image")

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

	// remove the first row and column to make it square
	if len(data) > 0 {
		data = data[1:]
		for i := range data {
			if len(data[i]) > 0 {
				data[i] = data[i][1:]
			}
		}
	}

	log.Printf("Heightmap size: %d x %d", len(data), len(data[0]))

	// Three really important post-processing steps
	postprocess.Normalize(data)
	postprocess.Power(data, *erosion)
	postprocess.BoxBlur(data, 4)
	postprocess.SeaLevel(data, 0.1)

	grad, err := gradients.ClassicTerrain()
	if err != nil {
		log.Fatal("Failed to create gradient:", err)
	}

	img := mapToImage(data, grad, *encodeHeightAsAlpha)

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

			// if h > 0.13 {
			// 	// Add a subtle noise effect to the color
			// 	noise := (rand.Float64() - 0.5) * 0.3 // Reduced noise range to -0.015 to 0.015
			// 	noiseFactor := 1.0 + noise            // Use 1.0 + noise to create small variations

			// 	// Apply noise while keeping values in valid range
			// 	color.R = color.R * noiseFactor
			// 	color.G = color.G * noiseFactor
			// 	color.B = color.B * noiseFactor
			// }

			// Calculate normal vector
			nx, ny, nz := 0.0, 0.0, 1.0
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
			scale := 5.0 // Controls how pronounced the lighting effect is
			nx, ny = -dx*scale, -dy*scale
			magnitude := math.Sqrt(nx*nx + ny*ny + 1)
			nx, ny, nz = nx/magnitude, ny/magnitude, 1.0/magnitude

			// Light direction (coming from the northwest)
			lightX, lightY, lightZ := -10.5, -5.5, 2.7
			lightMag := math.Sqrt(lightX*lightX + lightY*lightY + lightZ*lightZ)
			lightX, lightY, lightZ = lightX/lightMag, lightY/lightMag, lightZ/lightMag

			// Dot product for diffuse lighting
			dotProduct := nx*lightX + ny*lightY + nz*lightZ
			if dotProduct < 0 {
				dotProduct = 0
			}

			// Ambient light component
			ambient := 0.2
			diffuse := 4.5 * dotProduct
			light := ambient + diffuse

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
