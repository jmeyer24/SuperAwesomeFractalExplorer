//language=GLSL
export const MandelbrotFrag = `

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform int iterations;
uniform float colorScale;

vec3 hsv2rgb(float hue, float saturation, float brightness) {
  int H = int(floor(hue/60.0));
  float f = hue/60.0 - float(H);

  float p = brightness * (1.0 - saturation);
  float q = brightness * (1.0 - saturation * f);
  float t = brightness * (1.0 - saturation * (1.0 - f));

  if (H == 1) {
    return vec3(brightness, t, p);
  } else if (H == 2) {
    return vec3(q, brightness, p);
  } else if(H == 3) {
    return vec3(p, brightness, t);
  } else if(H == 4) {
    return vec3(t, p, brightness);
  } else if(H == 5) { 
    return vec3(brightness, p, q);
  } else {
    return vec3(brightness, p, q);
  }
}

vec3 mandelbrot(vec2 uv) {
	vec2 initialUV = uv;
	vec3 col = vec3(0.0);
	float colorScale = 60.0; // NOTE: Change this value to create different color

	for (int i = 0; i < iterations; i++) {
		// z_n+1 = z^2 + c
		uv = vec2(uv.x*uv.x - uv.y*uv.y, 2.0 * uv.x * uv.y);
		uv += initialUV;

		// not part of the mandelbrot set -> colored
		if (uv.x > 12.0 || uv.y > 12.0) {
			float hue = float(i+1)/float(iterations) * 360.0 + colorScale;
			col = hsv2rgb(hue, 1.0, 1.0);
			return col;
		}
	}

	// part of the mandelbrot set -> black
	return col;
}

void main() {
	// vec2 uv = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y + offset;

	gl_FragColor = vec4(mandelbrot(uv), 1.0);
}

`;
