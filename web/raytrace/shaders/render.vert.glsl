#version 300 es
precision highp float;

// Most basic vertex shader for rendering a full-screen quad

in vec4 position;
out vec2 ndc;

void main() {
  gl_Position = position;
  ndc = position.xy;
}