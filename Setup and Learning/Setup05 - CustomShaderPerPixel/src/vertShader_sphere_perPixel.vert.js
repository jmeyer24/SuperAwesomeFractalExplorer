//language=GLSL
export const vertShader_sphere_perPixel =`

// pass vertex coordinate in world space to fragment shader
out vec4 posVertex;
// normals of current vertex: we have to pass this variable to this fragment shader because it order to interpolate the normals
out vec3 normalVertex;

void main() {
    posVertex = modelMatrix * vec4( position, 1.0);
    normalVertex = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}`