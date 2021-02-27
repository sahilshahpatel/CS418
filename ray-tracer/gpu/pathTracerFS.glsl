
// #version 300 es <-- Included by PathTracerGPU object with other macros

/* Structures */
struct Camera{
    vec3 pos;
    vec3 lookAt;
    vec3 up;
    float fov;
    float aperture;
};

struct Ray{
    vec3 o; // Origin
    vec3 d; // Direction
};

struct HitRec{
    float t;
    vec3 p;
    vec3 n;
    vec3 c;
};

struct Sphere{
    vec3 center;
    float radius;
    vec3 color;
};

struct Plane{
    vec3 center;
    vec3 normal;
    vec3 color;
};

/* Helper Functions */
HitRec invalidHitRec();
vec3 reflect(vec3 v, vec3 n);
float random();
vec3 randomPointOnUnitSphere();

/* Intersection Functions */
HitRec sphereIntersection(Sphere sphere, Ray ray, float tmin, float tmax);
HitRec planeIntersection(Plane plane, Ray ray, float tmin, float tmax);
HitRec sceneIntersection(Ray ray, float tmin, float tmax);

/* Scattering Functions */
Ray lambertianScatter(Ray ray, vec3 p, vec3 n);

/* Path Tracer Functions */
vec3 getColor(Ray ray);

/* Inputs and Outputs */
uniform Camera uCam;
uniform vec2 uViewport;
uniform int uBounceLimit;
uniform int uDetail;
uniform float uSeed;
out vec4 fragmentColor;

/* Global variables */
vec2 seed;

void main(void){
    float aspect = uViewport.x / uViewport.y;
    seed = gl_FragCoord.xy + vec2(uSeed);

    /* Camera Info */
    vec3 cam_dir = normalize(uCam.lookAt - uCam.pos);
    float focus = length(uCam.lookAt - uCam.pos);
    
    vec3 color = vec3(0.0);
    for(int i = 0; i < uDetail; i++){
        // Jitter UV position slightly (TODO: better seed choice?)
        vec2 jitter = vec2(random(), random()) - vec2(0.5);
        vec2 uv = (gl_FragCoord.xy + jitter) / uViewport;

        // Calculate ray from camera to UV position
        vec3 ray_d  = 2.0*(uv.x - 0.5) * aspect * cross(cam_dir, uCam.up)
            + 2.0*(uv.y - 0.5) * uCam.up
            + cam_dir * focus;
        
        // Determine color
        color += getColor(Ray(uCam.pos, ray_d)); 
    }
    color /= float(uDetail);

    // Always full alpha
    fragmentColor = vec4(color, 1.0);
}

/* Path Tracer */
vec3 getColor(Ray ray){
    // Ambient light is bright white
    vec3 color = vec3(1.0);

    // Loop over bouce limit (we can't do recursion in GLSL!)
    for(int i = 0; i < uBounceLimit; i++){
        HitRec hit = sceneIntersection(ray, EPSILON, INFINITY);
        
        if(hit.t >= INFINITY){
            // Rays that intersect with nothing become skybox
            if(color == vec3(1.0)){
                float y = 0.5*ray.d.y + 1.0;
                color = vec3(0.7, 0.8, 1)*y + vec3(1.0, 1.0, 1.0)*(1.0 - y);
            }
            break;
        }
        
        color *= hit.c;

        // Move ray for next iteration
        ray = lambertianScatter(ray, hit.p, hit.n);
    }

    return color;
}

/* Intersection functions */
HitRec sceneIntersection(Ray ray, float tmin, float tmax){
    HitRec result = HitRec(tmax, vec3(0.0), vec3(0.0), vec3(0.0));
    HitRec hit;

    SCENE_INTERSECTIONS

    return result;
}

HitRec sphereIntersection(Sphere sphere, Ray ray, float tmin, float tmax){            
    vec3 sphere_to_ray = ray.o - sphere.center;

    float a = dot(ray.d, ray.d);
    float b = 2.0 * dot(sphere_to_ray, ray.d);
    float c = dot(sphere_to_ray, sphere_to_ray) - sphere.radius*sphere.radius;
    float d = b*b - 4.0*a*c;

    if(d < 0.0){
        return invalidHitRec();
    } else{
        float t = (-b - sqrt(d)) / (2.0*a);

        if(t < tmin || t > tmax){
            return invalidHitRec();
        }

        vec3 p = ray.o + t*ray.d;
        return HitRec(t, p, p - c, sphere.color);
    }
}

HitRec planeIntersection(Plane plane, Ray ray, float tmin, float tmax){
    vec3 ray_to_plane = plane.center - ray.o;
    float t = dot(plane.normal, ray_to_plane) / dot(plane.normal, ray.d);

    if(t < tmin || t > tmax){
        return invalidHitRec();
    }

    vec3 p = ray.o + t*ray.d;
    return HitRec(t, p, plane.normal, plane.color);
}

/* Scatter Functions */
Ray lambertianScatter(Ray r, vec3 p, vec3 n){
    vec3 dir = normalize(randomPointOnUnitSphere() + n);
    return Ray(p, dir);
}

/* Helper functions */
HitRec invalidHitRec(){
    return HitRec(INFINITY, vec3(0.0), vec3(0.0), vec3(0.0));
}

vec3 reflect(vec3 v, vec3 n){
    return v - 2.0*dot(v, n)*n;
}

vec3 randomPointOnUnitSphere(){
    // From https://mathworld.wolfram.com/SpherePointPicking.html
    float u = random();
    float v = random();

    float theta = 2.0*PI*u;
    float phi = acos(2.0*v - 1.0);
    
    return vec3(sin(theta)*cos(phi), sin(theta)*sin(phi), cos(theta));
}

/* Random number generator */
highp float random(vec2 co)
{
    // From http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt, PI);
    return fract(sin(sn) * c);
}

float random(){
    // From https://www.shadertoy.com/view/lssBD7
    // Get random and reset seed for next call
    seed.x = random(seed);
    seed.y = random(seed);

    return seed.x;
}
