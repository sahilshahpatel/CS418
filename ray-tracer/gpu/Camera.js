class Camera{
    constructor(pos, lookAt, up, fov, aperture, imgWidth, imgHeight){
        this.pos = glMatrix.vec3.clone(pos);

        this.lookAt = glMatrix.vec3.clone(lookAt);

        this.dir = glMatrix.vec3.create();
        glMatrix.vec3.sub(this.dir, lookAt, pos);
        let focalLength = glMatrix.vec3.length(this.dir);
        glMatrix.vec3.normalize(this.dir, this.dir);

        this.aperture = aperture;

        // Basis vectors will be scaled according to aspect ratio and FOV
        const height = 2 * focalLength * Math.tan(fov / 2);
        const width = imgWidth / imgHeight * height;

        this.up = glMatrix.vec3.create();
        glMatrix.vec3.normalize(this.up, up);

        this.right = glMatrix.vec3.create();
        glMatrix.vec3.cross(this.right, this.dir, this.up);
        glMatrix.vec3.scale(this.right, this.right, width);

        glMatrix.vec3.scale(this.up, this.up, height);
    }
}