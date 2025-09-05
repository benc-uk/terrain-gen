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
const float MAX_DISTANCE = 10000.0; // Maximum ray distance
const float MIN_STEP = 4.0; // Minimum step size

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

// DDA-optimized raytracing for terrain intersection
bool raycastTerrain(vec3 rayOrigin, vec3 rayDir, out vec3 hitPoint, out vec3 color) {
  vec3 currentPos = rayOrigin;
  float t = 0.0;

  // Calculate step size based on heightmap resolution for DDA-like behavior
  vec2 mapSize = vec2(textureSize(u_map, 0));
  float worldTexelSize = u_terrainScale / max(mapSize.x, mapSize.y);
  float baseStepSize = worldTexelSize * 0.5; // Step through half texels for safety

  // March along the ray
  while(t < MAX_DISTANCE) {
    // Get terrain height at current position
    float terrainHeight = getHeight(currentPos.xz);

    // if ray starts above heiest point and is pointing up, no hit
    if(currentPos.y > u_heightScale && rayDir.y >= 0.0) {
      return false;
    }

    // Check for intersection
    if(currentPos.y <= terrainHeight) {
      hitPoint = currentPos;
      color = getColor(currentPos.xz);
      return true;
    }

    // Use consistent step size based on heightmap resolution
    float stepSize = max(MIN_STEP, baseStepSize);

    // Increase step size when high above terrain, this speeds up raymarching a lot!
    float heightDiff = (currentPos.y - terrainHeight) / u_heightScale;
    stepSize *= mix(1.0, 100.0, heightDiff);

    // Step along ray
    t += stepSize;
    currentPos = rayOrigin + rayDir * t;
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