//language=GLSL
export const JuliaSetFrag = `

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;

// gui parameters
uniform vec3 color;
uniform int iterations;
uniform float colorScale;
uniform float trapR;
uniform vec2 parametersJulia;

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

float juliaset(vec2 uv) {
	float alpha = 0.0;
	float R = trapR;

	vec2 C = parametersJulia; // vec2(-0.8,0.156); is beautiful

	for (int i = 0; i < iterations; i++) {
		// z_n+1 = z^2 + c
		uv = vec2(uv.x*uv.x - uv.y*uv.y, 2.0 * uv.x * uv.y) + C;
		// check if in boundary (e.g. towards infinity)
		// dot(uv,uv) gives the length of the complex number
		R = min(R, dot(uv,uv));
	}

	// why this?
	alpha = 1.0+log2(R)/16.;
	alpha = (-1.*alpha+1.);
	return alpha;
}

void main() {
	vec2 offset = vec2(cameraPosition.x, -cameraPosition.z);
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y + offset;

	// compute the current brightness value
	vec3 brightness = vec3(0);
	brightness += juliaset(uv);

	gl_FragColor = vec4(brightness * color, 1.0);
}

`;
