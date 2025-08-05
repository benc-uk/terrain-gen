package postprocess

import "math"

func SeaLevel(data [][]float64, seaLevel float64) {
	for x := range data {
		for y := range data[x] {
			if data[x][y] < seaLevel {
				data[x][y] = seaLevel
			}
		}
	}
}

func Normalize(data [][]float64) {
	var min, max float64
	min = data[0][0]
	max = data[0][0]

	for x := range data {
		for y := range data[x] {
			if data[x][y] < min {
				min = data[x][y]
			}
			if data[x][y] > max {
				max = data[x][y]
			}
		}
	}

	rangeVal := max - min
	if rangeVal == 0 {
		return // No normalization needed if all values are the same
	}

	for x := range data {
		for y := range data[x] {
			data[x][y] = (data[x][y] - min) / rangeVal
		}
	}
}

func Scale(data [][]float64, scaleFactor float64) {
	for x := range data {
		for y := range data[x] {
			data[x][y] *= scaleFactor
		}
	}
}

func Power(data [][]float64, exponent float64) {
	for x := range data {
		for y := range data[x] {
			data[x][y] = math.Pow(data[x][y], exponent)
			if math.IsNaN(data[x][y]) || math.IsInf(data[x][y], 0) {
				data[x][y] = 0 // Handle NaN or Inf values
			}
		}
	}
}
