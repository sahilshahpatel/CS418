
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
float random(float seed);

/* Intersection Functions */
HitRec sphereIntersection(Sphere sphere, Ray ray, float tmin, float tmax);
HitRec planeIntersection(Plane plane, Ray ray, float tmin, float tmax);
HitRec sceneIntersection(Ray ray, float tmin, float tmax);

/* Path Tracer Functions */
vec3 getColor(Ray ray);

/* Inputs and Outputs */
uniform Camera uCam;
uniform vec2 uViewport;
uniform int uBounceLimit;
uniform int uDetail;
uniform float uSeed;
out vec4 fragmentColor;

void main(void){
    float aspect = uViewport.x / uViewport.y;

    /* Camera Info */
    vec3 cam_dir = normalize(uCam.lookAt - uCam.pos);
    float focus = length(uCam.lookAt - uCam.pos);
    
    vec3 color = vec3(0.0);
    for(int i = 0; i < uDetail; i++){
        // Jitter UV position slightly (TODO: better seed choice?)
        vec2 jitter = vec2(
            random(uSeed + float(i)) - 0.5,
            random(uSeed + float(2*i)) - 0.5
        );
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
    // Skybox
    float y = 0.5*ray.d.y + 1.0;
    vec3 color = vec3(0.5, 0.7, 1.0)*y + vec3(1, 1, 1)*(1.0-y);

    // Loop over bouce limit (we can't do recursion in GLSL!)
    for(int i = 0; i < uBounceLimit; i++){
        HitRec hit = sceneIntersection(ray, EPSILON, INFINITY);
        
        if(hit.t >= INFINITY){ break; }
        
        color *= hit.c;

        // Move ray for next iteration
        ray.o = hit.p;
        ray.d = reflect(ray.d, hit.n); //  all materials are metals for now
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

/* Helper functions */
HitRec invalidHitRec(){
    return HitRec(INFINITY, vec3(0.0), vec3(0.0), vec3(0.0));
}

vec3 reflect(vec3 v, vec3 n){
    return v - 2.0*dot(v, n)*n;
}

float random(float seed){
    // TODO: make much better
    return sin(seed);
}
