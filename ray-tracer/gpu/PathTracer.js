class PathTracer{
    constructor(objects, camera, bounceLimit){
        this.objects = objects;
        this.camera = camera;
        this.bounceLimit = bounceLimit;

        this.bvh = new BVH(objects);

        this.infinity = 1000.0;
        this.epsilon  = 0.0001;
    }

    init(){
        return new Promise( (resolve, reject) => {
            Promise.all([pathTracer.getVertexShaderSource(), pathTracer.getFragmentShaderSource()])
            .then(([vSource, fSource]) => {
                this.vertexShader = loadShaderFromSource(vSource, "x-shader/x-vertex");
                this.fragmentShader = loadShaderFromSource(fSource, "x-shader/x-fragment");
    
                resolve();
            })
            .catch(err => {reject(err)});
        });
    }

    getVertexShaderSource(){
        return new Promise((resolve, reject) => {
            fetchText('pathTracerVS.glsl')
            .then(text => {
                resolve(text);
            })
            .catch(reason => reject(reason));
        });
    }

    getFragmentShaderSource(){
        let sceneIntersections = this.sceneIntersectionSource(this.objects);

        return new Promise((resolve, reject) => {
            fetchText('pathTracerFS.glsl')
            .then(text => {
                resolve(`\
                    #version 300 es
                    #ifdef GL_FRAGMENT_PRECISION_HIGH
                    precision highp float;
                    #else
                    precision mediump float;
                    #endif

                    #define INFINITY ${this.infinity.toFixed(1)}
                    #define EPSILON ${this.epsilon}
                    #define PI 3.141592
                    #define MAX_BVH_STACK ${(this.bvh.depth + 1).toFixed(0)}
                    #define USE_BVH

                    #define SCENE_INTERSECTIONS ${sceneIntersections}

                    ${text}
                    `
                );
            })
            .catch(reason => reject(reason));
        });
    }

    sceneIntersectionSource(objects){
        let source = '';
        objects.forEach(obj => {
            source += ` \\
            if(${obj.intersectionSource()} && current.intersect.t < result.intersect.t){ \\
                current.material = ${obj.material.source()}; \\
                result = current; \\
            } \\
            `
        });
        return source;
    }
}