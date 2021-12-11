//language=GLSL
export const MandelbrotFrag =`

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform vec3 parameterSet1;
uniform vec3 parameterSet2;
uniform vec3 color;
uniform int iterations;

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

vec4 getMandelbrot(vec2 c) {
  float a = 0.0, b = 0.0;
  float colorScale = 80.0; // NOTE: Change this value to create different color

  for (int i = 0; i < iterations; i++) {
     float aNew = a*a - b*b + c.x;
     float bNew = 2.0 * a * b + c.y;
     if (aNew > 12.0 || bNew > 12.0) {
        // not part of the mandelbrot set -> colored
        vec3 col = hsv2rgb(float(i+1)/float(iterations) * 360.0 + colorScale, 1.0, 1.0);
        return vec4(col.r, col.g, col.b, 1.0);
     }
     a = aNew;
     b = bNew;
  }
  return vec4(0.0, 0.0, 0.0, 1.0);
}

void main() {
  vec2 c = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;
  gl_FragColor = getMandelbrot(c);
}

`
