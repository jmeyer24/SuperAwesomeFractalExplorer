export const KochsnowflakeFrag =`

precision highp float;
uniform vec2 res;
uniform float aspect;
uniform float zoom;
uniform vec2 offset;
//uniform int maxIteration;

// definition of initial line
//uniform vec2 startPoint;
//uniform vec2 endPoint;
int maxIteration = 100;

float kochsnowflake(vec2 c){
  vec2 startPoint = vec2(float(res.x)/3.0,float(res.y)/3.0);
  vec2 endPoint = vec2(2.0*float(res.x)/3.0,2.0*float(res.y)/3.0);
  vec3 color = vec3(0.0,0.0,0.0);

  float alpha = 0.3;

  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;

  if(x > startPoint.x && x < endPoint.x && y > startPoint.y && y < endPoint.y){
    alpha = 0.6;
  }

  return alpha;
}

void main(){ // gl_FragCoord in [0,1]
  vec2 uv = zoom * vec2(aspect, 1.0) * gl_FragCoord.xy / res + offset;
  float alpha = kochsnowflake(uv);

  //for(int i=0; i<maxIteration; i++){
  //  alpha += kochsnowflake(uv+vec2(1000.1,0.1));
  //}
  //alpha = alpha / float(maxIteration);

  gl_FragColor = vec4(alpha,0.0,0.0,1.0);
}

`
