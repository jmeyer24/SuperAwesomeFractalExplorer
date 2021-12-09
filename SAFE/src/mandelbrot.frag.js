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

vec4 getMandelbrot(vec2 c) {
  float a = 0.0, b = 0.0;
  int maxIteration = 200;
  for (int i = 0; i < maxIteration; i++) {
     float aNew = a*a - b*b + c.x;
     float bNew = 2.0 * a * b + c.y;
     if (aNew > 12.0 || bNew > 12.0) {
       // not part of the mandelbrot set -> colored
        return vec4(0.9/float(i+1), 0.3/float(i+1), 0.2/float(i+1), 1.0);
     }
     a = aNew;
     b = bNew;
  }
  return vec4(0.0, 0.0, 0.0, 1.0);
}

void main() {
  vec2 c = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;
  vec4 col = getMandelbrot(c);
  gl_FragColor = col;
}

`
