class Intersectible{
    intersectionSource(){
        return '';
    }
}

class Sphere extends Intersectible{
    constructor(center, radius, color){
        super();
        
        this.center = glMatrix.vec3.clone(center);
        this.radius = radius;
        this.color = glMatrix.vec3.clone(color);
    }

    intersectionSource(){
        let objConstructor = `Sphere(${asVec3(this.center)}, 0.75, ${asVec3(this.color)} )`;
        return ` \\
        hit = sphereIntersection(${objConstructor}, ray, tmin, tmax); \\
        if(hit.t < result.t){ result = hit; } \\
        `;
    }
}

class Plane extends Intersectible{
    constructor(center, normal, color){
        super();

        this.center = glMatrix.vec3.clone(center);
        this.normal = glMatrix.vec3.clone(normal);
        this.color = glMatrix.vec3.clone(color);
    }

    intersectionSource(){
        let objConstructor = `Plane(${asVec3(this.center)}, ${asVec3(this.normal)}, ${asVec3(this.color)} )`;
        return ` \\
        hit = planeIntersection(${objConstructor}, ray, tmin, tmax); \\
        if(hit.t < result.t){ result = hit; } \\
        `;
    }
}