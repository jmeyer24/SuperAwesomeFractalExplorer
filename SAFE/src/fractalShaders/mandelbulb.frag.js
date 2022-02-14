// https://www.shadertoy.com/view/MdXSWn#
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//language=GLSL
export const MandelbulbFrag = `

precision highp float;
uniform vec2 res;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform int iterations;
// why 8? seems to be standard for rendering, can be changed
uniform float parametersMandelbulb; // == mandelbulb_power

uniform vec3 color;
uniform float trapR;

// see for the respective variables https://de.wikipedia.org/wiki/Mandelbulb
uniform float mb_n;
uniform float mb_p;
uniform float mb_q;

// uniform vec3 cameraPosition;
uniform vec3 cameraRotation;

// whether turn on the animation
// #define phase_shift_on

float pixel_size = 0.0;

// rotates the point p around the y-axis by angle a
void rotateAroundYAxis(inout vec3 p, float a){
	float c, s;
	vec3 q = p;
	c = cos(a);
	s = sin(a);
	p.x = c * q.x + s * q.z;
	p.z = -s * q.x + c * q.z;
}

// formula from https://de.wikipedia.org/wiki/Mandelbulb
vec3 mb(vec3 c) {
	// changes the coordinate system, not much to it I think?!
	// of course it changes the resulting fractal
	c.xyz = c.xzy;

	// vector to compute restictedness for
	vec3 v = c;

	float power = parametersMandelbulb;

	float r, phi, theta;
	float cumulativeR = 1.0;
	float R = trapR;

	for(int i = 0; i < iterations; ++i) { // iterations; ++i) {
		r = length(v);

		phi = atan(v.y / v.x);
		theta = acos(v.z / r);
	
		// check whether orbit is ok (same as for mandelbrot)
		// if distance is bigger than 2.0, don't compute on
		if(r > 2.0) break;
	
		// what the hell is cumulativeR (dr previously)?
		cumulativeR = pow(r, power - 1.0) * cumulativeR * power + 1.0;

		// compute next step variables
		r = pow(r, power);
		phi = phi * power;
		theta = theta * power;
		
		v = r * vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta)) + c;
		
		R = min(R, r);
	}

	// why this?
	return vec3(0.5 * log(r) * r / cumulativeR, R, 0.0);
	// return v;
}

float softshadow(vec3 rotation, vec3 rd, float k ){
	float akuma=1.0,h=0.0;
	float t = 0.01;
	for(int i=0; i < 50; ++i){
		h = mb(rotation+rd*t).x;
		if(h<0.001)return 0.02;
		akuma=min(akuma, k*h/t);
		t+=clamp(h,0.01,2.0);
	}
	return akuma;
}

vec3 nor( in vec3 pos )
{
	vec3 eps = vec3(0.001,0.0,0.0);
	return normalize( vec3(
		mb(pos+eps.xyy).x - mb(pos-eps.xyy).x,
		mb(pos+eps.yxy).x - mb(pos-eps.yxy).x,
		mb(pos+eps.yyx).x - mb(pos-eps.yyx).x ) );
}

vec3 intersect( in vec3 rotation, in vec3 rd )
{
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
	
			c = mb(rotation + rd*t);
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

vec4 mandelbulb( vec2 uv )
{
	vec3 iRes = vec3(res, 0.0);
	vec2 q = gl_FragCoord.xy/iRes.xy;
	// vec2 uv = -1.0 + 2.0*q;
	// uv.x*=iRes.x/iRes.y;

	pixel_size = 1.0/(iRes.x * 3.0);
	// camera
	// float sinusRotation = 0.7+0.3*sin(0.4);
	// float cosinusRotation = 0.7+0.3*cos(0.4);

	// vec3 rotation = vec3(0.0, 3.*sinusRotation*cosinusRotation, 3.*(1.-sinusRotation*cosinusRotation));
	vec3 rotation = cameraPosition;

	vec3 cf = normalize(-rotation);
	vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0)));
	vec3 cu = normalize(cross(cs,cf));
	vec3 rd = normalize(uv.x*cs + uv.y*cu + 3.0*cf);  // transform from view to world

	vec3 sundir = normalize(vec3(0.1, 0.8, 0.6));
	vec3 sun = vec3(1.64, 1.27, 0.99);
	vec3 skycolor = vec3(0.6, 1.5, 1.0);

	vec3 bg = exp(uv.y-2.0)*vec3(0.4, 1.6, 1.0);

	float halo = clamp(dot(normalize(vec3(-rotation.x, -rotation.y, -rotation.z)), rd), 0.0, 1.0);
	vec3 col = bg+vec3(1.0,0.8,0.4)*pow(halo, 17.0);

	float t = 0.0;
	vec3 p = rotation;
	vec3 res = intersect(rotation, rd);

	if(res.x > 0.0){
		p = rotation + res.x * rd;
		vec3 n=nor(p);
		float shadow = softshadow(p, sundir, 10.0 );

		float dif = max(0.0, dot(n, sundir));
		float sky = 0.6 + 0.4 * max(0.0, dot(n, vec3(0.0, 1.0, 0.0)));
		float bac = max(0.3 + 0.7 * dot(vec3(-sundir.x, -1.0, -sundir.z), n), 0.0);
		float spe = max(0.0, pow(clamp(dot(sundir, reflect(rd, n)), 0.0, 1.0), 10.0));

		vec3 lin = 4.5 * sun * dif * shadow;
		lin += 0.8 * bac * sun;
		lin += 0.6 * sky * skycolor*shadow;
		lin += 3.0 * spe * shadow;

		res.y = pow(clamp(res.y, 0.0, 1.0), 0.55);
		vec3 tc0 = 0.5 + 0.5 * sin(3.0 + 4.2 * res.y + vec3(0.0, 0.5, 1.0));
		col = lin *vec3(0.9, 0.8, 0.6) *  0.2 * tc0;
		col=mix(col,bg, 1.0-exp(-0.001*res.x*res.x));
	}

	// post
	col=pow(clamp(col,0.0,1.0),vec3(0.45));
	col=col*0.6+0.4*col*col*(3.0-2.0*col);  // contrast
	col=mix(col, vec3(dot(col, vec3(0.33))), -0.5);  // satuation
	col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);  // vigneting

	return vec4(col.xyz, smoothstep(0.55, .76, 1.-res.x/5.));
}

void main() {
	// get the 3D-uv coordinates
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y + offset;

	// compute the current alpha value
	vec4 brightness = vec4(0);
	brightness += mandelbulb(uv);

	gl_FragColor = vec4(brightness.xyz * color, brightness.a);
}

 `;
