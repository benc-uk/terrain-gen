#!/bin/bash

# Build script for WASM terrain generator

echo "Building WASM terrain generator..."

# Set WASM environment variables
export GOOS=js
export GOARCH=wasm

# Build the WASM binary
echo "Compiling Go to WASM..."
go build -o web/main.wasm web/main.go

# Copy the WASM exec helper from Go installation if it doesn't exist
if [ ! -f web/wasm_exec.js ]; then
    echo "Copying wasm_exec.js..."
    cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" web/
else
    echo "wasm_exec.js already exists in web/ directory, skipping copy."
fi