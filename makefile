# Makefile for Terrain Generation Project

.PHONY: help run watch build-web serve-web web

DEFAULT: help

help:
	@grep -E '^[a-zA-Z_-]+:.*#' $(MAKEFILE_LIST) | sed -e 's/^\([^:]*\):[^#]*#\(.*\)/\1 \2/' | awk '{printf "\033[32m%-20s\033[0m %s\n", $$1, substr($$0, length($$1) + 2)}'

cli-run: # Run the terrain generation program
	@echo "Running terrain generation CLI..."
	go run generate/cli/main.go

cli-watch: # Watch for changes and rebuild
	@echo "Watching for changes in terrain generation CLI..."
	go tool -modfile=.dev/tools.mod air -c .dev/air.toml

web-build: # Build the web application (WASM)
	@echo "Building web application..."
	@rm -rf generate/web/main.wasm
	@cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" generate/web/public/
	GOOS=js GOARCH=wasm go build -o generate/web/public/main.wasm generate/web/main.go

web-serve: web-build # Serve the web application
	@echo "Starting web server on http://localhost:8080"
	@cd generate/web/public && python3 -m http.server 8080 --bind 127.0.0.1

web: web-build web-serve # Build and serve the web application

