//language=GLSL
export const vertShader_sphere_perVertex =`

// colors calculated for the vertex
out vec4 per_vertexShading;

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
    /* you can always access the transformation matrices (mat4) with the following variable names
    => "modelMatrix", "viewMatrix", "modelViewMatrix" and "projectionMatrix" */
    
    // transform world coordinates from local to world space
    vec4 pos = modelMatrix * vec4(position, 1.0);
    
    // also predefine variable: "cameraPosition" (vec3)
    // calculate the direction from vertex to camera
    vec3 camera_direction = normalize(cameraPosition - position); //? normalize
    
    // direction from origin to light
    vec3 lightDirNormalized = normalize(lightDir - sphereCenter); //?

    // with this we have all vectors needed to calculate shading for this vertex
    // Phong-shading:
    // Iamb = Ia*ka
    vec4 ambientTerm  = ambientLightIntensity * ambientColor;

    // also predefined variable: "normal" (vec3)
    // Idiff = IiKd(L*N)  result has to be between 0-1
    vec4 diffuseTerm  = diffSpecLightIntensity * max(dot(lightDirNormalized, normal), 0.0) * diffuseColor;

    // calculate reflection (keep in mind the direction of the vectors: specular highlight in the right place?)
    vec3 reflection = reflect(-lightDirNormalized, normal); 
    // Ispec = (R*C)^n
    float Ispec = pow(max(dot(reflection, camera_direction), 0.0), sphereShininess);
    // IiKs(Ispec) = IiKs(R*C)^n
    vec4 specularTerm = diffSpecLightIntensity * Ispec * specularColor;

    // build the final Phong reflection term for the vertex
    per_vertexShading = ambientTerm + diffuseTerm + specularTerm;
    
    // as this is a regular vertex shader we still have to output the transformed vertex positions to the fragment shader 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`