export const TestFrag = `

precision highp float;
uniform vec2 res;
uniform float parametersMandelbulb;
uniform vec3 cameraRotation;
uniform float zoom;
uniform int iterations;

#define AA 1

vec2 isphere( in vec4 sph, in vec3 ro, in vec3 rd )
{
    vec3 oc = ro - sph.xyz;
	float b = dot(oc,rd);
	float c = dot(oc,oc) - sph.w*sph.w;
    float h = b*b - c;
    if( h<0.0 ) return vec2(-1.0);
    h = sqrt( h );
    return -b + vec2(-h,h);
}

float map( in vec3 p, out vec4 resColor )
{
    vec3 w = p;
    float m = dot(w,w);

    vec4 trap = vec4(abs(w),m);
	float dz = 1.0;
	for( int i=0; i<iterations; i++ )
    {
        // dz = 8*z^7*dz
		// what is the difference? why m, not r??
		// cumulativeR = pow(r, power - 1.0) * cumulativeR * power + 1.0;
		dz = parametersMandelbulb*pow(m,3.5)*dz + 1.0;

        // z = z^8+z
        float r = length(w);
        float b = parametersMandelbulb*acos( w.y/r);
        float a = parametersMandelbulb*atan( w.x, w.z );
        w = p + pow(r,parametersMandelbulb) * vec3( sin(b)*sin(a), cos(b), sin(b)*cos(a) );

        trap = min( trap, vec4(abs(w),m) );

        m = dot(w,w);
		if( m > 256.0 )
            break;
    }

    resColor = vec4(m,trap.yzw);

    // distance estimation (through the Hubbard-Douady potential)
    return 0.25*log(m)*sqrt(m)/dz;
}

vec3 calcNormal( in vec3 pos, in float t, in float px )
{
    vec4 tmp;
    vec2 e = vec2(1.0,-1.0)*0.5773*0.25*px;
    return normalize( e.xyy*map( pos + e.xyy,tmp ) +
					  e.yyx*map( pos + e.yyx,tmp ) +
					  e.yxy*map( pos + e.yxy,tmp ) +
					  e.xxx*map( pos + e.xxx,tmp ) );
}

float softshadow( in vec3 ro, in vec3 rd, in float k )
{
    float resolution = 1.0;
    float t = 0.0;
    for( int i=0; i<64; i++ )
    {
        vec4 tmp;
        float h = map(ro + rd*t, tmp);
        resolution = min( resolution, k*h/t );
        if( resolution<0.001 ) break;
        t += clamp( h, 0.01, 0.2 );
    }
    return clamp( resolution, 0.0, 1.0 );
}

float raycast( in vec3 ro, in vec3 rd, out vec4 rescol, in float px )
{
    float resolution = -1.0;

    // bounding sphere
    vec2 dis = isphere( vec4(0.0,0.0,0.0,1.25), ro, rd );
    if( dis.y<0.0 ) return -1.0;
    dis.x = max( dis.x, 0.0 );
    dis.y = min( dis.y, 10.0 );

    // raymarch fractal distance field
	vec4 trap;

	float t = dis.x;
	for( int i=0; i<128; i++  )
    {
        vec3 pos = ro + rd*t;
        float th = 0.25*px*t;
		float h = map( pos, trap );
		if( t>dis.y || h<th ) break;
        t += h;
    }

    if( t<dis.y )
    {
        rescol = trap;
        resolution = t;
    }

    return resolution;
}

const vec3 light1 = vec3(  0.577, 0.577, -0.577 );
const vec3 light2 = vec3( -0.707, 0.000,  0.707 );

vec3 refVector( in vec3 v, in vec3 n )
{
    return v;
    float k = dot(v,n);
    //return (k>0.0) ? v : -v;
    return (k>0.0) ? v : v-2.0*n*k;
}

vec3 render( in vec2 p ) // , in mat4 cam )
{
	// pixel size
    float px = 5.0/res.x;

	// ray origin
    vec3 ro = cameraPosition; // vec3( cam[0].w, cam[1].w, cam[2].w );

	// ray direction
	vec3 cf = normalize(-ro);
	vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0)));
	vec3 cu = normalize(cross(cs,cf));
	vec3 rd = normalize(p.x*cs + p.y*cu + 3.0*cf);

    // intersect fractal
	vec4 tra;
	float t = raycast( ro, rd, tra, px );

    // color fractal or black background
	vec3 col = vec3(0.0);
    if( t > 0.0 ) {

        // color
        col = vec3(0.01);
		col = mix( col, vec3(0.10,0.20,0.30), clamp(tra.y,0.0,1.0) );
		col = mix( col, vec3(0.02,0.10,0.30), clamp(tra.z*tra.z,0.0,1.0) );
        col = mix( col, vec3(0.30,0.10,0.02), clamp(pow(tra.w,6.0),0.0,1.0) );
        col *= 0.2;

        // lighting terms
        vec3  pos = ro + t*rd;
        vec3  nor = calcNormal( pos, t, px );

        nor = refVector(nor,-rd);

        vec3  hal = normalize( light1-rd );
        vec3  ref = reflect( rd, nor );
        float occ = clamp(0.05*log(tra.x),0.0,1.0);
        float fac = clamp(1.0+dot(rd,nor),0.0,1.0);

        // sun
        float sha1 = softshadow( pos+0.001*nor, light1, 32.0 );
        float dif1 = clamp( dot( light1, nor ), 0.0, 1.0 )*sha1;
        float spe1 = pow( clamp(dot(nor,hal),0.0,1.0), 32.0 )*dif1*(0.04+0.96*pow(clamp(1.0-dot(hal,light1),0.0,1.0),5.0));

        // bounce
        float dif2 = clamp( 0.5 + 0.5*dot( light2, nor ), 0.0, 1.0 )*occ;

        // sky
        float dif3 = (0.7+0.3*nor.y)*(0.2+0.8*occ);

		// light composition
		vec3 lin = vec3(0.0);
		lin += 12.0*vec3(1.50,1.10,0.70)*dif1;
		lin += 4.0*vec3(0.25,0.20,0.15)*dif2;
		lin += 1.5*vec3(0.10,0.20,0.30)*dif3;
		lin += 2.5*vec3(0.35,0.30,0.25)*(0.05+0.95*occ);
		lin += 4.0*fac*occ;

		col *= lin;
		col = pow( col, vec3(0.7,0.9,1.0) );
        col += spe1*15.0;
	
		// gamma
		col = pow( col, vec3(0.4545) );
    }

    return col;
}

void main()
{
	vec2 uv = zoom * (2.0*gl_FragCoord.xy-res.xy)/res.y;
	vec3 col = render( uv );

	gl_FragColor = vec4( col, 1.0 );
}

`;
