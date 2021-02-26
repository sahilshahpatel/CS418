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