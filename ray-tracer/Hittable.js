class HitRecord{
    constructor(t, point, normal){
        this.t = t;
        this.point = glMatrix.vec3.clone(point);
        this.normal = glMatrix.vec3.clone(normal);
    }
}

class Hittable{
    constructor(material){
        this.material = material
    }

    hit(ray, tmin, tmax){ return null; }
}

class Sphere extends Hittable{
    constructor(center, radius, texture){
        super(texture);
        this.center = glMatrix.vec3.clone(center);
        this.radius = radius;
    }

    hit(ray, tmin, tmax){
        const sphere_to_ray = glMatrix.vec3.create();        
        glMatrix.vec3.sub(sphere_to_ray, ray.origin, this.center);

        const a = glMatrix.vec3.sqrLen(ray.dir);
        const b = 2 * glMatrix.vec3.dot(sphere_to_ray, ray.dir);
        const c = glMatrix.vec3.sqrLen(sphere_to_ray) - this.radius*this.radius;
        const discriminant = b*b - 4*a*c;

        if(discriminant > 0){
            const t = (-b - Math.sqrt(discriminant))/(2*a);
            
            if(t < tmin || t > tmax){
                return null;
            }

            const p = ray.at(t);
            const n = glMatrix.vec3.create();
            glMatrix.vec3.sub(n, p, this.center);
            glMatrix.vec3.normalize(n, n);

            return new HitRecord(t, p, n);
        }
        return null;
    }
}