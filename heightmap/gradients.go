package main

import (
	"github.com/mazznoer/colorgrad"
)

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
