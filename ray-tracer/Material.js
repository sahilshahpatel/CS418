class RayScatter{
    constructor(ray, color){
        this.ray = ray;
        this.color = color;
    }
}

class Material{
    constructor(texture){
        if(!texture){
            // Defaults to black
            this.texture = () => { return BLACK }
        }
        else if(texture instanceof Function || typeof texture === "function"){
            // Accepts texture as function returning color
            this.texture = texture;
        }
        else if(texture instanceof ImageData){
            // Accepts texture as image
            this.texture = (uv) => { return imageTexture(texture, uv); }
        }
        else{
            // Accepts texture as single color
            this.texture = () => { return glMatrix.vec3.clone(texture); };
        }
    }

    // Won't reflect at all
    scatter(ray, p, n){ return null; }
}

class Lambertian extends Material{
    constructor(texture){
        super(texture);
    }

    scatter(ray, p, n){
        let dir = randomPointOnUnitSphere();
        glMatrix.vec3.add(dir, dir, n);
        glMatrix.vec3.normalize(dir, dir);

        // Cover degenerate case
        if(nearZero(dir)){ dir = n; }

        let r = new Ray(p, dir);
        return new RayScatter(r, this.texture(p, n));
    }
}

class Metal extends Material{
    constructor(texture, fuzz){
        super(texture);
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
        return new RayScatter(r, this.texture(p, n));
    }
}

class Dielectric extends Material{
    constructor(texture, index_of_refraction){
        super(texture);
        this.eta = index_of_refraction;
    }

    scatter(ray, p , n){
        let nvec = glMatrix.vec3.create();
        glMatrix.vec3.scale(nvec, ray.dir, -1);

        let cosTheta = glMatrix.vec3.dot(nvec, n);
        let sinTheta = Math.sqrt(1 - cosTheta * cosTheta);

        // Determine travel direction for Snell's Law (air has eta = 1)
        let etaRatio = glMatrix.vec3.dot(ray.dir, n) > 0 
                ? this.eta : 1/this.eta;

        let dir;

        // Reflect if we must, or with some probability
        if(etaRatio * sinTheta > 1 || this.reflectance(cosTheta, etaRatio) > Math.random()){
            dir = reflect(ray.dir, n);
        }
        else{
            // Otherwise refract
            dir = refract(ray.dir, n, etaRatio);
        }

        let r = new Ray(p, dir);
        return new RayScatter(r, this.texture(p, n));
    }

    reflectance(cosine, etaRatio){
        // Schlick's approximation for reflectance at varying angles
        let r = (1 - etaRatio) / (1 + etaRatio);
        r = r*r;
        return r + (1 - r)*Math.pow(1-cosine, 5);
    }
}