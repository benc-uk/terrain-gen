package algo

import "math/rand/v2"

func DiamondSquare(size int, seed uint64) [][]float64 {

	src := rand.NewPCG(seed, seed)
	rng := rand.New(src)

	var data = make([][]float64, size)
	for i := range data {
		data[i] = make([]float64, size)
	}

	// init the four corners
	data[0][0] = rng.Float64()
	data[size-1][0] = rng.Float64()
	data[0][size-1] = rng.Float64()
	data[size-1][size-1] = rng.Float64()

	return data
}
