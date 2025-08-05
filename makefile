# Makefile for Terrain Generation Project

.PHONY: all run watch web build-web serve-web

DEFAULT: run

run:
	go run heightmap/*

watch:
	go tool -modfile=.dev/tools.mod air -c .dev/air.toml

# Web/WASM targets
build-web:
	./scripts/build-web.sh

serve-web: build-web
	@echo "Starting web server on http://localhost:8080"
	cd web && python3 -m http.server 8080

web: build-web serve-web