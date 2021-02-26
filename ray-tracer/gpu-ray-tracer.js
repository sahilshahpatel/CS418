class PathTracerGPU{
    constructor(){
        this.infinity = 1000.0;
        this.epsilon  = 0.0001;
    }

    getVertexShaderSource(){
        return `#version 300 es
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        in vec3 aVertexPosition;
    
        void main(void) {
            gl_Position = vec4(aVertexPosition, 1.0);
        }
        `;
    }

    getFragmentShaderSource(){
        return `#version 300 es
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        #define INFINITY ${this.infinity.toFixed(1)}
        #define EPSILON ${this.epsilon}

        /* Structures */
        struct Camera{
            vec3 pos;
            vec3 lookAt;
            vec3 up;
            float fov;
            float aperture;
        };

        struct HitRec{
            float t;
            vec3 p;
            vec3 n;
            vec3 c;
        };

        /* Inputs and Outputs */
        uniform Camera uCam;
        uniform vec2 uViewport;
        uniform int uBounceLimit;
        out vec4 fragmentColor;

        /* Helper functions */
        vec3 reflect(vec3 v, vec3 n){
            return v - 2.0*dot(v, n)*n;
        }

        /* Intersection functions */
        HitRec sphereIntersection(vec3 center, float radius, vec3 ray_o, vec3 ray_d, float tmin, float tmax){            
            // Start with invalid hit
            HitRec hit = HitRec(tmax, vec3(0.0), vec3(0.0), vec3(0.0));

            vec3 sphere_to_ray = ray_o - center;

            float a = dot(ray_d, ray_d);
            float b = 2.0 * dot(sphere_to_ray, ray_d);
            float c = dot(sphere_to_ray, sphere_to_ray) - radius*radius;
            float d = b*b - 4.0*a*c;

            if(d < 0.0){
                return hit;
            } else{
                float t = (-b - sqrt(d)) / (2.0*a);

                if(t < tmin || t > tmax){
                    return hit;
                }

                vec3 p = ray_o + t*ray_d;
                hit = HitRec(t, p, p - c, vec3(1.0, 0.0, 0.0));
                return hit;
            }
        }

        HitRec getIntersection(vec3 ray_o, vec3 ray_d, float tmin, float tmax){
            HitRec result = HitRec(tmax, vec3(0.0), vec3(0.0), vec3(0.0));
            HitRec hit;

            hit = sphereIntersection(vec3(0.0), 0.75, ray_o, ray_d, tmin, tmax);
            if(hit.t < result.t){ result = hit; }

            return result;
        }

        /* Path Tracer */
        vec4 getColor(vec3 ray_o, vec3 ray_d){
            // Skybox
            float y = 0.5*ray_d.y + 1.0;
            vec3 color = vec3(0.5, 0.7, 1.0)*y + vec3(1, 1, 1)*(1.0-y);

            // Loop over bouce limit (we can't do recursion in GLSL!)
            for(int i = 0; i < uBounceLimit; i++){
                HitRec hit = getIntersection(ray_o, ray_d, EPSILON, INFINITY);
                
                if(hit.t >= INFINITY){ break; }
                
                color *= hit.c;

                // Move ray for next iteration
                ray_o = hit.p;
                ray_d = reflect(ray_d, hit.n); //  all materials are metals for now
            }

            // Always full alpha
            return vec4(color, 1.0);
        }

        void main(void){
            float aspect = uViewport.x / uViewport.y;
            vec2 uv = gl_FragCoord.xy / uViewport;

            /* Camera Info */
            vec3 cam_dir = normalize(uCam.lookAt - uCam.pos);
            float focus = length(uCam.lookAt - uCam.pos);

            vec3 ray_d  = 2.0*(uv.x - 0.5) * aspect * cross(cam_dir, uCam.up)
                        + 2.0*(uv.y - 0.5) * uCam.up
                        + cam_dir * focus;
            
            fragmentColor = getColor(uCam.pos, ray_d); 
        }
        `;
    }
}