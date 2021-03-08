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

class Triangle extends Intersectible{
    constructor(a, b, c, material){
        super(material);

        this.a = glMatrix.vec3.clone(a);
        this.b = glMatrix.vec3.clone(b);
        this.c = glMatrix.vec3.clone(c);
    }

    intersectionSource(){
        let objConstructor = `Triangle(${asVec3(this.a)}, ${asVec3(this.b)}, ${asVec3(this.c)})`;
        return `triangleIntersection(current.intersect, ${objConstructor}, ray, tmin, tmax)`
    }
}

class TriangleMesh extends Intersectible{
    constructor(stl, material){
        super(material);

        this.stl = stl;
        this.triangles = [];
    }

    init(){
        return new Promise( (resolve, reject) => {
            this.load()
            .then( (geometry) => {
                let mesh = new THREE.Mesh(geometry);

                // Translate and rotate mesh with THREE.js

                let vertices = mesh.geometry.getAttribute('position').array;

                for(let i = 0; i < vertices.length; i+=9){
                    let a = glMatrix.vec3.fromValues(vertices[i  ], vertices[i+1], vertices[i+2]);
                    let b = glMatrix.vec3.fromValues(vertices[i+3], vertices[i+4], vertices[i+5]);
                    let c = glMatrix.vec3.fromValues(vertices[i+6], vertices[i+7], vertices[i+8]);

                    glMatrix.vec3.scale(a, a, 0.05);
                    glMatrix.vec3.scale(b, b, 0.05);
                    glMatrix.vec3.scale(c, c, 0.05);

                    this.triangles.push(new Triangle(a, b, c, this.material));
                }

                resolve();
            })
            .catch(reject);
        });
    }

    load(){
        return new Promise( (resolve, reject) => {
            let loader = new THREE.STLLoader();
            loader.load(this.stl, resolve);
        });
    }
}