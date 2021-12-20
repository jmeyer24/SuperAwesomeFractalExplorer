//language=GLSL
export const vertShader_sphere_perVertex =`
    
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

out vec4 per_vertexShading;

void main() {
    // transform world coordinates from local to world space
    vec4 pos = modelMatrix * vec4( position, 1.0);
    // also predefine variable: "cameraPosition" (vec3)
    // calculate the direction from vertex to camera
    vec3 camera_direction = normalize( cameraPosition - pos.xyz);
    
    // direction from origin to light
    vec3 lightDirNormalized = normalize(lightDir);

    // with this we have all vector needed to calculate shading for our point
    // Phong-shading:
    // Iamb = Ia*ka
    vec4 ambientTerm  = ambientColor * ambientLightIntensity;

    // also predefined variable: "normal" (vec3)
    // Idiff = IiKd(L*N)  result has to be between 0-1
    vec4 diffuseTerm  = diffuseColor * diffSpecLightIntensity * clamp( max( dot( normal,  lightDirNormalized ),0.0 ), 0.0, 1.0 );

    // calculate reflection (keep in mind the direction of the vectors: specular highlight in the right place?)
    vec3 reflection = reflect(-lightDirNormalized, normal);
    // Ispec = (R*C)^n
    float Ispec = pow( max( 0.0, dot ( reflection, camera_direction )), sphereShininess );
    // IiKs(Ispec) = IiKs(R*C)^n
    vec4 specularTerm = specularColor * diffSpecLightIntensity * clamp( Ispec, 0.0, 1.0 );
    
    // build the final Phong reflection term for the vertex
    per_vertexShading = ambientTerm + diffuseTerm + specularTerm;
    // as this is a regular vertex shader we still have to output the transformed vertex positions to the fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}`