class Camera{
    constructor(zoom, fov, aperture, focalLength){
        this.zoom = zoom
        this.fov = fov;
        this.aperture = aperture;
        this.focalLength = focalLength;
        
        this.orientation = glMatrix.quat.create();
    }

    get INIT_DIR() {
        return glMatrix.vec3.fromValues(0, 0, -1);
    }

    get INIT_UP() {
        return glMatrix.vec3.fromValues(0, 1, 0);
    }

    get up(){
        // Basis vectors will be scaled according to aspect ratio and FOV
        const height = 2 * this.focalLength * Math.tan(this.fov / 2);

        let up = glMatrix.vec3.clone(this.INIT_UP);
        glMatrix.vec3.transformQuat(up, up, this.orientation);
        glMatrix.vec3.scale(up, up, height);
        return up;
    }

    get dir(){
        let dir = glMatrix.vec3.clone(this.INIT_DIR);
        glMatrix.vec3.transformQuat(dir, dir, this.orientation);
        return dir;
    }

    get right(){
        // Basis vectors will be scaled according to aspect ratio and FOV
        const height = 2 * this.focalLength * Math.tan(this.fov / 2);
        const width = gl.viewportWidth / gl.viewportHeight * height;

        let right = glMatrix.vec3.create();
        glMatrix.vec3.cross(right, this.INIT_DIR, this.INIT_UP);
        glMatrix.vec3.transformQuat(right, right, this.orientation);
        glMatrix.vec3.scale(right, right, width);

        return right;
    }

    get lookAt(){
        let lookAt = this.dir;
        glMatrix.vec3.scale(lookAt, lookAt, -(this.zoom - this.focalLength));

        return lookAt;
    }

    get pos(){
        let pos = this.dir;
        glMatrix.vec3.scale(pos, pos, -this.zoom);
        return pos;
    }
}