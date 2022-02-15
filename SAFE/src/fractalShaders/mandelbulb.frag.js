// https://www.shadertoy.com/view/MdXSWn#
// Created by evilryu
// Adapted by Leonie Mödl and Jakob Meyer
// for OpenGL
//
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//language=GLSL
export const MandelbulbFrag = `

// variables ================================================================

precision highp float;
uniform vec2 res;
uniform float zoom;

// gui parameters
uniform int iterations;
// why 8? seems to be standard for rendering, can be changed
uniform float parametersMandelbulb; // == mandelbulb_power
uniform float parametersPixel;

uniform vec3 color;
uniform float trapR;

// see for the respective variables https://de.wikipedia.org/wiki/Mandelbulb
uniform float mb_n;
uniform float mb_p;
uniform float mb_q;

uniform vec3 cameraRotation;

uniform vec3 haloColor;
uniform bool haloBool;

// whether turn on the animation
// #define phase_shift_on

float pixel_size = 0.0;

/*
compute whether the point is escaping the boundaries after some iterations
z = r*(sin(theta)cos(phi) + i cos(theta) + j sin(theta)sin(phi)
zn+1 = zn^8 + c
z^8 = r^8 * (sin(8*theta)*cos(8*phi) + i cos(8*theta) + j sin(8*theta)*sin(8*theta)
zn+1' = 8 * zn^7 * zn' + 1
*/
vec3 mandelbulb(vec3 point) {
	// formula from https://de.wikipedia.org/wiki/Mandelbulb
	// changes the coordinate system, not much to it I think?!
	// of course it changes the resulting fractal
	point.xyz = point.xzy;

	// point to compute restictedness for
	vec3 v = point;

	float power = parametersMandelbulb;

	float phi, theta; // angles phi and theta
	float cumulativeR = 1.0;

	float r;
	float R = trapR;

	int i = 0;
	while (i < iterations){
		r = length(v);

		phi = atan(v.y / v.x);
		theta = acos(v.z / r);
	
		// check whether orbit is ok (same as for mandelbrot)
		// if distance is bigger than 2.0, don't compute
		if(r > 2.0) break;
	
		// compute zn+1'
		cumulativeR = pow(r, power - 1.0) * cumulativeR * power + 1.0;

		// compute next step variables
		r = pow(r, power);
		phi = phi * power;
		theta = theta * power;
		
		// compute z^8 + c
		v = r * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)) + point;
		
		R = min(R, r);

		i = i + 1;
	}

	// why this?
	return vec3(0.5 * log(r) * r / cumulativeR, R, 0.0);
}

float softshadow(vec3 rayOrigin, vec3 rayDirection, float k ){
	float akuma=1.0,h=0.0;
	float t = 0.01;
	for(int i=0; i < 50; ++i){
		h = mandelbulb(rayOrigin+rayDirection*t).x;
		if(h<0.001)return 0.02;
		akuma=min(akuma, k*h/t);
		t+=clamp(h,0.01,2.0);
	}
	//TODO:
	return 1.0;
	return akuma;
}

// compute normal vector via the central difference method
vec3 normalVector( vec3 pos ) {
	vec3 eps = vec3(0.001,0.0,0.0);
	return normalize( vec3(
		mandelbulb(pos+eps.xyy).x - mandelbulb(pos-eps.xyy).x,
		mandelbulb(pos+eps.yxy).x - mandelbulb(pos-eps.yxy).x,
		mandelbulb(pos+eps.yyx).x - mandelbulb(pos-eps.yyx).x ) );
}

vec3 intersect( in vec3 rayOrigin, in vec3 rayDirection ) {
	float t = 1.0;
	float res_t = 0.0;
	float res_d = 1000.0;
	vec3 c, res_c;
	float max_error = 1000.0;
	float d = 1.0;
	float pd = 100.0;
	float os = 0.0;
	float step = 0.0;
	float error = 1000.0;

	for( int i=0; i<48; i++ )
	{
		if( error < pixel_size*0.5 || t > 20.0 )
		{
		}
		else{  // avoid broken shader on windows
	
			c = mandelbulb(rayOrigin + rayDirection*t);
			d = c.x;

			if(d > os)
			{
				os = 0.4 * d*d/pd;
				step = d + os;
				pd = d;
			}
			else
			{
				step =-os; os = 0.0; pd = 100.0; d = 1.0;
			}

			error = d / t;

			if(error < max_error)
			{
				max_error = error;
				res_t = t;
				res_c = c;
			}
	
			t += step;
		}

	}
	if( t>20.0/* || max_error > pixel_size*/ ) res_t=-1.0;
	return vec3(res_t, res_c.y, res_c.z);
}

vec4 render( vec2 uv ) {
	float pixelRatio = parametersPixel;
	pixel_size = pixelRatio/(2.0*res.x);

	vec2 q = gl_FragCoord.xy/res;

	vec3 rayOrigin = cameraPosition;

	vec3 cf = normalize(-rayOrigin);
	vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0)));
	vec3 cu = normalize(cross(cs,cf));
	vec3 rayDirection = normalize(uv.x*cs + uv.y*cu + 3.0*cf);  // transform from view to world

	// light direction
	vec3 sundir = normalize(vec3(0.1, 0.8, 0.6));
	// environment light color
	vec3 skyColor = vec3(0.6, 1.5, 1.0);
	// diffuse light color
	vec3 lightColor = vec3(1.64, 1.27, 0.99);

	vec3 col = vec3(0.0);
	if(haloBool){
		float halo = clamp(dot(normalize(vec3(-rayOrigin.x, -rayOrigin.y, -rayOrigin.z)), rayDirection), 0.0, 1.0);
		col = color * pow(halo, 17.0);
	}

	float t = 0.0;
	vec3 p = rayOrigin;
	vec3 res = intersect(rayOrigin, rayDirection);

	if(res.x > 0.0){
		p = rayOrigin + res.x * rayDirection;
		vec3 n = normalVector(p);
		float shadow = softshadow(p, sundir, 10.0 );

		// light from the angle of the sun
		float diffuseLight = max(0.0, dot(n, sundir));
		// light from straight above, at least 0.6, up to 1.0
		float skyLight = 0.6 + 0.4 * max(0.0, dot(n, vec3(0.0, 1.0, 0.0)));
		// ambient light
		float ambientLight = max(0.3 + 0.7 * dot(vec3(-sundir.x, -1.0, -sundir.z), n), 0.0);
		// specular light
		float specularLight = max(0.0, pow(clamp(dot(sundir, reflect(rayDirection, n)), 0.0, 1.0), 10.0));

		vec3 phongShading = shadow * ((4.5 * lightColor * diffuseLight) + (0.6 * skyColor * skyLight) + (3.0 * specularLight)) + 0.8 * ambientLight * lightColor;

		res.y = pow(clamp(res.y, 0.0, 1.0), 0.55);
		vec3 baseColor = vec3(0.9, 0.8, 0.6);
		vec3 colorByHeight = 0.5 + 0.5 * sin(3.0 + 4.2 * res.y + vec3(0.0, 0.5, 1.0));
		col = phongShading * baseColor * colorByHeight * 0.2;
	}

	// post color improvement
	col=pow(clamp(col,0.0,1.0),vec3(0.45));
	col=col*0.6+0.4*col*col*(3.0-2.0*col);  // contrast
	col=mix(col, vec3(dot(col, vec3(0.33))), -0.5);  // saturation
	col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);  // vigneting

	// return vec4(col.xyz * color, 1.0); // smoothstep(0.55, .76, 1.-res.x/5.));
	return vec4(col, 1.0); // smoothstep(0.55, .76, 1.-res.x/5.));
}

void main() {
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y;

	gl_FragColor = render(uv);
}

`;
