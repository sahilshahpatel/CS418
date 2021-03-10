class BVH{
    constructor(objects){
        this.objects = objects;

        // Array-representation of the BVH tree
        this.nodes = objects.length == 1 ? 1 : Math.pow(2, Math.ceil(Math.log2(objects.length)) + 1);
        this.nodeLength = 4; // Vec4s
        this.fields =  5;
        this.data = Float32Array.from({length: this.nodes * this.nodeLength * this.fields}, (v, i) => 0.0);

        this.build(this.objects, 0);
    }

    static test(n = 10){
        // Create spheres
        let objects = [];
        let center = glMatrix.vec3.create();
        for(let i = 0; i < n; i++){
            objects.push(new Sphere(glMatrix.vec3.random(center, i), n - i, null));
        }

        return new BVH(objects);
    }

    getLeft(i){
        return 2*i + this.nodeLength;
    }

    getRight(i){
        return 2*i + 2*this.nodeLength;
    }

    getParent(i){
        return Math.floor((i - this.nodeLength) / 2);
    }

    /**
     * Builds the BVH using Pete Shirley's strategy from
     * https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies
     */
    build(objects, i){
        if(objects.length == 1){
            // For single objects, copy in their data
            let data = objects[0].getBVHData();
            this.__setData(data, i);
        }
        else{
            // For lists of objects, split in half and keep building tree

            // Find bounding box for the collection and put it in tree
            let box = BoundingBox.bound(objects);
            this.__setData(box.getBVHData(), i);

            // Pick random dimension
            let dim = Math.floor(Math.random() * 1000) % 3;

            // Sort objects by bounding box center (fake centroid) in this dimension
            objects.sort((a, b) => {
                let ac = glMatrix.vec3.create();
                let ab = a.getBoundingBox();
                glMatrix.vec3.add(ac, ab.start, ab.end);
                glMatrix.vec3.scale(ac, ac, 0.5);

                let bc = glMatrix.vec3.create();
                let bb = b.getBoundingBox();
                glMatrix.vec3.add(bc, bb.start, bb.end);
                glMatrix.vec3.scale(bc, bc, 0.5);
                
                return ac[dim] - bc[dim];
            });

            // Put half of objects in each subtree
            let p = Math.floor(objects.length / 2);
            this.build(objects.slice(0, p), this.getLeft(i));
            this.build(objects.slice(p   ), this.getRight(i));
        }
    }

    __setData(data, i){
        for(let j = 0; j < this.fields; j++){
            for(let k = 0; k < this.nodeLength; k++){
                this.data[this.nodes * this.nodeLength * j + i + k] = data[j][k];
            }
        }
    }
}

/**
 * Axis-aligned bounding box
 */
class BoundingBox {
    constructor(start, end){
        this.start = glMatrix.vec3.clone(start);
        this.end = glMatrix.vec3.clone(end);
    }

    getBVHData(){
        return [
            glMatrix.vec4.fromValues(...this.start, 0),
            glMatrix.vec4.fromValues(...this.end, 0), 
            glMatrix.vec4.create(),
            glMatrix.vec4.create(),
            glMatrix.vec4.create(),
        ];
    }

    /**
     * Returns a BoundingBox which bounds all given object's boxes
     * @param {List} objects 
     */
    static bound(objects){
        let start = glMatrix.vec3.clone(objects[0].getBoundingBox().start);
        let end = glMatrix.vec3.clone(objects[0].getBoundingBox().end);
        
        for(let b = 1; b < objects.length; b++){
            glMatrix.vec3.min(start, start, objects[b].getBoundingBox().start);
            glMatrix.vec3.max(end, end, objects[b].getBoundingBox().end);
        }

        return new BoundingBox(start, end);
    }
}