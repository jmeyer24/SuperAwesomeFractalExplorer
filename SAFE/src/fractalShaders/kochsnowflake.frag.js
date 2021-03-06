// https://www.shadertoy.com/view/wdGBWc
// uploaded by Thrump
//
// Koch Snowflake - by Martijn Steinrucken aka BigWings 2019
// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode
// This effect is part of a tutorial on YouTube
// https://www.youtube.com/watch?v=il_Qg9AqQkE
//
// Adapted by Leonie Mödl and Jakob Meyer
//
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

export const KochsnowflakeFrag = `

#define M_PI 3.1415926535897

precision highp float;
uniform vec2 res;
uniform float zoom;

// gui parameters
uniform int iterations;
uniform vec3 color;

// varying vec2 vUv;

// function for computing the direction from an angle
vec2 N(float angle) {
    return vec2(sin(angle), cos(angle));
}

// compute snowflake
float kochsnowflake(vec2 uv) {
    vec2 n = N((5./6.)*M_PI);
	float alpha;
    float distance;
    float angle = 0.;
    float scale = 1.;

    uv *= 1.25;
    uv.x = abs(uv.x);
    uv.y += tan((5./6.)*M_PI)*.5;

	distance = dot(uv-vec2(.5, 0), n);

    uv -= max(0.,distance)*n*2.;

    n = N((2./3.)*M_PI);

    uv.x += .5;

    for(int i=0; i<iterations; i++) {
        uv *= 3.;
        uv.x -= 1.5;
        uv.x = abs(uv.x);
        uv.x -= .5;

        scale *= 3.;
        distance = dot(uv, n);

        uv -= min(0.,distance)*n*2.;
    }

    distance = length(uv - vec2(clamp(uv.x,-1., 1.), 0));
	alpha = smoothstep(clamp(10.0*zoom,0.001,5.0)/(res.x), .0, distance/scale);

	return alpha;
}

void main() {
	// get the uv coordinates
	vec2 offset = vec2(cameraPosition.x, -cameraPosition.z);
	vec2 uv = zoom * 0.3 * (2.0*gl_FragCoord.xy-res.xy)/res.y + offset;

	// compute the current alpha value
	vec3 brightness = vec3(0);
	brightness += kochsnowflake(uv);

    gl_FragColor = vec4(brightness * color, 1.0);
}

`;
