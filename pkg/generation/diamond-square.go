package generation

import (
	"math/rand/v2"
)

// DiamondSquare generates a heightmap using the Diamond-Square algorithm.
// The sizeN parameter determines the size of the data as 2^sizeN + 1,
// the seed is used for predictable random number generation,
// and zoom controls the overall amplitude/scale of the terrain features.
func DiamondSquare(sizeN int, seed uint64, roughness float64) [][]float64 {
	size := 1<<sizeN + 1

	src := rand.NewPCG(seed, seed)
	rng := rand.New(src)

	var data = make([][]float64, size)
	for i := range data {
		data[i] = make([]float64, size)
	}

	// For periodic data, we need size-1 to be the actual grid size
	// The last row/column will be copies of the first row/column
	gridSize := size - 1

	heightFunc := func(val float64, scale float64) float64 {
		return val + (rng.Float64()-0.5)*scale
	}

	data[0][0] = heightFunc(0.5, 1.0)
	data[gridSize][0] = heightFunc(0.5, 1.0)
	data[0][gridSize] = heightFunc(0.5, 1.0)
	data[gridSize][gridSize] = heightFunc(0.5, 1.0)

	// Diamond-Square for fractal terrain generation with periodic boundaries
	scale := 1.0 // Initial scale for the first iteration
	for step := gridSize; step > 1; step /= 2 {
		halfStep := step / 2

		for x := 0; x < gridSize; x += step {
			for y := 0; y < gridSize; y += step {
				avg := (data[x][y] +
					data[(x+step)%gridSize][y] +
					data[x][(y+step)%gridSize] +
					data[(x+step)%gridSize][(y+step)%gridSize]) / 4.0

				data[(x+halfStep)%gridSize][(y+halfStep)%gridSize] = heightFunc(avg, scale)
			}
		}

		// Square step
		for x := 0; x < gridSize; x += halfStep {
			for y := (x + halfStep) % step; y < gridSize; y += step {
				// Average of 4 neighbors with periodic boundaries
				avg := (data[(x-halfStep+gridSize)%gridSize][y] +
					data[(x+halfStep)%gridSize][y] +
					data[x][(y-halfStep+gridSize)%gridSize] +
					data[x][(y+halfStep)%gridSize]) / 4.0

				data[x][y] = heightFunc(avg, scale)
			}
		}

		// Decrease scale for next iteration using roughness factor
		scale *= 1.0 / roughness
	}

	// Copy the periodic boundaries to make the data truly periodic
	for i := 0; i < gridSize; i++ {
		data[i][gridSize] = data[i][0] // Copy first column to last column
		data[gridSize][i] = data[0][i] // Copy first row to last row
	}
	data[gridSize][gridSize] = data[0][0] // Copy corner

	return data
}
