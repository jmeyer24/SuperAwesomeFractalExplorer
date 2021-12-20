//language=GLSL
export const fragShader_sphere_perVertex = `

precision highp float;
precision highp int;

in vec4 per_vertexShading;

out vec4 out_FragColor;
// interpolated colors from the vertex shader

void main(){
    // assign the color to fragment
    out_FragColor = per_vertexShading;
}`