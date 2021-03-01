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
        return `Material(${asVec3(this.color)}, metalScatter(ray, current.intersect.p, current.intersect.n, ${asFloat(this.fuzz)}))`
    }
}

class Dielectric extends Metal{
    constructor(color, eta){
        super(color);
        
        this.eta = eta;
    }

    source(){
        return `Material(${asVec3(this.color)}, dielectricScatter(ray, current.intersect.p, current.intersect.n, ${asFloat(this.eta)}))`;
    }
}