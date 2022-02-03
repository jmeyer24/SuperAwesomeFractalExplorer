//language=GLSL
export const isoShaderFrag =`
    
precision highp float;
precision mediump sampler3D;
precision mediump sampler2D;

uniform sampler3D u_volumeTexture;
uniform vec3 u_volumeTexSize;
uniform vec3 u_dimsBBox;

uniform float u_isoValue;
uniform float u_isoAlphaValue;
uniform bool u_toggleLight;

in vec3 v_texCoord;
in vec3 v_origPos;

out vec4 fragColor;

// isoSurfaceRenderer
void main(){
    // TODO: implement Isosurface Renderer
    
    // static color orange/brown
    vec3 isoColor = vec3(1.0, 0.5, 0.0); 
    float isoAlpha = 0.0;
    
    // get ray direction
    vec3 ray = normalize(v_origPos - cameraPosition);
    
    // get starting point at the corpus side that is looked upon
    vec3 curPos = v_texCoord;
    
    // TODO: determine MAX_STEPS and stepSize (???)
    int MAX_STEPS = int(max( max( u_volumeTexSize.x, u_volumeTexSize.y ), u_volumeTexSize.z ));
    float stepSize = 1.5 / float(MAX_STEPS);
    
    // current variables
    vec3 color_current;
    float alpha_current;
    
    for(int i = 0; i < MAX_STEPS; i++){
        // get texture values at current position
        vec4 densAtPos = texture(u_volumeTexture,curPos);
        
        // if the isoValue is reached terminate loop
        if(densAtPos.r >= u_isoValue) {
            isoAlpha = u_isoAlphaValue;
            // break loop
            break;
        }
        
        // move along ray to the next position
        curPos = curPos + ray * stepSize;
        
        // stop if ray is out of bounding box
        if(any(greaterThan(curPos,vec3(1.0,1.0,1.0))) || any(lessThan(curPos,vec3(0.0,0.0,0.0)))) {
            break;
        }
    }
    
    fragColor = vec4(isoColor, isoAlpha);
    
    if(u_toggleLight) {
        // not the air around the object, just the object
        if(isoAlpha != 0.0) {
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
