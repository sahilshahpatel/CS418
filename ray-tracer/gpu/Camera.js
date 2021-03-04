class Camera{
    constructor(pos, lookAt, up, fov, aperture){
        this.pos = glMatrix.vec3.clone(pos);
        this.lookAt = glMatrix.vec3.clone(lookAt);

        this.aperture = aperture;
        this.fov = fov;

        this.dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(this.dir, lookAt, pos);
        let fl = glMatrix.vec3.length(this.dir);
        glMatrix.vec3.normalize(this.dir, this.dir);

        this.up = glMatrix.vec3.clone(up);
        this.resetBasis();
    }

    resetBasis(){
        // Basis vectors will be scaled according to aspect ratio and FOV
        let dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(dir, this.lookAt, this.pos);
        let fl = glMatrix.vec3.length(dir);
        const height = 2 * fl * Math.tan(this.fov / 2);
        const width = gl.viewportWidth / gl.viewportHeight * height;

        glMatrix.vec3.normalize(this.up, this.up);

        this.right = glMatrix.vec3.create();
        glMatrix.vec3.cross(this.right, this.dir, this.up);
        glMatrix.vec3.scale(this.right, this.right, width);

        glMatrix.vec3.scale(this.up, this.up, height);
    }

    setFocalLength(fl){
        let lookAt = glMatrix.vec3.create();
        glMatrix.vec3.sub(lookAt, this.lookAt, this.pos);
        glMatrix.vec3.normalize(lookAt, lookAt);
        glMatrix.vec3.scale(lookAt, lookAt, fl);
        glMatrix.vec3.add(this.lookAt, lookAt, this.pos);

        this.resetBasis();
    }
}