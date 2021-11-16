//language=GLSL
export const fragShader_sphere_perVertex =`

precision highp float;
precision highp int;

in vec4 per_vertexShading;
out vec4 out_FragColor;

void main(){
    out_FragColor = per_vertexShading;
}`