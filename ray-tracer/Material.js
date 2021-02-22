class RayScatter{
    constructor(ray, attenuation){
        this.ray = ray;
        this.attenuation = attenuation;
    }
}

class Material{
    constructor(texture, reflectivity){
        if(!texture){
            // Defaults to invisible
            this.texture = function(p, n){ return glMatrix.vec4.create();}
        }
        else if(texture instanceof Function || typeof texture === "function"){
            // Accepts texture as function returning color
            this.texture = texture;
        }
        else{
            // Accepts texture as single color
            this.texture = function(p, n){ return glMatrix.vec4.clone(texture)};
        }

        this.reflectivity = reflectivity;
    }

    // Won't reflect at all
    scatter(ray, p, n){ return null; }
}

class Lambertian extends Material{
    constructor(texture, reflectivity){
        super(texture, reflectivity);
    }

    scatter(ray, p, n){
        let dir = randomPointOnUnitSphere();
        glMatrix.vec3.add(dir, dir, n);
        glMatrix.vec3.normalize(dir, dir);

        // Cover degenerate case
        if(nearZero(dir)){ dir = n; }

        let r = new Ray(p, dir);
        return new RayScatter(r, 1 - this.reflectivity);
    }
}

class Metal extends Material{
    constructor(texture, reflectivity, fuzz){
        super(texture, reflectivity);
        this.fuzz = fuzz;
    }

    scatter(ray, p, n){
        // Get perfectly reflected ray
        let v = reflect(ray.dir, n);

        // Adjust for fuzz
        if(this.fuzz > 0){
            let offset = glMatrix.vec3.create();
            glMatrix.vec3.scale(offset, randomPointOnUnitSphere(), this.fuzz);
            glMatrix.vec3.add(v, v, offset);

            // Check if fuzz made scatter fall inside of object
            if(glMatrix.vec3.dot(v, n) <= 0){ return null; }
        }
        
        let r = new Ray(p, v);
        return new RayScatter(r, 1 - this.reflectivity);
    }
}