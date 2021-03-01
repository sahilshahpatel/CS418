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

class Metal extends Material{
    constructor(color, fuzz){
        super(color);

        this.fuzz = fuzz;
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

    source(){
        return `Material(${asVec3(this.color)}, dielectricScatter(ray, current.intersect.p, current.intersect.n, ${asFloat(this.eta)}))`;
    }
}

class Normals extends Material{
    constructor(){
        // "Color" doesn't matter for normals material
        super(glMatrix.vec3.fromValues(0, 0, 0));
    }

    source(){
        return `Material(0.5*current.intersect.n + 0.5, Ray(current.intersect.p, vec3(0.0)))`
    }
}