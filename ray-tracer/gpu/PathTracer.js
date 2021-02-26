class PathTracer{
    constructor(objects){
        this.infinity = 1000.0;
        this.epsilon  = 0.0001;
        this.objects = objects;
    }

    getVertexShaderSource(){
        return new Promise((resolve, reject) => {
            fetch('pathTracerVS.glsl')
            .then(response => response.text())
            .then(text => {
                resolve(text);
            })
            .catch(reason => reject(reason));
        });
    }

    getFragmentShaderSource(){
        let sceneIntersections = this.sceneIntersectionSource(this.objects);

        return new Promise((resolve, reject) => {
            fetch('pathTracerFS.glsl')
            .then(response => response.text())
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
        objects.forEach(obj => { source += obj.intersectionSource(); });
        return source;
    }
}