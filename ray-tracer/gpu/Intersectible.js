class Intersectible{
    constructor(material){
        this.material = material;
    }

    static get BVH_ID() { return 0; }

    intersectionSource(){
        return '';
    }

    getBVHData(){
        return [
            glMatrix.vec4.create(),                                                 // [0:2] shape[0], [3] node type
            glMatrix.vec4.fromValues(0, 0, 0, this.material.constructor.BVH_ID),    // [0:2] shape[1], [3] material type
            glMatrix.vec4.create(),                                                 // [0:2] shape[2], [3] texture number
        ].concat(this.material.getBVHData());
    }

    getBoundingBox(){
        return new BoundingBox(glMatrix.vec3.create(), glMatrix.vec3.create());
    }
}

class Sphere extends Intersectible{
    constructor(center, radius, material){
        super(material);
        
        this.center = glMatrix.vec3.clone(center);
        this.radius = radius;
    }

    static get BVH_ID(){ return 1; }

    intersectionSource(){
        let objConstructor = `Sphere(${asVec3(this.center)}, ${asFloat(this.radius)})`;
        return `sphereIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`;
    }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.center, this.constructor.BVH_ID),              // [0:2] shape[0], [3] node type
            glMatrix.vec4.fromValues(this.radius, 0, 0, this.material.constructor.BVH_ID),  // [0:2] shape[1], [3] material type
            glMatrix.vec4.create(),                                                         // [0:2] shape[2], [3] texture number
        ].concat(this.material.getBVHData());
    }

    getBoundingBox(){
        let r =  glMatrix.vec3.fromValues(this.radius, this.radius, this.radius);

        let start = glMatrix.vec3.clone(this.center);
        glMatrix.vec3.sub(start, start, r);

        let end = glMatrix.vec3.clone(this.center);
        glMatrix.vec3.add(end, end, r);

        return new BoundingBox(start, end);
    }
}

class Plane extends Intersectible{
    constructor(center, normal, material){
        super(material);

        this.center = glMatrix.vec3.clone(center);
        this.normal = glMatrix.vec3.clone(normal);
    }

    static get BVH_ID(){ return 2; }

    intersectionSource(){
        let objConstructor = `Plane(${asVec3(this.center)}, ${asVec3(this.normal)})`;
        return `planeIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`;
    }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.center, this.constructor.BVH_ID),              // [0:2] shape[0], [3] node type
            glMatrix.vec4.fromValues(...this.normal, this.material.constructor.BVH_ID),     // [0:2] shape[1], [3] material type
            glMatrix.vec4.create(),                                                         // [0:2] shape[2], [3] texture number
        ].concat(this.material.getBVHData());
    }

    getBoundingBox(){
        // TODO: does this actually work well with the shader?
        return new BoundingBox(
            glMatrix.vec3.fromValues(-Infinity, -Infinity, -Infinity),
            glMatrix.vec3.fromValues(Infinity, Infinity, Infinity)
        );
    }
}

class Triangle extends Intersectible{
    constructor(a, b, c, material){
        super(material);

        this.a = glMatrix.vec3.clone(a);
        this.b = glMatrix.vec3.clone(b);
        this.c = glMatrix.vec3.clone(c);
    }

    static get BVH_ID() { return 3; }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.a, this.constructor.BVH_ID),           // [0:2] shape[0], [3] node type
            glMatrix.vec4.fromValues(...this.b, this.material.constructor.BVH_ID),  // [0:2] shape[1], [3] material type
            glMatrix.vec4.fromValues(...this.c, 0),                                 // [0:2] shape[2], [3] texture number
        ].concat(this.material.getBVHData());
    }

    getBoundingBox(){
        let start = glMatrix.vec3.create();
        glMatrix.vec3.min(start, this.a, this.b);
        glMatrix.vec3.min(start, start, this.c);

        let end = glMatrix.vec3.create();
        glMatrix.vec3.max(end, this.a, this.b);
        glMatrix.vec3.max(end, end, this.c);

        return new BoundingBox(start, end);
    }

    intersectionSource(){
        let objConstructor = `Triangle(${asVec3(this.a)}, ${asVec3(this.b)}, ${asVec3(this.c)})`;
        return `triangleIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`
    }
}