class Material{
    constructor(color){
        this.color = glMatrix.vec3.clone(color);
    }

    source(){ return ''; }
}

class Lambertian extends Material{
    constructor(color){
        super(color);
    }

    source(){
        return `Material(${asVec3(this.color)}, lambertianScatter(ray, current.intersect.p, current.intersect.n))`;
    }
}