package postprocess

import (
	"log"
	"math"
	"math/rand/v2"
)

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

func BoxBlur(data [][]float64, size float64) {
	if size <= 0 {
		log.Println("Box blur size must be positive, skipping blur")
		return
	}

	// Create a copy of the data to work with
	width, height := len(data), len(data[0])
	temp := make([][]float64, width)
	for i := range temp {
		temp[i] = make([]float64, height)
		copy(temp[i], data[i])
	}

	// Calculate the radius (half the size, rounded down)
	radius := int(size / 2)

	for x := 0; x < width; x++ {
		for y := 0; y < height; y++ {
			sum := 0.0
			count := 0

			// Calculate the average of the values in the box
			for dx := -radius; dx <= radius; dx++ {
				for dy := -radius; dy <= radius; dy++ {
					nx, ny := x+dx, y+dy

					// Skip if out of bounds
					if nx < 0 || nx >= width || ny < 0 || ny >= height {
						continue
					}

					sum += temp[nx][ny]
					count++
				}
			}

			// Set the average value
			if count > 0 {
				data[x][y] = sum / float64(count)
			}
		}
	}
}

func MonoNoise(data [][]float64, amount float64) {
	if amount <= 0 {
		log.Println("Mono noise amount must be positive, skipping noise")
		return
	}

	width, height := len(data), len(data[0])
	for x := 0; x < width; x++ {
		for y := 0; y < height; y++ {
			noise := (rand.Float64()*2 - 1) * amount // Random value between -amount and +amount
			data[x][y] += noise

			// Clamp the value to [0, 1]
			if data[x][y] < 0 {
				data[x][y] = 0
			} else if data[x][y] > 1 {
				data[x][y] = 1
			}
		}
	}
}
