//language=GLSL
export const vertShader_cube =`

uniform vec3 boxLength;
out vec3 localposVertex;

void main() {
    /* variable "position" is always predefined in the vertex shader!
       it contains a vec3 with local coordinates of the vertex */

    // moving box to positive local coordinates and normalize the lengths to be between 0 and 1
    localposVertex = (position + boxLength / 2.0) / boxLength;
    
    // transform local to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`