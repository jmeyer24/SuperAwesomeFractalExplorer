//language=GLSL
export const fragShader_cube =`

precision highp float;
precision highp int;

in vec3 localposVertex;
out vec4 out_FragColor;

void main(){
    out_FragColor = vec4(localposVertex, 1.0);
}`