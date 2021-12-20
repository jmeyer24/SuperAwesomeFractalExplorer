export const MandelbrotIterationChangeFrag = `

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform vec3 parameterSet1;
uniform vec3 parameterSet2;
uniform int iterations;
uniform vec3 color;
uniform float colorIntensity;

vec2 complexMultiplikation (vec2 a, vec2 b){
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + b.x*a.y);
}

float mandelbrot(vec2 complexNumber){
  float alpha = 1.0;
  vec2 z = vec2(0.0 , 0.0);
  vec2 z_0;
  vec2 z_1;
  vec2 z_2;

  for(int i=0; i < iterations; i++){  // i < max iterations
    z_2 = z_1;
    z_1 = z_0;
    z_0 = z;

    float x_0_sq = z_0.x*z_0.x;
    float y_0_sq = z_0.y*z_0.y;
    vec2 z_0_sq = vec2(x_0_sq - y_0_sq, 2.0*z_0.x*z_0.y);
    float x_1_sq = z_1.x*z_1.x;
    float y_1_sq = z_1.y*z_1.y;
    vec2 z_1_sq = vec2(x_1_sq - y_1_sq, 2.0*z_1.x*z_1.y);

    // the recurrence equation
    z = parameterSet1.x*z_0_sq + complexNumber + parameterSet1.y*z_1_sq
    + parameterSet1.z*complexMultiplikation(z_1_sq, z_2) + parameterSet2.x*complexMultiplikation(z_1_sq, z_0)
    + parameterSet2.y*complexMultiplikation(z_2, z_0) + parameterSet2.z*complexMultiplikation(z_1, z_2);

    float z_0_mag = x_0_sq + y_0_sq;
    float z_1_mag = x_1_sq + y_1_sq;

    if(z_0_mag > 12.0){
      float frac = (12.0 - z_1_mag) / (z_0_mag - z_1_mag);
      alpha = (float(i) - 1.0 + frac)/200.0; // should be same as max iterations
      break;
    }
  }

  return alpha;
}

void main(){ // gl_FragCoord in [0,1]
  vec2 uv = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;

  vec3 brightness = vec3(0);
  brightness += 1.0 - mandelbrot(uv);

  gl_FragColor = vec4(pow(brightness, colorIntensity*abs(1.-color)), 1.0);
}

`;
