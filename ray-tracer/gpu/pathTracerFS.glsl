
// #version 300 es <-- Included by PathTracerGPU object with other macros

/* Macros */
// Use if instead of switch for precision catching
#define CASE(flag, value) if(flag < float(value) + 0.5)
#define CASEN(flag, value) if(flag < float(value) - 0.5)

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

struct BoundingBox{
    vec3 start;
    vec3 end;
};

struct BVHNode{
    vec4[2] data;
};

struct Object{
    vec3[3] shape;
    float type;
    float material;
    vec2 scatterData;
    float texture;
    vec3 color;     // If texture = 0
    vec2[3] texCo;  // If texture > 0
};

/* Helper Functions */
vec3 reflect(vec3 v, vec3 n);
vec3 refract(vec3 v, vec3 n, float eta_ratio);
float schlick(float cos_theta, float eta_ratio);
BVHNode getBVHNode(int i);
Object getObject(int i);
float random(vec2 co);
float random();
vec3 randomPointOnUnitSphere();
vec2 randomPointInUnitDisk();

/* Intersection Functions */
bool sphereIntersection(out Intersection it, Sphere sphere, Ray ray, float tmin, float tmax);
bool planeIntersection(out Intersection it, Plane plane, Ray ray, float tmin, float tmax);
bool triangleIntersection(out Intersection it, Triangle tri, Ray ray, float tmin, float tmax);
HitRec sceneIntersection(Ray ray, float tmin, float tmax);

HitRec sceneIntersectionBVH(Ray ray, float tmin, float tmax);
bool boundingBoxIntersection(BoundingBox box, Ray ray, float tmin, float tmax);
bool objectIntersection(inout HitRec result, float idx, Ray ray, float tmin, float tmax);

/* Scattering Functions */
Ray lambertianScatter(Ray ray, vec3 p, vec3 n);
Ray metalScatter(Ray ray, vec3 p, vec3 n, float fuzz);
Ray dielectricScatter(Ray ray, vec3 p, vec3 n, float eta);
void setMaterial(out HitRec hit, Object obj, Ray ray, vec3 p, vec3 n);

/* Path Tracer Functions */
vec3 getColor(Ray ray);

/* Inputs and Outputs */
uniform vec2 uViewport;
uniform Camera uCam;
uniform int uBounceLimit;
uniform float uSeed;
uniform float uPreviousFrameWeight;
uniform sampler2D uPreviousFrame;

uniform sampler2D uBVH;
uniform vec2 uBVHSize;
uniform sampler2D uObjects;
uniform vec2 uObjectsSize;

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
        #ifdef USE_BVH
        HitRec hit = sceneIntersectionBVH(ray, EPSILON, INFINITY);
        #else
        HitRec hit = sceneIntersection(ray, EPSILON, INFINITY);
        #endif

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

HitRec sceneIntersectionBVH(Ray ray, float tmin, float tmax){
    int[MAX_BVH_STACK] stack;
    stack[0] = 0; // Start at root node
    int stackp = 0;

    HitRec result;
    result.intersect = Intersection(tmax, vec3(0.0), vec3(0.0));

    #define LEFT(i)  (2*i + 1)
    #define RIGHT(i) (2*i + 2)

    // Loop until our stack is empty
    while(stackp >= 0){
        int n = stack[stackp];
        BVHNode node = getBVHNode(n);

        if(node.data[0].x < 0.0){
            // BVH Node is internal, check self and recurse
            BoundingBox box = BoundingBox(node.data[0].yzw, node.data[1].yzw);
            if(!boundingBoxIntersection(box, ray, tmin, tmax)){
                // Ray misses this box, so we can ignore it
                stackp = stackp - 1; // pop
                continue;
            }
            
            // We must check (push) children
            // stackp = stackp - 1; // Dispose of self (cancels with below)
            // stackp = stackp + 1; // Begin push of left (cancels with above)
            stack[stackp] = LEFT(n);
            stackp = stackp + 1;
            stack[stackp] = RIGHT(n);
            continue;
        }

        // BVHNode is object collection, check for intersections
        objectIntersection(result, node.data[0].x, ray, tmin, tmax);
        objectIntersection(result, node.data[0].y, ray, tmin, tmax);
        objectIntersection(result, node.data[0].z, ray, tmin, tmax);
        objectIntersection(result, node.data[0].w, ray, tmin, tmax);
        objectIntersection(result, node.data[1].x, ray, tmin, tmax);
        objectIntersection(result, node.data[1].y, ray, tmin, tmax);
        objectIntersection(result, node.data[1].z, ray, tmin, tmax);
        objectIntersection(result, node.data[1].w, ray, tmin, tmax);
        
        // This node has been handled, we can pop now
        stackp = stackp - 1;
        continue;
    }

    return result;

    #undef LEFT
    #undef RIGHT
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

bool objectIntersection(inout HitRec result, float idx, Ray ray, float tmin, float tmax){
    if(idx < 0.0) return false;

    Object obj = getObject(int(idx));

    Intersection current;
    bool contact = false;
    CASE(obj.type, 1){
        Sphere s = Sphere(obj.shape[0], obj.shape[1].x);
        contact = sphereIntersection(current, s, ray, tmin, result.intersect.t);
    }
    else CASE(obj.type, 2){
        Plane pl = Plane(obj.shape[0], obj.shape[1]);
        contact = planeIntersection(current, pl, ray, tmin, result.intersect.t);
    }
    else CASE(obj.type, 3){
        Triangle tri = Triangle(obj.shape[0], obj.shape[1], obj.shape[2]);
        contact = triangleIntersection(current, tri, ray, tmin, result.intersect.t);
    }

    // Update result if we hit successfully
    if(contact){
        result.intersect = current;
        setMaterial(result, obj, ray, current.p, current.n);
    }

    return contact;
}

bool boundingBoxIntersection(BoundingBox box, Ray ray, float tmin, float tmax){    
    // From https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies
    vec3 t_min = vec3(tmin);
    vec3 t_max = vec3(tmax);
    
    vec3 invD = vec3(1.0) / ray.d;
    vec3 t0 = (box.start - ray.o) * invD;
    vec3 t1 = (box.end - ray.o) * invD;

    // Check X-boundaries
    if (invD.x < 0.0){
        float temp = t0.x;
        t0.x = t1.x;
        t1.x = temp;
    }
    t_min.x = t0.x > t_min.x ? t0.x : t_min.x;
    t_max.x = t1.x < t_max.x ? t1.x : t_max.x;
    if (t_max.x <= t_min.x)
        return false;


    if (invD.y < 0.0){
        float temp = t0.y;
        t0.y = t1.y;
        t1.y = temp;
    }
    t_min.y = t0.y > t_min.y ? t0.y : t_min.y;
    t_max.y = t1.y < t_max.y ? t1.y : t_max.y;
    if (t_max.y <= t_min.y)
        return false;

    if (invD.z < 0.0){
        float temp = t0.z;
        t0.z = t1.z;
        t1.z = temp;
    }
    t_min.z = t0.z > t_min.z ? t0.z : t_min.z;
    t_max.z = t1.z < t_max.z ? t1.z : t_max.z;
    if (t_max.z <= t_min.z)
        return false;

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

/** Sets the material of hit based on the node's material type
 */
void setMaterial(out HitRec hit, Object obj, Ray ray, vec3 p, vec3 n){
    // Color is material type independent
    CASE(obj.texture, 0){
        // Solid color
        hit.material.color = obj.color;
    }
    // else CASE(obj.texture, 1){
    //     // TODO: use texture to get color
    // }

    CASE(obj.material, 0){
        // No material = solid color
        hit.material.scatter = Ray(vec3(0.0), vec3(0.0));
    }
    else CASE(obj.material, 1){
        hit.material.scatter = lambertianScatter(ray, p, n);
    }
    else CASE(obj.material, 2){
        hit.material.scatter = metalScatter(ray, p, n, obj.scatterData.x);
    }
    else CASE(obj.material, 3){
        hit.material.scatter = dielectricScatter(ray, p, n, obj.scatterData.x);
    }
    else CASE(obj.material, 4){
        hit.material.scatter = Ray(vec3(0.0), vec3(0.0));
        hit.material.color = 0.5*n + 0.5;                   // Special case material which modifies color
    }
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

BVHNode getBVHNode(int i){
    BVHNode node;

    float tex = float(i) + 0.5;
    node.data[0] = texture(uBVH, vec2(tex, 0.5) / uBVHSize);
    node.data[1] = texture(uBVH, vec2(tex, 1.5) / uBVHSize);

    return node;
}

Object getObject(int i){
    Object obj;

    // Sample BVH texture for each vec4
    float tex = float(i) + 0.5;
    vec4 data0 = texture(uObjects, vec2(tex, 0.5) / uObjectsSize);
    vec4 data1 = texture(uObjects, vec2(tex, 1.5) / uObjectsSize);
    vec4 data2 = texture(uObjects, vec2(tex, 2.5) / uObjectsSize);
    vec4 data3 = texture(uObjects, vec2(tex, 3.5) / uObjectsSize);
    vec4 data4 = texture(uObjects, vec2(tex, 4.5) / uObjectsSize);

    /* Object comes in as vec4[5]
    * [0].w                    => shape type
    * [1].w                    => material type
    * [2].w                    => texture number (0 = solid color)
    * [0:2].xyz                => shape data
    * [3].xy, [3].zw, [4].xy   => texCo[0:2] (for textures)
    * [3].xyz                  => color (for solid color)
    * [4].zw                   => material scatter data
    */

    // Fill in node struct
    obj.type           = data0.w;
    obj.material       = data1.w;
    obj.texture        = data2.w;
    obj.shape[0]       = data0.xyz;
    obj.shape[1]       = data1.xyz;
    obj.shape[2]       = data2.xyz;
    obj.texCo[0]       = data3.xy;
    obj.texCo[1]       = data3.zw;
    obj.texCo[2]       = data4.xy;
    obj.color          = data3.xyz;
    obj.scatterData    = data4.zw;

    return obj;
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
highp float random(vec2 co){
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
