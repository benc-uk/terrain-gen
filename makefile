# Makefile for Terrain Generation Project

.PHONY: all run watch

DEFAULT: run

run:
	go run heightmap/*

watch:
	go tool -modfile=.dev/tools.mod air -c .dev/air.toml