//language=GLSL
export const vertShader  = `

    attribute vec3 texCoords;

    out vec3 v_texCoord;
    out vec3 v_origPos;

    void main(){
        //TODO: set v_texCoord;
        v_texCoord = texCoords;
        
        //TODO: determine and set v_origPos (vertex position in world space)
        vec4 pos_world = modelMatrix * vec4(position, 1.0);
        v_origPos = pos_world.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
`
