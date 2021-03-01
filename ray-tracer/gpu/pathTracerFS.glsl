
// #version 300 es <-- Included by PathTracerGPU object with other macros

/* Structures */
struct Camera{
    vec3 pos;
    vec3 lookAt;
    vec3 up;        // Scaled based on FOV -> viewport height
    vec3 right;     // Scaled based on FOV -> viewport width
    float aperture;
};

struct Ray{
    vec3 o; // Origin
    vec3 d; // Direction
};

struct Intersection{
    float t;
    vec3 p;
    vec3 n;
};

struct Material{
    vec3 color;
    Ray scatter;
};

struct HitRec{
    Intersection intersect;
    Material material;
};

struct Sphere{
    vec3 center;
    float radius;
};

struct Plane{
    vec3 center;
    vec3 normal;
};

/* Helper Functions */
Intersection invalidIntersection();
vec3 reflect(vec3 v, vec3 n);
vec3 refract(vec3 v, vec3 n, float eta_ratio);
float schlick(float cos_theta, float eta_ratio);
float random();
vec3 randomPointOnUnitSphere();

/* Intersection Functions */
Intersection sphereIntersection(Sphere sphere, Ray ray, float tmin, float tmax);
Intersection planeIntersection(Plane plane, Ray ray, float tmin, float tmax);
HitRec sceneIntersection(Ray ray, float tmin, float tmax);

/* Scattering Functions */
Ray lambertianScatter(Ray ray, vec3 p, vec3 n);
Ray metalScatter(Ray ray, vec3 p, vec3 n, float fuzz);
Ray dielectricScatter(Ray ray, vec3 p, vec3 n, float eta);

/* Path Tracer Functions */
vec3 getColor(Ray ray);

/* Inputs and Outputs */
uniform vec2 uViewport;
uniform Camera uCam;
uniform int uBounceLimit;
uniform int uDetail;
uniform float uSeed;
out vec4 fragmentColor;

/* Global variables */
vec2 seed;

void main(void){

    seed = gl_FragCoord.xy + vec2(uSeed);
    
    vec3 color = vec3(0.0);
    for(int i = 0; i < uDetail; i++){
        // Jitter UV position slightly
        vec2 jitter = vec2(random(), random()) - vec2(0.5);
        vec2 uv = (gl_FragCoord.xy + jitter) / uViewport;

        // Calculate world position of fragment
        vec3 pos = uCam.lookAt
                + (uv.x - 0.5) * uCam.right
                + (uv.y - 0.5) * uCam.up;
        
        // Determine color
        color += getColor(Ray(uCam.pos, normalize(pos - uCam.pos))); 
    }
    color /= float(uDetail);

    // Always full alpha
    fragmentColor = vec4(color, 1.0);
}

/* Path Tracer */
vec3 getColor(Ray ray){
    // Ambient light is skybox
    float y = 0.5 * ray.d.y + 1.0;
    vec3 color = vec3(0.7, 0.8, 1)*y + vec3(1.0, 1.0, 1.0)*(1.0 - y);

    // Loop over bouce limit (we can't do recursion in GLSL!)
    for(int i = 0; i < uBounceLimit; i++){
        HitRec hit = sceneIntersection(ray, EPSILON, INFINITY);
        
        if(hit.intersect.t >= INFINITY){
            break;
        }
        
        color *= hit.material.color;
        ray = hit.material.scatter;

        // If we shouldn't scatter, stop
        if(dot(ray.d, ray.d) == 0.0) break;
    }

    return color;
}

/* Intersection functions */
HitRec sceneIntersection(Ray ray, float tmin, float tmax){
    HitRec result;
    result.intersect = Intersection(tmax, vec3(0.0), vec3(0.0));
    HitRec current;

    SCENE_INTERSECTIONS

    return result;
}

Intersection sphereIntersection(Sphere sphere, Ray ray, float tmin, float tmax){            
    vec3 sphere_to_ray = ray.o - sphere.center;

    float a = dot(ray.d, ray.d);
    float b = 2.0 * dot(sphere_to_ray, ray.d);
    float c = dot(sphere_to_ray, sphere_to_ray) - sphere.radius*sphere.radius;
    float d = b*b - 4.0*a*c;

    if(d < 0.0){
        return invalidIntersection();
    } else{
        float t = (-b - sqrt(d)) / (2.0*a);

        if(t < tmin || t > tmax){
            return invalidIntersection();
        }

        vec3 p = ray.o + t*ray.d;
        return Intersection(t, p, p - c);
    }
}

Intersection planeIntersection(Plane plane, Ray ray, float tmin, float tmax){
    vec3 ray_to_plane = plane.center - ray.o;
    float t = dot(plane.normal, ray_to_plane) / dot(plane.normal, ray.d);

    if(t < tmin || t > tmax){
        return invalidIntersection();
    }

    vec3 p = ray.o + t*ray.d;
    return Intersection(t, p, plane.normal);
}

/* Scatter Functions */
Ray lambertianScatter(Ray r, vec3 p, vec3 n){
    vec3 dir = normalize(randomPointOnUnitSphere() + n);
    return Ray(p, dir);
}

Ray metalScatter(Ray ray, vec3 p, vec3 n, float fuzz){
    vec3 dir = reflect(ray.d, n) + fuzz * randomPointOnUnitSphere();
    
    // Don't let fuzz allow dir to become internal
    if(dot(dir, n) < 0.0) dir = vec3(0.0);

    return Ray(p, dir);
}

Ray dielectricScatter(Ray ray, vec3 p, vec3 n, float eta){
    float cos_theta = dot(-ray.d, n);
    float sin_theta = sqrt(1.0 - cos_theta*cos_theta);

    float eta_ratio = dot(ray.d, n) > 0.0 ? eta : 1.0 / eta;

    vec3 dir;

    // Reflect if we must or with some probability
    if(eta_ratio * sin_theta > 1.0 || schlick(cos_theta, eta_ratio) > random()){
        dir = reflect(ray.d, n);
    }
    else{
        dir = refract(ray.d, n, eta_ratio);
    }

    return Ray(p, dir);
}

/* Helper functions */
Intersection invalidIntersection(){
    return Intersection(INFINITY, vec3(0.0), vec3(0.0));
}

vec3 reflect(vec3 v, vec3 n){
    return v - 2.0*dot(v, n)*n;
}

vec3 refract(vec3 v, vec3 n, float eta_ratio){
    float cos_theta = dot(-v, n);

    vec3 r_perp = eta_ratio * (n*cos_theta + v);
    vec3 r_par = n * -sqrt(abs(1.0 - dot(r_perp, r_perp)));

    return r_perp + r_par;
}

float schlick(float cos_theta, float eta_ratio){
    // Schlick's approximation for reflectance at varying angles
    float r = (1.0 - eta_ratio) / (1.0 + eta_ratio);
    r = r*r;
    return r + (1.0 - r)*pow(1.0 - cos_theta, 5.0);
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
