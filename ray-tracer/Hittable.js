class HitRecord{
    constructor(t, point, normal, material, uv){
        this.t = t;
        this.point = glMatrix.vec3.clone(point);
        this.normal = glMatrix.vec3.clone(normal);
        this.material = material;
        this.uv = glMatrix.vec2.clone(uv);
    }
}

class Hittable{
    constructor(material){
        this.material = material
    }

    hit(ray, tmin, tmax){ return null; }
    normal(p){ return null; }
    uv(p){ return null; }
}

class Sphere extends Hittable{
    constructor(center, radius, texture){
        super(texture);
        this.center = glMatrix.vec3.clone(center);
        this.radius = radius;
    }

    normal(p){
        let n = glMatrix.vec3.create();
        glMatrix.vec3.sub(n, p, this.center);
        glMatrix.vec3.normalize(n, n);
        return n;
    }

    uv(point){
        // Shift p to be around unit sphere at origin
        let p = glMatrix.vec3.create();
        glMatrix.vec3.sub(p, point, this.center);
        glMatrix.vec3.scale(p, p, 1/this.radius);

        // Latitude-longitude UVs
        let phi = Math.atan2(-p[2], p[0]) + Math.PI;
        let theta = Math.acos(p[1]);

        return glMatrix.vec2.fromValues(phi/(2*Math.PI), theta/Math.PI);
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
            const n = this.normal(p);
            const uv = this.uv(p);

            return new HitRecord(t, p, n, this.material, uv);
        }
        return null;
    }
}