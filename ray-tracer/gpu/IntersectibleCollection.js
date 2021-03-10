class IntersectibleCollection{
    constructor(material){
        this.material = material;
    }
}

class STLMesh extends IntersectibleCollection{
    constructor(filePath, matrix, material){
        super(material);

        this.stl = filePath;
        this.matrix = matrix;
        this.triangles = [];
    }

    init(){
        return new Promise( (resolve, reject) => {
            this.load()
            .then( (geometry) => {
                let vertices = geometry.getAttribute('position').array;

                for(let i = 0; i < vertices.length; i+=9){
                    let a = glMatrix.vec3.fromValues(vertices[i  ], vertices[i+1], vertices[i+2]);
                    let b = glMatrix.vec3.fromValues(vertices[i+3], vertices[i+4], vertices[i+5]);
                    let c = glMatrix.vec3.fromValues(vertices[i+6], vertices[i+7], vertices[i+8]);

                    glMatrix.vec3.transformMat4(a, a, this.matrix);
                    glMatrix.vec3.transformMat4(b, b, this.matrix);
                    glMatrix.vec3.transformMat4(c, c, this.matrix);

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