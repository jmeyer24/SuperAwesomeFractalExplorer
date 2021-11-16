//language=GLSL
export const fragShader_sphere_perPixel =`

precision highp float;
precision highp int;

out vec4 out_FragColor;
in vec4 posVertex;
in vec3 normalVertex;

// sphere settings
uniform vec3 sphereCenter;
uniform float sphereShininess;

// light-settings
uniform vec3 lightDir;
uniform vec4 specularColor;
uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform vec4 diffSpecLightIntensity;
uniform vec4 ambientLightIntensity;


void main() {
    // scale with w in case of != 0
    vec3 fragment_pos = posVertex.xyz / posVertex.w;
    // adapt code from shader "vertShader_sphere_perVertex" !
    
    // also predefine variable: "cameraPosition" (vec3)
    // calculate the direction from vertex to camera
    vec3 camera_direction = normalize( cameraPosition - fragment_pos.xyz);
    
    // direction from origin to light
    vec3 lightDirNormalized = normalize(lightDir);

    // with this we have all vector needed to calculate shading for our point
    // Phong-shading:
    // Iamb = Ia*ka
    vec4 ambientTerm  = ambientColor * ambientLightIntensity;

    // also predefined variable: "normal" (vec3)
    // Idiff = IiKd(L*N)  result has to be between 0-1
    vec4 diffuseTerm  = diffuseColor * diffSpecLightIntensity * clamp( max( dot( normalVertex, lightDirNormalized ),0.0 ), 0.0, 1.0 );

    // calculate reflection (keep in mind the direction of the vectors: specular highlight in the right place?)
    vec3 reflection = reflect(-lightDirNormalized, normalVertex);
    // Ispec = (R*C)^n
    float Ispec = pow( max( 0.0, dot ( reflection, camera_direction )), sphereShininess );
    // IiKs(Ispec) = IiKs(R*C)^n
    vec4 specularTerm = specularColor * diffSpecLightIntensity * clamp( Ispec, 0.0, 1.0 );
    
    // build the final Phong reflection term for the vertex
    out_FragColor = ambientTerm + diffuseTerm + specularTerm;
}`