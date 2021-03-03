class Intersectible{
    constructor(material){
        this.material = material;
    }

    intersectionSource(){
        return '';
    }
}

class Sphere extends Intersectible{
    constructor(center, radius, material){
        super(material);
        
        this.center = glMatrix.vec3.clone(center);
        this.radius = radius;
    }

    intersectionSource(){
        let objConstructor = `Sphere(${asVec3(this.center)}, ${asFloat(this.radius)})`;
        return `sphereIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`;
    }
}

class Plane extends Intersectible{
    constructor(center, normal, material){
        super(material);

        this.center = glMatrix.vec3.clone(center);
        this.normal = glMatrix.vec3.clone(normal);
    }

    intersectionSource(){
        let objConstructor = `Plane(${asVec3(this.center)}, ${asVec3(this.normal)})`;
        return `planeIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`;
    }
}