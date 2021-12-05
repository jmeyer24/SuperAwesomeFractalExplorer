export const KochsnowflakeFrag =`

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;
uniform vec2 offset;

// gui parameters
uniform int iterations;
uniform vec3 color;

// definition of initial line
//uniform vec2 startPoint;
//uniform vec2 endPoint;

float kochsnowflake(vec2 c){
  //vec2 startPoint = vec2(float(res.x)/3.0,float(res.y)/3.0);
  //vec2 endPoint = vec2(2.0*float(res.x)/3.0,2.0*float(res.y)/3.0);
  //vec3 color = vec3(0.0,0.0,0.0);

  //float alpha = 1.0;

  //float x = gl_FragCoord.x;
  //float y = gl_FragCoord.y;

  //if(x > startPoint.x && x < endPoint.x && y > startPoint.y && y < endPoint.y){
  //  alpha = 0.6;
  //}
  float alpha = 1.0;
  return alpha;
}

void main(){ // gl_FragCoord in [0,1]
  vec2 uv = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;
  float alpha = kochsnowflake(uv);

  //gl_FragColor = vec4(pow(alpha, color), 0.5);
  gl_FragColor = vec4(alpha, alpha, alpha, 0.5);
  //gl_FragColor = vec4(color,1.0);
}

`
