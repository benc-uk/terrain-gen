#version 300 es
precision highp float;

in vec2 ndc;
out vec4 pixel;

// Camera matrix
uniform mat4 u_viewProjectionMatrix;
uniform vec3 u_camPos; // Camera position

uniform sampler2D u_map; // height map

// Terrain configuration
uniform float u_heightScale; // how tall the terrain is in world units
uniform float u_terrainScale; // Size of terrain in world units

// Ray marching parameters
const int MAX_STEPS = 1200; // Maximum ray marching steps
const float MAX_DISTANCE = 2200.0; // Maximum ray distance
const float MIN_STEP = 0.9; // Minimum step size

// Get height from heightmap at world position
float getHeight(vec2 worldPos) {
  vec2 uv = worldPos / u_terrainScale;
  return texture(u_map, uv).a * u_heightScale;
}

// Get color from heightmap at world position
vec3 getColor(vec2 worldPos) {
  vec2 uv = worldPos / u_terrainScale;
  return texture(u_map, uv).rgb;
}

// Simple raytracing for terrain intersection
bool raycastTerrain(vec3 rayOrigin, vec3 rayDir, out vec3 hitPoint, out vec3 color) {
  vec3 currentPos = rayOrigin;
  float t = 0.0;
  float stepSize = MIN_STEP;

  // March along the ray
  for(int i = 0; i < MAX_STEPS; i++) {
    // Get terrain height at current position
    float terrainHeight = getHeight(currentPos.xz);

    // Check for intersection
    if(currentPos.y <= terrainHeight) {
      hitPoint = currentPos;
      color = getColor(currentPos.xz);
      return true;
    }

    // Adaptive step size based on height above terrain
    float heightDiff = currentPos.y - terrainHeight;
    if(heightDiff > 0.0) {
      stepSize = max(MIN_STEP, min(9.0, heightDiff * 0.5));
    }

    // Step along ray
    t += stepSize;
    currentPos = rayOrigin + rayDir * t;

    // Stop if we've gone too far distance-wise
    if(t > MAX_DISTANCE) {
      break;
    }
  }

  return false;
}

void main() {
  // Calculate ray direction from camera through this fragment  
  vec3 rayOrigin = u_camPos;

  // Create ray direction from NDC coordinates
  // Transform NDC to world space direction
  vec4 nearPoint = inverse(u_viewProjectionMatrix) * vec4(ndc.x, ndc.y, -1.0, 1.0);
  vec4 farPoint = inverse(u_viewProjectionMatrix) * vec4(ndc.x, ndc.y, 1.0, 1.0);

  nearPoint /= nearPoint.w;
  farPoint /= farPoint.w;

  vec3 rayDir = normalize(farPoint.xyz - nearPoint.xyz);

  vec3 hitPoint;
  vec3 terrainColor;

  // Perform raycast
  if(raycastTerrain(rayOrigin, rayDir, hitPoint, terrainColor)) {
    pixel = vec4(terrainColor, 1.0);
  } else {
    // Sky color gradient
    float t = 0.9 * (rayDir.y + 1.0);
    vec3 skyColor = mix(vec3(0.9, 0.9, 1.0), vec3(0.1, 0.2, 0.3), t);
    pixel = vec4(skyColor, 1.0);
  }
}