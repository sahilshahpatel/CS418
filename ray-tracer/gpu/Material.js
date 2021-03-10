class Material{
    constructor(color){
        this.color = glMatrix.vec3.clone(color);
    }

    static get BVH_ID() { return 0; }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.color, 0), // [0:3] color | [0:4] texCo[0:1]
            glMatrix.vec4.create(),                     // [0:1] texCo[2], [2:3] scatter data
        ];
    }

    source(){ return ''; }
}

class Lambertian extends Material{
    constructor(color){
        super(color);
    }

    static get BVH_ID(){ return 1; }

    source(){
        return `Material(${asVec3(this.color)}, lambertianScatter(ray, current.intersect.p, current.intersect.n))`;
    }
}

class Metal extends Material{
    constructor(color, fuzz){
        super(color);

        this.fuzz = fuzz;
    }

    static get BVH_ID(){ return 2; }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.color, 0),     // [0:3] color | [0:4] texCo[0:1]
            glMatrix.vec4.fromValues(0, 0, this.fuzz, 0),   // [0:1] texCo[2], [2:3] scatter data
        ];
    }

    source(){
        if(this.fuzz > 0){
            return `Material(${asVec3(this.color)}, metalScatter(ray, current.intersect.p, current.intersect.n, ${asFloat(this.fuzz)}))`
        }
        else{
            // More efficient version if fuzz is 0
            return `Material(${asVec3(this.color)}, Ray(current.intersect.p, reflect(ray.d, current.intersect.n)))`
        }
    }
}

class Dielectric extends Material{
    constructor(color, eta){
        super(color);
        
        this.eta = eta;
    }

    static get BVH_ID() { return 3; }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.color, 0),     // [0:3] color | [0:4] texCo[0:1]
            glMatrix.vec4.fromValues(0, 0, this.eta, 0),    // [0:1] texCo[2], [2:3] scatter data
        ];
    }

    source(){
        return `Material(${asVec3(this.color)}, dielectricScatter(ray, current.intersect.p, current.intersect.n, ${asFloat(this.eta)}))`;
    }
}

class Normals extends Material{
    constructor(){
        // "Color" doesn't matter for normals material
        super(glMatrix.vec3.fromValues(0, 0, 0));
    }

    static get BVH_ID() { return 4; }

    source(){
        return `Material(0.5*current.intersect.n + 0.5, Ray(current.intersect.p, vec3(0.0)))`
    }
}