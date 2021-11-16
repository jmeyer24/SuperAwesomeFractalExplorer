//language=GLSL
export const fragShader=`

    precision highp float;
    precision highp int;
    
    in vec4 posVertex;
    in vec3 normalVertex;
    in vec4 vertex_color;
    
    // sphere settings
    uniform float shininess;
    uniform vec4 specularColor;

    // light-settings
    uniform vec3 lightDir;
    uniform vec4 diffSpecLightIntensity;
    uniform vec4 ambientLightIntensity;

    out vec4 out_FragColor;

    void main() {
        vec3 fragment_pos = posVertex.xyz / posVertex.w;
        vec3 fragment_camera_direction = normalize( cameraPosition - fragment_pos);

        vec3 normal = normalize(normalVertex);
        // Direction of the light, i.e. vector connection fragment_pos and lightsource
        vec3 lightDirNormalized = normalize(lightDir);

        // Phong-shading:
        vec4 ambientTerm  = vertex_color * ambientLightIntensity;
        vec4 diffuseTerm  = vertex_color * diffSpecLightIntensity * clamp( max( dot( normal,  lightDirNormalized ),0.0 ), 0.0, 1.0 );

        out_FragColor = ambientTerm + diffuseTerm;
    }`