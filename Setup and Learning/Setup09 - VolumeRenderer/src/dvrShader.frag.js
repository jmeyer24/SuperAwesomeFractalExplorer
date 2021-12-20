//language=GLSL
export const dvrShaderFrag =`
    
precision highp float;
precision mediump sampler3D;
precision mediump sampler2D;

uniform sampler3D u_volumeTexture;
uniform sampler2D u_tfTexture;
uniform vec3 u_volumeTexSize;
uniform vec3 u_dimsBBox;

uniform bool u_toggleLight;

in vec3 v_texCoord;
in vec3 v_origPos;

out vec4 fragColor;

//directVolumeRenderer
void main(){
    // TODO: implement Direct Volume Renderer
    
    // get ray direction
    vec3 ray = normalize(v_origPos - cameraPosition);
    
    // get starting point at the corpus side that is looked upon
    vec3 curPos = v_texCoord;
    
    // TODO: determine MAX_STEPS and stepSize (???)
    int MAX_STEPS = int(max( max( u_volumeTexSize.x, u_volumeTexSize.y ), u_volumeTexSize.z ));
    float stepSize = 1.5 / float(MAX_STEPS);
    
    // accumulating and current variables
    vec3 color_in = vec3(0.0, 0.0, 0.0);
    float alpha_in = 0.0;
    vec3 color_current;
    float alpha_current;
    
    // small deviation as epsilon, for termination of ray
    float epsilon = 0.05;
    
    for(int i = 0; i < MAX_STEPS; i++){
        // get texture values at current position
        vec4 densAtPos = texture(u_volumeTexture,curPos);
        
        //////
        // 1.4
        //////
        // set the density as current color and alpha values
        color_current = densAtPos.rgb;
        alpha_current = densAtPos.r;
        
        //////
        // 1.5
        //////
        // // get the current color and alpha from the transfer function depending on density
        // vec4 tfAtPos = texture(u_tfTexture,vec2(densAtPos.r,0.0));
        // color_current = tfAtPos.rgb;
        // alpha_current = tfAtPos.a;

        //////
        // consistent
        //////
        // accumulation step of color and alpha value
        color_in = color_in + (1.0 - alpha_in) * color_current * alpha_current;
        alpha_in = alpha_in + (1.0 - alpha_in) * alpha_current;

        // move along ray to the next position
        curPos = curPos + ray * stepSize;
        
        // stop if ray is out of bounding box
        if(any(greaterThan(curPos,vec3(1.0,1.0,1.0))) || any(lessThan(curPos,vec3(0.0,0.0,0.0)))) {
            break;
        }
        
        // stop is alpha value is close to 1.0
        if(alpha_in + epsilon >= 1.0) {
            // break loop
            break; 
        }
    }
    
    fragColor = vec4(color_in, alpha_in);
    
    //////
    // 1.6
    //////
    
    if(u_toggleLight) {
        // not the air around the object, just the object
        if(alpha_in != 0.0) {
            // central differences method to calculate normals
            // TODO: this is current work to do!!!
            // how though???
            float offsetX = 1.0/u_volumeTexSize.x;
            float offsetY = 1.0/u_volumeTexSize.y;
            float offsetZ = 1.0/u_volumeTexSize.z;

            float XPos = texture(u_volumeTexture,curPos+vec3(offsetX, 0.0, 0.0)).r;
            float XNeg = texture(u_volumeTexture,curPos-vec3(offsetX, 0.0, 0.0)).r;
            float YPos = texture(u_volumeTexture,curPos+vec3(0.0, offsetY, 0.0)).r;
            float YNeg = texture(u_volumeTexture,curPos-vec3(0.0, offsetY, 0.0)).r;
            float ZPos = texture(u_volumeTexture,curPos+vec3(0.0, 0.0, offsetZ)).r;
            float ZNeg = texture(u_volumeTexture,curPos-vec3(0.0, 0.0, offsetZ)).r;
            
            vec3 normalFragmentXY = cross(vec3(2.0*stepSize, XPos-XNeg, 0.0), vec3(0.0, ZPos-ZNeg, 2.0*stepSize));
            vec3 normalFragmentXZ = cross(vec3(0.0, ZPos-ZNeg, 2.0*stepSize), vec3(2.0*stepSize, XPos-XNeg, 0.0));
            vec3 normalFragment = cross(normalFragmentXY, normalFragmentXZ);
    
            // light options 
            float ambientIntensity = 0.25;
            float diffuseIntensity = 1.0;
            
            // light term calculation as ambient + diffuse
            vec4 ambientTerm = fragColor * ambientIntensity;
            vec4 diffuseTerm  = fragColor * diffuseIntensity * clamp(max(dot(ray, vec3(1.0,0.0,0.0)), 0.0), 0.0, 1.0);
            vec4 lightTerm = ambientTerm + diffuseTerm;
    
            // take accumulated color and alpha as fragment color
            fragColor = fragColor + lightTerm;
        }
    }
}
`
