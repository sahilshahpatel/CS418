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
            this.texture = function(p){ return glMatrix.vec4.create();}
        }
        else if(texture instanceof Function || typeof texture === "function"){
            // Accepts texture as function returning color
            this.texture = texture;
        }
        else{
            // Accepts texture as single color
            this.texture = function(p){ return glMatrix.vec4.clone(texture)};
        }

        this.reflectivity = reflectivity;
    }

    // Won't reflect at all
    scatter(p, n){ return null; }
}

class Lambertian extends Material{
    constructor(texture, reflectivity){
        super(texture, reflectivity);
    }

    scatter(p, n){
        let dir = randomPointOnUnitSphere();
        glMatrix.vec3.add(dir, dir, n);
        glMatrix.vec3.normalize(dir, dir);

        let r = new Ray(p, dir);
        return new RayScatter(r, 1 - this.reflectivity);
    }
}