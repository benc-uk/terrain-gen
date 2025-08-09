# Makefile for Terrain Generation Project

.PHONY: help run watch web-build web-serve web clean cli-run

DEFAULT: help

help:
	@grep -E '^[a-zA-Z_-]+:.*#' $(MAKEFILE_LIST) | sed -e 's/^\([^:]*\):[^#]*#\(.*\)/\1 \2/' | awk '{printf "\033[32m%-20s\033[0m %s\n", $$1, substr($$0, length($$1) + 2)}'

cli-run: # Run the terrain generation program
	@echo "Running terrain generation CLI..."
	go run generate/cli/main.go

web-build: # Build the web application (WASM)
	@echo "Building web application..."
	@rm -rf web/generate/main.wasm
	@cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" web/generate/wasm_exec.js
	GOOS=js GOARCH=wasm go build -o web/generate/main.wasm generate/web/main.go

web-serve: web-build # Serve the web application
	@echo "Starting web server on http://localhost:8000"
	@cd web && python3 -m http.server 8000 --bind 127.0.0.1

web: web-build web-serve # Build and serve the web application

clean: # Clean up generated files
	@echo "Cleaning up generated files..."
	find . -name output -exec rm -rf {} \;
	@rm -f web/generate/main.wasm
	