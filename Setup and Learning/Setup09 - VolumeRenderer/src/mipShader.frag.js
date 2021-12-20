//language=GLSL
export const mipShaderFrag =`
    

precision highp float;
precision mediump sampler3D;
precision mediump sampler2D;

uniform sampler3D u_volumeTexture;
uniform vec3 u_volumeTexSize;
uniform vec3 u_dimsBBox;

in vec3 v_texCoord;
in vec3 v_origPos;

out vec4 fragColor;

//maximumdensityProjection
void main(){    
    // TODO: implement Maximum density Projection

    // get ray direction
    vec3 ray = normalize(v_origPos - cameraPosition);
    
    // get starting point at the corpus side that is looked upon
    vec3 curPos = v_texCoord;
    
    // TODO: determine MAX_STEPS and stepSize
    int MAX_STEPS = 100;
    // the cubic root is around 1.44, so setting 1.5 as nominator guarantees a transversal of the cube from all angles
    float stepSize = 1.5 / float(MAX_STEPS);
    
    // get the maximum density along the ray
    float max_density = 0.0;
    for(int i = 0; i < MAX_STEPS; i++){
        // get the density at the current position
        float density = texture(u_volumeTexture,curPos).r;

        // check for biggest density
        if (density > max_density) {
            max_density = density;
        }

        // move along ray to the next position
        curPos = curPos + ray * stepSize;
        
        // stop if ray is out of bounding box
        if(any(greaterThan(curPos,vec3(1.0,1.0,1.0))) || any(lessThan(curPos,vec3(0.0,0.0,0.0)))) {
            break;
        }
    }
    
    //////
    // different coloring schemes during the sub-exercises
    //////
        
    // fig.6, maximum density as grey scale
    fragColor = vec4(max_density,max_density,max_density,1.0);
    
    // fig.5 right, ray to color absolute 
    // fragColor = abs(vec4(ray,1.0));
    
    // fig.5 left, ray to color
    // fragColor = vec4(ray,1.0);
    
    // 1.2, check if v_origPos is calculated correctly
    // fragColor = vec4(v_origPos,1.0);
    
    // fig.3, rainbow cuboid
    // fragColor = vec4(v_texCoord,1.0);
    
    // fig.2, basic red
    // fragColor = vec4(178.0/255.0, 34.0/255.0, 34.0/255.0,1.0);
}
`
