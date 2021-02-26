class Ray{
    constructor(origin, dir){
        this.origin = glMatrix.vec3.clone(origin);
        this.dir = glMatrix.vec3.create();
        glMatrix.vec3.normalize(this.dir, dir);
    }

    /**
     * Returns the ray position at time t
     * @param {Number} t 
     */
    at(t){
        let pos = glMatrix.vec3.clone(this.dir);
        glMatrix.vec3.scale(pos, pos, t);
        glMatrix.vec3.add(pos, pos, this.origin);
        return pos;
    }
}