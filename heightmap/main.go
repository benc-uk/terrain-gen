package main

import (
	"image"
	"image/png"
	"log"
	"os"
	"terrain-gen/pkg/generation"
	"terrain-gen/pkg/postprocess"

	"github.com/mazznoer/colorgrad"
)

// convert to a BW png image the data in range [0, 1]
// and save it to a file

func main() {
	//uint64(10669432156977387813)
	//uint64(17288593777797703085)
	//uint64(7431898631184268366)

	seed := uint64(7431898631184268366) //rand.Uint64()
	log.Printf("Using seed: %d\n", seed)
	data := generation.DiamondSquare(8, seed, 1.9)

	log.Printf("Heightmap size: %d x %d\n", len(data), len(data[0]))

	postprocess.Normalize(data)
	postprocess.Power(data, 1.8)

	grad, err := classicTerrainGrad()
	if err != nil {
		log.Fatal("Failed to create gradient:", err)
	}

	err = saveAsPNG(data, "heightmap.png", grad)
	if err != nil {
		log.Fatal("Failed to save PNG:", err)
	}
}

func saveAsPNG(data [][]float64, filename string, grad *colorgrad.Gradient) error {
	width := len(data)
	height := len(data[0])

	img := image.NewRGBA(image.Rect(0, 0, width, height))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, grad.At(data[x][y]))
		}
	}

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	return png.Encode(file, img)
}
