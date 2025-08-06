package gradients

import (
	"github.com/mazznoer/colorgrad"
)

func ClassicTerrain() (*colorgrad.Gradient, error) {
	var err error
	grad, err := colorgrad.NewGradient().
		Colors(
			// Dark blue for water
			colorgrad.Rgb8(0, 20, 128, 255),
			// light blue for shallow water
			colorgrad.Rgb8(100, 130, 200, 255),
			// Sand color
			colorgrad.Rgb8(220, 180, 140, 255),
			// dark grass
			colorgrad.Rgb8(35, 70, 20, 255),
			// light grass
			colorgrad.Rgb8(70, 130, 50, 255),
			// brown for dirt
			colorgrad.Rgb8(124, 103, 51, 255),
			// dark rock gray
			colorgrad.Rgb8(85, 85, 85, 255),
			// snow white
			colorgrad.Rgb8(255, 255, 255, 255),
		).
		Domain(0.09, 0.12, 0.125, 0.15, 0.35, 0.55, 0.82, 0.95).
		Build()

	if err != nil {
		return nil, err
	}

	return &grad, nil
}
