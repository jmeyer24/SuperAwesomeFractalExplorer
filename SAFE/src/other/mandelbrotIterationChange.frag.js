//language=GLSL
export const MandelbrotIterationChangeFrag = `

#define ONE_COLOR 1
#define MULTIPLE_COLORS 0

precision highp float;
uniform vec2 res;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform vec3 parametersMandelbrot1;
uniform vec3 parametersMandelbrot2;
uniform float parametersColor;
uniform int iterations;
uniform vec3 color;
uniform float colorIntensity;

// helper functions ===========================================================

vec2 complexMultiplikation (vec2 a, vec2 b){
	return vec2(a.x*b.x - a.y*b.y, a.x*b.y + b.x*a.y);
}
vec2 complexSquare (vec2 a){
	return vec2(a.x*a.x - a.y*a.y, 2.0*a.x*a.y);
}
float complexMagnitude (vec2 a){
	return a.x*a.x + a.y*a.y;
}

vec3 hsv2rgb(float hue, float saturation, float brightness) {
	// boundary conditions for input
	hue = mod(hue, 360.0);
	saturation = clamp(saturation, 0.0, 1.0);
	brightness = clamp(brightness, 0.0, 1.0);

	// conversion formula
	// https://de.wikipedia.org/wiki/HSV-Farbraum#Transformation_von_HSV/HSL_und_RGB
	int h = int(floor(hue/60.0));
	float f = hue/60.0 - float(h);

	float p = mod(brightness * (1.0 - saturation), 1.0);
	float q = mod(brightness * (1.0 - saturation * f), 1.0);
	float t = mod(brightness * (1.0 - saturation * (1.0 - f)), 1.0);

	switch (h) {
		case 1:
			return vec3(q, brightness, p);
		case 2:
			return vec3(p, brightness, t);
		case 3:
			return vec3(p, q, brightness);
		case 4:
			return vec3(t, p, brightness);
		case 5:
			return vec3(brightness, p, q);
		default:
			return vec3(brightness, t, p);
	}
}

vec3 mandelbrot(vec2 uv) {
	vec2 c = uv;

	vec3 p1 = parametersMandelbrot1;
	vec3 p2 = parametersMandelbrot2;

	float alpha = 1.0;
	vec2 z = vec2(0.0 , 0.0);
	vec2 z_0;
	vec2 z_1;
	vec2 z_2;
	float z_0_mag;
	float z_1_mag;

	int i = 0;
	while (i < iterations && complexMagnitude(z) <= 4.0) {
		// simple mandelbrot formula: z_n+1 = z^2 + c

		z_2 = z_1;
		z_1 = z_0;
		z_0 = z;

		vec2 z_0_sq = complexSquare(z_0);
		vec2 z_1_sq = complexSquare(z_1);
		z_0_mag = complexMagnitude(z_0);
		z_1_mag = complexMagnitude(z_1);

		// the recurrence equation
		z = p1.x*z_0_sq + p1.y*z_1_sq + p1.z*complexMultiplikation(z_1_sq, z_2)
		+ p2.x*complexMultiplikation(z_1_sq, z_0) + p2.y*complexMultiplikation(z_2, z_0) + p2.z*complexMultiplikation(z_1, z_2)
		+ c;

// 		if(z_0_mag > 12.0){
// 			alpha = (float(i) - 1.0 + (12.0 - z_1_mag) / (z_0_mag - z_1_mag))/200.0; // should be same as max iterations
// 		}
		
		// increment iteration counter
		i = i + 1;
	}

	#if MULTIPLE_COLORS
		float colorValue = float(i)/float(iterations);
		vec3 col = hsv2rgb(-colorValue*360.0+parametersColor, 1.0, 1.0-colorValue);
		return col;
	#endif

	#if ONE_COLOR
		alpha = (float(i) - 1.0 + (12.0 - z_1_mag) / (z_0_mag - z_1_mag))/200.0; // should be same as max iterations
		vec3 col = vec3(0);
		col += 1.0 - alpha;
		col = pow(col, colorIntensity*abs(1.0-color));
		return col;
	#endif
}

void main() {
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y + offset;

	gl_FragColor = vec4(mandelbrot(uv), 1.0);
}

`;
