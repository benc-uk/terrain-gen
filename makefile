# Makefile for Terrain Generation Project

.PHONY: help run watch build-web serve-web web

DEFAULT: help

help:
	@grep -E '^[a-zA-Z_-]+:.*#' $(MAKEFILE_LIST) | sed -e 's/^\([^:]*\):[^#]*#\(.*\)/\1 \2/' | awk '{printf "\033[32m%-20s\033[0m %s\n", $$1, substr($$0, length($$1) + 2)}'

run: # Run the terrain generation program
	go run terrain/*

watch: # Watch for changes and rebuild
	go tool -modfile=.dev/tools.mod air -c .dev/air.toml

web-build: # Build the web application (WASM)
	@echo "Building web application..."
	rm -rf web/main.wasm
	GOOS=js GOARCH=wasm go build -o web/public/main.wasm web/main.go

web-serve: web-build # Serve the web application
	@echo "Starting web server on http://localhost:8080"
	@cd web/public && python3 -m http.server 8080 --bind 127.0.0.1

web: web-build web-serve # Build and serve the web application

