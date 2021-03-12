class BVH{
    constructor(objects){
        this.objects = objects;

        this.groupSize = 8;

        // Array-representation of the BVH tree
        this.depth = Math.ceil(Math.log2(this.objects.length / this.groupSize));
        this.nodes = 2*Math.pow(2, this.depth) - 1;
        this.fieldLength = 4; // Vec4s
        this.treeFields = 2;
        this.treeData = Float32Array.from({length: this.nodes * this.fieldLength * this.treeFields}, () => -1);
        
        // Texture for object data
        this.objFields = 5;
        this.objData = []; // objects.length x objFields texture
        for(let i = 0; i < this.objFields; i++){
            for(let j = 0; j < this.objects.length; j++){
                let data = this.objects[j].getBVHData(); // Is 2D array
                this.objData.push(...data[i]);
            }
        }
        this.objData = new Float32Array(this.objData);

        // Store original indicies because build will sort
        let tmpObjects = [];
        for(let i = 0; i < this.objects.length; i++){
            tmpObjects.push({obj: this.objects[i], idx: i});
        }
        
        this.build(tmpObjects, 0);
    }

    getLeft(i){
        return 2*i + this.fieldLength;
    }

    getRight(i){
        return 2*i + 2*this.fieldLength;
    }

    getParent(i){
        return Math.floor((i - this.fieldLength) / 2);
    }

    /**
     * Builds the BVH using Pete Shirley's strategy from
     * https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies
     */
    build(objects, i){
        if(objects.length <= this.groupSize){
            // For small groups of objects make leaf node point to objData index
            let treeData = Float32Array.from({length: this.groupSize}, () => -1);
            for(let i = 0; i < objects.length; i++){
                treeData[i] = objects[i].idx;
            }
            this.__setTreeData(treeData, i);
        }
        else{
            // For lists of objects, split in half and keep building tree

            // Find bounding box for the collection and put it in tree
            let box = BoundingBox.bound(objects.map((pair) => pair.obj));
            this.__setTreeData(box.getBVHData(), i);

            // Pick random dimension
            let dim = Math.floor(Math.random() * 1000) % 3;

            // Sort objects by bounding box center (fake centroid) in this dimension
            objects.sort((a, b) => {
                let ac = glMatrix.vec3.create();
                let ab = a.obj.getBoundingBox();
                glMatrix.vec3.add(ac, ab.start, ab.end);
                glMatrix.vec3.scale(ac, ac, 0.5);

                let bc = glMatrix.vec3.create();
                let bb = b.obj.getBoundingBox();
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

    __setTreeData(data, i){
        for(let j = 0; j < this.treeFields; j++){
            for(let k = 0; k < this.fieldLength; k++){
                this.treeData[this.nodes * this.fieldLength * j + i + k] = data[j * this.fieldLength + k];
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
        return new Float32Array([-1, ...this.start, -1, ...this.end]);
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