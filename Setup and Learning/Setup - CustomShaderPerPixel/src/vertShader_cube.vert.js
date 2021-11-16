//language=GLSL
export const vertShader_cube =`

uniform vec3 boxLength;
out vec3 localposVertex;

void main() {
    localposVertex = (position + boxLength / 2.0) / boxLength;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}`