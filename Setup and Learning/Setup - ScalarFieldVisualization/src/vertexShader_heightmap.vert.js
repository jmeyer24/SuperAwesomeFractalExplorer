//language=GLSL
export const vertShader =`

    uniform sampler2D heightmap;
    uniform sampler2D colormap;
    uniform float scaleFactor;

    out vec4 posVertex;
    out vec3 normalVertex;
    out vec4 vertex_color;

    void main() {
        ivec2 size = textureSize(heightmap, 0);
        vec3 pos_tmp = position;
        // vec2 Vuv = uv;
        float height = texture(heightmap,uv).r;
        
        // TODO: implement displacement
        pos_tmp.y = scaleFactor * height;
        
        // TODO: calculate normals
        float offsetX = 1.0/float(size.x);
        float offsetZ = 1.0/float(size.y);
        float heightXDirPos = texture(heightmap,uv+vec2(offsetX,0)).r;
        float heightXDirNeg = texture(heightmap,uv-vec2(offsetX,0)).r;
        float heightZDirPos = texture(heightmap,uv+vec2(0,offsetZ)).r;
        float heightZDirNeg = texture(heightmap,uv-vec2(0,offsetZ)).r;
        normalVertex = cross(vec3 (2.0*offsetX, heightXDirPos-heightXDirNeg, 0.0), vec3 (0.0, heightZDirPos-heightZDirNeg, 2.0*offsetZ));

        // TODO: add color transfer function using the provided colormap
        vertex_color = texture(colormap,vec2(height, 0.0));
        
        posVertex = modelMatrix * vec4( pos_tmp, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( pos_tmp, 1.0);
    }`