
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

struct Triangle{
    vec3 a;
    vec3 b;
    vec3 c;
};

/* Helper Functions */
vec3 reflect(vec3 v, vec3 n);
vec3 refract(vec3 v, vec3 n, float eta_ratio);
float schlick(float cos_theta, float eta_ratio);
float random(vec2 co);
float random();
vec3 randomPointOnUnitSphere();
vec2 randomPointInUnitDisk();

/* Intersection Functions */
bool sphereIntersection(out Intersection it, Sphere sphere, Ray ray, float tmin, float tmax);
bool planeIntersection(out Intersection it, Plane plane, Ray ray, float tmin, float tmax);
bool triangleIntersection(out Intersection it, Triangle tri, Ray ray, float tmin, float tmax);
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
uniform float uPreviousFrameWeight;
uniform sampler2D uPreviousFrame;
in vec2 fragUV;
out vec4 fragmentColor;

/* Global variables */
vec2 seed;

void main(void){
    seed = vec2(uSeed);
    
    // Jitter UV position slightly
    vec2 jitter = 0.5 * vec2(random(), random()) / uViewport;
    vec2 uv = fragUV + jitter;

    // Calculate world position of fragment
    vec3 frag_pos = uCam.lookAt
            + (uv.x - 0.5) * uCam.right
            + (uv.y - 0.5) * uCam.up;
    
    // Randomize cam_pos to simulate depth-of-field
    vec2 offset = uCam.aperture * randomPointInUnitDisk();
    vec3 cam_pos = uCam.pos + offset.x * normalize(uCam.right) + offset.y * (normalize(uCam.up));
    
    // Determine color
    vec3 color = getColor(Ray(cam_pos, normalize(frag_pos - cam_pos)));

    // Average with previous frame
    fragmentColor = uPreviousFrameWeight * texture(uPreviousFrame, fragUV) + (1.0 - uPreviousFrameWeight) * vec4(color, 1.0);
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

bool sphereIntersection(out Intersection it, Sphere sphere, Ray ray, float tmin, float tmax){            
    vec3 sphere_to_ray = ray.o - sphere.center;

    float a = dot(ray.d, ray.d);
    float b = 2.0 * dot(sphere_to_ray, ray.d);
    float c = dot(sphere_to_ray, sphere_to_ray) - sphere.radius*sphere.radius;
    float d = b*b - 4.0*a*c;

    if(d < 0.0){
        return false;
    } else{
        float t = (-b - sqrt(d)) / (2.0*a);

        if(t < tmin || t > tmax){
            return false;
        }

        vec3 p = ray.o + t*ray.d;
        it = Intersection(t, p, p - sphere.center);
        return true;
    }
}

bool planeIntersection(out Intersection it, Plane plane, Ray ray, float tmin, float tmax){
    vec3 ray_to_plane = plane.center - ray.o;
    
    float denominator = dot(plane.normal, ray.d);
    if(denominator == 0.0){ return false; }
    float t = dot(plane.normal, ray_to_plane) / denominator;

    if(t < tmin || t > tmax){ 
        return false; 
    }

    vec3 p = ray.o + t*ray.d;
    it = Intersection(t, p, plane.normal);
    return true;
}

bool triangleIntersection(out Intersection it, Triangle tri, Ray ray, float tmin, float tmax){
    // Triangle vectors
    vec3 edge0 = tri.b - tri.a;
    vec3 edge1 = tri.c - tri.b;
    vec3 edge2 = tri.a - tri.c;
    vec3 n = normalize(cross(edge2, edge0)); 

    // First find intersection with triangle plane
    vec3 ray_to_plane = tri.a - ray.o;
    float denominator = dot(n, ray.d);
    if(denominator == 0.0){ return false; }
    float t = dot(n, ray_to_plane) / denominator;

    if(t < tmin || t > tmax){
        return false;
    }

    vec3 p = ray.o + t*ray.d;

    /* Check that p is inside triangle */
    // From https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution
    
    vec3 c0 = p - tri.a;
    vec3 c1 = p - tri.b;
    vec3 c2 = p - tri.c;
    
    if( dot(n, cross(edge0, c0)) <= 0.0 ||
        dot(n, cross(edge1, c1)) <= 0.0 ||
        dot(n, cross(edge2, c2)) <= 0.0 ){
        
        return false;
    }

    it = Intersection(t, p, n);
    return true;
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

vec2 randomPointInUnitDisk(){
    // From https://mathworld.wolfram.com/DiskPointPicking.html
    float r = random();
    float theta = random()*PI*2.0;
    return sqrt(r) * vec2(cos(theta), sin(theta));
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
    // Adapted from https://www.shadertoy.com/view/lssBD7
    // Get random and reset seed for next call
    seed.x = random(seed + fragUV);
    seed.y = random(seed + fragUV);

    return seed.x;
}
